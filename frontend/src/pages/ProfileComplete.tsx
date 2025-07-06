import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, User, Music, Globe, Star, ArrowRight } from 'lucide-react';
import { useLanguageStore } from '@/store/language.store';
import confetti from 'canvas-confetti';

const ProfileComplete = () => {
  const navigate = useNavigate();
  const { t } = useLanguageStore();

  useEffect(() => {
    // Trigger confetti animation
    confetti({
      particleCount: 150,
      spread: 100,
      origin: { y: 0.6 },
      colors: ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B']
    });
  }, []);

  const achievements = [
    {
      icon: <User className="w-6 h-6" />,
      title: t('profileComplete.basicInfo', 'Basic Information'),
      description: t('profileComplete.basicInfoDesc', 'Your artist details are complete')
    },
    {
      icon: <Music className="w-6 h-6" />,
      title: t('profileComplete.musicCatalog', 'Music Catalog'),
      description: t('profileComplete.musicCatalogDesc', 'Your discography is ready')
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: t('profileComplete.socialLinks', 'Social Links'),
      description: t('profileComplete.socialLinksDesc', 'All platforms connected')
    }
  ];

  const nextSteps = [
    {
      title: t('profileComplete.submitMusic', 'Submit Your Music'),
      description: t('profileComplete.submitMusicDesc', 'Start distributing your tracks to 150+ platforms'),
      action: () => navigate('/submit'),
      buttonText: t('profileComplete.startSubmission', 'Start Submission')
    },
    {
      title: t('profileComplete.exploreGuides', 'Explore Guides'),
      description: t('profileComplete.exploreGuidesDesc', 'Learn best practices for music distribution'),
      action: () => navigate('/guide'),
      buttonText: t('profileComplete.viewGuides', 'View Guides')
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Success Hero */}
        <div className="glass-effect rounded-2xl p-12 text-center mb-8 animate-scale-in">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          
          <h1 className="text-4xl font-bold text-white mb-4">
            {t('profileComplete.title', 'Profile Complete!')}
          </h1>
          
          <p className="text-xl text-gray-300 mb-8">
            {t('profileComplete.subtitle', 'Congratulations! Your artist profile is now 100% complete.')}
          </p>
          
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-purple-500/20 rounded-full border border-purple-500/30">
            <Star className="w-5 h-5 text-yellow-400" />
            <span className="text-purple-300 font-medium">
              {t('profileComplete.profileScore', 'Profile Score: 100/100')}
            </span>
          </div>
        </div>

        {/* Achievements */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white text-center mb-8">
            {t('profileComplete.achievements', 'Your Achievements')}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {achievements.map((achievement, index) => (
              <div
                key={index}
                className="glass-effect rounded-xl p-6 text-center animate-slide-in hover-lift"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                  {achievement.icon}
                </div>
                <h3 className="font-semibold text-white mb-2">{achievement.title}</h3>
                <p className="text-gray-400 text-sm">{achievement.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Next Steps */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white text-center mb-6">
            {t('profileComplete.whatNext', "What's Next?")}
          </h2>
          
          {nextSteps.map((step, index) => (
            <div
              key={index}
              className="glass-effect rounded-xl p-8 animate-slide-in-delayed hover-lift"
              style={{ animationDelay: `${index * 0.1 + 0.3}s` }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white mb-2">{step.title}</h3>
                  <p className="text-gray-300 mb-4">{step.description}</p>
                  <button
                    onClick={step.action}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg font-medium transition-all hover-lift inline-flex items-center gap-2"
                  >
                    {step.buttonText}
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
                <div className="hidden md:block ml-8">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
                    <Music className="w-16 h-16 text-purple-400" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Skip to Dashboard */}
        <div className="mt-12 text-center animate-fade-in-delayed">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-400 hover:text-white transition-colors"
          >
            {t('profileComplete.skipToDashboard', 'Or go to Dashboard →')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileComplete;