import { forwardRef } from 'react'
import { UseFormRegisterReturn } from 'react-hook-form'
import ValidatedInput from './ValidatedInput'

interface ValidatedFormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  fieldId: string
  validationType: 'album' | 'track' | 'artist'
  validationOptions?: {
    trackNumber?: number
    isComposer?: boolean
  }
  register: UseFormRegisterReturn
  error?: { message?: string }
  showInlineWarnings?: boolean
  language?: 'ko' | 'en'
  label?: React.ReactNode
  helpText?: string
}

/**
 * Bridge component that connects react-hook-form with ValidatedInput
 * Provides real-time QC validation while maintaining form state
 */
const ValidatedFormInput = forwardRef<HTMLInputElement, ValidatedFormInputProps>(({
  fieldId,
  validationType,
  validationOptions,
  register,
  error,
  showInlineWarnings = true,
  language = 'en',
  label,
  helpText,
  className = '',
  ...props
}, ref) => {
  // Extract react-hook-form props
  const { onChange: formOnChange, onBlur: formOnBlur, name, ref: formRef } = register
  
  // Handle value changes for both react-hook-form and validation
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Call react-hook-form's onChange
    formOnChange(e)
    // ValidatedInput will handle its own validation through onValueChange
  }
  
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Call react-hook-form's onBlur
    formOnBlur(e)
  }
  
  return (
    <ValidatedInput
      ref={(el) => {
        // Connect both refs
        if (typeof formRef === 'function') {
          formRef(el)
        }
        if (typeof ref === 'function') {
          ref(el)
        } else if (ref && 'current' in ref) {
          ref.current = el
        }
      }}
      fieldId={fieldId}
      validationType={validationType}
      validationOptions={validationOptions}
      name={name}
      onChange={handleChange}
      onBlur={handleBlur}
      showInlineWarnings={showInlineWarnings}
      language={language}
      label={label}
      helpText={helpText}
      className={className}
      {...props}
    />
  )
})

ValidatedFormInput.displayName = 'ValidatedFormInput'

export default ValidatedFormInput