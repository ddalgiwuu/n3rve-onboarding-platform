import { useState, useRef, useEffect } from 'react';
import { X, ChevronDown, Check } from 'lucide-react';

interface MultiSelectProps {
  options: readonly string[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
  max?: number;
}

export default function MultiSelect({ 
  options, 
  value = [], 
  onChange, 
  placeholder = 'Select options...', 
  className = '',
  max
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !value.includes(option)
  );

  const handleSelect = (option: string) => {
    if (!value.includes(option)) {
      if (max && value.length >= max) {
        return;
      }
      onChange([...value, option]);
    }
    setSearchTerm('');
  };

  const handleRemove = (option: string) => {
    onChange(value.filter(v => v !== option));
  };

  const handleInputClick = () => {
    setIsOpen(true);
    inputRef.current?.focus();
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div 
        className="min-h-[42px] px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg cursor-text flex flex-wrap gap-2 items-center"
        onClick={handleInputClick}
      >
        {value.map((item) => (
          <span
            key={item}
            className="inline-flex items-center gap-1 px-2 py-1 text-sm bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-md"
          >
            {item}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRemove(item);
              }}
              className="hover:text-purple-900 dark:hover:text-purple-100"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder={value.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] outline-none bg-transparent text-sm"
        />
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && filteredOptions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-auto">
          {max && (
            <div className="px-3 py-2 text-xs text-gray-500 border-b border-gray-200 dark:border-gray-700">
              {value.length} / {max} selected
            </div>
          )}
          {filteredOptions.map((option) => {
            const isSelected = value.includes(option);
            return (
              <button
                key={option}
                type="button"
                onClick={() => handleSelect(option)}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between ${
                  isSelected ? 'bg-purple-50 dark:bg-purple-900/20' : ''
                }`}
                disabled={!!(max && value.length >= max && !isSelected)}
              >
                <span className={max && value.length >= max && !isSelected ? 'opacity-50' : ''}>
                  {option}
                </span>
                {isSelected && <Check className="w-4 h-4 text-purple-600" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}