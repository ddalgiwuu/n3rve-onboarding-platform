import React from 'react'
import { cn } from '@/lib/utils'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export default function Textarea({ 
  label, 
  error, 
  className = '', 
  ...props 
}: TextareaProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
        </label>
      )}
      <textarea
        className={cn(
          'w-full px-4 py-3 sm:py-2.5 rounded-lg transition-all duration-200 min-h-[80px]',
          'bg-white dark:bg-gray-800 border-2',
          'text-gray-900 dark:text-gray-100',
          'border-gray-300 dark:border-gray-600',
          'hover:border-purple-400 dark:hover:border-purple-400',
          'focus:border-purple-500 focus:ring-4 sm:focus:ring-2 focus:ring-purple-500/20 focus:outline-none',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'placeholder:text-gray-400 dark:placeholder:text-gray-500',
          'resize-none',
          error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
          className
        )}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  )
}