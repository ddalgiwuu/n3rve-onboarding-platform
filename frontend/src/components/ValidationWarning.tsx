import { useState } from 'react';
import {
  AlertCircle, AlertTriangle, CheckCircle,
  X, ChevronDown, ChevronUp, Lightbulb
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface ValidationWarning {
  id: string
  type: 'error' | 'warning' | 'suggestion'
  field: string
  message: string
  details?: string
  suggestedValue?: string
  currentValue?: string
  dspExamples?: {
    platform: string
    rejectionMessage: string
  }[]
  canIgnore: boolean
}

interface ValidationWarningProps {
  warnings: ValidationWarning[]
  onAcceptSuggestion?: (warning: ValidationWarning) => void
  onDismissWarning?: (warning: ValidationWarning) => void
  language?: 'ko' | 'en'
}

export default function ValidationWarning({
  warnings,
  onAcceptSuggestion,
  onDismissWarning,
  language = 'en'
}: ValidationWarningProps) {
  const [expandedWarnings, setExpandedWarnings] = useState<Set<string>>(new Set());
  const [dismissedWarnings, setDismissedWarnings] = useState<Set<string>>(new Set());

  const t = (ko: string, en: string) => language === 'ko' ? ko : en;

  const toggleExpanded = (warningId: string) => {
    setExpandedWarnings(prev => {
      const newSet = new Set(prev);
      if (newSet.has(warningId)) {
        newSet.delete(warningId);
      } else {
        newSet.add(warningId);
      }
      return newSet;
    });
  };

  const handleDismiss = (warning: ValidationWarning) => {
    setDismissedWarnings(prev => new Set(prev).add(warning.id));
    onDismissWarning?.(warning);
  };

  const getWarningConfig = (type: ValidationWarning['type']) => {
    switch (type) {
      case 'error':
        return {
          icon: AlertCircle,
          bgGradient: 'from-red-50 to-red-100',
          borderColor: 'border-red-200',
          iconColor: 'text-red-600',
          titleColor: 'text-red-900',
          textColor: 'text-red-700',
          darkBg: 'dark:from-red-900/20 dark:to-red-800/20',
          darkBorder: 'dark:border-red-800',
          darkIconColor: 'dark:text-red-400',
          darkTitleColor: 'dark:text-red-100',
          darkTextColor: 'dark:text-red-300',
          title: t('오류', 'Error')
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          bgGradient: 'from-amber-50 to-amber-100',
          borderColor: 'border-amber-200',
          iconColor: 'text-amber-600',
          titleColor: 'text-amber-900',
          textColor: 'text-amber-700',
          darkBg: 'dark:from-amber-900/20 dark:to-amber-800/20',
          darkBorder: 'dark:border-amber-800',
          darkIconColor: 'dark:text-amber-400',
          darkTitleColor: 'dark:text-amber-100',
          darkTextColor: 'dark:text-amber-300',
          title: t('경고', 'Warning')
        };
      case 'suggestion':
        return {
          icon: Lightbulb,
          bgGradient: 'from-blue-50 to-blue-100',
          borderColor: 'border-blue-200',
          iconColor: 'text-blue-600',
          titleColor: 'text-blue-900',
          textColor: 'text-blue-700',
          darkBg: 'dark:from-blue-900/20 dark:to-blue-800/20',
          darkBorder: 'dark:border-blue-800',
          darkIconColor: 'dark:text-blue-400',
          darkTitleColor: 'dark:text-blue-100',
          darkTextColor: 'dark:text-blue-300',
          title: t('제안', 'Suggestion')
        };
    }
  };

  const activeWarnings = warnings.filter(w => !dismissedWarnings.has(w.id));

  if (activeWarnings.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="space-y-2 mt-2"
      >
        {activeWarnings.map((warning) => {
          const config = getWarningConfig(warning.type);
          const Icon = config.icon;
          const isExpanded = expandedWarnings.has(warning.id);

          return (
            <motion.div
              key={warning.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 20, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={`
                relative overflow-hidden rounded-lg border
                bg-gradient-to-r ${config.bgGradient} ${config.darkBg}
                ${config.borderColor} ${config.darkBorder}
                shadow-sm hover:shadow-md transition-shadow
              `}
            >
              <div className="p-3">
                {/* Header */}
                <div className="flex items-start gap-3">
                  <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${config.iconColor} ${config.darkIconColor}`} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-medium ${config.titleColor} ${config.darkTitleColor}`}>
                        {config.title}
                      </span>
                      {warning.type !== 'error' && warning.canIgnore && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {t('(무시 가능)', '(Can be ignored)')}
                        </span>
                      )}
                    </div>

                    <p className={`text-sm ${config.textColor} ${config.darkTextColor}`}>
                      {warning.message}
                    </p>

                    {/* Suggested Value */}
                    {warning.suggestedValue && warning.currentValue && (
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-gray-600 dark:text-gray-400">
                            {t('현재:', 'Current:')}
                          </span>
                          <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-gray-700 dark:text-gray-300">
                            {warning.currentValue}
                          </code>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-gray-600 dark:text-gray-400">
                            {t('제안:', 'Suggested:')}
                          </span>
                          <code className="px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 rounded text-green-700 dark:text-green-300">
                            {warning.suggestedValue}
                          </code>
                        </div>
                      </div>
                    )}

                    {/* Details Section */}
                    {(warning.details || warning.dspExamples) && (
                      <button
                        onClick={() => toggleExpanded(warning.id)}
                        className="mt-2 flex items-center gap-1 text-xs text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="w-3 h-3" />
                            {t('자세히 접기', 'Hide details')}
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-3 h-3" />
                            {t('자세히 보기', 'Show details')}
                          </>
                        )}
                      </button>
                    )}

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="mt-3 space-y-3 overflow-hidden"
                        >
                          {warning.details && (
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {warning.details}
                            </p>
                          )}

                          {warning.dspExamples && warning.dspExamples.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                {t('DSP 거절 사례:', 'DSP Rejection Examples:')}
                              </p>
                              {warning.dspExamples.map((example, idx) => (
                                <div key={idx} className="flex gap-2 text-xs">
                                  <span className="font-medium text-gray-600 dark:text-gray-400">
                                    {example.platform}:
                                  </span>
                                  <span className="text-gray-600 dark:text-gray-400 italic">
                                    "{example.rejectionMessage}"
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Action Buttons */}
                    {(warning.type !== 'error' && (warning.suggestedValue || warning.canIgnore)) && (
                      <div className="mt-3 flex items-center gap-2">
                        {warning.suggestedValue && onAcceptSuggestion && (
                          <button
                            onClick={() => onAcceptSuggestion(warning)}
                            className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors"
                          >
                            <CheckCircle className="w-3 h-3" />
                            {t('제안 적용', 'Apply suggestion')}
                          </button>
                        )}
                        {warning.canIgnore && (
                          <button
                            onClick={() => handleDismiss(warning)}
                            className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 rounded-md transition-colors"
                          >
                            <X className="w-3 h-3" />
                            {t('무시', 'Ignore')}
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Close button for dismissible warnings */}
                  {warning.type !== 'error' && warning.canIgnore && (
                    <button
                      onClick={() => handleDismiss(warning)}
                      className="p-1 rounded-md hover:bg-white/50 dark:hover:bg-gray-700/50 transition-colors"
                      aria-label={t('경고 닫기', 'Dismiss warning')}
                    >
                      <X className="w-4 h-4 text-gray-500" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </AnimatePresence>
  );
}
