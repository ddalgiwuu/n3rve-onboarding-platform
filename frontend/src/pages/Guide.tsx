import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Music, Upload, FileText, CheckCircle, Users, TrendingUp, HelpCircle, Zap, Globe } from 'lucide-react';
import { useLanguageStore } from '@/store/language.store';

const Guide = () => {
  const navigate = useNavigate();
  const { t } = useLanguageStore();

  const guides = [
    {
      icon: <Upload className="w-8 h-8" />,
      title: t('guide.submission', 'Submission Process'),
      description: t('guide.submissionDesc', 'Learn how to submit your music to N3RVE'),
      link: '/guide/submission',
      color: 'from-purple-500 to-blue-500'
    },
    {
      icon: <Music className="w-8 h-8" />,
      title: t('guide.artistProfile', 'Artist Profile Setup'),
      description: t('guide.artistProfileDesc', 'Create a compelling artist profile'),
      link: '/guide/artist-profile',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: <FileText className="w-8 h-8" />,
      title: t('guide.technical', 'Technical Requirements'),
      description: t('guide.technicalDesc', 'Audio specs, formats, and guidelines'),
      link: '/guide/technical',
      color: 'from-cyan-500 to-teal-500'
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: t('guide.marketing', 'Marketing Best Practices'),
      description: t('guide.marketingDesc', 'Promote your music effectively'),
      link: '/guide/marketing',
      color: 'from-teal-500 to-green-500'
    }
  ];

  const quickTips = [
    {
      icon: <CheckCircle className="w-5 h-5 text-green-400" />,
      title: t('guide.tip1Title', 'Complete Your Profile'),
      text: t('guide.tip1Text', 'A complete profile increases your chances of approval by 80%')
    },
    {
      icon: <Zap className="w-5 h-5 text-yellow-400" />,
      title: t('guide.tip2Title', 'High-Quality Audio'),
      text: t('guide.tip2Text', 'Submit WAV files at 24-bit/48kHz or higher for best results')
    },
    {
      icon: <Globe className="w-5 h-5 text-blue-400" />,
      title: t('guide.tip3Title', 'Global Reach'),
      text: t('guide.tip3Text', 'N3RVE distributes to over 150+ streaming platforms worldwide')
    },
    {
      icon: <Users className="w-5 h-5 text-purple-400" />,
      title: t('guide.tip4Title', 'Community Support'),
      text: t('guide.tip4Text', 'Join our Discord community for tips and networking')
    }
  ];

  const faqs = [
    {
      question: t('guide.faq1Q', 'How long does the review process take?'),
      answer: t('guide.faq1A', 'Typically 2-3 business days for initial review')
    },
    {
      question: t('guide.faq2Q', 'What file formats are accepted?'),
      answer: t('guide.faq2A', 'WAV (preferred), FLAC, and high-quality MP3 (320kbps)')
    },
    {
      question: t('guide.faq3Q', 'Can I update my submission after sending?'),
      answer: t('guide.faq3A', 'Yes, you can update draft submissions anytime before final submission')
    },
    {
      question: t('guide.faq4Q', 'Is Dolby Atmos support available?'),
      answer: t('guide.faq4A', 'Yes! We fully support Dolby Atmos tracks for immersive audio experiences')
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="glass-effect rounded-2xl p-8 mb-8 animate-fade-in">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">
                {t('guide.title', 'N3RVE Guide Center')}
              </h1>
              <p className="text-gray-300 mt-2">
                {t('guide.subtitle', 'Everything you need to know about distributing your music')}
              </p>
            </div>
          </div>
        </div>

        {/* Guide Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {guides.map((guide, index) => (
            <div
              key={index}
              className="glass-effect rounded-xl p-6 hover:bg-gray-800/30 transition-all cursor-pointer hover-lift animate-slide-in"
              style={{ animationDelay: `${index * 0.1}s` }}
              onClick={() => navigate(guide.link)}
            >
              <div className="flex items-start gap-4">
                <div className={`w-16 h-16 rounded-lg bg-gradient-to-br ${guide.color} flex items-center justify-center flex-shrink-0`}>
                  {guide.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white mb-2">{guide.title}</h3>
                  <p className="text-gray-300">{guide.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Tips */}
        <div className="glass-effect rounded-xl p-8 mb-8 animate-slide-in-delayed">
          <h2 className="text-2xl font-bold text-white mb-6">{t('guide.quickTips', 'Quick Tips')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {quickTips.map((tip, index) => (
              <div key={index} className="flex items-start gap-3">
                {tip.icon}
                <div>
                  <h4 className="font-semibold text-white mb-1">{tip.title}</h4>
                  <p className="text-gray-300 text-sm">{tip.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQs */}
        <div className="glass-effect rounded-xl p-8 animate-fade-in-delayed">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <HelpCircle className="w-6 h-6 text-purple-400" />
            {t('guide.faq', 'Frequently Asked Questions')}
          </h2>
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="border-b border-gray-700 pb-6 last:border-0">
                <h3 className="font-semibold text-white mb-2">{faq.question}</h3>
                <p className="text-gray-300">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Support */}
        <div className="glass-effect rounded-xl p-8 mt-8 text-center animate-fade-in-delayed">
          <h3 className="text-xl font-semibold text-white mb-4">
            {t('guide.needHelp', 'Need More Help?')}
          </h3>
          <p className="text-gray-300 mb-6">
            {t('guide.contactText', 'Our support team is here to assist you with any questions')}
          </p>
          <button
            onClick={() => window.location.href = 'mailto:support@n3rve.com'}
            className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg font-medium transition-all hover-lift"
          >
            {t('guide.contactSupport', 'Contact Support')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Guide;