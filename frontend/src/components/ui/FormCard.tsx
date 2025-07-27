import { cloneElement, ReactElement, ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface FormCardProps {
  children: ReactNode
  className?: string
  title?: string
  description?: string
  icon?: ReactNode
  variant?: 'default' | 'glass' | 'enhanced' | 'premium'
  animate?: boolean
}

export default function FormCard({
  children,
  className,
  title,
  description,
  icon,
  variant = 'default',
  animate = false
}: FormCardProps) {
  const getVariantClass = () => {
    switch (variant) {
      case 'glass':
        return 'glass-form';
      case 'enhanced':
        return 'glass-enhanced rounded-2xl p-6';
      case 'premium':
        return 'glass-premium rounded-3xl p-8';
      default:
        return 'glass-card';
    }
  };

  return (
    <div className={cn(
      getVariantClass(),
      'transition-all duration-300 relative overflow-hidden group',
      animate && 'animate-fade-in hover:scale-[1.01]',
      variant === 'premium' && 'hover:-translate-y-1 hover:shadow-2xl',
      className
    )}>
      {/* Premium shimmer effect */}
      {variant === 'premium' && (
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 transform translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
        </div>
      )}
      
      {/* Header section */}
      {(title || icon) && (
        <div className="flex items-center gap-4 mb-6 pb-4 border-b border-white/20 dark:border-white/10 relative z-10">
          {icon && (
            <div className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300',
              variant === 'premium' ? 'glass-effect-strong' : 'glass-blue',
              'group-hover:scale-110 group-hover:shadow-lg'
            )}>
              {cloneElement(icon as ReactElement<any>, {
                className: cn(
                  'w-6 h-6 transition-all duration-300',
                  variant === 'premium' 
                    ? 'text-purple-600 dark:text-purple-400 group-hover:scale-110' 
                    : 'text-blue-600 dark:text-blue-400'
                )
              })}
            </div>
          )}
          <div className="flex-1">
            {title && (
              <h3 className={cn(
                'font-semibold text-gray-900 dark:text-white transition-all duration-300',
                variant === 'premium' ? 'text-xl' : 'text-lg',
                'group-hover:text-purple-600 dark:group-hover:text-purple-400'
              )}>
                {title}
              </h3>
            )}
            {description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
                {description}
              </p>
            )}
          </div>
        </div>
      )}
      
      {/* Content section */}
      <div className="relative z-10">
        {children}
      </div>
      
      {/* Decorative elements for enhanced variant */}
      {variant === 'enhanced' && animate && (
        <div className="absolute bottom-4 right-4 opacity-10 pointer-events-none">
          <div className="flex gap-1">
            <div className="w-1 h-1 bg-current rounded-full animate-pulse" style={{ animationDelay: '0s' }} />
            <div className="w-1 h-1 bg-current rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
            <div className="w-1 h-1 bg-current rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
          </div>
        </div>
      )}
    </div>
  );
}
