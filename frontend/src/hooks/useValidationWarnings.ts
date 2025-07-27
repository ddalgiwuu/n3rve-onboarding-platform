import { useState, useCallback, useRef, useEffect } from 'react';
import { ValidationWarning, validateAlbumTitle, validateTrackTitle, validateArtistName, validateLabel } from '@/utils/inputValidation';
import { useLanguageStore } from '@/store/language.store';

interface ValidationState {
  warnings: ValidationWarning[]
  dismissedWarnings: Set<string>
  acceptedSuggestions: Set<string>
}

export function useValidationWarnings() {
  const [validationStates, setValidationStates] = useState<Record<string, ValidationState>>({});
  const timeoutRefs = useRef<Record<string, NodeJS.Timeout>>({});
  const { language } = useLanguageStore();

  // Validate with debounce
  const validateWithDebounce = useCallback((
    fieldId: string,
    value: string,
    validationType: 'album' | 'track' | 'artist',
    options?: { trackNumber?: number, isComposer?: boolean }
  ) => {
    // Clear existing timeout
    if (timeoutRefs.current[fieldId]) {
      clearTimeout(timeoutRefs.current[fieldId]);
    }

    // Set new timeout for validation
    timeoutRefs.current[fieldId] = setTimeout(() => {
      let result: { warnings: ValidationWarning[] };

      switch (validationType) {
        case 'album':
          result = validateAlbumTitle(value, language as 'ko' | 'en' | 'ja');
          break;
        case 'track':
          result = validateTrackTitle(value, options?.trackNumber, language as 'ko' | 'en' | 'ja');
          break;
        case 'artist':
          result = validateArtistName(value, options?.isComposer, language as 'ko' | 'en' | 'ja');
          break;
        case 'label':
          result = validateLabel(value, language as 'ko' | 'en' | 'ja');
          break;
      }

      setValidationStates(prev => {
        const currentState = prev[fieldId] || {
          warnings: [],
          dismissedWarnings: new Set<string>(),
          acceptedSuggestions: new Set<string>()
        };

        // Filter out already dismissed warnings
        const activeWarnings = result.warnings.filter(
          w => !currentState.dismissedWarnings.has(w.id)
        );

        return {
          ...prev,
          [fieldId]: {
            ...currentState,
            warnings: activeWarnings
          }
        };
      });
    }, 300); // 300ms debounce
  }, [language]);

  // Get warnings for a specific field
  const getFieldWarnings = useCallback((fieldId: string): ValidationWarning[] => {
    return validationStates[fieldId]?.warnings || [];
  }, [validationStates]);

  // Get all warnings
  const getAllWarnings = useCallback((): ValidationWarning[] => {
    return Object.values(validationStates).flatMap(state => state.warnings);
  }, [validationStates]);

  // Get warnings by group
  const getWarningsByGroup = useCallback((group: string): ValidationWarning[] => {
    return getAllWarnings().filter(w => w.warningGroup === group);
  }, [getAllWarnings]);

  // Dismiss a warning
  const dismissWarning = useCallback((fieldId: string, warningId: string) => {
    setValidationStates(prev => {
      const currentState = prev[fieldId] || {
        warnings: [],
        dismissedWarnings: new Set<string>(),
        acceptedSuggestions: new Set<string>()
      };

      const newDismissed = new Set(currentState.dismissedWarnings);
      newDismissed.add(warningId);

      return {
        ...prev,
        [fieldId]: {
          ...currentState,
          dismissedWarnings: newDismissed,
          warnings: currentState.warnings.filter(w => w.id !== warningId)
        }
      };
    });
  }, []);

  // Dismiss all warnings in a group
  const dismissWarningGroup = useCallback((group: string) => {
    setValidationStates(prev => {
      const newStates = { ...prev };

      Object.keys(newStates).forEach(fieldId => {
        const state = newStates[fieldId];
        const groupWarnings = state.warnings.filter(w => w.warningGroup === group);

        if (groupWarnings.length > 0) {
          const newDismissed = new Set(state.dismissedWarnings);
          groupWarnings.forEach(w => newDismissed.add(w.id));

          newStates[fieldId] = {
            ...state,
            dismissedWarnings: newDismissed,
            warnings: state.warnings.filter(w => w.warningGroup !== group)
          };
        }
      });

      return newStates;
    });
  }, []);

  // Accept a suggestion
  const acceptSuggestion = useCallback((fieldId: string, warning: ValidationWarning) => {
    if (!warning.suggestedValue) return null;

    setValidationStates(prev => {
      const currentState = prev[fieldId] || {
        warnings: [],
        dismissedWarnings: new Set<string>(),
        acceptedSuggestions: new Set<string>()
      };

      const newAccepted = new Set(currentState.acceptedSuggestions);
      newAccepted.add(warning.id);

      return {
        ...prev,
        [fieldId]: {
          ...currentState,
          acceptedSuggestions: newAccepted,
          warnings: currentState.warnings.filter(w => w.id !== warning.id)
        }
      };
    });

    return warning.suggestedValue;
  }, []);

  // Accept all suggestions in a group
  const acceptAllInGroup = useCallback((group: string): Record<string, string> => {
    const changes: Record<string, string> = {};

    setValidationStates(prev => {
      const newStates = { ...prev };

      Object.keys(newStates).forEach(fieldId => {
        const state = newStates[fieldId];
        const groupWarnings = state.warnings.filter(
          w => w.warningGroup === group && w.suggestedValue
        );

        if (groupWarnings.length > 0) {
          const newAccepted = new Set(state.acceptedSuggestions);
          groupWarnings.forEach(w => {
            newAccepted.add(w.id);
            if (w.suggestedValue) {
              changes[fieldId] = w.suggestedValue;
            }
          });

          newStates[fieldId] = {
            ...state,
            acceptedSuggestions: newAccepted,
            warnings: state.warnings.filter(w => w.warningGroup !== group)
          };
        }
      });

      return newStates;
    });

    return changes;
  }, []);

  // Clear all warnings for a field
  const clearFieldWarnings = useCallback((fieldId: string) => {
    setValidationStates(prev => {
      const { [fieldId]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  // Get summary statistics
  const getSummary = useCallback(() => {
    const allWarnings = getAllWarnings();
    return {
      total: allWarnings.length,
      errors: allWarnings.filter(w => w.type === 'error').length,
      warnings: allWarnings.filter(w => w.type === 'warning').length,
      suggestions: allWarnings.filter(w => w.type === 'suggestion').length,
      avgRejectionProbability: allWarnings.length > 0
        ? Math.round(allWarnings.reduce((sum, w) => sum + (w.rejectionProbability || 0), 0) / allWarnings.length)
        : 0
    };
  }, [getAllWarnings]);

  // Check if field has errors
  const hasErrors = useCallback((fieldId?: string): boolean => {
    if (fieldId) {
      return getFieldWarnings(fieldId).some(w => w.type === 'error');
    }
    return getAllWarnings().some(w => w.type === 'error');
  }, [getFieldWarnings, getAllWarnings]);

  // Get input border class based on validation state
  const getInputBorderClass = useCallback((fieldId: string): string => {
    const warnings = getFieldWarnings(fieldId);
    if (warnings.length === 0) return '';

    const hasError = warnings.some(w => w.type === 'error');
    const hasWarning = warnings.some(w => w.type === 'warning');

    if (hasError) return 'border-red-500 focus:border-red-500';
    if (hasWarning) return 'border-amber-500 focus:border-amber-500';
    return 'border-blue-500 focus:border-blue-500';
  }, [getFieldWarnings]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(timeoutRefs.current).forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  return {
    validateWithDebounce,
    getFieldWarnings,
    getAllWarnings,
    getWarningsByGroup,
    dismissWarning,
    dismissWarningGroup,
    acceptSuggestion,
    acceptAllInGroup,
    clearFieldWarnings,
    getSummary,
    hasErrors,
    getInputBorderClass
  };
}
