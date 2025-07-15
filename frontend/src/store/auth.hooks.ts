import { useState, useEffect, useCallback } from 'react'
import { authStore } from './auth.vanilla'

// Custom hook to use the vanilla store in React
export const useAuthStore = () => {
  const [state, setState] = useState(() => authStore.getState())
  
  useEffect(() => {
    // Subscribe to store changes
    const unsubscribe = authStore.subscribe(setState)
    return unsubscribe
  }, [])
  
  // Create memoized actions
  const setAuth = useCallback((user: any, accessToken: string, refreshToken: string) => {
    authStore.getState().setAuth(user, accessToken, refreshToken)
  }, [])
  
  const clearAuth = useCallback(() => {
    authStore.getState().clearAuth()
  }, [])
  
  const logout = useCallback(() => {
    authStore.getState().logout()
  }, [])
  
  const updateTokens = useCallback((accessToken: string, refreshToken: string) => {
    authStore.getState().updateTokens(accessToken, refreshToken)
  }, [])
  
  const setHasHydrated = useCallback((hydrated: boolean) => {
    authStore.getState().setHasHydrated(hydrated)
  }, [])
  
  return {
    ...state,
    setAuth,
    clearAuth,
    logout,
    updateTokens,
    setHasHydrated
  }
}

// Selector hook for specific values
export const useAuthStoreSelector = <T,>(selector: (state: any) => T): T => {
  const [selected, setSelected] = useState<T>(() => selector(authStore.getState()))
  
  useEffect(() => {
    const unsubscribe = authStore.subscribe((state) => {
      const newSelected = selector(state)
      setSelected(newSelected)
    })
    return unsubscribe
  }, [selector])
  
  return selected
}