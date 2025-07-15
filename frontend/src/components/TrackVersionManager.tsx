import { useState, useCallback } from 'react'
import { Plus, X, Music, Edit2, Check, ChevronDown } from 'lucide-react'
import { useLanguageStore } from '@/store/language.store'
import useSafeStore from '@/hooks/useSafeStore'
import { TRACK_VERSIONS } from '@/data/languages'

interface TrackVersionManagerProps {
  value: string
  onChange: (version: string) => void
  className?: string
  allowCustom?: boolean
}

export default function TrackVersionManager({
  value = '',
  onChange,
  className = '',
  allowCustom = true
}: TrackVersionManagerProps) {
  const language = useSafeStore(useLanguageStore, (state) => state.language)
  const t = (ko: string, en: string) => language === 'ko' ? ko : en

  const [isOpen, setIsOpen] = useState(false)
  const [isCustom, setIsCustom] = useState(false)
  const [customValue, setCustomValue] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Korean translations for track versions
  const getVersionTranslation = (version: string): string => {
    const translations: { [key: string]: string } = {
      'Original': '오리지널',
      'Instrumental': '인스트루멘탈',
      'Acapella': '아카펠라',
      'Radio Edit': '라디오 에디트',
      'Extended Mix': '익스텐디드 믹스',
      'Club Mix': '클럽 믹스',
      'Remix': '리믹스',
      'Acoustic Version': '어쿠스틱 버전',
      'Live Version': '라이브 버전',
      'Demo Version': '데모 버전',
      'Karaoke Version': '카라오케 버전',
      'Clean Version': '클린 버전',
      'Explicit Version': '익스플리시트 버전',
      'Remastered': '리마스터드',
      'Deluxe Version': '디럭스 버전',
      'Alternative Version': '얼터너티브 버전'
    }

    if (language === 'ko' && translations[version]) {
      return translations[version]
    }
    return version
  }

  // Filter versions based on search
  const filteredVersions = TRACK_VERSIONS.filter(version =>
    version.toLowerCase().includes(searchQuery.toLowerCase()) ||
    getVersionTranslation(version).toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSelect = useCallback((version: string) => {
    onChange(version)
    setIsOpen(false)
    setSearchQuery('')
    setIsCustom(false)
  }, [onChange])

  const handleCustomSubmit = useCallback(() => {
    if (customValue.trim()) {
      onChange(customValue.trim())
      setCustomValue('')
      setIsCustom(false)
      setIsOpen(false)
    }
  }, [customValue, onChange])

  const handleClear = useCallback(() => {
    onChange('')
    setIsOpen(false)
  }, [onChange])

  const displayValue = value ? getVersionTranslation(value) : t('버전 선택', 'Select Version')
  const isStandardVersion = TRACK_VERSIONS.includes(value)

  return (
    <div className={`relative ${className}`}>
      {/* Header */}
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        <div className="flex items-center gap-2">
          <Music className="w-4 h-4 text-purple-600" />
          {t('트랙 버전', 'Track Version')}
          <span className="text-xs text-gray-500 dark:text-gray-400">
            ({t('선택사항', 'Optional')})
          </span>
        </div>
      </label>

      {/* Dropdown Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full px-3 py-2 text-left border rounded-lg focus:ring-2 focus:ring-purple-500 transition-colors
          ${value 
            ? 'border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
            : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400'
          }
          ${isOpen ? 'ring-2 ring-purple-500' : ''}
        `}
      >
        <div className="flex items-center justify-between">
          <span className="truncate">{displayValue}</span>
          <div className="flex items-center gap-2">
            {value && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleClear()
                }}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
                title={t('지우기', 'Clear')}
              >
                <X className="w-3 h-3" />
              </button>
            )}
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </div>
      </button>

      {/* Dropdown Content */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-80 overflow-hidden">
          {/* Search */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('버전 검색...', 'Search versions...')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 text-sm"
              autoFocus
            />
          </div>

          {/* Version List */}
          <div className="max-h-48 overflow-y-auto">
            {/* Clear Option */}
            {value && (
              <button
                onClick={handleClear}
                className="w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 text-sm text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700"
              >
                {t('버전 제거', 'Remove Version')}
              </button>
            )}

            {/* Standard Versions */}
            {filteredVersions.map((version) => (
              <button
                key={version}
                onClick={() => handleSelect(version)}
                className={`
                  w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 text-sm transition-colors
                  ${value === version ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' : ''}
                `}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{getVersionTranslation(version)}</div>
                    {language === 'ko' && version !== getVersionTranslation(version) && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">{version}</div>
                    )}
                  </div>
                  {value === version && (
                    <Check className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  )}
                </div>
              </button>
            ))}

            {filteredVersions.length === 0 && searchQuery && (
              <div className="px-3 py-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                {t('검색 결과가 없습니다', 'No versions found')}
              </div>
            )}
          </div>

          {/* Custom Version */}
          {allowCustom && (
            <div className="border-t border-gray-200 dark:border-gray-700 p-3">
              {!isCustom ? (
                <button
                  onClick={() => setIsCustom(true)}
                  className="w-full px-3 py-2 text-left text-sm text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {t('사용자 정의 버전 추가', 'Add Custom Version')}
                </button>
              ) : (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={customValue}
                    onChange={(e) => setCustomValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleCustomSubmit()
                      } else if (e.key === 'Escape') {
                        setIsCustom(false)
                        setCustomValue('')
                      }
                    }}
                    placeholder={t('사용자 정의 버전 입력...', 'Enter custom version...')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 text-sm"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleCustomSubmit}
                      disabled={!customValue.trim()}
                      className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {t('추가', 'Add')}
                    </button>
                    <button
                      onClick={() => {
                        setIsCustom(false)
                        setCustomValue('')
                      }}
                      className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      {t('취소', 'Cancel')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Current Selection Info */}
      {value && (
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          {isStandardVersion ? (
            <span className="flex items-center gap-1">
              <Check className="w-3 h-3 text-green-500" />
              {t('표준 버전', 'Standard version')}
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <Edit2 className="w-3 h-3 text-orange-500" />
              {t('사용자 정의 버전', 'Custom version')}
            </span>
          )}
        </div>
      )}
    </div>
  )
}