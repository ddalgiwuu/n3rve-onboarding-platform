import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown, Search } from 'lucide-react';
import { clsx } from 'clsx';

interface Tag {
  id: string;
  label: string;
  category?: string;
}

interface TagMultiSelectProps {
  label?: string;
  placeholder?: string;
  value: string[];
  onChange: (value: string[]) => void;
  options: Tag[];
  maxSelections?: number;
  required?: boolean;
  helpText?: string;
  className?: string;
  variant?: 'default' | 'glass' | 'glass-enhanced';
  groupByCategory?: boolean;
}

export function TagMultiSelect({
  label,
  placeholder = 'Select tags...',
  value = [],
  onChange,
  options,
  maxSelections,
  required = false,
  helpText,
  className,
  variant = 'glass',
  groupByCategory = false
}: TagMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter options based on search
  const filteredOptions = options.filter(option =>
    !value.includes(option.id) &&
    option.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group options by category if enabled
  const groupedOptions = groupByCategory
    ? filteredOptions.reduce((acc, option) => {
      const category = option.category || 'Other';
      if (!acc[category]) acc[category] = [];
      acc[category].push(option);
      return acc;
    }, {} as Record<string, Tag[]>)
    : { 'All': filteredOptions };

  // Selected tags
  const selectedTags = value
    .map(id => options.find(opt => opt.id === id))
    .filter(Boolean) as Tag[];

  const handleToggle = (tagId: string) => {
    if (value.includes(tagId)) {
      // Remove tag
      onChange(value.filter(id => id !== tagId));
    } else {
      // Add tag (if max not reached)
      if (!maxSelections || value.length < maxSelections) {
        onChange([...value, tagId]);
      }
    }
  };

  const handleRemove = (tagId: string) => {
    onChange(value.filter(id => id !== tagId));
  };

  const isMaxReached = maxSelections && value.length >= maxSelections;

  const variantClasses = {
    default: 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700',
    glass: 'bg-white/5 backdrop-blur-md border-white/10',
    'glass-enhanced': 'bg-gray-800 dark:bg-gray-900 border-gray-600 dark:border-gray-700 shadow-lg'
  };

  return (
    <div className={clsx('relative', className)} ref={containerRef}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium mb-2 text-white">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}

      {/* Selected tags display */}
      <div className={clsx(
        'min-h-[44px] px-4 py-2 rounded-xl border transition-all',
        variantClasses[variant],
        'focus-within:ring-2 focus-within:ring-purple-500/50'
      )}>
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedTags.map(tag => (
            <motion.div
              key={tag.id}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', duration: 0.2 }}
              className="
                flex items-center gap-1.5 px-3 py-1.5
                bg-gradient-to-r from-purple-500 to-pink-500
                rounded-lg text-sm font-medium text-white
                group hover:shadow-lg transition-shadow
              "
            >
              <span>{tag.label}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(tag.id);
                }}
                className="
                  p-0.5 rounded hover:bg-white/20
                  transition-colors
                "
                aria-label={`Remove ${tag.label}`}
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </div>

        {/* Dropdown trigger */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={isMaxReached}
          className={clsx(
            'flex items-center justify-between w-full text-left',
            'text-gray-400 hover:text-white transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          <span className="text-sm">
            {value.length === 0 && placeholder}
            {value.length > 0 && maxSelections &&
              `${value.length} / ${maxSelections} selected`}
            {value.length > 0 && !maxSelections &&
              `${value.length} selected`}
            {isMaxReached && ' (Max reached)'}
          </span>
          <ChevronDown
            size={18}
            className={clsx(
              'transition-transform',
              isOpen && 'rotate-180'
            )}
          />
        </button>
      </div>

      {/* Help text */}
      {helpText && (
        <p className="mt-1 text-sm text-gray-400">{helpText}</p>
      )}

      {/* Dropdown menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            style={{ zIndex: 9999, position: 'absolute' }}
            className={clsx(
              'w-full mt-2 rounded-xl border overflow-hidden',
              'max-h-80 overflow-y-auto',
              variantClasses[variant],
              'shadow-2xl'
            )}
          >
            {/* Search input */}
            <div className="sticky top-0 p-3 border-b border-gray-700 bg-gray-800 dark:bg-gray-900">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-700 dark:bg-gray-800">
                <Search size={16} className="text-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="flex-1 bg-transparent outline-none text-sm text-white placeholder-gray-500"
                />
              </div>
            </div>

            {/* Options list */}
            <div className="p-2">
              {Object.entries(groupedOptions).map(([category, categoryOptions]) => (
                <div key={category} className="mb-3 last:mb-0">
                  {groupByCategory && categoryOptions.length > 0 && (
                    <div className="text-xs text-gray-300 uppercase px-3 py-2 font-medium bg-gray-700 dark:bg-gray-800">
                      {category}
                    </div>
                  )}

                  {categoryOptions.map(option => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => {
                        handleToggle(option.id);
                        setSearchQuery('');
                      }}
                      disabled={isMaxReached && !value.includes(option.id)}
                      className={clsx(
                        'w-full flex items-center justify-between gap-3',
                        'px-3 py-2 rounded-lg text-left text-sm',
                        'hover:bg-gray-700 dark:hover:bg-gray-800 transition-colors',
                        'disabled:opacity-50 disabled:cursor-not-allowed',
                        'text-white'
                      )}
                    >
                      <span>{option.label}</span>
                      {value.includes(option.id) && (
                        <div className="w-5 h-5 rounded bg-purple-500 flex items-center justify-center">
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path
                              d="M10 3L4.5 8.5L2 6"
                              stroke="white"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}

                  {categoryOptions.length === 0 && !groupByCategory && (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      No options found
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
