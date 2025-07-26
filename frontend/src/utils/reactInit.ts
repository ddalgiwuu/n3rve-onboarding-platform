// Early React initialization for React 19 compatibility
// This must be imported before any other React-dependent modules

import React from 'react'

// Enhanced React 19 initialization with robust error handling
if (typeof window !== 'undefined') {
  // Set React globally as early as possible with validation
  (window as any).React = React
  
  // Critical: Ensure createContext is immediately available
  if (React.createContext) {
    (window as any).createContext = React.createContext
  } else {
    console.error('CRITICAL: React.createContext is not available')
  }
  
  // Validate React initialization
  if (!(window as any).React || !(window as any).createContext) {
    console.error('CRITICAL: React initialization failed')
    throw new Error('React initialization failed - createContext not available')
  }
  
  // Create a synthetic React object for libraries expecting specific structure
  // Use Object.assign to avoid spread operator issues
  const syntheticReact = Object.assign({}, React, {
    createContext: React.createContext,
    createElement: React.createElement,
    Component: React.Component,
    PureComponent: React.PureComponent,
    Fragment: React.Fragment,
    StrictMode: React.StrictMode,
    Suspense: React.Suspense,
    // Add all hooks
    useState: React.useState,
    useEffect: React.useEffect,
    useContext: React.useContext,
    useReducer: React.useReducer,
    useCallback: React.useCallback,
    useMemo: React.useMemo,
    useRef: React.useRef,
    useImperativeHandle: React.useImperativeHandle,
    useLayoutEffect: React.useLayoutEffect,
    useDebugValue: React.useDebugValue,
    useDeferredValue: React.useDeferredValue,
    useTransition: React.useTransition,
    useId: React.useId,
    useSyncExternalStore: React.useSyncExternalStore,
    useInsertionEffect: React.useInsertionEffect
  })
  
  // Override with synthetic React for maximum compatibility
  (window as any).React = syntheticReact
  
  // Also make individual functions available
  Object.keys(syntheticReact).forEach(key => {
    if (typeof (syntheticReact as any)[key] === 'function') {
      (window as any)[key] = (syntheticReact as any)[key]
    }
  })
}

// Also ensure global scope availability
if (typeof global !== 'undefined') {
  (global as any).React = React
  (global as any).createContext = React.createContext
}

export default React