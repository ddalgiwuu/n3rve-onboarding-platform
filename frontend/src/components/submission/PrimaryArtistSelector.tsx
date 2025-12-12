import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { User, Search, Plus, X, Star } from 'lucide-react';
import { useSavedArtistsStore } from '@/contexts/SavedArtistsContext';
import { useTranslation } from '@/hooks/useTranslationFixed';

interface PrimaryArtistSelectorProps {
  value: string;
  onChange: (value: string) => void;
  onShowForm?: () => void;
  className?: string;
}

export function PrimaryArtistSelector({
  value,
  onChange,
  onShowForm,
  className
}: PrimaryArtistSelectorProps) {
  const { language } = useTranslation();
  const { artists, searchArtists, recordArtistUsage } = useSavedArtistsStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredArtists, setFilteredArtists] = useState(artists);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

  const translate = (ko: string, en: string) => language === 'ko' ? ko : en;

  // Calculate dropdown position dynamically with scroll/resize handling
  useEffect(() => {
    if (!showDropdown || !inputRef.current) return;

    const updatePosition = () => {
      if (inputRef.current) {
        const rect = inputRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + 8,
          left: rect.left,
          width: rect.width,
        });
      }
    };

    // Initial position
    updatePosition();

    // Update on scroll and resize
    window.addEventListener('scroll', updatePosition, { capture: true, passive: true });
    window.addEventListener('resize', updatePosition, { passive: true });

    return () => {
      window.removeEventListener('scroll', updatePosition, { capture: true });
      window.removeEventListener('resize', updatePosition);
    };
  }, [showDropdown]);

  useEffect(() => {
    if (searchQuery.trim()) {
      setFilteredArtists(searchArtists(searchQuery));
      setShowDropdown(true);
    } else {
      setFilteredArtists(artists);
      setShowDropdown(false);
    }
  }, [searchQuery, artists]);

  const handleSelect = async (artistId: string, artistName: string) => {
    onChange(artistName);
    setSearchQuery('');
    setShowDropdown(false);

    // Record usage
    try {
      await recordArtistUsage(artistId);
    } catch (error) {
      console.error('Failed to record artist usage:', error);
    }
  };

  const handleClear = () => {
    onChange('');
    setSearchQuery('');
  };

  const selectedArtist = artists.find(a => a.name === value);

  return (
    <div className={clsx('space-y-3', className)}>
      <label className="block text-sm font-medium text-white">
        {translate('주 아티스트 (Primary Artist)', 'Primary Artist')}
        <span className="text-red-400 ml-1">*</span>
      </label>

      {/* Selected Artist Display */}
      {value && !searchQuery && (
        <div className="
          flex items-center justify-between p-4
          bg-gradient-to-r from-purple-500/20 to-pink-500/20
          backdrop-blur-md border border-purple-500/30
          rounded-xl
        ">
          <div className="flex items-center gap-3">
            <User size={20} className="text-purple-400" />
            <div>
              <p className="font-medium text-white">{value}</p>
              <p className="text-xs text-gray-400">
                {translate('선택된 아티스트', 'Selected Artist')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="
              p-2 rounded-lg
              bg-red-500/10 hover:bg-red-500/20
              border border-red-500/30 hover:border-red-500/50
              text-red-400 hover:text-red-300
              transition-all
            "
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Search Input */}
      {!value && (
        <div className="relative">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowDropdown(true)}
              placeholder={translate('아티스트 이름 검색...', 'Search artist name...')}
              className="
                w-full pl-12 pr-4 py-3 rounded-xl
                bg-white/5 backdrop-blur-md border border-white/10
                text-white placeholder-gray-500
                outline-none focus:ring-2 focus:ring-purple-500/50
                transition-all
              "
            />
          </div>

          {/* Dropdown - Using Portal */}
          {showDropdown && dropdownPosition.width > 0 && createPortal(
            <>
              {/* Backdrop to close dropdown */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowDropdown(false)}
              />
              {/* Dropdown */}
              <motion.div
                ref={dropdownRef}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  position: 'fixed',
                  top: `${dropdownPosition.top}px`,
                  left: `${dropdownPosition.left}px`,
                  width: `${dropdownPosition.width}px`,
                  zIndex: 9999,
                }}
                className="
                  bg-gray-900/95 backdrop-blur-xl
                  border border-white/10 rounded-xl
                  shadow-2xl shadow-black/50
                  max-h-80 overflow-y-auto
                  scrollbar-thin scrollbar-thumb-purple-500/50 scrollbar-track-transparent
                "
              >
              {/* Search Results */}
              {filteredArtists.length > 0 ? (
                <div className="p-2">
                  {filteredArtists.slice(0, 10).map((artist) => (
                    <button
                      key={artist.id}
                      type="button"
                      onClick={() => handleSelect(artist.id, artist.name)}
                      className="
                        w-full flex items-center gap-3 p-3
                        rounded-lg hover:bg-white/10
                        text-left transition-all
                        group
                      "
                    >
                      <User size={16} className="text-gray-400 group-hover:text-purple-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {artist.name}
                        </p>
                        {artist.usageCount > 0 && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <Star size={10} className="text-yellow-400 fill-current" />
                            <span className="text-xs text-gray-400">
                              {translate(`${artist.usageCount}회 사용`, `Used ${artist.usageCount} times`)}
                            </span>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-sm text-gray-400">
                  {translate('검색 결과가 없습니다', 'No results found')}
                </div>
              )}

              {/* Add New Artist Button */}
              {onShowForm && (
                <div className="border-t border-white/10 p-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDropdown(false);
                      onShowForm();
                    }}
                    className="
                      w-full flex items-center gap-2 p-3
                      rounded-lg hover:bg-purple-500/10
                      text-purple-400 hover:text-purple-300
                      transition-all
                    "
                  >
                    <Plus size={16} />
                    <span className="text-sm font-medium">
                      {translate('새 아티스트 등록', 'Register New Artist')}
                    </span>
                  </button>
                </div>
              )}
              </motion.div>
            </>,
            document.body
          )}
        </div>
      )}

      {/* Help Text */}
      <p className="text-xs text-gray-400">
        {translate(
          '이 릴리즈의 주 아티스트를 선택하세요',
          'Select the primary artist for this release'
        )}
      </p>
    </div>
  );
}
