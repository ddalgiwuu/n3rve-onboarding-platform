import { createStore } from 'zustand/vanilla'

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

// Create vanilla store
export const authStore = createStore<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  _hasHydrated: false,
  
  setHasHydrated: (state) => {
    set({ _hasHydrated: state })
  },
  
  setAuth: (user, accessToken, refreshToken) => {
    set({
      user,
      accessToken,
      refreshToken,
      isAuthenticated: true
    })
  },
  
  clearAuth: () => {
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false
    })
  },
  
  logout: () => {
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false
    })
  },
  
  updateTokens: (accessToken, refreshToken) => {
    set({ accessToken, refreshToken })
  }
}))

// Initialize from localStorage
if (typeof window !== 'undefined') {
  const stored = localStorage.getItem('auth-storage')
  if (stored) {
    try {
      const parsed = JSON.parse(stored)
      if (parsed.state) {
        authStore.setState({
          ...parsed.state,
          _hasHydrated: true
        })
      }
    } catch (error) {
      console.error('Failed to parse auth storage:', error)
    }
  } else {
    authStore.setState({ _hasHydrated: true })
  }
}

// Subscribe to changes and persist
authStore.subscribe((state) => {
  const { _hasHydrated, setHasHydrated, setAuth, clearAuth, logout, updateTokens, ...persistState } = state
  localStorage.setItem('auth-storage', JSON.stringify({
    state: persistState,
    version: 0
  }))
})