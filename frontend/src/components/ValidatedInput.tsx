import { useState, useEffect, forwardRef } from 'react'
import { motion } from 'framer-motion'
import EnhancedValidationWarning from './EnhancedValidationWarning'
import { useValidationContext } from '@/contexts/ValidationContext'
import { AlertCircle, AlertTriangle, Lightbulb } from 'lucide-react'

interface ValidatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  fieldId: string
  validationType: 'album' | 'track' | 'artist'
  validationOptions?: {
    trackNumber?: number
    isComposer?: boolean
  }
  onValueChange?: (value: string) => void
  showInlineWarnings?: boolean
  language?: 'ko' | 'en'
  label?: React.ReactNode
  helpText?: string
}

const ValidatedInput = forwardRef<HTMLInputElement, ValidatedInputProps>(({
  fieldId,
  validationType,
  validationOptions,
  onValueChange,
  showInlineWarnings = true,
  language = 'en',
  label,
  helpText,
  className = '',
  value,
  onChange,
  ...props
}, ref) => {
  const [localValue, setLocalValue] = useState(value || '')
  const [hasBeenTouched, setHasBeenTouched] = useState(false)
  
  const {
    validateWithDebounce,
    getFieldWarnings,
    dismissWarning,
    acceptSuggestion,
    getInputBorderClass
  } = useValidationContext()

  const warnings = getFieldWarnings(fieldId)
  const borderClass = getInputBorderClass(fieldId)

  // Update local value when prop changes
  useEffect(() => {
    setLocalValue(value || '')
  }, [value])

  // Validate on value change
  useEffect(() => {
    if (hasBeenTouched && localValue) {
      validateWithDebounce(fieldId, localValue.toString(), validationType, validationOptions)
    }
  }, [localValue, fieldId, validationType, validationOptions, validateWithDebounce, hasBeenTouched])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setLocalValue(newValue)
    setHasBeenTouched(true)
    onChange?.(e)
    onValueChange?.(newValue)
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setHasBeenTouched(true)
    props.onBlur?.(e)
  }

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    props.onFocus?.(e)
  }

  const handleAcceptSuggestion = (warning: any) => {
    const suggestedValue = acceptSuggestion(fieldId, warning)
    if (suggestedValue) {
      setLocalValue(suggestedValue)
      onValueChange?.(suggestedValue)
      // Create synthetic event for onChange
      const syntheticEvent = {
        target: { value: suggestedValue }
      } as React.ChangeEvent<HTMLInputElement>
      onChange?.(syntheticEvent)
    }
  }

  const handleDismissWarning = (warning: any) => {
    dismissWarning(fieldId, warning.id)
  }

  // Get validation status icon
  const getStatusIcon = () => {
    if (!hasBeenTouched || warnings.length === 0) return null
    
    const hasError = warnings.some(w => w.type === 'error')
    const hasWarning = warnings.some(w => w.type === 'warning')
    
    if (hasError) {
      return <AlertCircle className="w-5 h-5 text-red-500" />
    } else if (hasWarning) {
      return <AlertTriangle className="w-5 h-5 text-amber-500" />
    } else {
      return <Lightbulb className="w-5 h-5 text-blue-500" />
    }
  }

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
      )}
      
      <div className="relative">
        <input
          ref={ref}
          type="text"
          value={localValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          className={`
            w-full px-3 py-2 pr-10 
            border rounded-lg 
            focus:outline-none focus:ring-2 focus:ring-purple-500 
            dark:bg-gray-700 dark:text-white
            transition-colors duration-200
            ${hasBeenTouched && borderClass ? borderClass : 'border-gray-300 dark:border-gray-600'}
            ${className}
          `}
          {...props}
        />
        
        {/* Status Icon */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
          {getStatusIcon()}
        </div>
      </div>

      {helpText && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {helpText}
        </p>
      )}

      {/* Inline Warnings */}
      {showInlineWarnings && hasBeenTouched && warnings.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="mt-2"
        >
          <EnhancedValidationWarning
            warnings={warnings}
            onAcceptSuggestion={handleAcceptSuggestion}
            onDismissWarning={handleDismissWarning}
            language={language}
            displayMode="inline"
            relatedInputId={fieldId}
          />
        </motion.div>
      )}
    </div>
  )
})

ValidatedInput.displayName = 'ValidatedInput'

export default ValidatedInput