import { useState, useRef, useEffect } from 'react';
import { X, Check, ChevronDown } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface Option {
  value: string
  label: string
  category?: string
}

interface SearchableMultiSelectProps {
  options: Option[]
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  maxItems?: number
  label?: string
  required?: boolean
  className?: string
}

export default function SearchableMultiSelect({
  options,
  value = [],
  onChange,
  placeholder,
  maxItems,
  label,
  required = false,
  className = ''
}: SearchableMultiSelectProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter options based on search term
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group options by category
  const groupedOptions = filteredOptions.reduce((acc, option) => {
    const category = option.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(option);
    return acc;
  }, {} as Record<string, Option[]>);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter(v => v !== optionValue));
    } else if (!maxItems || value.length < maxItems) {
      onChange([...value, optionValue]);
    }
  };

  const handleRemove = (optionValue: string) => {
    onChange(value.filter(v => v !== optionValue));
  };

  const selectedOptions = options.filter(opt => value.includes(opt.value));

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div ref={dropdownRef} className="relative">
        {/* Selected items */}
        <div className="min-h-[48px] border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 p-2 flex flex-wrap gap-2">
          {selectedOptions.map(option => (
            <span
              key={option.value}
              className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm"
            >
              {option.label}
              <button
                type="button"
                onClick={() => handleRemove(option.value)}
                className="hover:text-green-900 dark:hover:text-green-100"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          {/* Search input */}
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder={
              selectedOptions.length === 0
                ? placeholder || t('검색하여 선택', 'Search to select', '検索して選択')
                : ''
            }
            className="flex-1 min-w-[120px] bg-transparent outline-none text-sm"
          />

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="ml-auto"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl max-h-60 overflow-auto">
            {/* Results count */}
            {searchTerm && (
              <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                {filteredOptions.length} {t('개 결과', 'results', '件の結果')}
              </div>
            )}

            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                {t('검색 결과가 없습니다', 'No results found', '検索結果がありません')}
              </div>
            ) : (
              Object.entries(groupedOptions).map(([category, categoryOptions]) => (
                <div key={category}>
                  {Object.keys(groupedOptions).length > 1 && (
                    <div className="px-3 py-1 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-700/80">
                      {category}
                    </div>
                  )}
                  {categoryOptions.map(option => {
                    const isSelected = value.includes(option.value);
                    const isDisabled = !isSelected && maxItems !== undefined && value.length >= maxItems;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => !isDisabled && handleSelect(option.value)}
                        disabled={isDisabled}
                        className={`
                          w-full px-3 py-2 text-left text-sm flex items-center justify-between
                          ${isSelected
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                        : isDisabled
                          ? 'bg-gray-50 dark:bg-gray-700/50 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                          : 'text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }
                        `}
                      >
                        <span>{option.label}</span>
                        {isSelected && <Check className="w-4 h-4" />}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {maxItems && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {t(
            `최대 ${maxItems}개까지 선택 가능`,
            `Choose up to ${maxItems} items`,
            `最大${maxItems}個まで選択可能`
          )}
        </p>
      )}
    </div>
  );
}
