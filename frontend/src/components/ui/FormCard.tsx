import React from 'react'
import { cn } from '@/utils/cn'

interface FormCardProps {
  children: React.ReactNode
  className?: string
  title?: string
  description?: string
  icon?: React.ReactNode
}

export default function FormCard({ 
  children, 
  className, 
  title, 
  description, 
  icon 
}: FormCardProps) {
  return (
    <div className={cn(
      "bg-white dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-6 shadow-lg shadow-gray-100/50 dark:shadow-gray-900/50 hover:shadow-xl hover:shadow-gray-200/50 dark:hover:shadow-gray-900/80 transition-all duration-300",
      className
    )}>
      {(title || icon) && (
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100 dark:border-gray-700/50">
          {icon && (
            <div className="w-10 h-10 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 rounded-xl flex items-center justify-center">
              {React.cloneElement(icon as React.ReactElement, {
                className: "w-5 h-5 text-blue-600 dark:text-blue-400"
              })}
            </div>
          )}
          <div>
            {title && (
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {description}
              </p>
            )}
          </div>
        </div>
      )}
      {children}
    </div>
  )
}