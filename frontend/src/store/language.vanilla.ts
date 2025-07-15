import { createStore } from 'zustand/vanilla'

type Language = 'ko' | 'en'

interface LanguageState {
  language: Language
  _hasHydrated: boolean
  setHasHydrated: (state: boolean) => void
  setLanguage: (language: Language) => void
}

// Create vanilla store
export const languageStore = createStore<LanguageState>((set, get) => ({
  language: 'ko',
  _hasHydrated: false,
  
  setHasHydrated: (state) => {
    set({ _hasHydrated: state })
  },
  
  setLanguage: (language) => {
    set({ language })
  }
}))

// Initialize from localStorage
if (typeof window !== 'undefined') {
  const stored = localStorage.getItem('language-storage')
  if (stored) {
    try {
      const parsed = JSON.parse(stored)
      if (parsed.state) {
        languageStore.setState({
          ...parsed.state,
          _hasHydrated: true
        })
      }
    } catch (error) {
      console.error('Failed to parse language storage:', error)
    }
  } else {
    languageStore.setState({ _hasHydrated: true })
  }
}

// Subscribe to changes and persist
languageStore.subscribe((state) => {
  const { _hasHydrated, setHasHydrated, setLanguage, ...persistState } = state
  localStorage.setItem('language-storage', JSON.stringify({
    state: persistState,
    version: 0
  }))
})