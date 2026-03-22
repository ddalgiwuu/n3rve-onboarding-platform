import { AlertTriangle, AlertCircle, Info, CheckCircle, X, Loader2, Wifi, WifiOff } from 'lucide-react';
import { useLanguageStore } from '@/store/language.store';
import useSafeStore from '@/hooks/useSafeStore';
import type { QCValidationResult } from '@/utils/fugaQCValidation';
import type { OpenClawQCResult } from '@/hooks/useOpenClawQC';
import { useState } from 'react';

interface Props {
  results: QCValidationResult[];
  onDismiss?: (index: number) => void;
  compact?: boolean;
  // OpenClaw AI QC integration
  openClawResults?: OpenClawQCResult[];
  isChecking?: boolean;
  isConnected?: boolean;
}

// Category label map for OpenClaw results
const CATEGORY_LABELS: Record<OpenClawQCResult['category'], { ko: string; en: string }> = {
  METADATA: { ko: '메타데이터', en: 'Metadata' },
  AUDIO: { ko: '오디오', en: 'Audio' },
  ARTWORK: { ko: '아트워크', en: 'Artwork' },
  DSP_SPECIFIC: { ko: 'DSP 전용', en: 'DSP Specific' },
  FORMAT: { ko: '포맷', en: 'Format' },
};

