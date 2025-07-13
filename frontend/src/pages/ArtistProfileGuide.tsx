import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Image, Link, Globe, Music, CheckCircle, AlertCircle, Star } from 'lucide-react';
import { useTranslation } from '@/store/language.store';

const ArtistProfileGuide = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const sections = [
    {
      icon: User,
      title: t('profileGuide.basicInfo', 'Basic Information'),
      color: 'from-purple-500 to-pink-500',
      items: [
        t('profileGuide.artistName', 'Choose a unique artist name'),
        t('profileGuide.biography', 'Write a compelling biography'),
        t('profileGuide.genre', 'Select appropriate genres'),
        t('profileGuide.location', 'Add your location')
      ]
    },
    {
      icon: Image,
      title: t('profileGuide.visualAssets', 'Visual Assets'),
      color: 'from-blue-500 to-cyan-500',
      items: [
        t('profileGuide.profilePhoto', 'High-quality profile photo (min. 1000x1000px)'),
        t('profileGuide.coverImage', 'Eye-catching cover image'),
        t('profileGuide.consistent', 'Maintain consistent visual branding'),
        t('profileGuide.professional', 'Use professional photography when possible')
      ]
    },
    {
      icon: Link,
      title: t('profileGuide.socialLinks', 'Social Media Links'),
      color: 'from-green-500 to-emerald-500',
      items: [
        t('profileGuide.spotify', 'Link your Spotify artist profile'),
        t('profileGuide.instagram', 'Connect Instagram for updates'),
        t('profileGuide.youtube', 'Add YouTube channel'),
        t('profileGuide.website', 'Include your official website')
      ]
    },
    {
      icon: Music,
      title: t('profileGuide.musicCatalog', 'Music Catalog'),
      color: 'from-orange-500 to-red-500',
      items: [
        t('profileGuide.discography', 'Complete discography listing'),
        t('profileGuide.featured', 'Highlight featured tracks'),
        t('profileGuide.collaborations', 'Include collaborations'),
        t('profileGuide.credits', 'Add production credits')
      ]
    }
  ];

  const bestPractices = [
    {
      text: t('profileGuide.updateRegularly', 'Update your profile regularly with new releases and achievements')
    },
    {
      text: t('profileGuide.engageAudience', 'Engage with your audience through profile updates')
    },
    {
      text: t('profileGuide.seoOptimize', 'Use SEO-friendly descriptions and keywords')
    },
    {
      text: t('profileGuide.authentic', 'Stay authentic to your artistic identity')
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
            {t('common.back', 'Back')}
          </button>
          
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg">
              <Star className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold gradient-text mb-2">
                {t('profileGuide.title', 'Artist Profile Guide')}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {t('profileGuide.subtitle', 'Create a compelling artist profile that stands out')}
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
            {t('profileGuide.bestPractices', 'Best Practices')}
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
            {t('profileGuide.readyToStart', 'Ready to create your profile?')}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {t('profileGuide.ctaText', 'Follow this guide to build a professional artist profile that attracts fans and industry professionals.')}
          </p>
          <button
            onClick={() => navigate('/profile')}
            className="btn-modern btn-primary hover-lift"
          >
            {t('profileGuide.createProfile', 'Create Your Profile')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ArtistProfileGuide;