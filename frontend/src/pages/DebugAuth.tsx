import { useEffect } from 'react'
import { useAuthStore } from '@/store/auth.store'
import { useNavigate } from 'react-router-dom'

export default function DebugAuth() {
  const authState = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    // Log current auth state
    console.log('=== AUTH DEBUG ===')
    console.log('isAuthenticated:', authState.isAuthenticated)
    console.log('user:', authState.user)
    console.log('accessToken:', authState.accessToken)
    console.log('localStorage auth-storage:', localStorage.getItem('auth-storage'))
    console.log('==================')
  }, [authState])

  const clearAllAuth = () => {
    // Clear zustand store
    authState.clearAuth()
    
    // Clear localStorage
    localStorage.removeItem('auth-storage')
    sessionStorage.clear()
    
    // Force reload
    window.location.href = '/'
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Auth Debug Page</h1>
        
        <div className="bg-white p-6 rounded shadow mb-4">
          <h2 className="text-lg font-semibold mb-2">Current Auth State</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify({
              isAuthenticated: authState.isAuthenticated,
              user: authState.user,
              hasAccessToken: !!authState.accessToken,
              hasRefreshToken: !!authState.refreshToken
            }, null, 2)}
          </pre>
        </div>

        <div className="bg-white p-6 rounded shadow mb-4">
          <h2 className="text-lg font-semibold mb-2">LocalStorage</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {localStorage.getItem('auth-storage') || 'No auth-storage found'}
          </pre>
        </div>

        <div className="flex gap-4">
          <button
            onClick={clearAllAuth}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Clear All Auth & Reload
          </button>
          
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go to Home
          </button>
          
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    </div>
  )
}