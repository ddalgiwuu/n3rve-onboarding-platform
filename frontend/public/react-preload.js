// React 19 preload - simplified version
// Only reserves namespace, no complex fallback objects

(function() {
  'use strict';
  
  console.log('React preload starting...');
  
  // Just reserve the namespace - let the real React load
  if (!window.React) {
    window.React = null; // Reserve namespace only
  }
  
  window.__REACT_PRELOAD__ = true;
  
  console.log('React namespace reserved');
})();