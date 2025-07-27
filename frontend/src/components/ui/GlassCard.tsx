import React from 'react';
import { cn } from '@/utils/cn';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'light' | 'default' | 'strong' | 'ultra';
  color?: 'default' | 'purple' | 'blue' | 'pink';
  hover?: boolean;
  onClick?: () => void;
}

export default function GlassCard({
  children,
  className,
  variant = 'default',
  color = 'default',
  hover = true,
  onClick
}: GlassCardProps) {
  const getVariantClass = () => {
    const variantClasses = {
      light: 'glass-effect-light',
      default: 'glass-effect',
      strong: 'glass-effect-strong',
      ultra: 'glass-effect-ultra'
    };
    return variantClasses[variant];
  };

  const getColorClass = () => {
    if (color === 'default') return '';
    return `glass-${color}`;
  };

  return (
    <div
      className={cn(
        'rounded-2xl p-6 transition-all duration-300',
        getVariantClass(),
        getColorClass(),
        hover && 'hover:shadow-2xl hover:-translate-y-1',
        onClick && 'cursor-pointer',
        'border border-white/20 dark:border-white/10',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

// Export individual glass effect components for convenience
export const GlassButton = ({
  children,
  variant = 'secondary',
  className,
  ...props
}: {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  return (
    <button
      className={cn(
        'px-6 py-3 rounded-xl font-medium transition-all duration-300',
        variant === 'primary' ? 'glass-button-primary' : 'glass-button-secondary',
        className
      )}
      {...props}
    >
      {children}
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