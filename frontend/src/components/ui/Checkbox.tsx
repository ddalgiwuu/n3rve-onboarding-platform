import React from 'react'
import { Check } from 'lucide-react'

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  description?: string
}

export default function Checkbox({ label, description, className = '', ...props }: CheckboxProps) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <div className="relative flex items-center justify-center">
        <input
          type="checkbox"
          className="sr-only peer"
          {...props}
        />
        <div className="
          w-6 h-6 rounded-md border-2 transition-all duration-200
          border-gray-400 dark:border-gray-500
          peer-checked:border-purple-500 peer-checked:bg-purple-500
          group-hover:border-purple-400 dark:group-hover:border-purple-400
          peer-focus:ring-2 peer-focus:ring-purple-500/20 peer-focus:ring-offset-2
          dark:peer-focus:ring-offset-gray-900
          bg-white dark:bg-gray-800
        ">
          <Check 
            className="
              w-4 h-4 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
              opacity-0 peer-checked:opacity-100 transition-opacity duration-200
            " 
            strokeWidth={3}
          />
        </div>
      </div>
      {(label || description) && (
        <div className="flex-1">
          {label && (
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100">
              {label}
            </span>
          )}
          {description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {description}
            </p>
          )}
        </div>
      )}
    </label>
  )
}