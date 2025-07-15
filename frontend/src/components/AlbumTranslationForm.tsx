import { useState } from 'react'
import { Album } from 'lucide-react'
import { useLanguageStore } from '@/store/language.store'
import useSafeStore from '@/hooks/useSafeStore'
import TranslationManager, { Translation } from './TranslationManager'

interface AlbumTranslationFormProps {
  albumTitle: string
  albumTitleEn: string
  translations: Translation[]
  onTitleChange: (title: string) => void
  onTitleEnChange: (titleEn: string) => void
  onTranslationsChange: (translations: Translation[]) => void
  className?: string
}

export default function AlbumTranslationForm({
  albumTitle,
  albumTitleEn,
  translations,
  onTitleChange,
  onTitleEnChange,
  onTranslationsChange,
  className = ''
}: AlbumTranslationFormProps) {
  const language = useSafeStore(useLanguageStore, (state) => state.language)
  const t = (ko: string, en: string) => language === 'ko' ? ko : en

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-700">
        <Album className="w-6 h-6 text-purple-600" />
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {t('앨범 제목 및 번역', 'Album Title & Translations')}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('앨범 제목을 다양한 언어로 번역하여 글로벌 배포를 준비하세요', 'Translate album title into various languages for global distribution')}
          </p>
        </div>
      </div>

      {/* Primary Titles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Korean Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('한국어 제목', 'Korean Title')} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={albumTitle}
            onChange={(e) => onTitleChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700"
            placeholder={t('앨범 제목을 입력하세요', 'Enter album title')}
            required
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {t('기본 언어 (필수)', 'Primary language (required)')}
          </p>
        </div>

        {/* English Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('영어 제목', 'English Title')} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={albumTitleEn}
            onChange={(e) => onTitleEnChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700"
            placeholder={t('영어 제목을 입력하세요', 'Enter English title')}
            required
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {t('국제 배포용 (필수)', 'For international distribution (required)')}
          </p>
        </div>
      </div>

      {/* Additional Translations */}
      <TranslationManager
        value={translations}
        onChange={onTranslationsChange}
        title={t('추가 언어 번역', 'Additional Language Translations')}
        placeholder={t('번역된 앨범 제목을 입력하세요', 'Enter translated album title')}
        maxTranslations={15}
        showCommonOnly={false}
      />

      {/* Tips */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
          💡 {t('번역 팁', 'Translation Tips')}
        </h4>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• {t('각 지역의 문화와 언어 특성을 고려하여 번역하세요', 'Consider cultural and linguistic characteristics of each region')}</li>
          <li>• {t('직역보다는 의미 전달에 중점을 두세요', 'Focus on conveying meaning rather than literal translation')}</li>
          <li>• {t('타겟 시장에서 자주 사용되는 언어를 우선 번역하세요', 'Prioritize languages commonly used in your target markets')}</li>
          <li>• {t('음악 스트리밍 플랫폼에서 검색 최적화를 위해 현지 언어 번역이 중요합니다', 'Local language translations are important for search optimization on music streaming platforms')}</li>
        </ul>
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {t(
            `총 ${2 + translations.length}개 언어로 제공됩니다`,
            `Available in ${2 + translations.length} languages total`
          )}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-500">
          {translations.length > 0 && (
            <span>
              {t('추가 번역', 'Additional translations')}: {translations.map(t => t.language.toUpperCase()).join(', ')}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}