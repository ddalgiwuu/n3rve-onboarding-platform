import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth.store';
import useSafeStore from '@/hooks/useSafeStore';
import { useTranslation } from '@/hooks/useTranslationFixed';
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

    const googleAuthUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/auth/google`;

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Ultra-modern layered background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-800/30 via-indigo-900/20 to-transparent"></div>
      <div className="absolute inset-0 bg-[conic-gradient(from_0deg_at_50%_50%,_var(--tw-gradient-stops))] from-purple-600/10 via-pink-600/5 via-blue-600/5 to-purple-600/10 animate-spin-slow"></div>
      <div className="absolute inset-0 bg-[linear-gradient(45deg,_transparent_25%,_rgba(168,85,247,0.05)_50%,_transparent_75%)] bg-[length:60px_60px] animate-slide"></div>

      {/* Floating musical notes */}
      <FloatingNotes />

      {/* Enhanced gradient orbs with better visibility */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-20 -right-20 w-[400px] h-[400px] bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-full blur-3xl animate-blob"
          style={{
            transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)`
          }}
        />
        <div
          className="absolute -bottom-20 -left-20 w-[400px] h-[400px] bg-gradient-to-br from-blue-500/30 to-cyan-500/30 rounded-full blur-3xl animate-blob animation-delay-2000"
          style={{
            transform: `translate(${mousePosition.x * -0.02}px, ${mousePosition.y * -0.02}px)`,
            animationDuration: '20s'
          }}
        />
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-3xl animate-blob animation-delay-4000"
          style={{
            transform: `translate(${mousePosition.x * 0.01}px, ${mousePosition.y * 0.01}px) translate(-50%, -50%)`,
            animationDuration: '25s'
          }}
        />

        {/* Enhanced sparkle effects with better visibility and no clipping */}
        <div className="absolute inset-0 overflow-visible pointer-events-none">
          <div className="absolute -inset-10 overflow-visible">
            {[...Array(30)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-sparkle"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 6}s`,
                  animationDuration: '5s'
                }}
              >
                <div className="relative">
                  <Sparkles className="w-4 h-4 text-white/80 drop-shadow-lg" />
                  <div className="absolute inset-0 animate-pulse">
                    <Sparkles className="w-4 h-4 text-purple-300/40" />
                  </div>
                </div>
              </div>
            ))}
          </div>
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

              {/* Main card with ultra-modern glassmorphism */}
              <div
                className="relative bg-white/70 dark:bg-gray-900/40 backdrop-blur-3xl rounded-3xl shadow-2xl border border-white/40 dark:border-gray-700/20 overflow-hidden ring-1 ring-white/10 dark:ring-white/5"
                ref={formRef}
              >
                {/* Animated gradient border */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                {/* Success overlay */}
                {isSuccess && (
                  <div className="absolute top-4 left-4 right-4 bg-gradient-to-br from-green-500/90 to-emerald-500/90 backdrop-blur-sm z-50 rounded-lg p-4 flex items-center justify-center animate-fade-in">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3 animate-bounce-in">
                        <Check className="w-8 h-8 text-white" />
                      </div>
                      <p className="text-lg font-semibold text-white">
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

                    <div className="relative mb-3">
                      {/* Multiple animated gradient layers */}
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/30 via-pink-500/30 to-blue-500/30 rounded-2xl blur-xl animate-pulse-glow opacity-60" />
                      <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 via-purple-400/20 to-pink-400/20 rounded-2xl blur-lg animate-aurora-pulse opacity-80" />

                      {/* Ambient breathing glow */}
                      <div className="absolute -inset-4 bg-gradient-to-r from-purple-600/10 via-pink-600/10 to-blue-600/10 rounded-3xl animate-breathing-glow" />

                      <h1 className="relative text-4xl font-bold z-10">
                        <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent animate-gradient-shift bg-[length:200%_200%]">
                          N3RVE Platform
                        </span>
                      </h1>

                      {/* Shimmer overlay effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer-sweep -skew-x-12 opacity-0 hover:opacity-100 transition-opacity duration-700" />
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 font-medium">
                      {t('auth.subtitle', '공식 음원 유통 플랫폼', 'Official Music Distribution Platform', '公式音楽配信プラットフォーム')}
                    </p>
                  </div>

                  {/* Ultra-modern Login Method Tabs with 3D depth and magnetic effects */}
                  <div className="relative mb-8 perspective-1000" ref={tabRef}>
                    {/* Enhanced container with depth and lighting */}
                    <div className="relative flex rounded-2xl bg-gradient-to-r from-gray-100/70 via-gray-50/80 to-gray-100/70 dark:from-gray-800/70 dark:via-gray-900/80 dark:to-gray-800/70 backdrop-blur-xl p-2 border border-white/20 dark:border-gray-700/30 shadow-xl shadow-gray-200/50 dark:shadow-gray-900/50 transform-gpu">
                      {/* Animated background glow */}
                      <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-blue-500/20 rounded-3xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                      {/* Enhanced Google Tab */}
                      <button
                        onClick={() => setLoginMethod('google')}
                        className={`relative flex-1 py-4 px-6 rounded-xl text-sm font-semibold transition-all duration-500 transform-gpu group overflow-hidden ${
                          loginMethod === 'google'
                            ? 'text-purple-600 dark:text-purple-400 scale-105 z-20'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:scale-102 z-10'
                        }`}
                        onMouseEnter={(e) => {
                          if (loginMethod !== 'google') {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const x = e.clientX - rect.left;
                            const y = e.clientY - rect.top;
                            e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
                            e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
                          }
                        }}
                      >
                        {/* Active state with enhanced 3D effect */}
                        {loginMethod === 'google' && (
                          <>
                            {/* Main elevated surface */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white via-white/95 to-gray-50 dark:from-gray-900 dark:via-gray-900/95 dark:to-gray-800 rounded-xl shadow-2xl shadow-purple-500/25 transform transition-all duration-500 border border-white/40 dark:border-gray-700/40" />

                            {/* Shimmer effect for active state */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/10 to-transparent translate-x-[-100%] animate-shimmer-slow rounded-xl" />

                            {/* Depth shadow */}
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-purple-500/5 rounded-xl" />
                          </>
                        )}

                        {/* Hover magnetic effect for inactive state */}
                        {loginMethod !== 'google' && (
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-700">
                            <div
                              className="absolute w-32 h-32 bg-gradient-to-r from-white/10 via-purple-300/15 to-white/10 rounded-full blur-2xl"
                              style={{
                                left: 'var(--mouse-x)',
                                top: 'var(--mouse-y)',
                                transform: 'translate(-50%, -50%)'
                              }}
                            />
                          </div>
                        )}

                        <span className="relative z-10 flex items-center justify-center gap-3 transform transition-all duration-300 group-hover:scale-105">
                          <svg className={`w-5 h-5 transition-all duration-300 ${loginMethod === 'google' ? 'scale-110' : 'group-hover:scale-110'}`} viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                          <span className="tracking-wide">{t('auth.googleLogin', 'Google 로그인', 'Google Login', 'Googleログイン')}</span>
                        </span>
                      </button>

                      {/* Enhanced Email Tab */}
                      <button
                        onClick={() => setLoginMethod('email')}
                        className={`relative flex-1 py-4 px-6 rounded-xl text-sm font-semibold transition-all duration-500 transform-gpu group overflow-hidden ${
                          loginMethod === 'email'
                            ? 'text-purple-600 dark:text-purple-400 scale-105 z-20'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:scale-102 z-10'
                        }`}
                        onMouseEnter={(e) => {
                          if (loginMethod !== 'email') {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const x = e.clientX - rect.left;
                            const y = e.clientY - rect.top;
                            e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
                            e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
                          }
                        }}
                      >
                        {/* Active state with enhanced 3D effect */}
                        {loginMethod === 'email' && (
                          <>
                            {/* Main elevated surface */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white via-white/95 to-gray-50 dark:from-gray-900 dark:via-gray-900/95 dark:to-gray-800 rounded-xl shadow-2xl shadow-purple-500/25 transform transition-all duration-500 border border-white/40 dark:border-gray-700/40" />

                            {/* Shimmer effect for active state */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/10 to-transparent translate-x-[-100%] animate-shimmer-slow rounded-xl" />

                            {/* Depth shadow */}
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-purple-500/5 rounded-xl" />
                          </>
                        )}

                        {/* Hover magnetic effect for inactive state */}
                        {loginMethod !== 'email' && (
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-700">
                            <div
                              className="absolute w-32 h-32 bg-gradient-to-r from-white/10 via-pink-300/15 to-white/10 rounded-full blur-2xl"
                              style={{
                                left: 'var(--mouse-x)',
                                top: 'var(--mouse-y)',
                                transform: 'translate(-50%, -50%)'
                              }}
                            />
                          </div>
                        )}

                        <span className="relative z-10 flex items-center justify-center gap-3 transform transition-all duration-300 group-hover:scale-105">
                          <Mail className={`w-5 h-5 transition-all duration-300 ${loginMethod === 'email' ? 'scale-110' : 'group-hover:scale-110'}`} />
                          <span className="tracking-wide">{t('auth.emailLogin', '이메일 로그인', 'Email Login', 'メールログイン')}</span>
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
                        className="w-full relative group"
                      >
                        <div className="relative flex items-center justify-center gap-3 px-8 py-4 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-200 hover:border-purple-400 dark:hover:border-purple-600 min-h-[60px] min-w-[280px]">
                          {/* Simplified hover effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

                          {isLoading ? (
                            <div className="w-6 h-6 border-3 border-purple-300 dark:border-purple-500 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <div className="flex items-center justify-center gap-3 w-full">
                              <svg className="w-6 h-6 group-hover:scale-110 transition-transform duration-300 flex-shrink-0" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                              </svg>
                              <span className="font-semibold text-gray-900 dark:text-gray-100 relative z-10 text-center leading-snug whitespace-nowrap">
                                {t('auth.continueWithGoogle', 'Google 계정으로 계속하기', 'Continue with Google', 'Googleアカウントで続ける')}
                              </span>
                            </div>
                          )}
                        </div>
                      </button>

                      <div className="mt-8 text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {t('auth.noAccount', '계정이 없으신가요?', "Don't have an account?", 'アカウントをお持ちでないですか？')}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2 flex items-center justify-center gap-2">
                          <Shield className="w-4 h-4" />
                          {t('auth.contactAdmin', '관리자에게 문의하세요', 'Please contact administrator', '管理者にお問い合わせください')}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Email Login Form */}
                      <form onSubmit={handleEmailLogin} className="space-y-5">
                        {/* Email Input with Enhanced Micro-interactions */}
                        <div className="relative group">
                          {/* Simplified focus background */}
                          <div className="absolute inset-0 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-200" />

                          <div className="relative">
                            {/* Icon with enhanced animations */}
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-purple-500 transition-all duration-300 z-10 group-focus-within:scale-110 group-focus-within:drop-shadow-sm" />

                            <input
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="peer w-full pl-12 pr-4 py-4 bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-sm border-2 border-gray-200 dark:border-gray-700 rounded-2xl focus:border-purple-500 dark:focus:border-purple-400 focus:outline-none focus:ring-4 focus:ring-purple-500/20 text-gray-900 dark:text-white transition-all duration-300 placeholder-transparent transform-gpu focus:scale-[1.02] hover:scale-[1.01] focus:shadow-2xl focus:shadow-purple-500/25"
                              placeholder={t('auth.email', '이메일', 'Email', 'メールアドレス')}
                              disabled={isLoading}
                              id="email"
                            />

                            {/* Enhanced floating label with elastic animation */}
                            <label
                              htmlFor="email"
                              className="absolute left-12 top-4 text-gray-600 dark:text-gray-400 pointer-events-none transition-all duration-300 ease-out
                                peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:scale-100
                                peer-focus:top-0 peer-focus:text-xs peer-focus:text-purple-600 dark:peer-focus:text-purple-400 peer-focus:font-semibold
                                peer-focus:bg-white dark:peer-focus:bg-gray-900 peer-focus:px-2 peer-focus:-translate-y-1/2 peer-focus:scale-95
                                peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:font-semibold
                                peer-[:not(:placeholder-shown)]:bg-white dark:peer-[:not(:placeholder-shown)]:bg-gray-900
                                peer-[:not(:placeholder-shown)]:px-2 peer-[:not(:placeholder-shown)]:-translate-y-1/2 peer-[:not(:placeholder-shown)]:scale-95
                                peer-focus:drop-shadow-sm"
                            >
                              {t('auth.email', '이메일', 'Email', 'メールアドレス')}
                            </label>

                            {/* Multi-layered liquid fill effect */}
                            <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500 ease-out peer-focus:w-full w-0" />
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-1 w-0 bg-gradient-to-r from-purple-400 to-pink-400 blur-sm transition-all duration-700 ease-out peer-focus:w-20 opacity-0 peer-focus:opacity-100" />

                            {/* Success state indicator */}
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 transition-all duration-300 scale-0 peer-valid:opacity-100 peer-valid:scale-100">
                              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Password Input with Enhanced Micro-interactions */}
                        <div className="relative group">
                          {/* Simplified focus background */}
                          <div className="absolute inset-0 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-200" />

                          <div className="relative">
                            {/* Lock icon with enhanced animations */}
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-purple-500 transition-all duration-300 z-10 group-focus-within:scale-110 group-focus-within:drop-shadow-sm" />

                            <input
                              type={showPassword ? 'text' : 'password'}
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              className="peer w-full pl-12 pr-12 py-4 bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-sm border-2 border-gray-200 dark:border-gray-700 rounded-2xl focus:border-purple-500 dark:focus:border-purple-400 focus:outline-none focus:ring-4 focus:ring-purple-500/20 text-gray-900 dark:text-white transition-all duration-300 placeholder-transparent transform-gpu focus:scale-[1.02] hover:scale-[1.01] focus:shadow-2xl focus:shadow-purple-500/25"
                              placeholder={t('auth.password', '비밀번호', 'Password', 'パスワード')}
                              disabled={isLoading}
                              id="password"
                            />

                            {/* Enhanced floating label with elastic animation */}
                            <label
                              htmlFor="password"
                              className="absolute left-12 top-4 text-gray-600 dark:text-gray-400 pointer-events-none transition-all duration-300 ease-out
                                peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:scale-100
                                peer-focus:top-0 peer-focus:text-xs peer-focus:text-purple-600 dark:peer-focus:text-purple-400 peer-focus:font-semibold
                                peer-focus:bg-white dark:peer-focus:bg-gray-900 peer-focus:px-2 peer-focus:-translate-y-1/2 peer-focus:scale-95
                                peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:font-semibold
                                peer-[:not(:placeholder-shown)]:bg-white dark:peer-[:not(:placeholder-shown)]:bg-gray-900
                                peer-[:not(:placeholder-shown)]:px-2 peer-[:not(:placeholder-shown)]:-translate-y-1/2 peer-[:not(:placeholder-shown)]:scale-95
                                peer-focus:drop-shadow-sm"
                            >
                              {t('auth.password', '비밀번호', 'Password', 'パスワード')}
                            </label>

                            {/* Enhanced eye toggle button with micro-interactions */}
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-500 dark:hover:text-purple-400 transition-all duration-300 group/eye z-10 p-1 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 active:scale-95"
                            >
                              <div className="relative">
                                {showPassword ? (
                                  <EyeOff className="w-5 h-5 group-hover/eye:scale-110 transition-all duration-300 group-hover/eye:rotate-12" />
                                ) : (
                                  <Eye className="w-5 h-5 group-hover/eye:scale-110 transition-all duration-300 group-hover/eye:-rotate-12" />
                                )}
                                {/* Ripple effect on click */}
                                <div className="absolute inset-0 rounded-full bg-purple-400 scale-0 opacity-0 group-active/eye:scale-150 group-active/eye:opacity-30 transition-all duration-200" />
                              </div>
                            </button>

                            {/* Multi-layered liquid fill effect */}
                            <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500 ease-out peer-focus:w-full w-0" />
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-1 w-0 bg-gradient-to-r from-purple-400 to-pink-400 blur-sm transition-all duration-700 ease-out peer-focus:w-20 opacity-0 peer-focus:opacity-100" />

                            {/* Password strength indicator */}
                            <div className="absolute right-12 top-1/2 -translate-y-1/2 opacity-0 transition-all duration-300 scale-0 peer-focus:opacity-100 peer-focus:scale-100">
                              <div className="flex gap-1">
                                <div className={`h-1 w-2 rounded-full transition-all duration-300 ${password.length > 0 ? 'bg-red-400' : 'bg-gray-300'}`} />
                                <div className={`h-1 w-2 rounded-full transition-all duration-300 ${password.length > 4 ? 'bg-yellow-400' : 'bg-gray-300'}`} />
                                <div className={`h-1 w-2 rounded-full transition-all duration-300 ${password.length > 8 ? 'bg-green-400' : 'bg-gray-300'}`} />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Submit Button - Simplified & Consistent */}
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="relative w-full group min-h-[60px]"
                        >
                          {/* Simplified hover background */}
                          <div className="absolute inset-0 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

                          {/* Button content */}
                          <div className="relative flex items-center justify-center px-6 py-4 bg-gradient-to-r from-purple-600 via-purple-700 to-blue-600 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl hover:shadow-purple-500/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed min-h-[60px]">
                            {isLoading ? (
                              <div className="flex items-center justify-center gap-3">
                                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>처리 중...</span>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-3 w-full">
                                <span className="text-center leading-snug whitespace-nowrap">{t('auth.login', '로그인', 'Login', 'ログイン')}</span>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                  <ArrowRight className="w-5 h-5" />
                                </div>
                              </div>
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
                              {t('auth.noAccount', '계정이 없으신가요?', "Don't have an account?", 'アカウントをお持ちでないですか？')}
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
                        <p>{t('auth.securityNotice', '안전한 인증이 보장됩니다', 'Secure authentication guaranteed', '安全な認証が保証されます')}</p>
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
