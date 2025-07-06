import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, Calendar, Clock, Mail, ArrowRight, Home, FileText } from 'lucide-react';
import { useLanguageStore } from '@/store/language.store';
import confetti from 'canvas-confetti';

const SubmissionSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguageStore();
  const submissionId = location.state?.submissionId || 'SUB-' + Date.now();

  React.useEffect(() => {
    // Trigger confetti animation
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#8B5CF6', '#3B82F6', '#10B981']
    });
  }, []);

  const nextSteps = [
    {
      icon: <Clock className="w-6 h-6" />,
      title: t('success.reviewTime', 'Review Time'),
      description: t('success.reviewTimeDesc', 'Your submission will be reviewed within 2-3 business days')
    },
    {
      icon: <Mail className="w-6 h-6" />,
      title: t('success.emailNotification', 'Email Notification'),
      description: t('success.emailDesc', 'You will receive an email once your submission is reviewed')
    },
    {
      icon: <Calendar className="w-6 h-6" />,
      title: t('success.releaseSchedule', 'Release Schedule'),
      description: t('success.releaseDesc', 'If approved, your release will be scheduled according to your preferred date')
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 p-6 flex items-center justify-center">
      <div className="max-w-2xl w-full">
        {/* Success Card */}
        <div className="glass-effect rounded-2xl p-8 text-center animate-scale-in">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center animate-bounce">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          
          <h1 className="text-4xl font-bold text-white mb-4">
            {t('success.title', 'Submission Successful!')}
          </h1>
          
          <p className="text-xl text-gray-300 mb-8">
            {t('success.message', 'Your music has been successfully submitted for review.')}
          </p>
          
          <div className="glass-effect rounded-lg p-4 mb-8 bg-purple-500/10 border border-purple-500/30">
            <p className="text-sm text-gray-400 mb-1">{t('success.submissionId', 'Submission ID')}</p>
            <p className="text-lg font-mono text-purple-400">{submissionId}</p>
          </div>
        </div>

        {/* Next Steps */}
        <div className="mt-8 space-y-4">
          <h2 className="text-2xl font-bold text-white text-center mb-6">
            {t('success.nextSteps', 'What Happens Next?')}
          </h2>
          
          {nextSteps.map((step, index) => (
            <div
              key={index}
              className="glass-effect rounded-xl p-6 flex items-start gap-4 animate-slide-in hover-lift"
              style={{ animationDelay: `${index * 0.1 + 0.3}s` }}
            >
              <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                {React.cloneElement(step.icon, { className: 'w-6 h-6 text-purple-400' })}
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">{step.title}</h3>
                <p className="text-gray-300">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 animate-fade-in-delayed">
          <button
            onClick={() => navigate('/submissions')}
            className="flex-1 px-6 py-3 glass-effect hover:bg-gray-800/50 rounded-lg font-medium transition-all hover-lift flex items-center justify-center gap-2"
          >
            <FileText className="w-5 h-5" />
            {t('success.viewSubmissions', 'View My Submissions')}
          </button>
          
          <button
            onClick={() => navigate('/dashboard')}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg font-medium transition-all hover-lift flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" />
            {t('success.backToDashboard', 'Back to Dashboard')}
          </button>
        </div>

        {/* Additional Info */}
        <div className="mt-8 text-center text-gray-400 text-sm animate-fade-in-delayed">
          <p>
            {t('success.questions', 'Have questions?')}{' '}
            <a href="mailto:support@n3rve.com" className="text-purple-400 hover:text-purple-300 transition-colors">
              {t('success.contactSupport', 'Contact our support team')}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SubmissionSuccess;