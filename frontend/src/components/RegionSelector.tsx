import { useState } from 'react'
import { Check, Globe, Search } from 'lucide-react'
import { cn } from '@/utils/cn'
import { useLanguageStore } from '@/store/language.store'

interface Region {
  code: string
  nameKo: string
  nameEn: string
  continent: string
}

interface RegionSelectorProps {
  selectedRegions: string[]
  onRegionsChange: (regions: string[]) => void
  className?: string
}

const regions: Region[] = [
  // Asia
  { code: 'KR', nameKo: '대한민국', nameEn: 'South Korea', continent: 'Asia' },
  { code: 'JP', nameKo: '일본', nameEn: 'Japan', continent: 'Asia' },
  { code: 'CN', nameKo: '중국', nameEn: 'China', continent: 'Asia' },
  { code: 'TW', nameKo: '대만', nameEn: 'Taiwan', continent: 'Asia' },
  { code: 'HK', nameKo: '홍콩', nameEn: 'Hong Kong', continent: 'Asia' },
  { code: 'SG', nameKo: '싱가포르', nameEn: 'Singapore', continent: 'Asia' },
  { code: 'MY', nameKo: '말레이시아', nameEn: 'Malaysia', continent: 'Asia' },
  { code: 'TH', nameKo: '태국', nameEn: 'Thailand', continent: 'Asia' },
  { code: 'VN', nameKo: '베트남', nameEn: 'Vietnam', continent: 'Asia' },
  { code: 'PH', nameKo: '필리핀', nameEn: 'Philippines', continent: 'Asia' },
  { code: 'ID', nameKo: '인도네시아', nameEn: 'Indonesia', continent: 'Asia' },
  { code: 'IN', nameKo: '인도', nameEn: 'India', continent: 'Asia' },
  
  // North America
  { code: 'US', nameKo: '미국', nameEn: 'United States', continent: 'North America' },
  { code: 'CA', nameKo: '캐나다', nameEn: 'Canada', continent: 'North America' },
  { code: 'MX', nameKo: '멕시코', nameEn: 'Mexico', continent: 'North America' },
  
  // Europe
  { code: 'GB', nameKo: '영국', nameEn: 'United Kingdom', continent: 'Europe' },
  { code: 'DE', nameKo: '독일', nameEn: 'Germany', continent: 'Europe' },
  { code: 'FR', nameKo: '프랑스', nameEn: 'France', continent: 'Europe' },
  { code: 'IT', nameKo: '이탈리아', nameEn: 'Italy', continent: 'Europe' },
  { code: 'ES', nameKo: '스페인', nameEn: 'Spain', continent: 'Europe' },
  { code: 'PT', nameKo: '포르투갈', nameEn: 'Portugal', continent: 'Europe' },
  { code: 'NL', nameKo: '네덜란드', nameEn: 'Netherlands', continent: 'Europe' },
  { code: 'BE', nameKo: '벨기에', nameEn: 'Belgium', continent: 'Europe' },
  { code: 'SE', nameKo: '스웨덴', nameEn: 'Sweden', continent: 'Europe' },
  { code: 'NO', nameKo: '노르웨이', nameEn: 'Norway', continent: 'Europe' },
  { code: 'DK', nameKo: '덴마크', nameEn: 'Denmark', continent: 'Europe' },
  { code: 'FI', nameKo: '핀란드', nameEn: 'Finland', continent: 'Europe' },
  { code: 'PL', nameKo: '폴란드', nameEn: 'Poland', continent: 'Europe' },
  { code: 'RU', nameKo: '러시아', nameEn: 'Russia', continent: 'Europe' },
  
  // South America
  { code: 'BR', nameKo: '브라질', nameEn: 'Brazil', continent: 'South America' },
  { code: 'AR', nameKo: '아르헨티나', nameEn: 'Argentina', continent: 'South America' },
  { code: 'CL', nameKo: '칠레', nameEn: 'Chile', continent: 'South America' },
  { code: 'CO', nameKo: '콜롬비아', nameEn: 'Colombia', continent: 'South America' },
  
  // Oceania
  { code: 'AU', nameKo: '호주', nameEn: 'Australia', continent: 'Oceania' },
  { code: 'NZ', nameKo: '뉴질랜드', nameEn: 'New Zealand', continent: 'Oceania' },
  
  // Middle East
  { code: 'AE', nameKo: '아랍에미리트', nameEn: 'UAE', continent: 'Middle East' },
  { code: 'SA', nameKo: '사우디아라비아', nameEn: 'Saudi Arabia', continent: 'Middle East' },
  { code: 'IL', nameKo: '이스라엘', nameEn: 'Israel', continent: 'Middle East' },
  { code: 'TR', nameKo: '터키', nameEn: 'Turkey', continent: 'Middle East' },
  
  // Africa
  { code: 'ZA', nameKo: '남아프리카공화국', nameEn: 'South Africa', continent: 'Africa' },
  { code: 'EG', nameKo: '이집트', nameEn: 'Egypt', continent: 'Africa' },
  { code: 'NG', nameKo: '나이지리아', nameEn: 'Nigeria', continent: 'Africa' },
]

