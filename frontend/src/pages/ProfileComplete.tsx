import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, User, Music, Globe, Star, ArrowRight, Sparkles } from 'lucide-react';
import { useLanguageStore } from '@/store/language.store';
import useSafeStore from '@/hooks/useSafeStore';
import confetti from 'canvas-confetti';

const ProfileComplete = () => {
  const navigate = useNavigate();
  const language = useSafeStore(useLanguageStore, (state) => state.language);
  const t = (ko: string, en: string) => language === 'ko' ? ko : en;

  useEffect(() => {
    // Trigger confetti animation
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#8B5CF6', '#6366F1', '#3B82F6', '#10B981']
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#8B5CF6', '#6366F1', '#3B82F6', '#10B981']
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  const achievements = [
    {
      icon: User,
      title: t('기본 정보', 'Basic Info'),
      description: t('프로필 정보를 완성했습니다', 'Profile information completed'),
      color: 'from-blue-500 to-indigo-600'
    },
    {
      icon: Music,
      title: t('음악 카탈로그', 'Music Catalog'),
      description: t('음악 정보를 등록할 준비가 되었습니다', 'Ready to submit your music'),
      color: 'from-purple-500 to-pink-600'
    },
    {
      icon: Globe,
      title: t('소셜 링크', 'Social Links'),
      description: t('소셜 미디어 연결 준비 완료', 'Social media ready to connect'),
      color: 'from-emerald-500 to-teal-600'
    }
  ];

  const nextSteps = [
    {
      title: t('음악 제출하기', 'Submit Your Music'),
      description: t('첫 번째 릴리즈를 제출하고 전 세계에 공개하세요', 'Submit your first release and share it with the world'),
      action: () => navigate('/submission/new'),
      buttonText: t('제출 시작하기', 'Start Submission'),
      icon: Music,
      gradient: 'from-n3rve-500 to-purple-600'
    },
    {
      title: t('대시보드로 이동', 'Go to Dashboard'),
      description: t('대시보드에서 모든 기능을 확인하세요', 'Access all features from your dashboard'),
      action: () => navigate('/dashboard'),
      buttonText: t('대시보드 보기', 'View Dashboard'),
      icon: Sparkles,
      gradient: 'from-blue-500 to-indigo-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a0a2e] to-[#0a0a0a] flex items-center justify-center px-4 py-12">
      <div className="max-w-5xl w-full">
        {/* Success Hero */}
        <div className="relative">
          {/* Glow effect */}
          <div className="absolute inset-0 blur-3xl opacity-30">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-3xl" />
          </div>

          <div className="relative bg-black/40 backdrop-blur-xl rounded-3xl p-12 text-center mb-12 border border-white/10 shadow-2xl">
            <div className="w-32 h-32 mx-auto mb-8 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full blur-2xl opacity-60 animate-pulse" />
              <div className="relative w-full h-full bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-2xl">
                <CheckCircle className="w-16 h-16 text-white" strokeWidth={1.5} />
              </div>
            </div>

            <h1 className="text-5xl font-bold text-white mb-6 tracking-tight">
              {t('프로필 설정 완료!', 'Profile Complete!')}
            </h1>

            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
              {t('축하합니다! 이제 N3RVE 플랫폼의 모든 기능을 사용할 수 있습니다',
                'Congratulations! You can now access all features of the N3RVE platform')}
            </p>

            <div className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-full border border-yellow-500/30 backdrop-blur-sm">
              <Star className="w-6 h-6 text-yellow-400 animate-spin-slow" />
              <span className="text-yellow-200 font-semibold text-lg">
                {t('프로필 100% 완성', '100% Profile Complete')}
              </span>
            </div>
          </div>
        </div>

        {/* Achievements */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            {t('달성한 목표', 'Your Achievements')}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {achievements.map((achievement, index) => {
              const Icon = achievement.icon;
              return (
                <div
                  key={index}
                  className="group relative overflow-hidden"
                >
                  {/* Card glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  <div className="relative bg-white/5 backdrop-blur-md rounded-2xl p-8 text-center border border-white/10 hover:border-white/20 transition-all duration-500 hover:transform hover:scale-105">
                    <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${achievement.color} flex items-center justify-center shadow-2xl`}>
                      <Icon className="w-10 h-10 text-white" strokeWidth={1.5} />
                    </div>
                    <h3 className="font-semibold text-xl text-white mb-3">{achievement.title}</h3>
                    <p className="text-gray-400 leading-relaxed">{achievement.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Next Steps */}
        <div className="space-y-8">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            {t('다음 단계', "What's Next?")}
          </h2>

          {nextSteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={index}
                className="group relative overflow-hidden rounded-2xl"
              >
                {/* Card glow */}
                <div className={`absolute inset-0 bg-gradient-to-r ${step.gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-500`} />

                <div className="relative bg-white/5 backdrop-blur-md rounded-2xl p-10 border border-white/10 hover:border-white/20 transition-all duration-500">
                  <div className="flex items-center justify-between gap-8">
                    <div className="flex-1">
                      <h3 className="text-2xl font-semibold text-white mb-4">{step.title}</h3>
                      <p className="text-gray-300 text-lg mb-6 leading-relaxed">{step.description}</p>
                      <button
                        onClick={step.action}
                        className={`px-8 py-4 bg-gradient-to-r ${step.gradient} hover:shadow-2xl rounded-xl font-medium transition-all duration-300 hover:transform hover:scale-105 inline-flex items-center gap-3 text-white text-lg shadow-lg`}
                      >
                        {step.buttonText}
                        <ArrowRight className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="hidden lg:block">
                      <div className={`w-40 h-40 rounded-2xl bg-gradient-to-br ${step.gradient} opacity-20 flex items-center justify-center backdrop-blur-sm`}>
                        <Icon className="w-20 h-20 text-white opacity-60" strokeWidth={1} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Additional Options */}
        <div className="mt-16 text-center">
          <p className="text-gray-500 mb-4">{t('다른 옵션', 'Other Options')}</p>
          <div className="flex items-center justify-center gap-6">
            <button
              onClick={() => navigate('/guide')}
              className="text-gray-400 hover:text-white transition-colors duration-300 font-medium"
            >
              {t('가이드 보기', 'View Guides')}
            </button>
            <span className="text-gray-600">•</span>
            <button
              onClick={() => navigate('/profile')}
              className="text-gray-400 hover:text-white transition-colors duration-300 font-medium"
            >
              {t('프로필 수정', 'Edit Profile')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileComplete;
