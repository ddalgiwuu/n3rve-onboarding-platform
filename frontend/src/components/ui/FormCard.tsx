import { cloneElement, ReactElement, ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface FormCardProps {
  children: ReactNode
  className?: string
  title?: string
  description?: string
  icon?: ReactNode
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
      'glass-card',
      className
    )}>
      {(title || icon) && (
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100 dark:border-gray-700/50">
          {icon && (
            <div className="w-10 h-10 glass-blue rounded-xl flex items-center justify-center">
              {cloneElement(icon as ReactElement<any>, {
                className: 'w-5 h-5 text-blue-600 dark:text-blue-400'
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
  );
}
