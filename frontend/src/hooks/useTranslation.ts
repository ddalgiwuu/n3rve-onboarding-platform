import { useLanguageStore } from '@/store/language.store'
import useSafeStore from './useSafeStore'

export function useTranslation() {
  const language = useSafeStore(useLanguageStore, (state) => state.language)
  
  const t = (key: string, fallback?: string): string => {
    // For now, return fallback if provided, otherwise return the key
    // This matches the existing usage pattern in the codebase
    return fallback || key
  }
  
  return { t, language }
}