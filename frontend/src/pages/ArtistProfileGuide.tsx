import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Image, Link, Globe, Music, CheckCircle, AlertCircle, Star } from 'lucide-react';
import { useLanguageStore } from '@/store/language.store';

const ArtistProfileGuide = () => {
  const navigate = useNavigate();
  const { t } = useLanguageStore();

  const sections = [
    {
      icon: <User className="w-6 h-6" />,
      title: t('profileGuide.basicInfo', 'Basic Information'),
      items: [
        t('profileGuide.artistName', 'Choose a unique artist name'),
        t('profileGuide.biography', 'Write a compelling biography'),
        t('profileGuide.genre', 'Select appropriate genres'),
        t('profileGuide.location', 'Add your location')
      ]
    },
    {
      icon: <Image className="w-6 h-6" />,
      title: t('profileGuide.visualAssets', 'Visual Assets'),
      items: [
        t('profileGuide.profilePhoto', 'High-quality profile photo (min. 1000x1000px)'),
        t('profileGuide.coverImage', 'Eye-catching cover image'),
        t('profileGuide.consistent', 'Maintain consistent visual branding'),
        t('profileGuide.professional', 'Use professional photography when possible')
      ]
    },
    {
      icon: <Link className="w-6 h-6" />,
      title: t('profileGuide.socialLinks', 'Social Media Links'),
      items: [
        t('profileGuide.spotify', 'Link your Spotify artist profile'),
        t('profileGuide.instagram', 'Connect Instagram for updates'),
        t('profileGuide.youtube', 'Add YouTube channel'),
        t('profileGuide.website', 'Include your official website')
      ]
    },
    {
      icon: <Music className="w-6 h-6" />,
      title: t('profileGuide.musicCatalog', 'Music Catalog'),
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
      icon: <CheckCircle className="w-5 h-5 text-green-400" />,
      text: t('profileGuide.updateRegularly', 'Update your profile regularly with new releases and achievements')
    },
    {
      icon: <CheckCircle className="w-5 h-5 text-green-400" />,
      text: t('profileGuide.engageAudience', 'Engage with your audience through profile updates')
    },
    {
      icon: <CheckCircle className="w-5 h-5 text-green-400" />,
      text: t('profileGuide.seoOptimize', 'Use SEO-friendly descriptions and keywords')
    },
    {
      icon: <CheckCircle className="w-5 h-5 text-green-400" />,
      text: t('profileGuide.authentic', 'Stay authentic to your artistic identity')
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="glass-effect rounded-2xl p-8 mb-8 animate-fade-in">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            {t('common.back', 'Back')}
          </button>
          
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <Star className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">
                {t('profileGuide.title', 'Artist Profile Guide')}
              </h1>
              <p className="text-gray-300 mt-2">
                {t('profileGuide.subtitle', 'Create a compelling artist profile that stands out')}
              </p>
            </div>
          </div>
        </div>

        {/* Profile Sections */}
        <div className="space-y-6 mb-8">
          {sections.map((section, index) => (
            <div
              key={index}
              className="glass-effect rounded-xl p-6 animate-slide-in hover-lift"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                  {React.cloneElement(section.icon, { className: 'w-6 h-6 text-purple-400' })}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white mb-3">{section.title}</h3>
                  <ul className="space-y-2">
                    {section.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-start gap-2 text-gray-300">
                        <span className="text-purple-400 mt-1">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Best Practices */}
        <div className="glass-effect rounded-xl p-8 animate-slide-in-delayed">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-purple-400" />
            {t('profileGuide.bestPractices', 'Best Practices')}
          </h2>
          <div className="space-y-4">
            {bestPractices.map((practice, index) => (
              <div key={index} className="flex items-start gap-3">
                {practice.icon}
                <p className="text-gray-300">{practice.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="glass-effect rounded-xl p-8 mt-8 text-center animate-fade-in-delayed">
          <h3 className="text-xl font-semibold text-white mb-4">
            {t('profileGuide.readyToStart', 'Ready to create your profile?')}
          </h3>
          <p className="text-gray-300 mb-6">
            {t('profileGuide.ctaText', 'Follow this guide to build a professional artist profile that attracts fans and industry professionals.')}
          </p>
          <button
            onClick={() => navigate('/profile')}
            className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg font-medium transition-all hover-lift"
          >
            {t('profileGuide.createProfile', 'Create Your Profile')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ArtistProfileGuide;