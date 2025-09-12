import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/utils/cn';

export default function DarkModeToggle() {
  // Initialize state based on current DOM state and localStorage
  const [isDark, setIsDark] = useState(() => {
    const hasDarkClass = document.documentElement.classList.contains('dark') || document.body.classList.contains('dark');
    const theme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return hasDarkClass || theme === 'dark' || (!theme && systemPrefersDark);
  });

  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (!document.body) return;

    if (isDark) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'theme') {
        const newTheme = e.newValue;
        const shouldBeDark = newTheme === 'dark';
        setIsDark(shouldBeDark);

        if (shouldBeDark) {
          document.documentElement.classList.add('dark');
          document.body.classList.add('dark');
          document.documentElement.style.colorScheme = 'dark';
        } else {
          document.documentElement.classList.remove('dark');
          document.body.classList.remove('dark');
          document.documentElement.style.colorScheme = 'light';
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [isDark]);

  const toggleDarkMode = () => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    const newIsDark = !isDark;

    // Add a slight delay for smooth animation
    setTimeout(() => {
      if (newIsDark) {
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark');
        document.documentElement.style.colorScheme = 'dark';
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.body.classList.remove('dark');
        document.documentElement.style.colorScheme = 'light';
        localStorage.setItem('theme', 'light');
      }

      setIsDark(newIsDark);
      setIsAnimating(false);
    }, 150);
  };

  return (
    <div className="relative group">
      <button
        onClick={toggleDarkMode}
        disabled={isAnimating}
        className={cn(
          "relative p-2.5 rounded-2xl transition-all duration-500 ease-out",
          "glass-premium hover-glass-lift nav-micro-interaction",
          "border border-white/30 dark:border-white/20 backdrop-blur-xl",
          "hover:shadow-lg hover:shadow-purple-500/10 dark:hover:shadow-purple-500/20",
          "focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:ring-offset-2 focus:ring-offset-transparent",
          "group-hover:scale-105 active:scale-95 micro-bounce",
          isAnimating && "pointer-events-none"
        )}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {/* Animated background gradient */}
        <div className={cn(
          "absolute inset-0 rounded-2xl transition-all duration-500 ease-out opacity-0 group-hover:opacity-100",
          isDark 
            ? "bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-blue-500/10"
            : "bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-amber-500/10"
        )} />
        
        {/* Icon container with advanced animations */}
        <div className="relative flex items-center justify-center w-6 h-6">
          {/* Sun icon */}
          <Sun className={cn(
            "absolute inset-0 w-6 h-6 transition-all duration-500 ease-out transform-gpu",
            isDark 
              ? "opacity-0 scale-50 rotate-180 text-transparent" 
              : "opacity-100 scale-100 rotate-0 text-amber-500 drop-shadow-lg",
            "group-hover:scale-110"
          )} />
          
          {/* Moon icon */}
          <Moon className={cn(
            "absolute inset-0 w-6 h-6 transition-all duration-500 ease-out transform-gpu",
            isDark 
              ? "opacity-100 scale-100 rotate-0 text-indigo-400 drop-shadow-lg" 
              : "opacity-0 scale-50 -rotate-180 text-transparent",
            "group-hover:scale-110"
          )} />

          {/* Glow effect */}
          <div className={cn(
            "absolute -inset-2 rounded-full transition-all duration-500 ease-out",
            isDark
              ? "bg-indigo-500/20 opacity-0 group-hover:opacity-100 animate-pulse-glow"
              : "bg-amber-500/20 opacity-0 group-hover:opacity-100 animate-pulse-glow"
          )} />
        </div>

        {/* Loading spinner for animation state */}
        {isAnimating && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
          </div>
        )}
      </button>

      {/* Enhanced tooltip */}
      <div className={cn(
        "absolute -bottom-12 left-1/2 -translate-x-1/2 px-3 py-2 rounded-xl",
        "glass-premium border border-white/30 dark:border-white/20",
        "text-xs font-medium text-gray-700 dark:text-gray-200",
        "opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none",
        "whitespace-nowrap z-50 shadow-lg backdrop-blur-xl",
        "transform translate-y-2 group-hover:translate-y-0"
      )}>
        {isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        
        {/* Tooltip arrow */}
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 glass-premium border-l border-t border-white/30 dark:border-white/20" />
      </div>
    </div>
  );
}