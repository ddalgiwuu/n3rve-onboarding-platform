import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, ChevronUp, Globe } from 'lucide-react';
import { languageOptions, popularLanguages } from '@/constants/languages';
import { useTranslation } from '@/hooks/useTranslation';

interface LanguageSelectorProps {
  onLanguageSelect: (languageCode: string) => void;
  excludeLanguages?: string[];  // Already selected languages
  className?: string;
}

export default function LanguageSelector({
  onLanguageSelect,
  excludeLanguages = [],
  className = ''
}: LanguageSelectorProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter languages based on search and exclude list
  const availableLanguages = languageOptions.filter(
    lang => !excludeLanguages.includes(lang.code)
  );

  const filteredLanguages = availableLanguages.filter(lang => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return lang.code.toLowerCase().includes(query) ||
           lang.name.toLowerCase().includes(query) ||
           lang.koName.toLowerCase().includes(query);
  });

  const popularAvailable = popularLanguages.filter(
    code => !excludeLanguages.includes(code)
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (code: string) => {
    onLanguageSelect(code);
    setSearchQuery('');
    setShowDropdown(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          placeholder={t('언어 검색 또는 선택...', 'Search or select language...', '言語を検索または選択...')}
          className="w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
        />
        <button
          type="button"
          onClick={() => setShowDropdown(!showDropdown)}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
        >
          {showDropdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute z-50 mt-2 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-96 overflow-hidden flex flex-col">
          {/* Popular Languages (if no search query) */}
          {!searchQuery && popularAvailable.length > 0 && (
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                {t('인기 언어', 'Popular Languages', '人気言語')}
              </p>
              <div className="flex flex-wrap gap-2">
                {popularAvailable.map(code => {
                  const lang = languageOptions.find(l => l.code === code);
                  if (!lang) return null;
                  return (
                    <button
                      key={code}
                      type="button"
                      onClick={() => handleSelect(code)}
                      className="px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg text-sm font-medium hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                    >
                      {lang.flag} {lang.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Result count */}
          <div className="px-3 py-2 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {filteredLanguages.length} {t('개 언어', 'languages', '言語')}
            </p>
          </div>

          {/* Language List */}
          <div className="overflow-y-auto">
            {filteredLanguages.map(lang => (
              <button
                key={lang.code}
                type="button"
                onClick={() => handleSelect(lang.code)}
                className="w-full px-4 py-3 text-left hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors flex items-center gap-3 border-b border-gray-100 dark:border-gray-700 last:border-0"
              >
                <span className="text-2xl">{lang.flag}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {lang.name} ({lang.koName})
                  </p>
                  <p className="text-xs text-gray-500">{lang.code}</p>
                </div>
              </button>
            ))}
          </div>

          {/* No results */}
          {filteredLanguages.length === 0 && (
            <div className="p-8 text-center">
              <Globe className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('검색 결과가 없습니다', 'No languages found', '検索結果がありません')}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
