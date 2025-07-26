// Early React initialization for React 19 compatibility
// This must be imported before any other React-dependent modules

import React from 'react'

// Ultra-simplified React 19 initialization - no object manipulation at all
if (typeof window !== 'undefined') {
  // Direct assignment only
  window.React = React
  window.createContext = React.createContext
  window.createElement = React.createElement
  window.useState = React.useState
  window.useEffect = React.useEffect
  window.useContext = React.useContext
  
  // Simple logging without object creation
  console.log('React initialized:', React.version)
}

export default React