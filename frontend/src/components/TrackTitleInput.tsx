import ValidatedInput from './ValidatedInput';
import { useLanguageStore } from '@/store/language.store';
import useSafeStore from '@/hooks/useSafeStore';
import { useValidationContext } from '@/contexts/ValidationContext';
import { ValidationWarning } from '@/utils/inputValidation';

interface TrackTitleInputProps {
  trackId: string
  trackNumber?: number
  initialValue: string
  onChange?: (value: string) => void
  placeholder?: string
}

export default function TrackTitleInput({
  trackId,
  trackNumber,
  initialValue,
  onChange,
  placeholder
}: TrackTitleInputProps) {
  const language = useSafeStore(useLanguageStore, (state) => state.language);
  const t = (ko: string, en: string) => language === 'ko' ? ko : en;

  return (
    <ValidatedInput
      fieldId={`track-title-${trackId}`}
      validationType="track"
      validationOptions={{ trackNumber }}
      value={initialValue}
      onValueChange={onChange}
      placeholder={placeholder || t('트랙 제목을 입력하세요', 'Enter track title')}
      language={language === 'ja' ? 'en' : language}
      showInlineWarnings={true}
    />
  );
}

// Bulk warning manager for multiple tracks
interface TrackWarningsManagerProps {
  trackIds: string[]
  onAcceptAll?: (group: string) => void
  onDismissAll?: (group: string) => void
  language?: 'ko' | 'en'
}

export function TrackWarningsManager({
  trackIds,
  onAcceptAll,
  onDismissAll,
  language = 'en'
}: TrackWarningsManagerProps) {
  const { getAllWarnings, acceptAllInGroup, dismissWarningGroup } = useValidationContext();

  // Filter warnings for only the specified tracks
  const trackWarnings = getAllWarnings().filter(w =>
    trackIds.some(id => w.field === `track-title-${id}`)
  );

  // Group warnings by type
  const warningGroups = trackWarnings.reduce((acc, warning) => {
    const group = warning.warningGroup || warning.type;
    if (!acc[group]) acc[group] = [];
    acc[group].push(warning);
    return acc;
  }, {} as Record<string, ValidationWarning[]>);

  const t = (ko: string, en: string) => language === 'ko' ? ko : en;

  if (Object.keys(warningGroups).length === 0) return null;

  return (
    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
        {t('트랙 제목 일괄 수정', 'Bulk Track Title Fixes')}
      </h4>

      <div className="space-y-2">
        {Object.entries(warningGroups).map(([group, warnings]) => {
          const canFixAll = warnings.some(w => w.suggestedValue);
          const canDismissAll = warnings.some(w => w.canIgnore);

          return (
            <div key={group} className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {getGroupTitle(group, t)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {warnings.length} {t('개 트랙', warnings.length === 1 ? 'track' : 'tracks')}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {canFixAll && (
                  <button
                    onClick={() => {
                      const changes = acceptAllInGroup(group);
                      onAcceptAll?.(group);
                    }}
                    className="px-3 py-1 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded transition-colors"
                  >
                    {t('모두 수정', 'Fix All')}
                  </button>
                )}
                {canDismissAll && (
                  <button
                    onClick={() => {
                      dismissWarningGroup(group);
                      onDismissAll?.(group);
                    }}
                    className="px-3 py-1 text-xs font-medium text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded transition-colors"
                  >
                    {t('모두 무시', 'Dismiss All')}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getGroupTitle(group: string, t: (ko: string, en: string) => string): string {
  const groupTitles: Record<string, string> = {
    'feat': t('피처링 형식', 'Featuring Format'),
    'brackets': t('괄호 스타일', 'Bracket Style'),
    'version': t('버전 표기', 'Version Format'),
    'spacing': t('공백 문제', 'Spacing Issues'),
    'special_chars': t('특수문자', 'Special Characters'),
    'track_number': t('트랙 번호', 'Track Numbers'),
    'error': t('오류', 'Errors'),
    'warning': t('경고', 'Warnings'),
    'suggestion': t('제안사항', 'Suggestions')
  };
  return groupTitles[group] || group;
}
