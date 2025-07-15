import { useState, useEffect } from 'react'
import { 
  X, Plus, Trash2, Search, Music, User, Globe, 
  Info, Link as LinkIcon, ChevronDown, ChevronUp,
  Check, AlertCircle, ExternalLink, Loader2
} from 'lucide-react'
import { useLanguageStore } from '@/store/language.store'
import contributorRolesData from '@/data/contributorRoles.json'
import instrumentsData from '@/data/instruments.json'
import { v4 as uuidv4 } from 'uuid'

interface Translation {
  id: string
  language: string
  name: string
}

interface PlatformIdentifier {
  type: 'spotify' | 'apple' | 'youtube' | 'isni' | 'ipi' | 'custom'
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
      ko: 'Spotify 앱에서 아티스트 → ⋮ → 공유 → Spotify URI 복사',
      en: 'In Spotify app: Artist → ⋮ → Share → Copy Spotify URI'
    },
    pattern: /^spotify:artist:[a-zA-Z0-9]+$/,
    icon: '🎵'
  },
  apple: {
    name: 'Apple Music',
    placeholder: 'https://music.apple.com/artist/XXXXXX',
    helpText: {
      ko: 'Apple Music에서 아티스트 페이지 → 공유 → 링크 복사',
      en: 'In Apple Music: Artist page → Share → Copy Link'
    },
    pattern: /^https:\/\/music\.apple\.com\/.+\/artist\/.+$/,
    icon: '🎵'
  },
  youtube: {
    name: 'YouTube',
    placeholder: '@channelname or UC...',
    helpText: {
      ko: 'YouTube 채널 핸들(@username) 또는 채널 ID',
      en: 'YouTube channel handle (@username) or channel ID'
    },
    pattern: /^(@[a-zA-Z0-9_-]+|UC[a-zA-Z0-9_-]{22})$/,
    icon: '📺'
  },
  isni: {
    name: 'ISNI',
    placeholder: '0000 0000 0000 0000',
    helpText: {
      ko: '국제 표준 명칭 식별자 (16자리 숫자)',
      en: 'International Standard Name Identifier (16 digits)'
    },
    pattern: /^[0-9]{4}\s?[0-9]{4}\s?[0-9]{4}\s?[0-9]{4}$/,
    icon: '🔢'
  },
  ipi: {
    name: 'IPI',
    placeholder: '00000000000',
    helpText: {
      ko: '저작권 관리 단체 회원 번호 (11자리)',
      en: 'Performing rights organization member number (11 digits)'
    },
    pattern: /^[0-9]{11}$/,
    icon: '©️'
  }
}

