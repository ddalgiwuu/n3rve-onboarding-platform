import { useState, useEffect } from 'react';
import { User, FileText, Image, Globe, Music, Info, Languages, ChevronDown, Plus, X } from 'lucide-react';
import ModalWrapper from '@/components/common/ModalWrapper';
import ImageUploader from './ImageUploader';
import SocialMediaGrid from './SocialMediaGrid';
import MultiSelectDropdown from './MultiSelectDropdown';
import { useLanguageStore } from '@/store/language.store';
import useSafeStore from '@/hooks/useSafeStore';
import { CompleteFugaArtist, FugaArtistFormData, ArtistGender, SocialMovement, FugaSocialMedia } from '@/types/fugaArtist';
import { validateFugaArtistForm, hasValidationErrors, extractSpotifyId, extractAppleMusicId } from '@/utils/fugaArtistValidation';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';

interface FugaArtistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (artist: CompleteFugaArtist) => void;
  editingArtist?: CompleteFugaArtist | null;
}

const translationLanguages = [
  { code: 'en', name: 'English' },
  { code: 'ko', name: '한국어 (Korean)' },
  { code: 'ja', name: '日本語 (Japanese)' },
  { code: 'zh', name: '中文 (Chinese)' },
  { code: 'es', name: 'Español (Spanish)' },
  { code: 'fr', name: 'Français (French)' },
  { code: 'de', name: 'Deutsch (German)' },
  { code: 'it', name: 'Italiano (Italian)' },
  { code: 'pt', name: 'Português (Portuguese)' },
  { code: 'ru', name: 'Русский (Russian)' }
];

