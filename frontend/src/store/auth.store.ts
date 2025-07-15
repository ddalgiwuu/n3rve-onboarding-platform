// Compatibility layer for Jotai migration
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { useEffect } from 'react'
import {
  authAtom,
  authHydratedAtom,
  setAuthAtom,
  clearAuthAtom,
  updateTokensAtom
} from '@/atoms/authAtom'

export function useAuthStore() {
  const [authState, setAuthState] = useAtom(authAtom)
  const setAuth = useSetAtom(setAuthAtom)
  const clearAuth = useSetAtom(clearAuthAtom)
  const updateTokens = useSetAtom(updateTokensAtom)
  const [hasHydrated, setHasHydrated] = useAtom(authHydratedAtom)
  
  // Load from localStorage on first render
  useEffect(() => {
    if (typeof window !== 'undefined' && !hasHydrated) {
      try {
        const storedValue = localStorage.getItem('auth-storage')
        if (storedValue) {
          const parsed = JSON.parse(storedValue)
          // Handle legacy format from zustand/redux
          if (parsed.state) {
            setAuthState({
              ...parsed.state,
              _hasHydrated: true
            })
          } else {
            setAuthState({ ...parsed, _hasHydrated: true })
          }
        }
      } catch (error) {
        console.warn('Failed to load auth from localStorage:', error)
      }
      setHasHydrated(true)
    }
  }, [hasHydrated, setAuthState, setHasHydrated])
  
  // Save to localStorage when auth state changes
  useEffect(() => {
    if (typeof window !== 'undefined' && hasHydrated) {
      try {
        const dataToStore = {
          state: authState,
          version: 0
        }
        localStorage.setItem('auth-storage', JSON.stringify(dataToStore))
      } catch (error) {
        console.warn('Failed to save auth to localStorage:', error)
      }
    }
  }, [authState, hasHydrated])
  
  return {
    ...authState,
    _hasHydrated: hasHydrated,
    setAuth: (user: any, accessToken: string, refreshToken: string) => 
      setAuth({ user, accessToken, refreshToken }),
    clearAuth,
    logout: clearAuth,
    updateTokens: (accessToken: string, refreshToken: string) => 
      updateTokens({ accessToken, refreshToken }),
    setHasHydrated: (state: boolean) => setHasHydrated(state)
  }
}

// Mimic zustand persist API for compatibility
export const useAuthStorePersist = {
  rehydrate: async () => {
    // No-op as hydration happens automatically in Jotai
  }
}