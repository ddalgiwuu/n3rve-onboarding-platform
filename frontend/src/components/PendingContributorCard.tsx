import { useState, useRef, useEffect, useMemo } from 'react';
import {
  X, Search, ChevronDown, ChevronUp, Music, User, Check, AlertCircle,
  Info, ExternalLink, Languages, Plus, Trash2, Globe
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useLanguageStore } from '@/store/language.store';
import useSafeStore from '@/hooks/useSafeStore';
import contributorRolesData from '@/data/contributorRoles.json';
import contributorRolesKoData from '@/data/contributorRolesKo.json';
import instrumentsData from '@/data/instruments.json';
import instrumentsKoData from '@/data/instrumentsKo.json';
import { useFuzzySearch } from '@/hooks/useFuzzySearch';
import { prepareRolesForSearch, prepareInstrumentsForSearch } from '@/utils/searchDataPreparation';
import { languageOptions } from '@/constants/languages';
import { v4 as uuidv4 } from 'uuid';

const contributorRolesKo = contributorRolesKoData as { translations: Record<string, string> };
const instrumentsKo = instrumentsKoData as { translations: Record<string, string> };

interface PlatformIdentifier {
  type: 'spotify' | 'apple'
  value: string
  url?: string
}

interface Translation {
  id?: string
  language: string
  name: string
}

interface PendingContributorCardProps {
  savedId: string;
  name: string;
  translations: Translation[];
  identifiers: PlatformIdentifier[];
  isNewArtist: boolean;
  selectedRoles: string[];
  selectedInstruments: string[];
  onUpdate: (updates: any) => void;
  onRemove: () => void;
}

// Platform identifier configurations
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
};

