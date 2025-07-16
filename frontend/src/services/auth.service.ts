class AuthService {
  getToken(): string | null {
    try {
      const storedValue = localStorage.getItem('auth-storage')
      if (storedValue) {
        const parsed = JSON.parse(storedValue)
        return parsed.state?.accessToken || parsed.accessToken || null
      }
      return null
    } catch (error) {
      console.error('Error getting auth token:', error)
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