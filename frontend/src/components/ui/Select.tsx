import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';

interface Option {
  value: string;
  label: string;
  icon?: React.ReactNode;
  description?: string;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string;
  error?: string;
  options?: Array<{ value: string; label: string } | Option>;
  placeholder?: string;
  onChange?: (value: string) => void;
  searchable?: boolean;
  nativeOnMobile?: boolean;
  hint?: string;
}

export default function Select({ 
  label, 
  error, 
  options = [], 
  className = '', 
  placeholder = 'Select an option',
  value,
  onChange,
  disabled,
  searchable = false,
  nativeOnMobile = true,
  ...props 
}: SelectProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  // Use native select on mobile if specified
  if (nativeOnMobile && isMobile) {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            className={cn(
              'w-full px-4 py-3.5 pr-10 rounded-xl transition-all duration-200 min-h-[48px]',
              'bg-gray-50 dark:bg-gray-900/50 backdrop-blur-sm',
              'text-gray-900 dark:text-gray-100 font-medium',
              'border-2 border-gray-200 dark:border-gray-700',
              'hover:border-gray-300 dark:hover:border-gray-600',
              'focus:border-transparent focus:ring-4 focus:ring-n3rve-500/20 focus:outline-none',
              'focus:bg-white dark:focus:bg-gray-900',
              'focus:shadow-lg focus:shadow-n3rve-500/10',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-gray-800',
              'appearance-none cursor-pointer',
              error && 'border-red-500 dark:border-red-500 hover:border-red-600 dark:hover:border-red-400 focus:ring-red-500/20 bg-red-50 dark:bg-red-900/10',
              className
            )}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            disabled={disabled}
            {...props}
          >
            <option value="" disabled>
              {placeholder}
            </option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-500">{error}</p>
        )}
      </div>
    );
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  const selectedOption = options.find(opt => opt.value === value);

  const filteredOptions = searchTerm
    ? options.filter(opt =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ('description' in opt && opt.description && opt.description.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : options;

  const handleSelect = (optionValue: string) => {
    onChange?.(optionValue);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2.5">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div ref={dropdownRef} className="relative">
        {/* Select Button */}
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={cn(
            'w-full flex items-center justify-between gap-2 px-4 py-3.5 min-h-[48px]',
            'bg-gray-50 dark:bg-gray-900/50 backdrop-blur-sm border-2 rounded-xl',
            'transition-all duration-200 text-left group',
            disabled ? 'cursor-not-allowed opacity-50 bg-gray-100 dark:bg-gray-800' : 'cursor-pointer',
            isOpen ? 'border-transparent ring-4 ring-n3rve-500/20 bg-white dark:bg-gray-900 shadow-lg shadow-n3rve-500/10' : 'border-gray-200 dark:border-gray-700',
            !disabled && !isOpen && 'hover:border-gray-300 dark:hover:border-gray-600 hover:bg-white dark:hover:bg-gray-900/70',
            error && 'border-red-500 dark:border-red-500 hover:border-red-600 dark:hover:border-red-400 ring-red-500/20 bg-red-50 dark:bg-red-900/10',
            className
          )}
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {selectedOption && 'icon' in selectedOption && selectedOption.icon && (
              <div className="flex-shrink-0">{selectedOption.icon}</div>
            )}
            <span className={cn(
              'truncate font-medium',
              !selectedOption ? 'text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white'
            )}>
              {selectedOption ? selectedOption.label : placeholder}
            </span>
          </div>
          <ChevronDown
            className={cn(
              'w-5 h-5 text-gray-400 dark:text-gray-500 transition-all duration-200 flex-shrink-0',
              'group-hover:text-gray-600 dark:group-hover:text-gray-400',
              isOpen && 'rotate-180 text-n3rve-500 dark:text-n3rve-400'
            )}
          />
        </button>

        {/* Dropdown */}
        {isOpen && !disabled && (
          <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-in fade-in slide-in-from-top-1">
            {/* Search Input */}
            {searchable && (
              <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={t('common.search', '검색...', 'Search...', '検索...')}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-n3rve-500/20 focus:border-n3rve-500 text-sm transition-all"
                  />
                </div>
              </div>
            )}

            {/* Options List */}
            <div className="max-h-60 overflow-y-auto">
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  {t('common.noResults', '검색 결과가 없습니다', 'No results found', '検索結果がありません')}
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={cn(
                      'w-full px-4 py-3.5 flex items-center gap-3',
                      'hover:bg-gray-50 dark:hover:bg-gray-700/50',
                      'transition-all duration-150 text-left group/option',
                      option.value === value && 'bg-gradient-to-r from-n3rve-50 to-purple-50 dark:from-n3rve-900/20 dark:to-purple-900/20'
                    )}
                  >
                    {/* Option Icon */}
                    {'icon' in option && option.icon && (
                      <div className="flex-shrink-0">{option.icon}</div>
                    )}

                    {/* Option Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={cn(
                          'truncate font-medium transition-colors',
                          'group-hover/option:text-n3rve-600 dark:group-hover/option:text-n3rve-400',
                          option.value === value ? 'text-n3rve-600 dark:text-n3rve-400' : 'text-gray-900 dark:text-white'
                        )}>
                          {option.label}
                        </span>
                        {option.value === value && (
                          <Check className="w-5 h-5 text-n3rve-500 flex-shrink-0 animate-in zoom-in duration-200" />
                        )}
                      </div>
                      {'description' in option && option.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                          {option.description}
                        </p>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
      {props.hint && !error && (
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{props.hint}</p>
      )}
      {error && (
        <p className="mt-2 text-sm text-red-500 dark:text-red-400 flex items-center gap-1.5">
          <span className="w-1 h-1 bg-red-500 rounded-full" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}