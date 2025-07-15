import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

type Language = 'ko' | 'en'

interface LanguageState {
  language: Language
  _hasHydrated: boolean
}

const initialState: LanguageState = {
  language: 'ko',
  _hasHydrated: false
}

// Main language atom with localStorage persistence
export const languageAtom = atomWithStorage<LanguageState>('language-storage', initialState, {
  getItem: (key, initialValue) => {
    if (typeof window === 'undefined') return initialValue
    
    try {
      const storedValue = localStorage.getItem(key)
      if (!storedValue) return initialValue
      
      const parsed = JSON.parse(storedValue)
      // Handle legacy format from zustand/redux
      if (parsed.state) {
        return {
          language: parsed.state.language || 'ko',
          _hasHydrated: true
        }
      }
      return { ...parsed, _hasHydrated: true }
    } catch {
      return initialValue
    }
  },
  setItem: (key, value) => {
    if (typeof window === 'undefined') return
    
    try {
      const dataToStore = {
        state: value,
        version: 0
      }
      localStorage.setItem(key, JSON.stringify(dataToStore))
    } catch (error) {
      console.warn('Failed to save to localStorage:', error)
    }
  },
  removeItem: (key) => {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.warn('Failed to remove from localStorage:', error)
    }
  }
})

// Hydration status atom
export const languageHydratedAtom = atom(false)

// Derived atom for just the language value
export const currentLanguageAtom = atom(
  (get) => get(languageAtom).language,
  (get, set, language: Language) => {
    set(languageAtom, { language, _hasHydrated: true })
  }
)

// Action atom for setting language
export const setLanguageAtom = atom(
  null,
  (get, set, language: Language) => {
    set(languageAtom, { language, _hasHydrated: true })
  }
)