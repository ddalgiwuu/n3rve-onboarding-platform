import { useLanguageStore } from '@/contexts/LanguageContext';
import { useTranslation } from '@/hooks/useTranslationFixed';
import { cn } from '@/utils/cn';
import { Languages, ChevronDown, Globe } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface LanguageOption {
  code: 'ko' | 'en' | 'ja';
  label: string;
  flag: string;
  nativeLabel: string;
}

export default function LanguageToggle() {
  const { language, setLanguage } = useLanguageStore();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const languages: LanguageOption[] = [
    { code: 'ko', label: t('language.korean'), flag: '🇰🇷', nativeLabel: '한국어' },
    { code: 'en', label: t('language.english'), flag: '🇺🇸', nativeLabel: 'English' },
    { code: 'ja', label: t('language.japanese'), flag: '🇯🇵', nativeLabel: '日本語' }
  ];

  const currentLang = languages.find(lang => lang.code === language);
  const currentIndex = languages.findIndex(lang => lang.code === language);

  // Fixed button width and spacing for consistent layout
  const BUTTON_WIDTH = 80; // Fixed width in pixels
  const BUTTON_GAP = 4; // Gap between buttons in pixels
  const CONTAINER_PADDING = 4; // Container padding in pixels

  // Calculate indicator position based on current language index
  const getIndicatorTransform = () => {
    const translateX = currentIndex * (BUTTON_WIDTH + BUTTON_GAP) + CONTAINER_PADDING;
    return `translateX(${translateX}px)`;
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = (newLang: 'ko' | 'en' | 'ja') => {
    if (newLang === language || isAnimating) return;

    setIsAnimating(true);
    setLanguage(newLang);
    setIsOpen(false);

    // Reset animation state after transition completes
    setTimeout(() => {
      setIsAnimating(false);
    }, 300);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Mobile: Modern Dropdown with Glassmorphism */}
      <div className="sm:hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'group relative flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium rounded-2xl',
            'glass-premium hover-glass-lift micro-bounce nav-micro-interaction',
            'border border-white/30 dark:border-white/20 backdrop-blur-xl',
            'hover:shadow-lg hover:shadow-purple-500/10 dark:hover:shadow-purple-500/20',
            'focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:ring-offset-2 focus:ring-offset-transparent',
            'transition-all duration-300 ease-out',
            isOpen && 'shadow-lg shadow-purple-500/20 scale-105'
          )}
          aria-expanded={isOpen}
          aria-label={`Current language: ${currentLang?.nativeLabel}. Click to change language`}
        >
          {/* Animated background gradient */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/5 via-pink-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Content */}
          <div className="relative flex items-center gap-2.5">
            <div className="relative">
              <Globe className="w-4 h-4 text-purple-600 dark:text-purple-400 icon-rotate-hover" />
              <div className="absolute -inset-1 bg-purple-500/20 rounded-full opacity-0 group-hover:opacity-100 animate-pulse-glow" />
            </div>
            <span className="text-lg font-medium">{currentLang?.flag}</span>
            <span className="font-semibold text-gray-700 dark:text-gray-200">
              {currentLang?.code.toUpperCase()}
            </span>
            <ChevronDown className={cn(
              'w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform duration-300 ease-out',
              isOpen && 'rotate-180 text-purple-600 dark:text-purple-400'
            )} />
          </div>
        </button>

        {/* Enhanced Dropdown Menu */}
        {isOpen && (
          <div className={cn(
            'absolute right-0 mt-3 w-56 glass-premium rounded-2xl shadow-2xl',
            'border border-white/30 dark:border-white/20 backdrop-blur-2xl',
            'overflow-hidden z-50 animate-scale-in',
            'shadow-purple-500/10 dark:shadow-purple-500/20'
          )}>
            <div className="p-2 space-y-1">
              {languages.map((lang, index) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={cn(
                    'group relative w-full flex items-center gap-3 px-4 py-3 text-sm rounded-xl',
                    'transition-all duration-300 ease-out',
                    'hover:glass-enhanced hover:shadow-md hover:scale-[1.02]',
                    'focus:outline-none focus:ring-2 focus:ring-purple-500/50',
                    language === lang.code
                      ? 'glass-btn-primary font-semibold shadow-md scale-[1.02]'
                      : 'hover:bg-white/10 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300'
                  )}
                  style={{
                    animationDelay: `${index * 50}ms`
                  }}
                >
                  {/* Selection indicator */}
                  <div className={cn(
                    'w-2 h-2 rounded-full transition-all duration-300',
                    language === lang.code
                      ? 'bg-purple-500 shadow-md shadow-purple-500/50'
                      : 'bg-transparent group-hover:bg-gray-300 dark:group-hover:bg-gray-600'
                  )} />

                  <span className="text-xl">{lang.flag}</span>

                  <div className="flex-1 text-left">
                    <div className="font-medium">{lang.nativeLabel}</div>
                    <div className="text-xs opacity-70">{lang.label}</div>
                  </div>

                  {/* Active indicator */}
                  {language === lang.code && (
                    <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse-glow" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Desktop: Improved Pill Toggle with Perfect Alignment */}
      <div className="hidden sm:block">
        <div
          ref={containerRef}
          className={cn(
            'relative rounded-2xl glass-premium max-w-fit',
            'border border-white/30 dark:border-white/20 backdrop-blur-xl',
            'shadow-lg shadow-black/5 dark:shadow-black/20',
            'transition-all duration-300 ease-out',
            'hover:shadow-xl hover:shadow-purple-500/10'
          )}
          style={{
            padding: `${CONTAINER_PADDING}px`,
            width: `${languages.length * BUTTON_WIDTH + (languages.length - 1) * BUTTON_GAP + CONTAINER_PADDING * 2}px`
          }}
          role="radiogroup"
          aria-label="Language selection"
        >
          {/* Floating indicator with perfect positioning */}
          <div
            className={cn(
              'absolute rounded-xl transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]',
              'bg-gradient-to-r from-purple-500/20 to-blue-500/20',
              'border border-purple-500/30 backdrop-blur-sm',
              'shadow-lg shadow-purple-500/20 dark:shadow-purple-500/30',
              'z-[1]'
            )}
            style={{
              width: `${BUTTON_WIDTH}px`,
              height: '36px',
              top: `${CONTAINER_PADDING}px`,
              transform: getIndicatorTransform(),
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.25), rgba(59, 130, 246, 0.15))'
            }}
          >
            {/* Subtle shimmer effect */}
            <div className="absolute inset-0 rounded-xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-pulse opacity-50" />
            </div>
          </div>

          {/* Language buttons with perfect spacing */}
          <div className="relative flex items-center gap-1">
            {languages.map((lang, index) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                    e.preventDefault();
                    const newIndex = e.key === 'ArrowLeft'
                      ? (index - 1 + languages.length) % languages.length
                      : (index + 1) % languages.length;
                    const nextButton = e.currentTarget.parentElement?.children[newIndex] as HTMLButtonElement;
                    nextButton?.focus();
                  }
                }}
                className={cn(
                  'relative flex items-center justify-center gap-1.5 rounded-xl z-[2]',
                  'h-9 text-sm font-medium transition-all duration-300 ease-out',
                  'hover:scale-[1.02] active:scale-[0.98]',
                  'focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:ring-offset-1',
                  // Text color transitions
                  language === lang.code
                    ? 'text-purple-700 dark:text-purple-200 font-semibold'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                )}
                style={{ width: `${BUTTON_WIDTH}px` }}
                disabled={isAnimating}
                role="radio"
                aria-checked={language === lang.code}
                aria-label={`Switch to ${lang.nativeLabel}`}
                tabIndex={language === lang.code ? 0 : -1}
              >
                {/* Flag emoji */}
                <span className={cn(
                  'text-sm transition-transform duration-200',
                  language === lang.code ? 'scale-110' : 'scale-100'
                )}>
                  {lang.flag}
                </span>

                {/* Language code */}
                <span className={cn(
                  'text-xs font-bold uppercase tracking-wide',
                  'transition-all duration-200'
                )}>
                  {lang.code}
                </span>
              </button>
            ))}
          </div>

          {/* Subtle ambient glow */}
          <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-purple-500/5 to-blue-500/5 opacity-50 blur-lg -z-10" />
        </div>
      </div>
    </div>
  );
}
