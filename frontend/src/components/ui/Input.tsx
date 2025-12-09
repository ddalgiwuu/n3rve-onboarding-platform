import React from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
  hint?: string
  variant?: 'default' | 'glass' | 'glass-enhanced' | 'premium'
}

export default function Input({
  label,
  error,
  icon,
  hint,
  variant = 'default',
  className = '',
  ...props
}: InputProps) {
  const getVariantStyles = () => {
    const baseStyles = 'w-full px-4 py-3 rounded-xl transition-all duration-300 font-medium';

    switch (variant) {
      case 'glass':
        return cn(
          baseStyles,
          'input-premium glass-shimmer',
          'hover:animate-morphic-breath'
        );
      case 'glass-enhanced':
        return cn(
          baseStyles,
          'glass-enhanced border-modern-soft',
          'focus:outline-none focus:ring-2 focus:ring-n3rve-400/30 focus:border-n3rve-400/50',
          'hover:shadow-lg hover:bg-surface-elevated glass-shimmer'
        );
      case 'premium':
        return cn(
          baseStyles,
          'glass-premium border-modern neuro-inset',
          'focus:outline-none focus:ring-4 focus:ring-n3rve-400/20 focus:neuro-raised',
          'hover:shadow-xl hover:scale-[1.01] glass-shimmer',
          'animate-morphic-breath'
        );
      default:
        return cn(
          baseStyles,
          'input-premium',
          'hover:animate-spring-in'
        );
    }
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative group">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-n3rve-500 transition-all duration-300 pointer-events-none z-10 group-focus-within:scale-110">
            {icon}
          </div>
        )}

        {/* Input field */}
        <input
          className={cn(
            getVariantStyles(),
            'placeholder-gray-400 dark:placeholder-gray-500',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100/50 dark:disabled:bg-gray-800/50',
            error && 'border-red-500 dark:border-red-500 hover:border-red-600 dark:hover:border-red-400 focus:ring-red-500/20 bg-red-50/50 dark:bg-red-900/10',
            icon && 'pl-12',
            variant === 'premium' && 'hover:scale-[1.02] focus:scale-[1.02]',
            className
          )}
          {...props}
        />

        {/* Enhanced focus indicator */}
        {variant !== 'premium' && (
          <div className={cn(
            'absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 bg-gradient-to-r from-n3rve-main to-purple-400 transition-all duration-300 rounded-full',
            'w-0 group-focus-within:w-full opacity-0 group-focus-within:opacity-100',
            error && 'from-red-500 to-red-600'
          )} />
        )}

        {/* Glass shimmer effect for premium variant */}
        {variant === 'premium' && (
          <div className="absolute inset-0 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none rounded-xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 transform translate-x-[-200%] group-focus-within:translate-x-[200%] transition-transform duration-1000" />
          </div>
        )}
      </div>

      {hint && !error && (
        <p className="mt-2.5 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
          <span className="w-1 h-1 bg-gray-400 rounded-full opacity-60"></span>
          {hint}
        </p>
      )}

      {error && (
        <div className="mt-2.5 text-sm text-red-500 dark:text-red-400 flex items-center gap-2 animate-fade-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
