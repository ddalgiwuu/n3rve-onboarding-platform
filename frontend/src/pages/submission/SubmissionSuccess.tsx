import { CheckCircle, Music, Disc, Upload, Calendar, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguageStore } from '@/store/language.store';
import useSafeStore from '@/hooks/useSafeStore';

export default function SubmissionSuccess() {
  const navigate = useNavigate();
  const language = useSafeStore(useLanguageStore, (state) => state.language);
  const t = (ko: string, en: string) => language === 'ko' ? ko : en;

  const steps = [
    { id: 1, icon: Disc, title: t('2단계', 'Step 2').split(' ')[0], description: t('2단계 앨범 정보', 'Album Information') },
    { id: 2, icon: Music, title: t('3단계', 'Step 3').split(' ')[0], description: t('3단계 트랙 정보', 'Track Information') },
    { id: 3, icon: Upload, title: t('4단계', 'Step 4').split(' ')[0], description: t('4단계 파일 업로드', 'File Upload') },
    { id: 4, icon: Calendar, title: t('5단계', 'Step 5').split(' ')[0], description: t('5단계 발매 정보', 'Release Information') },
    { id: 5, icon: Shield, title: t('6단계', 'Step 6').split(' ')[0], description: t('6단계 약관 동의', 'Terms Agreement') }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-n3rve-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Success Message */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full mb-6">
            <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
            {t('제출이 완료되었습니다!', 'Submission Complete!')}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            {t('N3RVE 팀이 제출하신 내용을 검토 후 연락드리겠습니다.', 'The N3RVE team will review your submission and contact you soon.')}
          </p>
        </div>

        {/* Steps Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            {language === 'ko' ? '제출 완료 항목' : 'Submitted Items'}
          </h2>

          <div className="space-y-4">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.id} className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full">
                    <Icon className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {step.id}. {step.title}
                      </span>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="px-8 py-3 bg-n3rve-main text-white rounded-lg hover:bg-n3rve-700 transition-colors font-medium"
          >
            {language === 'ko' ? '대시보드로 이동' : 'Go to Dashboard'}
          </button>
          <button
            onClick={() => navigate('/marketing-submission')}
            className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
          >
            {language === 'ko' ? '마케팅 정보 추가' : 'Add Marketing Info'}
          </button>
          <button
            onClick={() => navigate('/release-submission-modern')}
            className="px-8 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
          >
            {language === 'ko' ? '새 음원 등록' : 'Register New Release'}
          </button>
        </div>
      </div>
    </div>
  );
}
