import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Building, Phone, ArrowRight, Sparkles } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuthStore } from '@/store/auth.store';
import useSafeStore from '@/hooks/useSafeStore';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/common/LoadingSpinner';

const profileSchema = z.object({
  company: z.string().min(2, '회사명은 2자 이상 입력해주세요'),
  phone: z.string().min(10, '올바른 전화번호를 입력해주세요').max(20, '전화번호가 너무 깁니다')
});

type ProfileFormData = z.infer<typeof profileSchema>;

const ProfileSetup = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const user = useSafeStore(useAuthStore, (state) => state.user);
  const accessToken = useSafeStore(useAuthStore, (state) => state.accessToken);
  const updateUser = useSafeStore(useAuthStore, (state) => state.updateUser);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid }
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    mode: 'onChange'
  });

  const onSubmit = async (data: ProfileFormData) => {
    if (!user || !accessToken) {
      toast.error(t('auth.loginRequired', '로그인이 필요합니다'));
      navigate('/login');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const updatedUser = await response.json();
      updateUser?.(updatedUser);

      toast.success(t('profile.setupComplete', '프로필 설정이 완료되었습니다!'));
      navigate('/profile-complete');
    } catch (error) {
      console.error('Profile setup error:', error);
      toast.error(t('profile.setupFailed', '프로필 설정에 실패했습니다. 다시 시도해주세요.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-60 h-60 sm:w-80 sm:h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-60 h-60 sm:w-80 sm:h-80 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 sm:w-80 sm:h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="w-full max-w-md animate-scale-in">
        <div className="glass-effect-strong rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-xl">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white leading-tight">
              {t('profile.setupTitle', '프로필 설정을 완료하세요')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm sm:text-base">
              {t('profile.setupSubtitle', '서비스 이용을 위해 추가 정보를 입력해주세요')}
            </p>
          </div>

          {/* User Info */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">{user?.name}</p>
                <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
            {/* Company Field */}
            <div>
              <label htmlFor="company" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  {t('profile.company', '회사명')}
                </div>
              </label>
              <input
                id="company"
                type="text"
                {...register('company')}
                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm sm:text-base"
                placeholder={t('profile.companyPlaceholder', '소속 회사 또는 레이블명을 입력하세요')}
              />
              {errors.company && (
                <p className="mt-1 text-xs sm:text-sm text-red-600 dark:text-red-400">
                  {errors.company.message}
                </p>
              )}
            </div>

            {/* Phone Field */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  {t('profile.phone', '전화번호')}
                </div>
              </label>
              <input
                id="phone"
                type="tel"
                {...register('phone')}
                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm sm:text-base"
                placeholder={t('profile.phonePlaceholder', '010-1234-5678')}
              />
              {errors.phone && (
                <p className="mt-1 text-xs sm:text-sm text-red-600 dark:text-red-400">
                  {errors.phone.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!isValid || isLoading}
              className="w-full flex items-center justify-center gap-3 py-3 sm:py-4 px-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium rounded-lg transition-all duration-300 transform hover:scale-[1.02] disabled:scale-100 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" />
                  {t('profile.completing', '설정 중...')}
                </>
              ) : (
                <>
                  {t('profile.complete', '프로필 설정 완료')}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Help Text */}
          <div className="mt-4 text-center">
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              {t('profile.helpText', '이 정보는 계정 관리 및 지원을 위해 사용됩니다')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetup;
