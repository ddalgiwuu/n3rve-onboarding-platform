import { Bell, User, LogOut, Menu, ChevronDown } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import LanguageToggle from '@/components/common/LanguageToggle';
import DarkModeToggle from '@/components/common/DarkModeToggle';
import { useTranslation } from '@/hooks/useTranslationFixed';
import useSafeStore from '@/hooks/useSafeStore';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/utils/cn';

interface HeaderProps {
  onMenuClick?: () => void
}

export default function Header({ onMenuClick }: HeaderProps) {
  const user = useSafeStore(useAuthStore, (state) => state.user);
  const clearAuth = useSafeStore(useAuthStore, (state) => state.clearAuth);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = user?.role === 'ADMIN';
  const isInAdminConsole = location.pathname.startsWith('/admin');

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    if (clearAuth) {
      clearAuth();
    }
    toast.success(t('auth.logoutSuccess'));
    navigate('/login');
  };

  return (
    <header className="h-16 glass-premium sticky top-0 z-50 border-b border-white/20 dark:border-white/10 shadow-lg shadow-purple-500/5 dark:shadow-black/20">
      <div className="h-full max-w-[2000px] mx-auto px-4 sm:px-6 flex items-center justify-between gap-4">

        {/* Left Section - Menu + Logo */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-shrink-0">
          {/* Hamburger Menu */}
          <button
            onClick={onMenuClick}
            data-menu-button
            className={cn(
              "p-2 glass-interactive rounded-xl transition-all duration-300",
              "hover:scale-105 active:scale-95 hover:shadow-md",
              "border border-transparent hover:border-purple-500/20"
            )}
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>

          {/* Logo + Title */}
          <Link
            to={isAdmin && isInAdminConsole ? '/admin' : '/dashboard'}
            className="flex items-center gap-2 sm:gap-3 group min-w-0"
          >
            {/* Logo */}
            <div className="flex-shrink-0">
              <img
                src="/assets/logos/n3rve-logo.svg"
                alt="N3RVE"
                className="h-7 sm:h-8 w-auto transition-all duration-300 dark:hidden group-hover:scale-105"
              />
              <img
                src="/assets/logos/n3rve-logo-white.svg"
                alt="N3RVE"
                className="h-7 sm:h-8 w-auto transition-all duration-300 hidden dark:block group-hover:scale-105"
              />
            </div>

            {/* Separator + Title - Hidden on mobile */}
            <div className="hidden sm:flex items-center gap-3">
              <div className="w-px h-6 bg-gradient-to-b from-transparent via-gray-300 dark:via-gray-700 to-transparent" />
              <span className="text-sm font-semibold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent whitespace-nowrap">
                {t('nav.musicDistribution')}
              </span>
            </div>
          </Link>
        </div>

        {/* Right Section - Controls + Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language Toggle - Compact */}
          <div className="flex-shrink-0">
            <LanguageToggle />
          </div>

          {/* Dark Mode Toggle */}
          <div className="flex-shrink-0">
            <DarkModeToggle />
          </div>

          {/* Notification Bell - Hidden on mobile */}
          <button
            className={cn(
              "hidden sm:flex p-2 glass-interactive rounded-xl transition-all duration-300",
              "hover:scale-105 active:scale-95 hover:shadow-md relative",
              "border border-transparent hover:border-purple-500/20"
            )}
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            {/* Notification Badge */}
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-900" />
          </button>

          {/* Vertical Divider */}
          <div className="w-px h-8 bg-gradient-to-b from-transparent via-gray-300 dark:via-gray-700 to-transparent hidden sm:block" />

          {/* User Profile Dropdown */}
          <div className="relative flex-shrink-0" ref={profileRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className={cn(
                "flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-1.5 glass-interactive rounded-xl",
                "transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]",
                "border border-transparent hover:border-purple-500/20 hover:shadow-md",
                isProfileOpen && "border-purple-500/30 shadow-md scale-[1.02]"
              )}
              aria-expanded={isProfileOpen}
              aria-label="User menu"
            >
              {/* User Info - Always visible */}
              <div className="flex flex-col items-start min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-[120px]">
                  {user?.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  {user?.role}
                </p>
              </div>

              {/* Chevron Icon */}
              <ChevronDown
                className={cn(
                  "w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform duration-300 hidden sm:block",
                  isProfileOpen && "rotate-180"
                )}
              />
            </button>

            {/* Dropdown Menu */}
            {isProfileOpen && (
              <div className={cn(
                "absolute right-0 mt-2 w-56 glass-premium rounded-2xl",
                "border border-white/30 dark:border-white/20 shadow-2xl overflow-hidden",
                "animate-scale-in origin-top-right z-50"
              )}>
                {/* User Info in Dropdown - Mobile */}
                <div className="sm:hidden px-4 py-3 border-b border-white/20 dark:border-white/10">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {user?.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-0.5">
                    {user?.role}
                  </p>
                </div>

                {/* Menu Items */}
                <div className="p-2">
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      handleLogout();
                    }}
                    className={cn(
                      "w-full px-4 py-3 text-left text-sm rounded-xl transition-all duration-300",
                      "flex items-center gap-3 group",
                      "hover:bg-red-500/10 dark:hover:bg-red-400/10",
                      "text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400"
                    )}
                  >
                    <LogOut className="w-4 h-4 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-12" />
                    <span className="font-medium">{t('nav.logout')}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
