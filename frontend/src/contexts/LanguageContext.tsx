import { createContext, useContext, useEffect, useState, ReactNode, useMemo } from 'react';

type Language = 'ko' | 'en' | 'ja'

interface LanguageState {
  language: Language
  _hasHydrated: boolean
}

interface LanguageContextType extends LanguageState {
  setLanguage: (language: Language) => void
  setHasHydrated: (state: boolean) => void
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const initialState: LanguageState = {
  language: 'ko',
  _hasHydrated: false
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [languageState, setLanguageState] = useState<LanguageState>(initialState);

  // Load from localStorage on mount
  useEffect(() => {
    const loadLanguageState = () => {
      if (typeof window !== 'undefined') {
        try {
          const storedValue = localStorage.getItem('language-storage');
          console.log('Language hydration - stored value:', storedValue);
          if (storedValue) {
            const parsed = JSON.parse(storedValue);
            console.log('Language hydration - parsed value:', parsed);
            // Handle legacy format from zustand/redux
            if (parsed.state) {
              console.log('Language hydration - using state format');
              setLanguageState({
                language: parsed.state.language || 'ko',
                _hasHydrated: true
              });
            } else {
              console.log('Language hydration - using direct format');
              setLanguageState({ ...parsed, _hasHydrated: true });
            }
          } else {
            console.log('Language hydration - no stored value, setting default');
            setLanguageState(prev => ({ ...prev, _hasHydrated: true }));
          }
        } catch (error) {
          console.warn('Failed to load language from localStorage:', error);
          console.log('Language hydration - error, setting hydrated true');
          setLanguageState(prev => ({ ...prev, _hasHydrated: true }));
        }
      }
    };

    // Load immediately
    loadLanguageState();

    // Force hydration after 500ms if it hasn't happened yet
    const timeoutId = setTimeout(() => {
      setLanguageState(prev => {
        if (!prev._hasHydrated) {
          console.log('Language hydration - forcing hydration after timeout');
          return { ...prev, _hasHydrated: true };
        }
        return prev;
      });
    }, 500);

    return () => clearTimeout(timeoutId);
  }, []);

  // Save to localStorage when language state changes
  useEffect(() => {
    if (typeof window !== 'undefined' && languageState._hasHydrated) {
      try {
        const dataToStore = {
          state: languageState,
          version: 0
        };
        localStorage.setItem('language-storage', JSON.stringify(dataToStore));
      } catch (error) {
        console.warn('Failed to save language to localStorage:', error);
      }
    }
  }, [languageState]);

  const setLanguage = (language: Language) => {
    setLanguageState({ language, _hasHydrated: true });
  };

  const setHasHydrated = (state: boolean) => {
    setLanguageState(prev => ({ ...prev, _hasHydrated: state }));
  };

  const value: LanguageContextType = useMemo(() => ({
    ...languageState,
    setLanguage,
    setHasHydrated
  }), [languageState]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguageStore() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguageStore must be used within a LanguageProvider');
  }
  return context;
}

// Translation hook is now in a separate file to avoid circular imports

// Mimic zustand persist API for compatibility
export const useLanguageStorePersist = {
  rehydrate: async () => {
    // No-op as hydration happens automatically
  }
};
