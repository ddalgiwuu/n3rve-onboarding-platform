import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import toast from 'react-hot-toast'
import LoadingSpinner from '@/components/common/LoadingSpinner'

export default function AuthCallback() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const setAuth = useAuthStore(state => state.setAuth)

  useEffect(() => {
    const handleAuth = async () => {
      const accessToken = searchParams.get('access_token')
      const refreshToken = searchParams.get('refresh_token')
      const profileComplete = searchParams.get('profile_complete') === 'true'

      if (!accessToken || !refreshToken) {
        toast.error('로그인에 실패했습니다')
        navigate('/login')
        return
      }

      try {
        // Get user profile
        const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/profile`, {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        })

        if (!response.ok) {
          throw new Error('Failed to fetch profile')
        }

        const user = await response.json()

        // Set auth in store
        setAuth(user, accessToken, refreshToken)

        // Get return URL from session storage
        const returnUrl = sessionStorage.getItem('returnUrl')
        sessionStorage.removeItem('returnUrl')

        // Check if user is admin and show role selection
        if (user.role === 'ADMIN' && profileComplete) {
          // Store tokens temporarily for role selection
          sessionStorage.setItem('temp_access_token', accessToken)
          sessionStorage.setItem('temp_refresh_token', refreshToken)
          sessionStorage.setItem('temp_user', JSON.stringify(user))
          navigate('/role-select')
        } else if (!profileComplete) {
          navigate('/profile-complete')
        } else {
          navigate(returnUrl || '/dashboard')
        }

        toast.success('로그인되었습니다')
      } catch (error) {
        console.error('Auth error:', error)
        toast.error('로그인 처리 중 오류가 발생했습니다')
        navigate('/login')
      }
    }

    handleAuth()
  }, [searchParams, navigate, setAuth])

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900 flex items-center justify-center">
      <div className="card-glass p-8 flex items-center gap-4 animate-scale-in">
        <LoadingSpinner />
        <span className="text-gray-600 dark:text-gray-400 font-medium">로그인 중...</span>
      </div>
    </div>
  )
}