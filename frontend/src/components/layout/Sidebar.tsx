import { NavLink, useLocation } from 'react-router-dom';
import { Home, FolderOpen, Upload, FileText, Settings, Users, ClipboardList, Music, X, LogOut, Sparkles, Shield, UserCog, Building2, BarChart3, UserCircle, Folder } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAuthStore } from '@/store/auth.store';
import { useLanguageStore } from '@/store/language.store';
import { useTranslation } from '@/hooks/useTranslationFixed';
import useSafeStore from '@/hooks/useSafeStore';
import { useEffect, useRef } from 'react';

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const user = useSafeStore(useAuthStore, (state) => state.user);
  const logout = useSafeStore(useAuthStore, (state) => state.logout);
  const languageStore = useLanguageStore();
  const { t, language: currentLang } = useTranslation();
  const location = useLocation();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isAdmin = user?.role === 'ADMIN';
  const isInAdminConsole = location.pathname.startsWith('/admin');

  // Color mapping function to avoid dynamic class concatenation
  const getIconColorClasses = (color: string, isActive: boolean) => {
    const colorMap: Record<string, { active: string; inactive: string; hover: string }> = {
      'text-blue-600': {
        active: 'text-blue-600',
        inactive: 'text-gray-500 dark:text-gray-400',
        hover: 'group-hover:text-blue-600'
      },
      'text-n3rve-main': {
        active: 'text-blue-500',
        inactive: 'text-gray-500 dark:text-gray-400',
        hover: 'group-hover:text-blue-500'
      },
      'text-purple-600': {
        active: 'text-gray-600',
        inactive: 'text-gray-500 dark:text-gray-400',
        hover: 'group-hover:text-gray-600'
      },
      'text-green-600': {
        active: 'text-green-600',
        inactive: 'text-gray-500 dark:text-gray-400',
        hover: 'group-hover:text-green-600'
      },
      'text-pink-600': {
        active: 'text-gray-600',
        inactive: 'text-gray-500 dark:text-gray-400',
        hover: 'group-hover:text-gray-600'
      },
      'text-gray-600': {
        active: 'text-gray-600',
        inactive: 'text-gray-500 dark:text-gray-400',
        hover: 'group-hover:text-gray-600'
      },
      'text-red-600': {
        active: 'text-red-600',
        inactive: 'text-gray-500 dark:text-gray-400',
        hover: 'group-hover:text-red-600'
      },
      'text-indigo-600': {
        active: 'text-gray-600',
        inactive: 'text-gray-500 dark:text-gray-400',
        hover: 'group-hover:text-gray-600'
      }
    };

    const colorConfig = colorMap[color] || colorMap['text-gray-600'];
    if (isActive) {
      return colorConfig.active;
    }
    return `${colorConfig.inactive} ${colorConfig.hover}`;
  };

  // Close sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (isOpen && sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        // Check if the click target is the menu button in header
        const target = event.target as HTMLElement;
        if (!target.closest('[data-menu-button]')) {
          onClose();
        }
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      // Add small delay to prevent immediate close when opening
      const timer = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside, { passive: true });
        document.addEventListener('touchstart', handleClickOutside, { passive: true });
        document.addEventListener('keydown', handleEscapeKey);
      }, 200);

      return () => {
        clearTimeout(timer);
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('touchstart', handleClickOutside);
        document.removeEventListener('keydown', handleEscapeKey);
      };
    }
  }, [isOpen, onClose]);

  // Remove automatic sidebar closing on route change - now handled by onClick

  // Make menu items reactive to language changes
  const customerMenuItems = [
    { icon: Home, label: t('nav.dashboard'), path: '/dashboard', color: 'text-blue-600' },
    { icon: Upload, label: t('nav.newSubmission'), path: '/release-submission-modern', color: 'text-blue-600', badge: 'NEW' },
    { icon: Folder, label: 'Release Projects', path: '/release-projects', color: 'text-gray-600' },
    { icon: BarChart3, label: 'Feature Reports', path: '/feature-reports', color: 'text-green-600' },
    { icon: UserCircle, label: 'Artist Roster', path: '/artist-roster', color: 'text-gray-600' },
    { icon: FolderOpen, label: t('nav.submissionHistory'), path: '/submissions', color: 'text-gray-600' },
    { icon: FileText, label: t('nav.guide'), path: '/guide', color: 'text-green-600' },
    { icon: Music, label: t('nav.artistProfile'), path: '/artist-profile-guide', color: 'text-gray-600' },
    { icon: Settings, label: t('nav.settings'), path: '/settings', color: 'text-gray-600' },
    { icon: Building2, label: t('nav.accountManagement'), path: '/account', color: 'text-gray-600' }
  ] as const;

  const adminMenuItems = [
    { icon: Shield, label: t('nav.adminDashboard'), path: '/admin', color: 'text-red-600' },
    { icon: ClipboardList, label: t('nav.submissionManagement'), path: '/admin/submission-management', color: 'text-blue-600' },
    { icon: Users, label: t('nav.customerManagement'), path: '/admin/customers', color: 'text-green-600' },
    { icon: UserCog, label: t('nav.accountManagement'), path: '/admin/accounts', color: 'text-gray-600' },
    { icon: Settings, label: t('nav.settings'), path: '/admin/settings', color: 'text-gray-600' }
  ] as const;

  // Show menu items based on admin status and current console
  const menuItems = isAdmin && isInAdminConsole ? adminMenuItems : customerMenuItems;

  const handleLogout = () => {
    logout?.();
    window.location.href = '/';
  };

  return (
    <>
      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={cn(
          'w-64 sm:w-72 h-screen',
          'fixed top-0 left-0 z-50',
          'bg-surface backdrop-blur-2xl',
          'border-r border-modern',
          'shadow-2xl shadow-black/10 dark:shadow-black/30',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          'transition-all duration-500 ease-in-out',
          'will-change-transform',
          // Legacy: before:from-n3rve-500/5 before:to-purple-500/5
          // Add subtle gradient overlay with modern surface
          'before:absolute before:inset-0 before:bg-gradient-to-b before:from-gray-900/3 before:via-transparent before:to-gray-800/3',
          'dark:before:from-gray-800/3 dark:before:via-transparent dark:before:to-gray-700/3',
          'before:pointer-events-none before:z-0'
        )}
      >
        <div className="h-full flex flex-col relative z-10">
          {/* Header */}
          <div className="p-6 border-b border-modern bg-surface backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Logo with light/dark mode support and modern glass container */}
                <div className="h-10 flex items-center p-2 rounded-xl bg-surface border-modern-soft magnetic glass-shimmer transition-all duration-300">
                  <img
                    src="/assets/logos/n3rve-logo.svg"
                    alt="N3RVE"
                    className="h-full w-auto dark:hidden"
                  />
                  <img
                    src="/assets/logos/n3rve-logo-white.svg"
                    alt="N3RVE"
                    className="h-full w-auto hidden dark:block"
                  />
                </div>
              </div>

              {/* Close button for mobile */}
              <button
                onClick={onClose}
                className="lg:hidden p-2.5 bg-surface border-modern-soft hover:bg-gray-100 dark:hover:bg-gray-800/50 rounded-xl magnetic transition-all duration-300"
              >
                <X className="w-6 h-6 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200" />
              </button>
            </div>
          </div>

          {/* User Profile Section */}
          <div className="mx-4 my-4 p-4 card-premium magnetic transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="relative">
                {/* Legacy: from-n3rve-400 to-n3rve-600 ring-n3rve-400/30 */}
                <div className="w-10 h-10 bg-white/15 dark:bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center ring-2 ring-white/20 dark:ring-white/15 shadow-xl magnetic">
                  <span className="text-white font-semibold text-sm">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                {/* Online indicator with glow */}
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-surface shadow-lg shadow-green-400/50 glow-pulse"></div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {user?.name || 'User'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user?.email}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 overflow-y-auto">
            <div className="space-y-1">
              {menuItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => {
                    // On mobile, close sidebar after navigation with a delay
                    if (window.innerWidth < 1024) {
                      setTimeout(() => {
                        onClose();
                      }, 150);
                    }
                  }}
                  className={({ isActive }) =>
                    cn(
                      'group flex items-center gap-3 px-4 py-4 rounded-2xl transition-all duration-300',
                      'bg-surface border-modern-soft magnetic hover:shadow-xl transform-gpu',
                      'hover:bg-gray-100 dark:hover:bg-gray-800/50',
                      'backdrop-blur-md',
                      // Legacy: bg-n3rve-500/10 border-n3rve-500/30 shadow-n3rve-500/20
                      isActive && 'bg-white/15 dark:bg-white/12 border-white/20 dark:border-white/15 shadow-lg shadow-black/10 dark:shadow-black/30 scale-[1.02]'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className={cn(
                        'p-3 rounded-xl transition-all duration-300 bg-surface border-modern-soft',
                        'group-hover:scale-110 group-hover:shadow-lg magnetic',
                        'group-hover:backdrop-blur-lg',
                        isActive
                          ? 'bg-n3rve-500/20 dark:bg-n3rve-400/20 shadow-inner shadow-n3rve-500/30 dark:shadow-n3rve-400/30 scale-110'
                          : 'group-hover:bg-gray-100 dark:group-hover:bg-gray-700/50'
                      )}>
                        <item.icon className={cn(
                          'w-5 h-5 transition-all duration-300 transform-gpu',
                          'group-hover:scale-110 group-hover:rotate-3',
                          isActive && 'scale-110 text-n3rve-600 dark:text-n3rve-400',
                          !isActive && getIconColorClasses(item.color, isActive)
                        )} />
                      </div>
                      <span className={cn(
                        'font-medium flex-1 transition-all duration-300 whitespace-nowrap',
                        'group-hover:font-semibold',
                        isActive
                          ? 'text-gray-900 dark:text-white font-semibold'
                          : 'text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white'
                      )}>
                        {item.label}
                      </span>
                      {'badge' in item && item.badge && (
                        <span className="inline-flex items-center gap-1 text-xs bg-gradient-to-r from-n3rve-500 to-n3rve-600 text-white px-3 py-1 rounded-full font-semibold glow-pulse border border-n3rve-400/50 shadow-lg shadow-n3rve-500/30 magnetic">
                          <Sparkles className="w-3 h-3 animate-bounce" />
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>

            {/* Admin Toggle */}
            {isAdmin && (
              <div className="mt-6 pt-6 border-t border-white/20 dark:border-white/10">
                <NavLink
                  to={isInAdminConsole ? '/dashboard' : '/admin'}
                  onClick={() => {
                    // On mobile, close sidebar after navigation with a delay
                    if (window.innerWidth < 1024) {
                      setTimeout(() => {
                        onClose();
                      }, 150);
                    }
                  }}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-surface border-modern-soft hover:bg-red-50 dark:hover:bg-red-900/20 magnetic transition-all duration-300 border border-red-500/20 hover:border-red-500/40 transform-gpu"
                >
                  <div className="p-3 bg-red-500/20 dark:bg-red-400/20 rounded-xl bg-surface border-modern-soft magnetic hover:scale-110 transition-all duration-300 shadow-lg shadow-red-500/20">
                    <Shield className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <span className="font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-all duration-300">
                    {isInAdminConsole
                      ? t('nav.toCustomerConsole')
                      : t('nav.toAdminConsole')
                    }
                  </span>
                </NavLink>
              </div>
            )}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-modern bg-surface backdrop-blur-sm">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-surface border-modern-soft hover:bg-red-50 dark:hover:bg-red-900/20 magnetic transition-all duration-300 group border border-transparent hover:border-red-500/30 transform-gpu"
            >
              <div className="p-3 rounded-xl bg-surface border-modern-soft group-hover:bg-red-500/20 dark:group-hover:bg-red-400/20 magnetic group-hover:scale-110 transition-all duration-300 shadow-lg group-hover:shadow-red-500/20">
                <LogOut className="w-5 h-5 text-gray-500 group-hover:text-red-600 dark:group-hover:text-red-400 transition-all duration-300 group-hover:scale-110 group-hover:-rotate-12" />
              </div>
              <span className="font-medium text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-all duration-300 group-hover:font-semibold">
                {t('nav.logout')}
              </span>
            </button>
          </div>
        </div>
      </aside>

      {/* Enhanced Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden transition-all duration-500',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />
    </>
  );
}
