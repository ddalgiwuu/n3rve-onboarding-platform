// Compatibility layer for Jotai migration
import { useAtom, useSetAtom } from 'jotai'
import { useEffect } from 'react'
import {
  languageAtom,
  languageHydratedAtom,
  currentLanguageAtom,
  setLanguageAtom
} from '@/atoms/languageAtom'

export function useLanguageStore() {
  const [languageState, setLanguageState] = useAtom(languageAtom)
  const [language, setLanguage] = useAtom(currentLanguageAtom)
  const [hasHydrated, setHasHydrated] = useAtom(languageHydratedAtom)
  
  // Load from localStorage on first render
  useEffect(() => {
    if (typeof window !== 'undefined' && !hasHydrated) {
      try {
        const storedValue = localStorage.getItem('language-storage')
        if (storedValue) {
          const parsed = JSON.parse(storedValue)
          // Handle legacy format from zustand/redux
          if (parsed.state) {
            setLanguageState({
              language: parsed.state.language || 'ko',
              _hasHydrated: true
            })
          } else {
            setLanguageState({ ...parsed, _hasHydrated: true })
          }
        }
      } catch (error) {
        console.warn('Failed to load language from localStorage:', error)
      }
      setHasHydrated(true)
    }
  }, [hasHydrated, setLanguageState, setHasHydrated])
  
  // Save to localStorage when language state changes
  useEffect(() => {
    if (typeof window !== 'undefined' && hasHydrated) {
      try {
        const dataToStore = {
          state: languageState,
          version: 0
        }
        localStorage.setItem('language-storage', JSON.stringify(dataToStore))
      } catch (error) {
        console.warn('Failed to save language to localStorage:', error)
      }
    }
  }, [languageState, hasHydrated])
  
  return {
    language,
    _hasHydrated: hasHydrated,
    setLanguage,
    setHasHydrated: (state: boolean) => setHasHydrated(state)
  }
}

// Translation hook (simplified version)
export function useTranslation() {
  const { language } = useLanguageStore()
  
  const t = (key: string): string => {
    // For now, just return the key
    // This would normally look up translations
    return key
  }
  
  return { t, language }
}

// Mimic zustand persist API for compatibility
export const useLanguageStorePersist = {
  rehydrate: async () => {
    // No-op as hydration happens automatically in Jotai
  }
}