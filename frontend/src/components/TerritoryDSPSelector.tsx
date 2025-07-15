import { useState, useEffect } from 'react';
import { Globe, Check, X, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { territories, regions, getTerritoriesByRegion, regionCounts, type Region } from '@/constants/territories';
import { dsps, getDSPsByTerritory, type DSP } from '@/constants/dsps';
import { useLanguageStore } from '@/store/language.store';
import useSafeStore from '@/hooks/useSafeStore'

interface TerritoryDSPSelectorProps {
  value: {
    territories: string[]; // Selected territory codes
    dspExclusions: Record<string, string[]>; // DSP ID -> excluded territory codes
  };
  onChange: (value: {
    territories: string[];
    dspExclusions: Record<string, string[]>;
  }) => void;
}

export default function TerritoryDSPSelector({ value, onChange }: TerritoryDSPSelectorProps) {
  const language = useSafeStore(useLanguageStore, (state) => state.language);
  const t = (ko: string, en: string) => language === 'ko' ? ko : en;
  
  const [selectedRegion, setSelectedRegion] = useState<Region>('World');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedDSPs, setExpandedDSPs] = useState<Set<string>>(new Set());
  const [showAllTerritories, setShowAllTerritories] = useState(false);

  // Filter territories based on search
  const filteredTerritories = getTerritoriesByRegion(selectedRegion).filter(territory =>
    territory.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    territory.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Check if all territories in a region are selected
  const isRegionFullySelected = (region: Region) => {
    const regionTerritories = getTerritoriesByRegion(region);
    return regionTerritories.every(t => value.territories.includes(t.code));
  };

  // Check if some territories in a region are selected
  const isRegionPartiallySelected = (region: Region) => {
    const regionTerritories = getTerritoriesByRegion(region);
    const selectedCount = regionTerritories.filter(t => value.territories.includes(t.code)).length;
    return selectedCount > 0 && selectedCount < regionTerritories.length;
  };

  // Toggle region selection
  const toggleRegion = (region: Region) => {
    const regionTerritories = getTerritoriesByRegion(region);
    const regionCodes = regionTerritories.map(t => t.code);
    
    if (isRegionFullySelected(region)) {
      // Deselect all
      onChange({
        ...value,
        territories: value.territories.filter(t => !regionCodes.includes(t))
      });
    } else {
      // Select all
      const newTerritories = new Set([...value.territories, ...regionCodes]);
      onChange({
        ...value,
        territories: Array.from(newTerritories)
      });
    }
  };

  // Toggle territory selection
  const toggleTerritory = (territoryCode: string) => {
    if (value.territories.includes(territoryCode)) {
      onChange({
        ...value,
        territories: value.territories.filter(t => t !== territoryCode)
      });
    } else {
      onChange({
        ...value,
        territories: [...value.territories, territoryCode]
      });
    }
  };

  // Toggle DSP exclusion for a territory
  const toggleDSPExclusion = (dspId: string, territoryCode: string) => {
    const currentExclusions = value.dspExclusions[dspId] || [];
    
    if (currentExclusions.includes(territoryCode)) {
      // Remove exclusion
      const newExclusions = currentExclusions.filter(t => t !== territoryCode);
      const newDspExclusions = { ...value.dspExclusions };
      
      if (newExclusions.length === 0) {
        delete newDspExclusions[dspId];
      } else {
        newDspExclusions[dspId] = newExclusions;
      }
      
      onChange({
        ...value,
        dspExclusions: newDspExclusions
      });
    } else {
      // Add exclusion
      onChange({
        ...value,
        dspExclusions: {
          ...value.dspExclusions,
          [dspId]: [...currentExclusions, territoryCode]
        }
      });
    }
  };

  // Get DSPs available in selected territories
  const availableDSPs = Array.from(new Set(
    value.territories.flatMap(territoryCode => 
      getDSPsByTerritory(territoryCode).map(dsp => dsp.id)
    )
  )).map(dspId => dsps.find(dsp => dsp.id === dspId)!).filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Region selector */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <Globe className="w-4 h-4" />
          {t('발매 지역 선택', 'Select Release Territories')}
        </h4>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {regions.map(region => (
            <button
              key={region}
              onClick={() => {
                if (region === 'World') {
                  if (value.territories.length === territories.length) {
                    onChange({ ...value, territories: [] });
                  } else {
                    onChange({ ...value, territories: territories.map(t => t.code) });
                  }
                } else {
                  toggleRegion(region);
                }
                setSelectedRegion(region);
              }}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                region === 'World' && value.territories.length === territories.length
                  ? 'bg-blue-500 text-white border-blue-500'
                  : isRegionFullySelected(region)
                  ? 'bg-blue-500 text-white border-blue-500'
                  : isRegionPartiallySelected(region)
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700'
                  : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:border-blue-400'
              }`}
            >
              {region} ({region === 'World' ? territories.length : regionCounts[region]})
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('국가 검색...', 'Search territories...')}
            className="input pl-10"
          />
        </div>

        {/* Territory list */}
        <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 ${
          !showAllTerritories ? 'max-h-[300px] overflow-y-auto' : ''
        }`}>
          {filteredTerritories.map(territory => (
            <label
              key={territory.code}
              className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded"
            >
              <input
                type="checkbox"
                checked={value.territories.includes(territory.code)}
                onChange={() => toggleTerritory(territory.code)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm">
                {territory.name}
              </span>
            </label>
          ))}
        </div>

        {filteredTerritories.length > 12 && (
          <button
            onClick={() => setShowAllTerritories(!showAllTerritories)}
            className="mt-2 text-sm text-blue-500 hover:text-blue-600 flex items-center gap-1"
          >
            {showAllTerritories ? (
              <>
                <ChevronUp className="w-4 h-4" />
                {t('접기', 'Show less')}
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                {t('모두 보기', 'Show all')}
              </>
            )}
          </button>
        )}

        <div className="mt-4 text-sm text-gray-500">
          {t(
            `${value.territories.length}개 지역 선택됨`,
            `${value.territories.length} territories selected`
          )}
        </div>
      </div>

      {/* DSP exclusions */}
      {value.territories.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <h4 className="font-medium mb-3">
            {t('DSP별 지역 제외 설정', 'DSP Territory Exclusions')}
          </h4>
          <p className="text-sm text-gray-500 mb-4">
            {t(
              '특정 DSP에서 일부 지역을 제외하고 싶은 경우 설정하세요',
              'Configure if you want to exclude specific territories from certain DSPs'
            )}
          </p>

          <div className="space-y-3">
            {availableDSPs.map(dsp => {
              const isExpanded = expandedDSPs.has(dsp.id);
              const excludedCount = value.dspExclusions[dsp.id]?.length || 0;
              const availableInTerritories = value.territories.filter(t => 
                dsp.availableRegions.includes(t)
              );

              if (availableInTerritories.length === 0) return null;

              return (
                <div key={dsp.id} className="border rounded-lg p-3 dark:border-gray-700">
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => {
                      const newExpanded = new Set(expandedDSPs);
                      if (isExpanded) {
                        newExpanded.delete(dsp.id);
                      } else {
                        newExpanded.add(dsp.id);
                      }
                      setExpandedDSPs(newExpanded);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <h5 className="font-medium">
                        {language === 'ko' ? dsp.nameKo : dsp.name}
                      </h5>
                      {excludedCount > 0 && (
                        <span className="text-xs bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 px-2 py-0.5 rounded">
                          {t(`${excludedCount}개 지역 제외`, `${excludedCount} excluded`)}
                        </span>
                      )}
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </div>

                  {isExpanded && (
                    <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-2">
                      {availableInTerritories.map(territoryCode => {
                        const territory = territories.find(t => t.code === territoryCode)!;
                        const isExcluded = value.dspExclusions[dsp.id]?.includes(territoryCode);
                        
                        return (
                          <label
                            key={territoryCode}
                            className={`flex items-center gap-2 cursor-pointer p-2 rounded ${
                              isExcluded 
                                ? 'bg-red-50 dark:bg-red-900/20' 
                                : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={!isExcluded}
                              onChange={() => toggleDSPExclusion(dsp.id, territoryCode)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className={`text-sm ${isExcluded ? 'line-through text-gray-500' : ''}`}>
                              {territory.name}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}