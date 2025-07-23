import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import useSafeStore from '@/hooks/useSafeStore';
import { useTranslation } from '@/hooks/useTranslation';
import { UserCog, Users } from 'lucide-react';
import { useEffect } from 'react';

export default function RoleSelect() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const setAuth = useSafeStore(useAuthStore, (state) => state.setAuth);

  useEffect(() => {
    // Check if we have temporary auth data
    const accessToken = sessionStorage.getItem('temp_access_token');
    const refreshToken = sessionStorage.getItem('temp_refresh_token');
    const userStr = sessionStorage.getItem('temp_user');

    if (!accessToken || !refreshToken || !userStr) {
      navigate('/login');
    }
  }, [navigate]);

  const handleRoleSelect = (role: 'admin' | 'user') => {
    const accessToken = sessionStorage.getItem('temp_access_token');
    const refreshToken = sessionStorage.getItem('temp_refresh_token');
    const userStr = sessionStorage.getItem('temp_user');

    if (accessToken && refreshToken && userStr) {
      const user = JSON.parse(userStr);
      
      // Clear temporary storage
      sessionStorage.removeItem('temp_access_token');
      sessionStorage.removeItem('temp_refresh_token');
      sessionStorage.removeItem('temp_user');

      // Set auth with selected role view
      setAuth?.(user, accessToken, refreshToken);

      // Navigate based on role selection
      if (role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 flex items-center justify-center p-4">
      <div className="bg-white/10 dark:bg-gray-900/40 backdrop-blur-sm border border-white/20 dark:border-gray-700/30 rounded-2xl shadow-2xl max-w-2xl w-full p-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-2">
          {t('역할 선택', 'Role Selection', '役割選択')}
        </h1>
        <p className="text-gray-600 dark:text-gray-300 text-center mb-8">
          {t('어떤 모드로 접속하시겠습니까?', 'Which mode would you like to access?', 'どのモードでアクセスしますか？')}
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Admin Mode */}
          <button
            onClick={() => handleRoleSelect('admin')}
            className="bg-white/20 dark:bg-gray-800/40 backdrop-blur-sm border border-white/30 dark:border-gray-600/30 rounded-xl p-6 text-center hover:scale-105 hover:bg-white/30 dark:hover:bg-gray-800/60 transition-all duration-300 group"
          >
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
              <UserCog className="w-10 h-10 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {t('관리자 모드', 'Admin Mode', '管理者モード')}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              {t('제출물 관리, 사용자 관리, 통계 확인', 'Manage submissions, users, and view statistics', '提出物管理、ユーザー管理、統計確認')}
            </p>
          </button>

          {/* User Mode */}
          <button
            onClick={() => handleRoleSelect('user')}
            className="bg-white/20 dark:bg-gray-800/40 backdrop-blur-sm border border-white/30 dark:border-gray-600/30 rounded-xl p-6 text-center hover:scale-105 hover:bg-white/30 dark:hover:bg-gray-800/60 transition-all duration-300 group"
          >
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
              <Users className="w-10 h-10 text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {t('사용자 모드', 'User Mode', 'ユーザーモード')}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              {t('릴리즈 제출, 제출 내역 확인', 'Submit releases and view submission history', 'リリース提出、提出履歴確認')}
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}