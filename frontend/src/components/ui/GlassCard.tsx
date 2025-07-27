import React from 'react';
import { cn } from '@/utils/cn';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'light' | 'default' | 'strong' | 'ultra' | 'enhanced' | 'premium' | 'modern';
  color?: 'default' | 'purple' | 'blue' | 'pink' | 'success' | 'warning' | 'error';
  hover?: boolean;
  onClick?: () => void;
  animate?: boolean;
  gradient?: boolean;
}

export default function GlassCard({
  children,
  className,
  variant = 'default',
  color = 'default',
  hover = true,
  onClick,
  animate = false,
  gradient = false
}: GlassCardProps) {
  const getVariantClass = () => {
    const variantClasses = {
      light: 'glass-effect-light',
      default: 'glass-effect',
      strong: 'glass-effect-strong',
      ultra: 'glass-effect-ultra',
      enhanced: 'glass-enhanced',
      premium: 'glass-premium',
      modern: 'glass-card-modern'
    };
    return variantClasses[variant];
  };

  const getColorClass = () => {
    if (color === 'default') return '';
    const colorClasses = {
      purple: 'glass-purple',
      blue: 'glass-blue', 
      pink: 'glass-pink',
      success: 'glass-success',
      warning: 'glass-warning',
      error: 'glass-error'
    };
    return colorClasses[color] || `glass-${color}`;
  };

  return (
    <div
      className={cn(
        'rounded-2xl p-6 transition-all duration-300 relative overflow-hidden group',
        getVariantClass(),
        getColorClass(),
        hover && 'hover:shadow-2xl hover:-translate-y-1',
        onClick && 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]',
        variant === 'premium' && 'hover:-translate-y-2 hover:scale-[1.02]',
        variant === 'modern' && 'hover-glass-lift',
        'border border-white/20 dark:border-white/10',
        animate && 'animate-fade-in',
        gradient && 'bg-gradient-to-br from-white/10 to-white/5 dark:from-gray-800/10 dark:to-gray-900/5',
        className
      )}
      onClick={onClick}
    >
      {/* Glass shimmer effect for premium cards */}
      {variant === 'premium' && (
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 transform translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
        </div>
      )}
      
      {/* Content container */}
      <div className="relative z-10">
        {children}
      </div>
      
      {/* Floating animation dots for enhanced cards */}
      {variant === 'enhanced' && animate && (
        <div className="absolute top-4 right-4 opacity-20">
          <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
          <div className="w-1 h-1 bg-current rounded-full animate-bounce ml-3 -mt-1" style={{ animationDelay: '0.2s' }} />
          <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce ml-1 -mt-2" style={{ animationDelay: '0.4s' }} />
        </div>
      )}
    </div>
  );
}

// Export individual glass effect components for convenience
export const GlassButton = ({
  children,
  variant = 'secondary',
  className,
  icon,
  ...props
}: {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'modern' | 'premium';
  className?: string;
  icon?: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  const getVariantClass = () => {
    switch (variant) {
      case 'primary':
        return 'glass-btn-primary';
      case 'modern':
        return 'glass-btn-modern';
      case 'premium':
        return 'glass-premium px-6 py-3 rounded-xl font-medium text-purple-700 dark:text-purple-300';
      default:
        return 'glass-button-secondary';
    }
  };

  return (
    <button
      className={cn(
        'px-6 py-3 rounded-xl font-medium transition-all duration-300 relative overflow-hidden group',
        'hover:scale-105 active:scale-95',
        getVariantClass(),
        className
      )}
      {...props}
    >
      {/* Shimmer effect for premium variant */}
      {variant === 'premium' && (
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
        </div>
      )}
      
      <span className="relative z-10 flex items-center gap-2">
        {icon && <span className="transition-transform duration-200 group-hover:scale-110">{icon}</span>}
        {children}
      </span>
    </button>
  );
};

export const GlassBadge = ({
  children,
  className,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
} & React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn('glass-badge', className)}
      {...props}
    >
      {children}
    </span>
  );
};

export const GlassTooltip = ({
  children,
  className,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn('glass-tooltip', className)}
      {...props}
    >
      {children}
    </div>
  );
};