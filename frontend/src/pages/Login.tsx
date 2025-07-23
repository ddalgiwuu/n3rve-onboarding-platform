import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/auth.store'
import useSafeStore from '@/hooks/useSafeStore'
import { useTranslation } from '@/hooks/useTranslation'
import LanguageToggle from '@/components/common/LanguageToggle'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import api from '@/lib/api'

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loginMethod, setLoginMethod] = useState<'google' | 'email'>('google')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const isAuthenticated = useSafeStore(useAuthStore, (state) => state.isAuthenticated)
  const setAuth = useSafeStore(useAuthStore, (state) => state.setAuth)
  const { t } = useTranslation()
  const popupRef = useRef<Window | null>(null)
  
  // Component mounted
  useEffect(() => {
    // Component initialization
  }, [])
  
  // Check for OAuth error in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search)
    const error = urlParams.get('error')
    
    if (error === 'oauth_failed') {
      toast.error(t('auth.oauthFailed', 'OAuth 인증에 실패했습니다', 'OAuth authentication failed', 'OAuth認証に失敗しました'))
    }
  }, [location, t])
  
  // Handle messages from popup window (Safari OAuth flow)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Verify origin
      if (event.origin !== window.location.origin) return
      
      // Handle auth callback message
      if (event.data?.type === 'auth-callback') {
        if (event.data.success && event.data.accessToken && event.data.refreshToken) {
          // Redirect to auth callback with tokens
          const params = new URLSearchParams({
            access_token: event.data.accessToken,
            refresh_token: event.data.refreshToken,
            profile_complete: event.data.profileComplete?.toString() || 'false'
          })
          navigate(`/auth/callback?${params.toString()}`)
        } else {
          setIsLoading(false)
          toast.error(t('auth.loginFailed', '로그인에 실패했습니다', 'Login failed', 'ログインに失敗しました'))
        }
      }
    }
    
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [navigate])

  const handleGoogleLogin = () => {
    setIsLoading(true)
    // Get the returnUrl from location state or query params
    const returnUrl = location.state?.from || new URLSearchParams(location.search).get('returnUrl') || '/dashboard'
    
    // Store returnUrl in sessionStorage to persist across OAuth redirect
    sessionStorage.setItem('returnUrl', returnUrl)
    
    const googleAuthUrl = `${import.meta.env.VITE_API_URL}/auth/google`
    
    // Safari-friendly approach: Use popup window for OAuth
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
    
    if (isSafari) {
      // Open OAuth in a popup for Safari
      const width = 500
      const height = 600
      const left = (window.screen.width - width) / 2
      const top = (window.screen.height - height) / 2
      
      popupRef.current = window.open(
        googleAuthUrl,
        'google-auth',
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no`
      )
      
      if (!popupRef.current) {
        toast.error(t('auth.popupBlocked', '팝업이 차단되었습니다. 팝업 차단을 해제해주세요.', 'Popup blocked. Please allow popups and try again.', 'ポップアップがブロックされました。ポップアップを許可してください'))
        setIsLoading(false)
        return
      }
      
      // Focus the popup
      popupRef.current.focus()
    } else {
      // Standard redirect for other browsers
      window.location.href = googleAuthUrl
    }
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      toast.error(t('auth.fillAllFields', '모든 필드를 입력해주세요', 'Please fill in all fields', 'すべての項目を入力してください'))
      return
    }
    
    setIsLoading(true)
    
    try {
      const response = await api.post('/auth/login', {
        email,
        password
      })
      
      const { user, accessToken, refreshToken } = response.data
      
      // Set auth in store
      setAuth?.(user, accessToken, refreshToken)
      
      // Get return URL
      const returnUrl = location.state?.from || new URLSearchParams(location.search).get('returnUrl') || '/dashboard'
      
      // Check if user needs to select role or complete profile
      if (user.role === 'ADMIN' && user.isProfileComplete) {
        // Store tokens temporarily for role selection
        sessionStorage.setItem('temp_access_token', accessToken)
        sessionStorage.setItem('temp_refresh_token', refreshToken)
        sessionStorage.setItem('temp_user', JSON.stringify(user))
        navigate('/role-select')
      } else if (!user.isProfileComplete) {
        navigate('/profile-setup')
      } else {
        navigate(returnUrl)
      }
      
      toast.success(t('auth.loginSuccess', '로그인되었습니다', 'Logged in successfully', 'ログインしました'))
    } catch (error: any) {
      console.error('Login error:', error)
      if (error.response?.status === 401) {
        toast.error(t('auth.invalidCredentials', '이메일 또는 비밀번호가 올바르지 않습니다', 'Invalid email or password', 'メールアドレスまたはパスワードが正しくありません'))
      } else {
        toast.error(t('auth.loginFailed'))
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>
      
      {/* Language Toggle in header */}
      <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-50">
        <LanguageToggle />
      </div>
      
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white dark:bg-gray-800/50 backdrop-blur-xl rounded-2xl shadow-2xl p-8 sm:p-10 animate-scale-in border border-white/20 dark:border-gray-700/50">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl mb-4 shadow-lg animate-bounce-slow">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent">
              N3RVE Platform
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {t('auth.subtitle', '공식 음원 유통 플랫폼', 'Official Music Distribution Platform', '公式音楽配信プラットフォーム')}
            </p>
          </div>

          {/* Login Method Tabs */}
          <div className="flex rounded-lg bg-gray-100 dark:bg-gray-700/50 p-1 mb-6">
            <button
              onClick={() => setLoginMethod('google')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                loginMethod === 'google'
                  ? 'bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              {t('auth.googleLogin', 'Google 로그인', 'Google Login', 'Googleログイン')}
            </button>
            <button
              onClick={() => setLoginMethod('email')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                loginMethod === 'email'
                  ? 'bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              {t('auth.emailLogin', '이메일 로그인', 'Email Login', 'メールログイン')}
            </button>
          </div>

          {loginMethod === 'google' ? (
            <>
              {/* Google Login */}
              <button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 group"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-gray-300 dark:border-gray-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
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
                    <span className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-gray-700 dark:group-hover:text-white">
                      {t('auth.continueWithGoogle', 'Google로 계속하기', 'Continue with Google', 'Googleで続ける')}
                    </span>
                  </>
                )}
              </button>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('auth.noAccount', '계정이 없으신가요?', "Don't have an account?", 'アカウントがありませんか？')}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  {t('auth.contactAdmin', '관리자에게 계정 생성을 요청하세요', 'Contact admin for account creation', '管理者にアカウント作成を依頼してください')}
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Email Login Form */}
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('auth.email', '이메일', 'Email', 'メールアドレス')}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-gray-900 dark:text-white"
                      placeholder={t('auth.emailPlaceholder', '이메일을 입력하세요', 'Enter your email', 'メールアドレスを入力')}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('auth.password', '비밀번호', 'Password', 'パスワード')}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-12 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-gray-900 dark:text-white"
                      placeholder={t('auth.passwordPlaceholder', '비밀번호를 입력하세요', 'Enter your password', 'パスワードを入力')}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                  ) : (
                    t('auth.login', '로그인', 'Login', 'ログイン')
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('auth.forgotPassword', '비밀번호를 잊으셨나요?', 'Forgot your password?', 'パスワードをお忘れですか？')}
                </p>
                <button className="text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-medium mt-1">
                  {t('auth.resetPassword', '비밀번호 재설정', 'Reset password', 'パスワードをリセット')}
                </button>
              </div>
            </>
          )}

          {/* Security Notice */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
              {t('auth.securityNotice', '안전한 SSL 암호화 연결', 'Secure SSL encrypted connection', '安全なSSL暗号化接続')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}