import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth.store';
import useSafeStore from '@/hooks/useSafeStore';
import { useTranslation } from '@/hooks/useTranslation';
import LanguageToggle from '@/components/common/LanguageToggle';
import { Mail, Lock, Eye, EyeOff, Music, Sparkles, Shield, ArrowRight, CheckCircle2 } from 'lucide-react';
import api from '@/lib/api';
import { logger } from '@/utils/logger';

// Musical note particle component
const MusicalNote = ({ delay = 0 }) => {
  const randomX = Math.random() * 100;
  const randomDuration = 15 + Math.random() * 20;

  return (
    <motion.div
      className="absolute pointer-events-none"
      initial={{ x: `${randomX}vw`, y: '110vh', opacity: 0 }}
      animate={{
        y: '-10vh',
        opacity: [0, 0.8, 0.8, 0],
        rotate: [0, 360]
      }}
      transition={{
        duration: randomDuration,
        delay,
        repeat: Infinity,
        ease: 'linear'
      }}
    >
      <Music className="w-6 h-6 text-purple-400/30 dark:text-purple-300/20" />
    </motion.div>
  );
};

// Animated gradient orb component
const GradientOrb = ({ color, size, position, delay = 0 }) => {
  return (
    <motion.div
      className={'absolute rounded-full filter blur-3xl mix-blend-multiply dark:mix-blend-screen opacity-30'}
      style={{
        background: color,
        width: size,
        height: size,
        ...position
      }}
      animate={{
        x: [0, 30, -30, 0],
        y: [0, -30, 30, 0],
        scale: [1, 1.1, 0.9, 1]
      }}
      transition={{
        duration: 20,
        delay,
        repeat: Infinity,
        ease: 'easeInOut'
      }}
    />
  );
};

