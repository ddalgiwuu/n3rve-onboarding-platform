import { useState, useEffect } from 'react'
import { X, Info, Youtube, Plus, User, Save, Search, ChevronDown, Globe } from 'lucide-react'
import { useLanguageStore } from '@/store/language.store'
import { useSavedArtistsStore } from '@/store/savedArtists.store'
import useSafeStore from '@/hooks/useSafeStore'
import { v4 as uuidv4 } from 'uuid'
import toast from 'react-hot-toast'

interface ArtistIdentifier {
  type: string
  value: string
}

interface Artist {
  id: string
  primaryName: string
  hasTranslation: boolean
  translationLanguage?: string
  translatedName?: string
  isNewArtist: boolean
  countryOfOrigin?: string
  customIdentifiers: ArtistIdentifier[]
  role: 'main' | 'featuring'
  youtubeChannelId?: string
  spotifyId?: string
  appleId?: string
}

interface Props {
  isOpen: boolean
  onClose: () => void
  onSave: (artist: Artist) => void
  role: 'main' | 'featuring'
  editingArtist?: Artist | null
}

const translationLanguages = [
  { code: 'en', name: 'English' },
  { code: 'ko', name: '한국어 (Korean)' },
  { code: 'ja', name: '日本語 (Japanese)' },
  { code: 'zh', name: '中文 (Chinese)' },
  { code: 'es', name: 'Español (Spanish)' },
  { code: 'fr', name: 'Français (French)' },
  { code: 'de', name: 'Deutsch (German)' },
  { code: 'it', name: 'Italiano (Italian)' },
  { code: 'pt', name: 'Português (Portuguese)' },
  { code: 'ru', name: 'Русский (Russian)' }
]

