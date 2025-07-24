/**
 * Security utilities for production environment
 */

// Disable console in production
export function disableConsole() {
  if (import.meta.env.PROD) {
    const noop = () => {};
    
    // Override all console methods
    ['log', 'debug', 'info', 'warn', 'error', 'table', 'trace', 'dir'].forEach(method => {
      (console as any)[method] = noop;
    });
    
    // Prevent console restoration
    Object.freeze(console);
  }
}

// Detect and block developer tools
export function detectDevTools() {
  if (import.meta.env.PROD) {
    let devtools = { open: false, orientation: null };
    
    const threshold = 160;
    const emitEvent = (state: boolean) => {
      if (state) {
        document.body.innerHTML = `
          <div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#000;color:#fff;font-family:monospace;">
            <div style="text-align:center;">
              <h1>🚫 보안 경고</h1>
              <p>개발자 도구가 감지되었습니다.</p>
              <p>보안상의 이유로 이 페이지는 차단되었습니다.</p>
            </div>
          </div>
        `;
        // Clear all storage
        localStorage.clear();
        sessionStorage.clear();
      }
    };
    
    setInterval(() => {
      if (window.outerHeight - window.innerHeight > threshold || 
          window.outerWidth - window.innerWidth > threshold) {
        if (!devtools.open) {
          devtools.open = true;
          emitEvent(true);
        }
      } else {
        devtools.open = false;
      }
    }, 500);
    
    // Disable right-click
    document.addEventListener('contextmenu', (e) => e.preventDefault());
    
    // Disable F12, Ctrl+Shift+I, etc.
    document.addEventListener('keydown', (e) => {
      if (e.key === 'F12' || 
          (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key)) ||
          (e.ctrlKey && e.key === 'U')) {
        e.preventDefault();
        return false;
      }
    });
  }
}

// Protect global objects
export function protectGlobalObjects() {
  if (import.meta.env.PROD) {
    // Protect localStorage
    const originalLocalStorage = window.localStorage;
    Object.defineProperty(window, 'localStorage', {
      get: function() {
        return new Proxy(originalLocalStorage, {
          get(target, prop) {
            if (prop === 'getItem') {
              return function(key: string) {
                // Block access to sensitive keys
                if (key.includes('auth') || key.includes('token')) {
                  return null;
                }
                return target.getItem(key);
              };
            }
            return target[prop as keyof Storage];
          }
        });
      },
      configurable: false
    });
    
    // Protect window object
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
  disableConsole();
  detectDevTools();
  protectGlobalObjects();
  setupAutoLogout(logoutCallback);
  
  // Disable React DevTools in production
  if (import.meta.env.PROD) {
    // @ts-ignore
    if (typeof window.__REACT_DEVTOOLS_GLOBAL_HOOK__ === 'object') {
      // @ts-ignore
      window.__REACT_DEVTOOLS_GLOBAL_HOOK__.inject = () => {};
      // @ts-ignore
      Object.freeze(window.__REACT_DEVTOOLS_GLOBAL_HOOK__);
    }
  }
}