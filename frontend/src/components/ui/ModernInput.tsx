import React, { forwardRef } from 'react';
import { cn } from '@/utils/cn';
import { Eye, EyeOff } from 'lucide-react';

interface ModernInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  isLoading?: boolean
  showPasswordToggle?: boolean
}

const ModernInput = forwardRef<HTMLInputElement, ModernInputProps>(
  ({
    label,
    error,
    hint,
    leftIcon,
    rightIcon,
    isLoading,
    showPasswordToggle,
    className,
    type,
    ...props
  }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const inputType = showPasswordToggle ? (showPassword ? 'text' : 'password') : type;

    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative group">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            type={inputType}
            className={cn(
              'w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl',
              'bg-white dark:bg-gray-800/50 backdrop-blur-sm',
              'text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400',
              'focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400',
              'transition-all duration-200 ease-in-out',
              'hover:border-gray-400 dark:hover:border-gray-500',
              leftIcon && 'pl-10',
              (rightIcon || showPasswordToggle) && 'pr-10',
              error && 'border-red-500 focus:ring-red-500/20 focus:border-red-500',
              isLoading && 'opacity-50 cursor-not-allowed',
              className
            )}
            disabled={isLoading}
            {...props}
          />

          {(rightIcon || showPasswordToggle) && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {showPasswordToggle ? (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              ) : (
                rightIcon
              )}
            </div>
          )}

          {isLoading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>

        {(error || hint) && (
          <div className="space-y-1">
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                {error}
              </p>
            )}
            {hint && !error && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {hint}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
);

ModernInput.displayName = 'ModernInput';

export default ModernInput;
