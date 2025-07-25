import { useState, useMemo, useCallback } from 'react'
import { 
  Globe, Check, X, Search, ChevronDown, ChevronRight, ChevronLeft,
  Minus, Plus, Info, Edit2
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

  const [showModal, setShowModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedContinents, setExpandedContinents] = useState<string[]>([])
  const [activeDSP, setActiveDSP] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'base' | 'dsp'>('base')
  const [selectedDSPForOverride, setSelectedDSPForOverride] = useState<string | null>(null)

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

    const filtered: Record<string, typeof territoriesData.continents[keyof typeof territoriesData.continents]> = {}
    
    Object.entries(territoriesData.continents).forEach(([key, continent]) => {
      const matchingCountries = continent.countries.filter(country =>
        country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        country.code.toLowerCase().includes(searchQuery.toLowerCase())
      )
      
      if (matchingCountries.length > 0) {
        filtered[key as keyof typeof territoriesData.continents] = {
          ...continent,
          countries: matchingCountries
        }
      }
    })
    
    return filtered
  }, [searchQuery])

  // Toggle mode
  // const toggleMode = () => {
  //   const newMode = value.base.mode === 'worldwide' ? 'include' : 
  //                  value.base.mode === 'include' ? 'exclude' : 'worldwide'
  //   
  //   onChange({
  //     ...value,
  //     base: {
  //       mode: newMode,
  //       territories: newMode === 'worldwide' ? [] : value.base.territories
  //     }
  //   })
  // }

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
  // const selectedCount = value.base.mode === 'worldwide' 
  //   ? totalCountries 
  //   : value.base.mode === 'include' 
  //     ? value.base.territories.length 
  //     : totalCountries - value.base.territories.length

  // Removed renderDSPItem and getDSPName functions to prevent TypeScript parsing errors with JSX in comments

  // Get territory count for display
  const getTerritoryCount = useCallback((mode: string, territories: string[]) => {
    if (mode === 'worldwide') return totalCountries
    if (mode === 'include') return territories.length
    return totalCountries - territories.length
  }, [totalCountries])

  return (
    <>
      {/* Simple Display Card */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Globe className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="font-medium">
                {t('발매 지역', 'Release Territories')}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                {value.base.mode === 'worldwide' && t(`전세계 ${totalCountries}개국`, `Worldwide (${totalCountries} countries)`)}
                {value.base.mode === 'include' && t(`${value.base.territories.length}개국 선택됨`, `${value.base.territories.length} countries selected`)}
                {value.base.mode === 'exclude' && t(`${value.base.territories.length}개국 제외`, `Excluding ${value.base.territories.length} countries`)}
                {value.dspOverrides.length > 0 && t(` · DSP별 설정 ${value.dspOverrides.length}개`, ` · ${value.dspOverrides.length} DSP overrides`)}
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
            {t('설정', 'Configure')}
          </button>
        </div>
        
        {/* Quick Summary */}
        {(value.base.mode !== 'worldwide' || value.dspOverrides.length > 0) && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="space-y-2 text-sm">
              {value.base.mode === 'include' && value.base.territories.length > 0 && (
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-500 mt-0.5" />
                  <div>
                    <span className="font-medium">{t('포함:', 'Include:')}</span>
                    <span className="text-gray-600 dark:text-gray-400 ml-1">
                      {value.base.territories.slice(0, 5).map(code => {
                        const country = Object.values(territoriesData.continents)
                          .flatMap(c => c.countries)
                          .find(c => c.code === code)
                        return country?.name || code
                      }).join(', ')}
                      {value.base.territories.length > 5 && t(` 외 ${value.base.territories.length - 5}개국`, ` and ${value.base.territories.length - 5} more`)}
                    </span>
                  </div>
                </div>
              )}
              
              {value.base.mode === 'exclude' && value.base.territories.length > 0 && (
                <div className="flex items-start gap-2">
                  <X className="w-4 h-4 text-red-500 mt-0.5" />
                  <div>
                    <span className="font-medium">{t('제외:', 'Exclude:')}</span>
                    <span className="text-gray-600 dark:text-gray-400 ml-1">
                      {value.base.territories.slice(0, 5).map(code => {
                        const country = Object.values(territoriesData.continents)
                          .flatMap(c => c.countries)
                          .find(c => c.code === code)
                        return country?.name || code
                      }).join(', ')}
                      {value.base.territories.length > 5 && t(` 외 ${value.base.territories.length - 5}개국`, ` and ${value.base.territories.length - 5} more`)}
                    </span>
                  </div>
                </div>
              )}
              
              {value.dspOverrides.map(override => {
                const dsp = territoriesData.dsps.find(d => d.id === override.dspId)
                return (
                  <div key={override.dspId} className="flex items-start gap-2">
                    <span className="text-base">{dsp?.icon}</span>
                    <div>
                      <span className="font-medium">{dsp?.name}:</span>
                      <span className="text-gray-600 dark:text-gray-400 ml-1">
                        {override.mode === 'exclude' 
                          ? t(`${override.territories.length}개국 제외`, `Excluding ${override.territories.length} countries`)
                          : t(`${override.territories.length}개국만`, `${override.territories.length} countries only`)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowModal(false)}>
          <div 
            className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex-shrink-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Globe className="w-6 h-6 text-purple-600" />
                    {t('발매 지역 설정', 'Configure Release Territories')}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {t('음원을 발매할 국가를 선택하고 DSP별로 개별 설정할 수 있습니다', 
                       'Select countries for your release and customize per DSP')}
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Tabs */}
              <div className="flex gap-1 mt-4">
                <button
                  onClick={() => setActiveTab('base')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === 'base'
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {t('기본 설정', 'Base Settings')}
                </button>
                <button
                  onClick={() => setActiveTab('dsp')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors relative ${
                    activeTab === 'dsp'
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {t('DSP별 설정', 'DSP Overrides')}
                  {value.dspOverrides.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-purple-600 text-white text-xs rounded-full flex items-center justify-center">
                      {value.dspOverrides.length}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto">

              {activeTab === 'base' && (
                <div className="p-6 space-y-6">
                  {/* Quick Mode Selection */}
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => onChange({ ...value, base: { mode: 'worldwide', territories: [] }})}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        value.base.mode === 'worldwide'
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Globe className={`w-8 h-8 mx-auto mb-2 ${
                        value.base.mode === 'worldwide' ? 'text-purple-600' : 'text-gray-400'
                      }`} />
                      <div className="font-medium">{t('전세계', 'Worldwide')}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {t(`${totalCountries}개국`, `${totalCountries} countries`)}
                      </div>
                    </button>
                    
                    <button
                      onClick={() => onChange({ ...value, base: { mode: 'include', territories: value.base.territories }})}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        value.base.mode === 'include'
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Plus className={`w-8 h-8 mx-auto mb-2 ${
                        value.base.mode === 'include' ? 'text-green-600' : 'text-gray-400'
                      }`} />
                      <div className="font-medium">{t('선택 국가만', 'Include Only')}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {t('특정 국가만 선택', 'Select specific countries')}
                      </div>
                    </button>
                    
                    <button
                      onClick={() => onChange({ ...value, base: { mode: 'exclude', territories: value.base.territories }})}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        value.base.mode === 'exclude'
                          ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Minus className={`w-8 h-8 mx-auto mb-2 ${
                        value.base.mode === 'exclude' ? 'text-red-600' : 'text-gray-400'
                      }`} />
                      <div className="font-medium">{t('제외 국가', 'Exclude')}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {t('특정 국가 제외', 'Exclude specific countries')}
                      </div>
                    </button>
                  </div>

                  {value.base.mode !== 'worldwide' && (
                    <>
                      {/* Quick Selection Buttons */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                          {t('빠른 선택', 'Quick Selection')}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => {
                              const majorCountries = ['US', 'GB', 'DE', 'FR', 'JP', 'KR', 'CN', 'CA', 'AU']
                              onChange({ ...value, base: { ...value.base, territories: majorCountries }})
                            }}
                            className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-700"
                          >
                            {t('주요 국가', 'Major Countries')}
                          </button>
                          <button
                            onClick={() => {
                              const asianCountries = territoriesData.continents.asia.countries.map(c => c.code)
                              onChange({ ...value, base: { ...value.base, territories: asianCountries }})
                            }}
                            className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-700"
                          >
                            {t('아시아', 'Asia')}
                          </button>
                          <button
                            onClick={() => {
                              const europeCountries = territoriesData.continents.europe.countries.map(c => c.code)
                              onChange({ ...value, base: { ...value.base, territories: europeCountries }})
                            }}
                            className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-700"
                          >
                            {t('유럽', 'Europe')}
                          </button>
                          <button
                            onClick={() => {
                              const americasCountries = territoriesData.continents.americas.countries.map(c => c.code)
                              onChange({ ...value, base: { ...value.base, territories: americasCountries }})
                            }}
                            className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-700"
                          >
                            {t('아메리카', 'Americas')}
                          </button>
                          <button
                            onClick={() => onChange({ ...value, base: { ...value.base, territories: [] }})}
                            className="px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm hover:bg-red-200 dark:hover:bg-red-900/50"
                          >
                            {t('모두 지우기', 'Clear All')}
                          </button>
                        </div>
                      </div>

                      {/* Search */}
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

                      {/* Country Grid */}
                      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                        <div className="max-h-80 overflow-y-auto p-4">
                          {searchQuery ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                              {Object.values(filteredContinents).flatMap(continent =>
                                continent.countries.map(country => {
                                  const isSelected = value.base.territories.includes(country.code)
                                  return (
                                    <button
                                      key={country.code}
                                      onClick={() => toggleCountry(country.code)}
                                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                                        isSelected
                                          ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-2 border-purple-500'
                                          : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-purple-300'
                                      }`}
                                    >
                                      {isSelected ? <Check className="w-3 h-3" /> : <div className="w-3 h-3" />}
                                      <span className="text-xs opacity-60">{country.code}</span>
                                      <span className="flex-1 text-left truncate">{country.name}</span>
                                    </button>
                                  )
                                })
                              )}
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {Object.entries(territoriesData.continents).map(([continentKey, continent]) => {
                                const isExpanded = expandedContinents.includes(continentKey)
                                const countryCodes = continent.countries.map(c => c.code)
                                const selectedInContinent = countryCodes.filter(code => 
                                  value.base.territories.includes(code)
                                ).length

                                return (
                                  <div key={continentKey} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                                    <button
                                      onClick={() => setExpandedContinents(prev =>
                                        isExpanded ? prev.filter(c => c !== continentKey) : [...prev, continentKey]
                                      )}
                                      className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                    >
                                      <div className="flex items-center gap-2">
                                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                        <span className="font-medium">{continent.name}</span>
                                        <span className="text-sm text-gray-500">
                                          {selectedInContinent > 0 && `(${selectedInContinent}/${continent.countries.length})`}
                                        </span>
                                      </div>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          toggleContinent(continentKey)
                                        }}
                                        className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg text-sm hover:bg-purple-200 dark:hover:bg-purple-900/50"
                                      >
                                        {selectedInContinent === continent.countries.length ? t('전체 해제', 'Deselect All') : t('전체 선택', 'Select All')}
                                      </button>
                                    </button>
                                    
                                    {isExpanded && (
                                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 p-3 bg-gray-50 dark:bg-gray-800/50">
                                        {continent.countries.map(country => {
                                          const isSelected = value.base.territories.includes(country.code)
                                          return (
                                            <button
                                              key={country.code}
                                              onClick={() => toggleCountry(country.code)}
                                              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                                                isSelected
                                                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-2 border-purple-500'
                                                  : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-purple-300'
                                              }`}
                                            >
                                              {isSelected ? <Check className="w-3 h-3" /> : <div className="w-3 h-3" />}
                                              <span className="text-xs opacity-60">{country.code}</span>
                                              <span className="flex-1 text-left truncate">{country.name}</span>
                                            </button>
                                          )
                                        })}
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Selected Countries Summary */}
                      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">
                            {value.base.mode === 'include' ? t('선택된 국가', 'Selected Countries') : t('제외된 국가', 'Excluded Countries')}
                            <span className="text-sm text-gray-500 ml-2">({value.base.territories.length})</span>
                          </h4>
                          {value.base.territories.length > 0 && (
                            <button
                              onClick={() => onChange({ ...value, base: { ...value.base, territories: [] }})}
                              className="text-sm text-red-600 hover:text-red-700"
                            >
                              {t('모두 지우기', 'Clear All')}
                            </button>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {value.base.territories.length === 0 ? (
                            <p className="text-sm text-gray-500">
                              {value.base.mode === 'include' 
                                ? t('국가를 선택하세요', 'Select countries') 
                                : t('제외할 국가를 선택하세요', 'Select countries to exclude')}
                            </p>
                          ) : (
                            value.base.territories.map(code => {
                              const country = Object.values(territoriesData.continents)
                                .flatMap(c => c.countries)
                                .find(c => c.code === code)
                              return (
                                <span
                                  key={code}
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-white dark:bg-gray-800 rounded-lg text-sm"
                                >
                                  <span className="text-xs opacity-60">{code}</span>
                                  <span>{country?.name || code}</span>
                                  <button
                                    onClick={() => toggleCountry(code)}
                                    className="ml-1 hover:text-red-600"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </span>
                              )
                            })
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {activeTab === 'dsp' && (
                <div className="p-6">
                  {selectedDSPForOverride ? (
                    // DSP Override Detail View
                    <div>
                      <button
                        onClick={() => setSelectedDSPForOverride(null)}
                        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 mb-4"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        {t('뒤로 가기', 'Back to DSP List')}
                      </button>
                      
                      {(() => {
                        const dsp = territoriesData.dsps.find(d => d.id === selectedDSPForOverride)
                        const override = getDSPOverride(selectedDSPForOverride)
                        if (!dsp) return null
                        
                        return (
                          <div>
                            <div className="flex items-center gap-3 mb-6">
                              <span className="text-3xl">{dsp.icon}</span>
                              <div>
                                <h3 className="text-lg font-bold">{dsp.name}</h3>
                                <p className="text-sm text-gray-600">
                                  {override 
                                    ? t(`${override.mode === 'exclude' ? '제외' : '포함'} 모드 - ${override.territories.length}개국`, 
                                        `${override.mode === 'exclude' ? 'Exclude' : 'Include'} mode - ${override.territories.length} countries`)
                                    : t('기본 설정 사용 중', 'Using base settings')}
                                </p>
                              </div>
                            </div>

                            {override ? (
                              <div className="space-y-4">
                                {/* Mode Selection */}
                                <div className="flex gap-3">
                                  <button
                                    onClick={() => updateDSPOverride(dsp.id, { mode: 'include' })}
                                    className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                                      override.mode === 'include'
                                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                        : 'border-gray-200 dark:border-gray-700'
                                    }`}
                                  >
                                    <Plus className={`w-6 h-6 mx-auto mb-1 ${
                                      override.mode === 'include' ? 'text-green-600' : 'text-gray-400'
                                    }`} />
                                    <div className="font-medium">{t('포함만', 'Include Only')}</div>
                                  </button>
                                  <button
                                    onClick={() => updateDSPOverride(dsp.id, { mode: 'exclude' })}
                                    className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                                      override.mode === 'exclude'
                                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                                        : 'border-gray-200 dark:border-gray-700'
                                    }`}
                                  >
                                    <Minus className={`w-6 h-6 mx-auto mb-1 ${
                                      override.mode === 'exclude' ? 'text-red-600' : 'text-gray-400'
                                    }`} />
                                    <div className="font-medium">{t('제외', 'Exclude')}</div>
                                  </button>
                                </div>

                                {/* Country Selection */}
                                <div>
                                  <h4 className="text-sm font-medium mb-3">{t('국가 선택', 'Select Countries')}</h4>
                                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 max-h-60 overflow-y-auto">
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                      {[
                                        { code: 'US', name: t('미국', 'USA') },
                                        { code: 'JP', name: t('일본', 'Japan') },
                                        { code: 'KR', name: t('한국', 'Korea') },
                                        { code: 'CN', name: t('중국', 'China') },
                                        { code: 'GB', name: t('영국', 'UK') },
                                        { code: 'DE', name: t('독일', 'Germany') },
                                        { code: 'FR', name: t('프랑스', 'France') },
                                        { code: 'IT', name: t('이탈리아', 'Italy') },
                                        { code: 'ES', name: t('스페인', 'Spain') },
                                        { code: 'CA', name: t('캐나다', 'Canada') },
                                        { code: 'AU', name: t('호주', 'Australia') },
                                        { code: 'BR', name: t('브라질', 'Brazil') }
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
                                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                                              isSelected
                                                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-2 border-purple-500'
                                                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-purple-300'
                                            }`}
                                          >
                                            {isSelected ? <Check className="w-3 h-3" /> : <div className="w-3 h-3" />}
                                            <span>{country.name}</span>
                                          </button>
                                        )
                                      })}
                                    </div>
                                  </div>
                                </div>

                                <button
                                  onClick={() => {
                                    toggleDSPOverride(dsp.id)
                                    setSelectedDSPForOverride(null)
                                  }}
                                  className="w-full py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50"
                                >
                                  {t('개별 설정 제거', 'Remove Override')}
                                </button>
                              </div>
                            ) : (
                              <div className="text-center py-8">
                                <Info className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                <p className="text-gray-600 mb-4">
                                  {t('현재 기본 설정을 사용 중입니다', 'Currently using base settings')}
                                </p>
                                <button
                                  onClick={() => {
                                    toggleDSPOverride(dsp.id)
                                  }}
                                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                                >
                                  {t('개별 설정 시작', 'Start Custom Settings')}
                                </button>
                              </div>
                            )}
                          </div>
                        )
                      })()}
                    </div>
                  ) : (
                    // DSP List View
                    <div>
                      <div className="mb-4">
                        <p className="text-sm text-gray-600">
                          {t('DSP마다 다른 발매 지역을 설정할 수 있습니다', 
                             'You can set different release territories for each DSP')}
                        </p>
                      </div>

                      {/* Popular DSPs */}
                      <div className="mb-6">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                          {t('주요 DSP', 'Popular DSPs')}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {['spotify', 'apple_music', 'youtube_music', 'kakao_melon', 'naver_vibe', 'genie_music', 'bugs', 'dreamus_flo'].map(dspId => {
                            const dsp = territoriesData.dsps.find(d => d.id === dspId)
                            if (!dsp) return null
                            const override = getDSPOverride(dsp.id)
                            
                            return (
                              <button
                                key={dsp.id}
                                onClick={() => setSelectedDSPForOverride(dsp.id)}
                                className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all hover:border-purple-300 ${
                                  override
                                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                                    : 'border-gray-200 dark:border-gray-700'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <span className="text-2xl">{dsp.icon}</span>
                                  <div className="text-left">
                                    <div className="font-medium">{dsp.name}</div>
                                    {override && (
                                      <div className="text-sm text-gray-600">
                                        {override.mode === 'exclude' 
                                          ? t(`${override.territories.length}개국 제외`, `Excluding ${override.territories.length}`)
                                          : t(`${override.territories.length}개국만`, `${override.territories.length} countries only`)}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-400" />
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* Other DSPs */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                          {t('기타 DSP', 'Other DSPs')}
                        </h4>
                        <div className="max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-1 p-2">
                            {territoriesData.dsps
                              .filter(dsp => !['spotify', 'apple_music', 'youtube_music', 'kakao_melon', 'naver_vibe', 'genie_music', 'bugs', 'dreamus_flo'].includes(dsp.id))
                              .map(dsp => {
                                const override = getDSPOverride(dsp.id)
                                return (
                                  <button
                                    key={dsp.id}
                                    onClick={() => setSelectedDSPForOverride(dsp.id)}
                                    className={`flex items-center justify-between p-3 rounded-lg transition-all hover:bg-gray-50 dark:hover:bg-gray-800 ${
                                      override ? 'bg-purple-50 dark:bg-purple-900/20' : ''
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <span className="text-lg">{dsp.icon}</span>
                                      <span className="text-sm truncate">{dsp.name}</span>
                                    </div>
                                    {override && (
                                      <span className="text-xs bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full flex-shrink-0">
                                        {override.territories.length}
                                      </span>
                                    )}
                                  </button>
                                )
                              })}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex-shrink-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {t(`총 ${getTerritoryCount(value.base.mode, value.base.territories)}개국 발매`, 
                     `Releasing in ${getTerritoryCount(value.base.mode, value.base.territories)} countries`)}
                  {value.dspOverrides.length > 0 && 
                    t(` · ${value.dspOverrides.length}개 DSP 개별 설정`, 
                      ` · ${value.dspOverrides.length} DSP overrides`)}
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  {t('완료', 'Done')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}