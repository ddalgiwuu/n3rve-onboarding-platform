// React 19 polyfill for libraries that haven't updated yet
import React from 'react'

// @dnd-kit libraries try to access React through window.React which doesn't exist in modern builds
// This polyfill ensures compatibility
if (typeof window !== 'undefined') {
  // Make React available globally for libraries that expect it
  (window as any).React = React
  
  // Some libraries might try to access useLayoutEffect differently
  if (!React.useLayoutEffect) {
    (React as any).useLayoutEffect = React.useEffect
  }
}

// Export to ensure the polyfill is loaded
export const ensureReactCompatibility = () => {
  // This function ensures the polyfill is applied
  return true
}