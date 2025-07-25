import { useState } from 'react'
import { Plus, X, Languages, ChevronDown, Sparkles, Check } from 'lucide-react'

interface Translation {
  id: string
  language: string
  title: string
}

interface TrackTranslationUIProps {
  translations: Translation[]
  onTranslationsChange: (translations: Translation[]) => void
  language: 'ko' | 'en'
}

const quickLanguages = [
  { value: 'en', label: 'EN', fullLabel: 'English' },
  { value: 'ja', label: 'JA', fullLabel: '日本語' },
  { value: 'zh-Hans', label: 'CN', fullLabel: '中文' },
  { value: 'es', label: 'ES', fullLabel: 'Español' },
  { value: 'fr', label: 'FR', fullLabel: 'Français' }
]

const languageOptions = [
  { value: 'en', label: 'English', group: 'major' },
  { value: 'es', label: 'Español (Spanish)', group: 'major' },
  { value: 'zh-Hans', label: '中文 (Chinese Simplified)', group: 'major' },
  { value: 'zh-Hant', label: '繁體中文 (Chinese Traditional)', group: 'major' },
  { value: 'hi', label: 'हिन्दी (Hindi)', group: 'major' },
  { value: 'ar', label: 'العربية (Arabic)', group: 'major' },
  { value: 'pt', label: 'Português (Portuguese)', group: 'major' },
  { value: 'ru', label: 'Русский (Russian)', group: 'major' },
  { value: 'ja', label: '日本語 (Japanese)', group: 'major' },
  { value: 'de', label: 'Deutsch (German)', group: 'major' },
  { value: 'fr', label: 'Français (French)', group: 'major' },
  { value: 'ko', label: '한국어 (Korean)', group: 'major' },
  
  // Asian Languages
  { value: 'id', label: 'Bahasa Indonesia', group: 'asian' },
  { value: 'vi', label: 'Tiếng Việt (Vietnamese)', group: 'asian' },
  { value: 'th', label: 'ไทย (Thai)', group: 'asian' },
  { value: 'ms', label: 'Bahasa Melayu (Malay)', group: 'asian' },
  { value: 'fil', label: 'Filipino', group: 'asian' },
  
  // European Languages
  { value: 'it', label: 'Italiano (Italian)', group: 'european' },
  { value: 'nl', label: 'Nederlands (Dutch)', group: 'european' },
  { value: 'pl', label: 'Polski (Polish)', group: 'european' },
  { value: 'tr', label: 'Türkçe (Turkish)', group: 'european' },
  { value: 'sv', label: 'Svenska (Swedish)', group: 'european' }
]

