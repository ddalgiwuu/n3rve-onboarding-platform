import { atom } from 'jotai'

type Language = 'ko' | 'en'

interface LanguageState {
  language: Language
  _hasHydrated: boolean
}

const initialState: LanguageState = {
  language: 'ko',
  _hasHydrated: false
}

// Main language atom - simple atom without localStorage integration
export const languageAtom = atom<LanguageState>(initialState)

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