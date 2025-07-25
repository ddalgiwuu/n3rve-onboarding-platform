import { Link } from 'react-router-dom'
import { ArrowRight, Music, Shield, Globe, CheckCircle, Star, Sparkles, Zap } from 'lucide-react'
import { useTranslation } from '@/hooks/useTranslation'
import { useAuthStore } from '@/store/auth.store'
import useSafeStore from '@/hooks/useSafeStore'
import LanguageToggle from '@/components/common/LanguageToggle'
import DarkModeToggle from '@/components/common/DarkModeToggle'
import { motion, useScroll, useTransform, useSpring, useInView } from 'framer-motion'
import { useRef, useEffect, useState } from 'react'

// Floating particles component
const FloatingParticles = () => {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"
          initial={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
          }}
          animate={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
          }}
          transition={{
            duration: Math.random() * 20 + 20,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{
            filter: 'blur(1px)',
            boxShadow: '0 0 10px rgba(168, 85, 247, 0.5)',
          }}
        />
      ))}
    </div>
  )
}

// Animated text component
const AnimatedText = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.5 })
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.5, delay }}
    >
      {children}
    </motion.div>
  )
}

export default function HomePage() {
  const { language } = useTranslation()
  const isAuthenticated = useSafeStore(useAuthStore, (state) => state.isAuthenticated)
  const { scrollYProgress } = useScroll()
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  
  // Parallax effects
  const heroY = useTransform(scrollYProgress, [0, 1], [0, -100])
  const blobY = useTransform(scrollYProgress, [0, 1], [0, 200])
  const scaleProgress = useTransform(scrollYProgress, [0, 0.5], [1, 0.8])
  
  // Mouse tracking
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])
  
  // Stagger animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  }
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
      },
    },
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Floating particles */}
      <FloatingParticles />
      
      {/* Language & Dark Mode Toggle */}
      <motion.div 
        className="absolute top-6 right-6 z-10 flex items-center gap-4"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
      >
        <DarkModeToggle />
        <LanguageToggle />
      </motion.div>
      
      {/* Animated Background with Parallax */}
      <div className="absolute inset-0">
        <motion.div 
          className="absolute top-0 -left-4 w-96 h-96 bg-purple-500 rounded-full mix-blend-screen filter blur-3xl opacity-20"
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ y: blobY }}
        />
        <motion.div 
          className="absolute top-0 -right-4 w-96 h-96 bg-cyan-500 rounded-full mix-blend-screen filter blur-3xl opacity-20"
          animate={{
            x: [0, -100, 0],
            y: [0, 100, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
          style={{ y: blobY }}
        />
        <motion.div 
          className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-500 rounded-full mix-blend-screen filter blur-3xl opacity-20"
          animate={{
            x: [0, -100, 0],
            y: [0, -100, 0],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 4,
          }}
          style={{ y: blobY }}
        />
        
        {/* Grid Pattern with mouse interaction */}
        <motion.div 
          className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%239C92AC%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')]"
          style={{
            transform: `translate(${mousePosition.x * 0.01}px, ${mousePosition.y * 0.01}px)`,
          }}
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
      </div>

      {/* Hero Section with Parallax */}
      <motion.div 
        className="container mx-auto px-4 pt-24 pb-16 relative"
        style={{ y: heroY, scale: scaleProgress }}
      >
        <div className="text-center max-w-5xl mx-auto">
          {/* Logo with Glow and Pulse */}
          <motion.div 
            className="mb-8 flex justify-center"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
          >
            <motion.div 
              className="relative group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div 
                className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur-lg opacity-75"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <img 
                src="/assets/logos/n3rve-logo-white.svg" 
                alt="N3RVE" 
                className="h-20 w-auto relative"
              />
            </motion.div>
          </motion.div>
          
          {/* Animated Title */}
          <motion.h1 
            className="text-5xl md:text-7xl font-bold mb-6 leading-tight"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {language === 'ko' ? (
              <>
                <motion.span 
                  className="text-white/90 inline-block"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  글로벌 음원 유통의
                </motion.span>
                <br />
                <motion.span 
                  className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent inline-block"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  style={{
                    backgroundSize: '200% 100%',
                    animation: 'gradient-x 3s ease infinite',
                  }}
                >
                  새로운 기준
                </motion.span>
              </>
            ) : language === 'ja' ? (
              <>
                <motion.span 
                  className="text-white/90 inline-block"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  グローバル音源流通の
                </motion.span>
                <br />
                <motion.span 
                  className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent inline-block"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  style={{
                    backgroundSize: '200% 100%',
                    animation: 'gradient-x 3s ease infinite',
                  }}
                >
                  新しい基準
                </motion.span>
              </>
            ) : (
              <>
                <motion.span 
                  className="text-white/90 inline-block"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  The New Standard for
                </motion.span>
                <br />
                <motion.span 
                  className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent inline-block"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  style={{
                    backgroundSize: '200% 100%',
                    animation: 'gradient-x 3s ease infinite',
                  }}
                >
                  Global Music Distribution
                </motion.span>
              </>
            )}
          </motion.h1>
          
          {/* Animated Description */}
          <motion.p 
            className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            {language === 'ko' 
              ? 'N3RVE와 함께 당신의 음악을 전 세계 주요 플랫폼에 배포하세요. 복잡한 절차는 줄이고, 창작에만 집중할 수 있도록 돕습니다.'
              : language === 'ja'
              ? 'N3RVEであなたの音楽を世界中の主要プラットフォームに配信しましょう。複雑なプロセスをシンプルにして、創作に集中できるようサポートします。'
              : 'Distribute your music to major platforms worldwide with N3RVE. We simplify the process so you can focus on creating.'
            }
          </motion.p>
          
          {/* CTA Buttons with Spring Animation */}
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                to="/login"
                className="group relative px-10 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-white font-bold text-lg overflow-hidden flex items-center gap-3"
              >
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: 0 }}
                  transition={{ duration: 0.3 }}
                />
                <span className="relative z-10">{language === 'ko' ? '지금 시작하기' : language === 'ja' ? '今すぐ始める' : 'Start Now'}</span>
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ArrowRight className="relative z-10 w-5 h-5" />
                </motion.div>
              </Link>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                to="/guide"
                className="px-10 py-4 border-2 border-white/20 backdrop-blur-sm text-white rounded-full font-medium text-lg hover:bg-white/10 hover:border-white/40 transition-all duration-300"
              >
                {language === 'ko' ? '이용 가이드' : language === 'ja' ? '利用ガイド' : 'User Guide'}
              </Link>
            </motion.div>
          </motion.div>
          
          {/* Trust Indicators with Stagger Animation */}
          <motion.div 
            className="mt-12 flex flex-wrap justify-center items-center gap-8 text-sm"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div 
              className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full"
              variants={itemVariants}
              whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.15)" }}
            >
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-white/80">{language === 'ko' ? '100% 보안 인증' : language === 'ja' ? '100%セキュア' : '100% Secure'}</span>
            </motion.div>
            <motion.div 
              className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full"
              variants={itemVariants}
              whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.15)" }}
            >
              <Star className="w-4 h-4 text-yellow-400" />
              <span className="text-white/80">{language === 'ko' ? '업계 최고 수준' : language === 'ja' ? '業界最高水準' : 'Industry Leading'}</span>
            </motion.div>
            <motion.div 
              className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full"
              variants={itemVariants}
              whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.15)" }}
            >
              <Globe className="w-4 h-4 text-blue-400" />
              <span className="text-white/80">{language === 'ko' ? '150+ 국가 지원' : language === 'ja' ? '150+ヶ国対応' : '150+ Countries'}</span>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Features Section with Scroll Animations */}
      <div className="container mx-auto px-4 py-20 relative">
        <AnimatedText delay={0}>
          <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-4">
            {language === 'ko' ? 'N3RVE가 특별한 이유' : language === 'ja' ? 'N3RVEを選ぶ理由' : 'Why Choose N3RVE'}
          </h2>
        </AnimatedText>
        <AnimatedText delay={0.1}>
          <p className="text-center text-gray-400 mb-16 text-lg">
            {language === 'ko' ? '아티스트를 위한 최고의 선택' : language === 'ja' ? 'アーティストのための最高の選択' : 'The Best Choice for Artists'}
          </p>
        </AnimatedText>
        
        <motion.div 
          className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          {/* Feature 1 */}
          <motion.div 
            className="group relative p-8 bg-gradient-to-br from-purple-900/50 to-purple-800/30 backdrop-blur-sm rounded-2xl border border-purple-500/20"
            variants={itemVariants}
            whileHover={{ 
              scale: 1.05,
              borderColor: "rgba(168, 85, 247, 0.4)",
              transition: { duration: 0.2 }
            }}
          >
            <motion.div 
              className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-transparent rounded-2xl"
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            />
            <div className="relative z-10">
              <motion.div 
                className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-purple-500/50"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Music className="w-7 h-7 text-white" />
              </motion.div>
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
          </motion.div>

          {/* Feature 2 */}
          <motion.div 
            className="group relative p-8 bg-gradient-to-br from-cyan-900/50 to-cyan-800/30 backdrop-blur-sm rounded-2xl border border-cyan-500/20"
            variants={itemVariants}
            whileHover={{ 
              scale: 1.05,
              borderColor: "rgba(6, 182, 212, 0.4)",
              transition: { duration: 0.2 }
            }}
          >
            <motion.div 
              className="absolute inset-0 bg-gradient-to-br from-cyan-600/10 to-transparent rounded-2xl"
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            />
            <div className="relative z-10">
              <motion.div 
                className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-cyan-500/50"
                whileHover={{ scale: 1.1, rotate: -5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Shield className="w-7 h-7 text-white" />
              </motion.div>
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
          </motion.div>

          {/* Feature 3 */}
          <motion.div 
            className="group relative p-8 bg-gradient-to-br from-pink-900/50 to-pink-800/30 backdrop-blur-sm rounded-2xl border border-pink-500/20"
            variants={itemVariants}
            whileHover={{ 
              scale: 1.05,
              borderColor: "rgba(236, 72, 153, 0.4)",
              transition: { duration: 0.2 }
            }}
          >
            <motion.div 
              className="absolute inset-0 bg-gradient-to-br from-pink-600/10 to-transparent rounded-2xl"
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            />
            <div className="relative z-10">
              <motion.div 
                className="w-14 h-14 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-pink-500/50"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Globe className="w-7 h-7 text-white" />
              </motion.div>
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
          </motion.div>
        </motion.div>
      </div>
      
      {/* CTA Section with Advanced Animation */}
      <div className="container mx-auto px-4 py-20">
        <motion.div 
          className="relative rounded-3xl overflow-hidden"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {/* Background with complex animation */}
          <motion.div 
            className="absolute inset-0"
            animate={{
              background: [
                "linear-gradient(45deg, #7c3aed, #ec4899)",
                "linear-gradient(90deg, #ec4899, #06b6d4)",
                "linear-gradient(135deg, #06b6d4, #7c3aed)",
                "linear-gradient(180deg, #7c3aed, #ec4899)",
              ],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "linear",
            }}
          />
          
          {/* Sparkle effects */}
          <div className="absolute inset-0">
            {[...Array(30)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute"
                initial={{
                  opacity: 0,
                  scale: 0,
                  x: Math.random() * 100 + "%",
                  y: Math.random() * 100 + "%",
                }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: Math.random() * 5,
                  ease: "easeInOut",
                }}
              >
                <Sparkles className="w-4 h-4 text-white/50" />
              </motion.div>
            ))}
          </div>
          
          {/* Noise texture */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 400 400%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%2525%22 height=%22100%2525%22 filter=%22url(%2523noiseFilter)%22/%3E%3C/svg%3E')]"></div>
          </div>
          
          {/* Content */}
          <div className="relative p-16 text-center">
            <div className="max-w-3xl mx-auto">
              <motion.h2 
                className="text-4xl md:text-5xl font-bold mb-6 text-white"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                {language === 'ko' ? '음악의 미래를 함께 만들어가요' : language === 'ja' ? '音楽の未来を一緒に作りましょう' : 'Shape the Future of Music Together'}
              </motion.h2>
              <motion.p 
                className="text-xl mb-10 text-white/90 max-w-2xl mx-auto leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                {language === 'ko' 
                  ? '전 세계 아티스트들이 N3RVE를 통해 꿈을 실현하고 있습니다. 지금 합류하세요.'
                  : language === 'ja'
                  ? '世界中のアーティストがN3RVEを通じて夢を実現しています。今すぐ参加しましょう。'
                  : 'Artists worldwide are realizing their dreams through N3RVE. Join us today.'
                }
              </motion.p>
              
              <motion.div 
                className="flex flex-col sm:flex-row gap-6 justify-center items-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative"
                >
                  <motion.div
                    className="absolute inset-0 bg-white rounded-full blur-xl"
                    animate={{ 
                      scale: [1, 1.2, 1],
                      opacity: [0.3, 0.5, 0.3] 
                    }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity,
                      ease: "easeInOut" 
                    }}
                  />
                  <Link
                    to="/login"
                    className="group relative px-12 py-5 bg-white text-purple-600 rounded-full font-bold text-lg overflow-hidden shadow-2xl flex items-center gap-3"
                  >
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-r from-purple-100 to-pink-100"
                      initial={{ x: "-100%" }}
                      whileHover={{ x: 0 }}
                      transition={{ duration: 0.3 }}
                    />
                    <span className="relative z-10">
                      {language === 'ko' ? '무료로 시작하기' : language === 'ja' ? '無料で始める' : 'Start Free'}
                    </span>
                    <motion.div
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <ArrowRight className="relative z-10 w-5 h-5" />
                    </motion.div>
                  </Link>
                </motion.div>
                
                <motion.div 
                  className="flex items-center gap-4 text-white/80"
                  whileHover={{ scale: 1.05 }}
                >
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm">{language === 'ko' ? '신용카드 불필요' : language === 'ja' ? 'クレジットカード不要' : 'No Credit Card Required'}</span>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}