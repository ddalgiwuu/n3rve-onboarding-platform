import { X, AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface QCError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
  helpText?: string;
}

interface QCErrorModalProps {
  errors: QCError[];
  onClose: () => void;
  onFixError?: (field: string) => void;
}

export default function QCErrorModal({ errors, onClose, onFixError }: QCErrorModalProps) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const errorCount = errors.filter(e => e.severity === 'error').length;
  const warningCount = errors.filter(e => e.severity === 'warning').length;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[85vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-red-500 to-red-600 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  QC 검증 실패
                </h2>
                <p className="text-sm text-red-100 mt-0.5">
                  {errorCount}개 오류{warningCount > 0 && `, ${warningCount}개 경고`}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-140px)]">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            아래 항목들을 수정한 후 다시 제출해주세요
          </p>

          <div className="space-y-3">
            {errors.map((error, index) => (
              <div
                key={index}
                className={`group relative p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-lg ${
                  error.severity === 'error'
                    ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 hover:border-red-300 dark:hover:border-red-700'
                    : 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 hover:border-amber-300 dark:hover:border-amber-700'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Error number badge */}
                  <div
                    className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                      error.severity === 'error'
                        ? 'bg-red-500 text-white'
                        : 'bg-amber-500 text-white'
                    }`}
                  >
                    {index + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Field name */}
                    <div className="flex items-center gap-2 mb-2">
                      <code className="px-2 py-0.5 text-xs font-mono bg-gray-900/10 dark:bg-white/10 rounded">
                        {error.field}
                      </code>
                    </div>

                    {/* Error message */}
                    <p className={`text-sm font-medium mb-1 ${
                      error.severity === 'error'
                        ? 'text-red-900 dark:text-red-200'
                        : 'text-amber-900 dark:text-amber-200'
                    }`}>
                      {error.message}
                    </p>

                    {/* Help text */}
                    {error.helpText && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                        💡 {error.helpText}
                      </p>
                    )}
                  </div>

                  {/* Fix button */}
                  {onFixError && (
                    <button
                      onClick={() => onFixError(error.field)}
                      className={`flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 ${
                        error.severity === 'error'
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-amber-600 hover:bg-amber-700 text-white'
                      }`}
                    >
                      수정
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              문제를 수정한 후 다시 제출하세요
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 font-medium transition-colors"
            >
              확인
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Render modal using Portal to ensure it's always on top
  return createPortal(modalContent, document.body);
}
