import { useState, useEffect } from 'react'
import { Plus, X, Globe, Languages, ChevronDown } from 'lucide-react'

interface Translation {
  id: string
  language: string
  title: string
}

interface TranslationInputProps {
  translations: Translation[]
  onTranslationsChange: (translations: Translation[]) => void
  language: 'ko' | 'en'
  placeholder?: string
}

const languageOptions = [
  // Major Languages
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
  { value: 'bn', label: 'বাংলা (Bengali)', group: 'asian' },
  { value: 'ta', label: 'தமிழ் (Tamil)', group: 'asian' },
  { value: 'te', label: 'తెలుగు (Telugu)', group: 'asian' },
  { value: 'mr', label: 'मराठी (Marathi)', group: 'asian' },
  { value: 'gu', label: 'ગુજરાતી (Gujarati)', group: 'asian' },
  { value: 'kn', label: 'ಕನ್ನಡ (Kannada)', group: 'asian' },
  { value: 'ml', label: 'മലയാളം (Malayalam)', group: 'asian' },
  { value: 'pa', label: 'ਪੰਜਾਬੀ (Punjabi)', group: 'asian' },
  { value: 'ur', label: 'اردو (Urdu)', group: 'asian' },
  
  // European Languages
  { value: 'it', label: 'Italiano (Italian)', group: 'european' },
  { value: 'nl', label: 'Nederlands (Dutch)', group: 'european' },
  { value: 'pl', label: 'Polski (Polish)', group: 'european' },
  { value: 'tr', label: 'Türkçe (Turkish)', group: 'european' },
  { value: 'sv', label: 'Svenska (Swedish)', group: 'european' },
  { value: 'no', label: 'Norsk (Norwegian)', group: 'european' },
  { value: 'da', label: 'Dansk (Danish)', group: 'european' },
  { value: 'fi', label: 'Suomi (Finnish)', group: 'european' },
  { value: 'el', label: 'Ελληνικά (Greek)', group: 'european' },
  { value: 'cs', label: 'Čeština (Czech)', group: 'european' },
  { value: 'hu', label: 'Magyar (Hungarian)', group: 'european' },
  { value: 'ro', label: 'Română (Romanian)', group: 'european' },
  { value: 'bg', label: 'Български (Bulgarian)', group: 'european' },
  { value: 'uk', label: 'Українська (Ukrainian)', group: 'european' },
  { value: 'hr', label: 'Hrvatski (Croatian)', group: 'european' },
  { value: 'sr', label: 'Српски (Serbian)', group: 'european' },
  { value: 'sk', label: 'Slovenčina (Slovak)', group: 'european' },
  { value: 'sl', label: 'Slovenščina (Slovenian)', group: 'european' },
  { value: 'et', label: 'Eesti (Estonian)', group: 'european' },
  
  // Other Languages
  { value: 'he', label: 'עברית (Hebrew)', group: 'other' },
  { value: 'fa', label: 'فارسی (Persian)', group: 'other' },
  { value: 'af', label: 'Afrikaans', group: 'other' },
  { value: 'sw', label: 'Kiswahili (Swahili)', group: 'other' },
  { value: 'am', label: 'አማርኛ (Amharic)', group: 'other' },
  { value: 'ha', label: 'Hausa', group: 'other' },
  { value: 'yo', label: 'Yorùbá', group: 'other' },
  { value: 'ig', label: 'Igbo', group: 'other' },
  { value: 'zu', label: 'isiZulu', group: 'other' },
  { value: 'xh', label: 'isiXhosa', group: 'other' },
  { value: 'sn', label: 'chiShona', group: 'other' },
  { value: 'rw', label: 'Kinyarwanda', group: 'other' },
  { value: 'mg', label: 'Malagasy', group: 'other' },
  { value: 'ne', label: 'नेपाली (Nepali)', group: 'other' },
  { value: 'si', label: 'සිංහල (Sinhala)', group: 'other' },
  { value: 'km', label: 'ខ្មែរ (Khmer)', group: 'other' },
  { value: 'lo', label: 'ລາວ (Lao)', group: 'other' },
  { value: 'my', label: 'မြန်မာ (Burmese)', group: 'other' },
  { value: 'ka', label: 'ქართული (Georgian)', group: 'other' },
  { value: 'hy', label: 'Հայերեն (Armenian)', group: 'other' },
  { value: 'az', label: 'Azərbaycan (Azerbaijani)', group: 'other' },
  { value: 'kk', label: 'Қазақша (Kazakh)', group: 'other' },
  { value: 'ky', label: 'Кыргызча (Kyrgyz)', group: 'other' },
  { value: 'uz', label: "O'zbek (Uzbek)", group: 'other' },
  { value: 'tg', label: 'Тоҷикӣ (Tajik)', group: 'other' },
  { value: 'tk', label: 'Türkmen', group: 'other' },
  { value: 'mn', label: 'Монгол (Mongolian)', group: 'other' },
  { value: 'ps', label: 'پښتو (Pashto)', group: 'other' },
  { value: 'ku', label: 'Kurdî (Kurdish)', group: 'other' },
  { value: 'sd', label: 'سنڌي (Sindhi)', group: 'other' }
]

// Translation Title Input Component with local state
const TranslationTitleInput = ({ 
  index, 
  initialValue, 
  language,
  onUpdate,
  placeholder 
}: {
  index: number
  initialValue: string
  language: string
  onUpdate: (index: number, field: 'language' | 'title', value: string) => void
  placeholder: string
}) => {
  const [localValue, setLocalValue] = useState(initialValue)
  
  useEffect(() => {
    setLocalValue(initialValue)
  }, [initialValue])
  
  const handleBlur = () => {
    onUpdate(index, 'title', localValue)
  }
  
  return (
    <input
      type="text"
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={handleBlur}
      placeholder={placeholder}
      disabled={!language}
      className="w-full px-2.5 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed transition-colors"
    />
  )
}

