import { Bell, User, LogOut, SwitchCamera, Shield, Users, Menu } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import LanguageToggle from '@/components/common/LanguageToggle'
import DarkModeToggle from '@/components/common/DarkModeToggle'
import { useLanguageStore } from '@/store/language.store'

interface HeaderProps {
  onMenuClick?: () => void
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user, clearAuth } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const { language, t } = useLanguageStore() // Get t function from store
  const isAdmin = user?.role === 'ADMIN'
  const isInAdminConsole = location.pathname.startsWith('/admin')

  const handleLogout = () => {
    clearAuth()
    toast.success(t('auth.logoutSuccess'))
    navigate('/login')
  }

  const handleConsoleSwitch = () => {
    if (isInAdminConsole) {
      navigate('/dashboard')
    } else {
      navigate('/admin')
    }
  }

  return (
    <header className="min-h-[56px] sm:h-16 glass-effect border-b border-white/20 dark:border-white/10 sticky top-0 z-20 flex-shrink-0 backdrop-blur-xl animate-slide-in-down">
      <div className="h-full px-3 sm:px-6 flex items-center justify-between py-2 sm:py-0">
        <div className="flex items-center gap-4">
          {/* Hamburger Menu Button */}
          <button
            onClick={onMenuClick}
            data-menu-button
            className="p-2 hover:bg-white/10 dark:hover:bg-white/5 rounded-lg transition-all duration-300 hover:shadow-lg"
          >
            <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          
          <div className="flex items-center gap-3">
            <Link 
              to={isAdmin && isInAdminConsole ? '/admin' : '/dashboard'} 
              className="flex items-center gap-3"
            >
              <img 
                src="/assets/logos/n3rve-logo.svg" 
                alt="N3RVE" 
                className="h-6 sm:h-8 w-auto cursor-pointer hover:opacity-80 transition-opacity dark:hidden"
              />
              <img 
                src="/assets/logos/n3rve-logo-white.svg" 
                alt="N3RVE" 
                className="h-6 sm:h-8 w-auto cursor-pointer hover:opacity-80 transition-opacity hidden dark:block"
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
          {/* Admin Console Switcher */}
          {isAdmin && (
            <button
              onClick={handleConsoleSwitch}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 btn-primary rounded-lg text-white font-medium transform transition-all duration-300 hover:scale-105"
              title={isInAdminConsole ? (language === 'ko' ? '소비자 콘솔로 전환' : 'Switch to Consumer Console') : (language === 'ko' ? '관리자 콘솔로 전환' : 'Switch to Admin Console')}
            >
              {isInAdminConsole ? (
                <>
                  <Users className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                  <span className="hidden sm:inline text-sm font-medium">
                    {language === 'ko' ? '소비자 콘솔' : 'Consumer'}
                  </span>
                </>
              ) : (
                <>
                  <Shield className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                  <span className="hidden sm:inline text-sm font-medium">
                    {language === 'ko' ? '관리자 콘솔' : 'Admin'}
                  </span>
                </>
              )}
              <SwitchCamera className="w-3.5 sm:w-4 h-3.5 sm:h-4 hidden sm:block" />
            </button>
          )}
          
          <LanguageToggle />
          
          <DarkModeToggle />
          
          <button className="p-2 hover:bg-white/10 dark:hover:bg-white/5 rounded-lg transition-all duration-300 hover:shadow-lg hidden sm:block">
            <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
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
                className="p-1.5 sm:p-2 hover:bg-white/10 dark:hover:bg-white/5 rounded-lg transition-all duration-300 hover:shadow-lg"
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
                  <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                )}
              </button>
              
              {/* Desktop dropdown */}
              <div className="hidden sm:block absolute right-0 mt-2 w-48 dropdown-glass rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform group-hover:translate-y-1">
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-white/10 dark:hover:bg-white/5 flex items-center gap-2 transition-all duration-300"
                >
                  <LogOut className="w-4 h-4" />
                  {t('auth.logout')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}