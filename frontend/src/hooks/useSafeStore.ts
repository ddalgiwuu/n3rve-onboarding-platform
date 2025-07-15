// Custom useStore hook for hydration (Context7 MCP solution)
import { useState, useEffect, useRef } from 'react'

const useSafeStore = <T, F>(
  store: (callback: (state: T) => unknown) => unknown,
  callback: (state: T) => F,
) => {
  const [data, setData] = useState<F | undefined>(undefined)
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    let mounted = true

    // Small delay to ensure we're past hydration
    const timer = setTimeout(() => {
      if (!mounted) return

      try {
        // Subscribe to store
        const unsubscribe = store((state: T) => {
          if (mounted) {
            setData(callbackRef.current(state))
          }
        })

        // Cleanup
        return () => {
          mounted = false
          unsubscribe()
        }
      } catch (error) {
        console.warn('Store subscription failed:', error)
      }
    }, 0)

    return () => {
      mounted = false
      clearTimeout(timer)
    }
  }, [store])

  return data
}

export default useSafeStore