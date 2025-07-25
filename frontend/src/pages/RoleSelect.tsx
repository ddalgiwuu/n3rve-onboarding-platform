import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import useSafeStore from '@/hooks/useSafeStore';
import { useTranslation } from '@/hooks/useTranslation';
import { UserCog, Users, ArrowRight, Shield, Globe, Sparkles, Zap } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { useAutoAnimate } from '@formkit/auto-animate/react';

// Floating particles component
const FloatingParticles = () => {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {[...Array(25)].map((_, i) => {
        const randomX = Math.random() * 100
        const randomY = Math.random() * 100
        const duration = Math.random() * 25 + 15
        
        return (
          <div
            key={i}
            className="absolute w-1 h-1 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-float"
            style={{
              left: `${randomX}%`,
              top: `${randomY}%`,
              filter: 'blur(1px)',
              boxShadow: '0 0 8px rgba(168, 85, 247, 0.4)',
              animationDuration: `${duration}s`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        )
      })}
    </div>
  )
}

// Animated text component
const AnimatedText = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay * 1000)
        }
      },
      { threshold: 0.5 }
    )
    
    if (ref.current) {
      observer.observe(ref.current)
    }
    
    return () => {
      if (ref.current) {
        observer.unobserve(ref.current)
      }
    }
  }, [delay])
  
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
    >
      {children}
    </div>
  )
}

