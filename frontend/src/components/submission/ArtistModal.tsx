import { useState } from 'react';
import { X, Languages, Info, Smartphone, Monitor, Youtube, Music } from 'lucide-react';
import { useLanguageStore } from '@/store/language.store';
import useSafeStore from '@/hooks/useSafeStore';
import { v4 as uuidv4 } from 'uuid';

interface ArtistIdentifier {
  type: string
  value: string
}

interface Artist {
  id: string
  primaryName: string
  hasTranslation: boolean
  translationLanguage?: string
  translatedName?: string
  isNewArtist: boolean
  countryOfOrigin?: string
  customIdentifiers: ArtistIdentifier[]
  role: 'main' | 'featuring'
  youtubeChannelId?: string
  spotifyId?: string
  appleId?: string
}

interface Props {
  isOpen: boolean
  onClose: () => void
  onSave: (artist: Artist) => void
  role: 'main' | 'featuring'
  editingArtist?: Artist | null
}

export default function ArtistModal({ isOpen, onClose, onSave, role, editingArtist }: Props) {
  const language = useSafeStore(useLanguageStore, (state) => state.language);
  const t = (ko: string, en: string) => language === 'ko' ? ko : en;

  const getLanguageOptions = () => [
    { value: 'en', label: t('영어', 'English') },
    { value: 'ko', label: t('한국어', 'Korean') },
    { value: 'ja', label: t('일본어', 'Japanese') },
    { value: 'zh', label: t('중국어', 'Chinese') },
    { value: 'es', label: t('스페인어', 'Spanish') },
    { value: 'fr', label: t('프랑스어', 'French') },
    { value: 'de', label: t('독일어', 'German') },
    { value: 'it', label: t('이탈리아어', 'Italian') },
    { value: 'pt', label: t('포르투갈어', 'Portuguese') },
    { value: 'ru', label: t('러시아어', 'Russian') }
  ];
  const [artist, setArtist] = useState<Artist>(editingArtist || {
    id: uuidv4(),
    primaryName: '',
    hasTranslation: false,
    translationLanguage: '',
    translatedName: '',
    isNewArtist: false,
    countryOfOrigin: 'KR',
    customIdentifiers: [],
    role,
    youtubeChannelId: '',
    spotifyId: '',
    appleId: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showHelpModal, setShowHelpModal] = useState<'spotify' | 'apple' | null>(null);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!artist.primaryName.trim()) {
      newErrors.primaryName = t('필수 항목입니다', 'This field is required');
    }

    if (artist.hasTranslation) {
      if (!artist.translationLanguage) {
        newErrors.translationLanguage = t('번역 언어를 선택해주세요', 'Please select a translation language');
      }
      if (!artist.translatedName?.trim()) {
        newErrors.translatedName = t('번역된 이름을 입력해주세요', 'Please enter the translated name');
      }
    }

    // Platform IDs are required unless it's a new artist
    if (!artist.isNewArtist) {
      if (!artist.spotifyId?.trim()) {
        newErrors.spotifyId = t('Spotify ID는 필수입니다', 'Spotify ID is required');
      }
      if (!artist.appleId?.trim()) {
        newErrors.appleId = t('Apple Music ID는 필수입니다', 'Apple Music ID is required');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validate()) {
      onSave(artist);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {role === 'main' ? t('메인 아티스트 추가', 'Add Main Artist') : t('피처링 아티스트 추가', 'Add Featuring Artist')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-6">
            {/* Primary Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('아티스트명', 'Artist Name')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={artist.primaryName}
                onChange={(e) => setArtist({ ...artist, primaryName: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-n3rve-accent focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder={t('아티스트명을 입력하세요', 'Enter artist name')}
              />
              {errors.primaryName && (
                <p className="mt-1 text-sm text-red-500">{errors.primaryName}</p>
              )}
            </div>

            {/* Translation Toggle */}
            <div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="hasTranslation"
                  checked={artist.hasTranslation}
                  onChange={(e) => setArtist({ ...artist, hasTranslation: e.target.checked })}
                  className="w-4 h-4 text-n3rve-main bg-gray-100 border-gray-300 rounded focus:ring-n3rve-accent focus:ring-2"
                />
                <label htmlFor="hasTranslation" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <Languages className="w-4 h-4" />
                  {t('번역 추가', 'Add Translation')}
                </label>
              </div>
            </div>

            {/* Translation Fields */}
            {artist.hasTranslation && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('번역 언어', 'Translation Language')} <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={artist.translationLanguage}
                    onChange={(e) => setArtist({ ...artist, translationLanguage: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-n3rve-accent focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">{t('언어를 선택하세요', 'Select a language')}</option>
                    {getLanguageOptions().map(lang => (
                      <option key={lang.value} value={lang.value}>
                        {lang.label}
                      </option>
                    ))}
                  </select>
                  {errors.translationLanguage && (
                    <p className="mt-1 text-sm text-red-500">{errors.translationLanguage}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('번역된 이름', 'Translated Name')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={artist.translatedName}
                    onChange={(e) => setArtist({ ...artist, translatedName: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-n3rve-accent focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder={t('번역된 이름을 입력하세요', 'Enter translated name')}
                  />
                  {errors.translatedName && (
                    <p className="mt-1 text-sm text-red-500">{errors.translatedName}</p>
                  )}
                </div>
              </div>
            )}

            {/* Country of Origin */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('국적', 'Nationality')}
              </label>
              <select
                value={artist.countryOfOrigin}
                onChange={(e) => setArtist({ ...artist, countryOfOrigin: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-n3rve-accent focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="KR">{t('대한민국', 'South Korea')}</option>
                <option value="US">{t('미국', 'United States')}</option>
                <option value="JP">{t('일본', 'Japan')}</option>
                <option value="CN">{t('중국', 'China')}</option>
                <option value="GB">{t('영국', 'United Kingdom')}</option>
                <option value="FR">{t('프랑스', 'France')}</option>
                <option value="DE">{t('독일', 'Germany')}</option>
                <option value="ES">{t('스페인', 'Spain')}</option>
                <option value="IT">{t('이탈리아', 'Italy')}</option>
                <option value="CA">{t('캐나다', 'Canada')}</option>
                <option value="AU">{t('호주', 'Australia')}</option>
                <option value="BR">{t('브라질', 'Brazil')}</option>
                <option value="MX">{t('멕시코', 'Mexico')}</option>
                <option value="IN">{t('인도', 'India')}</option>
                <option value="RU">{t('러시아', 'Russia')}</option>
              </select>
            </div>

            {/* YouTube Channel ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Youtube className="w-4 h-4 inline mr-1" />
                {t('YouTube 채널 ID', 'YouTube Channel ID')}
              </label>
              <input
                type="text"
                value={artist.youtubeChannelId}
                onChange={(e) => setArtist({ ...artist, youtubeChannelId: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-n3rve-accent focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder={t('YouTube 채널 ID를 입력하세요', 'Enter YouTube channel ID')}
              />
              <p className="mt-1 text-xs text-gray-500">
                {t('채널 URL의 마지막 부분입니다', 'This is the last part of the channel URL')}
              </p>
            </div>

            {/* Platform IDs Section */}
            <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {t('플랫폼 ID', 'Platform ID')} <span className="text-red-500">*</span>
                </h3>
                {!artist.isNewArtist && (
                  <button
                    type="button"
                    onClick={() => setArtist({ ...artist, isNewArtist: true, spotifyId: '', appleId: '' })}
                    className="px-3 py-1 bg-n3rve-main text-white text-sm rounded-lg hover:bg-n3rve-700 transition-colors"
                  >
                    {t('신규 아티스트', 'New Artist')}
                  </button>
                )}
              </div>

              {artist.isNewArtist ? (
                <div className="p-3 bg-n3rve-100 dark:bg-n3rve-900/30 rounded-lg">
                  <p className="text-sm text-n3rve-800 dark:text-n3rve-200">
                    <Info className="w-4 h-4 inline mr-1" />
                    {t('신규 아티스트의 경우 플랫폼 ID가 없어도 됩니다', 'For new artists, platform IDs are not required')}
                  </p>
                  <button
                    type="button"
                    onClick={() => setArtist({ ...artist, isNewArtist: false })}
                    className="mt-2 text-sm text-n3rve-main hover:text-n3rve-700 underline"
                  >
                    {t('기존 아티스트로 변경', 'Change to existing artist')}
                  </button>
                </div>
              ) : (
                <>
                  {/* Spotify ID */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Music className="w-4 h-4 inline mr-1" />
                      {t('Spotify ID', 'Spotify ID')} <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={artist.spotifyId}
                        onChange={(e) => setArtist({ ...artist, spotifyId: e.target.value })}
                        className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-n3rve-accent focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder={t('Spotify 아티스트 ID', 'Spotify Artist ID')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowHelpModal('spotify')}
                        className="px-3 py-2 text-n3rve-main hover:text-n3rve-700"
                      >
                        <Info className="w-5 h-5" />
                      </button>
                    </div>
                    {errors.spotifyId && (
                      <p className="mt-1 text-sm text-red-500">{errors.spotifyId}</p>
                    )}
                  </div>

                  {/* Apple Music ID */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Smartphone className="w-4 h-4 inline mr-1" />
                      {t('Apple Music ID', 'Apple Music ID')} <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={artist.appleId}
                        onChange={(e) => setArtist({ ...artist, appleId: e.target.value })}
                        className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-n3rve-accent focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder={t('Apple Music 아티스트 ID', 'Apple Music Artist ID')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowHelpModal('apple')}
                        className="px-3 py-2 text-n3rve-main hover:text-n3rve-700"
                      >
                        <Info className="w-5 h-5" />
                      </button>
                    </div>
                    {errors.appleId && (
                      <p className="mt-1 text-sm text-red-500">{errors.appleId}</p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            {t('취소', 'Cancel')}
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-n3rve-main text-white rounded-lg hover:bg-n3rve-700 transition-colors"
          >
            {t('저장', 'Save')}
          </button>
        </div>
      </div>

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[70] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {showHelpModal === 'spotify' ? t('Spotify 아티스트 ID 찾기', 'Find Spotify Artist ID') : t('Apple Music 아티스트 ID 찾기', 'Find Apple Music Artist ID')}
              </h3>
              <button
                onClick={() => setShowHelpModal(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-4 space-y-4">
              {showHelpModal === 'spotify' ? (
                <>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Monitor className="w-5 h-5 text-gray-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">{t('웹 브라우저', 'Web Browser')}</h4>
                        <ol className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                          <li>1. Spotify 웹 플레이어 (open.spotify.com) 접속</li>
                          <li>2. 아티스트 페이지로 이동</li>
                          <li>3. 브라우저 주소창에서 URL 확인</li>
                          <li>4. URL 예시: https://open.spotify.com/artist/<span className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">6HQYnRM4OzToCYPpVBInPt</span></li>
                          <li>5. 굵게 표시된 부분이 Artist ID입니다</li>
                        </ol>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Smartphone className="w-5 h-5 text-gray-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">{t('Spotify 앱', 'Spotify App')}</h4>
                        <ol className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                          <li>1. 아티스트 페이지에서 ⋯ (더보기) 메뉴 탭</li>
                          <li>2. "공유" → "링크 복사" 선택</li>
                          <li>3. 복사된 링크에서 artist/ 다음 부분이 ID입니다</li>
                        </ol>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      <Info className="w-4 h-4 inline mr-1" />
                      {t('Artist ID는 22자의 영문자와 숫자 조합입니다', 'Artist ID is a 22-character combination of letters and numbers')}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Monitor className="w-5 h-5 text-gray-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">{t('웹 브라우저', 'Web Browser')}</h4>
                        <ol className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                          <li>1. Apple Music 웹 (music.apple.com) 접속</li>
                          <li>2. 아티스트 페이지로 이동</li>
                          <li>3. 브라우저 주소창에서 URL 확인</li>
                          <li>4. URL 예시: https://music.apple.com/kr/artist/iu/<span className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">277905876</span></li>
                          <li>5. 굵게 표시된 숫자가 Artist ID입니다</li>
                        </ol>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Smartphone className="w-5 h-5 text-gray-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">{t('Apple Music 앱', 'Apple Music App')}</h4>
                        <ol className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                          <li>1. 아티스트 페이지에서 ⋯ (더보기) 버튼 탭</li>
                          <li>2. "공유" → "링크 복사" 선택</li>
                          <li>3. 복사된 링크의 마지막 숫자가 ID입니다</li>
                        </ol>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      <Info className="w-4 h-4 inline mr-1" />
                      {t('Artist ID는 9-10자리의 숫자입니다', 'Artist ID is a 9-10 digit number')}
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowHelpModal(null)}
                className="w-full px-4 py-2 bg-n3rve-main text-white rounded-lg hover:bg-n3rve-700 transition-colors"
              >
                {t('확인', 'Confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
