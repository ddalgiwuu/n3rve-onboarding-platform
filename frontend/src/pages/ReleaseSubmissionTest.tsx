import { useState } from 'react';
import { useLanguageStore } from '@/store/language.store';
import useSafeStore from '@/hooks/useSafeStore';
import { Users, FileText, Music } from 'lucide-react';

export default function ReleaseSubmissionTest() {
  const language = useSafeStore(useLanguageStore, (state) => state.language);

  // Translation function
  const t = (ko: string, en: string) => language === 'ko' ? ko : en;

  console.log('Language:', language);
  console.log('Translation function:', t);
  console.log('Test translation:', t('테스트', 'Test'));

  const [currentStep, setCurrentStep] = useState(0);

  // Simple steps configuration to test
  const steps = [
    { id: 0, label: t('아티스트 정보', 'Artist Information'), icon: Users },
    { id: 1, label: t('앨범 기본 정보', 'Album Basic Information'), icon: FileText },
    { id: 2, label: t('트랙 정보', 'Track Information'), icon: Music }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          {t('릴리즈 제출 테스트', 'Release Submission Test')}
        </h1>

        <div className="space-y-4">
          <div>
            <strong>Language:</strong> {language}
          </div>
          <div>
            <strong>Steps:</strong>
          </div>
          <ul className="list-disc pl-6">
            {steps.map((step) => (
              <li key={step.id}>
                {step.label}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
