import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/auth.store'
import { useLanguageStore } from '@/store/language.store'

/**
 * Hook to check if Zustand stores have been hydrated from localStorage
 * This prevents rendering components before store data is available
 * 
 * @returns boolean - true when all stores are hydrated and ready to use
 */
export const useHydration = () => {
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    // Check if both stores have been hydrated
    const checkHydration = () => {
      const authHydrated = useAuthStore.persist.hasHydrated()
      const languageHydrated = useLanguageStore.persist.hasHydrated()
      
      if (authHydrated && languageHydrated) {
        setHydrated(true)
      }
    }

    // Initial check
    checkHydration()

    // Listen for hydration completion events
    const unsubAuth = useAuthStore.persist.onFinishHydration(() => {
      checkHydration()
    })

    const unsubLanguage = useLanguageStore.persist.onFinishHydration(() => {
      checkHydration()
    })

    // Cleanup listeners
    return () => {
      unsubAuth()
      unsubLanguage()
    }
  }, [])

  return hydrated
}