import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function DarkModeToggle() {
  // Initialize state based on current DOM state and localStorage
  const [isDark, setIsDark] = useState(() => {
    // Check if dark class is already present (set by App.tsx)
    const hasDarkClass = document.documentElement.classList.contains('dark') || document.body.classList.contains('dark')
    const theme = localStorage.getItem('theme')
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    
    // Return true if any of these conditions are met
    return hasDarkClass || theme === 'dark' || (!theme && systemPrefersDark)
  })

  // Sync state with DOM on mount and listen for changes
  useEffect(() => {
    // Ensure body element exists before trying to add classes
    if (!document.body) return

    // If state says dark, add dark class to both html and body
    if (isDark) {
      document.documentElement.classList.add('dark')
      document.body.classList.add('dark')
      document.documentElement.style.colorScheme = 'dark'
    } else {
      document.documentElement.classList.remove('dark')
      document.body.classList.remove('dark')
      document.documentElement.style.colorScheme = 'light'
    }

    // Listen for storage changes (for syncing across tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'theme') {
        const newTheme = e.newValue
        const shouldBeDark = newTheme === 'dark'
        setIsDark(shouldBeDark)
        
        if (shouldBeDark) {
          document.documentElement.classList.add('dark')
          document.body.classList.add('dark')
          document.documentElement.style.colorScheme = 'dark'
        } else {
          document.documentElement.classList.remove('dark')
          document.body.classList.remove('dark')
          document.documentElement.style.colorScheme = 'light'
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [isDark])

  const toggleDarkMode = () => {
    const newIsDark = !isDark
    
    // Toggling dark mode
    
    // Update DOM - both html and body elements
    if (newIsDark) {
      document.documentElement.classList.add('dark')
      document.body.classList.add('dark')
      document.documentElement.style.colorScheme = 'dark'
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      document.body.classList.remove('dark')
      document.documentElement.style.colorScheme = 'light'
      localStorage.setItem('theme', 'light')
    }
    
    // Update state
    setIsDark(newIsDark)
    
    // Dark mode toggled
  }

  return (
    <div className="relative group">
      {/* Switch Style Toggle */}
      <button
        onClick={toggleDarkMode}
        className={`
          relative inline-flex h-8 w-14 items-center rounded-full
          transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2
          hover:shadow-lg ${isDark ? 'bg-indigo-600 dark:bg-indigo-600/70' : 'bg-gray-300 dark:bg-gray-600'}
          border border-gray-300 dark:border-gray-600
        `}
        aria-label={isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}
      >
        <span
          className={`
            ${isDark ? 'translate-x-7' : 'translate-x-1'}
            relative flex h-6 w-6 transform rounded-full bg-white transition-transform duration-300
            shadow-lg items-center justify-center hover:scale-110
          `}
        >
          {isDark ? (
            <Sun className="w-3.5 h-3.5 text-amber-500" />
          ) : (
            <Moon className="w-3.5 h-3.5 text-indigo-600" />
          )}
        </span>
        
        {/* Background Icons */}
        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 flex items-center justify-center">
          <Sun className={`w-3.5 h-3.5 transition-opacity duration-300 ${isDark ? 'opacity-30 text-gray-600 dark:text-gray-400' : 'opacity-0'}`} />
        </span>
        <span className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center justify-center">
          <Moon className={`w-3.5 h-3.5 transition-opacity duration-300 ${isDark ? 'opacity-0' : 'opacity-30 text-gray-700 dark:text-gray-500'}`} />
        </span>
      </button>
      
      {/* Tooltip */}
      <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-800 text-xs rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-50 shadow-lg">
        {isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}
      </div>
    </div>
  )
}