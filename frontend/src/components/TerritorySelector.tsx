import { useState, useEffect, useMemo } from 'react'
import { ChevronDown, ChevronUp, Globe, X, Search, Filter } from 'lucide-react'
import { useLanguageStore } from '@/store/language.store'
import { TERRITORY_DATA, Country, Continent } from '@/data/territory-data'

export interface TerritorySelection {
  selectionType: 'WORLDWIDE' | 'SPECIFIC' | 'WORLDWIDE_EXCEPT'
  selectedCountries: string[]
  excludedCountries: string[]
}

interface TerritorySelectionWithDSP extends TerritorySelection {
  dspTerritories: DSPTerritory[]
}

interface DSPTerritory {
  dspId: string
  dspName: string
  selectionType: 'WORLDWIDE' | 'SPECIFIC' | 'WORLDWIDE_EXCEPT'
  countries: string[]
}

interface TerritorySelectorProps {
  value: TerritorySelection
  onChange: (selection: TerritorySelection) => void
  dsps?: DSP[]
  showDSPCustomization?: boolean
  className?: string
}

interface DSP {
  id: string
  dspId: string
  name: string
  isActive: boolean
}

export default function TerritorySelector({
  value,
  onChange,
  dsps = [],
  showDSPCustomization = false,
  className = ''
}: TerritorySelectorProps) {
  const language = useLanguageStore(state => state.language)
  const t = (ko: string, en: string) => language === 'ko' ? ko : en

  const [expandedContinents, setExpandedContinents] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [selectedDSPForCustomization, setSelectedDSPForCustomization] = useState<string>('')

  // Filter countries based on search query
  const filteredTerritoryData = useMemo(() => {
    if (!searchQuery) return TERRITORY_DATA

    return TERRITORY_DATA.map(continent => ({
      ...continent,
      countries: continent.countries.filter(country =>
        country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        country.code.toLowerCase().includes(searchQuery.toLowerCase())
      )
    })).filter(continent => continent.countries.length > 0)
  }, [searchQuery])

  // Get total selected countries count
  const selectedCount = useMemo(() => {
    if (value.selectionType === 'WORLDWIDE') {
      const totalCountries = TERRITORY_DATA.reduce((sum, continent) => sum + continent.countries.length, 0)
      return totalCountries - value.excludedCountries.length
    }
    return value.selectedCountries.length
  }, [value])

  // Total countries count
  const totalCountries = TERRITORY_DATA.reduce((sum, continent) => sum + continent.countries.length, 0)

  const handleSelectionTypeChange = (type: TerritorySelection['selectionType']) => {
    onChange({
      ...value,
      selectionType: type,
      selectedCountries: type === 'SPECIFIC' ? value.selectedCountries : [],
      excludedCountries: type === 'WORLDWIDE_EXCEPT' ? value.excludedCountries : []
    })
  }

  const handleCountryToggle = (countryCode: string) => {
    if (value.selectionType === 'SPECIFIC') {
      const newSelected = value.selectedCountries.includes(countryCode)
        ? value.selectedCountries.filter(code => code !== countryCode)
        : [...value.selectedCountries, countryCode]
      
      onChange({
        ...value,
        selectedCountries: newSelected
      })
    } else if (value.selectionType === 'WORLDWIDE_EXCEPT') {
      const newExcluded = value.excludedCountries.includes(countryCode)
        ? value.excludedCountries.filter(code => code !== countryCode)
        : [...value.excludedCountries, countryCode]
      
      onChange({
        ...value,
        excludedCountries: newExcluded
      })
    }
  }

  const handleContinentToggle = (continent: Continent) => {
    const countryCodes = continent.countries.map(c => c.code)
    
    if (value.selectionType === 'SPECIFIC') {
      const allSelected = countryCodes.every(code => value.selectedCountries.includes(code))
      const newSelected = allSelected
        ? value.selectedCountries.filter(code => !countryCodes.includes(code))
        : [...new Set([...value.selectedCountries, ...countryCodes])]
      
      onChange({
        ...value,
        selectedCountries: newSelected
      })
    } else if (value.selectionType === 'WORLDWIDE_EXCEPT') {
      const allExcluded = countryCodes.every(code => value.excludedCountries.includes(code))
      const newExcluded = allExcluded
        ? value.excludedCountries.filter(code => !countryCodes.includes(code))
        : [...new Set([...value.excludedCountries, ...countryCodes])]
      
      onChange({
        ...value,
        excludedCountries: newExcluded
      })
    }
  }

  const toggleContinentExpansion = (continentCode: string) => {
    setExpandedContinents(prev =>
      prev.includes(continentCode)
        ? prev.filter(code => code !== continentCode)
        : [...prev, continentCode]
    )
  }

  const isCountrySelected = (countryCode: string) => {
    if (value.selectionType === 'WORLDWIDE') {
      return !value.excludedCountries.includes(countryCode)
    } else if (value.selectionType === 'SPECIFIC') {
      return value.selectedCountries.includes(countryCode)
    } else if (value.selectionType === 'WORLDWIDE_EXCEPT') {
      return !value.excludedCountries.includes(countryCode)
    }
    return false
  }

  const getContinentStatus = (continent: Continent) => {
    const countryCodes = continent.countries.map(c => c.code)
    let selectedInContinent = 0
    
    countryCodes.forEach(code => {
      if (isCountrySelected(code)) selectedInContinent++
    })
    
    if (selectedInContinent === 0) return 'none'
    if (selectedInContinent === countryCodes.length) return 'all'
    return 'partial'
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {t('지역 선택', 'Territory Selection')}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t(
              `${selectedCount}/${totalCountries}개 국가 선택됨`,
              `${selectedCount}/${totalCountries} countries selected`
            )}
          </p>
        </div>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <Filter className="w-4 h-4" />
          {t('고급 설정', 'Advanced')}
        </button>
      </div>

      {/* Selection Type */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('배포 범위', 'Distribution Scope')}
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
            <input
              type="radio"
              name="territoryType"
              checked={value.selectionType === 'WORLDWIDE'}
              onChange={() => handleSelectionTypeChange('WORLDWIDE')}
              className="text-purple-600 focus:ring-purple-500"
            />
            <div>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-600" />
                <span className="font-medium">{t('전세계', 'Worldwide')}</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t('모든 국가에 배포 (일부 제외 가능)', 'Distribute to all countries (with optional exclusions)')}
              </p>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
            <input
              type="radio"
              name="territoryType"
              checked={value.selectionType === 'SPECIFIC'}
              onChange={() => handleSelectionTypeChange('SPECIFIC')}
              className="text-purple-600 focus:ring-purple-500"
            />
            <div>
              <div className="font-medium">{t('특정 국가만', 'Specific Countries Only')}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t('선택한 국가들에만 배포', 'Distribute only to selected countries')}
              </p>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
            <input
              type="radio"
              name="territoryType"
              checked={value.selectionType === 'WORLDWIDE_EXCEPT'}
              onChange={() => handleSelectionTypeChange('WORLDWIDE_EXCEPT')}
              className="text-purple-600 focus:ring-purple-500"
            />
            <div>
              <div className="font-medium">{t('전세계 (일부 제외)', 'Worldwide Except')}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t('선택한 국가들을 제외하고 전세계 배포', 'Distribute worldwide except selected countries')}
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Country Selection */}
      {value.selectionType !== 'WORLDWIDE' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {value.selectionType === 'SPECIFIC' 
                ? t('선택할 국가', 'Countries to Include')
                : t('제외할 국가', 'Countries to Exclude')
              }
            </label>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('국가 검색...', 'Search countries...')}
                className="pl-9 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700"
              />
            </div>
          </div>

          {/* Countries List */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg max-h-96 overflow-auto">
            {filteredTerritoryData.map((continent) => {
              const isExpanded = expandedContinents.includes(continent.code)
              const continentStatus = getContinentStatus(continent)
              
              return (
                <div key={continent.code} className="border-b border-gray-100 dark:border-gray-800 last:border-b-0">
                  {/* Continent Header */}
                  <div className="p-4 bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => toggleContinentExpansion(continent.code)}
                        className="flex items-center gap-3 flex-1 text-left"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                        <span className="font-medium text-gray-900 dark:text-white">
                          {continent.name}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          ({continent.countries.length})
                        </span>
                        {continentStatus === 'all' && (
                          <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs rounded">
                            {t('전체', 'All')}
                          </span>
                        )}
                        {continentStatus === 'partial' && (
                          <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 text-xs rounded">
                            {t('부분', 'Partial')}
                          </span>
                        )}
                      </button>
                      
                      <button
                        onClick={() => handleContinentToggle(continent)}
                        className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        {continentStatus === 'all' 
                          ? t('전체 해제', 'Deselect All')
                          : t('전체 선택', 'Select All')
                        }
                      </button>
                    </div>
                  </div>

                  {/* Countries */}
                  {isExpanded && (
                    <div className="p-4 space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {continent.countries.map((country) => {
                          const selected = isCountrySelected(country.code)
                          
                          return (
                            <button
                              key={country.code}
                              onClick={() => handleCountryToggle(country.code)}
                              className={`
                                p-2 text-left rounded-lg border transition-colors
                                ${selected
                                  ? 'border-purple-300 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                                  : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                                }
                              `}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">{country.name}</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">{country.code}</span>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* DSP Customization */}
      {showDSPCustomization && showAdvanced && dsps.length > 0 && (
        <div className="space-y-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center justify-between">
            <h4 className="text-md font-medium text-gray-900 dark:text-white">
              {t('DSP별 지역 설정', 'Per-DSP Territory Settings')}
            </h4>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {t('선택사항', 'Optional')}
            </span>
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t(
              '특정 DSP에 대해 다른 지역 설정을 적용할 수 있습니다. 예: Apple Music은 일본만, Spotify는 미국만',
              'You can apply different territory settings for specific DSPs. Example: Apple Music for Japan only, Spotify for US only'
            )}
          </p>

          <div className="space-y-3">
            {dsps.filter(dsp => dsp.isActive).map((dsp) => (
              <div key={dsp.id} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900 dark:text-white">{dsp.name}</span>
                  <button
                    onClick={() => setSelectedDSPForCustomization(
                      selectedDSPForCustomization === dsp.dspId ? '' : dsp.dspId
                    )}
                    className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    {selectedDSPForCustomization === dsp.dspId 
                      ? t('취소', 'Cancel')
                      : t('사용자 지정', 'Customize')
                    }
                  </button>
                </div>
                
                {selectedDSPForCustomization === dsp.dspId && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {t(`${dsp.name}에 대한 별도 지역 설정`, `Separate territory settings for ${dsp.name}`)}
                    </p>
                    {/* This would contain a nested TerritorySelector for the specific DSP */}
                    <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
                      {t('DSP별 설정 기능 준비 중...', 'Per-DSP settings coming soon...')}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
        <div className="flex items-start gap-3">
          <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 dark:text-blue-100">
              {t('배포 요약', 'Distribution Summary')}
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              {value.selectionType === 'WORLDWIDE' && (
                t(
                  `전세계 ${totalCountries}개국에 배포${value.excludedCountries.length > 0 ? ` (${value.excludedCountries.length}개국 제외)` : ''}`,
                  `Distributing to all ${totalCountries} countries${value.excludedCountries.length > 0 ? ` (excluding ${value.excludedCountries.length})` : ''}`
                )
              )}
              {value.selectionType === 'SPECIFIC' && (
                t(
                  `선택한 ${value.selectedCountries.length}개국에만 배포`,
                  `Distributing to ${value.selectedCountries.length} selected countries only`
                )
              )}
              {value.selectionType === 'WORLDWIDE_EXCEPT' && (
                t(
                  `전세계 배포 (${value.excludedCountries.length}개국 제외)`,
                  `Worldwide distribution (excluding ${value.excludedCountries.length} countries)`
                )
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}