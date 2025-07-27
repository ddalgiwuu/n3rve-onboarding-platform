import { useState, useMemo } from 'react';
import {
  AlertCircle, AlertTriangle, CheckCircle,
  X, ChevronDown, ChevronUp, Lightbulb, Sparkles,
  Music
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
    rejectionMessageKo?: string
  }[]
  canIgnore: boolean
  warningGroup?: string // For grouping similar warnings
  rejectionProbability?: number // 0-100
}

interface EnhancedValidationWarningProps {
  warnings: ValidationWarning[]
  onAcceptSuggestion?: (warning: ValidationWarning) => void
  onAcceptAll?: (warningGroup: string) => void
  onDismissWarning?: (warning: ValidationWarning) => void
  onDismissAll?: (warningGroup: string) => void
  language?: 'ko' | 'en'
  displayMode?: 'inline' | 'grouped'
  relatedInputId?: string // For highlighting the related input
}

// Platform icons as inline SVGs
const SpotifyIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.24 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
  </svg>
);

const AppleMusicIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
    <path d="M23.994 6.124a9.23 9.23 0 00-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043a5.022 5.022 0 00-1.877-.726 10.496 10.496 0 00-1.564-.15c-.04-.003-.083-.01-.124-.013H5.99c-.152.01-.303.017-.455.026-.747.043-1.49.123-2.193.4-1.336.53-2.3 1.452-2.865 2.78-.192.448-.292.925-.363 1.408-.056.392-.088.785-.1 1.18 0 .032-.007.062-.01.093v12.223c.01.14.017.283.027.424.05.815.154 1.624.497 2.373.65 1.42 1.738 2.353 3.234 2.801.42.127.856.187 1.293.228.555.053 1.11.06 1.667.06h11.03a12.5 12.5 0 001.57-.1c.822-.078 1.596-.31 2.3-.81a5.384 5.384 0 001.93-2.502c.23-.612.346-1.252.418-1.9.024-.21.043-.42.058-.63.01-.14.017-.28.024-.42V6.364c-.003-.083-.01-.167-.015-.25l-.004-.014zm-1.574 5.793V19.97c0 .26-.015.52-.045.78-.057.493-.165.97-.394 1.41-.456.877-1.197 1.414-2.15 1.612a9.68 9.68 0 01-1.847.1H5.974c-.327 0-.653-.01-.98-.035a5.02 5.02 0 01-.968-.163c-.816-.25-1.402-.77-1.737-1.57-.202-.478-.293-.984-.334-1.5a12.4 12.4 0 01-.033-.994V6.39c0-.166.007-.333.018-.5.022-.355.06-.71.144-1.055.184-.76.574-1.384 1.253-1.788.418-.25.88-.397 1.36-.46.585-.08 1.175-.082 1.764-.082h11.535c.44 0 .88.017 1.316.08.654.095 1.265.297 1.78.72.576.47.933 1.073 1.102 1.8.107.46.144.935.144 1.412v5.4h-.003zm-6.543-6.475c-.027-.153-.058-.306-.105-.453a1.764 1.764 0 00-.662-.965 1.96 1.96 0 00-.735-.28 5.697 5.697 0 00-.84-.065c-.607-.01-1.213 0-1.82 0h-6.78c-.346 0-.692.01-1.037.05-.393.044-.773.135-1.115.35-.527.33-.847.807-.98 1.407-.044.2-.064.407-.064.613v9.07c0 .214.02.427.068.636.144.635.516 1.096 1.094 1.372.223.107.462.166.708.2.34.047.683.058 1.026.058.71 0 1.42 0 2.13-.002.212 0 .382-.147.447-.35a.51.51 0 00-.054-.475.502.502 0 00-.425-.204c-.547.003-1.094.002-1.64.002-.294 0-.587-.01-.878-.04a1.46 1.46 0 01-.432-.123c-.292-.138-.474-.372-.547-.684a2.14 2.14 0 01-.05-.468V6.366c0-.2.015-.398.066-.59.094-.345.307-.578.627-.71.197-.08.408-.122.622-.137.315-.022.632-.027.95-.027h7.02c.284 0 .567.01.85.033.24.02.472.063.69.162.35.16.578.437.68.808.038.142.056.29.056.437v7.467c0 .445-.12.82-.484 1.076-.217.152-.468.224-.73.258-.255.033-.513.043-.77.043-.592 0-1.184 0-1.776.002a.51.51 0 00-.492.444.502.502 0 00.376.566c.102.024.208.03.313.03.73 0 1.46-.002 2.19-.003.327-.002.654-.02.977-.07.442-.067.853-.21 1.21-.47.582-.42.875-1.027.875-1.8V6.446c0-.183-.007-.366-.026-.548l.002.002z"/>
  </svg>
);

