import { useState } from 'react'
import { X, Plus, Trash2, Users, User, Music, ExternalLink, HelpCircle, Globe, Search, ChevronDown } from 'lucide-react'
import { useLanguageStore } from '@/store/language.store'

interface Artist {
  id: string
  name: string
  role: 'main' | 'featured' | 'additional'
  spotifyId?: string
  appleId?: string
  translations?: {
    [language: string]: string // e.g., { 'en': 'BTS', 'ja': '防弾少年団', 'zh': '防弹少年团' }
  }
}

interface ArtistManagementModalProps {
  isOpen: boolean
  onClose: () => void
  artists: Artist[]
  onSave: (artists: Artist[]) => void
  albumLevel?: boolean // true for album-level artists, false for track-level
  isFeaturing?: boolean // true when managing featuring artists
}

// Language options for translations
const translationLanguages = [
  { code: 'en', name: 'English' },
  { code: 'ja', name: '日本語 (Japanese)' },
  { code: 'zh', name: '中文 (Chinese)' },
  { code: 'es', name: 'Español (Spanish)' },
  { code: 'fr', name: 'Français (French)' },
  { code: 'de', name: 'Deutsch (German)' },
  { code: 'it', name: 'Italiano (Italian)' },
  { code: 'pt', name: 'Português (Portuguese)' },
  { code: 'ru', name: 'Русский (Russian)' }
]

