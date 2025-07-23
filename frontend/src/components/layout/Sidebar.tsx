import { NavLink, useLocation } from 'react-router-dom'
import { Home, FolderOpen, Upload, FileText, Settings, Users, ClipboardList, Music, X, LogOut, Sparkles, Shield } from 'lucide-react'
import { cn } from '@/utils/cn'
import { useAuthStore } from '@/store/auth.store'
import { useLanguageStore } from '@/store/language.store'
import useSafeStore from '@/hooks/useSafeStore'
import { useEffect, useRef } from 'react'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const user = useSafeStore(useAuthStore, (state) => state.user)
  const logout = useSafeStore(useAuthStore, (state) => state.logout)
  const language = useSafeStore(useLanguageStore, (state) => state.language)
  const location = useLocation()
  const sidebarRef = useRef<HTMLDivElement>(null)
  const isAdmin = user?.role === 'ADMIN'
  const isInAdminConsole = location.pathname.startsWith('/admin')
  
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
      }
    }
    
    const colorConfig = colorMap[color] || colorMap['text-gray-600']
    if (isActive) {
      return colorConfig.active
    }
    return `${colorConfig.inactive} ${colorConfig.hover}`
  }
  
  // Close sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (isOpen && sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        // Check if the click target is the menu button in header
        const target = event.target as HTMLElement
        if (!target.closest('[data-menu-button]')) {
          onClose()
        }
      }
    }

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      // Add small delay to prevent immediate close when opening
      const timer = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside, { passive: true })
        document.addEventListener('touchstart', handleClickOutside, { passive: true })
        document.addEventListener('keydown', handleEscapeKey)
      }, 200)

      return () => {
        clearTimeout(timer)
        document.removeEventListener('mousedown', handleClickOutside)
        document.removeEventListener('touchstart', handleClickOutside)
        document.removeEventListener('keydown', handleEscapeKey)
      }
    }
  }, [isOpen, onClose])

  // Remove automatic sidebar closing on route change - now handled by onClick
  
  // Make menu items reactive to language changes
  const customerMenuItems = [
    { icon: Home, label: language === 'ko' ? '대시보드' : 'Dashboard', path: '/dashboard', color: 'text-blue-600' },
    { icon: Upload, label: language === 'ko' ? '새 음원 제출' : 'New Submission', path: '/release-submission-modern', color: 'text-n3rve-main', badge: 'NEW' },
    { icon: FolderOpen, label: language === 'ko' ? '제출 내역' : 'Submissions', path: '/submissions', color: 'text-purple-600' },
    { icon: FileText, label: language === 'ko' ? '가이드' : 'Guide', path: '/guide', color: 'text-green-600' },
    { icon: Music, label: language === 'ko' ? '아티스트 프로필' : 'Artist Profile', path: '/artist-profile-guide', color: 'text-pink-600' },
    { icon: Settings, label: language === 'ko' ? '설정' : 'Settings', path: '/settings', color: 'text-gray-600' },
  ] as const
  
  const adminMenuItems = [
    { icon: Shield, label: language === 'ko' ? '관리자 대시보드' : 'Admin Dashboard', path: '/admin', color: 'text-red-600' },
    { icon: ClipboardList, label: language === 'ko' ? '제출 관리' : 'Submission Management', path: '/admin/submission-management', color: 'text-blue-600' },
    { icon: Users, label: language === 'ko' ? '고객 관리' : 'Customer Management', path: '/admin/customers', color: 'text-green-600' },
    { icon: Settings, label: language === 'ko' ? '설정' : 'Settings', path: '/admin/settings', color: 'text-gray-600' },
  ] as const
  
  // Show menu items based on admin status and current console
  const menuItems = isAdmin && isInAdminConsole ? adminMenuItems : customerMenuItems
  
  const handleLogout = () => {
    logout?.()
    window.location.href = '/'
  }
  
  return (
    <>      
      {/* Sidebar */}
      <aside 
        ref={sidebarRef}
        className={cn(
          "w-64 sm:w-72 h-screen",
          "fixed top-0 left-0 z-50",
          "glass-effect-strong backdrop-blur-xl",
          "border-r border-gray-200/50 dark:border-gray-700/50",
          "shadow-2xl",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "transition-all duration-300 ease-in-out",
          "will-change-transform"
        )}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-gray-200/30 dark:border-gray-700/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Logo with light/dark mode support */}
                <div className="h-10 flex items-center">
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
                className="lg:hidden p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>
          </div>

          {/* User Profile Section */}
          <div className="px-6 py-4 border-b border-gray-200/30 dark:border-gray-700/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center">
                <span className="text-gray-600 dark:text-gray-300 font-semibold">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
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
                        onClose()
                      }, 150)
                    }
                  }}
                  className={({ isActive }) =>
                    cn(
                      'group flex items-center gap-3 px-4 py-4 rounded-xl transition-all duration-200',
                      'hover:bg-gray-100/50 dark:hover:bg-gray-800/50 hover:shadow-lg',
                      isActive && 'bg-blue-50/70 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 shadow-lg'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className={cn(
                        "p-2.5 rounded-lg transition-all duration-200",
                        isActive 
                          ? "bg-blue-100/70 dark:bg-blue-800/50 shadow-inner" 
                          : "group-hover:bg-gray-200/50 dark:group-hover:bg-gray-700/50"
                      )}>
                        <item.icon className={cn(
                          "w-5 h-5 transition-colors duration-150",
                          getIconColorClasses(item.color, isActive)
                        )} />
                      </div>
                      <span className={cn(
                        "font-medium flex-1",
                        isActive 
                          ? "text-gray-900 dark:text-white" 
                          : "text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
                      )}>
                        {item.label}
                      </span>
                      {'badge' in item && item.badge && (
                        <span className="inline-flex items-center gap-1 text-xs bg-n3rve-main/10 text-n3rve-main px-2 py-0.5 rounded-full font-semibold animate-pulse">
                          <Sparkles className="w-3 h-3" />
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
              <div className="mt-6 pt-6 border-t border-gray-200/30 dark:border-gray-700/30">
                <NavLink
                  to={isInAdminConsole ? '/dashboard' : '/admin'}
                  onClick={() => {
                    // On mobile, close sidebar after navigation with a delay
                    if (window.innerWidth < 1024) {
                      setTimeout(() => {
                        onClose()
                      }, 150)
                    }
                  }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 transition-all duration-200 hover:shadow-lg"
                >
                  <div className="p-2 bg-red-100/70 dark:bg-red-900/40 rounded-lg">
                    <Shield className="w-5 h-5 text-red-600" />
                  </div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
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
          <div className="p-4 border-t border-gray-200/30 dark:border-gray-700/30">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-all duration-200 group hover:shadow-lg"
            >
              <div className="p-2 rounded-lg group-hover:bg-gray-200/50 dark:group-hover:bg-gray-700/50 transition-all duration-200">
                <LogOut className="w-5 h-5 text-gray-500 group-hover:text-red-600" />
              </div>
              <span className="font-medium text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white">
                {language === 'ko' ? '로그아웃' : 'Logout'}
              </span>
            </button>
          </div>
        </div>
      </aside>
      
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/30 z-40 lg:hidden transition-opacity duration-300",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />
    </>
  )
}