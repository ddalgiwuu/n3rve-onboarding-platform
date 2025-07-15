import { useDispatch, useSelector } from 'react-redux'
import type { RootState, AppDispatch } from './index'
import { setAuth as setAuthAction, clearAuth as clearAuthAction, updateTokens as updateTokensAction, setHasHydrated as setAuthHasHydrated } from './authSlice'
import { setLanguage as setLanguageAction, setHasHydrated as setLanguageHasHydrated } from './languageSlice'

// Export typed versions of the hooks
export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector = <T>(selector: (state: RootState) => T) => useSelector(selector)

// Auth store compatibility hooks
export function useAuthStore() {
  const state = useAppSelector(state => state.auth)
  const dispatch = useAppDispatch()

  return {
    ...state,
    setAuth: (user: any, accessToken: string, refreshToken: string) => 
      dispatch(setAuthAction({ user, accessToken, refreshToken })),
    clearAuth: () => dispatch(clearAuthAction()),
    logout: () => dispatch(clearAuthAction()),
    updateTokens: (accessToken: string, refreshToken: string) => 
      dispatch(updateTokensAction({ accessToken, refreshToken })),
    setHasHydrated: (value: boolean) => dispatch(setAuthHasHydrated(value))
  }
}

// Overloaded version for selector usage
export function useAuthStoreSelector<T>(selector: (state: RootState['auth']) => T) {
  return useAppSelector(state => selector(state.auth))
}

// Language store compatibility hooks  
export function useLanguageStore() {
  const state = useAppSelector(state => state.language)
  const dispatch = useAppDispatch()

  return {
    ...state,
    setLanguage: (language: 'ko' | 'en') => dispatch(setLanguageAction(language)),
    setHasHydrated: (value: boolean) => dispatch(setLanguageHasHydrated(value))
  }
}

// Overloaded version for selector usage
export function useLanguageStoreSelector<T>(selector: (state: RootState['language']) => T) {
  return useAppSelector(state => selector(state.language))
}

// Translation hook
export function useTranslation() {
  const language = useAppSelector(state => state.language.language)
  
  // For now, just return a simple translation function
  // You can expand this to use actual translation files
  const t = (ko: string, en: string) => language === 'ko' ? ko : en

  return { t, language }
}

// Persist compatibility  
export const useAuthStorePersist = {
  rehydrate: async () => {
    // Redux handles this automatically
  }
}

export const useLanguageStorePersist = {
  rehydrate: async () => {
    // Redux handles this automatically
  }
}