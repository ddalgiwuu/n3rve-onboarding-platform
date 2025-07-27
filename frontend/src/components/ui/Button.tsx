import React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'glass' | 'glass-primary' | 'glass-modern' | 'glass-premium' | 'glass-success' | 'glass-warning'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  loading?: boolean
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
}

export default function Button({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  icon,
  iconPosition = 'left',
  ...props
}: ButtonProps) {
  const variants = {
    primary: 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95',
    secondary: 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600 hover:scale-105 active:scale-95',
    ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 hover:scale-105 active:scale-95',
    danger: 'bg-red-500 text-white hover:bg-red-600 hover:scale-105 active:scale-95',
    glass: 'glass-button-secondary hover:scale-105 active:scale-95',
    'glass-primary': 'glass-btn-primary hover:scale-105 active:scale-95',
    'glass-modern': 'glass-btn-modern text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white',
    'glass-premium': 'glass-premium px-6 py-3 rounded-xl font-medium text-purple-700 dark:text-purple-300 hover:text-purple-900 dark:hover:text-purple-100',
    'glass-success': 'glass-enhanced glass-success rounded-xl px-6 py-3 font-medium hover:scale-105 active:scale-95',
    'glass-warning': 'glass-enhanced glass-warning rounded-xl px-6 py-3 font-medium hover:scale-105 active:scale-95'
  };

  const sizes = {
    sm: 'px-3 py-2 text-sm min-h-[40px]',
    md: 'px-4 py-3 text-base sm:text-sm min-h-[44px]',
    lg: 'px-6 py-3.5 text-lg sm:text-base min-h-[48px]',
    xl: 'px-8 py-4 text-xl min-h-[56px]'
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-300',
        'focus:outline-none focus:ring-4 sm:focus:ring-2 focus:ring-purple-500 focus:ring-offset-2',
        'dark:focus:ring-offset-gray-900',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
        'relative overflow-hidden group',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {/* Glass shimmer effect */}
      {variant.includes('glass') && (
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
        </div>
      )}
      
      {/* Loading spinner */}
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      
      {/* Left icon */}
      {icon && iconPosition === 'left' && !loading && (
        <span className="mr-2 flex-shrink-0 transition-transform duration-200 group-hover:scale-110">
          {icon}
        </span>
      )}
      
      {/* Button content */}
      <span className="relative z-10">{children}</span>
      
      {/* Right icon */}
      {icon && iconPosition === 'right' && !loading && (
        <span className="ml-2 flex-shrink-0 transition-transform duration-200 group-hover:scale-110">
          {icon}
        </span>
      )}
    </button>
  );
}