export default function TranslationInput({ 
  translations, 
  onTranslationsChange, 
  language,
  placeholder 
}: TranslationInputProps) {
  const [showDropdown, setShowDropdown] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const addTranslation = () => {
    const newTranslation: Translation = {
      id: `trans-${Date.now()}`,
      language: '',
      title: ''
    }
    onTranslationsChange([...translations, newTranslation])
  }

  const updateTranslation = (index: number, field: 'language' | 'title', value: string) => {
    const updated = [...translations]
    updated[index] = { ...updated[index], [field]: value }
    onTranslationsChange(updated)
  }

  const removeTranslation = (index: number) => {
    onTranslationsChange(translations.filter((_, i) => i !== index))
  }

  const filteredLanguages = searchQuery
    ? languageOptions.filter(lang => 
        lang.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lang.value.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : languageOptions

  const languageGroups = {
    major: language === 'ko' ? '주요 언어' : 'Major Languages',
    asian: language === 'ko' ? '아시아 언어' : 'Asian Languages',
    european: language === 'ko' ? '유럽 언어' : 'European Languages',
    other: language === 'ko' ? '기타 언어' : 'Other Languages'
  }

  const getSelectedLanguageLabel = (langValue: string) => {
    const lang = languageOptions.find(l => l.value === langValue)
    return lang ? lang.label : langValue
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Languages className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {language === 'ko' ? '번역' : 'Translations'}
          </h4>
        </div>
        <button
          type="button"
          onClick={addTranslation}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors text-xs font-medium shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          {language === 'ko' ? '번역 추가' : 'Add Translation'}
        </button>
      </div>

      {/* Info Banner - Compact Version */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-3 border border-blue-100 dark:border-blue-800">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <p className="text-xs text-gray-700 dark:text-gray-300">
            {language === 'ko' 
              ? '70개 이상의 언어로 번역하여 전 세계 청취자에게 도달하세요'
              : 'Translate into 70+ languages to reach listeners worldwide'
            }
          </p>
        </div>
      </div>

      {/* Translations List */}
      {translations.length > 0 ? (
        <div className="space-y-3">
          {translations.map((translation, index) => (
            <div 
              key={translation.id} 
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 hover:shadow-sm transition-shadow"
            >
              <div className="flex gap-2">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                  {/* Language Selector */}
                  <div className="relative">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {language === 'ko' ? '언어' : 'Language'}
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowDropdown(showDropdown === index ? null : index)
                        setSearchQuery('')
                      }}
                      className="w-full px-2.5 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm text-left flex items-center justify-between hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                    >
                      <span className={translation.language ? '' : 'text-gray-500 dark:text-gray-400'}>
                        {translation.language 
                          ? getSelectedLanguageLabel(translation.language)
                          : (language === 'ko' ? '언어를 선택하세요' : 'Select a language')
                        }
                      </span>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </button>

                    {/* Dropdown */}
                    {showDropdown === index && (
                      <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
                        {/* Search */}
                        <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={language === 'ko' ? '언어 검색...' : 'Search languages...'}
                            className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>

                        {/* Language List */}
                        <div className="max-h-64 overflow-y-auto">
                          {Object.entries(languageGroups).map(([groupKey, groupLabel]) => {
                            const groupLanguages = filteredLanguages.filter(lang => lang.group === groupKey)
                            if (groupLanguages.length === 0) return null

                            return (
                              <div key={groupKey}>
                                <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50">
                                  {groupLabel}
                                </div>
                                {groupLanguages.map(lang => (
                                  <button
                                    key={lang.value}
                                    type="button"
                                    onClick={() => {
                                      updateTranslation(index, 'language', lang.value)
                                      setShowDropdown(null)
                                      setSearchQuery('')
                                    }}
                                    className={`w-full px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                                      translation.language === lang.value 
                                        ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300' 
                                        : 'text-gray-700 dark:text-gray-300'
                                    }`}
                                  >
                                    {lang.label}
                                  </button>
                                ))}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Title Input */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {language === 'ko' ? '번역된 제목' : 'Translated Title'}
                    </label>
                    <TranslationTitleInput
                      index={index}
                      initialValue={translation.title}
                      language={translation.language}
                      onUpdate={updateTranslation}
                      placeholder={placeholder || (language === 'ko' ? '선택한 언어로 번역된 제목' : 'Title in selected language')}
                    />
                    {!translation.language && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {language === 'ko' 
                          ? '먼저 언어를 선택해주세요'
                          : 'Please select a language first'
                        }
                      </p>
                    )}
                  </div>
                </div>

                {/* Remove Button */}
                <button
                  type="button"
                  onClick={() => removeTranslation(index)}
                  className="mt-5 p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <Globe className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
          <p className="text-gray-600 dark:text-gray-400 text-xs">
            {language === 'ko' 
              ? '아직 번역이 없습니다'
              : 'No translations yet'
            }
          </p>
          <p className="text-gray-500 dark:text-gray-500 text-xs mt-0.5">
            {language === 'ko' 
              ? '"번역 추가" 버튼을 클릭하여 시작하세요'
              : 'Click "Add Translation" to get started'
            }
          </p>
        </div>
      )}

      {/* Click outside to close dropdown */}
      {showDropdown !== null && (
        <div 
          className="fixed inset-0 z-10" 
          onClick={() => {
            setShowDropdown(null)
            setSearchQuery('')
          }}
        />
      )}
    </div>
  )
}