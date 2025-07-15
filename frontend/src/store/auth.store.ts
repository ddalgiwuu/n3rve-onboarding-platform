import { create } from 'zustand'

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
  setAuth: (user: User, accessToken: string, refreshToken: string) => void
  clearAuth: () => void
  logout: () => void
  updateTokens: (accessToken: string, refreshToken: string) => void
}

// Get initial auth state from localStorage synchronously
const getInitialAuthState = () => {
  try {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('auth-storage')
      if (stored) {
        const parsed = JSON.parse(stored)
        const state = parsed.state || {}
        return {
          user: state.user || null,
          accessToken: state.accessToken || null,
          refreshToken: state.refreshToken || null,
          isAuthenticated: state.isAuthenticated || false
        }
      }
    }
  } catch (error) {
    console.warn('Failed to read auth from localStorage:', error)
  }
  return {
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false
  }
}

const saveAuthToStorage = (state: AuthState) => {
  try {
    localStorage.setItem('auth-storage', JSON.stringify({
      state: {
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated
      },
      version: 0
    }))
  } catch (error) {
    console.warn('Failed to save auth to localStorage:', error)
  }
}

export const useAuthStore = create<AuthState>()((set, get) => {
  const initialState = getInitialAuthState()
  
  return {
    ...initialState,
    
    setAuth: (user, accessToken, refreshToken) => {
      const newState = {
        user,
        accessToken,
        refreshToken,
        isAuthenticated: true
      }
      set(newState)
      saveAuthToStorage({ ...get(), ...newState })
    },
    
    clearAuth: () => {
      const newState = {
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false
      }
      set(newState)
      saveAuthToStorage({ ...get(), ...newState })
    },
    
    logout: () => {
      const newState = {
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false
      }
      set(newState)
      saveAuthToStorage({ ...get(), ...newState })
    },
    
    updateTokens: (accessToken, refreshToken) => {
      const newState = {
        accessToken,
        refreshToken
      }
      set(newState)
      saveAuthToStorage({ ...get(), ...newState })
    }
  }
})