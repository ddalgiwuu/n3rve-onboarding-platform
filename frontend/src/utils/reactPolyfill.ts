// React 19 polyfill for libraries that haven't updated yet
import React from 'react'

// Ultra-simplified polyfill - direct assignment only
if (typeof window !== 'undefined') {
  window.React = React
}

export default React