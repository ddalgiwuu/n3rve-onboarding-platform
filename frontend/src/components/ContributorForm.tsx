import { useState, useEffect, useRef } from 'react'
import { 
  X, Plus, Trash2, Search, Music, User, Globe, 
  Info, Link as LinkIcon, ChevronDown, ChevronUp,
  Check, AlertCircle, ExternalLink
} from 'lucide-react'
import { useLanguageStore } from '@/store/language.store'
import useSafeStore from '@/hooks/useSafeStore'
import contributorRolesData from '@/data/contributorRoles.json'
import contributorRolesKo from '@/data/contributorRolesKo.json'
import instrumentsData from '@/data/instruments.json'
import instrumentsKo from '@/data/instrumentsKo.json'
import { v4 as uuidv4 } from 'uuid'

interface Translation {
  id: string
  language: string
  name: string
}

interface PlatformIdentifier {
  type: 'spotify' | 'apple'
  value: string
  url?: string
}

interface Contributor {
  id: string
  name: string
  translations: Translation[]
  roles: string[]
  instruments: string[]
  identifiers: PlatformIdentifier[]
  isNewArtist: boolean
}

interface ContributorFormProps {
  contributor?: Contributor
  onSave: (contributor: Contributor) => void
  onCancel: () => void
  trackId?: string
  isArtist?: boolean
}

// Platform identifier types with descriptions
const identifierTypes = {
  spotify: {
    name: 'Spotify',
    placeholder: 'spotify:artist:XXXXXX',
    helpText: {
      ko: 'Mac: Spotify 앱에서 아티스트 → ⋮ → Option키 누르고 "Spotify URI 복사" 클릭\nWindows: Spotify 앱에서 아티스트 → ⋮ → Ctrl키 누르고 "Spotify URI 복사" 클릭',
      en: 'Mac: In Spotify app: Artist → ⋮ → Hold Option key → Click "Copy Spotify URI"\nWindows: In Spotify app: Artist → ⋮ → Hold Ctrl key → Click "Copy Spotify URI"'
    },
    pattern: /^spotify:artist:[a-zA-Z0-9]+$/,
    icon: '🎵'
  },
  apple: {
    name: 'Apple Music',
    placeholder: '1234567890 (숫자만)',
    helpText: {
      ko: 'Apple Music에서 아티스트 페이지 → 공유 → 링크 복사 → URL 마지막 숫자만 입력\n예: https://music.apple.com/kr/artist/bts/883131348 → 883131348',
      en: 'In Apple Music: Artist page → Share → Copy Link → Enter only the numbers at the end\nExample: https://music.apple.com/us/artist/bts/883131348 → 883131348'
    },
    pattern: /^[0-9]+$/,
    icon: '🎵'
  }
}

