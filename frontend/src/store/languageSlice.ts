import { createSlice, PayloadAction } from '@reduxjs/toolkit'

type Language = 'ko' | 'en'

interface LanguageState {
  language: Language
  _hasHydrated: boolean
}

// Load from localStorage
const loadLanguageState = (): Partial<LanguageState> => {
  try {
    const stored = localStorage.getItem('language-storage')
    if (stored) {
      const data = JSON.parse(stored)
      if (data.state) {
        return data.state
      }
    }
  } catch (error) {
    console.error('Failed to load language state:', error)
  }
  return {}
}

const initialState: LanguageState = {
  language: 'ko',
  _hasHydrated: false,
  ...loadLanguageState()
}

const languageSlice = createSlice({
  name: 'language',
  initialState,
  reducers: {
    setHasHydrated: (state, action: PayloadAction<boolean>) => {
      state._hasHydrated = action.payload
    },
    setLanguage: (state, action: PayloadAction<Language>) => {
      state.language = action.payload
      
      // Save to localStorage
      try {
        const data = {
          state: {
            language: state.language,
            _hasHydrated: state._hasHydrated
          },
          version: 0
        }
        localStorage.setItem('language-storage', JSON.stringify(data))
      } catch (error) {
        console.error('Failed to save language state:', error)
      }
    }
  }
})

export const { setHasHydrated, setLanguage } = languageSlice.actions
export default languageSlice.reducer