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
  const [languageState] = useAtom(languageAtom)
  const [language, setLanguage] = useAtom(currentLanguageAtom)
  const [hasHydrated, setHasHydrated] = useAtom(languageHydratedAtom)
  
  // Mark as hydrated after first render
  useEffect(() => {
    setHasHydrated(true)
  }, [setHasHydrated])
  
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