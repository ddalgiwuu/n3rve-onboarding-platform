// Re-export from hooks for compatibility
import { useLanguageStore as useLanguageStoreHook, useLanguageStorePersist, useTranslation } from './hooks'

export const useLanguageStore = Object.assign(useLanguageStoreHook, {
  persist: useLanguageStorePersist
})

export { useTranslation }