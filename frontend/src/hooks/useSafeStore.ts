import { useEffect, useState } from 'react'

/**
 * Safe wrapper for Zustand store hooks to prevent React 19 hydration errors
 * This hook provides a fallback mechanism when stores aren't ready
 */
export function useSafeStore<T>(
  storeHook: () => T,
  fallbackValue: T
): T {
  const [value, setValue] = useState<T>(fallbackValue)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    try {
      const storeValue = storeHook()
      setValue(storeValue)
      setHasError(false)
    } catch (error) {
      console.warn('Store hydration error, using fallback:', error)
      setHasError(true)
      setValue(fallbackValue)
    }
  }, [storeHook, fallbackValue])

  try {
    if (!hasError) {
      return storeHook()
    }
  } catch (error) {
    console.warn('Store access error, using fallback:', error)
    setHasError(true)
  }

  return value
}