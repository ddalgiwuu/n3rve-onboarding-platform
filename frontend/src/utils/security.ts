/**
 * Security utilities for production environment
 */

// Disable console in production
export function disableConsole() {
  if (import.meta.env.PROD) {
    try {
      const noop = () => {};

      // Check if console is already frozen
      if (!Object.isFrozen(console)) {
        // Override all console methods
        ['log', 'debug', 'info', 'warn', 'error', 'table', 'trace', 'dir'].forEach(method => {
          try {
            Object.defineProperty(console, method, {
              value: noop,
              writable: false,
              configurable: false
            });
          } catch (e) {
            // If we can't override, it's already protected
          }
        });

        // Prevent console restoration
        Object.freeze(console);
      }
    } catch (error) {
      // Console protection failed, but app should continue
    }
  }
}

// Detect and block developer tools
export function detectDevTools() {
  if (import.meta.env.PROD) {
    // Temporarily disable aggressive devtools detection
    // This was causing false positives and blocking legitimate users

    // Only disable keyboard shortcuts for security
    document.addEventListener('keydown', (e) => {
      if (e.key === 'F12' ||
          (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key)) ||
          (e.ctrlKey && e.key === 'U')) {
        e.preventDefault();
        return false;
      }
    });

    // Disable right-click in production
    document.addEventListener('contextmenu', (e) => e.preventDefault());
  }
}

// Protect global objects
export function protectGlobalObjects() {
  if (import.meta.env.PROD) {
    try {
      // Only freeze immutable objects
      Object.freeze(window.location);
      Object.freeze(window.navigator);

      // Disable eval
      window.eval = () => {
        throw new Error('eval is disabled');
      };

      // Disable Function constructor
      window.Function = function() {
        throw new Error('Function constructor is disabled');
      } as any;
    } catch (error) {
      // Security protections failed, but app should continue
      console.warn('Some security features could not be enabled');
    }
  }
}

// Auto logout on inactivity
export function setupAutoLogout(logoutCallback: () => void, timeout = 15 * 60 * 1000) {
  let timer: NodeJS.Timeout;

  const resetTimer = () => {
    clearTimeout(timer);
    timer = setTimeout(logoutCallback, timeout);
  };

  // Reset timer on user activity
  ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'].forEach(event => {
    document.addEventListener(event, resetTimer, true);
  });

  // Check on tab visibility change
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      clearTimeout(timer);
    } else {
      resetTimer();
    }
  });

  resetTimer();
}

// Initialize all security measures
export function initializeSecurity(logoutCallback: () => void) {
  // Only run security measures in production
  if (import.meta.env.PROD) {
    disableConsole();
    detectDevTools();
    protectGlobalObjects();
    setupAutoLogout(logoutCallback);

    // Disable React DevTools in production
    // @ts-ignore
    if (typeof window.__REACT_DEVTOOLS_GLOBAL_HOOK__ === 'object') {
      // @ts-ignore
      window.__REACT_DEVTOOLS_GLOBAL_HOOK__.inject = () => {};
      // @ts-ignore
      Object.freeze(window.__REACT_DEVTOOLS_GLOBAL_HOOK__);
    }
  }
}
