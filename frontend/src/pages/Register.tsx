import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, User, Mail, Lock, EyeOff, Phone, Music, Shield, Users, Sparkles, AlertCircle, Globe, Headphones, TrendingUp, Briefcase } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';
import { logger } from '@/utils/logger';

export default function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [accountType, setAccountType] = useState<'company' | 'artist' | null>(null);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [formProgress, setFormProgress] = useState(0);
  const [showPasswordTooltip, setShowPasswordTooltip] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    company: '',
    agreeToTerms: false
  });

  const [fieldErrors, setFieldErrors] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    phone: ''
  });

  const [fieldValid, setFieldValid] = useState({
    name: false,
    email: false,
    password: false,
    confirmPassword: false,
    phone: true, // Optional field
    company: false
  });

  // Calculate form progress
  useEffect(() => {
    const requiredFields = accountType === 'company'
      ? ['name', 'email', 'password', 'confirmPassword', 'company']
      : ['name', 'email', 'password', 'confirmPassword'];

    const filledFields = requiredFields.filter(field => {
      if (field === 'confirmPassword') {
        return formData.confirmPassword && formData.confirmPassword === formData.password;
      }
      return formData[field as keyof typeof formData];
    });

    const progress = (filledFields.length / requiredFields.length) * 100;
    setFormProgress(progress);
  }, [formData, accountType]);

  // Password strength calculation
  useEffect(() => {
    const password = formData.password;
    let strength = 0;

    if (password.length >= 8) strength += 20;
    if (password.length >= 12) strength += 20;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 20;
    if (/\d/.test(password)) strength += 20;
    if (/[^a-zA-Z\d]/.test(password)) strength += 20;

    setPasswordStrength(strength);
    setFieldValid(prev => ({ ...prev, password: strength >= 60 }));
  }, [formData.password]);

  // Real-time validation
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setFieldErrors(prev => ({ ...prev, email: '' }));
      setFieldValid(prev => ({ ...prev, email: false }));
    } else if (!emailRegex.test(email)) {
      setFieldErrors(prev => ({ ...prev, email: t('올바른 이메일 형식이 아닙니다', 'Invalid email format', '無効なメール形式です') }));
      setFieldValid(prev => ({ ...prev, email: false }));
    } else {
      setFieldErrors(prev => ({ ...prev, email: '' }));
      setFieldValid(prev => ({ ...prev, email: true }));
    }
  };

  const validatePhone = (phone: string) => {
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    if (phone && !phoneRegex.test(phone)) {
      setFieldErrors(prev => ({ ...prev, phone: t('올바른 전화번호 형식이 아닙니다', 'Invalid phone number format', '無効な電話番号形式です') }));
    } else {
      setFieldErrors(prev => ({ ...prev, phone: '' }));
    }
  };

  // Stub for validateField - can be implemented if needed
  const validateField = (field: string, value: string) => {
    // Currently using individual validation functions
    if (field === 'email') {
      validateEmail(value);
    } else if (field === 'phone') {
      validatePhone(value);
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 20) return 'from-red-500 to-red-600';
    if (passwordStrength <= 40) return 'from-orange-500 to-orange-600';
    if (passwordStrength <= 60) return 'from-yellow-500 to-yellow-600';
    if (passwordStrength <= 80) return 'from-green-500 to-green-600';
    return 'from-emerald-500 to-green-600';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength <= 20) return t('매우 약함', 'Very Weak', 'とても弱い');
    if (passwordStrength <= 40) return t('약함', 'Weak', '弱い');
    if (passwordStrength <= 60) return t('보통', 'Fair', '普通');
    if (passwordStrength <= 80) return t('강함', 'Good', '強い');
    return t('매우 강함', 'Excellent', '優秀');
  };

  const passwordRequirements = [
    { met: formData.password.length >= 8, text: t('8자 이상', '8+ characters', '8文字以上') },
    { met: /[a-z]/.test(formData.password) && /[A-Z]/.test(formData.password), text: t('대소문자 포함', 'Upper & lowercase', '大文字と小文字') },
    { met: /\d/.test(formData.password), text: t('숫자 포함', 'Numbers', '数字を含む') },
    { met: /[^a-zA-Z\d]/.test(formData.password), text: t('특수문자 포함', 'Special characters', '特殊文字') }
  ];

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
      logger.error('Registration error:', error);
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-pink-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Enhanced animated background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-blue-600 to-cyan-600 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-float-delayed"></div>
        <div className="absolute top-1/2 left-1/3 w-72 h-72 bg-gradient-to-bl from-pink-600 to-orange-600 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-float-slow"></div>

        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%239C92AC%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-30"></div>
      </div>

      <div className="w-full max-w-6xl relative z-10">
        {/* Enhanced Logo with glow effect */}
        <div className="text-center mb-12">
          <Link to="/" className="inline-flex items-center justify-center gap-4 group">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl blur-xl opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
              <div className="relative w-14 h-14 bg-gradient-to-br from-purple-600 via-pink-600 to-orange-600 rounded-2xl flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-all duration-300">
                <Music className="w-8 h-8 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-300 via-pink-300 to-blue-300 bg-clip-text text-transparent">
                N3RVE
              </h1>
              <p className="text-xs text-gray-400 font-medium tracking-wider uppercase mt-1">
                {t('음악 유통 플랫폼', 'Music Distribution', '音楽配信プラットフォーム')}
              </p>
            </div>
          </Link>
        </div>

        {/* Account Type Selection */}
        {!accountType ? (
          <div className="backdrop-blur-2xl bg-gray-900/40 border border-gray-800/50 rounded-3xl shadow-2xl p-8 md:p-12 animate-scale-in">
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-3xl mb-6">
                <Sparkles className="w-10 h-10 text-purple-400" />
              </div>
              <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                {t('환영합니다!', 'Welcome!', 'ようこそ！')}
              </h1>
              <p className="text-gray-300 text-xl">
                {t('N3RVE와 함께 음악 여정을 시작하세요', 'Start your music journey with N3RVE', 'N3RVEで音楽の旅を始めましょう')}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Company/Label Account */}
              <button
                onClick={() => setAccountType('company')}
                className="group relative p-8 rounded-3xl bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-800/30 backdrop-blur-xl transition-all duration-500 transform hover:scale-[1.02] hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(168,85,247,0.3)]"
              >
                {/* Glow effect */}
                <div className="absolute -inset-1 bg-gradient-to-br from-purple-600 to-pink-600 rounded-3xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500"></div>

                {/* Card content */}
                <div className="relative z-10">
                  {/* Icon with animation */}
                  <div className="relative mb-8">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-purple-800 rounded-3xl blur-2xl opacity-50 group-hover:opacity-70 transition-opacity duration-300"></div>
                    <div className="relative w-24 h-24 bg-gradient-to-br from-purple-600 to-purple-800 rounded-3xl flex items-center justify-center mx-auto shadow-2xl transform group-hover:rotate-3 group-hover:scale-110 transition-all duration-300">
                      <Building2 className="w-12 h-12 text-white group-hover:scale-110 transition-transform duration-300" />
                    </div>
                  </div>

                  <h3 className="text-3xl font-bold text-white mb-4 group-hover:text-purple-300 transition-colors duration-300">
                    {t('회사/레이블', 'Company/Label', '会社/レーベル')}
                  </h3>

                  <p className="text-gray-300 mb-8 leading-relaxed text-lg">
                    {t(
                      '여러 아티스트를 관리하고 팀과 협업하세요',
                      'Manage multiple artists and collaborate with your team',
                      '複数のアーティストを管理し、チームと協力'
                    )}
                  </p>

                  <div className="space-y-4 mb-8">
                    <div className="flex items-center gap-4 group/item">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover/item:scale-110 transition-transform duration-300">
                        <Users className="w-5 h-5 text-green-400" />
                      </div>
                      <span className="text-gray-200 group-hover/item:text-green-400 transition-colors duration-300">{t('팀 협업 및 권한 관리', 'Team collaboration & permissions', 'チーム協力と権限管理')}</span>
                    </div>
                    <div className="flex items-center gap-4 group/item">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover/item:scale-110 transition-transform duration-300">
                        <Shield className="w-5 h-5 text-blue-400" />
                      </div>
                      <span className="text-gray-200 group-hover/item:text-blue-400 transition-colors duration-300">{t('고급 보안 기능', 'Advanced security features', '高度なセキュリティ機能')}</span>
                    </div>
                    <div className="flex items-center gap-4 group/item">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover/item:scale-110 transition-transform duration-300">
                        <TrendingUp className="w-5 h-5 text-purple-400" />
                      </div>
                      <span className="text-gray-200 group-hover/item:text-purple-400 transition-colors duration-300">{t('대량 업로드 지원', 'Bulk upload support', '一括アップロード対応')}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">
                      {t('팀을 위한 최적의 선택', 'Best for teams', 'チームに最適')}
                    </span>
                    <div className="flex items-center gap-2 text-purple-400 font-semibold group-hover:gap-3 transition-all duration-300">
                      <span>{t('시작하기', 'Get Started', '開始する')}</span>
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </button>

              {/* Individual Artist Account */}
              <button
                onClick={() => setAccountType('artist')}
                className="group relative p-8 rounded-3xl bg-gradient-to-br from-blue-900/20 to-cyan-900/20 border border-blue-800/30 backdrop-blur-xl transition-all duration-500 transform hover:scale-[1.02] hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(59,130,246,0.3)]"
              >
                {/* Glow effect */}
                <div className="absolute -inset-1 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-3xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500"></div>

                {/* Card content */}
                <div className="relative z-10">
                  {/* Icon with animation */}
                  <div className="relative mb-8">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-3xl blur-2xl opacity-50 group-hover:opacity-70 transition-opacity duration-300"></div>
                    <div className="relative w-24 h-24 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl transform group-hover:-rotate-3 group-hover:scale-110 transition-all duration-300">
                      <Headphones className="w-12 h-12 text-white group-hover:scale-110 transition-transform duration-300" />
                    </div>
                  </div>

                  <h3 className="text-3xl font-bold text-white mb-4 group-hover:text-blue-300 transition-colors duration-300">
                    {t('개인 아티스트', 'Individual Artist', '個人アーティスト')}
                  </h3>

                  <p className="text-gray-300 mb-8 leading-relaxed text-lg">
                    {t(
                      '독립 아티스트로서 음악을 직접 관리하세요',
                      'Manage your music directly as an independent artist',
                      '独立アーティストとして音楽を直接管理'
                    )}
                  </p>

                  <div className="space-y-4 mb-8">
                    <div className="flex items-center gap-4 group/item">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover/item:scale-110 transition-transform duration-300">
                        <Zap className="w-5 h-5 text-green-400" />
                      </div>
                      <span className="text-gray-200 group-hover/item:text-green-400 transition-colors duration-300">{t('간편한 시작', 'Quick and easy start', '簡単スタート')}</span>
                    </div>
                    <div className="flex items-center gap-4 group/item">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover/item:scale-110 transition-transform duration-300">
                        <Music className="w-5 h-5 text-blue-400" />
                      </div>
                      <span className="text-gray-200 group-hover/item:text-blue-400 transition-colors duration-300">{t('직접 음원 관리', 'Direct music management', '直接音源管理')}</span>
                    </div>
                    <div className="flex items-center gap-4 group/item">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover/item:scale-110 transition-transform duration-300">
                        <Award className="w-5 h-5 text-purple-400" />
                      </div>
                      <span className="text-gray-200 group-hover/item:text-purple-400 transition-colors duration-300">{t('개인 프로필 설정', 'Personal profile setup', '個人プロフィール設定')}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">
                      {t('독립 아티스트에 최적', 'Best for independents', '独立アーティストに最適')}
                    </span>
                    <div className="flex items-center gap-2 text-blue-400 font-semibold group-hover:gap-3 transition-all duration-300">
                      <span>{t('시작하기', 'Get Started', '開始する')}</span>
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </button>
            </div>

            <div className="mt-12 text-center">
              <p className="text-gray-600 dark:text-gray-400">
                {t('이미 계정이 있으신가요?', 'Already have an account?', 'すでにアカウントをお持ちですか？')}
                <Link to="/login" className="ml-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium transition-colors">
                  {t('로그인', 'Sign in', 'ログイン')}
                </Link>
              </p>
            </div>
          </div>
        ) : (
          /* Registration Form */
          <div className="relative bg-gray-900/40 backdrop-blur-2xl rounded-3xl shadow-[0_0_50px_rgba(147,51,234,0.3)] border border-gray-800/50 p-8 md:p-12 animate-fade-in overflow-hidden">
            {/* Glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-3xl blur-2xl"></div>

            {/* Form content */}
            <div className="relative z-10">
              <button
                onClick={() => setAccountType(null)}
                className="mb-6 text-gray-400 hover:text-white transition-all duration-300 flex items-center gap-2 group"
              >
                <ArrowRight className="w-4 h-4 rotate-180 transform group-hover:-translate-x-1 transition-transform" />
                {t('뒤로 가기', 'Go back', '戻る')}
              </button>

              <div className="text-center mb-8">
                <div className={'relative mb-6 group'}>
                  <div className={`absolute inset-0 ${accountType === 'company' ? 'bg-gradient-to-br from-purple-600 to-pink-600' : 'bg-gradient-to-br from-blue-600 to-cyan-600'} rounded-3xl blur-2xl opacity-50 group-hover:opacity-70 transition-opacity duration-300`}></div>
                  <div className={`relative w-20 h-20 ${accountType === 'company' ? 'bg-gradient-to-br from-purple-600 to-pink-600' : 'bg-gradient-to-br from-blue-600 to-cyan-600'} rounded-3xl flex items-center justify-center mx-auto shadow-2xl transform group-hover:rotate-3 group-hover:scale-110 transition-all duration-300`}>
                    {accountType === 'company' ? <Building2 className="w-10 h-10 text-white" /> : <Music className="w-10 h-10 text-white" />}
                  </div>
                </div>

                <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                  {accountType === 'company'
                    ? t('회사/레이블 등록', 'Company/Label Registration', '会社/レーベル登録')
                    : t('아티스트 등록', 'Artist Registration', 'アーティスト登録')
                  }
                </h1>
                <p className="text-gray-300">
                  {t('정보를 입력하여 계정을 생성하세요', 'Enter your information to create an account', '情報を入力してアカウントを作成')}
                </p>

                {/* Progress bar */}
                <div className="mt-6 w-full max-w-xs mx-auto">
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-600 to-pink-600 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${formProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">{Math.round(formProgress)}% {t('완료', 'Complete', '完了')}</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} ref={formRef} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div className="relative group">
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value });
                        validateField('name', e.target.value);
                      }}
                      onFocus={() => setFocusedField('name')}
                      onBlur={() => setFocusedField(null)}
                      className="peer w-full px-5 pt-7 pb-3 bg-gray-800/50 border-2 border-gray-700/50 rounded-2xl focus:border-purple-500 focus:bg-gray-800/70 transition-all duration-300 outline-none text-white placeholder-transparent"
                      placeholder=" "
                      required
                    />
                    <label className={`absolute left-5 transition-all duration-300 pointer-events-none ${
                      formData.name || focusedField === 'name'
                        ? 'top-2.5 text-xs text-purple-400'
                        : 'top-5 text-sm text-gray-400'
                    }`}>
                      {accountType === 'company'
                        ? t('담당자 이름', 'Contact Name', '担当者名')
                        : t('아티스트명', 'Artist Name', 'アーティスト名')
                      }
                    </label>
                    <User className={`absolute right-5 top-5 w-5 h-5 transition-all duration-300 ${
                      focusedField === 'name' ? 'text-purple-400 scale-110' : 'text-gray-500'
                    }`} />
                    {fieldValid.name && formData.name && (
                      <Check className="absolute right-12 top-5 w-5 h-5 text-green-400 animate-scale-in" />
                    )}
                    {/* Field glow effect */}
                    <div className={`absolute inset-0 rounded-2xl bg-purple-500/20 blur-xl transition-opacity duration-300 ${
                      focusedField === 'name' ? 'opacity-100' : 'opacity-0'
                    }`}></div>
                  </div>

                  {/* Company Name (only for company accounts) */}
                  {accountType === 'company' && (
                    <div className="relative group">
                      <input
                        type="text"
                        value={formData.company}
                        onChange={(e) => {
                          setFormData({ ...formData, company: e.target.value });
                          validateField('company', e.target.value);
                        }}
                        onFocus={() => setFocusedField('company')}
                        onBlur={() => setFocusedField(null)}
                        className="peer w-full px-5 pt-7 pb-3 bg-gray-800/50 border-2 border-gray-700/50 rounded-2xl focus:border-purple-500 focus:bg-gray-800/70 transition-all duration-300 outline-none text-white placeholder-transparent"
                        placeholder=" "
                        required
                      />
                      <label className={`absolute left-5 transition-all duration-300 pointer-events-none ${
                        formData.company || focusedField === 'company'
                          ? 'top-2.5 text-xs text-purple-400'
                          : 'top-5 text-sm text-gray-400'
                      }`}>
                        {t('회사/레이블명', 'Company/Label Name', '会社/レーベル名')}
                      </label>
                      <Building2 className={`absolute right-5 top-5 w-5 h-5 transition-all duration-300 ${
                        focusedField === 'company' ? 'text-purple-400 scale-110' : 'text-gray-500'
                      }`} />
                      {fieldValid.company && formData.company && (
                        <Check className="absolute right-12 top-5 w-5 h-5 text-green-400 animate-scale-in" />
                      )}
                      {/* Field glow effect */}
                      <div className={`absolute inset-0 rounded-2xl bg-purple-500/20 blur-xl transition-opacity duration-300 ${
                        focusedField === 'company' ? 'opacity-100' : 'opacity-0'
                      }`}></div>
                    </div>
                  )}

                  {/* Email */}
                  <div className="relative group">
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value });
                        validateEmail(e.target.value);
                        validateField('email', e.target.value);
                      }}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                      className={`peer w-full px-5 pt-7 pb-3 bg-gray-800/50 border-2 ${
                        fieldErrors.email ? 'border-red-500/50' : 'border-gray-700/50'
                      } rounded-2xl focus:border-purple-500 focus:bg-gray-800/70 transition-all duration-300 outline-none text-white placeholder-transparent`}
                      placeholder=" "
                      required
                    />
                    <label className={`absolute left-5 transition-all duration-300 pointer-events-none ${
                      formData.email || focusedField === 'email'
                        ? 'top-2.5 text-xs text-purple-400'
                        : 'top-5 text-sm text-gray-400'
                    }`}>
                      {t('이메일', 'Email', 'メール')}
                    </label>
                    <Mail className={`absolute right-5 top-5 w-5 h-5 transition-all duration-300 ${
                      fieldErrors.email ? 'text-red-400' : focusedField === 'email' ? 'text-purple-400 scale-110' : 'text-gray-500'
                    }`} />
                    {fieldValid.email && formData.email && !fieldErrors.email && (
                      <Check className="absolute right-12 top-5 w-5 h-5 text-green-400 animate-scale-in" />
                    )}
                    {fieldErrors.email && (
                      <p className="absolute -bottom-6 left-0 text-xs text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {fieldErrors.email}
                      </p>
                    )}
                    {/* Field glow effect */}
                    <div className={`absolute inset-0 rounded-2xl ${fieldErrors.email ? 'bg-red-500/20' : 'bg-purple-500/20'} blur-xl transition-opacity duration-300 ${
                      focusedField === 'email' ? 'opacity-100' : 'opacity-0'
                    }`}></div>
                  </div>

                  {/* Phone */}
                  <div className="relative group">
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => {
                        setFormData({ ...formData, phone: e.target.value });
                        validatePhone(e.target.value);
                      }}
                      onFocus={() => setFocusedField('phone')}
                      onBlur={() => setFocusedField(null)}
                      className={`peer w-full px-5 pt-7 pb-3 bg-gray-800/50 border-2 ${
                        fieldErrors.phone ? 'border-red-500/50' : 'border-gray-700/50'
                      } rounded-2xl focus:border-purple-500 focus:bg-gray-800/70 transition-all duration-300 outline-none text-white placeholder-transparent`}
                      placeholder=" "
                    />
                    <label className={`absolute left-5 transition-all duration-300 pointer-events-none ${
                      formData.phone || focusedField === 'phone'
                        ? 'top-2.5 text-xs text-purple-400'
                        : 'top-5 text-sm text-gray-400'
                    }`}>
                      {t('전화번호 (선택)', 'Phone Number (Optional)', '電話番号（任意）')}
                    </label>
                    <Phone className={`absolute right-5 top-5 w-5 h-5 transition-all duration-300 ${
                      fieldErrors.phone ? 'text-red-400' : focusedField === 'phone' ? 'text-purple-400 scale-110' : 'text-gray-500'
                    }`} />
                    {fieldValid.phone && formData.phone && !fieldErrors.phone && (
                      <Check className="absolute right-12 top-5 w-5 h-5 text-green-400 animate-scale-in" />
                    )}
                    {fieldErrors.phone && (
                      <p className="absolute -bottom-6 left-0 text-xs text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {fieldErrors.phone}
                      </p>
                    )}
                    {/* Field glow effect */}
                    <div className={`absolute inset-0 rounded-2xl ${fieldErrors.phone ? 'bg-red-500/20' : 'bg-purple-500/20'} blur-xl transition-opacity duration-300 ${
                      focusedField === 'phone' ? 'opacity-100' : 'opacity-0'
                    }`}></div>
                  </div>

                  {/* Password */}
                  <div className="relative group">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => {
                        setFormData({ ...formData, password: e.target.value });
                        validateField('password', e.target.value);
                      }}
                      onFocus={() => {
                        setFocusedField('password');
                        setShowPasswordTooltip(true);
                      }}
                      onBlur={() => {
                        setFocusedField(null);
                        setShowPasswordTooltip(false);
                      }}
                      className="peer w-full px-5 pt-7 pb-3 bg-gray-800/50 border-2 border-gray-700/50 rounded-2xl focus:border-purple-500 focus:bg-gray-800/70 transition-all duration-300 outline-none text-white placeholder-transparent pr-20"
                      placeholder=" "
                      required
                    />
                    <label className={`absolute left-5 transition-all duration-300 pointer-events-none ${
                      formData.password || focusedField === 'password'
                        ? 'top-2.5 text-xs text-purple-400'
                        : 'top-5 text-sm text-gray-400'
                    }`}>
                      {t('비밀번호', 'Password', 'パスワード')}
                    </label>
                    <Lock className={`absolute right-16 top-5 w-5 h-5 transition-all duration-300 ${
                      focusedField === 'password' ? 'text-purple-400 scale-110' : 'text-gray-500'
                    }`} />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-5 top-5 text-gray-500 hover:text-purple-400 transition-all duration-300 hover:scale-110"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                    {fieldValid.password && formData.password && (
                      <Check className="absolute right-[5.5rem] top-5 w-5 h-5 text-green-400 animate-scale-in" />
                    )}
                    {/* Field glow effect */}
                    <div className={`absolute inset-0 rounded-2xl bg-purple-500/20 blur-xl transition-opacity duration-300 ${
                      focusedField === 'password' ? 'opacity-100' : 'opacity-0'
                    }`}></div>

                    {/* Password strength indicator */}
                    {formData.password && (
                      <div className="absolute -bottom-14 left-0 right-0">
                        <div className="mb-2">
                          <div className="flex gap-1">
                            {[20, 40, 60, 80, 100].map((segment, index) => (
                              <div
                                key={index}
                                className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${
                                  passwordStrength >= segment
                                    ? passwordStrength <= 40 ? 'bg-red-500' :
                                      passwordStrength <= 60 ? 'bg-orange-500' :
                                        passwordStrength <= 80 ? 'bg-yellow-500' : 'bg-green-500'
                                    : 'bg-gray-700'
                                }`}
                              />
                            ))}
                          </div>
                          <span className={`text-xs font-medium mt-1 block ${
                            passwordStrength <= 40 ? 'text-red-400' :
                              passwordStrength <= 60 ? 'text-orange-400' :
                                passwordStrength <= 80 ? 'text-yellow-400' :
                                  'text-green-400'
                          }`}>
                            {getPasswordStrengthText()}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Password requirements tooltip */}
                    {showPasswordTooltip && formData.password && (
                      <div className="absolute top-full mt-2 left-0 bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-xl z-20 animate-fade-in">
                        <div className="space-y-1">
                          {passwordRequirements.map((req, index) => (
                            <div key={index} className="flex items-center gap-2">
                              {req.met ? (
                                <Check className="w-3 h-3 text-green-400" />
                              ) : (
                                <X className="w-3 h-3 text-gray-500" />
                              )}
                              <span className={`text-xs ${req.met ? 'text-green-400' : 'text-gray-400'}`}>
                                {req.text}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="relative group">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => {
                        setFormData({ ...formData, confirmPassword: e.target.value });
                        if (e.target.value && e.target.value !== formData.password) {
                          setFieldErrors(prev => ({ ...prev, confirmPassword: t('비밀번호가 일치하지 않습니다', 'Passwords do not match', 'パスワードが一致しません') }));
                        } else {
                          setFieldErrors(prev => ({ ...prev, confirmPassword: '' }));
                          validateField('confirmPassword', e.target.value);
                        }
                      }}
                      onFocus={() => setFocusedField('confirmPassword')}
                      onBlur={() => setFocusedField(null)}
                      className={`peer w-full px-5 pt-7 pb-3 bg-gray-800/50 border-2 ${
                        fieldErrors.confirmPassword ? 'border-red-500/50' : 'border-gray-700/50'
                      } rounded-2xl focus:border-purple-500 focus:bg-gray-800/70 transition-all duration-300 outline-none text-white placeholder-transparent pr-20`}
                      placeholder=" "
                      required
                    />
                    <label className={`absolute left-5 transition-all duration-300 pointer-events-none ${
                      formData.confirmPassword || focusedField === 'confirmPassword'
                        ? 'top-2.5 text-xs text-purple-400'
                        : 'top-5 text-sm text-gray-400'
                    }`}>
                      {t('비밀번호 확인', 'Confirm Password', 'パスワード確認')}
                    </label>
                    <Lock className={`absolute right-16 top-5 w-5 h-5 transition-all duration-300 ${
                      fieldErrors.confirmPassword ? 'text-red-400' : focusedField === 'confirmPassword' ? 'text-purple-400 scale-110' : 'text-gray-500'
                    }`} />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-5 top-5 text-gray-500 hover:text-purple-400 transition-all duration-300 hover:scale-110"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                    {fieldErrors.confirmPassword && (
                      <p className="absolute -bottom-6 left-0 text-xs text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {fieldErrors.confirmPassword}
                      </p>
                    )}
                    {formData.confirmPassword && !fieldErrors.confirmPassword && formData.confirmPassword === formData.password && (
                      <CheckCircle2 className="absolute right-[5.5rem] top-5 w-5 h-5 text-green-400 animate-scale-in" />
                    )}
                    {/* Field glow effect */}
                    <div className={`absolute inset-0 rounded-2xl ${
                      fieldErrors.confirmPassword ? 'bg-red-500/20' : 'bg-purple-500/20'
                    } blur-xl transition-opacity duration-300 ${
                      focusedField === 'confirmPassword' ? 'opacity-100' : 'opacity-0'
                    }`}></div>
                  </div>
                </div>

                {/* Terms Agreement */}
                <div className="flex items-start mt-8">
                  <input
                    id="terms"
                    type="checkbox"
                    checked={formData.agreeToTerms}
                    onChange={(e) => setFormData({ ...formData, agreeToTerms: e.target.checked })}
                    className="mt-1 w-5 h-5 text-purple-500 bg-gray-800/50 border-2 border-gray-600 rounded focus:ring-purple-500 focus:ring-2 transition-all cursor-pointer checked:bg-purple-600 checked:border-purple-600"
                  />
                  <label htmlFor="terms" className="ml-3 text-sm text-gray-300 cursor-pointer">
                    {t(
                      '이용약관 및 개인정보처리방침에 동의합니다.',
                      'I agree to the Terms of Service and Privacy Policy.',
                      '利用規約およびプライバシーポリシーに同意します。'
                    )}
                    <Link to="/terms" className="ml-1 text-purple-400 hover:text-purple-300 underline transition-colors">
                      {t('약관 보기', 'View terms', '規約を見る')}
                    </Link>
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || !formData.agreeToTerms || Object.values(fieldErrors).some(error => error !== '')}
                  className="relative w-full py-5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-2xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-[0_10px_30px_rgba(147,51,234,0.3)] hover:shadow-[0_15px_40px_rgba(147,51,234,0.4)] flex items-center justify-center gap-3 overflow-hidden group"
                >
                  {/* Button glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300"></div>

                  <div className="relative z-10 flex items-center gap-3">
                    {loading ? (
                      <>
                        <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></span>
                        <span>{t('처리 중...', 'Processing...', '処理中...')}</span>
                      </>
                    ) : (
                      <>
                        <span>{t('회원가입', 'Sign Up', '登録')}</span>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </div>
                </button>

                {/* Sign In Link */}
                <div className="text-center mt-6">
                  <p className="text-gray-400">
                    {t('이미 계정이 있으신가요?', 'Already have an account?', 'すでにアカウントをお持ちですか？')}
                    <Link to="/login" className="ml-2 text-purple-400 hover:text-purple-300 font-medium transition-colors">
                      {t('로그인', 'Sign in', 'ログイン')}
                    </Link>
                  </p>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes scale-in {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
        
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
      `}</style>
    </div>
  );
}