export default function ArtistManagementModal({
  isOpen,
  onClose,
  artists: initialArtists,
  onSave,
  albumLevel = true,
  isFeaturing = false
}: ArtistManagementModalProps) {
  const { language } = useLanguageStore()
  const t = (ko: string, en: string) => language === 'ko' ? ko : en
  
  const [artists, setArtists] = useState<Artist[]>(initialArtists)
  const [newArtist, setNewArtist] = useState<Partial<Artist>>({
    name: '',
    role: isFeaturing ? 'featured' : (albumLevel ? 'main' : 'additional'),
    spotifyId: '',
    appleId: '',
    translations: {}
  })
  const [errors, setErrors] = useState<string[]>([])
  const [showSpotifyHelp, setShowSpotifyHelp] = useState(false)
  const [showAppleHelp, setShowAppleHelp] = useState(false)
  const [activeTranslations, setActiveTranslations] = useState<string[]>([])

  const validateArtist = () => {
    const errs: string[] = []
    if (!newArtist.name?.trim()) {
      errs.push(t('아티스트 이름을 입력하세요', 'Please enter artist name'))
    }
    if (artists.some(a => a.name.toLowerCase() === newArtist.name?.toLowerCase())) {
      errs.push(t('이미 추가된 아티스트입니다', 'Artist already added'))
    }
    setErrors(errs)
    return errs.length === 0
  }

  const addArtist = () => {
    if (validateArtist()) {
      const artist: Artist = {
        id: Date.now().toString(),
        name: newArtist.name!.trim(),
        role: isFeaturing ? 'featured' : (albumLevel ? 'main' : newArtist.role as Artist['role']),
        spotifyId: newArtist.spotifyId?.trim() || undefined,
        appleId: newArtist.appleId?.trim() || undefined,
        translations: newArtist.translations
      }
      setArtists([...artists, artist])
      setNewArtist({ 
        name: '', 
        role: isFeaturing ? 'featured' : (albumLevel ? 'main' : 'additional'), 
        spotifyId: '', 
        appleId: '',
        translations: {}
      })
      setErrors([])
      setActiveTranslations([])
    }
  }

  const removeArtist = (id: string) => {
    setArtists(artists.filter(a => a.id !== id))
  }

  const updateArtistRole = (id: string, role: Artist['role']) => {
    setArtists(artists.map(a => a.id === id ? { ...a, role } : a))
  }

  const handleSave = () => {
    onSave(artists)
    onClose()
  }

  const addTranslation = (langCode: string) => {
    if (!activeTranslations.includes(langCode)) {
      setActiveTranslations([...activeTranslations, langCode])
    }
  }

  const removeTranslation = (langCode: string) => {
    setActiveTranslations(activeTranslations.filter(l => l !== langCode))
    const newTranslations = { ...newArtist.translations }
    delete newTranslations[langCode]
    setNewArtist({ ...newArtist, translations: newTranslations })
  }

  if (!isOpen) return null

  const getRoleIcon = (role: Artist['role']) => {
    switch (role) {
      case 'main': return <User className="w-4 h-4" />
      case 'featured': return <Music className="w-4 h-4" />
      case 'additional': return <Users className="w-4 h-4" />
    }
  }

  const getRoleLabel = (role: Artist['role']) => {
    switch (role) {
      case 'main': return t('메인 아티스트', 'Main Artist')
      case 'featured': return t('피처링', 'Featured')
      case 'additional': return t('참여 아티스트', 'Additional Artist')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                {isFeaturing ? (
                  <>
                    <Music className="w-6 h-6" />
                    {t('피처링 아티스트 관리', 'Manage Featuring Artists')}
                  </>
                ) : albumLevel ? (
                  <>
                    <Users className="w-6 h-6" />
                    {t('앨범 아티스트 관리', 'Manage Album Artists')}
                  </>
                ) : (
                  <>
                    <User className="w-6 h-6" />
                    {t('트랙 아티스트 관리', 'Manage Track Artists')}
                  </>
                )}
              </h2>
              <p className="text-purple-100 text-sm mt-1">
                {isFeaturing 
                  ? t('피처링 아티스트를 추가하고 관리하세요', 'Add and manage featuring artists')
                  : albumLevel 
                  ? t('앨범의 메인 아티스트를 추가하고 관리하세요', 'Add and manage main album artists')
                  : t('트랙의 아티스트를 추가하고 관리하세요', 'Add and manage track artists')
                }
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Add New Artist */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 mb-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Plus className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              {t('새 아티스트 추가', 'Add New Artist')}
            </h3>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('아티스트 이름', 'Artist Name')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newArtist.name || ''}
                    onChange={(e) => setNewArtist({ ...newArtist, name: e.target.value })}
                    placeholder={t('아티스트명 입력', 'Enter artist name')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-800"
                  />
                </div>
                
                {/* Role selection - only for non-album level and non-featuring */}
                {!albumLevel && !isFeaturing && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('역할', 'Role')}
                    </label>
                    <select
                      value={newArtist.role}
                      onChange={(e) => setNewArtist({ ...newArtist, role: e.target.value as Artist['role'] })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-800"
                    >
                      <option value="featured">{t('피처링', 'Featured')}</option>
                      <option value="additional">{t('참여 아티스트', 'Additional Artist')}</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Artist Translations */}
              <div className="md:col-span-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    {t('아티스트명 번역', 'Artist Name Translations')}
                  </label>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {t('선택사항', 'Optional')}
                  </span>
                </div>
                
                {/* Active translations */}
                <div className="space-y-2">
                  {activeTranslations.map(langCode => {
                    const lang = translationLanguages.find(l => l.code === langCode)
                    return (
                      <div key={langCode} className="group bg-white dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-600 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2 min-w-[120px]">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              {lang?.code}
                            </span>
                            <span className="text-xs text-gray-400 dark:text-gray-500">•</span>
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {lang?.name}
                            </span>
                          </div>
                          <input
                            type="text"
                            value={newArtist.translations?.[langCode] || ''}
                            onChange={(e) => setNewArtist({
                              ...newArtist,
                              translations: {
                                ...newArtist.translations,
                                [langCode]: e.target.value
                              }
                            })}
                            placeholder={t(`${lang?.name}로 아티스트명 입력`, `Enter artist name in ${lang?.name}`)}
                            className="flex-1 px-3 py-1.5 text-sm border-0 bg-transparent focus:outline-none focus:ring-2 focus:ring-purple-500 rounded"
                          />
                          <button
                            type="button"
                            onClick={() => removeTranslation(langCode)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                  
                  {activeTranslations.length === 0 && (
                    <div className="text-center py-4 text-gray-400 dark:text-gray-500 text-sm">
                      {t('번역을 추가하려면 아래 버튼을 클릭하세요', 'Click below to add translations')}
                    </div>
                  )}
                </div>
                
                {/* Add translation button */}
                <div className="mt-3">
                  <div className="relative">
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          addTranslation(e.target.value)
                          e.target.value = ''
                        }
                      }}
                      className="w-full appearance-none text-sm px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 cursor-pointer hover:border-purple-400 dark:hover:border-purple-500 transition-colors"
                    >
                      <option value="">{t('+ 언어 추가', '+ Add Language')}</option>
                      {translationLanguages
                        .filter(lang => !activeTranslations.includes(lang.code))
                        .map(lang => (
                          <option key={lang.code} value={lang.code}>
                            {lang.name} ({lang.code.toUpperCase()})
                          </option>
                        ))
                      }
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Spotify ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Spotify Artist ID
                  <button
                    type="button"
                    onClick={() => setShowSpotifyHelp(!showSpotifyHelp)}
                    className="ml-2 text-gray-400 hover:text-gray-600"
                  >
                    <HelpCircle className="w-4 h-4 inline" />
                  </button>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newArtist.spotifyId || ''}
                    onChange={(e) => setNewArtist({ ...newArtist, spotifyId: e.target.value })}
                    placeholder="spotify:artist:XXXXXXXXX"
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-800"
                  />
                  {!newArtist.spotifyId && (
                    <button
                      type="button"
                      onClick={() => setNewArtist({ ...newArtist, spotifyId: 'MAKE_NEW' })}
                      className="px-4 py-2 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/30 transition-colors text-sm font-medium whitespace-nowrap"
                    >
                      {t('NEW', 'NEW')}
                    </button>
                  )}
                </div>
                
                {showSpotifyHelp && (
                  <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-sm">
                    <p className="font-medium text-green-800 dark:text-green-200 mb-2">
                      {t('Spotify Artist ID 찾는 방법', 'How to find Spotify Artist ID')}
                    </p>
                    <div className="space-y-2 text-green-700 dark:text-green-300">
                      <div>
                        <p className="font-medium">{t('Mac:', 'Mac:')}</p>
                        <ol className="list-decimal list-inside ml-2">
                          <li>{t('Spotify 앱에서 아티스트 페이지 열기', 'Open artist page in Spotify app')}</li>
                          <li>{t('Option(⌥) 키를 누른 상태에서 아티스트 이름 옆 ⋯ 클릭', 'Hold Option(⌥) key and click ⋯ next to artist name')}</li>
                          <li>{t('"Copy Spotify URI" 선택', 'Select "Copy Spotify URI"')}</li>
                          <li>{t('복사된 URI 예시: spotify:artist:XXXXXXXXX', 'Copied URI example: spotify:artist:XXXXXXXXX')}</li>
                        </ol>
                        <p className="font-medium mt-2">{t('Windows:', 'Windows:')}</p>
                        <ol className="list-decimal list-inside ml-2">
                          <li>{t('Spotify 앱에서 아티스트 페이지 열기', 'Open artist page in Spotify app')}</li>
                          <li>{t('아티스트 이름 옆 ⋯ 클릭', 'Click ⋯ next to artist name')}</li>
                          <li>{t('"Share" → "Copy link to artist" 선택', 'Select "Share" → "Copy link to artist"')}</li>
                          <li>{t('URL에서 ID 추출: open.spotify.com/artist/[이 부분이 ID]', 'Extract ID from URL: open.spotify.com/artist/[this is the ID]')}</li>
                          <li>{t('또는 spotify:artist:XXXXXXXXX 형식으로 입력', 'Or enter as spotify:artist:XXXXXXXXX format')}</li>
                        </ol>
                      </div>
                      <p className="text-xs italic">
                        {t('아티스트가 Spotify에 없다면 비워두고 NEW 버튼을 클릭하세요.', 
                          'If artist is not on Spotify, leave empty and click NEW button.')}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Apple Music ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Apple Music Artist ID
                  <button
                    type="button"
                    onClick={() => setShowAppleHelp(!showAppleHelp)}
                    className="ml-2 text-gray-400 hover:text-gray-600"
                  >
                    <HelpCircle className="w-4 h-4 inline" />
                  </button>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newArtist.appleId || ''}
                    onChange={(e) => setNewArtist({ ...newArtist, appleId: e.target.value })}
                    placeholder="123456789"
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-800"
                  />
                  {!newArtist.appleId && (
                    <button
                      type="button"
                      onClick={() => setNewArtist({ ...newArtist, appleId: 'MAKE_NEW' })}
                      className="px-4 py-2 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/30 transition-colors text-sm font-medium whitespace-nowrap"
                    >
                      {t('NEW', 'NEW')}
                    </button>
                  )}
                </div>
                
                {showAppleHelp && (
                  <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-sm border border-gray-200 dark:border-gray-700">
                    <p className="font-medium text-gray-800 dark:text-gray-200 mb-2">
                      {t('Apple Music Artist ID 찾는 방법', 'How to find Apple Music Artist ID')}
                    </p>
                    <div className="space-y-2 text-gray-700 dark:text-gray-300">
                      <div>
                        <p className="font-medium">{t('Mac:', 'Mac:')}</p>
                        <ol className="list-decimal list-inside ml-2">
                          <li>{t('Apple Music 앱에서 아티스트 페이지 열기', 'Open artist page in Apple Music app')}</li>
                          <li>{t('아티스트 이름 우클릭', 'Right-click artist name')}</li>
                          <li>{t('"Share" → "Copy Link" 선택', 'Select "Share" → "Copy Link"')}</li>
                          <li>{t('URL에서 ID 추출: music.apple.com/artist/artist-name/[이 숫자가 ID]', 
                            'Extract ID from URL: music.apple.com/artist/artist-name/[this number is the ID]')}</li>
                        </ol>
                      </div>
                      <div>
                        <p className="font-medium">{t('Windows:', 'Windows:')}</p>
                        <ol className="list-decimal list-inside ml-2">
                          <li>{t('웹브라우저에서 music.apple.com 접속', 'Go to music.apple.com in web browser')}</li>
                          <li>{t('아티스트 검색 후 페이지 열기', 'Search and open artist page')}</li>
                          <li>{t('URL에서 마지막 숫자가 ID', 'The last number in URL is the ID')}</li>
                        </ol>
                      </div>
                      <p className="text-xs italic">
                        {t('아티스트가 Apple Music에 없다면 비워두고 NEW 버튼을 클릭하세요.', 
                          'If artist is not on Apple Music, leave empty and click NEW button.')}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {errors.length > 0 && (
                <div className="text-sm text-red-600 dark:text-red-400">
                  {errors.map((err, idx) => <p key={idx}>{err}</p>)}
                </div>
              )}

              <button
                onClick={addArtist}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                {t('아티스트 추가', 'Add Artist')}
              </button>
            </div>
          </div>

          {/* Artist List */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                {t('등록된 아티스트', 'Registered Artists')}
              </h3>
              <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium">
                {artists.length}
              </span>
            </div>
            
            {artists.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 dark:bg-gray-900/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
                <Users className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">
                  {t('등록된 아티스트가 없습니다', 'No artists registered')}
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  {t('위에서 아티스트를 추가해주세요', 'Add artists above to get started')}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {artists.map((artist) => (
                  <div
                    key={artist.id}
                    className="group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:shadow-lg hover:border-purple-300 dark:hover:border-purple-600 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      {!albumLevel && (
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                          {getRoleIcon(artist.role)}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {artist.name}
                        </p>
                        {!albumLevel && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {getRoleLabel(artist.role)}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          {/* Spotify Status */}
                          {artist.spotifyId === 'MAKE_NEW' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 rounded-md text-xs font-medium">
                              <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                              Spotify: NEW
                            </span>
                          ) : artist.spotifyId ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-md text-xs font-medium">
                              <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                              Spotify ✓
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-md text-xs">
                              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                              Spotify -
                            </span>
                          )}
                          
                          {/* Apple Music Status */}
                          {artist.appleId === 'MAKE_NEW' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 rounded-md text-xs font-medium">
                              <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                              Apple: NEW
                            </span>
                          ) : artist.appleId ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-md text-xs font-medium">
                              <span className="w-1.5 h-1.5 bg-gray-500 rounded-full"></span>
                              Apple ✓
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-md text-xs">
                              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                              Apple -
                            </span>
                          )}
                        </div>
                        {artist.translations && Object.keys(artist.translations).length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {Object.entries(artist.translations).map(([lang, translation]) => (
                              <span 
                                key={lang} 
                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full text-xs"
                              >
                                <span className="font-medium text-gray-600 dark:text-gray-400">
                                  {lang.toUpperCase()}
                                </span>
                                <span className="text-gray-700 dark:text-gray-300">
                                  {translation}
                                </span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {!albumLevel && !isFeaturing && (
                        <select
                          value={artist.role}
                          onChange={(e) => updateArtistRole(artist.id, e.target.value as Artist['role'])}
                          className="text-sm px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-800"
                        >
                          <option value="featured">{t('피처링', 'Featured')}</option>
                          <option value="additional">{t('참여', 'Additional')}</option>
                        </select>
                      )}
                      <button
                        onClick={() => removeArtist(artist.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            {t('취소', 'Cancel')}
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            {t('저장', 'Save')}
          </button>
        </div>
      </div>
    </div>
  )
}