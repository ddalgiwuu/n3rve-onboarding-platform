import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Language = 'ko' | 'en'

interface LanguageStore {
  language: Language
  setLanguage: (language: Language) => void
  t: (ko: string, en: string) => string
}

export const useLanguageStore = create<LanguageStore>()(
  persist(
    (set, get) => ({
      language: 'ko',
      setLanguage: (language) => set({ language }),
      t: (ko: string, en: string) => {
        const { language } = get()
        return language === 'ko' ? ko : en
      },
    }),
    {
      name: 'language-storage',
    }
  )
)

// Export a hook for components that only need the translation function
export const useTranslation = () => {
  const { t, language } = useLanguageStore()
  return { t, language }
}