export default function TrackTranslationUI({ 
  translations, 
  onTranslationsChange, 
  language 
}: TrackTranslationUIProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState('')
  const [titleValue, setTitleValue] = useState('')
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const addTranslation = () => {
    if (selectedLanguage && titleValue.trim()) {
      const newTranslation: Translation = {
        id: `trans-${Date.now()}`,
        language: selectedLanguage,
        title: titleValue.trim()
      }
      onTranslationsChange([...translations, newTranslation])
      setSelectedLanguage('')
      setTitleValue('')
      setShowAddForm(false)
    }
  }

  const updateTranslation = (id: string, title: string) => {
    const updated = translations.map(t => 
      t.id === id ? { ...t, title } : t
    )
    onTranslationsChange(updated)
  }

  const removeTranslation = (id: string) => {
    onTranslationsChange(translations.filter(t => t.id !== id))
  }

  const getLanguageLabel = (langValue: string) => {
    const lang = languageOptions.find(l => l.value === langValue)
    return lang ? lang.label : langValue
  }

  const getLanguageShortLabel = (langValue: string) => {
    const quick = quickLanguages.find(l => l.value === langValue)
    return quick ? quick.label : langValue.toUpperCase().slice(0, 2)
  }

  // const filteredLanguages = searchQuery
  //   ? languageOptions.filter(lang => 
  //       lang.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
  //       lang.value.toLowerCase().includes(searchQuery.toLowerCase())
  //     )
  //   : languageOptions

  const availableLanguages = languageOptions.filter(
    lang => !translations.some(t => t.language === lang.value)
  )

  const quickAddLanguage = (langValue: string) => {
    if (!translations.some(t => t.language === langValue)) {
      setSelectedLanguage(langValue)
      setShowAddForm(true)
    }
  }

  return (
    <div 
      className="space-y-4"
      onClick={(e) => e.stopPropagation()}>
      {/* Header with quick add */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Languages className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {language === 'ko' ? '트랙 제목 번역' : 'Track Title Translations'}
          </h4>
          {translations.length > 0 && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              ({translations.length})
            </span>
          )}
        </div>
      </div>

      {/* Quick language buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {language === 'ko' ? '빠른 추가:' : 'Quick add:'}
        </span>
        {quickLanguages.map(lang => {
          const isAdded = translations.some(t => t.language === lang.value)
          return (
            <button
              key={lang.value}
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                if (!isAdded) quickAddLanguage(lang.value)
              }}
              disabled={isAdded}
              className={`
                px-3 py-1 text-xs font-medium rounded-full transition-all
                ${isAdded 
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed' 
                  : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50'
                }
              `}
              title={lang.fullLabel}
            >
              {isAdded && <Check className="w-3 h-3 inline mr-1" />}
              {lang.label}
            </button>
          )
        })}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setShowAddForm(true)
          }}
          className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-full transition-colors text-xs font-medium shadow-sm inline-flex items-center gap-1"
        >
          <Plus className="w-3 h-3" />
          {language === 'ko' ? '더 보기' : 'More'}
        </button>
      </div>

      {/* Add new translation form */}
      {showAddForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3 animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between">
            <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {language === 'ko' ? '새 번역 추가' : 'Add New Translation'}
            </h5>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setShowAddForm(false)
                setSelectedLanguage('')
                setTitleValue('')
              }}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Language selector */}
            <div className="relative">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                {language === 'ko' ? '언어' : 'Language'}
              </label>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowLanguageDropdown(!showLanguageDropdown)
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-left flex items-center justify-between hover:border-gray-400 dark:hover:border-gray-500 transition-colors bg-white dark:bg-gray-900"
              >
                <span className={selectedLanguage ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}>
                  {selectedLanguage 
                    ? getLanguageLabel(selectedLanguage)
                    : (language === 'ko' ? '언어 선택' : 'Select language')
                  }
                </span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>

              {showLanguageDropdown && (
                <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
                  <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={language === 'ko' ? '언어 검색...' : 'Search languages...'}
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-purple-500 bg-white dark:bg-gray-900"
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {availableLanguages.filter(lang => 
                      !searchQuery || lang.label.toLowerCase().includes(searchQuery.toLowerCase())
                    ).map(lang => (
                      <button
                        key={lang.value}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedLanguage(lang.value)
                          setShowLanguageDropdown(false)
                          setSearchQuery('')
                        }}
                        className="w-full px-3 py-2 text-sm text-left hover:bg-purple-50 dark:hover:bg-purple-900/20 text-gray-700 dark:text-gray-300"
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Title input */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                {language === 'ko' ? '번역된 제목' : 'Translated Title'}
              </label>
              <input
                type="text"
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTranslation()}
                placeholder={language === 'ko' ? '번역 입력...' : 'Enter translation...'}
                disabled={!selectedLanguage}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-900 disabled:bg-gray-100 dark:disabled:bg-gray-800"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setShowAddForm(false)
                setSelectedLanguage('')
                setTitleValue('')
              }}
              className="px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              {language === 'ko' ? '취소' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                addTranslation()
              }}
              disabled={!selectedLanguage || !titleValue.trim()}
              className="px-3 py-1.5 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-md disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed"
            >
              {language === 'ko' ? '추가' : 'Add'}
            </button>
          </div>
        </div>
      )}

      {/* Translations list */}
      {translations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {translations.map((translation) => (
            <div 
              key={translation.id} 
              className="group relative bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 rounded-lg p-3 border border-purple-100 dark:border-purple-800/30 hover:shadow-sm transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <span className="inline-flex items-center justify-center w-8 h-8 bg-white dark:bg-gray-800 rounded-full text-xs font-medium text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-700">
                    {getLanguageShortLabel(translation.language)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    {getLanguageLabel(translation.language)}
                  </p>
                  <input
                    type="text"
                    value={translation.title}
                    onChange={(e) => updateTranslation(translation.id, e.target.value)}
                    className="w-full px-2 py-1 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-purple-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeTranslation(translation.id)
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {translations.length === 0 && !showAddForm && (
        <div className="text-center py-8 px-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 rounded-xl border border-dashed border-purple-300 dark:border-purple-700">
          <Sparkles className="w-8 h-8 text-purple-400 mx-auto mb-3" />
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            {language === 'ko' 
              ? '아직 번역이 없습니다'
              : 'No translations yet'
            }
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            {language === 'ko' 
              ? '위의 빠른 추가 버튼을 클릭하여 시작하세요'
              : 'Click the quick add buttons above to get started'
            }
          </p>
        </div>
      )}

      {/* Click outside to close dropdown */}
      {showLanguageDropdown && (
        <div 
          className="fixed inset-0 z-10" 
          onClick={() => {
            setShowLanguageDropdown(false)
            setSearchQuery('')
          }}
        />
      )}
    </div>
  )
}