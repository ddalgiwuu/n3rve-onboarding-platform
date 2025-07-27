import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, AlertCircle, Lightbulb } from 'lucide-react';

interface EnhancedVisualEffectsProps {
  fieldId: string
  validationState: 'none' | 'error' | 'warning' | 'suggestion' | 'success'
  children: React.ReactNode
  pulseIntensity?: 'subtle' | 'medium' | 'strong'
  showStatusIcon?: boolean
  enableSuccessAnimation?: boolean
}

export function EnhancedVisualEffects({
  fieldId,
  validationState,
  children,
  pulseIntensity = 'medium',
  showStatusIcon = true,
  enableSuccessAnimation = true
}: EnhancedVisualEffectsProps) {
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [previousState, setPreviousState] = useState(validationState);

  // Trigger success animation when validation state improves
  useEffect(() => {
    if (enableSuccessAnimation &&
        previousState !== 'none' &&
        previousState !== 'success' &&
        validationState === 'success') {
      setShowSuccessAnimation(true);
      setTimeout(() => setShowSuccessAnimation(false), 2000);
    }
    setPreviousState(validationState);
  }, [validationState, previousState, enableSuccessAnimation]);

  const getPulseAnimation = () => {
    if (validationState === 'none' || validationState === 'success') return {};

    const intensityMap = {
      subtle: { scale: [1, 1.01, 1], opacity: [1, 0.95, 1] },
      medium: { scale: [1, 1.02, 1], opacity: [1, 0.9, 1] },
      strong: { scale: [1, 1.03, 1], opacity: [1, 0.85, 1] }
    };

    return {
      animate: intensityMap[pulseIntensity],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut'
      }
    };
  };

  const getBorderStyle = () => {
    switch (validationState) {
      case 'error':
        return 'border-red-500 focus-within:border-red-500 shadow-red-100 dark:shadow-red-900/20';
      case 'warning':
        return 'border-amber-500 focus-within:border-amber-500 shadow-amber-100 dark:shadow-amber-900/20';
      case 'suggestion':
        return 'border-blue-500 focus-within:border-blue-500 shadow-blue-100 dark:shadow-blue-900/20';
      case 'success':
        return 'border-green-500 focus-within:border-green-500 shadow-green-100 dark:shadow-green-900/20';
      default:
        return '';
    }
  };

  const getStatusIcon = () => {
    switch (validationState) {
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'suggestion':
        return <Lightbulb className="w-4 h-4 text-blue-500" />;
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      default:
        return null;
    }
  };

  return (
    <motion.div
      className={`relative transition-all duration-300 ${getBorderStyle()}`}
      {...getPulseAnimation()}
    >
      {children}

      {/* Status Icon */}
      <AnimatePresence>
        {showStatusIcon && validationState !== 'none' && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute top-2 right-2 z-10"
          >
            {getStatusIcon()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Animation */}
      <AnimatePresence>
        {showSuccessAnimation && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 1] }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
          >
            <div className="bg-green-500 text-white rounded-full p-2">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

interface SectionHeaderEffectsProps {
  title: string
  validationStatus: 'clean' | 'has_warnings' | 'has_errors'
  issueCount: number
  onNavigateToFirstIssue?: () => void
  language?: 'ko' | 'en'
}

export function SectionHeaderEffects({
  title,
  validationStatus,
  issueCount,
  onNavigateToFirstIssue,
  language = 'en'
}: SectionHeaderEffectsProps) {
  const t = (ko: string, en: string) => language === 'ko' ? ko : en;

  const getHeaderStyle = () => {
    switch (validationStatus) {
      case 'has_errors':
        return 'bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-l-4 border-l-red-500';
      case 'has_warnings':
        return 'bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border-l-4 border-l-amber-500';
      case 'clean':
        return 'bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-l-4 border-l-green-500';
      default:
        return 'bg-gray-50 dark:bg-gray-800';
    }
  };

  const getStatusIcon = () => {
    switch (validationStatus) {
      case 'has_errors':
        return <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />;
      case 'has_warnings':
        return <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
      case 'clean':
        return <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />;
      default:
        return null;
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={`p-4 rounded-lg mb-4 ${getHeaderStyle()}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            {getStatusIcon()}
          </motion.div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </h3>
            {issueCount > 0 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-gray-600 dark:text-gray-400"
              >
                {issueCount} {t('개의 이슈가 발견되었습니다', 'issues found')}
              </motion.p>
            )}
          </div>
        </div>

        {issueCount > 0 && onNavigateToFirstIssue && (
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={onNavigateToFirstIssue}
            className="flex items-center gap-2 px-3 py-1 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {t('첫 번째 이슈로', 'Go to First')}
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

interface ProgressBarProps {
  current: number
  total: number
  label?: string
  showPercentage?: boolean
  colorScheme?: 'blue' | 'green' | 'red' | 'amber'
  animated?: boolean
  language?: 'ko' | 'en'
}

export function AnimatedProgressBar({
  current,
  total,
  label,
  showPercentage = true,
  colorScheme = 'blue',
  animated = true,
  language = 'en'
}: ProgressBarProps) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
  const t = (ko: string, en: string) => language === 'ko' ? ko : en;

  const getColorClasses = () => {
    switch (colorScheme) {
      case 'green':
        return 'bg-green-500';
      case 'red':
        return 'bg-red-500';
      case 'amber':
        return 'bg-amber-500';
      default:
        return 'bg-blue-500';
    }
  };

  return (
    <div className="w-full">
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-2">
          {label && (
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {label}
            </span>
          )}
          {showPercentage && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {percentage}%
            </span>
          )}
        </div>
      )}

      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <motion.div
          initial={animated ? { width: 0 } : { width: `${percentage}%` }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: animated ? 1 : 0, ease: 'easeOut' }}
          className={`h-2 rounded-full ${getColorClasses()}`}
        />
      </div>

      <div className="flex justify-between mt-1 text-xs text-gray-500 dark:text-gray-400">
        <span>{current}</span>
        <span>{total}</span>
      </div>
    </div>
  );
}

interface ValidationBadgeProps {
  type: 'error' | 'warning' | 'suggestion' | 'success'
  count: number
  animated?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function ValidationBadge({
  type,
  count,
  animated = true,
  size = 'md'
}: ValidationBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2'
  };

  const getTypeClasses = () => {
    switch (type) {
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'warning':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
      case 'suggestion':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'success':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'error':
        return <AlertCircle className="w-3 h-3" />;
      case 'warning':
        return <AlertTriangle className="w-3 h-3" />;
      case 'suggestion':
        return <Lightbulb className="w-3 h-3" />;
      case 'success':
        return <CheckCircle2 className="w-3 h-3" />;
      default:
        return null;
    }
  };

  if (count === 0) return null;

  return (
    <motion.div
      initial={animated ? { scale: 0, opacity: 0 } : {}}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeClasses[size]} ${getTypeClasses()}`}
    >
      {getIcon()}
      <motion.span
        key={count}
        initial={animated ? { scale: 1.5 } : {}}
        animate={{ scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        {count}
      </motion.span>
    </motion.div>
  );
}
