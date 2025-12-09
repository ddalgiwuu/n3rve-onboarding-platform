import { Outlet } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

export default function Layout() {
  // Start with sidebar closed by default on mobile, open on desktop
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 1024);
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstRender = useRef(true);

  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  // Handle initial render and resize
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const handleResize = () => {
      // Clear existing timeout
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }

      // Debounce resize events
      resizeTimeoutRef.current = setTimeout(() => {
        const isDesktop = window.innerWidth >= 1024;
        // Only update if crossing the breakpoint
        setSidebarOpen(current => {
          if (isDesktop && !current) return true;
          if (!isDesktop && current) return false;
          return current;
        });
      }, 150); // 150ms debounce
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50/50 via-white to-pink-50/50 dark:from-gray-900 dark:via-purple-900/10 dark:to-gray-900 flex relative overflow-hidden">
      {/* Enhanced Background decoration with glass overlay */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-white/20 dark:from-gray-900/30 dark:via-transparent dark:to-gray-900/20" />

        {/* Animated blobs */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

        {/* Additional floating elements */}
        <div className="absolute top-20 right-20 w-32 h-32 bg-gradient-to-br from-cyan-300 to-cyan-500 rounded-full mix-blend-multiply filter blur-2xl opacity-15 animate-float" style={{ '--duration': '8s' } as any}></div>
        <div className="absolute bottom-32 right-32 w-24 h-24 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-full mix-blend-multiply filter blur-2xl opacity-15 animate-float" style={{ '--duration': '12s' } as any}></div>
        <div className="absolute top-40 left-1/4 w-20 h-20 bg-gradient-to-br from-emerald-300 to-emerald-500 rounded-full mix-blend-multiply filter blur-2xl opacity-15 animate-float" style={{ '--duration': '10s' } as any}></div>
      </div>

      {/* Glass noise texture overlay */}
      <div className="fixed inset-0 opacity-[0.015] dark:opacity-[0.02] pointer-events-none bg-noise"></div>

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen relative backdrop-blur-[0.5px]">
        {/* Header */}
        <Header onMenuClick={toggleSidebar} />

        {/* Main Content with improved container */}
        <main className="flex-1 pt-0 overflow-x-hidden relative">
          {/* Content container with responsive padding and max-width */}
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-4 sm:py-6 lg:py-8 max-w-7xl">
            {/* Page content wrapper with fade-in animation */}
            <div className="animate-fade-in">
              <Outlet />
            </div>
          </div>

          {/* Floating scroll indicator for long pages */}
          <div className="fixed bottom-6 right-6 opacity-30 hover:opacity-60 transition-opacity duration-300 pointer-events-none lg:block hidden">
            <div className="w-1 h-20 bg-gradient-to-t from-purple-500 to-transparent rounded-full glass-effect-light"></div>
          </div>
        </main>
      </div>
    </div>
  );
}
