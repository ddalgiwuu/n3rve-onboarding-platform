class AuthService {
  getToken(): string | null {
    try {
      const storedValue = localStorage.getItem('auth-storage')
      console.log('AuthService: getToken - localStorage auth-storage exists:', !!storedValue)
      
      if (storedValue) {
        const parsed = JSON.parse(storedValue)
        console.log('AuthService: getToken - parsed structure:', Object.keys(parsed))
        console.log('AuthService: getToken - has state:', !!parsed.state)
        console.log('AuthService: getToken - state.accessToken:', !!parsed.state?.accessToken)
        
        const token = parsed.state?.accessToken || parsed.accessToken || null
        console.log('AuthService: getToken - final token exists:', !!token)
        
        return token
      }
      
      return null
    } catch (error) {
      console.error('AuthService: getToken error:', error)
      return null
    }
  }

  getRefreshToken(): string | null {
    try {
      const storedValue = localStorage.getItem('auth-storage')
      if (storedValue) {
        const parsed = JSON.parse(storedValue)
        return parsed.state?.refreshToken || parsed.refreshToken || null
      }
      return null
    } catch (error) {
      // Error handled silently for security
      return null
    }
  }

  isAuthenticated(): boolean {
    return !!this.getToken()
  }

  logout(): void {
    localStorage.removeItem('auth-storage')
  }
}

export const authService = new AuthService()