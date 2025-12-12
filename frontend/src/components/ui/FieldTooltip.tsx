import { useState } from 'react';
import { Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';

interface FieldTooltipProps {
  title: string;
  description: string;
  note?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export default function FieldTooltip({
  title,
  description,
  note,
  position = 'top',
  className,
}: FieldTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div className={clsx('relative inline-block', className)}>
      {/* Trigger Icon */}
      <button
        type="button"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onClick={(e) => {
          e.preventDefault();
          setIsOpen(!isOpen);
        }}
        className={clsx(
          'inline-flex items-center justify-center',
          'w-5 h-5 rounded-full',
          'text-gray-400 hover:text-purple-400',
          'transition-colors duration-200',
          'focus:outline-none focus:ring-2 focus:ring-purple-500/50'
        )}
        aria-label="More information"
      >
        <Info size={16} />
      </button>

      {/* Tooltip Content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 5 }}
            transition={{ duration: 0.15 }}
            className={clsx(
              'absolute z-50',
              positionClasses[position],
              'w-80 max-w-sm'
            )}
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
          >
            {/* Arrow */}
            <div
              className={clsx(
                'absolute w-3 h-3',
                'bg-gray-800 dark:bg-gray-900',
                'transform rotate-45',
                position === 'top' && 'bottom-[-6px] left-1/2 -translate-x-1/2',
                position === 'bottom' && 'top-[-6px] left-1/2 -translate-x-1/2',
                position === 'left' && 'right-[-6px] top-1/2 -translate-y-1/2',
                position === 'right' && 'left-[-6px] top-1/2 -translate-y-1/2'
              )}
            />

            {/* Tooltip Box */}
            <div
              className={clsx(
                'relative',
                'bg-gray-800 dark:bg-gray-900',
                'border border-gray-700 dark:border-gray-800',
                'rounded-xl shadow-2xl',
                'p-4',
                'backdrop-blur-sm'
              )}
            >
              {/* Title */}
              <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <Info size={14} className="text-purple-400" />
                {title}
              </h4>

              {/* Description */}
              <div className="text-xs text-gray-300 space-y-2 whitespace-pre-line">
                {description}
              </div>

              {/* Note (if provided) */}
              {note && (
                <div className="mt-3 pt-3 border-t border-gray-700">
                  <p className="text-xs text-yellow-400 flex items-start gap-2">
                    <span className="text-yellow-400 font-bold">💡</span>
                    <span className="flex-1">{note}</span>
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ==========================================
// Compact Tooltip for Labels
// ==========================================
interface LabelWithTooltipProps {
  label: string;
  tooltip: {
    title: string;
    description: string;
    note?: string;
  };
  required?: boolean;
  className?: string;
}

export function LabelWithTooltip({
  label,
  tooltip,
  required,
  className,
}: LabelWithTooltipProps) {
  return (
    <div className={clsx('flex items-center gap-2', className)}>
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <FieldTooltip
        title={tooltip.title}
        description={tooltip.description}
        note={tooltip.note}
      />
    </div>
  );
}
