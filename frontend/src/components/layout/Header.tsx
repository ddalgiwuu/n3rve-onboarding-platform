import { Bell, User, LogOut, Menu } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import LanguageToggle from '@/components/common/LanguageToggle';
import DarkModeToggle from '@/components/common/DarkModeToggle';
import { useTranslation } from '@/hooks/useTranslation';
import useSafeStore from '@/hooks/useSafeStore';

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

  const handleLogout = () => {
    if (clearAuth) {
      clearAuth();
    }
    toast.success(t('auth.logoutSuccess'));
    navigate('/login');
  };

  return (
    <header className="min-h-[64px] sm:h-16 glass-effect-ultra backdrop-blur-2xl sticky top-0 z-20 flex-shrink-0 animate-slide-in-down border-b border-white/20 dark:border-white/10 shadow-lg shadow-black/5 dark:shadow-black/20">
      <div className="h-full px-4 sm:px-6 flex items-center justify-between py-2 sm:py-0">
        <div className="flex items-center gap-4">
          {/* Hamburger Menu Button */}
          <button
            onClick={onMenuClick}
            data-menu-button
            className="p-2.5 glass-effect-light hover:glass-effect-strong rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 border border-transparent hover:border-white/40 dark:hover:border-white/20 hover:shadow-lg transform-gpu"
          >
            <Menu className="w-6 h-6 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors duration-300" />
          </button>

          <div className="flex items-center gap-3">
            <Link
              to={isAdmin && isInAdminConsole ? '/admin' : '/dashboard'}
              className="flex items-center gap-3"
            >
              <img
                src="/assets/logos/n3rve-logo.svg"
                alt="N3RVE"
                className="h-8 sm:h-8 w-auto cursor-pointer hover:opacity-80 transition-opacity dark:hidden"
              />
              <img
                src="/assets/logos/n3rve-logo-white.svg"
                alt="N3RVE"
                className="h-8 sm:h-8 w-auto cursor-pointer hover:opacity-80 transition-opacity hidden dark:block"
              />
              <div className="hidden sm:block border-l border-gray-300 dark:border-gray-700 pl-3">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t('nav.musicDistribution')}
                </span>
              </div>
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <LanguageToggle />

          {/* Dark Mode Toggle - Force visibility */}
          <DarkModeToggle />

          <button className="p-2.5 glass-effect-light hover:glass-effect-strong rounded-xl transition-all duration-300 hidden sm:block hover:scale-105 active:scale-95 border border-transparent hover:border-white/40 dark:hover:border-white/20 hover:shadow-lg transform-gpu">
            <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors duration-300" />
          </button>

          <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-4 border-l border-white/20 dark:border-white/10">
            <div className="text-right hidden sm:block px-3 py-2 glass-effect-light rounded-xl">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {user?.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {user?.role}
              </p>
            </div>

            <div className="relative group">
              <button
                className="p-2 glass-effect-light hover:glass-effect-strong rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 border border-transparent hover:border-white/40 dark:hover:border-white/20 hover:shadow-lg transform-gpu"
                onClick={() => {
                  // On mobile, directly trigger logout
                  if (window.innerWidth < 640) {
                    handleLogout();
                  }
                }}
              >
                {user?.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt={user.name}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover ring-2 ring-white/20 dark:ring-white/10"
                  />
                ) : (
                  <User className="w-6 h-6 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors duration-300" />
                )}
              </button>

              {/* Desktop dropdown */}
              <div className="hidden sm:block absolute right-0 mt-3 w-48 glass-effect-ultra rounded-2xl border border-white/30 dark:border-white/20 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 backdrop-blur-2xl overflow-hidden">
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-red-500/10 dark:hover:bg-red-400/10 hover:text-red-600 dark:hover:text-red-400 flex items-center gap-3 transition-all duration-300 group/item"
                >
                  <LogOut className="w-4 h-4 group-hover/item:scale-110 group-hover/item:-rotate-12 transition-all duration-300" />
                  {t('nav.logout')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
