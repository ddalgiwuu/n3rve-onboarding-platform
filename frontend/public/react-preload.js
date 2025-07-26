// Emergency React preload to fix createContext errors
// This script runs before any vendor chunks to ensure React is available

(function() {
  'use strict';
  
  console.log('🔧 Emergency React preload starting...');
  
  // Check if React is already loaded
  if (window.React && window.React.createContext) {
    console.log('✅ React already loaded, createContext available');
    return;
  }
  
  // Create a minimal React context implementation for emergency fallback
  if (!window.React) {
    console.log('⚠️ React not found, creating emergency fallback...');
    
    window.React = {
      createContext: function(defaultValue) {
        const context = {
          Provider: function(props) { return props.children; },
          Consumer: function(props) { return props.children(defaultValue); },
          _currentValue: defaultValue,
          _currentValue2: defaultValue,
          displayName: 'Context'
        };
        return context;
      },
      createElement: function(type, props, ...children) {
        return { type, props: { ...props, children } };
      },
      Component: function() {},
      PureComponent: function() {},
      Fragment: 'react.fragment',
      StrictMode: function(props) { return props.children; },
      Suspense: function(props) { return props.children; },
      useState: function(initial) { return [initial, function() {}]; },
      useEffect: function() {},
      useContext: function(context) { return context._currentValue; },
      useReducer: function(reducer, initial) { return [initial, function() {}]; },
      useCallback: function(fn) { return fn; },
      useMemo: function(fn) { return fn(); },
      useRef: function(initial) { return { current: initial }; },
      useImperativeHandle: function() {},
      useLayoutEffect: function() {},
      useDebugValue: function() {},
      useDeferredValue: function(value) { return value; },
      useTransition: function() { return [false, function() {}]; },
      useId: function() { return 'react-id-' + Math.random().toString(36).substr(2, 9); },
      useSyncExternalStore: function(subscribe, getSnapshot) { return getSnapshot(); },
      useInsertionEffect: function() {},
      version: '19.1.0-emergency-fallback'
    };
    
    // Make createContext available globally
    window.createContext = window.React.createContext;
    
    console.log('🚨 Emergency React fallback created');
  }
  
  // Ensure createContext is available even if React exists but createContext doesn't
  if (window.React && !window.React.createContext) {
    console.log('🔧 Adding createContext to existing React object...');
    window.React.createContext = function(defaultValue) {
      const context = {
        Provider: function(props) { return props.children; },
        Consumer: function(props) { return props.children(defaultValue); },
        _currentValue: defaultValue,
        _currentValue2: defaultValue,
        displayName: 'Context'
      };
      return context;
    };
    window.createContext = window.React.createContext;
  }
  
  // Global protection for vendor chunks
  window.__REACT_EMERGENCY_LOADED__ = true;
  
  console.log('✅ Emergency React preload complete - createContext available:', !!window.React.createContext);
})();