import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { Music, ChevronDown, X } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslationFixed';
import { FUGA_GENRES, GENRE_SUBGENRES, type FugaGenre } from '@/constants/fuga-data';

interface GenreSelectorProps {
  mainGenre: string;
  subgenres: string[];
  onMainGenreChange: (genre: string) => void;
  onSubgenresChange: (subgenres: string[]) => void;
  maxSubgenres?: number;
  className?: string;
}

export function GenreSelector({
  mainGenre,
  subgenres,
  onMainGenreChange,
  onSubgenresChange,
  maxSubgenres = 3,
  className
}: GenreSelectorProps) {
  const { language } = useTranslation();
  const [showGenreDropdown, setShowGenreDropdown] = useState(false);
  const [showSubgenreDropdown, setShowSubgenreDropdown] = useState(false);

  // Refs for dropdown positioning
  const genreInputRef = useRef<HTMLDivElement>(null);
  const subgenreInputRef = useRef<HTMLDivElement>(null);
  const [genreDropdownPosition, setGenreDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const [subgenreDropdownPosition, setSubgenreDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

  const translate = (ko: string, en: string) => language === 'ko' ? ko : en;

  // Get available subgenres for selected main genre
  const availableSubgenres = mainGenre ? GENRE_SUBGENRES[mainGenre as FugaGenre] || [] : [];

  // Calculate genre dropdown position dynamically
  useEffect(() => {
    if (!showGenreDropdown || !genreInputRef.current) return;

    const updatePosition = () => {
      if (genreInputRef.current) {
        const rect = genreInputRef.current.getBoundingClientRect();
        setGenreDropdownPosition({
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
  }, [showGenreDropdown]);

  // Calculate subgenre dropdown position dynamically
  useEffect(() => {
    if (!showSubgenreDropdown || !subgenreInputRef.current) return;

    const updatePosition = () => {
      if (subgenreInputRef.current) {
        const rect = subgenreInputRef.current.getBoundingClientRect();
        setSubgenreDropdownPosition({
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
  }, [showSubgenreDropdown]);

  // Clear subgenres when main genre changes
  useEffect(() => {
    if (mainGenre && subgenres.length > 0) {
      // Filter out subgenres that are not valid for the new main genre
      const validSubgenres = subgenres.filter(sg => availableSubgenres.includes(sg));
      if (validSubgenres.length !== subgenres.length) {
        onSubgenresChange(validSubgenres);
      }
    }
  }, [mainGenre]);

  const handleSubgenreToggle = (subgenre: string) => {
    if (subgenres.includes(subgenre)) {
      onSubgenresChange(subgenres.filter(s => s !== subgenre));
    } else if (subgenres.length < maxSubgenres) {
      onSubgenresChange([...subgenres, subgenre]);
    }
  };

  return (
    <div className={clsx('space-y-6', className)}>
      {/* Main Genre */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-white">
          {translate('메인 장르 (Main Genre)', 'Main Genre')}
          <span className="text-red-400 ml-1">*</span>
        </label>

        <div ref={genreInputRef} className="relative">
          <button
            type="button"
            onClick={() => setShowGenreDropdown(!showGenreDropdown)}
            className={clsx(
              'w-full flex items-center justify-between px-4 py-3 rounded-xl',
              'bg-white/5 backdrop-blur-md border border-white/10',
              'text-white hover:border-purple-500/50',
              'outline-none focus:ring-2 focus:ring-purple-500/50',
              'transition-all',
              showGenreDropdown && 'border-purple-500/50 ring-2 ring-purple-500/50'
            )}
          >
            <span className={mainGenre ? 'text-white' : 'text-gray-500'}>
              {mainGenre || translate('장르를 선택하세요', 'Select a genre')}
            </span>
            <ChevronDown size={18} className={clsx(
              'text-gray-400 transition-transform',
              showGenreDropdown && 'rotate-180'
            )} />
          </button>

          {showGenreDropdown && createPortal(
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowGenreDropdown(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  position: 'fixed',
                  top: `${genreDropdownPosition.top}px`,
                  left: `${genreDropdownPosition.left}px`,
                  width: `${genreDropdownPosition.width}px`,
                  zIndex: 9999,
                }}
                className="
                  bg-gray-900/95 backdrop-blur-xl
                  border border-white/10 rounded-xl
                  shadow-2xl shadow-black/50
                  max-h-64 overflow-y-auto
              "
            >
              <div className="p-2">
                {FUGA_GENRES.map((genre) => (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => {
                      onMainGenreChange(genre);
                      setShowGenreDropdown(false);
                    }}
                    className={clsx(
                      'w-full px-4 py-2 rounded-lg text-left transition-all',
                      mainGenre === genre
                        ? 'bg-purple-500/20 text-purple-300'
                        : 'text-gray-300 hover:bg-white/10'
                    )}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </motion.div>
            </>,
            document.body
          )}
        </div>

        <p className="text-xs text-gray-400">
          {translate('22개 장르 중 선택', 'Choose from 22 genres')}
        </p>
      </div>

      {/* Subgenres */}
      {mainGenre && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-white">
            {translate('서브 장르 (Subgenres)', 'Subgenres')}
            <span className="text-gray-400 ml-2 text-xs">
              ({translate(`최대 ${maxSubgenres}개`, `Max ${maxSubgenres}`)})
            </span>
          </label>

          {/* Selected Subgenres */}
          {subgenres.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {subgenres.map((subgenre) => (
                <div
                  key={subgenre}
                  className="
                    flex items-center gap-2 px-3 py-1.5
                    bg-gradient-to-r from-purple-500/20 to-pink-500/20
                    border border-purple-500/30
                    rounded-lg
                  "
                >
                  <Music size={14} className="text-purple-400" />
                  <span className="text-sm text-white">{subgenre}</span>
                  <button
                    type="button"
                    onClick={() => handleSubgenreToggle(subgenre)}
                    className="text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Subgenre Dropdown */}
          <div ref={subgenreInputRef} className="relative">
            <button
              type="button"
              onClick={() => setShowSubgenreDropdown(!showSubgenreDropdown)}
              disabled={subgenres.length >= maxSubgenres}
              className={clsx(
                'w-full flex items-center justify-between px-4 py-3 rounded-xl',
                'bg-white/5 backdrop-blur-md border border-white/10',
                'text-white hover:border-purple-500/50',
                'outline-none focus:ring-2 focus:ring-purple-500/50',
                'transition-all',
                showSubgenreDropdown && 'border-purple-500/50 ring-2 ring-purple-500/50',
                subgenres.length >= maxSubgenres && 'opacity-50 cursor-not-allowed'
              )}
            >
              <span className="text-gray-500">
                {subgenres.length >= maxSubgenres
                  ? translate('최대 개수 선택됨', 'Max selections reached')
                  : translate('서브장르 추가...', 'Add subgenres...')
                }
              </span>
              <ChevronDown size={18} className={clsx(
                'text-gray-400 transition-transform',
                showSubgenreDropdown && 'rotate-180'
              )} />
            </button>

            {showSubgenreDropdown && createPortal(
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowSubgenreDropdown(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    position: 'fixed',
                    top: `${subgenreDropdownPosition.top}px`,
                    left: `${subgenreDropdownPosition.left}px`,
                    width: `${subgenreDropdownPosition.width}px`,
                    zIndex: 9999,
                  }}
                  className="
                    bg-gray-900/95 backdrop-blur-xl
                    border border-white/10 rounded-xl
                  shadow-2xl shadow-black/50
                  max-h-64 overflow-y-auto
                "
              >
                <div className="p-2">
                  {availableSubgenres.length > 0 ? (
                    availableSubgenres.map((subgenre) => (
                      <button
                        key={subgenre}
                        type="button"
                        onClick={() => handleSubgenreToggle(subgenre)}
                        disabled={!subgenres.includes(subgenre) && subgenres.length >= maxSubgenres}
                        className={clsx(
                          'w-full px-4 py-2 rounded-lg text-left transition-all',
                          subgenres.includes(subgenre)
                            ? 'bg-purple-500/20 text-purple-300'
                            : 'text-gray-300 hover:bg-white/10',
                          !subgenres.includes(subgenre) && subgenres.length >= maxSubgenres && 'opacity-50 cursor-not-allowed'
                        )}
                      >
                        {subgenre}
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-center text-sm text-gray-400">
                      {translate('사용 가능한 서브장르가 없습니다', 'No subgenres available')}
                    </div>
                  )}
                </div>
              </motion.div>
              </>,
              document.body
            )}
          </div>

          <p className="text-xs text-gray-400">
            {mainGenre && availableSubgenres.length > 0 && (
              <>
                {availableSubgenres.length} {translate('개 서브장르 사용 가능', 'subgenres available')}
              </>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
