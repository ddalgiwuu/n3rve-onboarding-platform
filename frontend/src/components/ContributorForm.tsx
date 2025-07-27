import { useState, useEffect, useRef } from 'react';
import {
  X, Plus, Trash2, Search, Music, User, Globe,
  Info, Link as LinkIcon, ChevronDown, ChevronUp,
  Check, AlertCircle, ExternalLink, Languages
} from 'lucide-react';
import { useLanguageStore } from '@/store/language.store';
import useSafeStore from '@/hooks/useSafeStore';
import contributorRolesData from '@/data/contributorRoles.json';
import contributorRolesKoData from '@/data/contributorRolesKo.json';
import instrumentsData from '@/data/instruments.json';
import instrumentsKoData from '@/data/instrumentsKo.json';
import { validateArtistName } from '@/utils/inputValidation';
import { toast } from 'react-hot-toast';
import ValidatedInput from './ValidatedInput';
import { ValidationProvider, useValidationContext } from '@/contexts/ValidationContext';
// EnhancedValidationWarning is handled through ValidatedInput component

const contributorRolesKo = contributorRolesKoData as { translations: Record<string, string> };
const instrumentsKo = instrumentsKoData as { translations: Record<string, string> };
import { v4 as uuidv4 } from 'uuid';

interface Translation {
  id: string
  language: string
  name: string
}

interface PlatformIdentifier {
  type: 'spotify' | 'apple'
  value: string
  url?: string
}

interface Contributor {
  id: string
  name: string
  translations: Translation[]
  roles: string[]
  instruments: string[]
  identifiers: PlatformIdentifier[]
  isNewArtist: boolean
}

interface ContributorFormProps {
  contributor?: Contributor
  onSave: (contributor: Contributor) => void
  onCancel: () => void
  trackId?: string
  isArtist?: boolean
}

// Platform identifier types with descriptions
const identifierTypes = {
  spotify: {
    name: 'Spotify',
    placeholder: 'spotify:artist:XXXXXX',
    helpText: {
      ko: 'Mac: Spotify 앱에서 아티스트 → ⋮ → Option키 누르고 "Spotify URI 복사" 클릭\nWindows: Spotify 앱에서 아티스트 → ⋮ → Ctrl키 누르고 "Spotify URI 복사" 클릭',
      en: 'Mac: In Spotify app: Artist → ⋮ → Hold Option key → Click "Copy Spotify URI"\nWindows: In Spotify app: Artist → ⋮ → Hold Ctrl key → Click "Copy Spotify URI"'
    },
    pattern: /^spotify:artist:[a-zA-Z0-9]+$/,
    icon: '🎵'
  },
  apple: {
    name: 'Apple Music',
    placeholder: '1234567890 (숫자만)',
    helpText: {
      ko: 'Apple Music에서 아티스트 페이지 → 공유 → 링크 복사 → URL 마지막 숫자만 입력\n예: https://music.apple.com/kr/artist/bts/883131348 → 883131348',
      en: 'In Apple Music: Artist page → Share → Copy Link → Enter only the numbers at the end\nExample: https://music.apple.com/us/artist/bts/883131348 → 883131348'
    },
    pattern: /^[0-9]+$/,
    icon: '🎵'
  }
};

