import { AlertTriangle, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

// Translation mapping for QC error messages
const translateQCMessage = (key: string): { ko: string } => {
  const translations: Record<string, { ko: string }> = {
    'qc.error.missingLyricist': { ko: '🎵 작사자(Lyricist) 필요' },
    'qc.error.missingComposer': { ko: '🎼 작곡자(Composer) 필요' },
    'qc.error.missingPerformingArtist': { ko: '🎤 연주자/보컬 필요' },
    'qc.error.noContributors': { ko: '👥 기여자 정보 없음' }
  };
  return translations[key] || { ko: key };
};

const convertFieldName = (field: string): string => {
  const match = field.match(/track\[(\d+)\]\.(.+)/);
  if (match) {
    const trackNum = parseInt(match[1]) + 1;
    return `트랙 ${trackNum}`;
  }
  if (field === 'contributors') return '기여자';
  return field;
};

interface QCError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

interface PersistentErrorBannerProps {
  errors: QCError[];
  onDismiss?: () => void;
  onShowDetails?: () => void;
}

export default function PersistentErrorBanner({ errors, onDismiss, onShowDetails }: PersistentErrorBannerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!errors || errors.length === 0) return null;

  const errorCount = errors.filter(e => e.severity === 'error').length;

  return (
    <div className="sticky top-0 z-40 border-b-4 border-red-500 shadow-lg">
      <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="flex-shrink-0 p-2 bg-white/20 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-white font-bold">
                    QC 검증 실패
                  </h3>
                  <span className="px-2 py-0.5 bg-white/30 rounded-full text-xs font-bold text-white">
                    {errorCount}개 오류
                  </span>
                </div>
                <p className="text-red-100 text-sm mt-0.5">
                  아래 항목들을 수정한 후 다시 제출해주세요
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onShowDetails && (
                <button
                  onClick={onShowDetails}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg font-medium transition-colors text-sm"
                >
                  상세 보기
                </button>
              )}

              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-white" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-white" />
                )}
              </button>

              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              )}
            </div>
          </div>

          {/* Expanded error list */}
          {isExpanded && (
            <div className="mt-4 pt-4 border-t border-white/20 space-y-2">
              {errors.slice(0, 5).map((error, index) => {
                const translated = translateQCMessage(error.message);
                const friendlyField = convertFieldName(error.field);

                return (
                  <div
                    key={index}
                    className="flex items-start gap-2 text-sm"
                  >
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-white/30 text-white flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-red-100">
                        {friendlyField}
                      </span>
                      <p className="text-white mt-1">
                        {translated.ko}
                      </p>
                    </div>
                  </div>
                );
              })}
              {errors.length > 5 && (
                <p className="text-red-100 text-xs text-center pt-2">
                  ...및 {errors.length - 5}개 더
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
