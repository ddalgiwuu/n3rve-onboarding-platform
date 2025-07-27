import { useState } from 'react';
import { useLanguageStore } from '@/store/language.store';
import useSafeStore from '@/hooks/useSafeStore';
import {
  Music, FileText, Send, ArrowRight, ArrowLeft,
  CheckCircle, Info, Users, Globe, Megaphone,
  Upload, Calendar, Shield, UserCheck, Image
} from 'lucide-react';
import FormCard from '@/components/ui/FormCard';
import ModernInput from '@/components/ui/ModernInput';
import ProgressSteps from '@/components/ui/ProgressSteps';
import { cn } from '@/utils/cn';

export default function ModernReleaseSubmission() {
  const language = useSafeStore(useLanguageStore, (state) => state.language);
  const t = (ko: string, en: string) => language === 'ko' ? ko : en;

  const [currentStep, setCurrentStep] = useState('basic');
  const [formData, setFormData] = useState({
    // Basic Info
    artistName: '',
    albumTitle: '',
    albumType: 'SINGLE',
    genre: [] as string[],
    releaseDate: '',

    // Content
    tracks: [],
    contributors: [],
    albumArt: null,
    audioFiles: [],

    // Distribution & Marketing
    territories: [],
    distributors: [],
    marketingInfo: {},

    // Legal & Final
    copyrightHolder: '',
    copyrightYear: '',
    agreement: false,
    finalNotes: ''
  });

  // 4단계로 간소화된 스텝
  const steps = [
    {
      id: 'basic',
      title: t('기본 정보', 'Basic Info'),
      description: t('아티스트 및 앨범 정보', 'Artist and Album Information'),
      icon: <Music />,
      sections: [
        { name: t('아티스트 정보', 'Artist Info'), icon: <Users />, fields: ['artistName', 'genre'] },
        { name: t('앨범 정보', 'Album Info'), icon: <FileText />, fields: ['albumTitle', 'albumType', 'releaseDate'] }
      ]
    },
    {
      id: 'content',
      title: t('콘텐츠', 'Content'),
      description: t('트랙, 파일 및 기여자', 'Tracks, Files & Contributors'),
      icon: <Upload />,
      sections: [
        { name: t('트랙 정보', 'Track Info'), icon: <Music />, fields: ['tracks'] },
        { name: t('기여자', 'Contributors'), icon: <UserCheck />, fields: ['contributors'] },
        { name: t('파일 업로드', 'File Upload'), icon: <Image />, fields: ['albumArt', 'audioFiles'] }
      ]
    },
    {
      id: 'distribution',
      title: t('배포 & 마케팅', 'Distribution & Marketing'),
      description: t('배포 설정 및 마케팅', 'Distribution Settings & Marketing'),
      icon: <Globe />,
      sections: [
        { name: t('배포 설정', 'Distribution Settings'), icon: <Globe />, fields: ['territories', 'distributors'] },
        { name: t('마케팅 정보', 'Marketing Info'), icon: <Megaphone />, fields: ['marketingInfo'] },
        { name: t('릴리즈 설정', 'Release Settings'), icon: <Calendar />, fields: ['releaseSettings'] }
      ]
    },
    {
      id: 'final',
      title: t('검토 & 제출', 'Review & Submit'),
      description: t('최종 검토 및 제출', 'Final Review & Submission'),
      icon: <Send />,
      sections: [
        { name: t('권리 정보', 'Rights Info'), icon: <Shield />, fields: ['copyrightHolder', 'copyrightYear'] },
        { name: t('최종 검토', 'Final Review'), icon: <CheckCircle />, fields: ['agreement', 'finalNotes'] }
      ]
    }
  ];

  const currentStepIndex = steps.findIndex(step => step.id === currentStep);
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;

  const handleNext = () => {
    if (!isLastStep) {
      setCurrentStep(steps[currentStepIndex + 1].id);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStep(steps[currentStepIndex - 1].id);
    }
  };

  const handleStepClick = (stepId: string) => {
    setCurrentStep(stepId);
  };

  const renderBasicInfoStep = () => (
    <div className="space-y-6">
      {/* Artist Section */}
      <FormCard
        title={t('아티스트 정보', 'Artist Information')}
        description={t('아티스트의 기본 정보를 입력해주세요', 'Please enter basic artist information')}
        icon={<Users />}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ModernInput
            label={t('아티스트 이름', 'Artist Name')}
            placeholder={t('예: IU, BTS', 'e.g., IU, BTS')}
            value={formData.artistName}
            onChange={(e) => setFormData({ ...formData, artistName: e.target.value })}
            required
          />

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('장르', 'Genre')} <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {['K-Pop', 'Pop', 'Rock', 'Hip-Hop', 'R&B', 'Electronic', 'Jazz', 'Classical'].map((genre) => (
                <label key={genre} className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    onChange={(e) => {
                      const newGenres = e.target.checked
                        ? [...formData.genre, genre]
                        : formData.genre.filter(g => g !== genre);
                      setFormData({ ...formData, genre: newGenres });
                    }}
                  />
                  <span className="text-sm">{genre}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </FormCard>

      {/* Album Section */}
      <FormCard
        title={t('앨범 정보', 'Album Information')}
        description={t('앨범의 기본 정보를 입력해주세요', 'Please enter basic album information')}
        icon={<FileText />}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ModernInput
            label={t('앨범 제목', 'Album Title')}
            placeholder={t('예: Love Yourself', 'e.g., Love Yourself')}
            value={formData.albumTitle}
            onChange={(e) => setFormData({ ...formData, albumTitle: e.target.value })}
            required
          />

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('앨범 타입', 'Album Type')} <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'SINGLE', label: t('싱글', 'Single') },
                { value: 'EP', label: 'EP' },
                { value: 'ALBUM', label: t('정규앨범', 'Full Album') }
              ].map((type) => (
                <label key={type.value} className={cn(
                  'flex items-center justify-center p-3 rounded-lg border-2 transition-all cursor-pointer',
                  formData.albumType === type.value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                )}>
                  <input
                    type="radio"
                    name="albumType"
                    value={type.value}
                    checked={formData.albumType === type.value}
                    onChange={(e) => setFormData({ ...formData, albumType: e.target.value })}
                    className="sr-only"
                  />
                  <span className="text-sm font-medium">{type.label}</span>
                </label>
              ))}
            </div>
          </div>

          <ModernInput
            type="date"
            label={t('발매일', 'Release Date')}
            value={formData.releaseDate}
            onChange={(e) => setFormData({ ...formData, releaseDate: e.target.value })}
            required
          />
        </div>
      </FormCard>
    </div>
  );

  const renderContentStep = () => (
    <div className="space-y-6">
      <FormCard
        title={t('트랙 정보', 'Track Information')}
        description={t('앨범에 포함될 트랙들을 추가해주세요', 'Please add tracks to include in the album')}
        icon={<Music />}
      >
        <div className="text-center py-12">
          <Music className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {t('아직 추가된 트랙이 없습니다', 'No tracks added yet')}
          </p>
          <button className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
            {t('트랙 추가', 'Add Track')}
          </button>
        </div>
      </FormCard>

      <FormCard
        title={t('파일 업로드', 'File Upload')}
        description={t('앨범 커버와 오디오 파일을 업로드해주세요', 'Please upload album cover and audio files')}
        icon={<Upload />}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('앨범 커버', 'Album Cover')} <span className="text-red-500">*</span>
            </label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
              <Image className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-2">
                {t('이미지를 드래그하거나 클릭하여 업로드', 'Drag or click to upload image')}
              </p>
              <p className="text-xs text-gray-400">
                {t('최소 3000x3000px, JPG/PNG', 'Min 3000x3000px, JPG/PNG')}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('오디오 파일', 'Audio Files')} <span className="text-red-500">*</span>
            </label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-2">
                {t('오디오 파일을 드래그하거나 클릭하여 업로드', 'Drag or click to upload audio files')}
              </p>
              <p className="text-xs text-gray-400">
                {t('WAV, FLAC 권장 (최소 16bit/44.1kHz)', 'WAV, FLAC recommended (min 16bit/44.1kHz)')}
              </p>
            </div>
          </div>
        </div>
      </FormCard>
    </div>
  );

  const renderDistributionStep = () => (
    <div className="space-y-6">
      <FormCard
        title={t('배포 설정', 'Distribution Settings')}
        description={t('음원을 배포할 플랫폼과 지역을 선택해주세요', 'Please select platforms and regions to distribute your music')}
        icon={<Globe />}
      >
        <div className="text-center py-12">
          <Globe className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            {t('배포 설정을 구성해주세요', 'Please configure distribution settings')}
          </p>
        </div>
      </FormCard>

      <FormCard
        title={t('마케팅 정보', 'Marketing Information')}
        description={t('음원의 마케팅에 도움이 될 정보를 입력해주세요', 'Please enter information that will help with marketing your music')}
        icon={<Megaphone />}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ModernInput
            label={t('우선순위 레벨 (1-5)', 'Priority Level (1-5)')}
            type="number"
            min="1"
            max="5"
            placeholder="3"
            hint={t('마케팅 우선순위 (1: 낮음, 5: 높음)', 'Marketing priority (1: Low, 5: High)')}
          />

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('프로젝트 타입', 'Project Type')}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'FRONTLINE', label: t('프론트라인', 'Frontline') },
                { value: 'CATALOG', label: t('카탈로그', 'Catalog') }
              ].map((type) => (
                <label key={type.value} className={cn(
                  'flex items-center justify-center p-3 rounded-lg border-2 transition-all cursor-pointer',
                  'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                )}>
                  <input
                    type="radio"
                    name="projectType"
                    value={type.value}
                    className="sr-only"
                  />
                  <span className="text-sm font-medium">{type.label}</span>
                </label>
              ))}
            </div>
          </div>

          <ModernInput
            label={t('비공개 청취 링크', 'Private Listen Link')}
            type="url"
            placeholder="https://example.com/private-link"
            hint={t('미리 들어볼 수 있는 비공개 링크', 'Private link for preview listening')}
          />

          <ModernInput
            label={t('팩트시트 URL', 'Factsheet URL')}
            type="url"
            placeholder="https://example.com/factsheet.pdf"
            hint={t('아티스트/앨범 정보 문서', 'Artist/Album information document')}
          />
        </div>
      </FormCard>
    </div>
  );

  const renderFinalStep = () => (
    <div className="space-y-6">
      <FormCard
        title={t('권리 및 법적 정보', 'Rights & Legal Information')}
        description={t('저작권 및 법적 정보를 입력해주세요', 'Please enter copyright and legal information')}
        icon={<Shield />}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ModernInput
            label={t('저작권자', 'Copyright Holder')}
            placeholder={t('예: (주)하이브', 'e.g., HYBE Corp.')}
            value={formData.copyrightHolder}
            onChange={(e) => setFormData({ ...formData, copyrightHolder: e.target.value })}
            required
          />

          <ModernInput
            label={t('저작권 연도', 'Copyright Year')}
            type="number"
            placeholder="2024"
            value={formData.copyrightYear}
            onChange={(e) => setFormData({ ...formData, copyrightYear: e.target.value })}
            required
          />
        </div>
      </FormCard>

      <FormCard
        title={t('최종 검토', 'Final Review')}
        description={t('제출하기 전에 모든 정보를 다시 한 번 확인해주세요', 'Please review all information one more time before submitting')}
        icon={<CheckCircle />}
      >
        <div className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">
                  {t('제출 전 체크리스트', 'Pre-submission Checklist')}
                </h4>
                <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    {t('모든 필수 정보가 정확히 입력되었습니다', 'All required information has been entered correctly')}
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    {t('업로드된 파일들이 품질 기준을 충족합니다', 'Uploaded files meet quality standards')}
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    {t('저작권 정보가 올바르게 기재되었습니다', 'Copyright information has been correctly entered')}
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <label className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl cursor-pointer">
            <input
              type="checkbox"
              checked={formData.agreement}
              onChange={(e) => setFormData({ ...formData, agreement: e.target.checked })}
              className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 mt-0.5"
            />
            <div className="text-sm">
              <span className="text-gray-900 dark:text-white">
                {t('이용약관 및 개인정보처리방침에 동의합니다', 'I agree to the Terms of Service and Privacy Policy')}
              </span>
              <span className="text-red-500 ml-1">*</span>
            </div>
          </label>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('추가 메모 (선택사항)', 'Additional Notes (Optional)')}
            </label>
            <textarea
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
              placeholder={t('특별한 요청사항이나 추가 정보가 있다면 적어주세요', 'Please write any special requests or additional information')}
              value={formData.finalNotes}
              onChange={(e) => setFormData({ ...formData, finalNotes: e.target.value })}
            />
          </div>
        </div>
      </FormCard>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 'basic':
        return renderBasicInfoStep();
      case 'content':
        return renderContentStep();
      case 'distribution':
        return renderDistributionStep();
      case 'final':
        return renderFinalStep();
      default:
        return renderBasicInfoStep();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {t('릴리즈 제출', 'Release Submission')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            {t('간단한 4단계로 음원을 전 세계에 배포하세요', 'Distribute your music worldwide in 4 simple steps')}
          </p>
        </div>

        {/* Progress Steps */}
        <ProgressSteps
          steps={steps}
          currentStep={currentStep}
          onStepClick={handleStepClick}
          className="mb-8"
        />

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            {renderStepContent()}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrevious}
              disabled={isFirstStep}
              className={cn(
                'flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all',
                isFirstStep
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm'
              )}
            >
              <ArrowLeft className="w-4 h-4" />
              {t('이전', 'Previous')}
            </button>

            <div className="text-sm text-gray-500 dark:text-gray-400">
              {currentStepIndex + 1} / {steps.length}
            </div>

            {isLastStep ? (
              <button
                disabled={!formData.agreement}
                className={cn(
                  'flex items-center gap-2 px-8 py-3 rounded-xl font-medium transition-all',
                  formData.agreement
                    ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-500/30'
                    : 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                )}
              >
                <Send className="w-4 h-4" />
                {t('제출하기', 'Submit')}
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30"
              >
                {t('다음', 'Next')}
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
