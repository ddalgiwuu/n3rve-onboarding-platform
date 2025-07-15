import { useState } from 'react'
import { Music, Info } from 'lucide-react'
import { useLanguageStore } from '@/store/language.store'
import useSafeStore from '@/hooks/useSafeStore'
import TranslationManager, { Translation } from './TranslationManager'
import TrackVersionManager from './TrackVersionManager'

interface TrackTranslationFormProps {
  trackIndex: number
  titleKo: string
  titleEn: string
  translations: Translation[]
  trackVersion: string
  onTitleKoChange: (title: string) => void
  onTitleEnChange: (titleEn: string) => void
  onTranslationsChange: (translations: Translation[]) => void
  onTrackVersionChange: (version: string) => void
  className?: string
}

export default function TrackTranslationForm({
  trackIndex,
  titleKo,
  titleEn,
  translations,
  trackVersion,
  onTitleKoChange,
  onTitleEnChange,
  onTranslationsChange,
  onTrackVersionChange,
  className = ''
}: TrackTranslationFormProps) {
  const language = useSafeStore(useLanguageStore, (state) => state.language)
  const t = (ko: string, en: string) => language === 'ko' ? ko : en

  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className={`border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 ${className}`}>
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <Music className="w-5 h-5 text-purple-600" />
          <div>
            <h4 className="text-md font-medium text-gray-900 dark:text-white">
              {t(`트랙 ${trackIndex + 1}`, `Track ${trackIndex + 1}`)}
              {trackVersion && (
                <span className="ml-2 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded">
                  {trackVersion}
                </span>
              )}
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {titleKo || titleEn || t('제목 없음', 'No title')}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {translations.length > 0 && (
            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded">
              +{translations.length} {t('번역', 'translations')}
            </span>
          )}
          <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <Info className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-6 border-t border-gray-100 dark:border-gray-700 pt-4">
          {/* Primary Titles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Korean Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('한국어 제목', 'Korean Title')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={titleKo}
                onChange={(e) => onTitleKoChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700"
                placeholder={t('트랙 제목을 입력하세요', 'Enter track title')}
                required
              />
            </div>

            {/* English Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('영어 제목', 'English Title')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={titleEn}
                onChange={(e) => onTitleEnChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700"
                placeholder={t('영어 제목을 입력하세요', 'Enter English title')}
                required
              />
            </div>
          </div>

          {/* Track Version */}
          <TrackVersionManager
            value={trackVersion}
            onChange={onTrackVersionChange}
            allowCustom={true}
          />

          {/* Additional Translations */}
          <TranslationManager
            value={translations}
            onChange={onTranslationsChange}
            title={t('트랙 번역', 'Track Translations')}
            placeholder={t('번역된 트랙 제목을 입력하세요', 'Enter translated track title')}
            maxTranslations={10}
            showCommonOnly={true}
          />

          {/* Version Information */}
          {trackVersion && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
              <h5 className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-1">
                📀 {t('트랙 버전 정보', 'Track Version Info')}
              </h5>
              <p className="text-sm text-amber-800 dark:text-amber-200">
                {t(
                  `이 트랙은 "${trackVersion}" 버전으로 설정되었습니다. 버전 정보는 음원 메타데이터에 포함되어 스트리밍 플랫폼에서 구분 표시됩니다.`,
                  `This track is set as "${trackVersion}" version. Version information will be included in audio metadata and displayed on streaming platforms.`
                )}
              </p>
            </div>
          )}

          {/* Common Version Examples */}
          <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
            <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
              💡 {t('일반적인 트랙 버전', 'Common Track Versions')}
            </h5>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              {[
                { en: 'Instrumental', ko: '인스트루멘탈' },
                { en: 'Acoustic', ko: '어쿠스틱' },
                { en: 'Remix', ko: '리믹스' },
                { en: 'Live', ko: '라이브' },
                { en: 'Radio Edit', ko: '라디오 에디트' },
                { en: 'Extended Mix', ko: '익스텐디드 믹스' },
                { en: 'Clean', ko: '클린' },
                { en: 'Remastered', ko: '리마스터드' }
              ].map((version, index) => (
                <span key={index} className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-center">
                  {language === 'ko' ? version.ko : version.en}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}