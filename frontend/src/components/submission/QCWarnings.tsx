import { AlertTriangle, AlertCircle, Info, CheckCircle, X, Zap } from 'lucide-react'
import { useLanguageStore } from '@/store/language.store'
import type { QCValidationResults, QCValidationResult } from '@/utils/fugaQCValidation'
import { useState } from 'react'
import Button from '@/components/ui/Button'

interface Props {
  results: QCValidationResults
  onClose?: () => void
  onAutoFix?: (field: string, suggestion: string) => void
}

export default function QCWarnings({ results, onClose, onAutoFix }: Props) {
  const { t } = useLanguageStore()
  const [activeTab, setActiveTab] = useState<'errors' | 'warnings' | 'info'>('errors')

  const getIcon = (severity: QCValidationResult['severity']) => {
    switch (severity) {
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-500" />
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-amber-500" />
      case 'info':
        return <Info className="w-4 h-4 text-blue-500" />
    }
  }

  const getBackgroundClass = (severity: QCValidationResult['severity']) => {
    switch (severity) {
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'
      case 'warning':
        return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700'
      case 'info':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700'
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

  const renderValidationItem = (result: QCValidationResult, index: number) => (
    <div
      key={index}
      className={`p-4 rounded-lg border ${getBackgroundClass(result.severity)} transition-all duration-200`}
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
              <span className="font-medium">{t('필드', 'Field')}:</span>{' '}
              <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                {result.field}
              </code>
            </p>
          )}
          {result.suggestion && (
            <div className="mt-2">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 font-medium">
                💡 {t('제안', 'Suggestion')}
              </p>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded font-mono flex-1">
                  {result.suggestion}
                </code>
                {onAutoFix && result.field && (
                  <Button
                    onClick={() => onAutoFix(result.field!, result.suggestion!)}
                    size="sm"
                    variant="secondary"
                  >
                    <Zap className="w-3 h-3 mr-1" />
                    {t('자동 수정', 'Auto Fix')}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('QC 검증 결과', 'QC Validation Results')}
          </h3>
          <QCStatusBadge 
            errors={results.errors.length} 
            warnings={results.warnings.length} 
          />
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('errors')}
          className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
            activeTab === 'errors'
              ? 'text-red-600 dark:text-red-400 border-b-2 border-red-500'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
        >
          {t('오류', 'Errors')} ({results.errors.length})
        </button>
        <button
          onClick={() => setActiveTab('warnings')}
          className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
            activeTab === 'warnings'
              ? 'text-amber-600 dark:text-amber-400 border-b-2 border-amber-500'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
        >
          {t('경고', 'Warnings')} ({results.warnings.length})
        </button>
        <button
          onClick={() => setActiveTab('info')}
          className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
            activeTab === 'info'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
        >
          {t('정보', 'Info')} ({results.info.length})
        </button>
      </div>

      {/* Content */}
      <div className="p-6 max-h-96 overflow-y-auto">
        {activeTab === 'errors' && (
          <div className="space-y-3">
            {results.errors.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-8">
                {t('오류가 없습니다', 'No errors found')}
              </p>
            ) : (
              results.errors.map((error, index) => renderValidationItem(error, index))
            )}
          </div>
        )}
        
        {activeTab === 'warnings' && (
          <div className="space-y-3">
            {results.warnings.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-8">
                {t('경고가 없습니다', 'No warnings found')}
              </p>
            ) : (
              results.warnings.map((warning, index) => renderValidationItem(warning, index))
            )}
          </div>
        )}
        
        {activeTab === 'info' && (
          <div className="space-y-3">
            {results.info.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-8">
                {t('정보가 없습니다', 'No info messages')}
              </p>
            ) : (
              results.info.map((info, index) => renderValidationItem(info, index))
            )}
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {results.isValid ? (
              <span className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle className="w-4 h-4" />
                {t('모든 검증을 통과했습니다', 'All validations passed')}
              </span>
            ) : (
              <span className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertTriangle className="w-4 h-4" />
                {t('검증 오류를 수정해주세요', 'Please fix validation errors')}
              </span>
            )}
          </div>
          {onClose && (
            <Button onClick={onClose} variant="secondary" size="sm">
              {t('닫기', 'Close')}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// QC Status Badge Component
export function QCStatusBadge({ errors, warnings }: { errors: number; warnings: number }) {
  const { t } = useLanguageStore()
  
  if (errors === 0 && warnings === 0) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full">
        <CheckCircle className="w-3.5 h-3.5" />
        {t('통과', 'Passed')}
      </div>
    )
  }

  if (errors > 0) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs rounded-full">
        <AlertTriangle className="w-3.5 h-3.5" />
        {t('실패', 'Failed')} ({errors})
      </div>
    )
  }

  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs rounded-full">
      <AlertCircle className="w-3.5 h-3.5" />
      {t('경고', 'Warnings')} ({warnings})
    </div>
  )
}