import { Link } from 'react-router-dom'
import { ArrowRight, Music, Shield, Globe, Headphones, CheckCircle, Star } from 'lucide-react'
import { useTranslation } from '@/store/language.store'
import { useAuthStore } from '@/store/auth.store'
import useSafeStore from '@/hooks/useSafeStore'
import LanguageToggle from '@/components/common/LanguageToggle'
import DarkModeToggle from '@/components/common/DarkModeToggle'

export default function HomePage() {
  const { t, language } = useTranslation()
  
  // Debug: Check if auth is causing issues
  const isAuthenticated = useSafeStore(useAuthStore, (state) => state.isAuthenticated)
  console.log('[HomePage] isAuthenticated:', isAuthenticated)
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/50 to-blue-50/50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
      {/* Language & Dark Mode Toggle */}
      <div className="absolute top-6 right-6 z-10 flex items-center gap-4">
        <DarkModeToggle />
        <LanguageToggle />
      </div>
      
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5 dark:opacity-5">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 dark:bg-purple-700 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-xl animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-300 dark:bg-blue-700 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 dark:bg-pink-700 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Hero Section */}
      <div className="container mx-auto px-4 pt-24 pb-16 relative animate-fade-in">
        <div className="text-center max-w-5xl mx-auto">
          {/* Logo */}
          <div className="mb-8 flex justify-center">
            <img 
              src="/assets/logos/n3rve-logo.svg" 
              alt="N3RVE" 
              className="h-20 w-auto dark:hidden"
            />
            <img 
              src="/assets/logos/n3rve-logo-white.svg" 
              alt="N3RVE" 
              className="h-20 w-auto hidden dark:block"
            />
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
            {language === 'ko' ? (
              <>
                <span className="text-gray-900 dark:text-white">글로벌 음원 유통의</span>
                <br />
                <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 bg-clip-text text-transparent animate-gradient-x">
                  새로운 기준
                </span>
              </>
            ) : (
              <>
                <span className="text-gray-900 dark:text-white">The New Standard for</span>
                <br />
                <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 bg-clip-text text-transparent animate-gradient-x">
                  Global Music Distribution
                </span>
              </>
            )}
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            {language === 'ko' 
              ? 'N3RVE와 함께 당신의 음악을 전 세계 주요 플랫폼에 배포하세요. 복잡한 절차는 줄이고, 창작에만 집중할 수 있도록 돕습니다.'
              : 'Distribute your music to major platforms worldwide with N3RVE. We simplify the process so you can focus on creating.'
            }
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/login"
              className="group px-10 py-4 btn-primary rounded-full text-white font-medium text-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 flex items-center gap-3"
            >
              {language === 'ko' ? '지금 시작하기' : 'Start Now'} 
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <Link
              to="/guide"
              className="px-10 py-4 btn-glass text-gray-700 dark:text-gray-300 rounded-full font-medium text-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
            >
              {language === 'ko' ? '이용 가이드' : 'User Guide'}
            </Link>
          </div>
          
          {/* Trust Indicators */}
          <div className="mt-12 flex flex-wrap justify-center items-center gap-8 text-sm text-gray-700 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-gray-700 dark:text-gray-400">{language === 'ko' ? '100% 보안 인증' : '100% Secure'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="text-gray-700 dark:text-gray-400">{language === 'ko' ? '업계 최고 수준' : 'Industry Leading'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-500" />
              <span className="text-gray-700 dark:text-gray-400">{language === 'ko' ? '150+ 국가 지원' : '150+ Countries'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-20 relative">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 dark:text-white mb-16">
          {language === 'ko' ? 'N3RVE가 특별한 이유' : 'Why Choose N3RVE'}
        </h2>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Feature 1 */}
          <div className="group card-glass animate-slide-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="w-14 h-14 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900 dark:to-purple-800 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Music className="w-7 h-7 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
              {language === 'ko' ? '간편한 음원 등록' : 'Easy Music Registration'}
            </h3>
            <p className="text-gray-700 dark:text-gray-400 leading-relaxed">
              {language === 'ko' 
                ? '직관적인 인터페이스와 단계별 가이드로 누구나 쉽게 음원을 등록하고 관리할 수 있습니다.'
                : 'Register and manage your music easily with our intuitive interface and step-by-step guide.'
              }
            </p>
          </div>

          {/* Feature 2 */}
          <div className="group card-glass animate-slide-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Shield className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
              {language === 'ko' ? '안전한 데이터 보호' : 'Secure Data Protection'}
            </h3>
            <p className="text-gray-700 dark:text-gray-400 leading-relaxed">
              {language === 'ko' 
                ? '업계 최고 수준의 보안 시스템으로 아티스트의 음원과 개인정보를 안전하게 보호합니다.'
                : 'Protect your music and personal information with industry-leading security systems.'
              }
            </p>
          </div>

          {/* Feature 3 */}
          <div className="group card-glass animate-slide-in-up" style={{ animationDelay: '0.3s' }}>
            <div className="w-14 h-14 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900 dark:to-green-800 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Globe className="w-7 h-7 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
              {language === 'ko' ? '글로벌 플랫폼 연동' : 'Global Platform Integration'}
            </h3>
            <p className="text-gray-700 dark:text-gray-400 leading-relaxed">
              {language === 'ko' 
                ? '전 세계 주요 음원 플랫폼과 원활하게 연동되어 한 번의 등록으로 모든 곳에 배포됩니다.'
                : 'Seamlessly integrated with major music platforms worldwide for one-click distribution.'
              }
            </p>
          </div>
        </div>
      </div>
      
      {/* CTA Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="glass-effect-strong bg-gradient-to-r from-purple-600/90 to-blue-600/90 rounded-3xl p-12 text-center text-white relative overflow-hidden animate-scale-in hover:shadow-2xl transition-all duration-300">
          <div className="absolute inset-0 bg-black opacity-10"></div>
          <div className="relative">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {language === 'ko' ? '지금 바로 시작하세요' : 'Start Your Journey Today'}
            </h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              {language === 'ko' 
                ? 'N3RVE와 함께 당신의 음악을 세계에 알리는 첫걸음을 내디뎌보세요.'
                : 'Take the first step to share your music with the world through N3RVE.'
              }
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-8 py-4 glass-effect bg-white/90 text-purple-600 rounded-full font-semibold text-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              {language === 'ko' ? '무료로 시작하기' : 'Start Free'} 
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}