export default function ContributorForm({ contributor, onSave, onCancel }: ContributorFormProps) {
  const language = useSafeStore(useLanguageStore, (state) => state.language)
  const t = (ko: string, en: string) => language === 'ko' ? ko : en

  const [formData, setFormData] = useState<Contributor>({
    id: contributor?.id || uuidv4(),
    name: contributor?.name || '',
    translations: contributor?.translations || [],
    roles: contributor?.roles || [],
    instruments: contributor?.instruments || [],
    identifiers: contributor?.identifiers || [
      { type: 'spotify', value: '' },
      { type: 'apple', value: '' }
    ],
    isNewArtist: contributor?.isNewArtist || false
  })

  const [searchQuery, setSearchQuery] = useState({ roles: '', instruments: '' })
  const [showDropdown, setShowDropdown] = useState({ roles: false, instruments: false })
  
  const rolesRef = useRef<HTMLDivElement>(null)
  const instrumentsRef = useRef<HTMLDivElement>(null)

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (rolesRef.current && !rolesRef.current.contains(event.target as Node)) {
        setShowDropdown(prev => ({ ...prev, roles: false }))
      }
      if (instrumentsRef.current && !instrumentsRef.current.contains(event.target as Node)) {
        setShowDropdown(prev => ({ ...prev, instruments: false }))
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filter roles and instruments based on search
  const filteredRoles = contributorRolesData.roles.filter(role => {
    const searchTerm = (searchQuery.roles || '').toLowerCase()
    const roleName = (role.name || '').toLowerCase()
    const roleCategory = (role.category || '').toLowerCase()
    return roleName.includes(searchTerm) || roleCategory.includes(searchTerm)
  })

  const filteredInstruments = instrumentsData.instruments.filter(instrument => {
    const searchTerm = (searchQuery.instruments || '').toLowerCase()
    const instrumentName = (instrument.name || '').toLowerCase()
    const instrumentCategory = (instrument.category || '').toLowerCase()
    return instrumentName.includes(searchTerm) || instrumentCategory.includes(searchTerm)
  })

  // Group by category
  const groupedRoles = filteredRoles.reduce((acc, role) => {
    if (!acc[role.category]) acc[role.category] = []
    acc[role.category].push(role)
    return acc
  }, {} as Record<string, typeof contributorRolesData.roles>)

  const groupedInstruments = filteredInstruments.reduce((acc, instrument) => {
    if (!acc[instrument.category]) acc[instrument.category] = []
    acc[instrument.category].push(instrument)
    return acc
  }, {} as Record<string, typeof instrumentsData.instruments>)

  // Add/remove translations
  const addTranslation = () => {
    setFormData(prev => ({
      ...prev,
      translations: [...prev.translations, { id: uuidv4(), language: '', name: '' }]
    }))
  }

  const updateTranslation = (id: string, field: 'language' | 'name', value: string) => {
    setFormData(prev => ({
      ...prev,
      translations: prev.translations.map(t =>
        t.id === id ? { ...t, [field]: value } : t
      )
    }))
  }

  const removeTranslation = (id: string) => {
    setFormData(prev => ({
      ...prev,
      translations: prev.translations.filter(t => t.id !== id)
    }))
  }

  // Update identifier value
  const updateIdentifier = (index: number, value: string) => {
    if (index === -1) {
      // If identifier doesn't exist yet, we need to handle it differently
      return
    }
    setFormData(prev => ({
      ...prev,
      identifiers: prev.identifiers.map((id, i) =>
        i === index ? { ...id, value } : id
      )
    }))
  }

  // Toggle role/instrument selection
  const toggleRole = (roleId: string) => {
    setFormData(prev => ({
      ...prev,
      roles: prev.roles.includes(roleId)
        ? prev.roles.filter(r => r !== roleId)
        : [...prev.roles, roleId]
    }))
  }

  const toggleInstrument = (instrumentId: string) => {
    setFormData(prev => ({
      ...prev,
      instruments: prev.instruments.includes(instrumentId)
        ? prev.instruments.filter(i => i !== instrumentId)
        : [...prev.instruments, instrumentId]
    }))
  }

  // Validate identifiers
  const validateIdentifier = (type: keyof typeof identifierTypes, value: string): boolean => {
    const config = identifierTypes[type]
    return config.pattern.test(value)
  }

  // Platform URL helper
  const getPlatformUrl = (identifier: PlatformIdentifier): string | null => {
    switch (identifier.type) {
      case 'spotify':
        if (identifier.value) {
          const spotifyId = identifier.value.replace('spotify:artist:', '')
          return `https://open.spotify.com/artist/${spotifyId}`
        }
        return 'https://open.spotify.com/search'
      case 'apple':
        if (identifier.value && /^[0-9]+$/.test(identifier.value)) {
          return `https://music.apple.com/artist/${identifier.value}`
        }
        return 'https://music.apple.com/search'
      default:
        return null
    }
  }

  // Save handler
  const handleSave = () => {
    if (!formData.name.trim()) {
      alert(t('기여자 이름을 입력해주세요', 'Please enter the contributor name'))
      return
    }

    if (formData.roles.length === 0) {
      alert(t('최소 하나의 역할을 선택해주세요', 'Please select at least one role'))
      return
    }

    // Validate identifiers
    const invalidIdentifiers = formData.identifiers.filter((id) => 
      id.value && !validateIdentifier(id.type as keyof typeof identifierTypes, id.value)
    )

    if (invalidIdentifiers.length > 0) {
      alert(t('올바르지 않은 식별자가 있습니다', 'There are invalid identifiers'))
      return
    }

    onSave(formData)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <User className="w-5 h-5" />
              {contributor ? t('기여자 수정', 'Edit Contributor') : t('기여자 추가', 'Add Contributor')}
            </h3>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-6">
          <div className="space-y-6">
            {/* Basic Info */}
            <div>
              <h4 className="font-medium mb-4 flex items-center gap-2">
                <User className="w-4 h-4" />
                {t('기본 정보', 'Basic Information')}
              </h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t('이름', 'Name')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700"
                    placeholder={t('아티스트/기여자 이름', 'Artist/Contributor Name')}
                  />
                  
                  {/* Spotify Full Name Policy Alert */}
                  {(formData.roles.includes('composer') || 
                    formData.roles.includes('lyricist') || 
                    formData.roles.includes('songwriter') ||
                    formData.roles.includes('writer')) && (
                    <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                        <div className="text-xs text-yellow-800 dark:text-yellow-200">
                          <p className="font-medium mb-1">
                            {t('Spotify 정책 안내', 'Spotify Policy Notice')}
                          </p>
                          <p>
                            {t(
                              '작곡가, 작사가의 경우 반드시 전체 이름(Full Name)을 입력해야 합니다. 예명이나 약어는 사용할 수 없습니다.',
                              'Composers and lyricists must use their full legal names. Stage names or abbreviations are not allowed.'
                            )}
                          </p>
                          <p className="mt-1 text-yellow-700 dark:text-yellow-300">
                            {t('예: ❌ JD, DJ Kim → ✅ John Doe, Kim Minsu', 'Example: ❌ JD, DJ Kim → ✅ John Doe, Kim Minsu')}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* New Artist Toggle - Improved UI */}
                <div className={`border-2 ${formData.isNewArtist ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/20' : 'border-gray-200 dark:border-gray-700'} rounded-lg p-4 transition-all`}>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isNewArtist}
                      onChange={(e) => setFormData(prev => ({ ...prev, isNewArtist: e.target.checked }))}
                      className="mt-0.5 w-5 h-5 rounded border-2 text-orange-500 focus:ring-orange-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-base">{t('신규 아티스트', 'New Artist')}</span>
                        {formData.isNewArtist && (
                          <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-800/30 text-orange-700 dark:text-orange-300 text-xs rounded-full font-medium">
                            {t('활성화됨', 'ACTIVE')}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {formData.isNewArtist ? (
                          <>
                            <span className="text-orange-600 dark:text-orange-400 font-medium">
                              {t('⚠️ 새로운 아티스트 페이지가 생성됩니다', '⚠️ A new artist page will be created')}
                            </span>
                            <br />
                            {t('각 플랫폼(Spotify, Apple Music 등)에 새 아티스트 프로필이 만들어집니다.', 'New artist profiles will be created on each platform (Spotify, Apple Music, etc.).')}
                          </>
                        ) : (
                          t('기존 아티스트와 연결하려면 체크하지 마세요', 'Leave unchecked to link with existing artist')
                        )}
                      </p>
                    </div>
                  </label>
                </div>

                {/* Translations */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      {t('다국어 이름', 'Multilingual Names')}
                    </label>
                    <button
                      onClick={addTranslation}
                      className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      {t('번역 추가', 'Add Translation')}
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    {formData.translations.map(translation => (
                      <div key={translation.id} className="flex gap-2">
                        <select
                          value={translation.language}
                          onChange={(e) => updateTranslation(translation.id, 'language', e.target.value)}
                          className="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
                        >
                          <option value="">{t('언어', 'Language')}</option>
                          <option value="en">English</option>
                          <option value="ja">日本語</option>
                          <option value="zh-CN">中文(简体)</option>
                          <option value="zh-TW">中文(繁體)</option>
                          <option value="es">Español</option>
                          <option value="fr">Français</option>
                        </select>
                        <input
                          type="text"
                          value={translation.name}
                          onChange={(e) => updateTranslation(translation.id, 'name', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
                          placeholder={t('번역된 이름', 'Translated Name')}
                        />
                        <button
                          onClick={() => removeTranslation(translation.id)}
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Roles */}
            <div>
              <h4 className="font-medium mb-4 flex items-center gap-2">
                <User className="w-4 h-4" />
                {t('역할', 'Role')} <span className="text-red-500">*</span>
              </h4>
              
              {/* Selected Roles */}
              {formData.roles.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {formData.roles.map(roleId => {
                    const role = contributorRolesData.roles.find(r => r.id === roleId)
                    return role ? (
                      <span
                        key={roleId}
                        className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg text-sm flex items-center gap-1"
                      >
                        {role.name}
                        <button
                          onClick={() => toggleRole(roleId)}
                          className="ml-1 hover:text-purple-900 dark:hover:text-purple-100"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ) : null
                  })}
                </div>
              )}

              {/* Role Search */}
              <div className="relative" ref={rolesRef}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery.roles}
                    onChange={(e) => {
                      setSearchQuery(prev => ({ ...prev, roles: e.target.value }))
                      // Auto-open dropdown when typing
                      if (e.target.value.length > 0) {
                        setShowDropdown(prev => ({ ...prev, roles: true }))
                      }
                    }}
                    onFocus={() => setShowDropdown(prev => ({ ...prev, roles: true }))}
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700"
                    placeholder={t('역할 검색 (예: Producer, Composer)', 'Search roles (e.g., Producer, Composer)')}
                  />
                  <button
                    onClick={() => setShowDropdown(prev => ({ ...prev, roles: !prev.roles }))}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    {showDropdown.roles ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                {/* Search Results Count */}
                {searchQuery.roles && (
                  <div className="absolute right-12 top-1/2 transform -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400">
                    {filteredRoles.length} {t('개 결과', 'results')}
                  </div>
                )}

                {/* Role Dropdown */}
                {showDropdown.roles && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {Object.entries(groupedRoles).map(([category, roles]) => (
                      <div key={category}>
                        <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50">
                          {category}
                        </div>
                        {roles.map(role => (
                          <button
                            key={role.id}
                            onClick={() => toggleRole(role.id)}
                            className="w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between"
                          >
                            <span className="text-sm">
                              {role.name}
                              {contributorRolesKo.translations[role.id] && (
                                <span className="text-gray-500 dark:text-gray-400 ml-1">
                                  ({contributorRolesKo.translations[role.id]})
                                </span>
                              )}
                            </span>
                            {formData.roles.includes(role.id) && (
                              <Check className="w-4 h-4 text-purple-500" />
                            )}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Instruments */}
            <div>
              <h4 className="font-medium mb-4 flex items-center gap-2">
                <Music className="w-4 h-4" />
                {t('악기', 'Instruments')}
              </h4>
              
              {/* Selected Instruments */}
              {formData.instruments.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {formData.instruments.map(instrumentId => {
                    const instrument = instrumentsData.instruments.find(i => i.id === instrumentId)
                    return instrument ? (
                      <span
                        key={instrumentId}
                        className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm flex items-center gap-1"
                      >
                        {instrument.name}
                        <button
                          onClick={() => toggleInstrument(instrumentId)}
                          className="ml-1 hover:text-blue-900 dark:hover:text-blue-100"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ) : null
                  })}
                </div>
              )}

              {/* Instrument Search */}
              <div className="relative" ref={instrumentsRef}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery.instruments}
                    onChange={(e) => {
                      setSearchQuery(prev => ({ ...prev, instruments: e.target.value }))
                      // Auto-open dropdown when typing
                      if (e.target.value.length > 0) {
                        setShowDropdown(prev => ({ ...prev, instruments: true }))
                      }
                    }}
                    onFocus={() => setShowDropdown(prev => ({ ...prev, instruments: true }))}
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700"
                    placeholder={t('악기 검색 (예: Guitar, Piano)', 'Search instruments (e.g., Guitar, Piano)')}
                  />
                  <button
                    onClick={() => setShowDropdown(prev => ({ ...prev, instruments: !prev.instruments }))}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    {showDropdown.instruments ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                {/* Search Results Count */}
                {searchQuery.instruments && (
                  <div className="absolute right-12 top-1/2 transform -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400">
                    {filteredInstruments.length} {t('개 결과', 'results')}
                  </div>
                )}

                {/* Instrument Dropdown */}
                {showDropdown.instruments && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {Object.entries(groupedInstruments).map(([category, instruments]) => (
                      <div key={category}>
                        <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50">
                          {category}
                        </div>
                        {instruments.map(instrument => (
                          <button
                            key={instrument.id}
                            onClick={() => toggleInstrument(instrument.id)}
                            className="w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between"
                          >
                            <span className="text-sm">
                              {instrument.name}
                              {instrumentsKo.translations[instrument.id] && (
                                <span className="text-gray-500 dark:text-gray-400 ml-1">
                                  ({instrumentsKo.translations[instrument.id]})
                                </span>
                              )}
                            </span>
                            {formData.instruments.includes(instrument.id) && (
                              <Check className="w-4 h-4 text-blue-500" />
                            )}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Platform Identifiers */}
            <div>
              <h4 className="font-medium mb-4 flex items-center gap-2">
                <LinkIcon className="w-4 h-4" />
                {t('플랫폼 연동', 'Platform Integration')}
              </h4>

              {/* Platform fields - Always show Spotify and Apple Music */}
              <div className="space-y-4">
                {['spotify', 'apple'].map((platformType) => {
                  const identifier = formData.identifiers.find(id => id.type === platformType) || { type: platformType, value: '' }
                  const index = formData.identifiers.findIndex(id => id.type === platformType)
                  const config = identifierTypes[platformType as keyof typeof identifierTypes]
                  const isValid = identifier.value ? validateIdentifier(platformType as keyof typeof identifierTypes, identifier.value) : true
                  const platformUrl = getPlatformUrl(identifier as PlatformIdentifier)

                  return (
                    <div key={platformType} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-medium flex items-center gap-2">
                          <span className="text-xl">{config.icon}</span>
                          {config.name}
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {t('(필수)', '(Required)')}
                          </span>
                        </h5>
                      </div>

                      <div className="space-y-3">
                        <div className="relative">
                          <input
                            type="text"
                            value={identifier.value}
                            onChange={(e) => updateIdentifier(index, e.target.value)}
                            disabled={formData.isNewArtist}
                            className={`w-full px-4 py-3 border-2 rounded-lg dark:bg-gray-700 font-mono text-sm ${
                              !isValid ? 'border-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600 focus:border-purple-500'
                            } focus:outline-none focus:ring-2 focus:ring-purple-500/20 ${
                              formData.isNewArtist ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800' : ''
                            }`}
                            placeholder={formData.isNewArtist ? t('신규 아티스트는 입력 불가', 'Not available for new artists') : config.placeholder}
                          />
                          {identifier.value && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                              {isValid ? (
                                <Check className="w-5 h-5 text-green-500" />
                              ) : (
                                <AlertCircle className="w-5 h-5 text-red-500" />
                              )}
                            </div>
                          )}
                        </div>

                        {/* Help text with better formatting */}
                        <div className="bg-gray-100 dark:bg-gray-700/50 rounded-lg p-3">
                          <div className="flex items-start gap-2">
                            <Info className="w-4 h-4 mt-0.5 text-gray-500 flex-shrink-0" />
                            <div className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-line">
                              {config.helpText[language as 'ko' | 'en']}
                            </div>
                          </div>
                        </div>

                        {/* Page Check Button */}
                        <a
                          href={formData.isNewArtist ? '#' : (platformUrl || '#')}
                          target={formData.isNewArtist ? '_self' : '_blank'}
                          rel="noopener noreferrer"
                          onClick={formData.isNewArtist ? (e) => e.preventDefault() : undefined}
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            formData.isNewArtist 
                              ? 'bg-gray-400 cursor-not-allowed text-gray-200' 
                              : 'bg-purple-600 hover:bg-purple-700 text-white'
                          }`}
                        >
                          <ExternalLink className="w-4 h-4" />
                          {t('페이지 확인', 'Check Page')}
                          {!identifier.value && (
                            <span className="text-xs opacity-75">
                              {t('(검색 페이지로 이동)', '(Opens search)')}
                            </span>
                          )}
                        </a>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Make New info */}
              {formData.isNewArtist && (
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div className="text-sm text-blue-700 dark:text-blue-300">
                      <p className="font-medium mb-1">{t('신규 아티스트 안내', 'New Artist Guide')}</p>
                      <ul className="space-y-1 text-xs">
                        <li>• {t('각 플랫폼에 새로운 아티스트 페이지가 생성됩니다', 'A new artist page will be created on each platform')}</li>
                        <li>• {t('기존 아티스트와 연결하려면 위의 식별자를 입력하세요', 'To connect with existing artists, enter the identifiers above')}</li>
                        <li>• {t('생성 후 약 24-48시간 내 플랫폼에 반영됩니다', 'It will be reflected on platforms within 24-48 hours after creation')}</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              {t('취소', 'Cancel')}
            </button>
            <button
              onClick={handleSave}
              disabled={!formData.name || formData.roles.length === 0}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {contributor ? t('수정', 'Edit') : t('추가', 'Add')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}