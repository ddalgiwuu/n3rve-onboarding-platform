import { NavLink, useLocation } from 'react-router-dom';
import { Home, FolderOpen, Upload, FileText, Settings, Users, ClipboardList, Music, X, LogOut, Sparkles, Shield, UserCog, Building2 } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAuthStore } from '@/store/auth.store';
import { useLanguageStore } from '@/store/language.store';
import useSafeStore from '@/hooks/useSafeStore';
import { useEffect, useRef } from 'react';

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const user = useSafeStore(useAuthStore, (state) => state.user);
  const logout = useSafeStore(useAuthStore, (state) => state.logout);
  const language = useSafeStore(useLanguageStore, (state) => state.language);
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
        active: 'text-n3rve-main',
        inactive: 'text-gray-500 dark:text-gray-400',
        hover: 'group-hover:text-n3rve-main'
      },
      'text-purple-600': {
        active: 'text-purple-600',
        inactive: 'text-gray-500 dark:text-gray-400',
        hover: 'group-hover:text-purple-600'
      },
      'text-green-600': {
        active: 'text-green-600',
        inactive: 'text-gray-500 dark:text-gray-400',
        hover: 'group-hover:text-green-600'
      },
      'text-pink-600': {
        active: 'text-pink-600',
        inactive: 'text-gray-500 dark:text-gray-400',
        hover: 'group-hover:text-pink-600'
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
        active: 'text-indigo-600',
        inactive: 'text-gray-500 dark:text-gray-400',
        hover: 'group-hover:text-indigo-600'
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
    { icon: Home, label: language === 'ko' ? '대시보드' : language === 'en' ? 'Dashboard' : 'ダッシュボード', path: '/dashboard', color: 'text-blue-600' },
    { icon: Upload, label: language === 'ko' ? '새 음원 제출' : language === 'en' ? 'New Submission' : '新規提出', path: '/release-submission-modern', color: 'text-n3rve-main', badge: 'NEW' },
    { icon: FolderOpen, label: language === 'ko' ? '제출 내역' : language === 'en' ? 'Submissions' : '提出履歴', path: '/submissions', color: 'text-purple-600' },
    { icon: FileText, label: language === 'ko' ? '가이드' : language === 'en' ? 'Guide' : 'ガイド', path: '/guide', color: 'text-green-600' },
    { icon: Music, label: language === 'ko' ? '아티스트 프로필' : language === 'en' ? 'Artist Profile' : 'アーティストプロフィール', path: '/artist-profile-guide', color: 'text-pink-600' },
    { icon: Building2, label: language === 'ko' ? '계정 관리' : language === 'en' ? 'Account Management' : 'アカウント管理', path: '/account', color: 'text-indigo-600' },
    { icon: Settings, label: language === 'ko' ? '설정' : language === 'en' ? 'Settings' : '設定', path: '/settings', color: 'text-gray-600' }
  ] as const;

  const adminMenuItems = [
    { icon: Shield, label: language === 'ko' ? '관리자 대시보드' : language === 'en' ? 'Admin Dashboard' : '管理者ダッシュボード', path: '/admin', color: 'text-red-600' },
    { icon: ClipboardList, label: language === 'ko' ? '제출 관리' : language === 'en' ? 'Submission Management' : '提出管理', path: '/admin/submission-management', color: 'text-blue-600' },
    { icon: Users, label: language === 'ko' ? '고객 관리' : language === 'en' ? 'Customer Management' : '顧客管理', path: '/admin/customers', color: 'text-green-600' },
    { icon: UserCog, label: language === 'ko' ? '계정 관리' : language === 'en' ? 'Account Management' : 'アカウント管理', path: '/admin/accounts', color: 'text-purple-600' },
    { icon: Settings, label: language === 'ko' ? '설정' : language === 'en' ? 'Settings' : '設定', path: '/admin/settings', color: 'text-gray-600' }
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
          'glass-effect-ultra backdrop-blur-2xl',
          'border-r border-white/30 dark:border-white/20',
          'shadow-2xl shadow-black/10 dark:shadow-black/30',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          'transition-all duration-500 ease-in-out',
          'will-change-transform',
          // Add subtle gradient overlay
          'before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/10 before:via-transparent before:to-white/5',
          'dark:before:from-white/5 dark:before:via-transparent dark:before:to-white/2',
          'before:pointer-events-none before:z-0'
        )}
      >
        <div className="h-full flex flex-col relative z-10">
          {/* Header */}
          <div className="p-6 border-b border-white/20 dark:border-white/10 bg-white/5 dark:bg-white/5 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Logo with light/dark mode support and glass container */}
                <div className="h-10 flex items-center p-2 rounded-xl glass-effect-light hover:glass-effect transition-all duration-300">
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
                className="lg:hidden p-2.5 glass-effect-light hover:glass-effect-strong rounded-xl transition-all duration-300 hover:scale-105 active:scale-95"
              >
                <X className="w-6 h-6 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200" />
              </button>
            </div>
          </div>

          {/* User Profile Section */}
          <div className="mx-4 my-4 p-4 glass-effect-light rounded-2xl border border-white/30 dark:border-white/20 hover:glass-effect transition-all duration-300 hover:shadow-lg">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-n3rve-400 to-n3rve-600 rounded-full flex items-center justify-center ring-2 ring-white/20 dark:ring-white/10 shadow-lg">
                  <span className="text-white font-semibold text-sm">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                {/* Online indicator */}
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white dark:border-gray-800 animate-pulse"></div>
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
                      'glass-effect-light hover:glass-effect-strong hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]',
                      'border border-transparent hover:border-white/40 dark:hover:border-white/20',
                      'hover:-translate-y-0.5 transform-gpu',
                      'backdrop-blur-md',
                      isActive && 'glass-purple border-n3rve-500/30 dark:border-n3rve-400/30 shadow-lg shadow-n3rve-500/20 dark:shadow-n3rve-400/20 scale-[1.02]'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className={cn(
                        'p-3 rounded-xl transition-all duration-300 glass-effect-light',
                        'group-hover:glass-effect-strong group-hover:scale-110 group-hover:shadow-lg',
                        'group-hover:backdrop-blur-lg',
                        isActive
                          ? 'bg-n3rve-500/20 dark:bg-n3rve-400/20 shadow-inner shadow-n3rve-500/30 dark:shadow-n3rve-400/30 scale-110'
                          : 'group-hover:bg-white/30 dark:group-hover:bg-white/10'
                      )}>
                        <item.icon className={cn(
                          'w-5 h-5 transition-all duration-300 transform-gpu',
                          'group-hover:scale-110 group-hover:rotate-3',
                          isActive && 'scale-110 text-n3rve-600 dark:text-n3rve-400',
                          !isActive && getIconColorClasses(item.color, isActive)
                        )} />
                      </div>
                      <span className={cn(
                        'font-medium flex-1 transition-all duration-300',
                        'group-hover:font-semibold',
                        isActive
                          ? 'text-gray-900 dark:text-white font-semibold'
                          : 'text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white'
                      )}>
                        {item.label}
                      </span>
                      {'badge' in item && item.badge && (
                        <span className="inline-flex items-center gap-1 text-xs glass-effect-light bg-n3rve-main/20 text-n3rve-main px-3 py-1 rounded-full font-semibold animate-pulse border border-n3rve-main/30 shadow-lg shadow-n3rve-main/20">
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
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl glass-effect-strong hover:glass-effect-ultra transition-all duration-300 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] border border-red-500/20 hover:border-red-500/40 hover:-translate-y-0.5 transform-gpu"
                >
                  <div className="p-3 bg-red-500/20 dark:bg-red-400/20 rounded-xl glass-effect-light hover:scale-110 transition-all duration-300 shadow-lg shadow-red-500/20">
                    <Shield className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <span className="font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-all duration-300">
                    {isInAdminConsole
                      ? (language === 'ko' ? '고객 콘솔로' : 'To Customer Console')
                      : (language === 'ko' ? '관리자 콘솔로' : 'To Admin Console')
                    }
                  </span>
                </NavLink>
              </div>
            )}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-white/20 dark:border-white/10 bg-white/5 dark:bg-white/5 backdrop-blur-sm">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl glass-effect-light hover:glass-effect-strong transition-all duration-300 group hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] border border-transparent hover:border-red-500/30 hover:-translate-y-0.5 transform-gpu"
            >
              <div className="p-3 rounded-xl glass-effect-light group-hover:bg-red-500/20 dark:group-hover:bg-red-400/20 group-hover:scale-110 transition-all duration-300 shadow-lg group-hover:shadow-red-500/20">
                <LogOut className="w-5 h-5 text-gray-500 group-hover:text-red-600 dark:group-hover:text-red-400 transition-all duration-300 group-hover:scale-110 group-hover:-rotate-12" />
              </div>
              <span className="font-medium text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-all duration-300 group-hover:font-semibold">
                {language === 'ko' ? '로그아웃' : 'Logout'}
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
