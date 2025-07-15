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
    const storedValue = localStorage.getItem(key)
    if (!storedValue) return initialValue
    
    try {
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
    const dataToStore = {
      state: value,
      version: 0
    }
    localStorage.setItem(key, JSON.stringify(dataToStore))
  },
  removeItem: (key) => {
    localStorage.removeItem(key)
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