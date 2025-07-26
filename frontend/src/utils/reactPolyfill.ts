// React 19 polyfill for libraries that haven't updated yet
import React from 'react'

// Comprehensive React 19 compatibility polyfill
if (typeof window !== 'undefined') {
  // Make React available globally for libraries that expect it
  (window as any).React = React
  
  // Ensure createContext is available globally
  if (React.createContext) {
    (window as any).createContext = React.createContext
  }
  
  // Some libraries might try to access useLayoutEffect differently
  if (!React.useLayoutEffect) {
    (React as any).useLayoutEffect = React.useEffect
  }
  
  // Ensure all React hooks are available globally for legacy libraries
  const reactHooks = [
    'useState', 'useEffect', 'useContext', 'useReducer', 
    'useCallback', 'useMemo', 'useRef', 'useImperativeHandle',
    'useLayoutEffect', 'useDebugValue', 'useDeferredValue',
    'useTransition', 'useId', 'useSyncExternalStore', 'useInsertionEffect'
  ]
  
  reactHooks.forEach(hook => {
    if ((React as any)[hook] && !(window as any)[hook]) {
      (window as any)[hook] = (React as any)[hook]
    }
  })
}

// Also make React available in global scope for Node.js-like environments
if (typeof global !== 'undefined') {
  (global as any).React = React
  if (React.createContext) {
    (global as any).createContext = React.createContext
  }
}

// Export to ensure the polyfill is loaded
export const ensureReactCompatibility = () => {
  // Validate that React and createContext are available
  const isValid = typeof React !== 'undefined' && 
                  typeof React.createContext === 'function' &&
                  (typeof window === 'undefined' || (window as any).React === React)
  
  if (!isValid) {
    console.warn('React polyfill validation failed - React may not be properly initialized')
  }
  
  return isValid
}

// Run validation immediately
ensureReactCompatibility()