import { Outlet } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'

export default function Layout() {
  // Start with sidebar closed by default
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  // Fix sidebar flickering on resize
  useEffect(() => {
    const handleResize = () => {
      // Clear existing timeout
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current)
      }

      // Debounce resize events
      resizeTimeoutRef.current = setTimeout(() => {
        // Close sidebar on mobile when resizing to mobile viewport
        if (window.innerWidth < 1024 && sidebarOpen) {
          setSidebarOpen(false)
        }
      }, 150) // 150ms debounce
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current)
      }
    }
  }, [sidebarOpen])

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-gray-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900 flex">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>
      
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={toggleSidebar} />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen relative">
        {/* Header */}
        <Header onMenuClick={toggleSidebar} />
        
        {/* Main Content */}
        <main className="flex-1 pt-0 overflow-x-hidden">
          <div className="p-4 sm:p-6 max-w-full animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}