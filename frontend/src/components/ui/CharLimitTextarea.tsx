import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { Sparkles } from 'lucide-react';
import FieldTooltip from './FieldTooltip';

interface CharLimitTextareaProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  minChars?: number;
  maxChars: number;
  placeholder?: string;
  required?: boolean;
  helpText?: string;
  rows?: number;
  className?: string;
  variant?: 'default' | 'glass' | 'glass-enhanced';
  showAIButton?: boolean;
  onAIAssist?: () => void;
  tooltip?: {
    title: string;
    description: string;
    note?: string;
  };
}

export function CharLimitTextarea({
  label,
  value,
  onChange,
  minChars,
  maxChars,
  placeholder,
  required = false,
  helpText,
  rows = 4,
  className,
  variant = 'glass',
  showAIButton = false,
  onAIAssist,
  tooltip
}: CharLimitTextareaProps) {
  const [charCount, setCharCount] = useState(0);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    setCharCount(value.length);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (newValue.length <= maxChars) {
      onChange(newValue);
    }
  };

  // Calculate progress percentage
  const progress = minChars ? (charCount / minChars) * 100 : (charCount / maxChars) * 100;

  // Determine status color
  const getStatusColor = () => {
    if (minChars && charCount < minChars) return 'text-yellow-400';
    if (charCount > maxChars * 0.9) return 'text-orange-400';
    if (charCount === maxChars) return 'text-red-400';
    return 'text-green-400';
  };

  // Determine progress bar color
  const getProgressColor = () => {
    if (minChars && charCount < minChars) return 'bg-yellow-400';
    if (charCount > maxChars * 0.9) return 'bg-orange-400';
    if (charCount === maxChars) return 'bg-red-400';
    return 'bg-green-400';
  };

  const variantClasses = {
    default: 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white',
    glass: 'bg-white/5 backdrop-blur-md border-white/10 text-white placeholder-gray-500',
    'glass-enhanced': 'bg-white/10 backdrop-blur-xl border-white/20 text-white placeholder-gray-400 shadow-lg'
  };

  return (
    <div className={clsx('relative', className)}>
      {/* Label */}
      {label && (
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-white">
              {label}
              {required && <span className="text-red-400 ml-1">*</span>}
            </label>
            {tooltip && (
              <FieldTooltip
                title={tooltip.title}
                description={tooltip.description}
                note={tooltip.note}
              />
            )}
          </div>

          {showAIButton && onAIAssist && (
            <button
              type="button"
              onClick={onAIAssist}
              className="
                flex items-center gap-1.5 px-2.5 py-1
                text-xs font-medium text-purple-400
                bg-purple-500/10 hover:bg-purple-500/20
                border border-purple-500/30
                rounded-lg transition-all
                hover:shadow-lg hover:shadow-purple-500/20
              "
            >
              <Sparkles size={12} />
              AI Assist
              <kbd className="text-[10px] opacity-70">⌘J</kbd>
            </button>
          )}
        </div>
      )}

      {/* Textarea */}
      <div className="relative">
        <textarea
          value={value}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          rows={rows}
          required={required}
          className={clsx(
            'w-full px-4 py-3 rounded-xl border resize-none outline-none',
            'transition-all duration-200',
            variantClasses[variant],
            isFocused && 'ring-2 ring-purple-500/50',
            'font-sans leading-relaxed'
          )}
          aria-describedby={helpText ? `${label}-help` : undefined}
        />

        {/* Character count overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isFocused || charCount > 0 ? 1 : 0 }}
          className="
            absolute bottom-3 right-3
            flex items-center gap-2
          "
        >
          <span className={clsx('text-xs font-medium', getStatusColor())}>
            {charCount}
            {minChars && charCount < minChars && ` / ${minChars}+`}
            {!minChars && ` / ${maxChars}`}
          </span>
        </motion.div>
      </div>

      {/* Progress bar */}
      {isFocused && minChars && (
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          exit={{ opacity: 0, scaleX: 0 }}
          className="mt-2 h-1 bg-white/5 rounded-full overflow-hidden"
        >
          <motion.div
            className={clsx('h-full rounded-full', getProgressColor())}
            initial={{ width: '0%' }}
            animate={{ width: `${Math.min(progress, 100)}%` }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          />
        </motion.div>
      )}

      {/* Help text and warnings */}
      <div className="mt-2 space-y-1">
        {helpText && (
          <p id={`${label}-help`} className="text-xs text-gray-400">
            {helpText}
          </p>
        )}

        {minChars && charCount < minChars && charCount > 0 && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-yellow-400"
          >
            {minChars - charCount} more characters recommended
          </motion.p>
        )}

        {charCount === maxChars && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-red-400"
          >
            Maximum character limit reached
          </motion.p>
        )}
      </div>
    </div>
  );
}
