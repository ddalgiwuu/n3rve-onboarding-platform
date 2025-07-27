import { createContext, useContext, useEffect, useState, ReactNode, useMemo } from 'react';
import { logger } from '@/utils/logger';

interface User {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'CUSTOMER'
  companyName?: string
  artistName?: string
  profilePicture?: string
}

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  _hasHydrated: boolean
}

interface AuthContextType extends AuthState {
  setAuth: (user: User, accessToken: string, refreshToken: string) => void
  clearAuth: () => void
  logout: () => void
  updateTokens: (accessToken: string, refreshToken: string) => void
  setHasHydrated: (state: boolean) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  _hasHydrated: false
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>(initialState);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedValue = localStorage.getItem('auth-storage');
        if (storedValue) {
          const parsed = JSON.parse(storedValue);
          // Handle legacy format from zustand/redux
          if (parsed.state) {
            setAuthState({
              ...parsed.state,
              _hasHydrated: true
            });
          } else {
            setAuthState({ ...parsed, _hasHydrated: true });
          }
        } else {
          setAuthState(prev => ({ ...prev, _hasHydrated: true }));
        }
      } catch (error) {
        logger.warn('Failed to load auth from localStorage:', error);
        setAuthState(prev => ({ ...prev, _hasHydrated: true }));
      }
    }
  }, []);

  // Save to localStorage when auth state changes
  useEffect(() => {
    if (typeof window !== 'undefined' && authState._hasHydrated) {
      try {
        const dataToStore = {
          state: authState,
          version: 0
        };
        localStorage.setItem('auth-storage', JSON.stringify(dataToStore));
      } catch (error) {
        logger.warn('Failed to save auth to localStorage:', error);
      }
    }
  }, [authState]);

  const setAuth = (user: User, accessToken: string, refreshToken: string) => {
    setAuthState({
      user,
      accessToken,
      refreshToken,
      isAuthenticated: true,
      _hasHydrated: true
    });
  };

  const clearAuth = () => {
    setAuthState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      _hasHydrated: true
    });
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('auth-storage');
      } catch (error) {
        logger.warn('Failed to remove auth from localStorage:', error);
      }
    }
  };

  const updateTokens = (accessToken: string, refreshToken: string) => {
    setAuthState(prev => ({
      ...prev,
      accessToken,
      refreshToken
    }));
  };

  const setHasHydrated = (state: boolean) => {
    setAuthState(prev => ({ ...prev, _hasHydrated: state }));
  };

  const value: AuthContextType = useMemo(() => ({
    ...authState,
    setAuth,
    clearAuth,
    logout: clearAuth,
    updateTokens,
    setHasHydrated
  }), [authState]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthStore() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthStore must be used within an AuthProvider');
  }
  return context;
}

// Mimic zustand persist API for compatibility
export const useAuthStorePersist = {
  rehydrate: async () => {
    // No-op as hydration happens automatically
  }
};