export default function QCWarnings({
  results,
  onDismiss,
  compact = false,
  openClawResults,
  isChecking = false,
  isConnected,
}: Props) {
  const [dismissed, setDismissed] = useState<number[]>([]);
  const language = useSafeStore(useLanguageStore, (state) => state.language);
  const t = (ko: string, en: string) => (language === 'ko' ? ko : en);

  const hasOpenClaw = openClawResults && openClawResults.length > 0;
  const hasResults = (results && results.length > 0) || hasOpenClaw || isChecking;

  if (!hasResults && isConnected === undefined) return null;
  if (!hasResults && !isChecking) return null;

  const visibleResults = results ? results.filter((_, index) => !dismissed.includes(index)) : [];

  const handleDismiss = (index: number) => {
    setDismissed([...dismissed, index]);
    onDismiss?.(index);
  };

  const getIcon = (severity: QCValidationResult['severity']) => {
    switch (severity) {
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />;
      case 'info':
        return <Info className="w-4 h-4 text-blue-500 flex-shrink-0" />;
    }
  };

  const getBackgroundClass = (severity: QCValidationResult['severity']) => {
    switch (severity) {
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700 shadow-sm';
      case 'warning':
        return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700 shadow-sm';
      case 'info':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 shadow-sm';
    }
  };

  const getTextClass = (severity: QCValidationResult['severity']) => {
    switch (severity) {
      case 'error':
        return 'text-red-800 dark:text-red-200';
      case 'warning':
        return 'text-amber-800 dark:text-amber-200';
      case 'info':
        return 'text-blue-800 dark:text-blue-200';
    }
  };

  const getOpenClawBg = (severity: OpenClawQCResult['severity']) => {
    switch (severity) {
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 shadow-sm';
      case 'warning':
        return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 shadow-sm';
      case 'info':
        return 'bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-800 shadow-sm';
    }
  };

  const getOpenClawText = (severity: OpenClawQCResult['severity']) => {
    switch (severity) {
      case 'error':
        return 'text-red-800 dark:text-red-200';
      case 'warning':
        return 'text-amber-800 dark:text-amber-200';
      case 'info':
        return 'text-cyan-800 dark:text-cyan-200';
    }
  };

  const getOpenClawIconBg = (severity: OpenClawQCResult['severity']) => {
    switch (severity) {
      case 'error':
        return 'bg-red-100 dark:bg-red-800/30';
      case 'warning':
        return 'bg-amber-100 dark:bg-amber-800/30';
      case 'info':
        return 'bg-cyan-100 dark:bg-cyan-800/30';
    }
  };

  // Compact mode — FUGA only, no OpenClaw
  if (compact) {
    return (
      <div className="mt-1 space-y-1">
        {results &&
          results.map((result, index) => (
            <div key={index} className="flex items-start gap-1.5 text-xs">
              {getIcon(result.severity)}
              <span className={getTextClass(result.severity)}>{result.message}</span>
            </div>
          ))}
      </div>
    );
  }

  // Group OpenClaw results by category
  const openClawByCategory = hasOpenClaw
    ? openClawResults.reduce<Record<string, OpenClawQCResult[]>>((acc, result) => {
        const key = result.category;
        if (!acc[key]) acc[key] = [];
        acc[key].push(result);
        return acc;
      }, {})
    : {};

  return (
    <div className="space-y-3">
      {/* Connection status indicator — only shown when isConnected prop is provided */}
      {isConnected !== undefined && (
        <div className="flex items-center justify-between">
          <div
            className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full ${
              isConnected
                ? 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-400'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
            }`}
          >
            {isConnected ? (
              <>
                <Wifi className="w-3 h-3" />
                <span>{t('AI QC 연결됨', 'AI QC Connected')}</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3" />
                <span>{t('AI QC 미연결', 'AI QC Offline')}</span>
              </>
            )}
          </div>
          {isChecking && (
            <div className="inline-flex items-center gap-1.5 text-xs text-cyan-600 dark:text-cyan-400">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>{t('AI QC 검사 중...', 'AI QC checking...')}</span>
            </div>
          )}
        </div>
      )}

      {/* Checking spinner when no connection indicator shown */}
      {isChecking && isConnected === undefined && (
        <div className="flex items-center gap-2 text-xs text-cyan-600 dark:text-cyan-400 px-1">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>{t('AI QC 검사 중...', 'AI QC checking...')}</span>
        </div>
      )}

      {/* FUGA QC results */}
      {visibleResults.length > 0 && (
        <div className="space-y-2">
          {visibleResults.map((result, originalIndex) => {
            if (dismissed.includes(originalIndex)) return null;

            return (
              <div
                key={originalIndex}
                className={`p-4 rounded-lg border ${getBackgroundClass(result.severity)} transition-all duration-200 hover:shadow-md`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-1.5 rounded-md ${
                      result.severity === 'error'
                        ? 'bg-red-100 dark:bg-red-800/30'
                        : result.severity === 'warning'
                          ? 'bg-amber-100 dark:bg-amber-800/30'
                          : 'bg-blue-100 dark:bg-blue-800/30'
                    }`}
                  >
                    {getIcon(result.severity)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className={`text-sm font-medium ${getTextClass(result.severity)}`}>
                        {result.message}
                      </p>
                      {/* FUGA source badge */}
                      <span className="flex-shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wide bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                        FUGA
                      </span>
                    </div>
                    {result.field && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        <span className="font-medium">{t('필드', 'Field')}:</span>{' '}
                        <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                          {result.field}
                        </code>
                      </p>
                    )}
                    {result.suggestion && (
                      <div className="mt-2 p-2 bg-white/50 dark:bg-gray-900/50 rounded-md">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 font-medium">
                          {t('제안', 'Suggestion')}
                        </p>
                        <code className="text-xs block bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded mt-1 font-mono">
                          {result.suggestion}
                        </code>
                      </div>
                    )}
                  </div>
                  {result.severity !== 'error' && onDismiss && (
                    <button
                      type="button"
                      onClick={() => handleDismiss(originalIndex)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex-shrink-0"
                      title={t('무시하기', 'Dismiss')}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* OpenClaw AI QC results — grouped by category */}
      {hasOpenClaw && (
        <div className="space-y-3">
          {Object.entries(openClawByCategory).map(([category, categoryResults]) => {
            const catKey = category as OpenClawQCResult['category'];
            const catLabel = CATEGORY_LABELS[catKey];

            return (
              <div key={category}>
                {/* Category header */}
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {catLabel ? t(catLabel.ko, catLabel.en) : category}
                  </span>
                  <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                </div>

                <div className="space-y-2">
                  {categoryResults.map((result, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-lg border ${getOpenClawBg(result.severity)} transition-all duration-200 hover:shadow-md`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-1.5 rounded-md flex-shrink-0 ${getOpenClawIconBg(result.severity)}`}>
                          {result.severity === 'error' ? (
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                          ) : result.severity === 'warning' ? (
                            <AlertCircle className="w-4 h-4 text-amber-500" />
                          ) : (
                            <Info className="w-4 h-4 text-cyan-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            <p className={`text-sm font-medium ${getOpenClawText(result.severity)}`}>
                              {language === 'ko' ? result.messageKo : result.message}
                            </p>
                            {/* AI QC source badge */}
                            <span className="flex-shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wide bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 dark:bg-cyan-400 inline-block" />
                              AI QC
                            </span>
                          </div>
                          {result.field && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              <span className="font-medium">{t('필드', 'Field')}:</span>{' '}
                              <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                                {result.field}
                              </code>
                            </p>
                          )}
                          {result.dsp && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              <span className="font-medium">DSP:</span>{' '}
                              <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                                {result.dsp}
                              </code>
                            </p>
                          )}
                          {(result.suggestion || result.suggestedValue) && (
                            <div className="mt-2 p-2 bg-white/50 dark:bg-gray-900/50 rounded-md">
                              <p className="text-xs text-cyan-600 dark:text-cyan-400 mb-1 font-medium">
                                {t('제안', 'Suggestion')}
                              </p>
                              {result.suggestion && (
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  {result.suggestion}
                                </p>
                              )}
                              {result.suggestedValue && (
                                <code className="text-xs block bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded mt-1 font-mono">
                                  {result.suggestedValue}
                                </code>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// QC Status Badge Component
export function QCStatusBadge({ errors, warnings }: { errors: number; warnings: number }) {
  const language = useSafeStore(useLanguageStore, (state) => state.language);
  const t = (ko: string, en: string) => (language === 'ko' ? ko : en);

  if (errors === 0 && warnings === 0) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full">
        <CheckCircle className="w-3.5 h-3.5" />
        {t('QC 통과', 'QC Passed')}
      </div>
    );
  }

  if (errors > 0) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs rounded-full">
        <AlertTriangle className="w-3.5 h-3.5" />
        {t('QC 실패', 'QC Failed')} ({errors})
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs rounded-full">
      <AlertCircle className="w-3.5 h-3.5" />
      {t('경고 있음', 'Has Warnings')} ({warnings})
    </div>
  );
}
