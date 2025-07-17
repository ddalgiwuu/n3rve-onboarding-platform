class AuthService {
  getToken(): string | null {
    try {
      const storedValue = localStorage.getItem('auth-storage')
      
      if (storedValue) {
        const parsed = JSON.parse(storedValue)
        
        const token = parsed.state?.accessToken || parsed.accessToken || null
        
        // Token validation removed for security
        
        return token
      }
      
      return null
    } catch (error) {
      // Error handled silently for security
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