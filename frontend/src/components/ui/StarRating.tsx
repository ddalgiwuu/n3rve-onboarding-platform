import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { clsx } from 'clsx';

interface StarRatingProps {
  label?: string;
  value: number;
  onChange: (value: number) => void;
  max?: number;
  required?: boolean;
  helpText?: string;
  descriptions?: Record<number, string>;
  className?: string;
  variant?: 'default' | 'glass';
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'w-5 h-5',
  md: 'w-7 h-7',
  lg: 'w-9 h-9'
};

export function StarRating({
  label,
  value,
  onChange,
  max = 5,
  required = false,
  helpText,
  descriptions,
  className,
  variant = 'glass',
  size = 'md'
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const displayValue = hoverValue !== null ? hoverValue : value;
  const currentDescription = descriptions?.[displayValue];

  const handleClick = (rating: number) => {
    onChange(rating);
  };

  const variantClasses = {
    default: 'bg-gray-100 dark:bg-gray-800',
    glass: 'bg-white/5 backdrop-blur-md'
  };

  return (
    <div className={clsx('space-y-3', className)}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-white">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}

      {/* Stars */}
      <div className="flex items-center gap-2">
        {Array.from({ length: max }, (_, i) => i + 1).map((rating) => {
          const isFilled = rating <= displayValue;
          const isHovered = hoverValue !== null && rating <= hoverValue;

          return (
            <motion.button
              key={rating}
              type="button"
              onClick={() => handleClick(rating)}
              onMouseEnter={() => setHoverValue(rating)}
              onMouseLeave={() => setHoverValue(null)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className={clsx(
                'relative cursor-pointer transition-all',
                'focus:outline-none focus:ring-2 focus:ring-purple-500/50 rounded',
                isHovered && 'drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]'
              )}
              aria-label={`Rate ${rating} out of ${max}`}
            >
              <Star
                className={clsx(
                  sizeClasses[size],
                  'transition-all duration-200',
                  isFilled ? 'fill-purple-500 stroke-purple-500' : 'fill-none stroke-gray-600',
                  isHovered && 'stroke-purple-400'
                )}
              />

              {/* Glow effect on hover */}
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="
                    absolute inset-0 -z-10
                    bg-purple-500/20 blur-lg rounded-full
                  "
                />
              )}
            </motion.button>
          );
        })}

        {/* Current value indicator */}
        <span className={clsx(
          'ml-2 text-sm font-medium',
          value > 0 ? 'text-purple-400' : 'text-gray-500'
        )}>
          {value > 0 ? `${value} / ${max}` : 'Not rated'}
        </span>
      </div>

      {/* Description */}
      <AnimatePresence mode="wait">
        {currentDescription && (
          <motion.div
            key={displayValue}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
            className={clsx(
              'p-3 rounded-xl text-sm',
              variantClasses[variant]
            )}
          >
            <div className="flex items-start gap-2">
              <Star size={16} className="fill-purple-500 stroke-purple-500 flex-shrink-0 mt-0.5" />
              <p className="text-gray-300">{currentDescription}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Help text */}
      {helpText && !currentDescription && (
        <p className="text-xs text-gray-400">{helpText}</p>
      )}
    </div>
  );
}
