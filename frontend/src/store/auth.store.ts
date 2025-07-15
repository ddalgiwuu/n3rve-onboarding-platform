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
  
  // Mark as hydrated after first render
  useEffect(() => {
    setHasHydrated(true)
  }, [setHasHydrated])
  
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