import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

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
    if (typeof window !== 'undefined') {
      try {
        const storedValue = localStorage.getItem('language-storage');
        if (storedValue) {
          const parsed = JSON.parse(storedValue);
          // Handle legacy format from zustand/redux
          if (parsed.state) {
            setLanguageState({
              language: parsed.state.language || 'ko',
              _hasHydrated: true
            });
          } else {
            setLanguageState({ ...parsed, _hasHydrated: true });
          }
        } else {
          setLanguageState(prev => ({ ...prev, _hasHydrated: true }));
        }
      } catch (error) {
        console.warn('Failed to load language from localStorage:', error);
        setLanguageState(prev => ({ ...prev, _hasHydrated: true }));
      }
    }
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

  const value: LanguageContextType = {
    ...languageState,
    setLanguage,
    setHasHydrated
  };

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

// Translation hook (simplified version)
export function useTranslation() {
  const { language } = useLanguageStore();

  const t = (key: string): string => {
    // For now, just return the key
    // This would normally look up translations
    return key;
  };

  return { t, language };
}

// Mimic zustand persist API for compatibility
export const useLanguageStorePersist = {
  rehydrate: async () => {
    // No-op as hydration happens automatically
  }
};
