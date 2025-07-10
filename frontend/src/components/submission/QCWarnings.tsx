import { AlertTriangle, AlertCircle, Info, CheckCircle, X } from 'lucide-react'
import { t } from '@/store/language.store'
import type { QCValidationResult } from '@/utils/fugaQCValidation'
import { useState } from 'react'

interface Props {
  results: QCValidationResult[]
  onDismiss?: (index: number) => void
  compact?: boolean
}

export default function QCWarnings({ results, onDismiss, compact = false }: Props) {
  const [dismissed, setDismissed] = useState<number[]>([])

  if (results.length === 0) return null

  const visibleResults = results.filter((_, index) => !dismissed.includes(index))
  if (visibleResults.length === 0) return null

  const handleDismiss = (index: number) => {
    setDismissed([...dismissed, index])
    onDismiss?.(index)
  }

  const getIcon = (severity: QCValidationResult['severity']) => {
    switch (severity) {
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
      case 'info':
        return <Info className="w-4 h-4 text-blue-500 flex-shrink-0" />
    }
  }

  const getBackgroundClass = (severity: QCValidationResult['severity']) => {
    switch (severity) {
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700 shadow-sm'
      case 'warning':
        return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700 shadow-sm'
      case 'info':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 shadow-sm'
    }
  }

  const getTextClass = (severity: QCValidationResult['severity']) => {
    switch (severity) {
      case 'error':
        return 'text-red-800 dark:text-red-200'
      case 'warning':
        return 'text-amber-800 dark:text-amber-200'
      case 'info':
        return 'text-blue-800 dark:text-blue-200'
    }
  }

  if (compact) {
    // Compact mode for inline validation
    return (
      <div className="mt-1 space-y-1">
        {results.map((result, index) => (
          <div key={index} className="flex items-start gap-1.5 text-xs">
            {getIcon(result.severity)}
            <span className={getTextClass(result.severity)}>
              {t(result.message)}
            </span>
          </div>
        ))}
      </div>
    )
  }

  // Full mode for section validation
  return (
    <div className="space-y-2">
      {results.map((result, originalIndex) => {
        if (dismissed.includes(originalIndex)) return null

        return (
          <div
            key={originalIndex}
            className={`p-4 rounded-lg border ${getBackgroundClass(result.severity)} transition-all duration-200 hover:shadow-md`}
          >
            <div className="flex items-start gap-3">
              <div className={`p-1.5 rounded-md ${
                result.severity === 'error' ? 'bg-red-100 dark:bg-red-800/30' :
                result.severity === 'warning' ? 'bg-amber-100 dark:bg-amber-800/30' :
                'bg-blue-100 dark:bg-blue-800/30'
              }`}>
                {getIcon(result.severity)}
              </div>
              <div className="flex-1">
                <p className={`text-sm font-medium ${getTextClass(result.severity)}`}>
                  {t(result.message)}
                </p>
                {result.field && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    <span className="font-medium">{t('qc.field')}:</span> <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">{result.field}</code>
                  </p>
                )}
                {result.suggestion && (
                  <div className="mt-2 p-2 bg-white/50 dark:bg-gray-900/50 rounded-md">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 font-medium">
                      💡 {t('qc.suggestion')}
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
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  title="무시하기"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// QC Status Badge Component
export function QCStatusBadge({ errors, warnings }: { errors: number; warnings: number }) {
  if (errors === 0 && warnings === 0) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full">
        <CheckCircle className="w-3.5 h-3.5" />
        {t('qc.status.passed')}
      </div>
    )
  }

  if (errors > 0) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs rounded-full">
        <AlertTriangle className="w-3.5 h-3.5" />
        {t('qc.status.failed')} ({errors})
      </div>
    )
  }

  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs rounded-full">
      <AlertCircle className="w-3.5 h-3.5" />
      {t('qc.status.warnings')} ({warnings})
    </div>
  )
}