import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth.store';
import useSafeStore from '@/hooks/useSafeStore';
import { useTranslation } from '@/hooks/useTranslation';
import LanguageToggle from '@/components/common/LanguageToggle';
import DarkModeToggle from '@/components/common/DarkModeToggle';
import { Mail, Lock, Eye, EyeOff, Music, Sparkles, Shield, Check, ArrowRight } from 'lucide-react';
import api from '@/lib/api';
import { logger } from '@/utils/logger';
import { useAutoAnimate } from '@formkit/auto-animate/react';

// Floating musical notes component
const FloatingNotes = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(15)].map((_, i) => {
        const randomX = Math.random() * 100;
        const randomDelay = Math.random() * 20;
        const duration = Math.random() * 15 + 20;

        return (
          <div
            key={i}
            className="absolute opacity-0 animate-float-up-fade"
            style={{
              left: `${randomX}%`,
              bottom: '-20px',
              animationDelay: `${randomDelay}s`,
              animationDuration: `${duration}s`
            }}
          >
            <Music className="w-6 h-6 text-purple-400/30 dark:text-purple-400/20 rotate-12" />
          </div>
        );
      })}
    </div>
  );
};

// Animated text component with fade-in effect
const AnimatedText = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay * 1000);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [delay]);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
    >
      {children}
    </div>
  );
};

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'google' | 'email'>('google');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useSafeStore(useAuthStore, (state) => state.isAuthenticated);
  const setAuth = useSafeStore(useAuthStore, (state) => state.setAuth);
  const { t, language } = useTranslation();
  const popupRef = useRef<Window | null>(null);

  // Auto-animate refs
  const [formRef] = useAutoAnimate();
  const [tabRef] = useAutoAnimate();

  // Component mounted
  useEffect(() => {
    // Component initialization
  }, []);

  // Mouse tracking effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Check for OAuth error in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const error = urlParams.get('error');

    if (error === 'oauth_failed') {
      toast.error(t('auth.oauthFailed', 'OAuth 인증에 실패했습니다', 'OAuth authentication failed', 'OAuth認証に失敗しました'));
    }
  }, [location, t]);

  // Handle messages from popup window (Safari OAuth flow)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Verify origin
      if (event.origin !== window.location.origin) return;

      // Handle auth callback message
      if (event.data?.type === 'auth-callback') {
        if (event.data.success && event.data.accessToken && event.data.refreshToken) {
          // Redirect to auth callback with tokens
          const params = new URLSearchParams({
            access_token: event.data.accessToken,
            refresh_token: event.data.refreshToken,
            profile_complete: event.data.profileComplete?.toString() || 'false'
          });
          navigate(`/auth/callback?${params.toString()}`);
        } else {
          setIsLoading(false);
          toast.error(t('auth.loginFailed', '로그인에 실패했습니다', 'Login failed', 'ログインに失敗しました'));
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [navigate]);

  const handleGoogleLogin = () => {
    setIsLoading(true);
    // Get the returnUrl from location state or query params
    const returnUrl = location.state?.from || new URLSearchParams(location.search).get('returnUrl') || '/dashboard';

    // Store returnUrl in sessionStorage to persist across OAuth redirect
    sessionStorage.setItem('returnUrl', returnUrl);

    const googleAuthUrl = `${import.meta.env.VITE_API_URL}/auth/google`;

    // Safari-friendly approach: Use popup window for OAuth
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    if (isSafari) {
      // Open OAuth in a popup for Safari
      const width = 500;
      const height = 600;
      const left = (window.screen.width - width) / 2;
      const top = (window.screen.height - height) / 2;

      popupRef.current = window.open(
        googleAuthUrl,
        'google-auth',
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no`
      );

      if (!popupRef.current) {
        toast.error(t('auth.popupBlocked', '팝업이 차단되었습니다. 팝업 차단을 해제해주세요.', 'Popup blocked. Please allow popups and try again.', 'ポップアップがブロックされました。ポップアップを許可してください'));
        setIsLoading(false);
        return;
      }

      // Focus the popup
      popupRef.current.focus();
    } else {
      // Standard redirect for other browsers
      window.location.href = googleAuthUrl;
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error(t('auth.fillAllFields', '모든 필드를 입력해주세요', 'Please fill in all fields', 'すべての項目を入力してください'));
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post('/auth/login', {
        email,
        password
      });

      const { user, accessToken, refreshToken } = response.data;

      // Set auth in store
      setAuth?.(user, accessToken, refreshToken);

      // Show success animation
      setIsSuccess(true);

      // Get return URL
      const returnUrl = location.state?.from || new URLSearchParams(location.search).get('returnUrl') || '/dashboard';

      // Navigate after animation
      setTimeout(() => {
        // Check if user needs to select role or complete profile
        if (user.role === 'ADMIN' && user.isProfileComplete) {
          // Store tokens temporarily for role selection
          sessionStorage.setItem('temp_access_token', accessToken);
          sessionStorage.setItem('temp_refresh_token', refreshToken);
          sessionStorage.setItem('temp_user', JSON.stringify(user));
          navigate('/role-select');
        } else if (!user.isProfileComplete) {
          navigate('/profile-setup');
        } else {
          navigate(returnUrl);
        }
      }, 1500);

      toast.success(t('auth.loginSuccess', '로그인되었습니다', 'Logged in successfully', 'ログインしました'));
    } catch (error: any) {
      logger.error('Login error:', error);
      if (error.response?.status === 401) {
        toast.error(t('auth.invalidCredentials', '이메일 또는 비밀번호가 올바르지 않습니다', 'Invalid email or password', 'メールアドレスまたはパスワードが正しくありません'));
      } else {
        toast.error(t('auth.loginFailed'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900 relative overflow-hidden">
      {/* Floating musical notes */}
      <FloatingNotes />

      {/* Dynamic gradient orbs with parallax */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-purple-400 dark:bg-purple-600 rounded-full mix-blend-screen dark:mix-blend-multiply filter blur-3xl opacity-30 dark:opacity-20 animate-blob"
          style={{
            transform: `translate(${mousePosition.x * 0.05}px, ${mousePosition.y * 0.05}px)`
          }}
        />
        <div
          className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-pink-400 dark:bg-pink-600 rounded-full mix-blend-screen dark:mix-blend-multiply filter blur-3xl opacity-30 dark:opacity-20 animate-blob animation-delay-2000"
          style={{
            transform: `translate(${mousePosition.x * -0.05}px, ${mousePosition.y * -0.05}px)`,
            animationDuration: '20s'
          }}
        />
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-400 dark:bg-blue-600 rounded-full mix-blend-screen dark:mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-15 animate-blob animation-delay-4000"
          style={{
            transform: `translate(${mousePosition.x * 0.03}px, ${mousePosition.y * 0.03}px) translate(-50%, -50%)`,
            animationDuration: '25s'
          }}
        />

        {/* Sparkle effects */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-sparkle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: '4s'
              }}
            >
              <Sparkles className="w-3 h-3 text-white/40 dark:text-white/20" />
            </div>
          ))}
        </div>
      </div>

      {/* Language & Dark Mode Toggle in header */}
      <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-50 flex items-center gap-3">
        <DarkModeToggle />
        <LanguageToggle />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4 sm:p-6 lg:p-8">
        <AnimatedText>
          <div className="w-full max-w-md">
            {/* Multi-layer glassmorphic card */}
            <div className="relative">
              {/* Background glow effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl blur-xl opacity-30 dark:opacity-20 animate-pulse-glow" />

              {/* Main card */}
              <div
                className="relative bg-white/80 dark:bg-gray-900/50 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/50 dark:border-gray-700/30 overflow-hidden"
                ref={formRef}
              >
                {/* Animated gradient border */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                {/* Success overlay */}
                {isSuccess && (
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
                    <div className="text-center">
                      <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce-in">
                        <Check className="w-10 h-10 text-white" />
                      </div>
                      <p className="text-xl font-semibold text-green-600 dark:text-green-400">
                        {t('auth.loginSuccess', '로그인 성공!', 'Login Successful!', 'ログイン成功！')}
                      </p>
                    </div>
                  </div>
                )}

                <div className="p-8 sm:p-10">
                  {/* Animated Logo */}
                  <div className="text-center mb-8">
                    <div className="relative inline-block mb-6 group">
                      <div className="absolute -inset-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl blur-md opacity-50 group-hover:opacity-75 animate-pulse-glow transition-opacity duration-300" />
                      <div className="relative w-24 h-24 bg-gradient-to-br from-purple-600 to-blue-600 rounded-3xl shadow-2xl flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300 animate-breathing">
                        <Music className="w-12 h-12 text-white animate-bounce-slow" />
                      </div>
                    </div>

                    <h1 className="text-4xl font-bold mb-3">
                      <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent animate-gradient-x">
                        N3RVE Platform
                      </span>
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 font-medium">
                      {t('auth.subtitle', '공식 음원 유통 플랫폼', 'Official Music Distribution Platform', '公式音楽配信プラットフォーム')}
                    </p>
                  </div>

                  {/* Login Method Tabs with 3D effect */}
                  <div className="relative mb-8" ref={tabRef}>
                    <div className="flex rounded-2xl bg-gray-100/50 dark:bg-gray-800/50 backdrop-blur-sm p-1.5 border border-gray-200/50 dark:border-gray-700/50">
                      <button
                        onClick={() => setLoginMethod('google')}
                        className={`relative flex-1 py-3 px-6 rounded-xl text-sm font-semibold transition-all duration-300 ${
                          loginMethod === 'google'
                            ? 'text-purple-600 dark:text-purple-400'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                        }`}
                      >
                        {loginMethod === 'google' && (
                          <div className="absolute inset-0 bg-white dark:bg-gray-900 rounded-xl shadow-lg transform transition-all duration-300" />
                        )}
                        <span className="relative z-10 flex items-center justify-center gap-2">
                          <svg className="w-4 h-4" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                          {t('auth.googleLogin', 'Google 로그인', 'Google Login', 'Googleログイン')}
                        </span>
                      </button>
                      <button
                        onClick={() => setLoginMethod('email')}
                        className={`relative flex-1 py-3 px-6 rounded-xl text-sm font-semibold transition-all duration-300 ${
                          loginMethod === 'email'
                            ? 'text-purple-600 dark:text-purple-400'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                        }`}
                      >
                        {loginMethod === 'email' && (
                          <div className="absolute inset-0 bg-white dark:bg-gray-900 rounded-xl shadow-lg transform transition-all duration-300" />
                        )}
                        <span className="relative z-10 flex items-center justify-center gap-2">
                          <Mail className="w-4 h-4" />
                          {t('auth.emailLogin', '이메일 로그인', 'Email Login', 'メールログイン')}
                        </span>
                      </button>
                    </div>
                  </div>

                  {loginMethod === 'google' ? (
                    <>
                      {/* Google Login */}
                      <button
                        onClick={handleGoogleLogin}
                        disabled={isLoading}
                        className="w-full relative group overflow-hidden"
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const x = e.clientX - rect.left;
                          const y = e.clientY - rect.top;
                          e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
                          e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
                        }}
                      >
                        <div className="relative flex items-center justify-center gap-3 px-6 py-4 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 group-hover:scale-[1.02] group-hover:border-purple-400 dark:group-hover:border-purple-600">
                          {/* Magnetic hover effect */}
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div
                              className="absolute w-96 h-96 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full blur-3xl opacity-20"
                              style={{
                                left: 'var(--mouse-x)',
                                top: 'var(--mouse-y)',
                                transform: 'translate(-50%, -50%)'
                              }}
                            />
                          </div>

                          {isLoading ? (
                            <div className="w-6 h-6 border-3 border-purple-300 dark:border-purple-500 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <svg className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                              </svg>
                              <span className="font-semibold text-gray-900 dark:text-gray-100 relative z-10">
                                {t('auth.continueWithGoogle', 'Google로 계속하기', 'Continue with Google', 'Googleで続ける')}
                              </span>
                            </>
                          )}
                        </div>
                      </button>

                      <div className="mt-8 text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {t('auth.noAccount', '계정이 없으신가요?', "Don't have an account?", 'アカウントがありませんか？')}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2 flex items-center justify-center gap-2">
                          <Shield className="w-4 h-4" />
                          {t('auth.contactAdmin', '관리자에게 계정 생성을 요청하세요', 'Contact admin for account creation', '管理者にアカウント作成を依頼してください')}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Email Login Form */}
                      <form onSubmit={handleEmailLogin} className="space-y-5">
                        {/* Email Input with Floating Label */}
                        <div className="relative group">
                          <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-2xl blur-sm opacity-0 group-focus-within:opacity-30 transition-opacity duration-300" />
                          <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-purple-500 transition-colors duration-300 z-10" />
                            <input
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="peer w-full pl-12 pr-4 py-4 bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-sm border-2 border-gray-200 dark:border-gray-700 rounded-2xl focus:border-purple-500 dark:focus:border-purple-400 focus:outline-none focus:ring-4 focus:ring-purple-500/10 text-gray-900 dark:text-white transition-all duration-300 placeholder-transparent"
                              placeholder={t('auth.email', '이메일', 'Email', 'メールアドレス')}
                              disabled={isLoading}
                              id="email"
                            />
                            <label
                              htmlFor="email"
                              className="absolute left-12 top-4 text-gray-600 dark:text-gray-400 transition-all duration-300 pointer-events-none
                                peer-placeholder-shown:top-4 peer-placeholder-shown:text-base
                                peer-focus:top-0 peer-focus:text-xs peer-focus:text-purple-600 dark:peer-focus:text-purple-400
                                peer-focus:bg-white dark:peer-focus:bg-gray-900 peer-focus:px-2 peer-focus:-translate-y-1/2
                                peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:text-xs
                                peer-[:not(:placeholder-shown)]:bg-white dark:peer-[:not(:placeholder-shown)]:bg-gray-900
                                peer-[:not(:placeholder-shown)]:px-2 peer-[:not(:placeholder-shown)]:-translate-y-1/2"
                            >
                              {t('auth.email', '이메일', 'Email', 'メールアドレス')}
                            </label>
                            {/* Liquid fill effect on focus */}
                            <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300 peer-focus:w-full w-0" />
                          </div>
                        </div>

                        {/* Password Input with Floating Label */}
                        <div className="relative group">
                          <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-2xl blur-sm opacity-0 group-focus-within:opacity-30 transition-opacity duration-300" />
                          <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-purple-500 transition-colors duration-300 z-10" />
                            <input
                              type={showPassword ? 'text' : 'password'}
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              className="peer w-full pl-12 pr-12 py-4 bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-sm border-2 border-gray-200 dark:border-gray-700 rounded-2xl focus:border-purple-500 dark:focus:border-purple-400 focus:outline-none focus:ring-4 focus:ring-purple-500/10 text-gray-900 dark:text-white transition-all duration-300 placeholder-transparent"
                              placeholder={t('auth.password', '비밀번호', 'Password', 'パスワード')}
                              disabled={isLoading}
                              id="password"
                            />
                            <label
                              htmlFor="password"
                              className="absolute left-12 top-4 text-gray-600 dark:text-gray-400 transition-all duration-300 pointer-events-none
                                peer-placeholder-shown:top-4 peer-placeholder-shown:text-base
                                peer-focus:top-0 peer-focus:text-xs peer-focus:text-purple-600 dark:peer-focus:text-purple-400
                                peer-focus:bg-white dark:peer-focus:bg-gray-900 peer-focus:px-2 peer-focus:-translate-y-1/2
                                peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:text-xs
                                peer-[:not(:placeholder-shown)]:bg-white dark:peer-[:not(:placeholder-shown)]:bg-gray-900
                                peer-[:not(:placeholder-shown)]:px-2 peer-[:not(:placeholder-shown)]:-translate-y-1/2"
                            >
                              {t('auth.password', '비밀번호', 'Password', 'パスワード')}
                            </label>
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-500 dark:hover:text-purple-400 transition-all duration-300 group/eye z-10"
                            >
                              <div className="relative">
                                {showPassword ? (
                                  <EyeOff className="w-5 h-5 group-hover/eye:scale-110 transition-transform duration-300" />
                                ) : (
                                  <Eye className="w-5 h-5 group-hover/eye:scale-110 transition-transform duration-300" />
                                )}
                              </div>
                            </button>
                            {/* Liquid fill effect on focus */}
                            <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300 peer-focus:w-full w-0" />
                          </div>
                        </div>

                        {/* Submit Button with Liquid Gradient Animation */}
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="relative w-full overflow-hidden group"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-gradient-x" />
                          <div className="relative flex items-center justify-center px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-2xl shadow-lg hover:shadow-2xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100">
                            {isLoading ? (
                              <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                              <>
                                <span>{t('auth.login', '로그인', 'Login', 'ログイン')}</span>
                                <div className="absolute right-4 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                                  <ArrowRight className="w-5 h-5" />
                                </div>
                              </>
                            )}
                          </div>
                        </button>
                      </form>

                      <div className="mt-6 text-center space-y-4">
                        <AnimatedText delay={0.4}>
                          <div className="group">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {t('auth.forgotPassword', '비밀번호를 잊으셨나요?', 'Forgot your password?', 'パスワードをお忘れですか？')}
                            </p>
                            <button className="relative text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-medium mt-1 transition-all duration-300 group">
                              <span className="relative z-10">{t('auth.resetPassword', '비밀번호 재설정', 'Reset password', 'パスワードをリセット')}</span>
                              <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-purple-600 dark:bg-purple-400 group-hover:w-full transition-all duration-300" />
                            </button>
                          </div>
                        </AnimatedText>

                        <AnimatedText delay={0.5}>
                          <div className="relative py-4">
                            <div className="absolute inset-0 flex items-center">
                              <div className="w-full border-t border-gray-200/50 dark:border-gray-700/50"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                              <span className="px-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm text-gray-500 rounded-full">
                                {t('auth.or', '또는', 'or', 'または')}
                              </span>
                            </div>
                          </div>
                        </AnimatedText>

                        <AnimatedText delay={0.6}>
                          <div className="group">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {t('auth.noAccount', '계정이 없으신가요?', "Don't have an account?", 'アカウントをお持ちでない方')}
                            </p>
                            <Link
                              to="/register"
                              className="relative inline-block text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-medium mt-1 transition-all duration-300 group"
                            >
                              <span className="relative z-10">{t('auth.signUp', '회원가입', 'Sign up', '新規登録')}</span>
                              <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-purple-600 dark:bg-purple-400 group-hover:w-full transition-all duration-300" />
                              <div className="absolute -inset-2 bg-purple-400/20 dark:bg-purple-400/10 rounded-lg opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-300" />
                            </Link>
                          </div>
                        </AnimatedText>
                      </div>
                    </>
                  )}

                  {/* Security Notice with animation */}
                  <AnimatedText delay={0.7}>
                    <div className="mt-6 pt-6 border-t border-gray-200/50 dark:border-gray-700/50">
                      <div className="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <Shield className="w-4 h-4 animate-pulse" />
                        <p>{t('auth.securityNotice', '안전한 SSL 암호화 연결', 'Secure SSL encrypted connection', '安全なSSL暗号化接続')}</p>
                      </div>
                    </div>
                  </AnimatedText>
                </div>
              </div>
            </div>
          </div>
        </AnimatedText>
      </div>
    </div>
  );
}
