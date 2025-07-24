class AuthService {
  private refreshPromise: Promise<string | null> | null = null

  parseJwt(token: string): any {
    try {
      const base64Url = token.split('.')[1]
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => 
        '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      ).join(''))
      return JSON.parse(jsonPayload)
    } catch (error) {
      console.error('AuthService: parseJwt error:', error)
      return null
    }
  }

  isTokenExpired(token: string): boolean {
    const payload = this.parseJwt(token)
    if (!payload || !payload.exp) {
      console.log('AuthService: Token has no expiration or invalid payload')
      return true
    }
    
    const currentTime = Math.floor(Date.now() / 1000)
    const expirationTime = payload.exp
    const bufferTime = 60 // 1 minute buffer before actual expiration
    
    console.log('AuthService: Token expiration check:', {
      currentTime: new Date(currentTime * 1000).toISOString(),
      expirationTime: new Date(expirationTime * 1000).toISOString(),
      timeUntilExpiry: expirationTime - currentTime,
      bufferTime: bufferTime,
      isExpired: currentTime >= (expirationTime - bufferTime)
    })
    
    return currentTime >= (expirationTime - bufferTime)
  }

  async refreshAccessToken(): Promise<string | null> {
    // Prevent multiple simultaneous refresh attempts
    if (this.refreshPromise) {
      console.log('AuthService: Refresh already in progress, waiting...')
      return this.refreshPromise
    }

    this.refreshPromise = this._performRefresh()
    
    try {
      const result = await this.refreshPromise
      return result
    } finally {
      this.refreshPromise = null
    }
  }

  private async _performRefresh(): Promise<string | null> {
    try {
      const refreshToken = this.getRefreshToken()
      if (!refreshToken) {
        console.log('AuthService: No refresh token available')
        return null
      }

      console.log('AuthService: Attempting to refresh access token...')
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      })

      if (!response.ok) {
        console.error('AuthService: Failed to refresh token:', response.status)
        if (response.status === 401) {
          // Refresh token is invalid, logout user
          this.logout()
        }
        return null
      }

      const data = await response.json()
      
      // Update stored tokens
      const storedValue = localStorage.getItem('auth-storage')
      if (storedValue) {
        const parsed = JSON.parse(storedValue)
        
        // Update both state and root level for compatibility
        if (parsed.state) {
          parsed.state.accessToken = data.accessToken
          if (data.refreshToken) {
            parsed.state.refreshToken = data.refreshToken
          }
        } else {
          parsed.accessToken = data.accessToken
          if (data.refreshToken) {
            parsed.refreshToken = data.refreshToken
          }
        }
        
        // Update expiration time
        const tokenPayload = this.parseJwt(data.accessToken)
        if (tokenPayload && tokenPayload.exp) {
          parsed.exp = tokenPayload.exp
        }
        
        localStorage.setItem('auth-storage', JSON.stringify(parsed))
        console.log('AuthService: Access token refreshed successfully')
      }
      
      return data.accessToken
    } catch (error) {
      console.error('AuthService: Error refreshing token:', error)
      return null
    }
  }

  async getToken(): Promise<string | null> {
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
        
        if (token) {
          const isExpired = this.isTokenExpired(token)
          console.log('AuthService: Token expired check:', isExpired)
          
          if (isExpired) {
            console.log('AuthService: Token expired, attempting refresh...')
            const newToken = await this.refreshAccessToken()
            return newToken || null
          }
        }
        
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

  // Synchronous method to check if token exists (doesn't check expiration)
  hasToken(): boolean {
    try {
      const storedValue = localStorage.getItem('auth-storage')
      if (storedValue) {
        const parsed = JSON.parse(storedValue)
        const token = parsed.state?.accessToken || parsed.accessToken || null
        return !!token
      }
      return false
    } catch (error) {
      return false
    }
  }

  // Async method that checks token validity and refreshes if needed
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken()
    return !!token
  }

  logout(): void {
    localStorage.removeItem('auth-storage')
  }

  async register(data: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    company?: string;
    isCompanyAccount?: boolean;
  }): Promise<any> {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Registration failed')
      }

      return await response.json()
    } catch (error) {
      console.error('AuthService: Registration error:', error)
      throw error
    }
  }
}

export const authService = new AuthService()