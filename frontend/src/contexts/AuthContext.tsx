import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'CUSTOMER'
  companyName?: string
  artistName?: string
  profilePicture?: string
}

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  _hasHydrated: boolean
  setHasHydrated: (state: boolean) => void
  setAuth: (user: User, accessToken: string, refreshToken: string) => void
  clearAuth: () => void
  logout: () => void
  updateTokens: (accessToken: string, refreshToken: string) => void
}

const AuthContext = createContext<AuthState | undefined>(undefined)

const STORAGE_KEY = 'auth-storage'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [refreshToken, setRefreshToken] = useState<string | null>(null)
  const [_hasHydrated, setHasHydrated] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const data = JSON.parse(stored)
        if (data.state) {
          setUser(data.state.user)
          setAccessToken(data.state.accessToken)
          setRefreshToken(data.state.refreshToken)
        }
      }
    } catch (error) {
      console.error('Failed to load auth state:', error)
    } finally {
      setHasHydrated(true)
    }
  }, [])

  // Save to localStorage on state change
  useEffect(() => {
    if (_hasHydrated) {
      try {
        const data = {
          state: {
            user,
            accessToken,
            refreshToken,
            isAuthenticated: !!user && !!accessToken,
            _hasHydrated: true
          },
          version: 0
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      } catch (error) {
        console.error('Failed to save auth state:', error)
      }
    }
  }, [user, accessToken, refreshToken, _hasHydrated])

  const setAuth = (newUser: User, newAccessToken: string, newRefreshToken: string) => {
    setUser(newUser)
    setAccessToken(newAccessToken)
    setRefreshToken(newRefreshToken)
  }

  const clearAuth = () => {
    setUser(null)
    setAccessToken(null)
    setRefreshToken(null)
    localStorage.removeItem(STORAGE_KEY)
  }

  const logout = clearAuth

  const updateTokens = (newAccessToken: string, newRefreshToken: string) => {
    setAccessToken(newAccessToken)
    setRefreshToken(newRefreshToken)
  }

  const value: AuthState = {
    user,
    accessToken,
    refreshToken,
    isAuthenticated: !!user && !!accessToken,
    _hasHydrated,
    setHasHydrated,
    setAuth,
    clearAuth,
    logout,
    updateTokens
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthStore() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuthStore must be used within AuthProvider')
  }
  return context
}

// Mimic zustand persist API for compatibility
export const useAuthStorePersist = {
  rehydrate: async () => {
    // No-op as hydration happens automatically
  }
}