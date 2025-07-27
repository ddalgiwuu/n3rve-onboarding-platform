import { useState, useEffect, useRef } from 'react';

/**
 * Simple hydration check hook that waits for stores to be ready
 * Uses a timeout-based approach to avoid React hydration errors
 *
 * @returns boolean - true when stores are ready for use
 */
export const useHydration = () => {
  const [isHydrated, setIsHydrated] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Simple approach: wait a short time for hydration to complete
    // This prevents the component from rendering during the critical hydration phase
    timeoutRef.current = setTimeout(() => {
      setIsHydrated(true);
    }, 100); // Short delay to allow hydration

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return isHydrated;
};
