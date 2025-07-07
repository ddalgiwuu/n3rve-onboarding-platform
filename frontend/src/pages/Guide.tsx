import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Music, Upload, FileText, CheckCircle, Users, TrendingUp, HelpCircle, Zap, Globe } from 'lucide-react';
import { useLanguageStore } from '@/store/language.store';

const Guide = () => {
  const navigate = useNavigate();
  const { t } = useLanguageStore();

  const guides = [
    {
      icon: Upload,
      title: t('guide.submission', 'Submission Process'),
      description: t('guide.submissionDesc', 'Learn how to submit your music to N3RVE'),
      link: '/guide/submission',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: Music,
      title: t('guide.artistProfile', 'Artist Profile Setup'),
      description: t('guide.artistProfileDesc', 'Create a compelling artist profile'),
      link: '/guide/artist-profile',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: FileText,
      title: t('guide.technical', 'Technical Requirements'),
      description: t('guide.technicalDesc', 'Audio specs, formats, and guidelines'),
      link: '/guide/technical',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: TrendingUp,
      title: t('guide.marketing', 'Marketing Best Practices'),
      description: t('guide.marketingDesc', 'Promote your music effectively'),
      link: '/guide/marketing',
      color: 'from-orange-500 to-red-500'
    }
  ];

  const quickTips = [
    {
      icon: CheckCircle,
      iconColor: 'text-green-500',
      title: t('guide.tip1Title', 'Complete Your Profile'),
      text: t('guide.tip1Text', 'A complete profile increases your chances of approval by 80%')
    },
    {
      icon: Zap,
      iconColor: 'text-yellow-500',
      title: t('guide.tip2Title', 'High-Quality Audio'),
      text: t('guide.tip2Text', 'Submit WAV files at 24-bit/48kHz or higher for best results')
    },
    {
      icon: Globe,
      iconColor: 'text-blue-500',
      title: t('guide.tip3Title', 'Global Reach'),
      text: t('guide.tip3Text', 'N3RVE distributes to over 150+ streaming platforms worldwide')
    },
    {
      icon: Users,
      iconColor: 'text-purple-500',
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="glass-effect rounded-2xl p-8 animate-fade-in">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold gradient-text mb-2">
                {t('guide.title', 'N3RVE Guide Center')}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {t('guide.subtitle', 'Everything you need to know about distributing your music')}
              </p>
            </div>
          </div>
        </div>

        {/* Guide Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {guides.map((guide, index) => {
            const Icon = guide.icon;
            return (
              <div
                key={index}
                className="card-glass p-6 hover-lift cursor-pointer animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
                onClick={() => navigate(guide.link)}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-r ${guide.color} shadow-lg flex-shrink-0`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{guide.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400">{guide.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Tips */}
        <div className="glass-effect rounded-2xl p-8 animate-fade-in-delay">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('guide.quickTips', 'Quick Tips')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {quickTips.map((tip, index) => {
              const Icon = tip.icon;
              return (
                <div key={index} className="flex items-start gap-3">
                  <Icon className={`w-5 h-5 ${tip.iconColor} mt-0.5`} />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{tip.title}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{tip.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* FAQs */}
        <div className="glass-effect rounded-2xl p-8 animate-fade-in-delay">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
            <HelpCircle className="w-6 h-6 text-purple-500" />
            {t('guide.faq', 'Frequently Asked Questions')}
          </h2>
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-0">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{faq.question}</h3>
                <p className="text-gray-600 dark:text-gray-400">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Support */}
        <div className="glass-effect rounded-2xl p-8 text-center animate-fade-in-delay">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            {t('guide.needHelp', 'Need More Help?')}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {t('guide.contactText', 'Our support team is here to assist you with any questions')}
          </p>
          <button
            onClick={() => window.location.href = 'mailto:support@n3rve.com'}
            className="btn-modern btn-primary hover-lift"
          >
            {t('guide.contactSupport', 'Contact Support')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Guide;