// Simplified hook for Jotai compatibility
import { useState, useEffect } from 'react'

const useSafeStore = <T, F>(
  store: () => T,
  callback: (state: T) => F,
) => {
  const [data, setData] = useState<F | undefined>(undefined)

  useEffect(() => {
    let mounted = true

    // Small delay to ensure we're past hydration
    const timer = setTimeout(() => {
      if (!mounted) return

      try {
        // Get current state from store
        const state = store()
        if (mounted) {
          setData(callback(state))
        }
      } catch (error) {
        console.warn('Store access failed:', error)
      }
    }, 0)

    return () => {
      mounted = false
      clearTimeout(timer)
    }
  }, [store, callback])

  return data
}

export default useSafeStore