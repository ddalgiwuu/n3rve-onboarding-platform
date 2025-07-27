import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  description?: string
  error?: boolean
}

export default function Checkbox({ label, description, error, className = '', ...props }: CheckboxProps) {
  return (
    <label className={cn(
      'flex items-start gap-3.5 cursor-pointer group select-none',
      props.disabled && 'cursor-not-allowed opacity-60',
      className
    )}>
      <div className="relative flex items-center justify-center mt-0.5">
        <input
          type="checkbox"
          className="sr-only peer"
          {...props}
        />
        {/* Checkbox Background */}
        <div className={cn(
          'relative w-5 h-5 rounded-lg border-2 transition-all duration-300 transform',
          'bg-gray-50 dark:bg-gray-900/50',
          'border-gray-300 dark:border-gray-600',
          'group-hover:border-gray-400 dark:group-hover:border-gray-500',
          'peer-checked:border-transparent peer-checked:bg-gradient-to-br peer-checked:from-n3rve-main peer-checked:to-n3rve-accent',
          'peer-checked:scale-110 peer-checked:shadow-lg peer-checked:shadow-n3rve-500/25',
          'peer-focus-visible:ring-4 peer-focus-visible:ring-n3rve-500/20',
          'peer-disabled:!bg-gray-100 dark:peer-disabled:!bg-gray-800',
          error && 'border-red-500 dark:border-red-500',
          error && 'peer-checked:from-red-500 peer-checked:to-red-600'
        )}>
          {/* Checkmark Icon */}
          <Check
            className={cn(
              'w-3.5 h-3.5 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
              'opacity-0 scale-50 peer-checked:opacity-100 peer-checked:scale-100',
              'transition-all duration-300 ease-out'
            )}
            strokeWidth={3}
          />
          {/* Hover Effect Ring */}
          <div className={cn(
            'absolute inset-0 rounded-lg bg-gradient-to-br from-n3rve-main/20 to-n3rve-accent/20',
            'opacity-0 scale-150 group-hover:opacity-100 group-hover:scale-100',
            'transition-all duration-300 peer-checked:opacity-0',
            'peer-disabled:!opacity-0'
          )} />
        </div>
      </div>
      {(label || description) && (
        <div className="flex-1 pt-0.5">
          {label && (
            <span className={cn(
              'block text-sm font-medium transition-colors duration-200',
              'text-gray-700 dark:text-gray-300',
              'group-hover:text-gray-900 dark:group-hover:text-gray-100',
              'peer-checked:text-gray-900 dark:peer-checked:text-white',
              'peer-disabled:!text-gray-400 dark:peer-disabled:!text-gray-600',
              error && 'text-red-600 dark:text-red-400'
            )}>
              {label}
              {props.required && <span className="text-red-500 ml-1">*</span>}
            </span>
          )}
          {description && (
            <p className={cn(
              'text-xs mt-1 transition-colors duration-200',
              'text-gray-500 dark:text-gray-400',
              'group-hover:text-gray-600 dark:group-hover:text-gray-300',
              'peer-disabled:!text-gray-400 dark:peer-disabled:!text-gray-600'
            )}>
              {description}
            </p>
          )}
        </div>
      )}
    </label>
  );
}
