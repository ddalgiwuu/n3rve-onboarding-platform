import { useState, useEffect, useMemo } from 'react'
import { 
  Globe, Check, X, Search, ChevronDown, ChevronRight, 
  Minus, Plus, Info, AlertCircle, Filter, MapPin,
  Music, Settings
} from 'lucide-react'
import { useLanguageStore } from '@/store/language.store'
import territoriesData from '@/data/territories.json'

interface TerritorySelection {
  mode: 'worldwide' | 'include' | 'exclude'
  territories: string[] // country codes
}

interface DSPOverride {
  dspId: string
  mode: 'include' | 'exclude'
  territories: string[]
}

interface TerritorySelectorProps {
  value: {
    base: TerritorySelection
    dspOverrides: DSPOverride[]
  }
  onChange: (value: { base: TerritorySelection; dspOverrides: DSPOverride[] }) => void
}

export default function TerritorySelector({ value, onChange }: TerritorySelectorProps) {
  const { language } = useLanguageStore()
  const t = (ko: string, en: string) => language === 'ko' ? ko : en

  const [searchQuery, setSearchQuery] = useState('')
  const [expandedContinents, setExpandedContinents] = useState<string[]>([])
  const [showDSPOverrides, setShowDSPOverrides] = useState(false)
  const [activeDSP, setActiveDSP] = useState<string | null>(null)

  // Calculate total countries
  const totalCountries = useMemo(() => {
    return Object.values(territoriesData.continents).reduce(
      (total, continent) => total + continent.countries.length, 
      0
    )
  }, [])

  // Filter countries based on search
  const filteredContinents = useMemo(() => {
    if (!searchQuery) return territoriesData.continents

    const filtered: typeof territoriesData.continents = {}
    
    Object.entries(territoriesData.continents).forEach(([key, continent]) => {
      const matchingCountries = continent.countries.filter(country =>
        country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        country.code.toLowerCase().includes(searchQuery.toLowerCase())
      )
      
      if (matchingCountries.length > 0) {
        filtered[key] = {
          ...continent,
          countries: matchingCountries
        }
      }
    })
    
    return filtered
  }, [searchQuery])

  // Toggle mode
  const toggleMode = () => {
    const newMode = value.base.mode === 'worldwide' ? 'include' : 
                   value.base.mode === 'include' ? 'exclude' : 'worldwide'
    
    onChange({
      ...value,
      base: {
        mode: newMode,
        territories: newMode === 'worldwide' ? [] : value.base.territories
      }
    })
  }

  // Toggle country selection
  const toggleCountry = (countryCode: string) => {
    const isSelected = value.base.territories.includes(countryCode)
    const newTerritories = isSelected
      ? value.base.territories.filter(c => c !== countryCode)
      : [...value.base.territories, countryCode]
    
    onChange({
      ...value,
      base: {
        ...value.base,
        territories: newTerritories
      }
    })
  }

  // Toggle continent selection
  const toggleContinent = (continentKey: string) => {
    const continent = territoriesData.continents[continentKey as keyof typeof territoriesData.continents]
    const countryCodes = continent.countries.map(c => c.code)
    const allSelected = countryCodes.every(code => value.base.territories.includes(code))
    
    const newTerritories = allSelected
      ? value.base.territories.filter(c => !countryCodes.includes(c))
      : [...new Set([...value.base.territories, ...countryCodes])]
    
    onChange({
      ...value,
      base: {
        ...value.base,
        territories: newTerritories
      }
    })
  }

  // Get DSP override for a specific DSP
  const getDSPOverride = (dspId: string): DSPOverride | undefined => {
    return value.dspOverrides.find(override => override.dspId === dspId)
  }

  // Toggle DSP override
  const toggleDSPOverride = (dspId: string) => {
    const existingOverride = getDSPOverride(dspId)
    
    if (existingOverride) {
      // Remove override
      onChange({
        ...value,
        dspOverrides: value.dspOverrides.filter(o => o.dspId !== dspId)
      })
    } else {
      // Add override with default settings
      onChange({
        ...value,
        dspOverrides: [...value.dspOverrides, {
          dspId,
          mode: 'exclude',
          territories: []
        }]
      })
      setActiveDSP(dspId)
    }
  }

  // Update DSP override
  const updateDSPOverride = (dspId: string, updates: Partial<DSPOverride>) => {
    onChange({
      ...value,
      dspOverrides: value.dspOverrides.map(override =>
        override.dspId === dspId ? { ...override, ...updates } : override
      )
    })
  }

  // Calculate selected count for base selection
  const selectedCount = value.base.mode === 'worldwide' 
    ? totalCountries 
    : value.base.mode === 'include' 
      ? value.base.territories.length 
      : totalCountries - value.base.territories.length

  // Render DSP item helper function
  const renderDSPItem = (dsp: typeof territoriesData.dsps[0], compact = false) => {
    const override = getDSPOverride(dsp.id)
    const isActive = activeDSP === dsp.id

    return (
      <div 
        key={dsp.id}
        className={`border rounded-lg transition-all ${
          override 
            ? 'border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/10' 
            : 'border-gray-200 dark:border-gray-700'
        } ${compact ? 'p-3' : ''}`}
      >
        <div className={`flex items-center justify-between ${compact ? '' : 'p-4'}`}>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className={compact ? 'text-lg' : 'text-2xl'}>{dsp.icon}</span>
            <div className="min-w-0 flex-1">
              <h4 className={`font-medium truncate ${compact ? 'text-sm' : ''}`}>
                {dsp.name}
              </h4>
              {override && !compact && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {override.mode === 'exclude' 
                    ? t(`${override.territories.length}개국 제외`, `Excluding ${override.territories.length} countries`)
                    : t(`${override.territories.length}개국만 발매`, `Only ${override.territories.length} countries`)}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={() => {
              toggleDSPOverride(dsp.id)
              if (!override) setActiveDSP(dsp.id)
            }}
            className={`${compact ? 'px-2 py-1 text-xs' : 'px-4 py-2 text-sm'} rounded-lg font-medium transition-colors flex-shrink-0 ml-2 ${
              override
                ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50'
                : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/50'
            }`}
          >
            {override ? (compact ? t('제거', 'Remove') : t('설정 제거', 'Remove Override')) : (compact ? t('설정', 'Set') : t('개별 설정', 'Customize'))}
          </button>
        </div>

        {/* DSP Override Settings */}
        {override && isActive && !compact && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-4">
            {/* Mode Toggle */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">{t('모드:', 'Mode:')}</span>
              <button
                onClick={() => updateDSPOverride(dsp.id, { 
                  mode: override.mode === 'exclude' ? 'include' : 'exclude' 
                })}
                className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  override.mode === 'exclude'
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                    : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                }`}
              >
                {override.mode === 'exclude' ? <Minus className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                {override.mode === 'exclude' ? t('제외', 'Exclude') : t('포함만', 'Include Only')}
              </button>
            </div>

            {/* Quick Selection */}
            <div className="flex flex-wrap gap-2">
              {[
                { code: 'US', name: t('미국', 'USA') },
                { code: 'JP', name: t('일본', 'Japan') },
                { code: 'KR', name: t('한국', 'Korea') },
                { code: 'CN', name: t('중국', 'China') },
                { code: 'GB', name: t('영국', 'UK') },
                { code: 'DE', name: t('독일', 'Germany') }
              ].map(country => {
                const isSelected = override.territories.includes(country.code)
                
                return (
                  <button
                    key={country.code}
                    onClick={() => {
                      const newTerritories = isSelected
                        ? override.territories.filter(c => c !== country.code)
                        : [...override.territories, country.code]
                      updateDSPOverride(dsp.id, { territories: newTerritories })
                    }}
                    className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                      isSelected
                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-2 border-purple-300 dark:border-purple-700'
                        : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {country.name}
                  </button>
                )
              })}
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('더 많은 국가를 선택하려면 위의 전체 목록을 사용하세요.', 
                 'Use the full list above to select more countries.')}
            </p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
          <Globe className="w-5 h-5" />
          {t('발매 지역 설정', 'Release Territories')}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t('음원을 발매할 국가를 선택하세요. DSP별로 다른 설정도 가능합니다.', 
             'Select countries where you want to release your music. You can also set different territories per DSP.')}
        </p>
      </div>

      {/* Mode Selector */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleMode}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 border-2 border-purple-500 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
            >
              {value.base.mode === 'worldwide' && <Globe className="w-4 h-4 text-purple-600" />}
              {value.base.mode === 'include' && <Plus className="w-4 h-4 text-green-600" />}
              {value.base.mode === 'exclude' && <Minus className="w-4 h-4 text-red-600" />}
              <span className="font-medium">
                {value.base.mode === 'worldwide' && t('전세계', 'Worldwide')}
                {value.base.mode === 'include' && t('선택 국가만', 'Include Only')}
                {value.base.mode === 'exclude' && t('제외 국가', 'Exclude')}
              </span>
            </button>
            
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium text-purple-600 dark:text-purple-400">
                {selectedCount}
              </span>
              {t(`개국 선택됨 (총 ${totalCountries}개국)`, 
                 ` countries selected (${totalCountries} total)`)}
            </div>
          </div>

          {value.base.mode !== 'worldwide' && (
            <button
              onClick={() => onChange({ ...value, base: { ...value.base, territories: [] }})}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {t('선택 초기화', 'Clear Selection')}
            </button>
          )}
        </div>

        {/* Mode Description */}
        <div className="flex items-start gap-2 text-sm">
          <Info className="w-4 h-4 text-gray-400 mt-0.5" />
          <p className="text-gray-600 dark:text-gray-400">
            {value.base.mode === 'worldwide' && 
              t('모든 국가에서 음원이 발매됩니다.', 'Your music will be released in all countries.')}
            {value.base.mode === 'include' && 
              t('선택한 국가에서만 음원이 발매됩니다.', 'Your music will only be released in selected countries.')}
            {value.base.mode === 'exclude' && 
              t('선택한 국가를 제외한 모든 국가에서 발매됩니다.', 'Your music will be released worldwide except in selected countries.')}
          </p>
        </div>
      </div>

      {/* Country Selection */}
      {value.base.mode !== 'worldwide' && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          {/* Search */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('국가 검색...', 'Search countries...')}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700"
              />
            </div>
          </div>

          {/* Continents */}
          <div className="max-h-96 overflow-y-auto">
            {Object.entries(filteredContinents).map(([continentKey, continent]) => {
              const isExpanded = expandedContinents.includes(continentKey)
              const countryCodes = continent.countries.map(c => c.code)
              const selectedInContinent = countryCodes.filter(code => 
                value.base.territories.includes(code)
              ).length
              const allSelected = selectedInContinent === continent.countries.length

              return (
                <div key={continentKey} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                  {/* Continent Header */}
                  <div className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <button
                      onClick={() => setExpandedContinents(prev =>
                        isExpanded ? prev.filter(c => c !== continentKey) : [...prev, continentKey]
                      )}
                      className="flex items-center gap-2 flex-1"
                    >
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      <span className="font-medium">{continent.name}</span>
                      <span className="text-sm text-gray-500">
                        ({selectedInContinent}/{continent.countries.length})
                      </span>
                    </button>
                    
                    <button
                      onClick={() => toggleContinent(continentKey)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        allSelected
                          ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {allSelected ? t('전체 해제', 'Deselect All') : t('전체 선택', 'Select All')}
                    </button>
                  </div>

                  {/* Countries */}
                  {isExpanded && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-4 pt-0">
                      {continent.countries.map(country => {
                        const isSelected = value.base.territories.includes(country.code)
                        
                        return (
                          <button
                            key={country.code}
                            onClick={() => toggleCountry(country.code)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                              isSelected
                                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-2 border-purple-300 dark:border-purple-700'
                                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3" />}
                            <span className="text-xs opacity-60">{country.code}</span>
                            <span className="flex-1 text-left">{country.name}</span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* DSP Overrides */}
      <div>
        <button
          onClick={() => setShowDSPOverrides(!showDSPOverrides)}
          className="flex items-center gap-2 text-sm font-medium text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
        >
          <Settings className="w-4 h-4" />
          {t('DSP별 개별 설정', 'DSP-specific Settings')}
          {showDSPOverrides ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          {value.dspOverrides.length > 0 && (
            <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 rounded-full text-xs">
              {value.dspOverrides.length}
            </span>
          )}
        </button>

        {showDSPOverrides && (
          <div className="mt-4 space-y-6">
            {/* Popular DSPs */}
            <div>
              <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                {t('주요 DSP', 'Popular DSPs')}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {['spotify', 'apple_music', 'youtube_music', 'kakao_melon', 'naver_vibe', 'genie_music', 'bugs', 'dreamus_flo'].map(dspId => {
                  const dsp = territoriesData.dsps.find(d => d.id === dspId)
                  if (!dsp) return null
                  return renderDSPItem(dsp)
                })}
              </div>
            </div>

            {/* All Other DSPs */}
            <div>
              <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                {t('기타 DSP', 'Other DSPs')}
              </h4>
              <div className="max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-3">
                  {territoriesData.dsps
                    .filter(dsp => !['spotify', 'apple_music', 'youtube_music', 'kakao_melon', 'naver_vibe', 'genie_music', 'bugs', 'dreamus_flo'].includes(dsp.id))
                    .map(dsp => renderDSPItem(dsp, true))
                  }
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Summary */}
      {(value.base.mode !== 'worldwide' || value.dspOverrides.length > 0) && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="text-sm text-blue-700 dark:text-blue-300">
              <p className="font-medium mb-1">{t('발매 요약', 'Release Summary')}</p>
              <ul className="space-y-1 text-xs">
                <li>
                  {value.base.mode === 'worldwide' && t('• 기본: 전세계 발매', '• Base: Worldwide release')}
                  {value.base.mode === 'include' && t(`• 기본: ${value.base.territories.length}개국만 발매`, `• Base: ${value.base.territories.length} countries only`)}
                  {value.base.mode === 'exclude' && t(`• 기본: ${value.base.territories.length}개국 제외`, `• Base: Excluding ${value.base.territories.length} countries`)}
                </li>
                {value.dspOverrides.map(override => {
                  const dsp = territoriesData.dsps.find(d => d.id === override.dspId)
                  return (
                    <li key={override.dspId}>
                      • {dsp?.name}: {
                        override.mode === 'exclude' 
                          ? t(`${override.territories.length}개국 제외`, `Excluding ${override.territories.length} countries`)
                          : t(`${override.territories.length}개국만`, `${override.territories.length} countries only`)
                      }
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}