export default function EnhancedArtistModal({ isOpen, onClose, onSave, role, editingArtist }: Props) {
  const language = useSafeStore(useLanguageStore, (state) => state.language)
  const t = (ko: string, en: string) => language === 'ko' ? ko : en
  const savedArtistsStore = useSavedArtistsStore()
  
  const [artist, setArtist] = useState<Artist>(editingArtist || {
    id: uuidv4(),
    primaryName: '',
    hasTranslation: false,
    translationLanguage: '',
    translatedName: '',
    isNewArtist: false,
    countryOfOrigin: 'KR',
    customIdentifiers: [],
    role,
    youtubeChannelId: '',
    spotifyId: '',
    appleId: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showHelpModal, setShowHelpModal] = useState<'spotify' | 'apple' | null>(null)
  const [showSavedArtists, setShowSavedArtists] = useState(false)
  const [savedArtistSearch, setSavedArtistSearch] = useState('')
  const [activeTranslations, setActiveTranslations] = useState<string[]>([])
  const [translations, setTranslations] = useState<Record<string, string>>({})

  // Initialize translations from existing artist
  useEffect(() => {
    if (editingArtist && editingArtist.hasTranslation && editingArtist.translationLanguage && editingArtist.translatedName) {
      setActiveTranslations([editingArtist.translationLanguage])
      setTranslations({ [editingArtist.translationLanguage]: editingArtist.translatedName })
    }
  }, [editingArtist])

  // Load saved artists on mount and when modal opens
  useEffect(() => {
    if (isOpen) {
      savedArtistsStore.fetchArtists().catch(error => {
        console.error('Failed to fetch saved artists:', error)
        toast.error(t('저장된 아티스트를 불러오는데 실패했습니다', 'Failed to load saved artists'))
      })
    }
  }, [isOpen])

  if (!isOpen) return null

  const validate = () => {
    const newErrors: Record<string, string> = {}
    
    if (!artist.primaryName.trim()) {
      newErrors.primaryName = t('필수 항목입니다', 'This field is required')
    }
    
    // Platform IDs validation - only validate if provided
    if (!artist.isNewArtist && artist.spotifyId && artist.spotifyId.trim() && artist.spotifyId === 'MAKE_NEW') {
      // If user selected "MAKE_NEW", they need to be marked as new artist
      newErrors.spotifyId = t('신인 아티스트로 체크해주세요', 'Please check as new artist')
    }
    
    if (!artist.isNewArtist && artist.appleId && artist.appleId.trim() && artist.appleId === 'MAKE_NEW') {
      // If user selected "MAKE_NEW", they need to be marked as new artist
      newErrors.appleId = t('신인 아티스트로 체크해주세요', 'Please check as new artist')
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    const isValid = validate()
    
    if (isValid) {
      // Prepare artist with translations
      const finalArtist = {
        ...artist,
        hasTranslation: activeTranslations.length > 0,
        translationLanguage: activeTranslations[0] || '',
        translatedName: translations[activeTranslations[0]] || ''
      }
      
      // Save to database if not editing existing
      if (!editingArtist) {
        try {
          
          const artistDataToSave = {
            name: artist.primaryName,
            translations: Object.entries(translations).map(([language, name]) => ({
              language,
              name
            })),
            identifiers: [
              ...(artist.spotifyId && artist.spotifyId !== 'MAKE_NEW' ? [{ type: 'SPOTIFY', value: artist.spotifyId }] : []),
              ...(artist.appleId && artist.appleId !== 'MAKE_NEW' ? [{ type: 'APPLE_MUSIC', value: artist.appleId }] : []),
              ...(artist.youtubeChannelId ? [{ type: 'YOUTUBE', value: artist.youtubeChannelId }] : [])
            ]
          }
          
          await savedArtistsStore.addArtist(artistDataToSave)
          toast.success(t('아티스트가 저장되었습니다', 'Artist saved successfully'))
        } catch (error) {
          console.error('EnhancedArtistModal: Error saving artist:', error)
          console.error('EnhancedArtistModal: Error details:', error instanceof Error ? error.message : 'Unknown error')
          console.error('EnhancedArtistModal: Error stack:', error instanceof Error ? error.stack : 'No stack trace')
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          toast.error(t(`아티스트 저장에 실패했습니다: ${errorMessage}`, `Failed to save artist: ${errorMessage}`))
          return // Don't close modal if save failed
        }
      }
      
      onSave(finalArtist)
      onClose()
    }
  }

  const selectSavedArtist = (savedArtist: any) => {
    const spotifyId = savedArtist.identifiers.find((id: any) => id.type === 'SPOTIFY')?.value
    const appleId = savedArtist.identifiers.find((id: any) => id.type === 'APPLE_MUSIC')?.value
    const youtubeId = savedArtist.identifiers.find((id: any) => id.type === 'YOUTUBE')?.value
    
    // Convert saved artist translations to our format
    const translationMap: Record<string, string> = {}
    savedArtist.translations.forEach((trans: any) => {
      translationMap[trans.language] = trans.name
    })
    
    setArtist({
      ...artist,
      primaryName: savedArtist.name,
      spotifyId: spotifyId || '',
      appleId: appleId || '',
      youtubeChannelId: youtubeId || '',
      isNewArtist: false
    })
    
    setTranslations(translationMap)
    setActiveTranslations(Object.keys(translationMap))
    setShowSavedArtists(false)
    
    // Update usage count
    savedArtistsStore.useArtist(savedArtist.id)
    toast.success(t('저장된 아티스트가 선택되었습니다', 'Saved artist selected'))
  }

  const addTranslation = (langCode: string) => {
    if (!activeTranslations.includes(langCode)) {
      setActiveTranslations([...activeTranslations, langCode])
    }
  }

  const removeTranslation = (langCode: string) => {
    setActiveTranslations(activeTranslations.filter(l => l !== langCode))
    const newTranslations = { ...translations }
    delete newTranslations[langCode]
    setTranslations(newTranslations)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {role === 'main' ? t('메인 아티스트 추가', 'Add Main Artist') : t('피처링 아티스트 추가', 'Add Featuring Artist')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-6">
            {/* Saved Artists Section */}
            <div>
              <button
                onClick={() => setShowSavedArtists(!showSavedArtists)}
                className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <Save className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {t('저장된 아티스트에서 선택', 'Select from Saved Artists')}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {savedArtistsStore.artists.length}개의 아티스트가 저장됨
                    </div>
                  </div>
                </div>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showSavedArtists ? 'rotate-180' : ''}`} />
              </button>
              
              {showSavedArtists && (
                <div className="mt-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="p-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder={t('아티스트 이름으로 검색...', 'Search by artist name...')}
                        value={savedArtistSearch}
                        onChange={(e) => setSavedArtistSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-sm"
                      />
                    </div>
                  </div>
                  
                  <div className="max-h-48 overflow-y-auto">
                    {savedArtistsStore.loading && (
                      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                        {t('아티스트를 불러오는 중...', 'Loading artists...')}
                      </div>
                    )}
                    {savedArtistsStore.error && (
                      <div className="p-4 text-center text-red-500">
                        {t('아티스트를 불러오는데 실패했습니다', 'Failed to load artists')}
                        <button
                          onClick={() => savedArtistsStore.fetchArtists()}
                          className="block mx-auto mt-2 px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                        >
                          {t('다시 시도', 'Retry')}
                        </button>
                      </div>
                    )}
                    {!savedArtistsStore.loading && !savedArtistsStore.error && savedArtistsStore.searchArtists(savedArtistSearch).length === 0 && (
                      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                        {t('저장된 아티스트가 없습니다', 'No saved artists found')}
                      </div>
                    )}
                    {!savedArtistsStore.loading && !savedArtistsStore.error && savedArtistsStore.searchArtists(savedArtistSearch).map((savedArtist) => (
                      <button
                        key={savedArtist.id}
                        onClick={() => selectSavedArtist(savedArtist)}
                        className="w-full p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors text-left"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 dark:text-white">
                              {savedArtist.name}
                            </div>
                            {savedArtist.translations.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {savedArtist.translations.map((trans: any, idx: number) => (
                                  <span key={idx} className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded text-xs">
                                    <Globe className="w-3 h-3" />
                                    {trans.language.toUpperCase()}: {trans.name}
                                  </span>
                                ))}
                              </div>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              {savedArtist.identifiers.find((id: any) => id.type === 'SPOTIFY') && (
                                <span className="text-xs text-green-600 dark:text-green-400">Spotify ✓</span>
                              )}
                              {savedArtist.identifiers.find((id: any) => id.type === 'APPLE_MUSIC') && (
                                <span className="text-xs text-gray-600 dark:text-gray-400">Apple ✓</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                    
                    {savedArtistsStore.searchArtists(savedArtistSearch).length === 0 && (
                      <div className="text-center py-6">
                        <p className="text-gray-500 dark:text-gray-400">
                          {savedArtistSearch ? t('검색 결과가 없습니다', 'No search results') : t('저장된 아티스트가 없습니다', 'No saved artists')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Primary Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('아티스트명', 'Artist Name')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={artist.primaryName}
                onChange={(e) => setArtist({ ...artist, primaryName: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-n3rve-accent focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder={t('아티스트명을 입력하세요', 'Enter artist name')}
              />
              {errors.primaryName && (
                <p className="mt-1 text-sm text-red-500">{errors.primaryName}</p>
              )}
            </div>

            {/* Artist Translations */}
            <div>
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Globe className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    {t('아티스트명 번역', 'Artist Name Translations')}
                  </label>
                  <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
                    {t('선택사항', 'Optional')}
                  </span>
                </div>
                
                {/* Active translations */}
                <div className="space-y-2">
                  {activeTranslations.map(langCode => {
                    const lang = translationLanguages.find(l => l.code === langCode)
                    return (
                      <div key={langCode} className="flex items-center gap-2">
                        <div className="flex-1 flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-400 w-8">
                            {lang?.code.toUpperCase()}
                          </span>
                          <input
                            type="text"
                            value={translations[langCode] || ''}
                            onChange={(e) => setTranslations({
                              ...translations,
                              [langCode]: e.target.value
                            })}
                            placeholder={t(`${lang?.name}로 아티스트명 입력`, `Enter artist name in ${lang?.name}`)}
                            className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeTranslation(langCode)}
                          className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )
                  })}
                  
                  {activeTranslations.length === 0 && (
                    <p className="text-center py-3 text-sm text-gray-500 dark:text-gray-400">
                      {t('번역이 추가되지 않았습니다', 'No translations added')}
                    </p>
                  )}
                </div>
                
                {/* Add translation button */}
                <button
                  type="button"
                  onClick={() => {
                    const availableLangs = translationLanguages.filter(l => !activeTranslations.includes(l.code))
                    if (availableLangs.length > 0) {
                      addTranslation(availableLangs[0].code)
                    }
                  }}
                  className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-sm"
                  disabled={activeTranslations.length >= translationLanguages.length}
                >
                  <Plus className="w-4 h-4" />
                  {t('언어 추가', 'Add Language')}
                </button>
              </div>
            </div>

            {/* New Artist Toggle */}
            <div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isNewArtist"
                  checked={artist.isNewArtist}
                  onChange={(e) => setArtist({ ...artist, isNewArtist: e.target.checked })}
                  className="w-4 h-4 text-n3rve-main bg-gray-100 border-gray-300 rounded focus:ring-n3rve-accent focus:ring-2"
                />
                <label htmlFor="isNewArtist" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('신인 아티스트 (플랫폼에 아직 등록되지 않음)', 'New Artist (Not yet on platforms)')}
                </label>
              </div>
            </div>

            {/* Platform IDs */}
            {!artist.isNewArtist && (
              <div className="space-y-4">
                {/* Spotify ID */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Spotify Artist ID <span className="text-red-500">*</span>
                    <button
                      type="button"
                      onClick={() => setShowHelpModal('spotify')}
                      className="ml-2 text-gray-400 hover:text-gray-600"
                    >
                      <Info className="w-4 h-4 inline" />
                    </button>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={artist.spotifyId}
                      onChange={(e) => setArtist({ ...artist, spotifyId: e.target.value })}
                      className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-n3rve-accent focus:border-transparent bg-white dark:bg-gray-700"
                      placeholder="spotify:artist:XXXXXXXXX"
                    />
                    {!artist.spotifyId && (
                      <button
                        type="button"
                        onClick={() => setArtist({ ...artist, spotifyId: 'MAKE_NEW' })}
                        className="px-4 py-2 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/30 transition-colors text-sm font-medium"
                      >
                        {t('NEW', 'NEW')}
                      </button>
                    )}
                  </div>
                  {errors.spotifyId && (
                    <p className="mt-1 text-sm text-red-500">{errors.spotifyId}</p>
                  )}
                </div>

                {/* Apple Music ID */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Apple Music Artist ID <span className="text-red-500">*</span>
                    <button
                      type="button"
                      onClick={() => setShowHelpModal('apple')}
                      className="ml-2 text-gray-400 hover:text-gray-600"
                    >
                      <Info className="w-4 h-4 inline" />
                    </button>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={artist.appleId}
                      onChange={(e) => setArtist({ ...artist, appleId: e.target.value })}
                      className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-n3rve-accent focus:border-transparent bg-white dark:bg-gray-700"
                      placeholder="123456789"
                    />
                    {!artist.appleId && (
                      <button
                        type="button"
                        onClick={() => setArtist({ ...artist, appleId: 'MAKE_NEW' })}
                        className="px-4 py-2 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/30 transition-colors text-sm font-medium"
                      >
                        {t('NEW', 'NEW')}
                      </button>
                    )}
                  </div>
                  {errors.appleId && (
                    <p className="mt-1 text-sm text-red-500">{errors.appleId}</p>
                  )}
                </div>

                {/* YouTube Channel ID */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Youtube className="w-4 h-4 inline mr-1" />
                    YouTube Channel ID
                    <span className="ml-2 text-xs text-gray-500">{t('선택사항', 'Optional')}</span>
                  </label>
                  <input
                    type="text"
                    value={artist.youtubeChannelId}
                    onChange={(e) => setArtist({ ...artist, youtubeChannelId: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-n3rve-accent focus:border-transparent bg-white dark:bg-gray-700"
                    placeholder="UCxxxxxxxxxxxx"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            {t('취소', 'Cancel')}
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-n3rve-main text-white rounded-lg hover:bg-n3rve-main/90 transition-colors"
          >
            {t('저장', 'Save')}
          </button>
        </div>
      </div>

      {/* Help Modals */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">
              {showHelpModal === 'spotify' ? 'Spotify Artist ID 찾는 방법' : 'Apple Music Artist ID 찾는 방법'}
            </h3>
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
              {showHelpModal === 'spotify' ? (
                <>
                  <p><strong>Mac:</strong></p>
                  <ol className="list-decimal list-inside ml-2">
                    <li>Spotify 앱에서 아티스트 페이지 열기</li>
                    <li>Option(⌥) 키를 누른 상태에서 아티스트 이름 옆 ⋯ 클릭</li>
                    <li>"Copy Spotify URI" 선택</li>
                  </ol>
                  <p className="mt-2"><strong>Windows:</strong></p>
                  <ol className="list-decimal list-inside ml-2">
                    <li>Spotify 앱에서 아티스트 페이지 열기</li>
                    <li>Ctrl 키를 누른 상태에서 아티스트 이름 옆 ⋯ 클릭</li>
                    <li>"Copy Spotify URI" 선택</li>
                  </ol>
                </>
              ) : (
                <>
                  <p><strong>Mac:</strong></p>
                  <ol className="list-decimal list-inside ml-2">
                    <li>Apple Music 앱에서 아티스트 페이지 열기</li>
                    <li>아티스트 이름 우클릭</li>
                    <li>"Share" → "Copy Link" 선택</li>
                    <li>URL에서 마지막 숫자가 ID</li>
                  </ol>
                  <p className="mt-2"><strong>Windows:</strong></p>
                  <ol className="list-decimal list-inside ml-2">
                    <li>웹브라우저에서 music.apple.com 접속</li>
                    <li>아티스트 검색 후 페이지 열기</li>
                    <li>URL에서 마지막 숫자가 ID</li>
                  </ol>
                </>
              )}
            </div>
            <button
              onClick={() => setShowHelpModal(null)}
              className="mt-4 w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  )
}