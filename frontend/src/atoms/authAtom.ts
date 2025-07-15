import { atom } from 'jotai'

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

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  _hasHydrated: false
}

// Main auth atom - simple atom without localStorage integration
export const authAtom = atom<AuthState>(initialState)

// Hydration status atom
export const authHydratedAtom = atom(false)

// Derived atoms for specific fields
export const userAtom = atom(
  (get) => get(authAtom).user,
  (get, set, user: User | null) => {
    const current = get(authAtom)
    set(authAtom, { ...current, user, isAuthenticated: !!user && !!current.accessToken })
  }
)

export const accessTokenAtom = atom(
  (get) => get(authAtom).accessToken,
  (get, set, token: string | null) => {
    const current = get(authAtom)
    set(authAtom, { ...current, accessToken: token, isAuthenticated: !!current.user && !!token })
  }
)

export const refreshTokenAtom = atom(
  (get) => get(authAtom).refreshToken,
  (get, set, token: string | null) => {
    const current = get(authAtom)
    set(authAtom, { ...current, refreshToken: token })
  }
)

export const isAuthenticatedAtom = atom((get) => get(authAtom).isAuthenticated)

// Action atoms
export const setAuthAtom = atom(
  null,
  (get, set, { user, accessToken, refreshToken }: { user: User; accessToken: string; refreshToken: string }) => {
    set(authAtom, {
      user,
      accessToken,
      refreshToken,
      isAuthenticated: true,
      _hasHydrated: true
    })
  }
)

export const clearAuthAtom = atom(
  null,
  (get, set) => {
    set(authAtom, {
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      _hasHydrated: true
    })
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('auth-storage')
      } catch (error) {
        console.warn('Failed to remove auth from localStorage:', error)
      }
    }
  }
)

export const updateTokensAtom = atom(
  null,
  (get, set, { accessToken, refreshToken }: { accessToken: string; refreshToken: string }) => {
    const current = get(authAtom)
    set(authAtom, {
      ...current,
      accessToken,
      refreshToken
    })
  }
)