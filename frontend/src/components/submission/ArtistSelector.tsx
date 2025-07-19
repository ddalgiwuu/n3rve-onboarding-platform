import { useState, useEffect } from 'react'
import { Save, Plus, Search, ChevronDown, User, Globe, Music } from 'lucide-react'
import { useSavedArtistsStore } from '@/store/savedArtists.store'
import toast from 'react-hot-toast'

interface Props {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  label?: string
  required?: boolean
  language?: 'en' | 'ko'
  className?: string
}

export default function ArtistSelector({ 
  value, 
  onChange, 
  placeholder = 'Enter artist name',
  label,
  required = false,
  language = 'en',
  className = ''
}: Props) {
  const t = (ko: string, en: string) => language === 'ko' ? ko : en
  const savedArtistsStore = useSavedArtistsStore()
  const [showSavedArtists, setShowSavedArtists] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedArtistId, setSelectedArtistId] = useState<string | null>(null)
  const [isNewArtist, setIsNewArtist] = useState(false)
  const [showSaveOption, setShowSaveOption] = useState(false)

  // Load saved artists when dropdown opens
  useEffect(() => {
    if (showSavedArtists && savedArtistsStore.artists.length === 0) {
      savedArtistsStore.fetchArtists().catch(error => {
        console.error('Failed to fetch saved artists:', error)
        toast.error(t('저장된 아티스트를 불러오는데 실패했습니다', 'Failed to load saved artists'))
      })
    }
  }, [showSavedArtists])

  // Check if current value matches any saved artist
  useEffect(() => {
    if (value && savedArtistsStore.artists.length > 0) {
      const matchingArtist = savedArtistsStore.artists.find(
        artist => artist.name.toLowerCase() === value.toLowerCase()
      )
      if (matchingArtist) {
        setSelectedArtistId(matchingArtist.id)
        setIsNewArtist(false)
        setShowSaveOption(false)
      } else {
        setSelectedArtistId(null)
        setIsNewArtist(true)
        setShowSaveOption(true)
      }
    } else {
      setSelectedArtistId(null)
      setIsNewArtist(false)
      setShowSaveOption(false)
    }
  }, [value, savedArtistsStore.artists])

  const selectSavedArtist = (artist: any) => {
    onChange(artist.name)
    setSelectedArtistId(artist.id)
    setIsNewArtist(false)
    setShowSaveOption(false)
    setShowSavedArtists(false)
    setSearchQuery('')
    
    // Update usage count
    savedArtistsStore.useArtist(artist.id).catch(error => {
      console.error('Failed to update usage count:', error)
    })
    
    toast.success(t('저장된 아티스트가 선택되었습니다', 'Saved artist selected'))
  }

  const saveCurrentArtist = async () => {
    if (!value.trim()) {
      toast.error(t('아티스트 이름을 입력해주세요', 'Please enter artist name'))
      return
    }

    try {
      const newArtist = await savedArtistsStore.addArtist({
        name: value,
        translations: [],
        identifiers: []
      })
      
      toast.success(t('아티스트가 저장되었습니다', 'Artist saved successfully'))
      setSelectedArtistId(newArtist.id)
      setIsNewArtist(false)
      setShowSaveOption(false)
    } catch (error) {
      console.error('Failed to save artist:', error)
      toast.error(t('아티스트 저장에 실패했습니다', 'Failed to save artist'))
    }
  }

  const filteredArtists = savedArtistsStore.searchArtists(searchQuery)

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <div className="relative">
        {/* Main input */}
        <div className="relative">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full px-4 py-3 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-n3rve-accent focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          
          {/* Status indicator */}
          {value && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {selectedArtistId ? (
                <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                  <Save className="w-4 h-4" />
                  <span className="text-xs">{t('저장됨', 'Saved')}</span>
                </div>
              ) : isNewArtist ? (
                <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                  <Plus className="w-4 h-4" />
                  <span className="text-xs">{t('신규', 'New')}</span>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Save artist option */}
        {showSaveOption && value && !selectedArtistId && (
          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <button
              onClick={saveCurrentArtist}
              className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
            >
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <Save className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-white">
                  {t('이 아티스트 저장하기', 'Save this artist')}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {t('나중에 재사용할 수 있습니다', 'You can reuse it later')}
                </div>
              </div>
            </button>
          </div>
        )}

        {/* Saved artists dropdown */}
        <button
          type="button"
          onClick={() => setShowSavedArtists(!showSavedArtists)}
          className="mt-2 w-full flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/20 rounded">
              <Music className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-left">
              <div className="font-medium text-gray-900 dark:text-white text-sm">
                {t('저장된 아티스트에서 선택', 'Select from saved artists')}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {savedArtistsStore.artists.length}{t('개 저장됨', ' saved')}
              </div>
            </div>
          </div>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showSavedArtists ? 'rotate-180' : ''}`} />
        </button>

        {/* Saved artists list */}
        {showSavedArtists && (
          <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Search */}
            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder={t('아티스트 검색...', 'Search artists...')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-sm"
                />
              </div>
            </div>

            {/* Artists list */}
            <div className="max-h-60 overflow-y-auto">
              {savedArtistsStore.loading ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  {t('불러오는 중...', 'Loading...')}
                </div>
              ) : filteredArtists.length === 0 ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  {searchQuery 
                    ? t('검색 결과가 없습니다', 'No results found')
                    : t('저장된 아티스트가 없습니다', 'No saved artists')
                  }
                </div>
              ) : (
                filteredArtists.map((artist) => (
                  <button
                    key={artist.id}
                    onClick={() => selectSavedArtist(artist)}
                    className="w-full p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors text-left"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {artist.name}
                        </div>
                        {artist.translations.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {artist.translations.map((trans: any, idx: number) => (
                              <span key={idx} className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded text-xs">
                                <Globe className="w-3 h-3" />
                                {trans.language.toUpperCase()}: {trans.name}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {t('사용 횟수', 'Used')}: {artist.usageCount}
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}