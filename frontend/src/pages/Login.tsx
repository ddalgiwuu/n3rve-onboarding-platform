import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/auth.store'
import useSafeStore from '@/hooks/useSafeStore'
import { useTranslation } from '@/hooks/useTranslation'
import LanguageToggle from '@/components/common/LanguageToggle'

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const isAuthenticated = useSafeStore(useAuthStore, (state) => state.isAuthenticated)
  const { t } = useTranslation()
  const popupRef = useRef<Window | null>(null)
  
  // Debug logging
  useEffect(() => {
    console.log('[LoginPage] Mounted')
    console.log('[LoginPage] Location:', location)
    console.log('[LoginPage] isAuthenticated:', isAuthenticated)
  }, [])
  
  // Check for OAuth error in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search)
    const error = urlParams.get('error')
    
    if (error === 'oauth_failed') {
      toast.error(t('auth.oauthFailed'))
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
          toast.error(t('auth.loginFailed'))
        }
      }
    }
    
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [navigate])

  const handleGoogleLogin = () => {
    console.log('[LoginPage] handleGoogleLogin called')
    setIsLoading(true)
    // Get the returnUrl from location state or query params
    const returnUrl = location.state?.from || new URLSearchParams(location.search).get('returnUrl') || '/dashboard'
    
    // Store returnUrl in sessionStorage to persist across OAuth redirect
    sessionStorage.setItem('returnUrl', returnUrl)
    
    const googleAuthUrl = `${import.meta.env.VITE_API_URL}/auth/google`
    console.log('[LoginPage] Redirecting to:', googleAuthUrl)
    
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
        toast.error(t('auth.popupBlocked'))
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-60 h-60 sm:w-80 sm:h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-60 h-60 sm:w-80 sm:h-80 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 sm:w-80 sm:h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>
      <div className="absolute top-4 right-4 z-10">
        <LanguageToggle />
      </div>
      <div className="w-full max-w-md animate-scale-in">
        <div className="glass-effect-strong rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-xl">
          <div className="text-center mb-6 sm:mb-8">
            <img 
              src="/assets/logos/n3rve-logo.svg" 
              alt="N3RVE" 
              className="h-10 sm:h-12 w-auto mx-auto mb-4 dark:hidden"
            />
            <img 
              src="/assets/logos/n3rve-logo-white.svg" 
              alt="N3RVE" 
              className="h-10 sm:h-12 w-auto mx-auto mb-4 hidden dark:block"
            />
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white leading-tight">
              {t('auth.welcomeTitle')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm sm:text-base">
              {t('auth.welcomeSubtitle')}
            </p>
          </div>

          <div className="space-y-4 sm:space-y-6">
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 py-3 sm:py-4 px-4 btn-glass text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>{isLoading ? t('auth.signingIn') : t('auth.continueWithGoogle')}</span>
            </button>


            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300 dark:border-gray-600"></span>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 glass-effect rounded-full text-gray-500 dark:text-gray-400">
                  {t('auth.secureLogin')}
                </span>
              </div>
            </div>

            <div className="text-center">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {t('auth.googleLoginDescription')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}