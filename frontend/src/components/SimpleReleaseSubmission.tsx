import { useState } from 'react';
import { FileText } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import { useLanguageStore } from '@/store/language.store';
import useSafeStore from '@/hooks/useSafeStore';

/**
 * Simplified release submission form as a fallback
 * This prevents any complex .map() operations that might cause errors
 */
export default function SimpleReleaseSubmission() {
  const language = useSafeStore(useLanguageStore, (state) => state.language) || 'ko';
  const [formData, setFormData] = useState({
    albumTitle: '',
    artistName: '',
    description: ''
  });

  const t = (ko: string, en: string) => language === 'ko' ? ko : en;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('음원 발매 신청', 'Music Release Submission')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('기본 정보를 입력해주세요', 'Please enter basic information')}
          </p>
        </div>

        {/* Form */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('앨범명', 'Album Title')}
              </label>
              <Input
                value={formData.albumTitle}
                onChange={(e) => setFormData(prev => ({ ...prev, albumTitle: e.target.value }))}
                placeholder={t('앨범명을 입력하세요', 'Enter album title')}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('아티스트명', 'Artist Name')}
              </label>
              <Input
                value={formData.artistName}
                onChange={(e) => setFormData(prev => ({ ...prev, artistName: e.target.value }))}
                placeholder={t('아티스트명을 입력하세요', 'Enter artist name')}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('앨범 설명', 'Album Description')}
            </label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder={t('앨범에 대한 설명을 입력하세요', 'Enter album description')}
              rows={4}
            />
          </div>
        </div>

        {/* Notice */}
        <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <FileText className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                {t('임시 양식', 'Temporary Form')}
              </h3>
              <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                {t(
                  '현재 메인 양식에 기술적 문제가 있어 임시 양식을 표시하고 있습니다. 곧 해결될 예정입니다.',
                  'There is currently a technical issue with the main form. This temporary form is being displayed and will be resolved soon.'
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="mt-8 flex justify-center">
          <Button
            size="lg"
            onClick={() => {
              console.log('Form submitted:', formData);
              alert(t('양식이 제출되었습니다!', 'Form submitted!'));
            }}
          >
            {t('제출하기', 'Submit')}
          </Button>
        </div>
      </div>
    </div>
  );
}
