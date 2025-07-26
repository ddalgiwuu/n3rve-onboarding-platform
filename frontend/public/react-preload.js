// React 19 preload - simplified version
// Only reserves namespace, no complex fallback objects

(function() {
  'use strict';
  
  // Remove console logs in production
  
  // Just reserve the namespace - let the real React load
  if (!window.React) {
    window.React = null; // Reserve namespace only
  }
  
  window.__REACT_PRELOAD__ = true;
  
  // React namespace reserved
})();