export default function RegionSelector({ selectedRegions, onRegionsChange, className }: RegionSelectorProps) {
  const { language } = useLanguageStore()
  const t = (ko: string, en: string) => language === 'ko' ? ko : en
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedContinent, setSelectedContinent] = useState<string>('All')

  const continents = ['All', ...Array.from(new Set(regions.map(r => r.continent)))]

  const filteredRegions = regions.filter(region => {
    const matchesSearch = searchQuery === '' || 
      region.nameKo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      region.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      region.code.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesContinent = selectedContinent === 'All' || region.continent === selectedContinent
    
    return matchesSearch && matchesContinent
  })

  const toggleRegion = (code: string) => {
    if (selectedRegions.includes(code)) {
      onRegionsChange(selectedRegions.filter(r => r !== code))
    } else {
      onRegionsChange([...selectedRegions, code])
    }
  }

  const selectAll = () => {
    const visibleCodes = filteredRegions.map(r => r.code)
    const allSelected = visibleCodes.every(code => selectedRegions.includes(code))
    
    if (allSelected) {
      // Deselect all visible regions
      onRegionsChange(selectedRegions.filter(code => !visibleCodes.includes(code)))
    } else {
      // Select all visible regions
      const newSelection = [...new Set([...selectedRegions, ...visibleCodes])]
      onRegionsChange(newSelection)
    }
  }

  const allVisibleSelected = filteredRegions.length > 0 && 
    filteredRegions.every(r => selectedRegions.includes(r.code))

  return (
    <div className={cn("w-full", className)}>
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {t('배급 지역 선택', 'Select Distribution Regions')}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t(`${selectedRegions.length}개 지역 선택됨`, `${selectedRegions.length} regions selected`)}
        </p>
      </div>

      {/* Search and Filters */}
      <div className="space-y-3 mb-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('지역 검색...', 'Search regions...')}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {/* Continent Filter */}
        <div className="flex flex-wrap gap-2">
          {continents.map(continent => (
            <button
              key={continent}
              onClick={() => setSelectedContinent(continent)}
              className={cn(
                "px-3 py-1 rounded-full text-sm font-medium transition-all",
                selectedContinent === continent
                  ? "bg-purple-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              )}
            >
              {continent === 'All' ? t('전체', 'All') : continent}
            </button>
          ))}
        </div>

        {/* Select All Button */}
        <button
          onClick={selectAll}
          className="flex items-center gap-2 px-4 py-2 rounded-lg
                   bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600
                   text-gray-700 dark:text-gray-300 text-sm font-medium transition-all"
        >
          <Check className={cn("w-4 h-4", allVisibleSelected && "text-green-600")} />
          {allVisibleSelected 
            ? t('표시된 지역 모두 해제', 'Deselect All Visible')
            : t('표시된 지역 모두 선택', 'Select All Visible')
          }
        </button>
      </div>

      {/* Regions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-96 overflow-y-auto p-4 
                    bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
        {filteredRegions.map(region => {
          const isSelected = selectedRegions.includes(region.code)
          const name = language === 'ko' ? region.nameKo : region.nameEn
          
          return (
            <button
              key={region.code}
              onClick={() => toggleRegion(region.code)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                "border hover:shadow-md",
                isSelected
                  ? "bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700"
                  : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700"
              )}
            >
              <div className={cn(
                "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                isSelected
                  ? "bg-purple-600 border-purple-600"
                  : "border-gray-300 dark:border-gray-600"
              )}>
                {isSelected && <Check className="w-3 h-3 text-white" />}
              </div>
              <div className="flex-1 text-left">
                <p className={cn(
                  "font-medium",
                  isSelected 
                    ? "text-purple-900 dark:text-purple-100" 
                    : "text-gray-900 dark:text-white"
                )}>
                  {name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {region.code}
                </p>
              </div>
            </button>
          )
        })}
        
        {filteredRegions.length === 0 && (
          <div className="col-span-full py-8 text-center">
            <Globe className="w-12 h-12 mx-auto text-gray-400 mb-2" />
            <p className="text-gray-500 dark:text-gray-400">
              {t('검색 결과가 없습니다', 'No regions found')}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}