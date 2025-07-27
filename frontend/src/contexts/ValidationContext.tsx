import { createContext, useContext, ReactNode } from 'react';
import { useValidationWarnings } from '@/hooks/useValidationWarnings';

interface ValidationContextType {
  validateWithDebounce: ReturnType<typeof useValidationWarnings>['validateWithDebounce']
  getFieldWarnings: ReturnType<typeof useValidationWarnings>['getFieldWarnings']
  getAllWarnings: ReturnType<typeof useValidationWarnings>['getAllWarnings']
  getWarningsByGroup: ReturnType<typeof useValidationWarnings>['getWarningsByGroup']
  dismissWarning: ReturnType<typeof useValidationWarnings>['dismissWarning']
  dismissWarningGroup: ReturnType<typeof useValidationWarnings>['dismissWarningGroup']
  acceptSuggestion: ReturnType<typeof useValidationWarnings>['acceptSuggestion']
  acceptAllInGroup: ReturnType<typeof useValidationWarnings>['acceptAllInGroup']
  clearFieldWarnings: ReturnType<typeof useValidationWarnings>['clearFieldWarnings']
  getSummary: ReturnType<typeof useValidationWarnings>['getSummary']
  hasErrors: ReturnType<typeof useValidationWarnings>['hasErrors']
  getInputBorderClass: ReturnType<typeof useValidationWarnings>['getInputBorderClass']
}

const ValidationContext = createContext<ValidationContextType | undefined>(undefined);

export function ValidationProvider({ children }: { children: ReactNode }) {
  const validationWarnings = useValidationWarnings();

  return (
    <ValidationContext.Provider value={validationWarnings}>
      {children}
    </ValidationContext.Provider>
  );
}

export function useValidationContext() {
  const context = useContext(ValidationContext);
  if (!context) {
    throw new Error('useValidationContext must be used within a ValidationProvider');
  }
  return context;
}