export default function ContributorForm({ contributor, onSave, onCancel, trackId }: ContributorFormProps) {
  const language = useLanguageStore(state => state.language)
  const t = (ko: string, en: string) => language === 'ko' ? ko : en

  const [formData, setFormData] = useState<Contributor>({
    id: contributor?.id || uuidv4(),
    name: contributor?.name || '',
    translations: contributor?.translations || [],
    roles: contributor?.roles || [],
    instruments: contributor?.instruments || [],
    identifiers: contributor?.identifiers || [],
    isNewArtist: contributor?.isNewArtist || false
  })

  const [searchQuery, setSearchQuery] = useState({ roles: '', instruments: '' })
  const [showDropdown, setShowDropdown] = useState({ roles: false, instruments: false })
  const [showIdentifierHelp, setShowIdentifierHelp] = useState<string | null>(null)
  const [isValidating, setIsValidating] = useState(false)

  // Filter roles and instruments based on search
  const filteredRoles = contributorRolesData.roles.filter(role =>
    role.name.toLowerCase().includes(searchQuery.roles.toLowerCase()) ||
    role.category.toLowerCase().includes(searchQuery.roles.toLowerCase())
  )

  const filteredInstruments = instrumentsData.instruments.filter(instrument =>
    instrument.name.toLowerCase().includes(searchQuery.instruments.toLowerCase()) ||
    instrument.category.toLowerCase().includes(searchQuery.instruments.toLowerCase())
  )

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

  // Add/remove identifiers
  const addIdentifier = (type: keyof typeof identifierTypes) => {
    setFormData(prev => ({
      ...prev,
      identifiers: [...prev.identifiers, { type, value: '' }]
    }))
  }

  const updateIdentifier = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      identifiers: prev.identifiers.map((id, i) =>
        i === index ? { ...id, value } : id
      )
    }))
  }

  const removeIdentifier = (index: number) => {
    setFormData(prev => ({
      ...prev,
      identifiers: prev.identifiers.filter((_, i) => i !== index)
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
        const spotifyId = identifier.value.replace('spotify:artist:', '')
        return `https://open.spotify.com/artist/${spotifyId}`
      case 'apple':
        return identifier.value
      case 'youtube':
        const channelId = identifier.value.startsWith('@') 
          ? identifier.value 
          : `channel/${identifier.value}`
        return `https://youtube.com/${channelId}`
      default:
        return null
    }
  }

  // Save handler
  const handleSave = () => {
    if (!formData.name.trim()) {
      alert(t('기여자 이름을 입력해주세요', 'Please enter contributor name'))
      return
    }

    if (formData.roles.length === 0) {
      alert(t('최소 하나의 역할을 선택해주세요', 'Please select at least one role'))
      return
    }

    // Validate identifiers
    const invalidIdentifiers = formData.identifiers.filter((id, index) => 
      id.value && !validateIdentifier(id.type as keyof typeof identifierTypes, id.value)
    )

    if (invalidIdentifiers.length > 0) {
      alert(t('올바르지 않은 식별자가 있습니다', 'Some identifiers are invalid'))
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
                    placeholder={t('아티스트/기여자 이름', 'Artist/Contributor name')}
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

                {/* New Artist Toggle */}
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isNewArtist}
                      onChange={(e) => setFormData(prev => ({ ...prev, isNewArtist: e.target.checked }))}
                      className="rounded text-purple-500"
                    />
                    <span className="text-sm">{t('신규 아티스트', 'New Artist')}</span>
                  </label>
                  {formData.isNewArtist && (
                    <span className="text-xs text-orange-600 dark:text-orange-400">
                      {t('플랫폼에 새 아티스트 페이지가 생성됩니다', 'New artist pages will be created on platforms')}
                    </span>
                  )}
                </div>

                {/* Translations */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      {t('다국어 이름', 'Translations')}
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
                          placeholder={t('번역된 이름', 'Translated name')}
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
                {t('역할', 'Roles')} <span className="text-red-500">*</span>
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
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery.roles}
                    onChange={(e) => setSearchQuery(prev => ({ ...prev, roles: e.target.value }))}
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
                            <span className="text-sm">{role.name}</span>
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
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery.instruments}
                    onChange={(e) => setSearchQuery(prev => ({ ...prev, instruments: e.target.value }))}
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
                            <span className="text-sm">{instrument.name}</span>
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

              {/* Platform buttons */}
              <div className="flex flex-wrap gap-2 mb-4">
                {Object.entries(identifierTypes).map(([type, config]) => {
                  const hasIdentifier = formData.identifiers.some(id => id.type === type)
                  return (
                    <button
                      key={type}
                      onClick={() => !hasIdentifier && addIdentifier(type as keyof typeof identifierTypes)}
                      disabled={hasIdentifier}
                      className={`px-4 py-2 rounded-lg border ${
                        hasIdentifier
                          ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                          : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <span className="mr-2">{config.icon}</span>
                      {config.name}
                    </button>
                  )
                })}
              </div>

              {/* Identifier inputs */}
              <div className="space-y-3">
                {formData.identifiers.map((identifier, index) => {
                  const config = identifierTypes[identifier.type]
                  const isValid = identifier.value ? validateIdentifier(identifier.type as keyof typeof identifierTypes, identifier.value) : true
                  const platformUrl = getPlatformUrl(identifier)

                  return (
                    <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium flex items-center gap-2">
                          <span>{config.icon}</span>
                          {config.name}
                        </h5>
                        <button
                          onClick={() => removeIdentifier(index)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-2">
                        <div className="relative">
                          <input
                            type="text"
                            value={identifier.value}
                            onChange={(e) => updateIdentifier(index, e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg dark:bg-gray-700 ${
                              !isValid ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                            }`}
                            placeholder={config.placeholder}
                          />
                          {identifier.value && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                              {isValid ? (
                                <Check className="w-4 h-4 text-green-500" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-red-500" />
                              )}
                            </div>
                          )}
                        </div>

                        {/* Help text */}
                        <div className="flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <Info className="w-3 h-3 mt-0.5" />
                          <span>{config.helpText[language as 'ko' | 'en']}</span>
                        </div>

                        {/* Platform link */}
                        {platformUrl && isValid && (
                          <a
                            href={platformUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                          >
                            {t('페이지 확인', 'View page')}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
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
                      <p className="font-medium mb-1">{t('신규 아티스트 안내', 'New Artist Information')}</p>
                      <ul className="space-y-1 text-xs">
                        <li>• {t('각 플랫폼에 새로운 아티스트 페이지가 생성됩니다', 'New artist pages will be created on each platform')}</li>
                        <li>• {t('기존 아티스트와 연결하려면 위의 식별자를 입력하세요', 'To link to existing artist, enter identifiers above')}</li>
                        <li>• {t('생성 후 약 24-48시간 내 플랫폼에 반영됩니다', 'Pages will appear on platforms within 24-48 hours')}</li>
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
              {contributor ? t('수정', 'Update') : t('추가', 'Add')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}