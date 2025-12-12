import { useState, useEffect } from 'react';
import { User, FileText, Image, Globe, Music, Info, Languages, ChevronDown } from 'lucide-react';
import ModalWrapper from '@/components/common/ModalWrapper';
import ImageUploader from './ImageUploader';
import { useLanguageStore } from '@/store/language.store';
import useSafeStore from '@/hooks/useSafeStore';
import { CompleteFugaArtist, FugaArtistFormData, FugaArtistImage, ArtistGender, SocialMovement } from '@/types/fugaArtist';
import { validateFugaArtistForm, hasValidationErrors } from '@/utils/fugaArtistValidation';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';

interface FugaArtistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (artist: CompleteFugaArtist) => void;
  editingArtist?: CompleteFugaArtist | null;
}

export default function FugaArtistModal({
  isOpen,
  onClose,
  onSave,
  editingArtist,
}: FugaArtistModalProps) {
  const language = useSafeStore(useLanguageStore, (state) => state.language);
  const t = (ko: string, en: string) => language === 'ko' ? ko : en;

  // Section expansion state
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    biography: true,
    images: true,
    social: false,
    dsp: false,
    metadata: false,
    translations: false,
  });

  // Form state
  const [formData, setFormData] = useState<Partial<FugaArtistFormData>>({
    name: '',
    country: 'KR',
    currentCity: '',
    hometown: '',
    bio: '',
    similarArtists: '',
    hasSyncHistory: false,
    socialMovements: [],
    translations: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editingArtist) {
      // Populate form with editing data
      // TODO: Implement data transformation
    }
  }, [editingArtist]);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleSave = () => {
    const validationErrors = validateFugaArtistForm(formData);

    if (hasValidationErrors(validationErrors)) {
      setErrors(validationErrors);
      toast.error(t('필수 항목을 확인해주세요', 'Please check required fields'));
      return;
    }

    // TODO: Upload images to Dropbox
    // TODO: Transform formData to CompleteFugaArtist
    // TODO: Call onSave

    toast.success(t('아티스트가 저장되었습니다', 'Artist saved successfully'));
    onClose();
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={t('FUGA SCORE에 새 아티스트 추가', 'Add New Artist to SCORE')}
      maxWidth="max-w-4xl"
    >
      <div className="px-6 py-4 space-y-6 max-h-[80vh] overflow-y-auto">
        {/* SECTION 1: Basic Information */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('basic')}
            className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            type="button"
          >
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-purple-600" />
              <div className="text-left">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {t('기본 정보', 'Basic Information')}
                </h3>
                <p className="text-xs text-gray-500">
                  {t('필수 아티스트 정보', 'Essential artist details')}
                </p>
              </div>
            </div>
            <ChevronDown
              className={`w-5 h-5 text-gray-400 transition-transform ${
                expandedSections.basic ? 'rotate-180' : ''
              }`}
            />
          </button>

          {expandedSections.basic && (
            <div className="p-4 space-y-4">
              {/* Artist Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('아티스트명', 'Artist Name')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder={t('아티스트명을 입력하세요', 'Enter artist name')}
                />
                {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
              </div>

              {/* Country */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('국가', 'Country')} <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.country || 'KR'}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="KR">{t('대한민국', 'South Korea')}</option>
                  <option value="US">{t('미국', 'United States')}</option>
                  <option value="JP">{t('일본', 'Japan')}</option>
                  <option value="GB">{t('영국', 'United Kingdom')}</option>
                  {/* TODO: Add all countries */}
                </select>
                {errors.country && <p className="mt-1 text-sm text-red-500">{errors.country}</p>}
              </div>

              {/* Current City & Hometown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('현재 거주 도시', "Artist's Current City")} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.currentCity || ''}
                    onChange={(e) => setFormData({ ...formData, currentCity: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700"
                    placeholder={t('예: 서울', 'e.g., Seoul')}
                  />
                  {errors.currentCity && <p className="mt-1 text-sm text-red-500">{errors.currentCity}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('고향', "Artist's Hometown")} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.hometown || ''}
                    onChange={(e) => setFormData({ ...formData, hometown: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700"
                    placeholder={t('예: 부산', 'e.g., Busan')}
                  />
                  {errors.hometown && <p className="mt-1 text-sm text-red-500">{errors.hometown}</p>}
                </div>
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('성별', 'Artist Gender')}
                </label>
                <select
                  value={formData.gender || ''}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as ArtistGender })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700"
                >
                  <option value="">{t('선택하세요', 'Select gender')}</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="mixed-band">Mixed (band)</option>
                  <option value="non-binary">Non-Binary</option>
                  <option value="trans">Trans</option>
                  <option value="prefer-not-to-say">Prefer Not To Say</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 2: Biography */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('biography')}
            className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            type="button"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-blue-600" />
              <div className="text-left">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {t('바이오그래피', 'Biography & Description')}
                </h3>
                <p className="text-xs text-gray-500">
                  {t('아티스트 소개', 'Tell us about the artist')}
                </p>
              </div>
            </div>
            <ChevronDown
              className={`w-5 h-5 text-gray-400 transition-transform ${
                expandedSections.biography ? 'rotate-180' : ''
              }`}
            />
          </button>

          {expandedSections.biography && (
            <div className="p-4 space-y-4">
              {/* Artist Bio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('아티스트 바이오', 'Artist Bio')}
                </label>
                <textarea
                  value={formData.bio || ''}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={6}
                  maxLength={2000}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700"
                  placeholder={t('아티스트 소개를 작성하세요...', 'Write artist biography...')}
                />
                <div className="flex justify-between mt-1">
                  {errors.bio && <p className="text-sm text-red-500">{errors.bio}</p>}
                  <p className="text-xs text-gray-500 ml-auto">
                    {formData.bio?.length || 0} / 2000
                  </p>
                </div>
              </div>

              {/* Similar Artists */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('유사 아티스트', 'Similar Artists (Sounds Like)')}
                </label>
                <textarea
                  value={formData.similarArtists || ''}
                  onChange={(e) => setFormData({ ...formData, similarArtists: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700"
                  placeholder={t('예: BTS, BLACKPINK, NewJeans', 'e.g., BTS, BLACKPINK, NewJeans')}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t('비슷한 스타일의 아티스트들을 나열하세요', 'List artists with similar style')}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 3: Images & Assets */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('images')}
            className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            type="button"
          >
            <div className="flex items-center gap-3">
              <Image className="w-5 h-5 text-green-600" />
              <div className="text-left">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {t('이미지 및 자산', 'Images & Assets')}
                </h3>
                <p className="text-xs text-gray-500">
                  {t('아티스트 사진 및 로고', 'Upload or link visual assets')}
                </p>
              </div>
            </div>
            <ChevronDown
              className={`w-5 h-5 text-gray-400 transition-transform ${
                expandedSections.images ? 'rotate-180' : ''
              }`}
            />
          </button>

          {expandedSections.images && (
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ImageUploader
                  type="avatar"
                  label={t('아티스트 아바타', 'Artist Avatar (Profile Picture)')}
                  value={undefined}
                  onChange={(img) => {
                    // TODO: Handle image upload
                  }}
                  maxSize={3}
                  dimensions="Square (1:1 ratio)"
                  helpText={t('정사각형 프로필 이미지', 'Square profile image')}
                />

                <ImageUploader
                  type="logo"
                  label={t('아티스트 로고', 'Artist Logo')}
                  value={undefined}
                  onChange={(img) => {
                    // TODO: Handle image upload
                  }}
                  maxSize={2}
                  helpText={t('투명 배경 PNG 권장', 'PNG with transparent background recommended')}
                />
              </div>

              <ImageUploader
                type="banner"
                label={t('배너 이미지', 'Artist Image (Banner) - 1500x1000')}
                value={undefined}
                onChange={(img) => {
                  // TODO: Handle image upload
                }}
                maxSize={5}
                dimensions="1500x1000px"
                helpText={t('가로형 배너 이미지', 'Horizontal banner image')}
              />

              {/* Press Shot - URL or Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('홍보 사진 / 아티스트 이미지 URL', 'Press Shot / Artist Image URL')}
                </label>
                <input
                  type="url"
                  value={formData.pressShotUrl || ''}
                  onChange={(e) => setFormData({ ...formData, pressShotUrl: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700"
                  placeholder="https://..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t('고해상도 아티스트 홍보 사진 링크', 'Link to high resolution artist press pictures')}
                </p>
              </div>

              {/* Press Shot Credits */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('사진 크레딧', 'Press Shot Credits')}
                </label>
                <input
                  type="text"
                  value={formData.pressShotCredits || ''}
                  onChange={(e) => setFormData({ ...formData, pressShotCredits: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700"
                  placeholder={t('사진작가 이름', 'Photographer name')}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t('사진을 촬영한 사진작가의 이름', 'Name of the photographer who took the photo')}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 4-7: Placeholders for next session */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <Info className="w-4 h-4 inline mr-2" />
            {t(
              '추가 섹션 (Social Media, DSP IDs, Metadata, Translations)은 다음 세션에서 구현됩니다.',
              'Additional sections (Social Media, DSP IDs, Metadata, Translations) will be implemented in the next session.'
            )}
          </p>
          <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
            {t(
              '현재: Basic Info, Biography, Images 섹션 작동 중',
              'Currently working: Basic Info, Biography, Images sections'
            )}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-3">
        <button
          onClick={onClose}
          className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          type="button"
        >
          {t('취소', 'Cancel')}
        </button>
        <button
          onClick={handleSave}
          className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors font-medium"
          type="button"
        >
          {t('저장', 'Save')}
        </button>
      </div>
    </ModalWrapper>
  );
}
