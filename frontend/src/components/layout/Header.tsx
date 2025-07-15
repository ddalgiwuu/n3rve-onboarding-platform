import { Bell, User, LogOut, Menu } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import LanguageToggle from '@/components/common/LanguageToggle'
import DarkModeToggle from '@/components/common/DarkModeToggle'
import { useLanguageStore } from '@/store/language.store'
import useSafeStore from '@/hooks/useSafeStore'

interface HeaderProps {
  onMenuClick?: () => void
}

export default function Header({ onMenuClick }: HeaderProps) {
  const user = useSafeStore(useAuthStore, (state) => state.user)
  const clearAuth = useSafeStore(useAuthStore, (state) => state.clearAuth)
  const language = useSafeStore(useLanguageStore, (state) => state.language)
  const t = (ko: string, en: string) => language === 'ko' ? ko : en
  const navigate = useNavigate()
  const location = useLocation()
  const isAdmin = user?.role === 'ADMIN'
  const isInAdminConsole = location.pathname.startsWith('/admin')

  const handleLogout = () => {
    if (clearAuth) {
      clearAuth()
    }
    toast.success(t('로그아웃되었습니다', 'Logged out successfully'))
    navigate('/login')
  }


  return (
    <header className="min-h-[64px] sm:h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-20 flex-shrink-0 animate-slide-in-down">
      <div className="h-full px-4 sm:px-6 flex items-center justify-between py-2 sm:py-0">
        <div className="flex items-center gap-4">
          {/* Hamburger Menu Button */}
          <button
            onClick={onMenuClick}
            data-menu-button
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" />
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
                  Music Distribution
                </span>
              </div>
            </Link>
          </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4">
          <LanguageToggle />
          
          <DarkModeToggle />
          
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors hidden sm:block">
            <Bell className="w-6 h-6 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" />
          </button>
          
          <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-4 border-l border-gray-200 dark:border-gray-700">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {user?.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {user?.role}
              </p>
            </div>
            
            <div className="relative group">
              <button 
                className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
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
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-6 h-6 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" />
                )}
              </button>
              
              {/* Desktop dropdown */}
              <div className="hidden sm:block absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform group-hover:translate-y-1">
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  {t('로그아웃', 'Logout')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}