import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, User, Mail, Lock, Eye, EyeOff, Check, Phone, ArrowRight, Music } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';

export default function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [accountType, setAccountType] = useState<'company' | 'artist' | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    company: '',
    agreeToTerms: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.agreeToTerms) {
      toast.error(t('이용약관에 동의해주세요.', 'Please agree to the terms of service', '利用規約に同意してください'));
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error(t('비밀번호가 일치하지 않습니다.', 'Passwords do not match', 'パスワードが一致しません'));
      return;
    }

    if (formData.password.length < 8) {
      toast.error(t('비밀번호는 8자 이상이어야 합니다.', 'Password must be at least 8 characters', 'パスワードは8文字以上である必要があります'));
      return;
    }

    setLoading(true);

    try {
      const registerData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        isCompanyAccount: accountType === 'company',
        company: accountType === 'company' ? formData.company : undefined
      };

      const response = await authService.register(registerData);
      
      if (response.access_token) {
        setAuth(response.user, response.access_token);
        toast.success(t('회원가입이 완료되었습니다!', 'Registration successful!', '登録が完了しました！'));
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      const message = error.response?.data?.message || error.message;
      if (message?.includes('already exists')) {
        toast.error(t('이미 사용중인 이메일입니다.', 'Email already in use', 'このメールアドレスは既に使用されています'));
      } else {
        toast.error(t('회원가입 중 오류가 발생했습니다.', 'Registration failed. Please try again.', '登録中にエラーが発生しました'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="w-full max-w-5xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <img 
              src="/assets/logos/n3rve-logo.svg" 
              alt="N3RVE" 
              className="h-12 mx-auto dark:hidden"
            />
            <img 
              src="/assets/logos/n3rve-logo-white.svg" 
              alt="N3RVE" 
              className="h-12 mx-auto hidden dark:block"
            />
          </Link>
        </div>

        {/* Account Type Selection */}
        {!accountType ? (
          <div className="glass-effect rounded-2xl p-8 animate-fade-in">
            <h1 className="text-3xl font-bold text-center mb-8 gradient-text">
              {t('계정 유형 선택', 'Choose Account Type', 'アカウントタイプを選択')}
            </h1>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Company/Label Account */}
              <button
                onClick={() => setAccountType('company')}
                className="group relative p-8 bg-white dark:bg-gray-800/50 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-purple-500 dark:hover:border-purple-400 transition-all hover-lift hover:shadow-xl"
              >
                <div className="absolute top-4 right-4">
                  <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Building2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 text-left">
                  {t('회사/레이블 계정', 'Company/Label Account', '会社/レーベルアカウント')}
                </h3>
                
                <p className="text-gray-600 dark:text-gray-400 text-sm text-left mb-4">
                  {t(
                    '여러 아티스트를 관리하고 하위 계정을 생성할 수 있습니다.',
                    'Manage multiple artists and create sub-accounts.',
                    '複数のアーティストを管理し、サブアカウントを作成できます。'
                  )}
                </p>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>{t('하위 계정 생성', 'Create sub-accounts', 'サブアカウント作成')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>{t('다중 아티스트 관리', 'Manage multiple artists', '複数アーティスト管理')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>{t('팀 협업 기능', 'Team collaboration', 'チームコラボレーション')}</span>
                  </div>
                </div>
                
                <div className="absolute bottom-4 right-4">
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />
                </div>
              </button>

              {/* Individual Artist Account */}
              <button
                onClick={() => setAccountType('artist')}
                className="group relative p-8 bg-white dark:bg-gray-800/50 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 transition-all hover-lift hover:shadow-xl"
              >
                <div className="absolute top-4 right-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Music className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 text-left">
                  {t('개인 아티스트 계정', 'Individual Artist Account', '個人アーティストアカウント')}
                </h3>
                
                <p className="text-gray-600 dark:text-gray-400 text-sm text-left mb-4">
                  {t(
                    '개인 아티스트로서 음원을 직접 등록하고 관리합니다.',
                    'Register and manage your music as an individual artist.',
                    '個人アーティストとして音源を直接登録・管理します。'
                  )}
                </p>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>{t('직접 음원 등록', 'Direct music submission', '直接音源登録')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>{t('개인 프로필 관리', 'Personal profile management', '個人プロフィール管理')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>{t('빠른 시작', 'Quick start', 'クイックスタート')}</span>
                  </div>
                </div>
                
                <div className="absolute bottom-4 right-4">
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                </div>
              </button>
            </div>

            <div className="mt-8 text-center">
              <p className="text-gray-600 dark:text-gray-400">
                {t('이미 계정이 있으신가요?', 'Already have an account?', 'すでにアカウントをお持ちですか？')}
                <Link to="/login" className="ml-2 text-purple-600 dark:text-purple-400 hover:underline font-medium">
                  {t('로그인', 'Sign in', 'ログイン')}
                </Link>
              </p>
            </div>
          </div>
        ) : (
          /* Registration Form */
          <div className="glass-effect rounded-2xl p-8 animate-fade-in">
            <button
              onClick={() => setAccountType(null)}
              className="mb-6 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-2"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
              {t('뒤로 가기', 'Go back', '戻る')}
            </button>

            <h1 className="text-3xl font-bold mb-8 gradient-text">
              {accountType === 'company' 
                ? t('회사/레이블 계정 등록', 'Company/Label Registration', '会社/レーベル登録')
                : t('아티스트 계정 등록', 'Artist Registration', 'アーティスト登録')
              }
            </h1>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {accountType === 'company' 
                      ? t('담당자 이름', 'Contact Name', '担当者名')
                      : t('아티스트명', 'Artist Name', 'アーティスト名')
                    }
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="glass-input pl-10"
                      placeholder={accountType === 'company' 
                        ? t('담당자 이름을 입력하세요', 'Enter contact name', '担当者名を入力してください')
                        : t('아티스트명을 입력하세요', 'Enter artist name', 'アーティスト名を入力してください')
                      }
                      required
                    />
                  </div>
                </div>

                {/* Company Name (only for company accounts) */}
                {accountType === 'company' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('회사/레이블명', 'Company/Label Name', '会社/レーベル名')}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Building2 className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        className="glass-input pl-10"
                        placeholder={t('회사/레이블명을 입력하세요', 'Enter company/label name', '会社/レーベル名を入力してください')}
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('이메일', 'Email', 'メール')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="glass-input pl-10"
                      placeholder={t('이메일을 입력하세요', 'Enter your email', 'メールアドレスを入力してください')}
                      required
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('전화번호', 'Phone Number', '電話番号')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="glass-input pl-10"
                      placeholder={t('전화번호를 입력하세요', 'Enter phone number', '電話番号を入力してください')}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('비밀번호', 'Password', 'パスワード')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="glass-input pl-10 pr-10"
                      placeholder={t('비밀번호를 입력하세요', 'Enter your password', 'パスワードを入力してください')}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {t('8자 이상 입력하세요', 'At least 8 characters', '8文字以上入力してください')}
                  </p>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('비밀번호 확인', 'Confirm Password', 'パスワード確認')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="glass-input pl-10"
                      placeholder={t('비밀번호를 다시 입력하세요', 'Confirm your password', 'パスワードを再入力してください')}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Terms Agreement */}
              <div className="flex items-start">
                <input
                  id="terms"
                  type="checkbox"
                  checked={formData.agreeToTerms}
                  onChange={(e) => setFormData({ ...formData, agreeToTerms: e.target.checked })}
                  className="mt-1 h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <label htmlFor="terms" className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                  {t(
                    '이용약관 및 개인정보처리방침에 동의합니다.',
                    'I agree to the Terms of Service and Privacy Policy.',
                    '利用規約およびプライバシーポリシーに同意します。'
                  )}
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !formData.agreeToTerms}
                className="w-full btn-modern btn-primary py-3 font-medium disabled:opacity-50 disabled:cursor-not-allowed hover-lift"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></span>
                    {t('처리 중...', 'Processing...', '処理中...')}
                  </span>
                ) : (
                  t('회원가입', 'Sign Up', '登録')
                )}
              </button>

              {/* Sign In Link */}
              <div className="text-center">
                <p className="text-gray-600 dark:text-gray-400">
                  {t('이미 계정이 있으신가요?', 'Already have an account?', 'すでにアカウントをお持ちですか？')}
                  <Link to="/login" className="ml-2 text-purple-600 dark:text-purple-400 hover:underline font-medium">
                    {t('로그인', 'Sign in', 'ログイン')}
                  </Link>
                </p>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}