export default function PendingContributorCard({
  savedId: _savedId,
  name,
  translations = [],
  identifiers = [],
  isNewArtist,
  selectedRoles = [],
  selectedInstruments = [],
  onUpdate,
  onRemove
}: PendingContributorCardProps) {
  const language = useSafeStore(useLanguageStore, (state) => state.language) || 'ko';
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState({ roles: '', instruments: '', languages: {} as Record<string, string> });
  const [showDropdown, setShowDropdown] = useState({ roles: false, instruments: false, languages: {} as Record<string, boolean> });
  const [showTranslations, setShowTranslations] = useState(false);

  const rolesRef = useRef<HTMLDivElement>(null);
  const instrumentsRef = useRef<HTMLDivElement>(null);
  const languageRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Fuzzy search setup
  const preparedRoles = useMemo(() => prepareRolesForSearch(), []);
  const preparedInstruments = useMemo(() => prepareInstrumentsForSearch(), []);

  const fuzzySearchRoles = useFuzzySearch(preparedRoles, {
    keys: [
      { name: 'id', weight: 2.0 },
      { name: 'name', weight: 1.5 },
      { name: 'koName', weight: 1.0 },
      { name: 'category', weight: 0.8 }
    ],
    threshold: 0.4
  });

  const fuzzySearchInstruments = useFuzzySearch(preparedInstruments, {
    keys: [
      { name: 'id', weight: 2.0 },
      { name: 'name', weight: 1.5 },
      { name: 'koName', weight: 1.0 },
      { name: 'category', weight: 0.8 }
    ],
    threshold: 0.35
  });

  // Filter with fuzzy search
  const fuzzyRolesResults = useMemo(() => {
    return fuzzySearchRoles(searchQuery.roles || '');
  }, [fuzzySearchRoles, searchQuery.roles]);

  const fuzzyInstrumentsResults = useMemo(() => {
    return fuzzySearchInstruments(searchQuery.instruments || '');
  }, [fuzzySearchInstruments, searchQuery.instruments]);

  const filteredRoles = useMemo(() => {
    if (!searchQuery.roles) return contributorRolesData.roles;
    return fuzzyRolesResults
      .map(searchableRole => contributorRolesData.roles.find(r => r.id === searchableRole.id))
      .filter((role): role is typeof contributorRolesData.roles[0] => role !== undefined);
  }, [fuzzyRolesResults, searchQuery.roles]);

  const filteredInstruments = useMemo(() => {
    if (!searchQuery.instruments) return instrumentsData.instruments;
    return fuzzyInstrumentsResults
      .map(searchableInst => instrumentsData.instruments.find(i => i.id === searchableInst.id))
      .filter((inst): inst is typeof instrumentsData.instruments[0] => inst !== undefined);
  }, [fuzzyInstrumentsResults, searchQuery.instruments]);

  // Group by category
  const groupedRoles = filteredRoles.reduce((acc, role) => {
    if (!acc[role.category]) acc[role.category] = [];
    acc[role.category].push(role);
    return acc;
  }, {} as Record<string, typeof contributorRolesData.roles>);

  const groupedInstruments = filteredInstruments.reduce((acc, instrument) => {
    if (!acc[instrument.category]) acc[instrument.category] = [];
    acc[instrument.category].push(instrument);
    return acc;
  }, {} as Record<string, typeof instrumentsData.instruments>);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (rolesRef.current && !rolesRef.current.contains(e.target as Node)) {
        setShowDropdown(prev => ({ ...prev, roles: false }));
      }
      if (instrumentsRef.current && !instrumentsRef.current.contains(e.target as Node)) {
        setShowDropdown(prev => ({ ...prev, instruments: false }));
      }

      // Close language dropdowns
      Object.keys(languageRefs.current).forEach(translationId => {
        const ref = languageRefs.current[translationId];
        if (ref && !ref.contains(e.target as Node)) {
          setShowDropdown(prev => ({
            ...prev,
            languages: { ...prev.languages, [translationId]: false }
          }));
        }
      });
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Translation management
  const addTranslation = () => {
    const newTranslation: Translation = { id: uuidv4(), language: '', name: '' };
    const currentTranslations = Array.isArray(translations) ? translations : [];
    onUpdate({ translations: [...currentTranslations, newTranslation] });
  };

  const updateTranslation = (id: string, field: 'language' | 'name', value: string) => {
    onUpdate({
      translations: Array.isArray(translations) ? translations.map(t =>
        (t.id || t.language) === id ? { ...t, [field]: value } : t
      ) : []
    });
  };

  const removeTranslation = (id: string) => {
    onUpdate({ translations: Array.isArray(translations) ? translations.filter(t => (t.id || t.language) !== id) : [] });
  };

  // Role/Instrument toggles
  const toggleRole = (roleId: string) => {
    const newRoles = selectedRoles.includes(roleId)
      ? selectedRoles.filter(r => r !== roleId)
      : [...selectedRoles, roleId];
    onUpdate({ selectedRoles: newRoles });
    setSearchQuery(prev => ({ ...prev, roles: '' }));
  };

  const toggleInstrument = (instId: string) => {
    const newInstruments = selectedInstruments.includes(instId)
      ? selectedInstruments.filter(i => i !== instId)
      : [...selectedInstruments, instId];
    onUpdate({ selectedInstruments: newInstruments });
    setSearchQuery(prev => ({ ...prev, instruments: '' }));
  };

  // Validation helpers
  const validateIdentifier = (type: keyof typeof identifierTypes, value: string): boolean => {
    return identifierTypes[type].pattern.test(value);
  };

  const getPlatformUrl = (identifier: PlatformIdentifier): string | null => {
    switch (identifier.type) {
      case 'spotify':
        if (identifier.value) {
          const spotifyId = identifier.value.replace('spotify:artist:', '');
          return `https://open.spotify.com/artist/${spotifyId}`;
        }
        return 'https://open.spotify.com/search';
      case 'apple':
        if (identifier.value && /^[0-9]+$/.test(identifier.value)) {
          return `https://music.apple.com/artist/${identifier.value}`;
        }
        return 'https://music.apple.com/search';
      default:
        return null;
    }
  };

  return (
    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl p-6 border-2 border-yellow-300 dark:border-yellow-700 shadow-lg">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <label className="text-xs font-semibold text-yellow-700 dark:text-yellow-300 mb-2 block uppercase tracking-wide">
            {t('기여자 이름', 'Contributor Name', 'コントリビューター名')}
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            className="font-semibold text-gray-900 dark:text-white text-lg bg-white dark:bg-gray-800 border-2 border-yellow-300 dark:border-yellow-600 focus:border-yellow-500 dark:focus:border-yellow-400 rounded-lg outline-none w-full px-4 py-2 transition-all"
            placeholder={t('기여자 이름 입력', 'Enter contributor name', 'コントリビューター名を入力')}
          />
        </div>
        <button
          onClick={onRemove}
          className="p-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg ml-3 transition-colors"
          title={t('제거', 'Remove', '削除')}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-5">
        {/* Translations Section - Enhanced */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setShowTranslations(!showTranslations)}
              className="flex items-center gap-2 text-sm font-medium text-purple-700 dark:text-purple-300 hover:text-purple-900 dark:hover:text-purple-100 transition-colors"
            >
              <Languages className="w-4 h-4" />
              {t('다국어 이름', 'Multilingual Names', '多言語名')}
              {translations.length > 0 && (
                <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-semibold">
                  {translations.length}
                </span>
              )}
              {showTranslations ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <button
              onClick={addTranslation}
              className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded-lg flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3 h-3" />
              {t('추가', 'Add', '追加')}
            </button>
          </div>

          {showTranslations && (
            <>
              {translations.length === 0 ? (
                <div className="text-center py-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                  <Globe className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('번역된 이름이 없습니다', 'No translations', '翻訳がありません')}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {Array.isArray(translations) && translations.map((translation) => {
                    const translationId = translation.id || translation.language;
                    const langQuery = searchQuery.languages[translationId] || '';
                    const filteredLanguages = languageOptions.filter(lang => {
                      if (!langQuery) return true;
                      const query = langQuery.toLowerCase();
                      return lang.code.toLowerCase().includes(query) ||
                             lang.name.toLowerCase().includes(query) ||
                             lang.koName.toLowerCase().includes(query);
                    });
                    const selectedLang = languageOptions.find(l => l.code === translation.language);

                    return (
                      <div key={translationId} className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          {/* Language Selector */}
                          <div
                            className="relative w-40"
                            ref={el => { languageRefs.current[translationId] = el; }}
                          >
                            <div className="relative">
                              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 z-10" />
                              <input
                                type="text"
                                value={langQuery || (selectedLang ? `${selectedLang.flag} ${selectedLang.name}` : '')}
                                onChange={(e) => {
                                  setSearchQuery(prev => ({
                                    ...prev,
                                    languages: { ...prev.languages, [translationId]: e.target.value }
                                  }));
                                  setShowDropdown(prev => ({
                                    ...prev,
                                    languages: { ...prev.languages, [translationId]: true }
                                  }));
                                }}
                                onFocus={() => {
                                  setSearchQuery(prev => ({
                                    ...prev,
                                    languages: { ...prev.languages, [translationId]: '' }
                                  }));
                                  setShowDropdown(prev => ({
                                    ...prev,
                                    languages: { ...prev.languages, [translationId]: true }
                                  }));
                                }}
                                placeholder={t('언어', 'Language', '言語')}
                                className="w-full pl-7 pr-7 py-1.5 border rounded-lg text-xs dark:bg-gray-700"
                              />
                              <button
                                type="button"
                                onClick={() => setShowDropdown(prev => ({
                                  ...prev,
                                  languages: { ...prev.languages, [translationId]: !prev.languages[translationId] }
                                }))}
                                className="absolute right-1.5 top-1/2 -translate-y-1/2"
                              >
                                {showDropdown.languages[translationId] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              </button>
                            </div>

                            {/* Language Dropdown */}
                            {showDropdown.languages[translationId] && (
                              <div className="absolute z-50 mt-1 w-64 bg-white dark:bg-gray-800 border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                {filteredLanguages.map(lang => (
                                  <button
                                    key={lang.code}
                                    type="button"
                                    onClick={() => {
                                      updateTranslation(translationId, 'language', lang.code);
                                      setSearchQuery(prev => ({
                                        ...prev,
                                        languages: { ...prev.languages, [translationId]: '' }
                                      }));
                                      setShowDropdown(prev => ({
                                        ...prev,
                                        languages: { ...prev.languages, [translationId]: false }
                                      }));
                                    }}
                                    className="w-full px-3 py-2 text-left text-xs hover:bg-purple-50 dark:hover:bg-purple-900/20 flex items-center gap-2"
                                  >
                                    <span>{lang.flag}</span>
                                    <span>{lang.name} ({lang.koName})</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Translation Name Input */}
                          <input
                            type="text"
                            value={translation.name}
                            onChange={(e) => updateTranslation(translationId, 'name', e.target.value)}
                            className="flex-1 px-3 py-1.5 border rounded-lg text-sm dark:bg-gray-700"
                            placeholder={t('번역된 이름', 'Translated name', '翻訳名')}
                          />

                          <button
                            onClick={() => removeTranslation(translationId)}
                            className="p-1.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg"
                            title={t('삭제', 'Delete', '削除')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Roles - Enhanced with categories */}
        <div>
          <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
            <User className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            {t('역할', 'Roles', '役割')} <span className="text-red-500">*</span>
          </label>

          {selectedRoles.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {selectedRoles.map(roleId => {
                const role = contributorRolesData.roles.find(r => r.id === roleId);
                return role ? (
                  <span key={roleId} className="px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg text-sm flex items-center gap-2 font-medium">
                    {role.name}
                    <button onClick={() => toggleRole(roleId)} className="hover:text-purple-900 dark:hover:text-purple-100">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ) : null;
              })}
            </div>
          )}

          <div className="relative" ref={rolesRef}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery.roles}
                onChange={(e) => {
                  setSearchQuery(prev => ({ ...prev, roles: e.target.value }));
                  if (e.target.value.length > 0) setShowDropdown(prev => ({ ...prev, roles: true }));
                }}
                onFocus={() => setShowDropdown(prev => ({ ...prev, roles: true }))}
                className="w-full pl-10 pr-10 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 dark:bg-gray-700"
                placeholder={t('역할 검색 (예: Producer)', 'Search roles (e.g., Producer)', '役割を検索')}
              />
              <button onClick={() => setShowDropdown(prev => ({ ...prev, roles: !prev.roles }))} className="absolute right-3 top-1/2 -translate-y-1/2">
                {showDropdown.roles ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {searchQuery.roles && (
              <div className="absolute right-12 top-1/2 -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400 font-medium">
                {filteredRoles.length} {t('개 결과', 'results', '件')}
              </div>
            )}

            {showDropdown.roles && (
              <div className="absolute z-[100] w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl max-h-72 overflow-y-auto">
                {Object.entries(groupedRoles).map(([category, roles]) => (
                  <div key={category}>
                    <div className="px-3 py-2 text-xs font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/30 sticky top-0">
                      {category}
                    </div>
                    {roles.map((role: any) => (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => toggleRole(role.id)}
                        className="w-full px-4 py-2.5 text-left hover:bg-purple-50 dark:hover:bg-purple-900/20 flex items-center justify-between text-sm border-b border-gray-100 dark:border-gray-700 last:border-0"
                      >
                        <span className="flex items-center gap-2">
                          <span className="text-gray-900 dark:text-white font-medium">{role.name}</span>
                          {role?.id && contributorRolesKo.translations?.[role.id] && (
                            <span className="text-gray-500 dark:text-gray-400 text-xs">
                              ({contributorRolesKo.translations[role.id]})
                            </span>
                          )}
                        </span>
                        {selectedRoles.includes(role.id) && <Check className="w-5 h-5 text-purple-600" />}
                      </button>
                    ))}
                  </div>
                ))}
                {filteredRoles.length === 0 && (
                  <div className="px-4 py-8 text-center text-gray-500 text-sm">
                    {t('검색 결과 없음', 'No results', '結果なし')}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Instruments - Enhanced with categories */}
        <div>
          <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
            <Music className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            {t('악기', 'Instruments', '楽器')}
          </label>

          {selectedInstruments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {selectedInstruments.map(instId => {
                const inst = instrumentsData.instruments.find(i => i.id === instId);
                return inst ? (
                  <span key={instId} className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm flex items-center gap-2 font-medium">
                    {inst.name}
                    <button onClick={() => toggleInstrument(instId)}>
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ) : null;
              })}
            </div>
          )}

          <div className="relative" ref={instrumentsRef}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
              <input
                type="text"
                value={searchQuery.instruments}
                onChange={(e) => {
                  setSearchQuery(prev => ({ ...prev, instruments: e.target.value }));
                  if (e.target.value.length > 0) {
                    setShowDropdown(prev => ({ ...prev, instruments: true }));
                  }
                }}
                onFocus={() => setShowDropdown(prev => ({ ...prev, instruments: true }))}
                className="w-full pl-10 pr-10 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                placeholder={t('악기 검색 (예: Guitar)', 'Search instruments (e.g., Guitar)', '楽器を検索')}
              />
              <button
                type="button"
                onClick={() => setShowDropdown(prev => ({ ...prev, instruments: !prev.instruments }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-10"
              >
                {showDropdown.instruments ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {searchQuery.instruments && (
              <div className="absolute right-12 top-1/2 -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400 font-medium">
                {filteredInstruments.length} {t('개 결과', 'results', '件')}
              </div>
            )}

            {showDropdown.instruments && (
              <div className="absolute z-[100] w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl max-h-72 overflow-y-auto">
                {Object.entries(groupedInstruments).map(([category, instruments]) => (
                  <div key={category}>
                    <div className="px-3 py-2 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 sticky top-0">
                      {category}
                    </div>
                    {instruments.map((inst: any) => (
                      <button
                        key={inst.id}
                        type="button"
                        onClick={() => toggleInstrument(inst.id)}
                        className="w-full px-4 py-2.5 text-left hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center justify-between text-sm border-b border-gray-100 dark:border-gray-700 last:border-0"
                      >
                        <span className="flex items-center gap-2">
                          <span className="text-gray-900 dark:text-white font-medium">{inst.name}</span>
                          {inst?.id && instrumentsKo.translations?.[inst.id] && (
                            <span className="text-gray-500 dark:text-gray-400 text-xs">
                              ({instrumentsKo.translations[inst.id]})
                            </span>
                          )}
                        </span>
                        {selectedInstruments.includes(inst.id) && <Check className="w-5 h-5 text-blue-600" />}
                      </button>
                    ))}
                  </div>
                ))}
                {filteredInstruments.length === 0 && (
                  <div className="px-4 py-8 text-center text-gray-500 text-sm">
                    {t('검색 결과 없음', 'No results', '結果なし')}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Platform IDs - Enhanced with validation */}
        <div className="space-y-3">
          {['spotify', 'apple'].map((platformType) => {
            // Match identifier type case-insensitively and handle variations (APPLE_MUSIC vs apple)
            const identifier = identifiers.find(i => {
              const normalizedType = i.type.toLowerCase().replace('_music', '');
              return normalizedType === platformType;
            }) || { type: platformType as 'spotify' | 'apple', value: '' };
            const config = identifierTypes[platformType as keyof typeof identifierTypes];
            const isValid = identifier.value ? validateIdentifier(platformType as keyof typeof identifierTypes, identifier.value) : true;
            const platformUrl = getPlatformUrl(identifier);

            return (
              <div key={platformType} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{config.icon}</span>
                  <label className="text-sm font-semibold">{config.name}</label>
                  <div className="group relative">
                    <Info className="w-3.5 h-3.5 text-gray-400 cursor-help" />
                    <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-72 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl z-50">
                      <div className="whitespace-pre-line">
                        {config.helpText[(language === 'ja' ? 'en' : language) as 'ko' | 'en']}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={identifier.value}
                    onChange={(e) => {
                      // Match type case-insensitively
                      const existingIndex = identifiers.findIndex(i => {
                        const normalizedType = i.type.toLowerCase().replace('_music', '');
                        return normalizedType === platformType;
                      });

                      let newIds;
                      if (existingIndex >= 0) {
                        newIds = identifiers.map((i, idx) =>
                          idx === existingIndex ? { ...i, value: e.target.value } : i
                        );
                      } else {
                        // Convert to uppercase enum for Prisma (SPOTIFY, APPLE_MUSIC)
                        const enumType = platformType === 'apple' ? 'APPLE_MUSIC' : 'SPOTIFY';
                        newIds = [...identifiers, { type: enumType as any, value: e.target.value }];
                      }
                      onUpdate({ identifiers: newIds });
                    }}
                    className={`w-full px-4 py-2 border-2 rounded-lg text-sm font-mono ${
                      !isValid ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    } focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 ${
                      isNewArtist ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800' : ''
                    }`}
                    placeholder={isNewArtist ? t('신규 아티스트는 입력 불가', 'Not available for new artists', '新規不可') : config.placeholder}
                    disabled={isNewArtist}
                  />
                  {identifier.value && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {isValid ? (
                        <Check className="w-5 h-5 text-green-500" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                  )}
                </div>

                <a
                  href={isNewArtist ? '#' : (platformUrl || '#')}
                  target={isNewArtist ? '_self' : '_blank'}
                  rel="noopener noreferrer"
                  onClick={isNewArtist ? (e) => e.preventDefault() : undefined}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium mt-2 transition-colors ${
                    isNewArtist
                      ? 'bg-gray-400 cursor-not-allowed text-gray-200'
                      : 'bg-purple-600 hover:bg-purple-700 text-white'
                  }`}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  {t('페이지 확인', 'Check Page', 'ページ確認')}
                </a>
              </div>
            );
          })}
        </div>

        {/* New Artist - Enhanced with prominent styling */}
        <div className={`rounded-lg p-4 border-2 transition-all ${
          isNewArtist
            ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-400 dark:border-orange-600'
            : 'bg-gray-50 dark:bg-gray-800/50 border-gray-300 dark:border-gray-600'
        }`}>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isNewArtist}
              onChange={(e) => onUpdate({ isNewArtist: e.target.checked })}
              className="mt-1 w-5 h-5 rounded border-2 text-orange-500 focus:ring-orange-500"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{t('신규 아티스트', 'New Artist', '新規アーティスト')}</span>
                {isNewArtist && (
                  <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-800/30 text-orange-700 dark:text-orange-300 text-xs rounded-full font-bold">
                    {t('활성화됨', 'ACTIVE', 'アクティブ')}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {isNewArtist ? (
                  <>
                    <span className="text-orange-600 dark:text-orange-400 font-medium">
                      {t('⚠️ 새로운 아티스트 페이지가 생성됩니다', '⚠️ New artist page will be created', '⚠️ 新規ページ作成')}
                    </span>
                    <br />
                    {t('각 플랫폼(Spotify, Apple Music)에 새 프로필이 만들어집니다.', 'New profiles will be created on Spotify, Apple Music', '各プラットフォームに新規プロフィール作成')}
                  </>
                ) : (
                  t('기존 아티스트와 연결하려면 체크하지 마세요', 'Leave unchecked to link with existing artist', '既存連携は未チェック')
                )}
              </p>
            </div>
          </label>

          {isNewArtist && (
            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-blue-700 dark:text-blue-300">
                  <p className="font-semibold mb-1">{t('신규 아티스트 안내', 'New Artist Guide', '新規ガイド')}</p>
                  <ul className="space-y-0.5">
                    <li>• {t('플랫폼 ID 입력 불필요', 'No need to enter platform IDs', 'ID入力不要')}</li>
                    <li>• {t('약 24-48시간 내 반영', 'Reflected within 24-48h', '24-48時間で反映')}</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
