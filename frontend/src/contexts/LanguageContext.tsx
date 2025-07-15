import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

// Import translations (you'll need to extract these from the current language.store.ts)
import { translations } from '../translations'

type Language = 'ko' | 'en'

interface LanguageState {
  language: Language
  _hasHydrated: boolean
  setLanguage: (language: Language) => void
  setHasHydrated: (state: boolean) => void
}

const LanguageContext = createContext<LanguageState | undefined>(undefined)

const STORAGE_KEY = 'language-storage'

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('ko')
  const [_hasHydrated, setHasHydrated] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const data = JSON.parse(stored)
        if (data.state && data.state.language) {
          setLanguageState(data.state.language)
        }
      }
    } catch (error) {
      console.error('Failed to load language state:', error)
    } finally {
      setHasHydrated(true)
    }
  }, [])

  // Save to localStorage on state change
  useEffect(() => {
    if (_hasHydrated) {
      try {
        const data = {
          state: {
            language,
            _hasHydrated: true
          },
          version: 0
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      } catch (error) {
        console.error('Failed to save language state:', error)
      }
    }
  }, [language, _hasHydrated])

  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage)
  }

  const value: LanguageState = {
    language,
    _hasHydrated,
    setLanguage,
    setHasHydrated
  }

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguageStore() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguageStore must be used within LanguageProvider')
  }
  return context
}

export function useTranslation() {
  const { language } = useLanguageStore()

  const t = (key: string): string => {
    const keys = key.split('.')
    let current: any = translations[language]
    
    for (const k of keys) {
      if (!current || typeof current !== 'object') {
        console.warn(`Translation key not found: ${key}`)
        return key
      }
      current = current[k]
    }
    
    return current || key
  }

  return { t, language }
}

// Mimic zustand persist API for compatibility
export const useLanguageStorePersist = {
  rehydrate: async () => {
    // No-op as hydration happens automatically
  }
}