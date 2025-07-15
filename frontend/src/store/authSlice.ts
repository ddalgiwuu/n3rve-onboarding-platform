import { createSlice, PayloadAction } from '@reduxjs/toolkit'

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
}

// Load from localStorage
const loadAuthState = (): Partial<AuthState> => {
  try {
    const stored = localStorage.getItem('auth-storage')
    if (stored) {
      const data = JSON.parse(stored)
      if (data.state) {
        return data.state
      }
    }
  } catch (error) {
    console.error('Failed to load auth state:', error)
  }
  return {}
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  _hasHydrated: false,
  ...loadAuthState()
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setHasHydrated: (state, action: PayloadAction<boolean>) => {
      state._hasHydrated = action.payload
    },
    setAuth: (state, action: PayloadAction<{ user: User; accessToken: string; refreshToken: string }>) => {
      state.user = action.payload.user
      state.accessToken = action.payload.accessToken
      state.refreshToken = action.payload.refreshToken
      state.isAuthenticated = true
      
      // Save to localStorage
      try {
        const data = {
          state: {
            user: state.user,
            accessToken: state.accessToken,
            refreshToken: state.refreshToken,
            isAuthenticated: state.isAuthenticated,
            _hasHydrated: state._hasHydrated
          },
          version: 0
        }
        localStorage.setItem('auth-storage', JSON.stringify(data))
      } catch (error) {
        console.error('Failed to save auth state:', error)
      }
    },
    clearAuth: (state) => {
      state.user = null
      state.accessToken = null
      state.refreshToken = null
      state.isAuthenticated = false
      localStorage.removeItem('auth-storage')
    },
    updateTokens: (state, action: PayloadAction<{ accessToken: string; refreshToken: string }>) => {
      state.accessToken = action.payload.accessToken
      state.refreshToken = action.payload.refreshToken
      
      // Update localStorage
      try {
        const stored = localStorage.getItem('auth-storage')
        if (stored) {
          const data = JSON.parse(stored)
          data.state.accessToken = action.payload.accessToken
          data.state.refreshToken = action.payload.refreshToken
          localStorage.setItem('auth-storage', JSON.stringify(data))
        }
      } catch (error) {
        console.error('Failed to update tokens:', error)
      }
    }
  }
})

export const { setHasHydrated, setAuth, clearAuth, updateTokens } = authSlice.actions
export default authSlice.reducer