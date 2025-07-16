class AuthService {
  getToken(): string | null {
    try {
      console.log('AuthService: Getting token from localStorage...')
      const storedValue = localStorage.getItem('auth-storage')
      console.log('AuthService: Raw stored value:', storedValue)
      
      if (storedValue) {
        const parsed = JSON.parse(storedValue)
        console.log('AuthService: Parsed auth storage:', JSON.stringify(parsed, null, 2))
        
        const token = parsed.state?.accessToken || parsed.accessToken || null
        console.log('AuthService: Extracted token:', token ? 'Present (length: ' + token.length + ')' : 'Not found')
        
        if (token) {
          // Try to decode JWT payload for debugging (without verification)
          try {
            const payloadBase64 = token.split('.')[1]
            const payload = JSON.parse(atob(payloadBase64))
            console.log('AuthService: Token payload:', JSON.stringify(payload, null, 2))
            console.log('AuthService: Token user ID:', payload.sub || payload.userId || 'Unknown')
            console.log('AuthService: Token expires:', payload.exp ? new Date(payload.exp * 1000).toISOString() : 'Unknown')
          } catch (decodeError) {
            console.error('AuthService: Failed to decode token payload:', decodeError)
          }
        }
        
        return token
      }
      
      console.log('AuthService: No auth storage found')
      return null
    } catch (error) {
      console.error('AuthService: Error getting auth token:', error)
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
      console.error('Error getting refresh token:', error)
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