const socialMovementOptions: readonly SocialMovement[] = [
  'Asian American and Pacific Islander Heritage Month',
  'AAPI',
  'Black History Month / Juneteenth / BLM',
  'Climate Action and Sustainability',
  'Democracy, Peace, and Security',
  '(Drug) Addictions Awareness',
  'Gender Equality',
  "Women's Rights",
  'Humanitarian Aid',
  'Indigenous Cultural Heritage',
  'LGBTQ+ Rights',
  'PRIDE',
  'Mental Health Awareness Month',
  'Neurodiversity',
  'Racial Justice',
  'Religious Freedom',
  'Veterans and Military Families',
];

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

  // Social media state
  const [socialMedia, setSocialMedia] = useState<Partial<FugaSocialMedia>>({});

  // Translation state
  const [activeTranslations, setActiveTranslations] = useState<string[]>([]);
  const [translations, setTranslations] = useState<Record<string, string>>({});

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editingArtist) {
      // TODO: Populate form with editing data
    }
  }, [editingArtist]);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const updateSocialMedia = (field: keyof FugaSocialMedia, value: string) => {
    setSocialMedia((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Auto-extract IDs from URLs
    if (field === 'spotify') {
      const id = extractSpotifyId(value);
      if (id) {
        toast.success(t(`Spotify ID 추출: ${id}`, `Spotify ID extracted: ${id}`));
      }
    } else if (field === 'appleMusic') {
      const id = extractAppleMusicId(value);
      if (id) {
        toast.success(t(`Apple Music ID 추출: ${id}`, `Apple Music ID extracted: ${id}`));
      }
    }
  };

  const addTranslation = (langCode: string) => {
    if (!activeTranslations.includes(langCode)) {
      setActiveTranslations([...activeTranslations, langCode]);
    }
  };

  const removeTranslation = (langCode: string) => {
    setActiveTranslations(activeTranslations.filter(l => l !== langCode));
    const newTranslations = { ...translations };
    delete newTranslations[langCode];
    setTranslations(newTranslations);
  };

  const handleSave = async () => {
    const validationErrors = validateFugaArtistForm(formData);

    if (hasValidationErrors(validationErrors)) {
      setErrors(validationErrors);
      toast.error(t('필수 항목을 확인해주세요', 'Please check required fields'));

      // Expand sections with errors
      Object.keys(validationErrors).forEach(field => {
        if (['name', 'country', 'currentCity', 'hometown', 'gender'].includes(field)) {
          setExpandedSections(prev => ({ ...prev, basic: true }));
        }
      });

      return;
    }

    try {
      // TODO: Upload images to Dropbox
      // TODO: Call backend API to save artist

      const completeFugaArtist: CompleteFugaArtist = {
        id: uuidv4(),
        name: formData.name!,
        country: formData.country!,
        currentCity: formData.currentCity!,
        hometown: formData.hometown!,
        gender: formData.gender,
        bio: formData.bio || '',
        similarArtists: formData.similarArtists || '',
        socialMedia,
        dspIdentifiers: [],
        hasSyncHistory: formData.hasSyncHistory || false,
        socialMovements: formData.socialMovements || [],
        translations: Object.entries(translations).map(([language, name]) => ({ language, name })),
        usageCount: 0,
      };

      onSave(completeFugaArtist);
      toast.success(t('아티스트가 저장되었습니다', 'Artist saved successfully'));
      onClose();
    } catch (error) {
      console.error('Error saving artist:', error);
      toast.error(t('저장에 실패했습니다', 'Failed to save artist'));
    }
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={t('FUGA SCORE에 새 아티스트 추가', 'Add New Artist to SCORE')}
      maxWidth="max-w-4xl"
    >
      <div className="px-6 py-4 space-y-6 max-h-[75vh] overflow-y-auto">
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
                  <option value="FR">{t('프랑스', 'France')}</option>
                  <option value="DE">{t('독일', 'Germany')}</option>
                  <option value="CN">{t('중국', 'China')}</option>
                  <option value="CA">{t('캐나다', 'Canada')}</option>
                  <option value="AU">{t('호주', 'Australia')}</option>
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
                    setFormData({ ...formData, avatarFile: img?.file });
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
                    setFormData({ ...formData, logoFile: img?.file });
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
                  setFormData({ ...formData, bannerFile: img?.file });
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

        {/* SECTION 4: Social Media & Web Presence */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('social')}
            className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            type="button"
          >
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-indigo-600" />
              <div className="text-left">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {t('소셜 미디어 & 웹', 'Social Media & Web Presence')}
                </h3>
                <p className="text-xs text-gray-500">
                  {t('아티스트 소셜 프로필 연결', 'Connect artist social profiles')}
                </p>
              </div>
            </div>
            <ChevronDown
              className={`w-5 h-5 text-gray-400 transition-transform ${
                expandedSections.social ? 'rotate-180' : ''
              }`}
            />
          </button>

          {expandedSections.social && (
            <div className="p-4">
              <SocialMediaGrid
                values={socialMedia}
                onChange={updateSocialMedia}
                errors={errors}
                language={language}
              />
            </div>
          )}
        </div>

        {/* SECTION 5: DSP Identifiers */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('dsp')}
            className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            type="button"
          >
            <div className="flex items-center gap-3">
              <Music className="w-5 h-5 text-pink-600" />
              <div className="text-left">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {t('DSP 프로필 ID', 'DSP Profile IDs')}
                </h3>
                <p className="text-xs text-gray-500">
                  {t('플랫폼별 아티스트 ID', 'Platform-specific artist identifiers')}
                </p>
              </div>
            </div>
            <ChevronDown
              className={`w-5 h-5 text-gray-400 transition-transform ${
                expandedSections.dsp ? 'rotate-180' : ''
              }`}
            />
          </button>

          {expandedSections.dsp && (
            <div className="p-4 space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t(
                  'URL을 입력하면 자동으로 ID가 추출됩니다.',
                  'IDs will be auto-extracted when you enter URLs in Social Media section.'
                )}
              </p>

              {/* Spotify ID (auto-extracted) */}
              {socialMedia.spotify && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    Spotify ID: {extractSpotifyId(socialMedia.spotify) || 'N/A'}
                  </p>
                </div>
              )}

              {/* Apple Music ID (auto-extracted) */}
              {socialMedia.appleMusic && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">
                    Apple Music ID: {extractAppleMusicId(socialMedia.appleMusic) || 'N/A'}
                  </p>
                </div>
              )}

              {/* SoundCloud ID */}
              {socialMedia.soundcloud && (
                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                    SoundCloud URL: {socialMedia.soundcloud}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* SECTION 6: Additional Metadata */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('metadata')}
            className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            type="button"
          >
            <div className="flex items-center gap-3">
              <Info className="w-5 h-5 text-yellow-600" />
              <div className="text-left">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {t('추가 정보', 'Additional Information')}
                </h3>
                <p className="text-xs text-gray-500">
                  {t('신크 이력 및 사회 운동', 'Sync history and causes')}
                </p>
              </div>
            </div>
            <ChevronDown
              className={`w-5 h-5 text-gray-400 transition-transform ${
                expandedSections.metadata ? 'rotate-180' : ''
              }`}
            />
          </button>

          {expandedSections.metadata && (
            <div className="p-4 space-y-4">
              {/* Sync History */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  {t('신크 이력이 있나요?', 'Does the artist have a sync history?')}
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={formData.hasSyncHistory === true}
                      onChange={() => setFormData({ ...formData, hasSyncHistory: true })}
                      className="w-4 h-4 text-purple-600"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Yes</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={formData.hasSyncHistory === false}
                      onChange={() => setFormData({ ...formData, hasSyncHistory: false })}
                      className="w-4 h-4 text-purple-600"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">No</span>
                  </label>
                </div>
              </div>

              {/* Sync History Details (conditional) */}
              {formData.hasSyncHistory && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('신크 이력 상세', 'Artist Sync History')}
                  </label>
                  <textarea
                    value={formData.syncHistoryDetails || ''}
                    onChange={(e) => setFormData({ ...formData, syncHistoryDetails: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700"
                    placeholder={t('신크 이력을 설명하세요...', "Please list the Artist's Sync History")}
                  />
                </div>
              )}

              {/* Social Movements */}
              <MultiSelectDropdown
                options={socialMovementOptions}
                selected={formData.socialMovements || []}
                onChange={(movements) => setFormData({ ...formData, socialMovements: movements as SocialMovement[] })}
                label={t('사회 운동 / 인식 제고', 'Social Movements / Awareness-Raising')}
                placeholder={t('지원하는 사회 운동 선택...', 'Select supported causes...')}
                searchable={true}
                language={language}
              />
              <p className="text-xs text-gray-500">
                {t(
                  '아티스트가 지지하는 사회적 운동이나 활동을 선택하세요',
                  "Select the social movements/awareness-raising activities that your artist identifies strongly with"
                )}
              </p>
            </div>
          )}
        </div>

        {/* SECTION 7: Translations */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('translations')}
            className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            type="button"
          >
            <div className="flex items-center gap-3">
              <Languages className="w-5 h-5 text-teal-600" />
              <div className="text-left">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {t('아티스트명 번역', 'Name Translations')}
                </h3>
                <p className="text-xs text-gray-500">
                  {t('다국어 지원 (선택사항)', 'Multi-language support (optional)')}
                </p>
              </div>
            </div>
            <ChevronDown
              className={`w-5 h-5 text-gray-400 transition-transform ${
                expandedSections.translations ? 'rotate-180' : ''
              }`}
            />
          </button>

          {expandedSections.translations && (
            <div className="p-4">
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Globe className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    {t('아티스트명 번역', 'Artist Name Translations')}
                  </label>
                  <span className="text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-2 py-1 rounded-full">
                    {t('선택사항', 'Optional')}
                  </span>
                </div>

                {/* Active translations */}
                <div className="space-y-2">
                  {activeTranslations.map(langCode => {
                    const lang = translationLanguages.find(l => l.code === langCode);
                    return (
                      <div key={langCode} className="flex items-center gap-2">
                        <div className="flex-1 flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-400 w-8">
                            {lang?.code.toUpperCase()}
                          </span>
                          <input
                            type="text"
                            value={translations[langCode] || ''}
                            onChange={(e) => setTranslations({
                              ...translations,
                              [langCode]: e.target.value
                            })}
                            placeholder={t(`${lang?.name}로 아티스트명 입력`, `Enter artist name in ${lang?.name}`)}
                            className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeTranslation(langCode)}
                          className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}

                  {activeTranslations.length === 0 && (
                    <p className="text-center py-3 text-sm text-gray-500 dark:text-gray-400">
                      {t('번역이 추가되지 않았습니다', 'No translations added')}
                    </p>
                  )}
                </div>

                {/* Add translation button */}
                <button
                  type="button"
                  onClick={() => {
                    const availableLangs = translationLanguages.filter(l => !activeTranslations.includes(l.code));
                    if (availableLangs.length > 0) {
                      addTranslation(availableLangs[0].code);
                    }
                  }}
                  className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={activeTranslations.length >= translationLanguages.length}
                >
                  <Plus className="w-4 h-4" />
                  {t('언어 추가', 'Add Language')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <span className="font-medium">{t('필수 필드', 'Required fields')}: </span>
          {t('이름, 국가, 도시, 고향', 'Name, Country, City, Hometown')}
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            type="button"
          >
            {t('취소', 'Cancel')}
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors font-medium shadow-lg"
            type="button"
          >
            {t('저장', 'Save')}
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
}
