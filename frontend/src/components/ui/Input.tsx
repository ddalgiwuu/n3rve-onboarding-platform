import React from 'react'
import { cn } from '@/lib/utils'
import { AlertCircle } from 'lucide-react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
  hint?: string
}

export default function Input({ 
  label, 
  error, 
  icon,
  hint,
  className = '', 
  ...props 
}: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2.5">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative group">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-n3rve-500 transition-colors duration-200 pointer-events-none">
            {icon}
          </div>
        )}
        <input
          className={cn(
            'w-full px-4 py-3.5 sm:py-3 rounded-xl transition-all duration-200 min-h-[48px]',
            'bg-gray-50 dark:bg-gray-900/50 backdrop-blur-sm',
            'text-gray-900 dark:text-gray-100 font-medium',
            'border-2 border-gray-200 dark:border-gray-700',
            'hover:border-gray-300 dark:hover:border-gray-600',
            'focus:border-transparent focus:ring-4 focus:ring-n3rve-500/20 focus:outline-none',
            'focus:bg-white dark:focus:bg-gray-900',
            'focus:shadow-lg focus:shadow-n3rve-500/10',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-gray-800',
            'placeholder:text-gray-400 dark:placeholder:text-gray-500 placeholder:font-normal',
            error && 'border-red-500 dark:border-red-500 hover:border-red-600 dark:hover:border-red-400 focus:ring-red-500/20 bg-red-50 dark:bg-red-900/10',
            icon && 'pl-12',
            className
          )}
          {...props}
        />
        {/* Focus indicator line */}
        <div className={cn(
          'absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 bg-gradient-to-r from-n3rve-main to-n3rve-accent transition-all duration-300',
          'w-0 group-focus-within:w-full',
          error && 'from-red-500 to-red-600'
        )} />
      </div>
      {hint && !error && (
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{hint}</p>
      )}
      {error && (
        <p className="mt-2 text-sm text-red-500 dark:text-red-400 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  )
}