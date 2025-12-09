import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import useSafeStore from '@/hooks/useSafeStore';
import { useTranslation } from '@/hooks/useTranslation';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setAuth = useSafeStore(useAuthStore, (state) => state.setAuth);
  const { t } = useTranslation();

  useEffect(() => {
    const handleAuth = async () => {
      const accessToken = searchParams.get('access_token');
      const refreshToken = searchParams.get('refresh_token');
      const profileComplete = searchParams.get('profile_complete') === 'true';

      if (!accessToken || !refreshToken) {
        toast.error(t('auth.loginFailed'));
        navigate('/login');
        return;
      }

      try {
        // Get user profile
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/auth/profile`, {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }

        const user = await response.json();

        // Get return URL from session storage
        const returnUrl = sessionStorage.getItem('returnUrl');
        sessionStorage.removeItem('returnUrl');

        // Check if user is admin and show role selection
        if (user.role === 'ADMIN' && profileComplete) {
          // Store tokens temporarily for role selection
          sessionStorage.setItem('temp_access_token', accessToken);
          sessionStorage.setItem('temp_refresh_token', refreshToken);
          sessionStorage.setItem('temp_user', JSON.stringify(user));
          navigate('/role-select');
        } else {
          // Set auth in store for non-admin users or when profile setup is needed
          setAuth?.(user, accessToken, refreshToken);

          if (!profileComplete) {
            navigate('/profile-setup');
          } else {
            navigate(returnUrl || '/dashboard');
          }
        }

        toast.success(t('auth.loginSuccess'));
      } catch (error) {
        console.error('Auth error:', error);
        toast.error(t('auth.loginProcessError'));
        navigate('/login');
      }
    };

    handleAuth();
  }, [searchParams, navigate, setAuth, t]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900 flex items-center justify-center">
      <div className="card-glass p-8 flex items-center gap-4 animate-scale-in">
        <LoadingSpinner />
        <span className="text-gray-600 dark:text-gray-400 font-medium">{t('auth.signingInProgress')}</span>
      </div>
    </div>
  );
}