export default function EnhancedValidationWarning({
  warnings,
  onAcceptSuggestion,
  onAcceptAll,
  onDismissWarning,
  onDismissAll,
  language = 'en',
  displayMode = 'grouped',
  relatedInputId
}: EnhancedValidationWarningProps) {
  const [expandedWarnings, setExpandedWarnings] = useState<Set<string>>(new Set());
  const [dismissedWarnings, setDismissedWarnings] = useState<Set<string>>(new Set());
  // Removed unused showAllGroups state

  const t = (ko: string, en: string) => language === 'ko' ? ko : en;

  // Group warnings by type
  const groupedWarnings = useMemo(() => {
    const groups: Record<string, ValidationWarning[]> = {};
    warnings.forEach(warning => {
      const group = warning.warningGroup || warning.type;
      if (!groups[group]) groups[group] = [];
      groups[group].push(warning);
    });
    return groups;
  }, [warnings]);

  // Calculate summary stats
  const summary = useMemo(() => {
    const active = warnings.filter(w => !dismissedWarnings.has(w.id));
    return {
      total: active.length,
      errors: active.filter(w => w.type === 'error').length,
      warnings: active.filter(w => w.type === 'warning').length,
      suggestions: active.filter(w => w.type === 'suggestion').length,
      avgRejectionProbability: active.length > 0
        ? Math.round(active.reduce((sum, w) => sum + (w.rejectionProbability || 0), 0) / active.length)
        : 0
    };
  }, [warnings, dismissedWarnings]);

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

  const handleDismissGroup = (group: string) => {
    const groupWarnings = groupedWarnings[group] || [];
    groupWarnings.forEach(w => {
      setDismissedWarnings(prev => new Set(prev).add(w.id));
    });
    onDismissAll?.(group);
  };

  const getWarningConfig = (type: ValidationWarning['type']) => {
    switch (type) {
      case 'error':
        return {
          icon: AlertCircle,
          bgGradient: 'from-red-50 via-red-50 to-red-100',
          borderColor: 'border-red-300',
          iconColor: 'text-red-600',
          titleColor: 'text-red-900',
          textColor: 'text-red-700',
          darkBg: 'dark:from-red-950/30 dark:via-red-900/20 dark:to-red-800/20',
          darkBorder: 'dark:border-red-800',
          darkIconColor: 'dark:text-red-400',
          darkTitleColor: 'dark:text-red-100',
          darkTextColor: 'dark:text-red-300',
          title: t('오류', 'Error'),
          inputBorderClass: 'border-red-500 focus:border-red-500'
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          bgGradient: 'from-amber-50 via-amber-50 to-amber-100',
          borderColor: 'border-amber-300',
          iconColor: 'text-amber-600',
          titleColor: 'text-amber-900',
          textColor: 'text-amber-700',
          darkBg: 'dark:from-amber-950/30 dark:via-amber-900/20 dark:to-amber-800/20',
          darkBorder: 'dark:border-amber-700',
          darkIconColor: 'dark:text-amber-400',
          darkTitleColor: 'dark:text-amber-100',
          darkTextColor: 'dark:text-amber-300',
          title: t('경고', 'Warning'),
          inputBorderClass: 'border-amber-500 focus:border-amber-500'
        };
      case 'suggestion':
        return {
          icon: Lightbulb,
          bgGradient: 'from-blue-50 via-blue-50 to-blue-100',
          borderColor: 'border-blue-300',
          iconColor: 'text-blue-600',
          titleColor: 'text-blue-900',
          textColor: 'text-blue-700',
          darkBg: 'dark:from-blue-950/30 dark:via-blue-900/20 dark:to-blue-800/20',
          darkBorder: 'dark:border-blue-700',
          darkIconColor: 'dark:text-blue-400',
          darkTitleColor: 'dark:text-blue-100',
          darkTextColor: 'dark:text-blue-300',
          title: t('제안', 'Suggestion'),
          inputBorderClass: 'border-blue-500 focus:border-blue-500'
        };
    }
  };

  const getPlatformIcon = (platform: string) => {
    if (platform.toLowerCase().includes('spotify')) return <SpotifyIcon />;
    if (platform.toLowerCase().includes('apple')) return <AppleMusicIcon />;
    return <Music className="w-4 h-4" />;
  };

  const getPlatformColor = (platform: string) => {
    if (platform.toLowerCase().includes('spotify')) return 'text-green-600 dark:text-green-400';
    if (platform.toLowerCase().includes('apple')) return 'text-gray-800 dark:text-gray-300';
    return 'text-purple-600 dark:text-purple-400';
  };

  const activeWarnings = warnings.filter(w => !dismissedWarnings.has(w.id));

  if (activeWarnings.length === 0) return null;

  // Add input highlighting effect
  if (relatedInputId && activeWarnings.some(w => w.type === 'error')) {
    const input = document.getElementById(relatedInputId);
    if (input) {
      input.classList.add('border-red-500', 'focus:border-red-500');
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="mt-2"
      >
        {/* Summary Header */}
        {displayMode === 'grouped' && activeWarnings.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-3 p-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {t('검증 결과', 'Validation Results')}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  {summary.errors > 0 && (
                    <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                      <AlertCircle className="w-3 h-3" />
                      {summary.errors} {t('오류', summary.errors === 1 ? 'error' : 'errors')}
                    </span>
                  )}
                  {summary.warnings > 0 && (
                    <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                      <AlertTriangle className="w-3 h-3" />
                      {summary.warnings} {t('경고', summary.warnings === 1 ? 'warning' : 'warnings')}
                    </span>
                  )}
                  {summary.suggestions > 0 && (
                    <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                      <Lightbulb className="w-3 h-3" />
                      {summary.suggestions} {t('제안', summary.suggestions === 1 ? 'suggestion' : 'suggestions')}
                    </span>
                  )}
                </div>
              </div>
              {summary.avgRejectionProbability > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {t('예상 거절률:', 'Est. rejection rate:')}
                  </span>
                  <span className={`text-sm font-medium ${
                    summary.avgRejectionProbability > 70 ? 'text-red-600 dark:text-red-400' :
                      summary.avgRejectionProbability > 40 ? 'text-amber-600 dark:text-amber-400' :
                        'text-green-600 dark:text-green-400'
                  }`}>
                    {summary.avgRejectionProbability}%
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Warnings List */}
        <div className="space-y-2">
          {displayMode === 'inline' ? (
            // Inline mode - show all warnings individually
            activeWarnings.map((warning) => (
              <WarningItem
                key={warning.id}
                warning={warning}
                isExpanded={expandedWarnings.has(warning.id)}
                onToggleExpanded={() => toggleExpanded(warning.id)}
                onAccept={() => onAcceptSuggestion?.(warning)}
                onDismiss={() => handleDismiss(warning)}
                getWarningConfig={getWarningConfig}
                getPlatformIcon={getPlatformIcon}
                getPlatformColor={getPlatformColor}
                t={t}
                language={language}
              />
            ))
          ) : (
            // Grouped mode
            Object.entries(groupedWarnings).map(([group, groupWarnings]) => {
              const activeGroupWarnings = groupWarnings.filter(w => !dismissedWarnings.has(w.id));
              if (activeGroupWarnings.length === 0) return null;

              const canFixAll = activeGroupWarnings.some(w => w.suggestedValue && w.type !== 'error');
              const canDismissAll = activeGroupWarnings.some(w => w.canIgnore);

              return (
                <motion.div
                  key={group}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                >
                  <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {getGroupTitle(group, t)}
                    </h4>
                    <div className="flex items-center gap-2">
                      {canFixAll && onAcceptAll && (
                        <button
                          onClick={() => onAcceptAll(group)}
                          className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded transition-colors"
                        >
                          <CheckCircle className="w-3 h-3" />
                          {t('모두 수정', 'Fix All')}
                        </button>
                      )}
                      {canDismissAll && (
                        <button
                          onClick={() => handleDismissGroup(group)}
                          className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded transition-colors"
                        >
                          <X className="w-3 h-3" />
                          {t('모두 무시', 'Dismiss All')}
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {activeGroupWarnings.map((warning) => (
                      <WarningItem
                        key={warning.id}
                        warning={warning}
                        isExpanded={expandedWarnings.has(warning.id)}
                        onToggleExpanded={() => toggleExpanded(warning.id)}
                        onAccept={() => onAcceptSuggestion?.(warning)}
                        onDismiss={() => handleDismiss(warning)}
                        getWarningConfig={getWarningConfig}
                        getPlatformIcon={getPlatformIcon}
                        getPlatformColor={getPlatformColor}
                        t={t}
                        language={language}
                        isGrouped
                      />
                    ))}
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Individual warning item component
function WarningItem({
  warning,
  isExpanded,
  onToggleExpanded,
  onAccept,
  onDismiss,
  getWarningConfig,
  getPlatformIcon,
  getPlatformColor,
  t,
  language,
  isGrouped = false
}: any) {
  const config = getWarningConfig(warning.type);
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 20, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className={`
        relative overflow-hidden
        ${!isGrouped ? `rounded-lg border bg-gradient-to-r ${config.bgGradient} ${config.darkBg} ${config.borderColor} ${config.darkBorder} shadow-sm hover:shadow-md transition-shadow` : ''}
      `}
    >
      <div className={`${isGrouped ? 'px-4 py-3' : 'p-3'}`}>
        {/* Header */}
        <div className="flex items-start gap-3">
          <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${config.iconColor} ${config.darkIconColor}`} />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-medium ${config.titleColor} ${config.darkTitleColor}`}>
                {config.title}
              </span>
              {warning.rejectionProbability && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  warning.rejectionProbability > 70 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                    warning.rejectionProbability > 40 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' :
                      'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                }`}>
                  {warning.rejectionProbability}% {t('거절 가능성', 'rejection risk')}
                </span>
              )}
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
                  <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-gray-700 dark:text-gray-300 font-mono text-xs">
                    {warning.currentValue}
                  </code>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-gray-600 dark:text-gray-400">
                    {t('제안:', 'Suggested:')}
                  </span>
                  <code className="px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 rounded text-green-700 dark:text-green-300 font-mono text-xs">
                    {warning.suggestedValue}
                  </code>
                </div>
              </div>
            )}

            {/* Details Section */}
            {(warning.details || warning.dspExamples) && (
              <button
                onClick={onToggleExpanded}
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
                      {warning.dspExamples.map((example: { platform: string; rejectionMessage: string; rejectionMessageKo?: string }, idx: number) => (
                        <div key={idx} className="flex items-start gap-2 text-xs bg-gray-50 dark:bg-gray-800 rounded p-2">
                          <span className={`${getPlatformColor(example.platform)}`}>
                            {getPlatformIcon(example.platform)}
                          </span>
                          <div className="flex-1">
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                              {example.platform}:
                            </span>
                            <p className="text-gray-600 dark:text-gray-400 italic mt-0.5">
                              "{language === 'ko' && example.rejectionMessageKo ? example.rejectionMessageKo : example.rejectionMessage}"
                            </p>
                          </div>
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
                {warning.suggestedValue && onAccept && (
                  <button
                    onClick={onAccept}
                    className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors"
                  >
                    <CheckCircle className="w-3 h-3" />
                    {t('제안 적용', 'Apply suggestion')}
                  </button>
                )}
                {warning.canIgnore && (
                  <button
                    onClick={onDismiss}
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
          {warning.type !== 'error' && warning.canIgnore && !isGrouped && (
            <button
              onClick={onDismiss}
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
}

// Helper function to get group titles
function getGroupTitle(group: string, t: (ko: string, en: string) => string): string {
  const groupTitles: Record<string, string> = {
    'feat': t('피처링 형식', 'Featuring Format'),
    'brackets': t('괄호 스타일', 'Bracket Style'),
    'version': t('버전 표기', 'Version Format'),
    'spacing': t('공백 문제', 'Spacing Issues'),
    'special_chars': t('특수문자', 'Special Characters'),
    'error': t('오류', 'Errors'),
    'warning': t('경고', 'Warnings'),
    'suggestion': t('제안사항', 'Suggestions')
  };
  return groupTitles[group] || group;
}