function ContributorFormContent({ contributor, onSave, onCancel }: ContributorFormProps) {
  const language = useSafeStore(useLanguageStore, (state) => state.language);
  const t = (ko: string, en: string, ja?: string) => {
    switch (language) {
      case 'ko': return ko;
      case 'ja': return ja || en;
      default: return en;
    }
  };

  const [formData, setFormData] = useState<Contributor>({
    id: contributor?.id || uuidv4(),
    name: contributor?.name || '',
    translations: contributor?.translations || [],
    roles: contributor?.roles || [],
    instruments: contributor?.instruments || [],
    identifiers: contributor?.identifiers || [
      { type: 'spotify', value: '' },
      { type: 'apple', value: '' }
    ],
    isNewArtist: contributor?.isNewArtist || false
  });

  const [searchQuery, setSearchQuery] = useState({ roles: '', instruments: '' });
  const [showDropdown, setShowDropdown] = useState({ roles: false, instruments: false });
  const [nameError, setNameError] = useState<string | null>(null);
  const { hasErrors, getFieldWarnings } = useValidationContext();

  const rolesRef = useRef<HTMLDivElement>(null);
  const instrumentsRef = useRef<HTMLDivElement>(null);

  // Check if contributor is a composer/lyricist
  const isComposerOrLyricist = () => {
    return formData.roles.some(role =>
      ['composer', 'lyricist', 'songwriter', 'writer'].includes(role)
    );
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (rolesRef.current && !rolesRef.current.contains(event.target as Node)) {
        setShowDropdown(prev => ({ ...prev, roles: false }));
      }
      if (instrumentsRef.current && !instrumentsRef.current.contains(event.target as Node)) {
        setShowDropdown(prev => ({ ...prev, instruments: false }));
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Enhanced search with partial matching
  const searchFilter = (text: string, searchTerm: string): boolean => {
    const normalizedText = text.toLowerCase();
    const normalizedSearch = searchTerm.toLowerCase();

    // Check if search term matches start of any word in the text
    const words = normalizedText.split(/[\s-]+/);
    const startsWithMatch = words.some(word => word.startsWith(normalizedSearch));

    // Also check for general inclusion
    return startsWithMatch || normalizedText.includes(normalizedSearch);
  };

  // Filter roles and instruments based on search
  const filteredRoles = contributorRolesData.roles.filter(role => {
    const searchTerm = (searchQuery.roles || '').toLowerCase();
    if (!searchTerm) return true;

    const roleName = (role.name || '').toLowerCase();
    const roleCategory = (role.category || '').toLowerCase();
    const roleKo = contributorRolesKo.translations[role.id as string] || '';

    return searchFilter(roleName, searchTerm) ||
           searchFilter(roleCategory, searchTerm) ||
           searchFilter(roleKo, searchTerm);
  });

  const filteredInstruments = instrumentsData.instruments.filter(instrument => {
    const searchTerm = (searchQuery.instruments || '').toLowerCase();
    if (!searchTerm) return true;

    const instrumentName = (instrument.name || '').toLowerCase();
    const instrumentCategory = (instrument.category || '').toLowerCase();
    const instrumentKo = instrumentsKo.translations[instrument.id as string] || '';

    return searchFilter(instrumentName, searchTerm) ||
           searchFilter(instrumentCategory, searchTerm) ||
           searchFilter(instrumentKo, searchTerm);
  });

  // Group by category
  const groupedRoles = filteredRoles.reduce((acc, role) => {
    if (!acc[role.category]) acc[role.category] = [];
    acc[role.category].push(role);
    return acc;
  }, {} as Record<string, typeof contributorRolesData.roles>);

  const groupedInstruments = filteredInstruments.reduce((acc, instrument) => {
    if (!acc[instrument.category]) acc[instrument.category] = [];
    acc[instrument.category].push(instrument);
    return acc;
  }, {} as Record<string, typeof instrumentsData.instruments>);

  // Add/remove translations
  const addTranslation = () => {
    setFormData(prev => ({
      ...prev,
      translations: [...prev.translations, { id: uuidv4(), language: '', name: '' }]
    }));
  };

  const updateTranslation = (id: string, field: 'language' | 'name', value: string) => {
    setFormData(prev => ({
      ...prev,
      translations: prev.translations.map(t =>
        t.id === id ? { ...t, [field]: value } : t
      )
    }));
  };

  const removeTranslation = (id: string) => {
    setFormData(prev => ({
      ...prev,
      translations: prev.translations.filter(t => t.id !== id)
    }));
  };

  // Update identifier value
  const updateIdentifier = (index: number, value: string) => {
    if (index === -1) {
      // If identifier doesn't exist yet, we need to handle it differently
      return;
    }
    setFormData(prev => ({
      ...prev,
      identifiers: prev.identifiers.map((id, i) =>
        i === index ? { ...id, value } : id
      )
    }));
  };

  // Toggle role/instrument selection with auto-clear
  const toggleRole = (roleId: string) => {
    const newRoles = formData.roles.includes(roleId)
      ? formData.roles.filter(r => r !== roleId)
      : [...formData.roles, roleId];

    setFormData(prev => ({
      ...prev,
      roles: newRoles
    }));

    // Check if composer/lyricist role is being added/removed
    const wasComposerLyricist = isComposerOrLyricist();
    const willBeComposerLyricist = newRoles.some(role =>
      ['composer', 'lyricist', 'songwriter', 'writer'].includes(role)
    );

    // If changing to/from composer/lyricist, revalidate the name
    if (wasComposerLyricist !== willBeComposerLyricist && formData.name) {
      const result = validateArtistName(formData.name, willBeComposerLyricist);
      if (!result.isValid) {
        const errorWarning = result.warnings.find(w => w.type === 'error');
        setNameError(errorWarning?.message || null);
        if (willBeComposerLyricist) {
          toast.error(t(
            '작곡가/작사가는 풀네임을 사용해야 합니다',
            'Composers/lyricists must use their full name',
            '作曲家/作詞家はフルネームを使用する必要があります'
          ));
        }
      } else {
        setNameError(null);
      }
    }

    // Clear search input after selection
    setSearchQuery(prev => ({ ...prev, roles: '' }));
    setShowDropdown(prev => ({ ...prev, roles: false }));
  };

  const toggleInstrument = (instrumentId: string) => {
    setFormData(prev => ({
      ...prev,
      instruments: prev.instruments.includes(instrumentId)
        ? prev.instruments.filter(i => i !== instrumentId)
        : [...prev.instruments, instrumentId]
    }));
    // Clear search input after selection
    setSearchQuery(prev => ({ ...prev, instruments: '' }));
    setShowDropdown(prev => ({ ...prev, instruments: false }));
  };

  // Validate identifiers
  const validateIdentifier = (type: keyof typeof identifierTypes, value: string): boolean => {
    const config = identifierTypes[type];
    return config.pattern.test(value);
  };

  // Platform URL helper
  const getPlatformUrl = (identifier: PlatformIdentifier): string | null => {
    switch (identifier.type) {
      case 'spotify':
        if (identifier.value) {
          const spotifyId = identifier.value.replace('spotify:artist:', '');
          return `https://open.spotify.com/artist/${spotifyId}`;
        }
        return 'https://open.spotify.com/search';
      case 'apple':
        if (identifier.value && /^[0-9]+$/.test(identifier.value)) {
          return `https://music.apple.com/artist/${identifier.value}`;
        }
        return 'https://music.apple.com/search';
      default:
        return null;
    }
  };

  // Save handler
  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error(t('기여자 이름을 입력해주세요', 'Please enter the contributor name', 'コントリビューター名を入력してください'));
      return;
    }

    // Check for validation errors
    const fieldId = `contributor-name-${formData.id}`;
    if (hasErrors(fieldId)) {
      toast.error(t('입력 오류를 수정해주세요', 'Please fix the input errors', '入力エラーを修正してください'));
      return;
    }

    // Get any active warnings and apply suggestions if accepted
    const warnings = getFieldWarnings(fieldId);
    const suggestionWarning = warnings.find(w => w.suggestedValue && w.type === 'suggestion');
    if (suggestionWarning && suggestionWarning.suggestedValue) {
      // Apply the suggested value
      formData.name = suggestionWarning.suggestedValue;
    }

    if (formData.roles.length === 0) {
      toast.error(t('최소 하나의 역할을 선택해주세요', 'Please select at least one role', '少なくとも1つの役割を選択してください'));
      return;
    }

    // Validate identifiers
    const invalidIdentifiers = formData.identifiers.filter((id) =>
      id.value && !validateIdentifier(id.type as keyof typeof identifierTypes, id.value)
    );

    if (invalidIdentifiers.length > 0) {
      toast.error(t('올바르지 않은 식별자가 있습니다', 'There are invalid identifiers', '無効な識別子があります'));
      return;
    }

    // Show guidance for Spotify/Apple Music registration
    if (!formData.isNewArtist) {
      toast(t(
        '💡 아티스트 이름이 Spotify/Apple Music에 등록된 이름과 동일한지 확인하세요',
        '💡 Make sure the artist name matches the one registered on Spotify/Apple Music',
        '💡 アーティスト名がSpotify/Apple Musicに登録されている名前と一致することを確認してください'
      ), { icon: '💡', duration: 4000 });
    }

    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <User className="w-5 h-5" />
              {contributor ? t('기여자 수정', 'Edit Contributor', 'コントリビューター編集') : t('기여자 추가', 'Add Contributor', 'コントリビューター追加')}
            </h3>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Basic Info */}
            <div>
              <h4 className="font-medium mb-4 flex items-center gap-2">
                <User className="w-4 h-4" />
                {t('기본 정보', 'Basic Information', '基本情報')}
              </h4>

              <div className="space-y-4">
                <div>
                  <ValidatedInput
                    fieldId={`contributor-name-${formData.id}`}
                    validationType="artist"
                    validationOptions={{ isComposer: isComposerOrLyricist() }}
                    label={<>{t('이름', 'Name', '名前')} <span className="text-red-500">*</span></>}
                    value={formData.name}
                    onValueChange={(value) => {
                      setFormData(prev => ({ ...prev, name: value }));
                    }}
                    placeholder={t('아티스트/기여자 이름', 'Artist/Contributor Name', 'アーティスト/コントリビューター名')}
                    language={language === 'ja' ? 'en' : language}
                    showInlineWarnings={false}
                  />

                  {/* QC Guidance Message - Always visible, non-flickering */}
                  <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                    {t(
                      '• 정확한 아티스트명을 입력하세요 (Spotify/Apple Music 등록명과 동일하게)',
                      '• Enter exact artist name (as registered on Spotify/Apple Music)',
                      '• 正確なアーティスト名を入力してください（Spotify/Apple Music登録名と同じ）'
                    )}
                  </div>

                  {/* Spotify Full Name Policy Alert - Enhanced with validation */}
                  {isComposerOrLyricist() && (
                    <div className={`mt-2 p-3 rounded-lg ${
                      nameError && isComposerOrLyricist()
                        ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                        : 'bg-yellow-50 dark:bg-yellow-900/20'
                    }`}>
                      <div className="flex items-start gap-2">
                        <AlertCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                          nameError && isComposerOrLyricist()
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-yellow-600 dark:text-yellow-400'
                        }`} />
                        <div className={`text-xs ${
                          nameError && isComposerOrLyricist()
                            ? 'text-red-800 dark:text-red-200'
                            : 'text-yellow-800 dark:text-yellow-200'
                        }`}>
                          <p className="font-medium mb-1">
                            {t('Spotify 정책 안내', 'Spotify Policy Notice', 'Spotifyポリシー通知')}
                          </p>
                          <p>
                            {t(
                              '작곡가, 작사가의 경우 반드시 전체 이름(Full Name)을 입력해야 합니다. 예명이나 약어는 사용할 수 없습니다.',
                              'Composers and lyricists must use their full legal names. Stage names or abbreviations are not allowed.',
                              '作曲家、作詞家の場合、必ずフルネームを入力する必要があります。芸名や略称は使用できません。'
                            )}
                          </p>
                          <p className={`mt-1 ${
                            nameError && isComposerOrLyricist()
                              ? 'text-red-700 dark:text-red-300'
                              : 'text-yellow-700 dark:text-yellow-300'
                          }`}>
                            {t('예: ❌ JD, DJ Kim → ✅ John Doe, Kim Minsu', 'Example: ❌ JD, DJ Kim → ✅ John Doe, Kim Minsu', '例：❌ JD, DJ Kim → ✅ John Doe, Kim Minsu')}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* New Artist Toggle - Improved UI */}
                <div className={`border-2 ${formData.isNewArtist ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/20' : 'border-gray-200 dark:border-gray-700'} rounded-lg p-4 transition-all`}>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isNewArtist}
                      onChange={(e) => setFormData(prev => ({ ...prev, isNewArtist: e.target.checked }))}
                      className="mt-0.5 w-5 h-5 rounded border-2 text-orange-500 focus:ring-orange-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-base">{t('신규 아티스트', 'New Artist', '新規アーティスト')}</span>
                        {formData.isNewArtist && (
                          <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-800/30 text-orange-700 dark:text-orange-300 text-xs rounded-full font-medium">
                            {t('활성화됨', 'ACTIVE', 'アクティブ')}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {formData.isNewArtist ? (
                          <>
                            <span className="text-orange-600 dark:text-orange-400 font-medium">
                              {t('⚠️ 새로운 아티스트 페이지가 생성됩니다', '⚠️ A new artist page will be created', '⚠️ 新しいアーティストページが作成されます')}
                            </span>
                            <br />
                            {t('각 플랫폼(Spotify, Apple Music 등)에 새 아티스트 프로필이 만들어집니다.', 'New artist profiles will be created on each platform (Spotify, Apple Music, etc.).', '各プラットフォーム（Spotify、Apple Musicなど）に新しいアーティストプロフィールが作成されます。')}
                          </>
                        ) : (
                          t('기존 아티스트와 연결하려면 체크하지 마세요', 'Leave unchecked to link with existing artist', '既存のアーティストと連携する場合はチェックしないでください')
                        )}
                      </p>
                    </div>
                  </label>
                </div>

                {/* Translations - Modern UI */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <label className="text-sm font-semibold flex items-center gap-2">
                        <Languages className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        {t('다국어 이름', 'Multilingual Names', '多言語名')}
                      </label>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {t('글로벌 플랫폼에서 표시될 이름을 추가하세요', 'Add names for global platforms', 'グローバルプラットフォーム用の名前を追加')}
                      </p>
                    </div>
                    <button
                      onClick={addTranslation}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg flex items-center gap-1 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      {t('추가', 'Add', '追加')}
                    </button>
                  </div>

                  {formData.translations.length === 0 ? (
                    <div className="text-center py-8 bg-white/50 dark:bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                      <Globe className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {t('번역된 이름이 없습니다', 'No translations added', '翻訳された名前がありません')}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {t('위 버튼을 클릭하여 추가하세요', 'Click the button above to add', '上のボタンをクリックして追加')}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {formData.translations.map((translation, index) => (
                        <div key={translation.id} className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center text-sm font-medium text-purple-700 dark:text-purple-300">
                              {index + 1}
                            </div>
                            <select
                              value={translation.language}
                              onChange={(e) => updateTranslation(translation.id, 'language', e.target.value)}
                              className="w-36 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 text-sm focus:ring-2 focus:ring-purple-500"
                            >
                              <option value="">{t('언어 선택', 'Select', '言語選択')}</option>
                              <option value="en">🇺🇸 English</option>
                              <option value="ja">🇯🇵 日本語</option>
                              <option value="zh-CN">🇨🇳 中文(简体)</option>
                              <option value="zh-TW">🇹🇼 中文(繁體)</option>
                              <option value="es">🇪🇸 Español</option>
                              <option value="fr">🇫🇷 Français</option>
                              <option value="de">🇩🇪 Deutsch</option>
                              <option value="it">🇮🇹 Italiano</option>
                              <option value="pt">🇵🇹 Português</option>
                              <option value="ru">🇷🇺 Русский</option>
                            </select>
                            <input
                              type="text"
                              value={translation.name}
                              onChange={(e) => updateTranslation(translation.id, 'name', e.target.value)}
                              onBlur={() => {
                                // Validation is now handled through the ValidatedInput component
                                // No need for manual formatting here
                              }}
                              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 text-sm focus:ring-2 focus:ring-purple-500"
                              placeholder={translation.language === 'ja' ? 'カタカナまたはひらがな' : t('번역된 이름', 'Translated Name', '翻訳された名前')}
                            />
                            <button
                              onClick={() => removeTranslation(translation.id)}
                              className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title={t('삭제', 'Delete', '削除')}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Roles */}
            <div>
              <h4 className="font-medium mb-4 flex items-center gap-2">
                <User className="w-4 h-4" />
                {t('역할', 'Role', '役割')} <span className="text-red-500">*</span>
              </h4>

              {/* Selected Roles */}
              {formData.roles.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {formData.roles.map(roleId => {
                    const role = contributorRolesData.roles.find(r => r.id === roleId);
                    return role ? (
                      <span
                        key={roleId}
                        className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg text-sm flex items-center gap-1"
                      >
                        {role.name}
                        <button
                          onClick={() => toggleRole(roleId)}
                          className="ml-1 hover:text-purple-900 dark:hover:text-purple-100"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ) : null;
                  })}
                </div>
              )}

              {/* Role Search */}
              <div className="relative" ref={rolesRef}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery.roles}
                    onChange={(e) => {
                      setSearchQuery(prev => ({ ...prev, roles: e.target.value }));
                      // Auto-open dropdown when typing
                      if (e.target.value.length > 0) {
                        setShowDropdown(prev => ({ ...prev, roles: true }));
                      }
                    }}
                    onFocus={() => setShowDropdown(prev => ({ ...prev, roles: true }))}
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700"
                    placeholder={t('역할 검색 (예: Producer, Composer)', 'Search roles (e.g., Producer, Composer)', '役割を検索（例：Producer, Composer）')}
                  />
                  <button
                    onClick={() => setShowDropdown(prev => ({ ...prev, roles: !prev.roles }))}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    {showDropdown.roles ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                {/* Search Results Count */}
                {searchQuery.roles && (
                  <div className="absolute right-12 top-1/2 transform -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400">
                    {filteredRoles.length} {t('개 결과', 'results', '件の結果')}
                  </div>
                )}

                {/* Role Dropdown */}
                {showDropdown.roles && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {Object.entries(groupedRoles).map(([category, roles]) => (
                      <div key={category}>
                        <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50">
                          {category}
                        </div>
                        {roles.map(role => (
                          <button
                            key={role.id}
                            onClick={() => toggleRole(role.id)}
                            className="w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between"
                          >
                            <span className="text-sm">
                              {role.name}
                              {contributorRolesKo.translations[role.id as string] && (
                                <span className="text-gray-500 dark:text-gray-400 ml-1">
                                  ({contributorRolesKo.translations[role.id as string]})
                                </span>
                              )}
                            </span>
                            {formData.roles.includes(role.id) && (
                              <Check className="w-4 h-4 text-purple-500" />
                            )}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Instruments */}
            <div>
              <h4 className="font-medium mb-4 flex items-center gap-2">
                <Music className="w-4 h-4" />
                {t('악기', 'Instruments', '楽器')}
              </h4>

              {/* Selected Instruments */}
              {formData.instruments.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {formData.instruments.map(instrumentId => {
                    const instrument = instrumentsData.instruments.find(i => i.id === instrumentId);
                    return instrument ? (
                      <span
                        key={instrumentId}
                        className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm flex items-center gap-1"
                      >
                        {instrument.name}
                        <button
                          onClick={() => toggleInstrument(instrumentId)}
                          className="ml-1 hover:text-blue-900 dark:hover:text-blue-100"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ) : null;
                  })}
                </div>
              )}

              {/* Instrument Search */}
              <div className="relative" ref={instrumentsRef}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery.instruments}
                    onChange={(e) => {
                      setSearchQuery(prev => ({ ...prev, instruments: e.target.value }));
                      // Auto-open dropdown when typing
                      if (e.target.value.length > 0) {
                        setShowDropdown(prev => ({ ...prev, instruments: true }));
                      }
                    }}
                    onFocus={() => setShowDropdown(prev => ({ ...prev, instruments: true }))}
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700"
                    placeholder={t('악기 검색 (예: Guitar, Piano)', 'Search instruments (e.g., Guitar, Piano)', '楽器を検索（例：Guitar, Piano）')}
                  />
                  <button
                    onClick={() => setShowDropdown(prev => ({ ...prev, instruments: !prev.instruments }))}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    {showDropdown.instruments ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                {/* Search Results Count */}
                {searchQuery.instruments && (
                  <div className="absolute right-12 top-1/2 transform -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400">
                    {filteredInstruments.length} {t('개 결과', 'results', '件の結果')}
                  </div>
                )}

                {/* Instrument Dropdown */}
                {showDropdown.instruments && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {Object.entries(groupedInstruments).map(([category, instruments]) => (
                      <div key={category}>
                        <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50">
                          {category}
                        </div>
                        {instruments.map(instrument => (
                          <button
                            key={instrument.id}
                            onClick={() => toggleInstrument(instrument.id)}
                            className="w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between"
                          >
                            <span className="text-sm">
                              {instrument.name}
                              {instrumentsKo.translations[instrument.id as string] && (
                                <span className="text-gray-500 dark:text-gray-400 ml-1">
                                  ({instrumentsKo.translations[instrument.id as string]})
                                </span>
                              )}
                            </span>
                            {formData.instruments.includes(instrument.id) && (
                              <Check className="w-4 h-4 text-blue-500" />
                            )}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Platform Identifiers */}
            <div>
              <h4 className="font-medium mb-4 flex items-center gap-2">
                <LinkIcon className="w-4 h-4" />
                {t('플랫폼 연동', 'Platform Integration', 'プラットフォーム連携')}
              </h4>

              {/* Platform fields - Always show Spotify and Apple Music */}
              <div className="space-y-4">
                {['spotify', 'apple'].map((platformType) => {
                  const identifier = formData.identifiers.find(id => id.type === platformType) || { type: platformType, value: '' };
                  const index = formData.identifiers.findIndex(id => id.type === platformType);
                  const config = identifierTypes[platformType as keyof typeof identifierTypes];
                  const isValid = identifier.value ? validateIdentifier(platformType as keyof typeof identifierTypes, identifier.value) : true;
                  const platformUrl = getPlatformUrl(identifier as PlatformIdentifier);

                  return (
                    <div key={platformType} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-medium flex items-center gap-2">
                          <span className="text-xl">{config.icon}</span>
                          {config.name}
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {t('(필수)', '(Required)', '(必須)')}
                          </span>
                        </h5>
                      </div>

                      <div className="space-y-3">
                        <div className="relative">
                          <input
                            type="text"
                            value={identifier.value}
                            onChange={(e) => updateIdentifier(index, e.target.value)}
                            disabled={formData.isNewArtist}
                            className={`w-full px-4 py-3 border-2 rounded-lg dark:bg-gray-700 font-mono text-sm ${
                              !isValid ? 'border-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600 focus:border-purple-500'
                            } focus:outline-none focus:ring-2 focus:ring-purple-500/20 ${
                              formData.isNewArtist ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800' : ''
                            }`}
                            placeholder={formData.isNewArtist ? t('신규 아티스트는 입력 불가', 'Not available for new artists', '新規アーティストは入力不可') : config.placeholder}
                          />
                          {identifier.value && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                              {isValid ? (
                                <Check className="w-5 h-5 text-green-500" />
                              ) : (
                                <AlertCircle className="w-5 h-5 text-red-500" />
                              )}
                            </div>
                          )}
                        </div>

                        {/* Help text with better formatting */}
                        <div className="bg-gray-100 dark:bg-gray-700/50 rounded-lg p-3">
                          <div className="flex items-start gap-2">
                            <Info className="w-4 h-4 mt-0.5 text-gray-500 flex-shrink-0" />
                            <div className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-line">
                              {config.helpText[language as 'ko' | 'en']}
                            </div>
                          </div>
                        </div>

                        {/* Page Check Button */}
                        <a
                          href={formData.isNewArtist ? '#' : (platformUrl || '#')}
                          target={formData.isNewArtist ? '_self' : '_blank'}
                          rel="noopener noreferrer"
                          onClick={formData.isNewArtist ? (e) => e.preventDefault() : undefined}
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            formData.isNewArtist
                              ? 'bg-gray-400 cursor-not-allowed text-gray-200'
                              : 'bg-purple-600 hover:bg-purple-700 text-white'
                          }`}
                        >
                          <ExternalLink className="w-4 h-4" />
                          {t('페이지 확인', 'Check Page', 'ページ確認')}
                          {!identifier.value && (
                            <span className="text-xs opacity-75">
                              {t('(검색 페이지로 이동)', '(Opens search)', '(検索ページへ移動)')}
                            </span>
                          )}
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Make New info */}
              {formData.isNewArtist && (
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div className="text-sm text-blue-700 dark:text-blue-300">
                      <p className="font-medium mb-1">{t('신규 아티스트 안내', 'New Artist Guide', '新規アーティストガイド')}</p>
                      <ul className="space-y-1 text-xs">
                        <li>• {t('각 플랫폼에 새로운 아티스트 페이지가 생성됩니다', 'A new artist page will be created on each platform', '各プラットフォームに新しいアーティストページが作成されます')}</li>
                        <li>• {t('기존 아티스트와 연결하려면 위의 식별자를 입력하세요', 'To connect with existing artists, enter the identifiers above', '既存のアーティストと連携するには、上記の識別子を入力してください')}</li>
                        <li>• {t('생성 후 약 24-48시간 내 플랫폼에 반영됩니다', 'It will be reflected on platforms within 24-48 hours after creation', '作成後約24-48時間以内にプラットフォームに反映されます')}</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-white dark:bg-gray-800 flex-shrink-0">
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              {t('취소', 'Cancel', 'キャンセル')}
            </button>
            <button
              onClick={handleSave}
              disabled={!formData.name || formData.roles.length === 0}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {contributor ? t('수정', 'Edit', '編集') : t('추가', 'Add', '追加')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Export the wrapped component
export default function ContributorForm(props: ContributorFormProps) {
  return (
    <ValidationProvider>
      <ContributorFormContent {...props} />
    </ValidationProvider>
  );
}
