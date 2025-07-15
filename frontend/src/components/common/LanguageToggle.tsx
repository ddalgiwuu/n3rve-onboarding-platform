import { useLanguageStore } from '@/store/language.store'
import { cn } from '@/utils/cn'
import { Languages, ChevronDown } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

export default function LanguageToggle() {
  const language = useLanguageStore((state) => state.language)
  const setLanguage = useLanguageStore((state) => state.setLanguage)
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Mobile: Dropdown Style */}
      <div className="sm:hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium glass-effect rounded-lg hover:shadow-lg transition-all duration-300"
        >
          <Languages className="w-4 h-4" />
          <span>{language === 'ko' ? 'KO' : 'EN'}</span>
          <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        
        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute right-0 mt-2 w-32 dropdown-glass rounded-lg z-50 overflow-hidden animate-scale-in">
            <button
              onClick={() => {
                setLanguage('ko')
                setIsOpen(false)
              }}
              className={cn(
                'w-full text-left px-4 py-2 text-sm hover:bg-white/10 dark:hover:bg-white/5 transition-all duration-300',
                language === 'ko' && 'text-purple-600 dark:text-purple-400 font-medium bg-purple-50/50 dark:bg-purple-900/20'
              )}
            >
              한국어
            </button>
            <button
              onClick={() => {
                setLanguage('en')
                setIsOpen(false)
              }}
              className={cn(
                'w-full text-left px-4 py-2 text-sm hover:bg-white/10 dark:hover:bg-white/5 transition-all duration-300',
                language === 'en' && 'text-purple-600 dark:text-purple-400 font-medium bg-purple-50/50 dark:bg-purple-900/20'
              )}
            >
              English
            </button>
          </div>
        )}
      </div>

      {/* Desktop: Toggle Buttons */}
      <div className="hidden sm:flex items-center gap-1 glass-effect rounded-full p-1">
        <button
          onClick={() => setLanguage('ko')}
          className={cn(
            'px-3 py-1 text-sm rounded-full transition-all duration-300 whitespace-nowrap',
            language === 'ko'
              ? 'glass-effect text-gray-900 dark:text-white shadow-md'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/20'
          )}
        >
          한국어
        </button>
        <button
          onClick={() => setLanguage('en')}
          className={cn(
            'px-3 py-1 text-sm rounded-full transition-all duration-300 whitespace-nowrap',
            language === 'en'
              ? 'glass-effect text-gray-900 dark:text-white shadow-md'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/20'
          )}
        >
          English
        </button>
      </div>
    </div>
  )
}