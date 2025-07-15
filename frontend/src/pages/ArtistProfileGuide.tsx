import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Image, Link, Music, CheckCircle, AlertCircle, Star } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

const ArtistProfileGuide = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const sections = [
    {
      icon: User,
      title: t('profileGuide.basicInfo'),
      color: 'from-purple-500 to-pink-500',
      items: [
        t('profileGuide.artistName'),
        t('profileGuide.biography'),
        t('profileGuide.genre'),
        t('profileGuide.location')
      ]
    },
    {
      icon: Image,
      title: t('profileGuide.visualAssets'),
      color: 'from-blue-500 to-cyan-500',
      items: [
        t('profileGuide.profilePhoto'),
        t('profileGuide.coverImage'),
        t('profileGuide.consistent'),
        t('profileGuide.professional')
      ]
    },
    {
      icon: Link,
      title: t('profileGuide.socialLinks'),
      color: 'from-green-500 to-emerald-500',
      items: [
        t('profileGuide.spotify'),
        t('profileGuide.instagram'),
        t('profileGuide.youtube'),
        t('profileGuide.website')
      ]
    },
    {
      icon: Music,
      title: t('profileGuide.musicCatalog'),
      color: 'from-orange-500 to-red-500',
      items: [
        t('profileGuide.discography'),
        t('profileGuide.featured'),
        t('profileGuide.collaborations'),
        t('profileGuide.credits')
      ]
    }
  ];

  const bestPractices = [
    {
      text: t('profileGuide.updateRegularly')
    },
    {
      text: t('profileGuide.engageAudience')
    },
    {
      text: t('profileGuide.seoOptimize')
    },
    {
      text: t('profileGuide.authentic')
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="glass-effect rounded-2xl p-8 animate-fade-in">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            {t('common.back')}
          </button>
          
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg">
              <Star className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold gradient-text mb-2">
                {t('profileGuide.title')}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {t('profileGuide.subtitle')}
              </p>
            </div>
          </div>
        </div>

        {/* Profile Sections */}
        <div className="space-y-6">
          {sections.map((section, index) => {
            const Icon = section.icon;
            return (
              <div
                key={index}
                className="card-glass p-6 hover-lift animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-r ${section.color} shadow-lg flex-shrink-0`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">{section.title}</h3>
                    <ul className="space-y-2">
                      {section.items.map((item, itemIndex) => (
                        <li key={itemIndex} className="flex items-start gap-2 text-gray-600 dark:text-gray-400">
                          <span className="text-purple-500 mt-1">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Best Practices */}
        <div className="glass-effect rounded-2xl p-8 animate-fade-in-delay">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-purple-500" />
            {t('profileGuide.bestPractices')}
          </h2>
          <div className="space-y-4">
            {bestPractices.map((practice, index) => (
              <div key={index} className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                <p className="text-gray-600 dark:text-gray-400">{practice.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="glass-effect rounded-2xl p-8 text-center animate-fade-in-delay">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            {t('profileGuide.readyToStart')}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {t('profileGuide.ctaText')}
          </p>
          <button
            onClick={() => navigate('/profile')}
            className="btn-modern btn-primary hover-lift"
          >
            {t('profileGuide.createProfile')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ArtistProfileGuide;