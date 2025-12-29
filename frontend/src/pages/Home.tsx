import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Music, Shield, Globe, CheckCircle, Sparkles, Star } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslationFixed';
import { useAuthStore } from '@/store/auth.store';
import useSafeStore from '@/hooks/useSafeStore';
import LanguageToggle from '@/components/common/LanguageToggle';
import DarkModeToggle from '@/components/common/DarkModeToggle';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { useRef, useEffect, useState } from 'react';

// Floating particles component with CSS animations
const FloatingParticles = () => {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {[...Array(20)].map((_, i) => {
        const randomX = Math.random() * 100;
        const randomY = Math.random() * 100;
        const duration = Math.random() * 20 + 20;

        return (
          <div
            key={i}
            className="absolute w-1 h-1 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-float"
            style={{
              left: `${randomX}%`,
              top: `${randomY}%`,
              filter: 'blur(1px)',
              boxShadow: '0 0 10px rgba(168, 85, 247, 0.5)',
              animationDuration: `${duration}s`,
              animationDelay: `${Math.random() * 5}s`
            }}
          />
        );
      })}
    </div>
  );
};

// Animated text component with Intersection Observer
const AnimatedText = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay * 1000);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [delay]);

  return (
    <div
      ref={ref}
      className={`transition-all duration-500 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
    >
      {children}
    </div>
  );
};

export default function HomePage() {
  const { language } = useTranslation();
  const isAuthenticated = useSafeStore(useAuthStore, (state) => state.isAuthenticated);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);

  // Auto-animate hooks
  const [heroRef] = useAutoAnimate();
  const [featuresRef] = useAutoAnimate();
  const [trustRef] = useAutoAnimate();

  // Ensure gradient text is visible - failsafe
  useEffect(() => {
    const ensureGradientTextVisible = () => {
      const gradientTexts = document.querySelectorAll('.gradient-hero-text');
      gradientTexts.forEach((element) => {
        const htmlElement = element as HTMLElement;
        htmlElement.style.opacity = '1';
        htmlElement.style.visibility = 'visible';
        htmlElement.style.display = 'inline-block';
      });
    };

    // Run immediately and after animations should complete
    ensureGradientTextVisible();
    const timer1 = setTimeout(ensureGradientTextVisible, 1000);
    const timer2 = setTimeout(ensureGradientTextVisible, 2000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  // Mouse tracking and scroll handling
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100
      });
    };

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Parallax calculations
  const heroTransform = `translateY(${scrollY * -0.5}px)`;
  const blobTransform = `translateY(${scrollY * 0.3}px)`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-purple-900 dark:to-slate-900 relative">
      {/* Floating particles */}
      <FloatingParticles />

      {/* Language & Dark Mode Toggle */}
      <div className="absolute top-6 right-6 z-10 flex items-center gap-4 animate-fade-in-right">
        <DarkModeToggle />
        <LanguageToggle />
      </div>

      {/* Animated Background with Parallax */}
      <div className="absolute inset-0">
        <div
          className="absolute top-0 -left-4 w-96 h-96 bg-purple-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob"
          style={{
            transform: blobTransform,
            animationDelay: '0s'
          }}
        />
        <div
          className="absolute top-0 -right-4 w-96 h-96 bg-cyan-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob"
          style={{
            transform: blobTransform,
            animationDelay: '2s',
            animationDuration: '25s'
          }}
        />
        <div
          className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob"
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
            transform: `translate(${mousePosition.x * 0.1}px, ${mousePosition.y * 0.1}px)`,
            transition: 'transform 0.3s ease-out'
          }}
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
      </div>

      {/* Hero Section with Parallax */}
      <div
        className="container mx-auto px-4 pt-24 pb-16 relative"
        style={{ transform: heroTransform }}
        ref={heroRef}
      >
        <div className="text-center max-w-5xl mx-auto">
          {/* Logo with Glow and Pulse */}
          <div className="mb-8 flex justify-center animate-fade-in-up">
            <div className="relative group hover:scale-105 transition-transform duration-300">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur-lg opacity-75 animate-pulse-glow"/>
              <img
                src="/assets/logos/n3rve-logo-white.svg"
                alt="N3RVE"
                className="h-20 w-auto relative"
              />
            </div>
          </div>

          {/* Animated Title */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight animate-fade-in-up">
            {language === 'ko' ? (
              <>
                <span className="text-white/90 inline-block animate-slide-in-left">
                  글로벌 음원 유통의
                </span>
                <br />
                <span
                  className="gradient-hero-text inline-block animate-gradient-x"
                  style={{
                    // Explicit gradient definition
                    background: 'linear-gradient(90deg, #c084fc 0%, #ec4899 35%, #06b6d4 70%, #c084fc 100%)',
                    backgroundSize: '200% 100%',
                    // WebKit prefixes for better support
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    // Force visibility and prevent flicker
                    opacity: 1,
                    // Override any CSS animations that set opacity to 0
                    visibility: 'visible',
                    display: 'inline-block',
                    // Fallback color in case gradient fails
                    color: '#c084fc',
                    // Ensure proper rendering
                    textRendering: 'optimizeLegibility',
                    WebkitFontSmoothing: 'antialiased'
                  }}
                >
                  새로운 기준
                </span>
              </>
            ) : language === 'ja' ? (
              <>
                <span className="text-white/90 inline-block animate-slide-in-left">
                  グローバル音源流通の
                </span>
                <br />
                <span
                  className="gradient-hero-text inline-block animate-gradient-x"
                  style={{
                    // Explicit gradient definition
                    background: 'linear-gradient(90deg, #c084fc 0%, #ec4899 35%, #06b6d4 70%, #c084fc 100%)',
                    backgroundSize: '200% 100%',
                    // WebKit prefixes for better support
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    // Force visibility and prevent flicker
                    opacity: 1,
                    // Override any CSS animations that set opacity to 0
                    visibility: 'visible',
                    display: 'inline-block',
                    // Fallback color in case gradient fails
                    color: '#c084fc',
                    // Ensure proper rendering
                    textRendering: 'optimizeLegibility',
                    WebkitFontSmoothing: 'antialiased'
                  }}
                >
                  新しい基準
                </span>
              </>
            ) : (
              <>
                <span className="text-white/90 inline-block animate-slide-in-left">
                  The New Standard for
                </span>
                <br />
                <span
                  className="gradient-hero-text inline-block animate-gradient-x"
                  style={{
                    // Explicit gradient definition
                    background: 'linear-gradient(90deg, #c084fc 0%, #ec4899 35%, #06b6d4 70%, #c084fc 100%)',
                    backgroundSize: '200% 100%',
                    // WebKit prefixes for better support
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    // Force visibility and prevent flicker
                    opacity: 1,
                    // Override any CSS animations that set opacity to 0
                    visibility: 'visible',
                    display: 'inline-block',
                    // Fallback color in case gradient fails
                    color: '#c084fc',
                    // Ensure proper rendering
                    textRendering: 'optimizeLegibility',
                    WebkitFontSmoothing: 'antialiased'
                  }}
                >
                  Global Music Distribution
                </span>
              </>
            )}
          </h1>

          {/* Animated Description */}
          <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed animate-fade-in-up animation-delay-600">
            {language === 'ko'
              ? 'N3RVE와 함께 당신의 음악을 전 세계 주요 플랫폼에 배포하세요. 복잡한 절차는 줄이고, 창작에만 집중할 수 있도록 돕습니다.'
              : language === 'ja'
                ? 'N3RVEであなたの音楽を世界中の主要プラットフォームに配信しましょう。複雑なプロセスをシンプルにして、創作に集中できるようサポートします。'
                : 'Distribute your music to major platforms worldwide with N3RVE. We simplify the process so you can focus on creating.'
            }
          </p>

          {/* CTA Buttons with Spring Animation */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up animation-delay-800">
            <div className="transform hover:scale-105 active:scale-95 transition-transform duration-200">
              <Link
                to="/login"
                className="group relative px-10 py-4 bg-purple-600 dark:bg-gradient-to-r dark:from-purple-500 dark:to-pink-500 rounded-full text-white font-bold text-lg overflow-hidden flex items-center gap-3 hover-lift shadow-xl shadow-purple-600/50 dark:shadow-purple-500/50 hover:bg-purple-700 dark:hover:bg-gradient-to-r dark:hover:from-purple-600 dark:hover:to-pink-600"
              >
                <span className="relative z-10 text-white font-black text-xl drop-shadow-lg">
                  {language === 'ko' ? '지금 시작하기' : language === 'ja' ? '今すぐ始める' : 'Start Now'}
                </span>
                <ArrowRight className="relative z-10 w-5 h-5 text-white drop-shadow-lg" />
              </Link>
            </div>

            <div className="transform hover:scale-105 active:scale-95 transition-transform duration-200">
              <Link
                to="/guide"
                className="px-10 py-4 border-2 border-purple-600 dark:border-white/20 backdrop-blur-sm text-purple-700 dark:text-white rounded-full font-medium text-lg hover:bg-purple-50 dark:hover:bg-white/10 hover:border-purple-700 dark:hover:border-white/40 transition-all duration-300"
              >
                {language === 'ko' ? '이용 가이드' : language === 'ja' ? '利用ガイド' : 'User Guide'}
              </Link>
            </div>
          </div>

          {/* Trust Indicators with Stagger Animation */}
          <div className="mt-12 flex flex-wrap justify-center items-center gap-8 text-sm" ref={trustRef}>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-white/10 backdrop-blur-sm rounded-full hover:bg-white dark:hover:bg-white/15 hover:scale-105 transition-all duration-300 animate-fade-in-up animation-delay-1000 border border-purple-200 dark:border-transparent">
              <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="text-gray-800 dark:text-white/80 font-medium">{language === 'ko' ? '100% 보안 인증' : language === 'ja' ? '100%セキュア' : '100% Secure'}</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-white/10 backdrop-blur-sm rounded-full hover:bg-white dark:hover:bg-white/15 hover:scale-105 transition-all duration-300 animate-fade-in-up animation-delay-1100 border border-purple-200 dark:border-transparent">
              <Star className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
              <span className="text-gray-800 dark:text-white/80 font-medium">{language === 'ko' ? '업계 최고 수준' : language === 'ja' ? '業界最高水準' : 'Industry Leading'}</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-white/10 backdrop-blur-sm rounded-full hover:bg-white dark:hover:bg-white/15 hover:scale-105 transition-all duration-300 animate-fade-in-up animation-delay-1200 border border-purple-200 dark:border-transparent">
              <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-gray-800 dark:text-white/80 font-medium">{language === 'ko' ? '150+ 국가 지원' : language === 'ja' ? '150+ヶ国対応' : '150+ Countries'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section with Scroll Animations */}
      <div className="container mx-auto px-4 py-20 relative">
        <AnimatedText delay={0}>
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 dark:text-white mb-4">
            {language === 'ko' ? 'N3RVE가 특별한 이유' : language === 'ja' ? 'N3RVEを選ぶ理由' : 'Why Choose N3RVE'}
          </h2>
        </AnimatedText>
        <AnimatedText delay={0.1}>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-16 text-lg">
            {language === 'ko' ? '아티스트를 위한 최고의 선택' : language === 'ja' ? 'アーティストのための最高の選択' : 'The Best Choice for Artists'}
          </p>
        </AnimatedText>

        <div
          className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto"
          ref={featuresRef}
        >
          {/* Feature 1 */}
          <div
            className="group relative p-8 bg-gradient-to-br from-purple-900/50 to-purple-800/30 backdrop-blur-sm rounded-2xl border border-purple-500/20 hover:scale-[1.02] hover:border-purple-400/40 transition-all duration-500 animate-fade-in-up hover:shadow-2xl hover:shadow-purple-500/25 overflow-hidden"
            onMouseEnter={(e) => {
              const card = e.currentTarget;
              card.style.transform = 'scale(1.02) translateY(-5px)';
            }}
            onMouseLeave={(e) => {
              const card = e.currentTarget;
              card.style.transform = 'scale(1) translateY(0)';
            }}
          >
            {/* Animated gradient background */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-pink-600/20 to-purple-600/20 animate-gradient-xy"/>
            </div>

            {/* Floating particles on hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-1 bg-purple-400 rounded-full animate-float-up"
                  style={{
                    left: `${20 + i * 15}%`,
                    animationDelay: `${i * 0.2}s`,
                    animationDuration: '3s'
                  }}
                />
              ))}
            </div>

            <div className="relative z-10">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-purple-500 rounded-xl blur-xl opacity-50 group-hover:opacity-80 animate-pulse-slow transition-opacity duration-500"/>
                <div
                  className="relative w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/50 group-hover:scale-110 group-hover:rotate-[360deg] transition-all duration-700"
                >
                  <Music className="w-7 h-7 text-white group-hover:animate-bounce" />
                </div>
              </div>

              <h3 className="text-xl font-semibold mb-3 text-white group-hover:text-purple-300 transition-colors duration-300">
                {language === 'ko' ? '간편한 음원 등록' : language === 'ja' ? '簡単な音源登録' : 'Easy Music Registration'}
              </h3>
              <p className="text-gray-300 leading-relaxed group-hover:text-gray-100 transition-colors duration-300">
                {language === 'ko'
                  ? '직관적인 인터페이스와 단계별 가이드로 누구나 쉽게 음원을 등록하고 관리할 수 있습니다.'
                  : language === 'ja'
                    ? '直感的なインターフェースとステップバイステップガイドで、誰でも簡単に音源を登録・管理できます。'
                    : 'Register and manage your music easily with our intuitive interface and step-by-step guide.'
                }
              </p>

              {/* Hidden arrow that appears on hover */}
              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-500">
                <ArrowRight className="w-5 h-5 text-purple-400" />
              </div>
            </div>
          </div>

          {/* Feature 2 */}
          <div
            className="group relative p-8 bg-gradient-to-br from-cyan-900/50 to-cyan-800/30 backdrop-blur-sm rounded-2xl border border-cyan-500/20 hover:scale-[1.02] hover:border-cyan-400/40 transition-all duration-500 animate-fade-in-up animation-delay-200 hover:shadow-2xl hover:shadow-cyan-500/25 overflow-hidden"
            onMouseEnter={(e) => {
              const card = e.currentTarget;
              card.style.transform = 'scale(1.02) translateY(-5px)';
            }}
            onMouseLeave={(e) => {
              const card = e.currentTarget;
              card.style.transform = 'scale(1) translateY(0)';
            }}
          >
            {/* Animated gradient background */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/20 via-blue-600/20 to-cyan-600/20 animate-gradient-xy"/>
            </div>

            {/* Floating particles on hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-1 bg-cyan-400 rounded-full animate-float-up"
                  style={{
                    left: `${20 + i * 15}%`,
                    animationDelay: `${i * 0.2}s`,
                    animationDuration: '3s'
                  }}
                />
              ))}
            </div>

            <div className="relative z-10">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-cyan-500 rounded-xl blur-xl opacity-50 group-hover:opacity-80 animate-pulse-slow transition-opacity duration-500"/>
                <div
                  className="relative w-14 h-14 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/50 group-hover:scale-110 group-hover:rotate-[360deg] transition-all duration-700"
                >
                  <Shield className="w-7 h-7 text-white group-hover:animate-bounce" />
                </div>
              </div>

              <h3 className="text-xl font-semibold mb-3 text-white group-hover:text-cyan-300 transition-colors duration-300">
                {language === 'ko' ? '안전한 데이터 보호' : language === 'ja' ? '安全なデータ保護' : 'Secure Data Protection'}
              </h3>
              <p className="text-gray-300 leading-relaxed group-hover:text-gray-100 transition-colors duration-300">
                {language === 'ko'
                  ? '업계 최고 수준의 보안 시스템으로 아티스트의 음원과 개인정보를 안전하게 보호합니다.'
                  : language === 'ja'
                    ? '業界最高レベルのセキュリティシステムで、アーティストの音源と個人情報を安全に保護します。'
                    : 'Protect your music and personal information with industry-leading security systems.'
                }
              </p>

              {/* Hidden arrow that appears on hover */}
              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-500">
                <ArrowRight className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
          </div>

          {/* Feature 3 */}
          <div
            className="group relative p-8 bg-gradient-to-br from-pink-900/50 to-pink-800/30 backdrop-blur-sm rounded-2xl border border-pink-500/20 hover:scale-[1.02] hover:border-pink-400/40 transition-all duration-500 animate-fade-in-up animation-delay-400 hover:shadow-2xl hover:shadow-pink-500/25 overflow-hidden"
            onMouseEnter={(e) => {
              const card = e.currentTarget;
              card.style.transform = 'scale(1.02) translateY(-5px)';
            }}
            onMouseLeave={(e) => {
              const card = e.currentTarget;
              card.style.transform = 'scale(1) translateY(0)';
            }}
          >
            {/* Animated gradient background */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-600/20 via-purple-600/20 to-pink-600/20 animate-gradient-xy"/>
            </div>

            {/* Floating particles on hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-1 bg-pink-400 rounded-full animate-float-up"
                  style={{
                    left: `${20 + i * 15}%`,
                    animationDelay: `${i * 0.2}s`,
                    animationDuration: '3s'
                  }}
                />
              ))}
            </div>

            <div className="relative z-10">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-pink-500 rounded-xl blur-xl opacity-50 group-hover:opacity-80 animate-pulse-slow transition-opacity duration-500"/>
                <div
                  className="relative w-14 h-14 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-pink-500/50 group-hover:scale-110 group-hover:rotate-[360deg] transition-all duration-700"
                >
                  <Globe className="w-7 h-7 text-white group-hover:animate-bounce" />
                </div>
              </div>

              <h3 className="text-xl font-semibold mb-3 text-white group-hover:text-pink-300 transition-colors duration-300">
                {language === 'ko' ? '글로벌 플랫폼 연동' : language === 'ja' ? 'グローバルプラットフォーム連携' : 'Global Platform Integration'}
              </h3>
              <p className="text-gray-300 leading-relaxed group-hover:text-gray-100 transition-colors duration-300">
                {language === 'ko'
                  ? '전 세계 주요 음원 플랫폼과 원활하게 연동되어 한 번의 등록으로 모든 곳에 배포됩니다.'
                  : language === 'ja'
                    ? '世界中の主要音楽プラットフォームとシームレスに連携し、ワンクリックですべてのプラットフォームに配信されます。'
                    : 'Seamlessly integrated with major music platforms worldwide for one-click distribution.'
                }
              </p>

              {/* Hidden arrow that appears on hover */}
              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-500">
                <ArrowRight className="w-5 h-5 text-pink-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section with Advanced Animation */}
      <div className="container mx-auto px-4 py-20">
        <div className="relative rounded-3xl overflow-hidden animate-fade-in-up">
          {/* Background with complex animation */}
          <div className="absolute inset-0 animate-gradient-shift"/>

          {/* Sparkle effects */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(30)].map((_, i) => {
              const randomDelay = Math.random() * 5;
              const randomX = Math.random() * 100;
              const randomY = Math.random() * 100;

              return (
                <div
                  key={i}
                  className="absolute animate-sparkle"
                  style={{
                    left: `${randomX}%`,
                    top: `${randomY}%`,
                    animationDelay: `${randomDelay}s`
                  }}
                >
                  <Sparkles className="w-4 h-4 text-white/50" />
                </div>
              );
            })}
          </div>

          {/* Noise texture */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 400 400%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%2525%22 height=%22100%2525%22 filter=%22url(%2523noiseFilter)%22/%3E%3C/svg%3E')]"></div>
          </div>

          {/* Content */}
          <div className="relative p-16 text-center">
            <AnimatedText>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
                {language === 'ko' ? '음악의 미래를 함께 만들어가요' : language === 'ja' ? '音楽の未来を一緒に作りましょう' : 'Shape the Future of Music Together'}
              </h2>
            </AnimatedText>
            <AnimatedText delay={0.1}>
              <p className="text-xl mb-10 text-white/90 max-w-2xl mx-auto leading-relaxed">
                {language === 'ko'
                  ? '전 세계 아티스트들이 N3RVE를 통해 꿈을 실현하고 있습니다. 지금 합류하세요.'
                  : language === 'ja'
                    ? '世界中のアーティストがN3RVEを通じて夢を実現しています。今すぐ参加しましょう。'
                    : 'Artists worldwide are realizing their dreams through N3RVE. Join us today.'
                }
              </p>
            </AnimatedText>

            <AnimatedText delay={0.2}>
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                <div className="relative transform hover:scale-105 active:scale-95 transition-transform duration-200">
                  <div className="absolute inset-0 bg-white rounded-full blur-xl animate-pulse-glow"/>
                  <Link
                    to="/login"
                    className="group relative px-12 py-5 bg-white text-purple-600 rounded-full font-bold text-lg overflow-hidden shadow-2xl flex items-center gap-3"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-100 to-pink-100 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300"/>
                    <span
                      className="relative z-10 text-purple-700 font-black text-xl"
                      style={{
                        color: '#7c3aed',
                        fontWeight: '900'
                      }}
                    >
                      {language === 'ko' ? '무료로 시작하기' : language === 'ja' ? '無料で始める' : 'Start Free'}
                    </span>
                    <ArrowRight className="relative z-10 w-5 h-5 animate-bounce-x text-purple-700" style={{ color: '#7c3aed' }} />
                  </Link>
                </div>

                <div className="flex items-center gap-4 text-white/80 hover:scale-105 transition-transform duration-200">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm">{language === 'ko' ? '신용카드 불필요' : language === 'ja' ? 'クレジットカード不要' : 'No Credit Card Required'}</span>
                </div>
              </div>
            </AnimatedText>
          </div>
        </div>
      </div>
    </div>
  );
}