export default function ModernLoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'google' | 'email'>('google');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useSafeStore(useAuthStore, (state) => state.isAuthenticated);
  const setAuth = useSafeStore(useAuthStore, (state) => state.setAuth);
  const { t } = useTranslation();
  const popupRef = useRef<Window | null>(null);

  // Mouse position tracking for interactive effects
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Spring animations for smooth mouse tracking
  const springConfig = { damping: 25, stiffness: 200 };
  const springX = useSpring(mouseX, springConfig);
  const springY = useSpring(mouseY, springConfig);

  // Transform mouse position for parallax effects
  const parallaxX = useTransform(springX, [0, 1], [-20, 20]);
  const parallaxY = useTransform(springY, [0, 1], [-20, 20]);

  // Handle mouse move for interactive effects
  const handleMouseMove = useCallback((e: MouseEvent) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    mouseX.set(clientX / innerWidth);
    mouseY.set(clientY / innerHeight);
  }, [mouseX, mouseY]);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

  // Component mounted
  useEffect(() => {
    // Component initialization
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
          setIsSuccess(true);
          setTimeout(() => {
            // Redirect to auth callback with tokens
            const params = new URLSearchParams({
              access_token: event.data.accessToken,
              refresh_token: event.data.refreshToken,
              profile_complete: event.data.profileComplete?.toString() || 'false'
            });
            navigate(`/auth/callback?${params.toString()}`);
          }, 1500);
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

      setIsSuccess(true);

      // Get return URL
      const returnUrl = location.state?.from || new URLSearchParams(location.search).get('returnUrl') || '/dashboard';

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
      setIsLoading(false);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 15
      }
    }
  };

  const cardVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 200,
        damping: 20
      }
    }
  };

  return (
    <motion.div
      className="min-h-screen relative overflow-hidden bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-950 dark:via-purple-950/20 dark:to-blue-950/20"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Animated gradient background */}
      <div className="fixed inset-0 overflow-hidden">
        <GradientOrb
          color="radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%)"
          size="500px"
          position={{ top: '-10%', right: '-10%' }}
          delay={0}
        />
        <GradientOrb
          color="radial-gradient(circle, rgba(236, 72, 153, 0.3) 0%, transparent 70%)"
          size="600px"
          position={{ bottom: '-20%', left: '-15%' }}
          delay={2}
        />
        <GradientOrb
          color="radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%)"
          size="400px"
          position={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
          delay={4}
        />
      </div>

      {/* Musical notes particle system */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <MusicalNote key={i} delay={i * 3} />
        ))}
      </div>

      {/* Language Toggle */}
      <motion.div
        className="fixed top-4 right-4 sm:top-6 sm:right-6 z-50"
        variants={itemVariants}
      >
        <LanguageToggle />
      </motion.div>

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <motion.div
          className="w-full max-w-md"
          style={{ x: parallaxX, y: parallaxY }}
        >
          <motion.div
            variants={cardVariants}
            className="relative"
          >
            {/* Glassmorphic card with multiple layers */}
            <div className="absolute inset-0 bg-white/20 dark:bg-gray-900/20 backdrop-blur-3xl rounded-3xl" />
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-blue-500/10 dark:from-purple-400/10 dark:to-blue-400/10 backdrop-blur-2xl rounded-3xl" />

            {/* Animated border gradient */}
            <div className="absolute inset-0 rounded-3xl p-[2px] overflow-hidden">
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600"
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
              />
            </div>

            {/* Main card content */}
            <div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 sm:p-10 border border-white/20 dark:border-gray-800/50">
              {/* Logo with breathing animation */}
              <motion.div
                className="text-center mb-8"
                variants={itemVariants}
              >
                <motion.div
                  className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-600 to-blue-600 rounded-3xl mb-4 shadow-xl relative overflow-hidden"
                  animate={{
                    scale: [1, 1.05, 1]
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                >
                  <Sparkles className="absolute w-full h-full text-white/20" />
                  <Music className="w-10 h-10 text-white relative z-10" />
                </motion.div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent">
                  N3RVE Platform
                </h1>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  {t('auth.subtitle', '공식 음원 유통 플랫폼', 'Official Music Distribution Platform', '公式音楽配信プラットフォーム')}
                </p>
              </motion.div>

              {/* Success state */}
              <AnimatePresence mode="wait">
                {isSuccess ? (
                  <motion.div
                    key="success"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="flex flex-col items-center justify-center py-12"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: [0, 1.2, 1] }}
                      transition={{ duration: 0.5, type: 'spring' }}
                      className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mb-4"
                    >
                      <CheckCircle2 className="w-10 h-10 text-white" />
                    </motion.div>
                    <motion.p
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="text-lg font-medium text-gray-700 dark:text-gray-300"
                    >
                      {t('auth.loginSuccess', '로그인되었습니다', 'Login successful', 'ログインしました')}
                    </motion.p>
                  </motion.div>
                ) : (
                  <>
                    {/* Login Method Tabs with 3D effect */}
                    <motion.div
                      className="relative mb-6"
                      variants={itemVariants}
                    >
                      <div className="flex rounded-xl bg-gray-100/50 dark:bg-gray-800/50 backdrop-blur-sm p-1">
                        <motion.div
                          className="absolute inset-y-1 rounded-lg bg-white dark:bg-gray-700 shadow-lg"
                          layoutId="loginMethodIndicator"
                          initial={false}
                          animate={{
                            x: loginMethod === 'google' ? 0 : '50%',
                            width: '50%'
                          }}
                          transition={{
                            type: 'spring',
                            stiffness: 300,
                            damping: 30
                          }}
                        />
                        <button
                          onClick={() => setLoginMethod('google')}
                          className={`relative z-10 flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
                            loginMethod === 'google'
                              ? 'text-purple-600 dark:text-purple-400'
                              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                          }`}
                        >
                          {t('auth.googleLogin', 'Google 로그인', 'Google Login', 'Googleログイン')}
                        </button>
                        <button
                          onClick={() => setLoginMethod('email')}
                          className={`relative z-10 flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
                            loginMethod === 'email'
                              ? 'text-purple-600 dark:text-purple-400'
                              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                          }`}
                        >
                          {t('auth.emailLogin', '이메일 로그인', 'Email Login', 'メールログイン')}
                        </button>
                      </div>
                    </motion.div>

                    <AnimatePresence mode="wait">
                      {loginMethod === 'google' ? (
                        <motion.div
                          key="google"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.3 }}
                        >
                          {/* Google Login Button with magnetic effect */}
                          <motion.button
                            onClick={handleGoogleLogin}
                            disabled={isLoading}
                            className="relative w-full group"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 dark:from-purple-400/20 dark:to-blue-400/20 rounded-xl blur-xl group-hover:blur-2xl transition-all duration-300" />
                            <div className="relative flex items-center justify-center gap-3 px-6 py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                              <AnimatePresence mode="wait">
                                {isLoading ? (
                                  <motion.div
                                    key="loading"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0 }}
                                    className="w-5 h-5 border-2 border-purple-600 dark:border-purple-400 border-t-transparent rounded-full animate-spin"
                                  />
                                ) : (
                                  <motion.div
                                    key="google-icon"
                                    initial={{ rotate: 0 }}
                                    whileHover={{ rotate: 360 }}
                                    transition={{ duration: 0.5 }}
                                  >
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                      <path
                                        fill="#4285F4"
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                      />
                                      <path
                                        fill="#34A853"
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                      />
                                      <path
                                        fill="#FBBC05"
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                      />
                                      <path
                                        fill="#EA4335"
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                      />
                                    </svg>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                              <span className="font-medium text-gray-900 dark:text-gray-100">
                                {t('auth.continueWithGoogle', 'Google로 계속하기', 'Continue with Google', 'Googleで続ける')}
                              </span>
                              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 group-hover:translate-x-1 transition-transform" />
                            </div>
                          </motion.button>

                          <motion.div
                            className="mt-6 text-center"
                            variants={itemVariants}
                          >
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {t('auth.noAccount', '계정이 없으신가요?', "Don't have an account?", 'アカウントがありませんか？')}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                              {t('auth.contactAdmin', '관리자에게 계정 생성을 요청하세요', 'Contact admin for account creation', '管理者にアカウント作成を依頼してください')}
                            </p>
                          </motion.div>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="email"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.3 }}
                        >
                          {/* Email Login Form with liquid effects */}
                          <form onSubmit={handleEmailLogin} className="space-y-5">
                            {/* Email field with floating label */}
                            <div className="relative">
                              <motion.div
                                className={`absolute inset-0 bg-gradient-to-r from-purple-600/10 to-blue-600/10 dark:from-purple-400/10 dark:to-blue-400/10 rounded-xl transition-opacity duration-300 ${
                                  emailFocused ? 'opacity-100' : 'opacity-0'
                                }`}
                              />
                              <div className="relative">
                                <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${
                                  emailFocused ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400'
                                }`} />
                                <input
                                  type="email"
                                  value={email}
                                  onChange={(e) => setEmail(e.target.value)}
                                  onFocus={() => setEmailFocused(true)}
                                  onBlur={() => setEmailFocused(false)}
                                  className="w-full pl-12 pr-4 py-4 bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-sm border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-purple-500 dark:focus:border-purple-400 focus:outline-none transition-all duration-300 text-gray-900 dark:text-white"
                                  placeholder={t('auth.emailPlaceholder', '이메일을 입력하세요', 'Enter your email', 'メールアドレスを入力')}
                                  disabled={isLoading}
                                />
                                <motion.label
                                  className={`absolute left-12 transition-all duration-300 pointer-events-none ${
                                    email || emailFocused
                                      ? '-top-2.5 text-xs bg-white dark:bg-gray-900 px-2 text-purple-600 dark:text-purple-400'
                                      : 'top-4 text-gray-500 dark:text-gray-400'
                                  }`}
                                >
                                  {t('auth.email', '이메일', 'Email', 'メールアドレス')}
                                </motion.label>
                              </div>
                            </div>

                            {/* Password field with show/hide animation */}
                            <div className="relative">
                              <motion.div
                                className={`absolute inset-0 bg-gradient-to-r from-purple-600/10 to-blue-600/10 dark:from-purple-400/10 dark:to-blue-400/10 rounded-xl transition-opacity duration-300 ${
                                  passwordFocused ? 'opacity-100' : 'opacity-0'
                                }`}
                              />
                              <div className="relative">
                                <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${
                                  passwordFocused ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400'
                                }`} />
                                <input
                                  type={showPassword ? 'text' : 'password'}
                                  value={password}
                                  onChange={(e) => setPassword(e.target.value)}
                                  onFocus={() => setPasswordFocused(true)}
                                  onBlur={() => setPasswordFocused(false)}
                                  className="w-full pl-12 pr-14 py-4 bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-sm border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-purple-500 dark:focus:border-purple-400 focus:outline-none transition-all duration-300 text-gray-900 dark:text-white"
                                  placeholder={t('auth.passwordPlaceholder', '비밀번호를 입력하세요', 'Enter your password', 'パスワードを入力')}
                                  disabled={isLoading}
                                />
                                <motion.label
                                  className={`absolute left-12 transition-all duration-300 pointer-events-none ${
                                    password || passwordFocused
                                      ? '-top-2.5 text-xs bg-white dark:bg-gray-900 px-2 text-purple-600 dark:text-purple-400'
                                      : 'top-4 text-gray-500 dark:text-gray-400'
                                  }`}
                                >
                                  {t('auth.password', '비밀번호', 'Password', 'パスワード')}
                                </motion.label>
                                <motion.button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                >
                                  <AnimatePresence mode="wait">
                                    {showPassword ? (
                                      <motion.div
                                        key="eye-off"
                                        initial={{ rotate: -90, opacity: 0 }}
                                        animate={{ rotate: 0, opacity: 1 }}
                                        exit={{ rotate: 90, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                      >
                                        <EyeOff className="w-5 h-5" />
                                      </motion.div>
                                    ) : (
                                      <motion.div
                                        key="eye"
                                        initial={{ rotate: 90, opacity: 0 }}
                                        animate={{ rotate: 0, opacity: 1 }}
                                        exit={{ rotate: -90, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                      >
                                        <Eye className="w-5 h-5" />
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </motion.button>
                              </div>
                            </div>

                            {/* Submit button with liquid animation */}
                            <motion.button
                              type="submit"
                              disabled={isLoading}
                              className="relative w-full group overflow-hidden"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-500 dark:to-blue-500" />
                              <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-purple-700 to-blue-700 dark:from-purple-600 dark:to-blue-600"
                                initial={{ x: '100%' }}
                                whileHover={{ x: 0 }}
                                transition={{ duration: 0.3 }}
                              />
                              <div className="relative flex items-center justify-center py-4 text-white font-medium rounded-xl">
                                <AnimatePresence mode="wait">
                                  {isLoading ? (
                                    <motion.div
                                      key="loading"
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      exit={{ scale: 0 }}
                                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"
                                    />
                                  ) : (
                                    <motion.span
                                      key="text"
                                      initial={{ y: 20, opacity: 0 }}
                                      animate={{ y: 0, opacity: 1 }}
                                      exit={{ y: -20, opacity: 0 }}
                                      className="flex items-center gap-2"
                                    >
                                      {t('auth.login', '로그인', 'Login', 'ログイン')}
                                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </motion.span>
                                  )}
                                </AnimatePresence>
                              </div>
                            </motion.button>
                          </form>

                          <motion.div
                            className="mt-6 text-center space-y-4"
                            variants={itemVariants}
                          >
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {t('auth.forgotPassword', '비밀번호를 잊으셨나요?', 'Forgot your password?', 'パスワードをお忘れですか？')}
                              </p>
                              <motion.button
                                className="text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-medium mt-1"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                {t('auth.resetPassword', '비밀번호 재설정', 'Reset password', 'パスワードをリセット')}
                              </motion.button>
                            </div>

                            <div className="relative">
                              <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                              </div>
                              <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white dark:bg-gray-900 text-gray-500">
                                  {t('auth.or', '또는', 'or', 'または')}
                                </span>
                              </div>
                            </div>

                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {t('auth.noAccount', '계정이 없으신가요?', "Don't have an account?", 'アカウントをお持ちでない方')}
                              </p>
                              <Link
                                to="/register"
                                className="inline-block text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-medium mt-1"
                              >
                                <motion.span
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  className="inline-block"
                                >
                                  {t('auth.signUp', '회원가입', 'Sign up', '新規登録')}
                                </motion.span>
                              </Link>
                            </div>
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                )}
              </AnimatePresence>

              {/* Security Notice with shield animation */}
              <motion.div
                className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700"
                variants={itemVariants}
              >
                <div className="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <motion.div
                    animate={{
                      rotate: [0, 10, -10, 0]
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: 'easeInOut'
                    }}
                  >
                    <Shield className="w-4 h-4" />
                  </motion.div>
                  <span>{t('auth.securityNotice', '안전한 SSL 암호화 연결', 'Secure SSL encrypted connection', '安全なSSL暗号化接続')}</span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}
