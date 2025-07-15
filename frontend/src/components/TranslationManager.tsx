import { useState, useCallback } from 'react'
import { Plus, X, Edit2, Globe, Search, Check } from 'lucide-react'
import { useLanguageStore } from '@/store/language.store'
import useSafeStore from '@/hooks/useSafeStore'
import { SUPPORTED_LANGUAGES, getLanguageByCode, getLanguageDisplay, getCommonLanguages } from '@/data/languages'

export interface Translation {
  id: string
  language: string
  title: string
}

interface TranslationManagerProps {
  value: Translation[]
  onChange: (translations: Translation[]) => void
  title: string
  placeholder?: string
  maxTranslations?: number
  className?: string
  showCommonOnly?: boolean
}

export default function TranslationManager({
  value = [],
  onChange,
  title,
  placeholder = '',
  maxTranslations = 10,
  className = '',
  showCommonOnly = false
}: TranslationManagerProps) {
  const language = useSafeStore(useLanguageStore, (state) => state.language)
  const t = (ko: string, en: string) => language === 'ko' ? ko : en

  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newLanguage, setNewLanguage] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Get available languages (exclude already used ones)
  const usedLanguageCodes = value.map(t => t.language)
  const availableLanguages = (showCommonOnly ? getCommonLanguages() : SUPPORTED_LANGUAGES)
    .filter(lang => !usedLanguageCodes.includes(lang.code))
    .filter(lang => {
      if (!searchQuery) return true
      const query = searchQuery.toLowerCase()
      return (
        lang.name.toLowerCase().includes(query) ||
        lang.nativeName.toLowerCase().includes(query) ||
        lang.code.toLowerCase().includes(query)
      )
    })

  const generateId = () => `translation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  const handleAdd = useCallback(() => {
    if (!newLanguage || !newTitle.trim()) return

    const newTranslation: Translation = {
      id: generateId(),
      language: newLanguage,
      title: newTitle.trim()
    }

    onChange([...value, newTranslation])
    setNewLanguage('')
    setNewTitle('')
    setIsAdding(false)
    setSearchQuery('')
  }, [newLanguage, newTitle, value, onChange])

  const handleEdit = useCallback((id: string, newTitleValue: string) => {
    const updated = value.map(translation =>
      translation.id === id
        ? { ...translation, title: newTitleValue.trim() }
        : translation
    )
    onChange(updated)
    setEditingId(null)
  }, [value, onChange])

  const handleDelete = useCallback((id: string) => {
    const filtered = value.filter(translation => translation.id !== id)
    onChange(filtered)
  }, [value, onChange])

  const handleCancelAdd = () => {
    setIsAdding(false)
    setNewLanguage('')
    setNewTitle('')
    setSearchQuery('')
  }

  const canAddMore = value.length < maxTranslations && availableLanguages.length > 0

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">{title}</h3>
          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">
            {value.length}/{maxTranslations}
          </span>
        </div>
        
        {canAddMore && !isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t('번역 추가', 'Add Translation')}
          </button>
        )}
      </div>

      {/* Existing Translations */}
      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((translation) => {
            const lang = getLanguageByCode(translation.language)
            const isEditing = editingId === translation.id

            return (
              <div key={translation.id} className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
                {/* Language Flag/Code */}
                <div className="flex-shrink-0">
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded">
                    {translation.language.toUpperCase()}
                  </span>
                </div>

                {/* Language Name */}
                <div className="flex-shrink-0 min-w-0 w-32">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {lang?.nativeName || translation.language}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {lang?.name || translation.language}
                  </p>
                </div>

                {/* Title */}
                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <input
                      type="text"
                      defaultValue={translation.title}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleEdit(translation.id, e.currentTarget.value)
                        } else if (e.key === 'Escape') {
                          setEditingId(null)
                        }
                      }}
                      onBlur={(e) => handleEdit(translation.id, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 text-sm"
                      placeholder={placeholder}
                      autoFocus
                    />
                  ) : (
                    <p className="text-sm text-gray-900 dark:text-white truncate">
                      {translation.title}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex-shrink-0 flex items-center gap-1">
                  {!isEditing && (
                    <button
                      onClick={() => setEditingId(translation.id)}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
                      title={t('수정', 'Edit')}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(translation.id)}
                    className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded"
                    title={t('삭제', 'Delete')}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add New Translation */}
      {isAdding && (
        <div className="p-4 border border-purple-200 dark:border-purple-800 rounded-lg bg-purple-50 dark:bg-purple-900/20">
          <div className="space-y-3">
            {/* Language Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('언어 선택', 'Select Language')}
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700"
                  placeholder={t('언어 검색...', 'Search languages...')}
                />
              </div>
            </div>

            {/* Language Selection */}
            <div className="max-h-32 overflow-y-auto space-y-1">
              {availableLanguages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setNewLanguage(lang.code)}
                  className={`
                    w-full text-left p-2 rounded-lg transition-colors text-sm
                    ${newLanguage === lang.code
                      ? 'bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-300'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">{lang.nativeName}</span>
                      <span className="text-gray-500 dark:text-gray-400 ml-2">({lang.name})</span>
                    </div>
                    <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                      {lang.code.toUpperCase()}
                    </span>
                    {newLanguage === lang.code && (
                      <Check className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    )}
                  </div>
                </button>
              ))}
            </div>

            {availableLanguages.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                {searchQuery 
                  ? t('검색 결과가 없습니다', 'No languages found')
                  : t('추가할 수 있는 언어가 없습니다', 'No more languages available')
                }
              </p>
            )}

            {/* Title Input */}
            {newLanguage && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('번역된 제목', 'Translated Title')}
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAdd()
                    } else if (e.key === 'Escape') {
                      handleCancelAdd()
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700"
                  placeholder={placeholder}
                  autoFocus
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleAdd}
                disabled={!newLanguage || !newTitle.trim()}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
              >
                {t('추가', 'Add')}
              </button>
              <button
                onClick={handleCancelAdd}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm"
              >
                {t('취소', 'Cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {value.length === 0 && !isAdding && (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
          <Globe className="w-8 h-8 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {t('아직 번역이 추가되지 않았습니다', 'No translations added yet')}
          </p>
          {canAddMore && (
            <button
              onClick={() => setIsAdding(true)}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t('첫 번째 번역 추가', 'Add First Translation')}
            </button>
          )}
        </div>
      )}

      {/* Info */}
      {value.length > 0 && (
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {t(
            `${value.length}개 언어로 번역되었습니다`,
            `Translated into ${value.length} language${value.length === 1 ? '' : 's'}`
          )}
        </div>
      )}
    </div>
  )
}