export default function RoleSelect() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const setAuth = useSafeStore(useAuthStore, (state) => state.setAuth);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);
  const [containerRef] = useAutoAnimate();

  useEffect(() => {
    // Check if we have temporary auth data
    const accessToken = sessionStorage.getItem('temp_access_token');
    const refreshToken = sessionStorage.getItem('temp_refresh_token');
    const userStr = sessionStorage.getItem('temp_user');

    if (!accessToken || !refreshToken || !userStr) {
      navigate('/login');
    }
  }, [navigate]);

  // Mouse tracking and scroll handling
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ 
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100 
      })
    }
    
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }
    
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('scroll', handleScroll)
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const handleRoleSelect = (role: 'admin' | 'user') => {
    const accessToken = sessionStorage.getItem('temp_access_token');
    const refreshToken = sessionStorage.getItem('temp_refresh_token');
    const userStr = sessionStorage.getItem('temp_user');

    if (accessToken && refreshToken && userStr) {
      const user = JSON.parse(userStr);
      
      // Clear temporary storage
      sessionStorage.removeItem('temp_access_token');
      sessionStorage.removeItem('temp_refresh_token');
      sessionStorage.removeItem('temp_user');

      // Set auth with selected role view
      setAuth?.(user, accessToken, refreshToken);

      // Force a small delay to ensure state is saved
      setTimeout(() => {
        // Navigate based on role selection
        if (role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      }, 100);
    }
  };

  // Parallax calculations
  const parallaxTransform = `translateY(${scrollY * -0.3}px)`
  const blobTransform = `translateY(${scrollY * 0.2}px)`

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Floating particles */}
      <FloatingParticles />
      
      {/* Animated Background with Parallax */}
      <div className="absolute inset-0">
        <div 
          className="absolute top-10 -left-20 w-96 h-96 bg-purple-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob"
          style={{ 
            transform: blobTransform,
            animationDelay: '0s'
          }}
        />
        <div 
          className="absolute top-10 -right-20 w-96 h-96 bg-cyan-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob"
          style={{ 
            transform: blobTransform,
            animationDelay: '2s',
            animationDuration: '25s'
          }}
        />
        <div 
          className="absolute -bottom-10 left-20 w-96 h-96 bg-pink-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob"
          style={{ 
            transform: blobTransform,
            animationDelay: '4s',
            animationDuration: '30s'
          }}
        />
        
        {/* Grid Pattern with mouse interaction */}
        <div 
          className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%239C92AC%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')]"
          style={{
            transform: `translate(${mousePosition.x * 0.05}px, ${mousePosition.y * 0.05}px)`,
            transition: 'transform 0.3s ease-out'
          }}
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
      </div>

      {/* Main Content with Parallax */}
      <div 
        className="container mx-auto px-4 py-16 relative flex items-center justify-center min-h-screen"
        style={{ transform: parallaxTransform }}
      >
        <div 
          className="bg-white/10 dark:bg-gray-900/30 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 rounded-3xl shadow-2xl max-w-4xl w-full p-12 relative overflow-hidden"
          ref={containerRef}
        >
          {/* Card Background Effects */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-cyan-500/5 rounded-3xl"></div>
          
          {/* Sparkle effects inside card */}
          <div className="absolute inset-0 overflow-hidden rounded-3xl">
            {[...Array(15)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-sparkle"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                }}
              >
                <Sparkles className="w-3 h-3 text-white/20" />
              </div>
            ))}
          </div>

          {/* Content */}
          <div className="relative z-10">
            <AnimatedText>
              <div className="text-center mb-12">
                <div className="mb-6 flex justify-center">
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur-lg opacity-75 animate-pulse-glow"/>
                    <div className="relative w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/50">
                      <Zap className="w-10 h-10 text-white animate-bounce" />
                    </div>
                  </div>
                </div>
                
                <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
                  <span className="text-white/90">
                    {t('역할 선택', 'Role Selection', '役割選択')}
                  </span>
                </h1>
                <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
                  {t('어떤 모드로 접속하시겠습니까?', 'Which mode would you like to access?', 'どのモードでアクセスしますか？')}
                </p>
              </div>
            </AnimatedText>

            <AnimatedText delay={0.2}>
              <div className="grid md:grid-cols-2 gap-8">
                {/* Admin Mode Card */}
                <div 
                  className="group relative bg-gradient-to-br from-purple-900/50 to-purple-800/30 backdrop-blur-sm rounded-2xl border border-purple-500/20 hover:scale-[1.02] hover:border-purple-400/40 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/25 overflow-hidden cursor-pointer"
                  onClick={() => handleRoleSelect('admin')}
                  onMouseEnter={(e) => {
                    const card = e.currentTarget
                    card.style.transform = 'scale(1.02) translateY(-8px)'
                  }}
                  onMouseLeave={(e) => {
                    const card = e.currentTarget
                    card.style.transform = 'scale(1) translateY(0)'
                  }}
                >
                  {/* Animated gradient background */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-pink-600/20 to-purple-600/20 animate-gradient-xy"/>
                  </div>
                  
                  {/* Floating particles on hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    {[...Array(8)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute w-1 h-1 bg-purple-400 rounded-full animate-float-up"
                        style={{
                          left: `${15 + i * 10}%`,
                          animationDelay: `${i * 0.1}s`,
                          animationDuration: '2.5s'
                        }}
                      />
                    ))}
                  </div>
                  
                  <div className="relative z-10 p-8 text-center">
                    <div className="relative mb-6">
                      <div className="absolute inset-0 bg-purple-500 rounded-2xl blur-xl opacity-50 group-hover:opacity-80 animate-pulse-slow transition-opacity duration-500"/>
                      <div 
                        className="relative w-24 h-24 mx-auto bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/50 group-hover:scale-110 group-hover:rotate-[360deg] transition-all duration-700"
                      >
                        <UserCog className="w-12 h-12 text-white group-hover:animate-bounce" />
                      </div>
                    </div>
                    
                    <h3 className="text-2xl font-bold mb-3 text-white group-hover:text-purple-300 transition-colors duration-300">
                      {t('관리자 모드', 'Admin Mode', '管理者モード')}
                    </h3>
                    <p className="text-gray-300 leading-relaxed group-hover:text-gray-100 transition-colors duration-300 mb-6">
                      {t('제출물 관리, 사용자 관리, 통계 확인', 'Manage submissions, users, and view statistics', '提出物管理、ユーザー管理、統計確認')}
                    </p>
                    
                    {/* Features list */}
                    <div className="space-y-2 mb-6">
                      <div className="flex items-center justify-center gap-2 text-sm text-purple-300">
                        <Shield className="w-4 h-4" />
                        <span>{t('제출물 관리', 'Manage Submissions', '提出物管理')}</span>
                      </div>
                      <div className="flex items-center justify-center gap-2 text-sm text-purple-300">
                        <Users className="w-4 h-4" />
                        <span>{t('사용자 관리', 'User Management', 'ユーザー管理')}</span>
                      </div>
                      <div className="flex items-center justify-center gap-2 text-sm text-purple-300">
                        <Globe className="w-4 h-4" />
                        <span>{t('통계 분석', 'Analytics', '統計分析')}</span>
                      </div>
                    </div>
                    
                    {/* Hidden arrow that appears on hover */}
                    <div className="opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                      <div className="inline-flex items-center gap-2 text-purple-400 font-medium">
                        <span>{t('접속하기', 'Access Now', 'アクセス')}</span>
                        <ArrowRight className="w-5 h-5 animate-bounce-x" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* User Mode Card */}
                <div 
                  className="group relative bg-gradient-to-br from-cyan-900/50 to-cyan-800/30 backdrop-blur-sm rounded-2xl border border-cyan-500/20 hover:scale-[1.02] hover:border-cyan-400/40 transition-all duration-500 hover:shadow-2xl hover:shadow-cyan-500/25 overflow-hidden cursor-pointer"
                  onClick={() => handleRoleSelect('user')}
                  onMouseEnter={(e) => {
                    const card = e.currentTarget
                    card.style.transform = 'scale(1.02) translateY(-8px)'
                  }}
                  onMouseLeave={(e) => {
                    const card = e.currentTarget
                    card.style.transform = 'scale(1) translateY(0)'
                  }}
                >
                  {/* Animated gradient background */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/20 via-blue-600/20 to-cyan-600/20 animate-gradient-xy"/>
                  </div>
                  
                  {/* Floating particles on hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    {[...Array(8)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute w-1 h-1 bg-cyan-400 rounded-full animate-float-up"
                        style={{
                          left: `${15 + i * 10}%`,
                          animationDelay: `${i * 0.1}s`,
                          animationDuration: '2.5s'
                        }}
                      />
                    ))}
                  </div>
                  
                  <div className="relative z-10 p-8 text-center">
                    <div className="relative mb-6">
                      <div className="absolute inset-0 bg-cyan-500 rounded-2xl blur-xl opacity-50 group-hover:opacity-80 animate-pulse-slow transition-opacity duration-500"/>
                      <div 
                        className="relative w-24 h-24 mx-auto bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/50 group-hover:scale-110 group-hover:rotate-[360deg] transition-all duration-700"
                      >
                        <Users className="w-12 h-12 text-white group-hover:animate-bounce" />
                      </div>
                    </div>
                    
                    <h3 className="text-2xl font-bold mb-3 text-white group-hover:text-cyan-300 transition-colors duration-300">
                      {t('사용자 모드', 'User Mode', 'ユーザーモード')}
                    </h3>
                    <p className="text-gray-300 leading-relaxed group-hover:text-gray-100 transition-colors duration-300 mb-6">
                      {t('릴리즈 제출, 제출 내역 확인', 'Submit releases and view submission history', 'リリース提出、提出履歴確認')}
                    </p>
                    
                    {/* Features list */}
                    <div className="space-y-2 mb-6">
                      <div className="flex items-center justify-center gap-2 text-sm text-cyan-300">
                        <Zap className="w-4 h-4" />
                        <span>{t('릴리즈 제출', 'Submit Releases', 'リリース提出')}</span>
                      </div>
                      <div className="flex items-center justify-center gap-2 text-sm text-cyan-300">
                        <Shield className="w-4 h-4" />
                        <span>{t('제출 내역', 'Submission History', '提出履歴')}</span>
                      </div>
                      <div className="flex items-center justify-center gap-2 text-sm text-cyan-300">
                        <Globe className="w-4 h-4" />
                        <span>{t('배포 현황', 'Distribution Status', '配信状況')}</span>
                      </div>
                    </div>
                    
                    {/* Hidden arrow that appears on hover */}
                    <div className="opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                      <div className="inline-flex items-center gap-2 text-cyan-400 font-medium">
                        <span>{t('접속하기', 'Access Now', 'アクセス')}</span>
                        <ArrowRight className="w-5 h-5 animate-bounce-x" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedText>
          </div>
        </div>
      </div>
    </div>
  );
}