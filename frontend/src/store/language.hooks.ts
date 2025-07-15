import { useState, useEffect, useCallback } from 'react'
import { languageStore } from './language.vanilla'

// Custom hook to use the vanilla store in React
export const useLanguageStore = () => {
  const [state, setState] = useState(() => languageStore.getState())
  
  useEffect(() => {
    // Subscribe to store changes
    const unsubscribe = languageStore.subscribe(setState)
    return unsubscribe
  }, [])
  
  // Create memoized actions
  const setLanguage = useCallback((language: 'ko' | 'en') => {
    languageStore.getState().setLanguage(language)
  }, [])
  
  const setHasHydrated = useCallback((hydrated: boolean) => {
    languageStore.getState().setHasHydrated(hydrated)
  }, [])
  
  return {
    ...state,
    setLanguage,
    setHasHydrated
  }
}

// Selector hook for specific values
export const useLanguageStoreSelector = <T,>(selector: (state: any) => T): T => {
  const [selected, setSelected] = useState<T>(() => selector(languageStore.getState()))
  
  useEffect(() => {
    const unsubscribe = languageStore.subscribe((state) => {
      const newSelected = selector(state)
      setSelected(newSelected)
    })
    return unsubscribe
  }, [selector])
  
  return selected
}