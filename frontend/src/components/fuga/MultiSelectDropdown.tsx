import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, X, Search } from 'lucide-react';

interface MultiSelectDropdownProps {
  options: readonly string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  label: string;
  placeholder?: string;
  maxSelections?: number;
  searchable?: boolean;
  required?: boolean;
  error?: string;
  language?: 'ko' | 'en';
}

export default function MultiSelectDropdown({
  options,
  selected,
  onChange,
  label,
  placeholder = 'Select options...',
  maxSelections,
  searchable = true,
  required = false,
  error,
  language = 'ko',
}: MultiSelectDropdownProps) {
  const t = (ko: string, en: string) => language === 'ko' ? ko : en;

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  const filteredOptions = searchable
    ? options.filter((opt) =>
        opt.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

  // Calculate dropdown position
  useEffect(() => {
    if (!isOpen || !buttonRef.current) return;

    const updatePosition = () => {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + 8,
          left: rect.left,
          width: rect.width,
        });
      }
    };

    updatePosition();
    window.addEventListener('scroll', updatePosition, { capture: true, passive: true });
    window.addEventListener('resize', updatePosition, { passive: true });

    return () => {
      window.removeEventListener('scroll', updatePosition, { capture: true });
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((s) => s !== option));
    } else {
      if (maxSelections && selected.length >= maxSelections) {
        return;
      }
      onChange([...selected, option]);
    }
  };

  const removeOption = (option: string) => {
    onChange(selected.filter((s) => s !== option));
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
        {maxSelections && (
          <span className="text-xs text-gray-500 ml-2">
            ({selected.length}/{maxSelections})
          </span>
        )}
      </label>

      {/* Selected Items */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selected.map((item) => (
            <div
              key={item}
              className="flex items-center gap-2 px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg text-sm"
            >
              <span>{item}</span>
              <button
                onClick={() => removeOption(item)}
                className="hover:text-purple-900 dark:hover:text-purple-100"
                type="button"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Dropdown Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={maxSelections ? selected.length >= maxSelections : false}
        className={`
          w-full px-4 py-3 border rounded-lg text-left
          flex items-center justify-between
          bg-white dark:bg-gray-700
          ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
          ${maxSelections && selected.length >= maxSelections ? 'opacity-50 cursor-not-allowed' : 'hover:border-purple-500 cursor-pointer'}
          focus:ring-2 focus:ring-purple-500 transition-all
        `}
      >
        <span className={selected.length === 0 ? 'text-gray-500' : 'text-gray-900 dark:text-white'}>
          {selected.length === 0
            ? placeholder
            : `${selected.length} ${t('개 선택됨', 'selected')}`}
        </span>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {error && <p className="text-xs text-red-500">{error}</p>}

      {/* Dropdown Menu - Portal */}
      {isOpen && dropdownPosition.width > 0 && createPortal(
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div
            style={{
              position: 'fixed',
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              width: `${dropdownPosition.width}px`,
              zIndex: 9999,
            }}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl max-h-80 overflow-hidden flex flex-col"
          >
            {/* Search Input */}
            {searchable && (
              <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('검색...', 'Search...')}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-sm"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {filteredOptions.length} {t('개 결과', 'results')}
                </p>
              </div>
            )}

            {/* Options List */}
            <div className="overflow-y-auto">
              {filteredOptions.length > 0 ? (
                <div className="p-2">
                  {filteredOptions.map((option) => {
                    const isSelected = selected.includes(option);
                    const isDisabled = !isSelected && maxSelections && selected.length >= maxSelections;

                    return (
                      <button
                        key={option}
                        onClick={() => !isDisabled && toggleOption(option)}
                        disabled={isDisabled}
                        className={`
                          w-full px-3 py-2.5 text-left rounded-lg text-sm
                          flex items-center justify-between
                          transition-colors
                          ${isSelected ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' : ''}
                          ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}
                        `}
                        type="button"
                      >
                        <span className="flex-1">{option}</span>
                        {isSelected && <Check className="w-4 h-4 text-purple-600" />}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 text-center text-sm text-gray-500">
                  {t('검색 결과가 없습니다', 'No results found')}
                </div>
              )}
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
