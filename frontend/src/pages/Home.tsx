import { Link } from 'react-router-dom'
import { ArrowRight, Music, Shield, Globe, CheckCircle, Star } from 'lucide-react'
import { useTranslation } from '@/hooks/useTranslation'
import { useAuthStore } from '@/store/auth.store'
import useSafeStore from '@/hooks/useSafeStore'
import LanguageToggle from '@/components/common/LanguageToggle'
import DarkModeToggle from '@/components/common/DarkModeToggle'

export default function HomePage() {
  const { language } = useTranslation()
  
  const isAuthenticated = useSafeStore(useAuthStore, (state) => state.isAuthenticated)
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Language & Dark Mode Toggle */}
      <div className="absolute top-6 right-6 z-10 flex items-center gap-4">
        <DarkModeToggle />
        <LanguageToggle />
      </div>
      
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-96 h-96 bg-cyan-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%239C92AC%22 fill-opacity=%220.05%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
      </div>

      {/* Hero Section */}
      <div className="container mx-auto px-4 pt-24 pb-16 relative animate-fade-in">
        <div className="text-center max-w-5xl mx-auto">
          {/* Logo with Glow */}
          <div className="mb-8 flex justify-center">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur-lg group-hover:blur-xl transition-all duration-300 opacity-75"></div>
              <img 
                src="/assets/logos/n3rve-logo-white.svg" 
                alt="N3RVE" 
                className="h-20 w-auto relative"
              />
            </div>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            {language === 'ko' ? (
              <>
                <span className="text-white/90">글로벌 음원 유통의</span>
                <br />
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent animate-gradient-x">
                  새로운 기준
                </span>
              </>
            ) : language === 'ja' ? (
              <>
                <span className="text-white/90">グローバル音源流通の</span>
                <br />
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent animate-gradient-x">
                  新しい基準
                </span>
              </>
            ) : (
              <>
                <span className="text-white/90">The New Standard for</span>
                <br />
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent animate-gradient-x">
                  Global Music Distribution
                </span>
              </>
            )}
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            {language === 'ko' 
              ? 'N3RVE와 함께 당신의 음악을 전 세계 주요 플랫폼에 배포하세요. 복잡한 절차는 줄이고, 창작에만 집중할 수 있도록 돕습니다.'
              : language === 'ja'
              ? 'N3RVEであなたの音楽を世界中の主要プラットフォームに配信しましょう。複雑なプロセスをシンプルにして、創作に集中できるようサポートします。'
              : 'Distribute your music to major platforms worldwide with N3RVE. We simplify the process so you can focus on creating.'
            }
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/login"
              className="group relative px-10 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-white font-bold text-lg overflow-hidden transition-all duration-300 transform hover:scale-105 flex items-center gap-3"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative z-10">{language === 'ko' ? '지금 시작하기' : language === 'ja' ? '今すぐ始める' : 'Start Now'}</span>
              <ArrowRight className="relative z-10 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <Link
              to="/guide"
              className="px-10 py-4 border-2 border-white/20 backdrop-blur-sm text-white rounded-full font-medium text-lg hover:bg-white/10 hover:border-white/40 transition-all duration-300"
            >
              {language === 'ko' ? '이용 가이드' : language === 'ja' ? '利用ガイド' : 'User Guide'}
            </Link>
          </div>
          
          {/* Trust Indicators */}
          <div className="mt-12 flex flex-wrap justify-center items-center gap-8 text-sm">
            <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-white/80">{language === 'ko' ? '100% 보안 인증' : language === 'ja' ? '100%セキュア' : '100% Secure'}</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full">
              <Star className="w-4 h-4 text-yellow-400" />
              <span className="text-white/80">{language === 'ko' ? '업계 최고 수준' : language === 'ja' ? '業界最高水準' : 'Industry Leading'}</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full">
              <Globe className="w-4 h-4 text-blue-400" />
              <span className="text-white/80">{language === 'ko' ? '150+ 국가 지원' : language === 'ja' ? '150+ヶ国対応' : '150+ Countries'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-20 relative">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-4">
          {language === 'ko' ? 'N3RVE가 특별한 이유' : language === 'ja' ? 'N3RVEを選ぶ理由' : 'Why Choose N3RVE'}
        </h2>
        <p className="text-center text-gray-400 mb-16 text-lg">
          {language === 'ko' ? '아티스트를 위한 최고의 선택' : language === 'ja' ? 'アーティストのための最高の選択' : 'The Best Choice for Artists'}
        </p>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Feature 1 */}
          <div className="group relative p-8 bg-gradient-to-br from-purple-900/50 to-purple-800/30 backdrop-blur-sm rounded-2xl border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 animate-slide-in-up hover:transform hover:-translate-y-2" style={{ animationDelay: '0.1s' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-purple-500/50">
                <Music className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">
                {language === 'ko' ? '간편한 음원 등록' : language === 'ja' ? '簡単な音源登録' : 'Easy Music Registration'}
              </h3>
              <p className="text-gray-300 leading-relaxed">
                {language === 'ko' 
                  ? '직관적인 인터페이스와 단계별 가이드로 누구나 쉽게 음원을 등록하고 관리할 수 있습니다.'
                  : language === 'ja'
                  ? '直感的なインターフェースとステップバイステップガイドで、誰でも簡単に音源を登録・管理できます。'
                  : 'Register and manage your music easily with our intuitive interface and step-by-step guide.'
                }
              </p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="group relative p-8 bg-gradient-to-br from-cyan-900/50 to-cyan-800/30 backdrop-blur-sm rounded-2xl border border-cyan-500/20 hover:border-cyan-500/40 transition-all duration-300 animate-slide-in-up hover:transform hover:-translate-y-2" style={{ animationDelay: '0.2s' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-cyan-500/50">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">
                {language === 'ko' ? '안전한 데이터 보호' : language === 'ja' ? '安全なデータ保護' : 'Secure Data Protection'}
              </h3>
              <p className="text-gray-300 leading-relaxed">
                {language === 'ko' 
                  ? '업계 최고 수준의 보안 시스템으로 아티스트의 음원과 개인정보를 안전하게 보호합니다.'
                  : language === 'ja'
                  ? '業界最高レベルのセキュリティシステムで、アーティストの音源と個人情報を安全に保護します。'
                  : 'Protect your music and personal information with industry-leading security systems.'
                }
              </p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="group relative p-8 bg-gradient-to-br from-pink-900/50 to-pink-800/30 backdrop-blur-sm rounded-2xl border border-pink-500/20 hover:border-pink-500/40 transition-all duration-300 animate-slide-in-up hover:transform hover:-translate-y-2" style={{ animationDelay: '0.3s' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-pink-600/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-pink-500/50">
                <Globe className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">
                {language === 'ko' ? '글로벌 플랫폼 연동' : language === 'ja' ? 'グローバルプラットフォーム連携' : 'Global Platform Integration'}
              </h3>
              <p className="text-gray-300 leading-relaxed">
                {language === 'ko' 
                  ? '전 세계 주요 음원 플랫폼과 원활하게 연동되어 한 번의 등록으로 모든 곳에 배포됩니다.'
                  : language === 'ja'
                  ? '世界中の主要音楽プラットフォームとシームレスに連携し、ワンクリックですべてのプラットフォームに配信されます。'
                  : 'Seamlessly integrated with major music platforms worldwide for one-click distribution.'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* CTA Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="relative rounded-3xl overflow-hidden">
          {/* Background with animation */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 animate-gradient-x"></div>
          
          {/* Noise texture */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 400 400%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%2525%22 height=%22100%2525%22 filter=%22url(%2523noiseFilter)%22/%3E%3C/svg%3E')]"></div>
          </div>
          
          {/* Content */}
          <div className="relative p-16 text-center">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
                {language === 'ko' ? '음악의 미래를 함께 만들어가요' : language === 'ja' ? '音楽の未来を一緒に作りましょう' : 'Shape the Future of Music Together'}
              </h2>
              <p className="text-xl mb-10 text-white/90 max-w-2xl mx-auto leading-relaxed">
                {language === 'ko' 
                  ? '전 세계 아티스트들이 N3RVE를 통해 꿈을 실현하고 있습니다. 지금 합류하세요.'
                  : language === 'ja'
                  ? '世界中のアーティストがN3RVEを通じて夢を実現しています。今すぐ参加しましょう。'
                  : 'Artists worldwide are realizing their dreams through N3RVE. Join us today.'
                }
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                <Link
                  to="/login"
                  className="group relative px-12 py-5 bg-white text-purple-600 rounded-full font-bold text-lg overflow-hidden transition-all duration-300 transform hover:scale-105 shadow-2xl"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-100 to-pink-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <span className="relative z-10 flex items-center gap-3">
                    {language === 'ko' ? '무료로 시작하기' : language === 'ja' ? '無料で始める' : 'Start Free'}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
                
                <div className="flex items-center gap-4 text-white/80">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm">{language === 'ko' ? '신용카드 불필요' : language === 'ja' ? 'クレジットカード不要' : 'No Credit Card Required'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}