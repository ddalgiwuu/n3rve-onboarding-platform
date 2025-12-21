import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Trash2, Users, User, Music, HelpCircle, Globe, Search, Check, Sparkles, Edit2 } from 'lucide-react';
import { useLanguageStore } from '@/store/language.store';
import { useSavedArtistsStore } from '@/store/savedArtists.store';
import toast from 'react-hot-toast';

interface Artist {
  id: string
  name: string
  role: 'main' | 'featured' | 'additional'
  spotifyId?: string
  appleId?: string
  translations?: {
    [language: string]: string // e.g., { 'en': 'BTS', 'ja': '防弾少年団', 'zh': '防弹少年团' }
  }
}

interface ArtistManagementModalProps {
  isOpen: boolean
  onClose: () => void
  artists?: Artist[]
  artist?: any // Single artist for edit mode (SavedArtist type)
  mode?: 'edit' | 'create'
  onSave?: (artists: Artist[]) => void
  albumLevel?: boolean // true for album-level artists, false for track-level
  isFeaturing?: boolean // true when managing featuring artists
}

// Language options for translations
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

export default function ArtistManagementModal({
  isOpen,
  onClose,
  artists: initialArtists,
  artist,
  mode = 'create',
  onSave,
  albumLevel = true,
  isFeaturing = false
}: ArtistManagementModalProps) {
  const { language } = useLanguageStore();
  const t = (ko: string, en: string, ja?: string) => {
    switch (language) {
      case 'ko': return ko;
      case 'ja': return ja || en;
      default: return en;
    }
  };

  const savedArtistsStore = useSavedArtistsStore();

  // Initialize artists: use initialArtists array, or convert single artist to array, or empty array
  const [artists, setArtists] = useState<Artist[]>(
    initialArtists || (artist ? [artist] : [])
  );
  const [newArtist, setNewArtist] = useState<Partial<Artist>>({
    name: '',
    role: isFeaturing ? 'featured' : (albumLevel ? 'main' : 'additional'),
    spotifyId: 'MAKE_NEW',
    appleId: 'MAKE_NEW',
    translations: {}
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [showSpotifyHelp, setShowSpotifyHelp] = useState(false);
  const [showAppleHelp, setShowAppleHelp] = useState(false);
  const [activeTranslations, setActiveTranslations] = useState<string[]>([]);
  const [savedArtistSearch, setSavedArtistSearch] = useState('');
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [recentlyAddedIds, setRecentlyAddedIds] = useState<Set<string>>(new Set());

  // Load saved artists when modal opens
  useEffect(() => {
    if (isOpen && savedArtistsStore) {
      savedArtistsStore.fetchArtists()
        .catch(error => {
          // Only log if it's not an authentication issue
          if (!error.message?.includes('401')) {
            console.error('ArtistManagementModal: Failed to fetch saved artists:', error);
          }
        });
    }
  }, [isOpen]);

  // Manage body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = '0px'; // Prevent layout shift
    } else {
      // Restore body scroll
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [isOpen]);

  const validateArtist = () => {
    const errs: string[] = [];
    if (!newArtist.name?.trim()) {
      errs.push(t('아티스트 이름을 입력하세요', 'Please enter artist name', 'アーティスト名を入力してください'));
    }
    if (artists.some(a => a.name.toLowerCase() === newArtist.name?.toLowerCase())) {
      errs.push(t('이미 추가된 아티스트입니다', 'Artist already added', 'すでに追加されたアーティストです'));
    }
    if (!newArtist.spotifyId?.trim() || newArtist.spotifyId?.trim() === '') {
      errs.push(t('Spotify Artist ID는 필수입니다', 'Spotify Artist ID is required', 'Spotify Artist IDは必須です'));
    }
    if (!newArtist.appleId?.trim() || newArtist.appleId?.trim() === '') {
      errs.push(t('Apple Music Artist ID는 필수입니다', 'Apple Music Artist ID is required', 'Apple Music Artist IDは必須です'));
    }
    setErrors(errs);
    return errs.length === 0;
  };

  const addArtist = async () => {
    if (validateArtist()) {
      const artist: Artist = {
        id: Date.now().toString(),
        name: newArtist.name!.trim(),
        role: isFeaturing ? 'featured' : (albumLevel ? 'main' : newArtist.role as Artist['role']),
        spotifyId: newArtist.spotifyId?.trim() || undefined,
        appleId: newArtist.appleId?.trim() || undefined,
        translations: newArtist.translations
      };

      // Add to current session with animation
      setArtists([...artists, artist]);
      setRecentlyAddedIds(new Set([...recentlyAddedIds, artist.id]));

      // Success animation effect
      toast.success(
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          <span>{t('아티스트가 추가되었습니다!', 'Artist added!', 'アーティストが追加されました！')}</span>
        </div>,
        {
          duration: 2000,
          position: 'top-right',
          style: {
            background: 'linear-gradient(to right, #8b5cf6, #ec4899)',
            color: 'white',
            fontWeight: 'bold'
          }
        }
      );

      // Save to database only if authenticated
      if (savedArtistsStore) {
        try {
          await savedArtistsStore.addArtist({
            name: artist.name,
            translations: Object.entries(artist.translations || {}).map(([language, name]) => ({
              language,
              name
            })),
            identifiers: [
              ...(artist.spotifyId && artist.spotifyId !== 'MAKE_NEW' ? [{ type: 'SPOTIFY', value: artist.spotifyId }] : []),
              ...(artist.appleId && artist.appleId !== 'MAKE_NEW' ? [{ type: 'APPLE_MUSIC', value: artist.appleId }] : [])
            ]
          });
        } catch (error: any) {
          // Only log error if it's not an authentication issue
          if (!error.message?.includes('not authenticated')) {
            console.error('Error saving artist:', error);
          }
          // Don't show error toast for authentication issues during submission
        }
      }

      // Clear all fields for next artist
      setNewArtist({
        name: '',
        role: isFeaturing ? 'featured' : (albumLevel ? 'main' : 'additional'),
        spotifyId: 'MAKE_NEW',
        appleId: 'MAKE_NEW',
        translations: {}
      });
      setErrors([]);
      setActiveTranslations([]);

      // Focus back on name field for quick entry
      setTimeout(() => {
        const nameInput = document.querySelector('input[placeholder*="아티스트명"]') as HTMLInputElement;
        if (nameInput) {
          nameInput.focus();
        }
      }, 100);
    }
  };

  const removeArtist = (id: string) => {
    setArtists(artists.filter(a => a.id !== id));
    setRecentlyAddedIds(new Set([...recentlyAddedIds].filter(aid => aid !== id)));
  };

  const handleSave = () => {
    onSave(artists);
    onClose();
  };

  const addTranslation = (langCode: string) => {
    if (!activeTranslations.includes(langCode)) {
      setActiveTranslations([...activeTranslations, langCode]);
    }
  };

  const removeTranslation = (langCode: string) => {
    setActiveTranslations(activeTranslations.filter(l => l !== langCode));
    const newTranslations = { ...newArtist.translations };
    delete newTranslations[langCode];
    setNewArtist({ ...newArtist, translations: newTranslations });
  };

  console.log('ArtistManagementModal render - isOpen:', isOpen);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                {isFeaturing ? (
                  <>
                    <Music className="w-6 h-6" />
                    {t('피처링 아티스트 관리', 'Manage Featuring Artists', 'フィーチャリングアーティスト管理')}
                  </>
                ) : albumLevel ? (
                  <>
                    <Users className="w-6 h-6" />
                    {t('앨범 아티스트 관리', 'Manage Album Artists', 'アルバムアーティスト管理')}
                  </>
                ) : (
                  <>
                    <User className="w-6 h-6" />
                    {t('트랙 아티스트 관리', 'Manage Track Artists', 'トラックアーティスト管理')}
                  </>
                )}
              </h2>
              <p className="text-purple-100 text-sm mt-1">
                {isFeaturing
                  ? t('피처링 아티스트를 추가하고 관리하세요', 'Add and manage featuring artists', 'フィーチャリングアーティストを追加・管理')
                  : albumLevel
                    ? t('앨범의 메인 아티스트를 추가하고 관리하세요', 'Add and manage main album artists', 'アルバムのメインアーティストを追加・管理')
                    : t('트랙의 아티스트를 추가하고 관리하세요', 'Add and manage track artists', 'トラックのアーティストを追加・管理')
                }
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Unified Artist Management Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                {t('아티스트 관리', 'Artist Management', 'アーティスト管理')}
              </h3>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
                  {t('현재 세션', 'Current Session', '現在のセッション')}: {artists?.length || 0}
                </span>
                <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm font-medium">
                  {t('라이브러리', 'Library', 'ライブラリ')}: {savedArtistsStore?.artists?.length || 0}
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder={t('아티스트 이름으로 검색...', 'Search by artist name...', 'アーティスト名で検索...')}
                    value={savedArtistSearch}
                    onChange={(e) => setSavedArtistSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-sm"
                  />
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {/* Current Session Artists */}
                {artists && artists.length > 0 && (
                  <>
                    <div className="px-4 py-2 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-xs font-medium text-purple-700 dark:text-purple-300 uppercase tracking-wider flex items-center gap-2">
                        <span className="animate-pulse w-2 h-2 bg-purple-500 rounded-full"></span>
                        {t('현재 세션 아티스트', 'Current Session Artists', '現在のセッションアーティスト')}
                      </p>
                    </div>
                    {artists.map((artist, index) => (
                      <div
                        key={artist.id}
                        className="group relative overflow-hidden"
                        style={{
                          animation: recentlyAddedIds.has(artist.id) ? `slideIn 0.3s ease-out ${index * 0.05}s both` : undefined
                        }}
                      >
                        {/* Newly added indicator */}
                        {recentlyAddedIds.has(artist.id) && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-500 to-pink-500 animate-pulse"></div>
                        )}

                        <div className="p-4 hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-pink-50/50 dark:hover:from-purple-900/10 dark:hover:to-pink-900/10 border-b border-gray-100 dark:border-gray-700 transition-all duration-200">
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0">
                              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20 transform transition-transform group-hover:scale-110">
                                <User className="w-6 h-6 text-white" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-bold text-gray-900 dark:text-white truncate text-lg">
                                  {artist.name}
                                </h4>
                                {recentlyAddedIds.has(artist.id) && (
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 text-purple-800 dark:text-purple-200 border border-purple-200 dark:border-purple-700">
                                    <Sparkles className="w-3 h-3 mr-1" />
                                    {t('방금 추가됨', 'Just Added', '追加されました')}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {artist.spotifyId && artist.spotifyId !== 'MAKE_NEW' && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-md text-xs font-medium border border-green-200 dark:border-green-800">
                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                      Spotify
                                  </span>
                                )}
                                {artist.spotifyId === 'MAKE_NEW' && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 rounded-md text-xs font-medium border border-orange-200 dark:border-orange-800">
                                    <Plus className="w-3 h-3" />
                                      Spotify New
                                  </span>
                                )}
                                {artist.appleId && artist.appleId !== 'MAKE_NEW' && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md text-xs font-medium border border-gray-200 dark:border-gray-700">
                                    <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
                                      Apple Music
                                  </span>
                                )}
                                {artist.appleId === 'MAKE_NEW' && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 rounded-md text-xs font-medium border border-orange-200 dark:border-orange-800">
                                    <Plus className="w-3 h-3" />
                                      Apple New
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex-shrink-0 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => {
                                  // Set the newArtist state to edit mode
                                  setNewArtist({
                                    name: artist.name,
                                    role: artist.role,
                                    spotifyId: artist.spotifyId || 'MAKE_NEW',
                                    appleId: artist.appleId || 'MAKE_NEW',
                                    translations: artist.translations || {}
                                  });

                                  // Set active translations
                                  setActiveTranslations(Object.keys(artist.translations || {}));

                                  // Scroll to the form
                                  setTimeout(() => {
                                    const formElement = document.querySelector('[placeholder*="아티스트명"]');
                                    if (formElement) {
                                      formElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
                                      ;(formElement as HTMLInputElement).focus();
                                    }
                                  }, 100);

                                  // Remove the artist from current list to edit
                                  setArtists(artists.filter(a => a.id !== artist.id));

                                  toast.success(t('수정하려면 아래 폼에서 변경하세요', 'Edit in the form below', '下のフォームで編集してください'));
                                }}
                                className="p-2 text-purple-600 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-900/20 rounded-lg transition-all transform hover:scale-110"
                                title={t('수정', 'Edit', '編集')}
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => removeArtist(artist.id)}
                                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all transform hover:scale-110"
                                title={t('삭제', 'Delete', '削除')}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {/* Library Artists */}
                {savedArtistsStore.searchArtists(savedArtistSearch).filter(savedArtist => !artists.some(a => a.name === savedArtist.name)).length > 0 && (
                  <>
                    <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/10 border-b border-gray-200 dark:border-gray-700 sticky top-0">
                      <p className="text-xs font-medium text-blue-700 dark:text-blue-300 uppercase tracking-wider">
                        {t('아티스트 라이브러리', 'Artist Library', 'アーティストライブラリ')}
                      </p>
                    </div>
                    {savedArtistsStore.searchArtists(savedArtistSearch).filter(savedArtist => !artists.some(a => a.name === savedArtist.name)).map((savedArtist) => (
                      <div key={savedArtist.id} className="group p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                              <User className="w-5 h-5 text-white" />
                            </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                                {savedArtist.name}
                              </h4>
                              {savedArtist.usageCount > 0 && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200">
                                  {savedArtist.usageCount}회 사용
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 mb-2">
                              {savedArtist.identifiers.find(id => id.type === 'SPOTIFY') && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-md text-xs font-medium">
                                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                Spotify
                                </span>
                              )}
                              {savedArtist.identifiers.find(id => id.type === 'APPLE_MUSIC') && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md text-xs font-medium">
                                  <span className="w-1.5 h-1.5 bg-gray-500 rounded-full"></span>
                                Apple Music
                                </span>
                              )}
                            </div>

                            {savedArtist.translations.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-2">
                                {savedArtist.translations.map((trans, idx) => (
                                  <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-xs">
                                    <Globe className="w-3 h-3" />
                                    {trans.language.toUpperCase()}: {trans.name}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="flex-shrink-0 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => {
                                const spotifyId = savedArtist.identifiers.find(id => id.type === 'SPOTIFY')?.value;
                                const appleId = savedArtist.identifiers.find(id => id.type === 'APPLE_MUSIC')?.value;

                                const artist: Artist = {
                                  id: Date.now().toString(),
                                  name: savedArtist.name,
                                  role: isFeaturing ? 'featured' : (albumLevel ? 'main' : 'additional'),
                                  spotifyId,
                                  appleId,
                                  translations: savedArtist.translations.reduce((acc, trans) => ({
                                    ...acc,
                                    [trans.language]: trans.name
                                  }), {})
                                };

                                setArtists([...artists, artist]);
                                setRecentlyAddedIds(new Set([...recentlyAddedIds, artist.id]));
                                savedArtistsStore.recordArtistUsage(savedArtist.id);
                                toast.success(t('아티스트가 추가되었습니다', 'Artist added', 'アーティストが追加されました'));
                              }}
                              className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" />
                              {t('사용', 'Use', '使用')}
                            </button>
                            <button
                              onClick={() => {
                              // Set the newArtist state to edit mode
                                const spotifyId = savedArtist.identifiers.find(id => id.type === 'SPOTIFY')?.value || 'MAKE_NEW';
                                const appleId = savedArtist.identifiers.find(id => id.type === 'APPLE_MUSIC')?.value || 'MAKE_NEW';

                                setNewArtist({
                                  name: savedArtist.name,
                                  role: isFeaturing ? 'featured' : (albumLevel ? 'main' : 'additional'),
                                  spotifyId,
                                  appleId,
                                  translations: savedArtist.translations.reduce((acc, trans) => ({
                                    ...acc,
                                    [trans.language]: trans.name
                                  }), {})
                                });

                                // Set active translations
                                setActiveTranslations(savedArtist.translations.map(t => t.language));

                                // Scroll to the form
                                setTimeout(() => {
                                  const formElement = document.querySelector('[placeholder*="아티스트명"]');
                                  if (formElement) {
                                    formElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
                                    ;(formElement as HTMLInputElement).focus();
                                  }
                                }, 100);

                                toast.success(t('수정하려면 아래 폼에서 변경하세요', 'Edit in the form below', '下のフォームで編集してください'));
                              }}
                              className="px-3 py-1.5 text-xs bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center gap-1"
                            >
                              <Edit2 className="w-3 h-3" />
                              {t('수정', 'Edit', '編集')}
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(t('정말 삭제하시겠습니까?', 'Are you sure you want to delete?', '本当に削除しますか？'))) {
                                  savedArtistsStore.deleteArtist(savedArtist.id)
                                    .then(() => {
                                      toast.success(t('아티스트가 삭제되었습니다', 'Artist deleted', 'アーティストが削除されました'));
                                    })
                                    .catch(error => {
                                      if (!error.message?.includes('401')) {
                                        toast.error(t('삭제에 실패했습니다', 'Failed to delete', '削除に失敗しました'));
                                      }
                                    });
                                }
                              }}
                              className="px-3 py-1.5 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" />
                              {t('삭제', 'Delete', '削除')}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {(!artists || artists.length === 0) && savedArtistsStore?.searchArtists(savedArtistSearch)?.length === 0 && (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400 font-medium">
                      {savedArtistSearch ? t('검색 결과가 없습니다', 'No search results', '検索結果がありません') : t('저장된 아티스트가 없습니다', 'No saved artists', '保存されたアーティストがありません')}
                    </p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                      {savedArtistSearch ? t('다른 검색어를 시도해보세요', 'Try a different search term', '別の検索語を試してください') : t('아티스트를 추가하면 자동으로 저장됩니다', 'Artists are automatically saved when added', 'アーティストを追加すると自動的に保存されます')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                {t('또는', 'OR', 'または')}
              </span>
            </div>
          </div>

          {/* Add New Artist */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 mb-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Plus className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              {t('새 아티스트 입력', 'Enter New Artist', '新規アーティスト入力')}
            </h3>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('아티스트 이름', 'Artist Name', 'アーティスト名')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newArtist.name || ''}
                    onChange={(e) => setNewArtist({ ...newArtist, name: e.target.value })}
                    placeholder={t('아티스트명 입력', 'Enter artist name', 'アーティスト名を入力')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-800"
                  />
                </div>

                {/* Role selection - only for non-album level and non-featuring */}
                {!albumLevel && !isFeaturing && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('역할', 'Role', '役割')}
                    </label>
                    <select
                      value={newArtist.role}
                      onChange={(e) => setNewArtist({ ...newArtist, role: e.target.value as Artist['role'] })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-800"
                    >
                      <option value="featured">{t('피처링', 'Featured', 'フィーチャリング')}</option>
                      <option value="additional">{t('참여 아티스트', 'Additional Artist', '参加アーティスト')}</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Artist Translations */}
              <div className="md:col-span-2">
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
                        <Globe className="w-5 h-5 text-white" />
                      </div>
                      {t('아티스트명 번역', 'Artist Name Translations', 'アーティスト名翻訳')}
                    </label>
                    <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
                      {t('선택사항', 'Optional', 'オプション')}
                    </span>
                  </div>

                  {/* Active translations */}
                  <div className="space-y-3">
                    {activeTranslations.map(langCode => {
                      const lang = translationLanguages.find(l => l.code === langCode);
                      return (
                        <div key={langCode} className="group relative bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
                          <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200" style={{ padding: '1px' }}>
                            <div className="bg-white dark:bg-gray-800 h-full w-full rounded-xl" />
                          </div>
                          <div className="relative p-4">
                            <div className="flex items-center gap-3">
                              <div className="flex-shrink-0">
                                <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/50 dark:to-blue-900/50 rounded-lg flex items-center justify-center">
                                  <span className="font-bold text-sm bg-gradient-to-br from-purple-600 to-blue-600 bg-clip-text text-transparent">
                                    {lang?.code.toUpperCase()}
                                  </span>
                                </div>
                              </div>
                              <div className="flex-1">
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                  {lang?.name}
                                </label>
                                <input
                                  type="text"
                                  value={newArtist.translations?.[langCode] || ''}
                                  onChange={(e) => setNewArtist({
                                    ...newArtist,
                                    translations: {
                                      ...newArtist.translations,
                                      [langCode]: e.target.value
                                    }
                                  })}
                                  placeholder={t(`${lang?.name}로 아티스트명 입력`, `Enter artist name in ${lang?.name}`, `${lang?.name}でアーティスト名を入力`)}
                                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 focus:bg-white dark:focus:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => removeTranslation(langCode)}
                                className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {activeTranslations.length === 0 && (
                      <div className="text-center py-8 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                        <Globe className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-500 dark:text-gray-400 font-medium mb-1">
                          {t('아직 번역이 없습니다', 'No translations yet', 'まだ翻訳がありません')}
                        </p>
                        <p className="text-sm text-gray-400 dark:text-gray-500">
                          {t('아래에서 언어를 선택하여 번역을 추가하세요', 'Select a language below to add translations', '下から言語を選択して翻訳を追加してください')}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Add translation button */}
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => setShowLanguageSelector(!showLanguageSelector)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-[1.02]"
                    >
                      <Plus className="w-5 h-5" />
                      {t('언어 추가', 'Add Language', '言語を追加')}
                    </button>

                    {showLanguageSelector && (
                      <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 animate-in fade-in slide-in-from-top-2">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {translationLanguages
                            .filter(lang => !activeTranslations.includes(lang.code))
                            .map(lang => (
                              <button
                                key={lang.code}
                                onClick={() => {
                                  addTranslation(lang.code);
                                  setShowLanguageSelector(false);
                                }}
                                className="p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors group"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400">
                                    {lang.code.toUpperCase()}
                                  </span>
                                  <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                                    {lang.name}
                                  </span>
                                </div>
                              </button>
                            ))
                          }
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Spotify ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Spotify Artist ID <span className="text-red-500">*</span>
                  <button
                    type="button"
                    onClick={() => setShowSpotifyHelp(!showSpotifyHelp)}
                    className="ml-2 text-gray-400 hover:text-gray-600"
                  >
                    <HelpCircle className="w-4 h-4 inline" />
                  </button>
                </label>
                {newArtist.spotifyId === 'MAKE_NEW' ? (
                  <div className="relative">
                    <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-2 border-purple-300 dark:border-purple-600 rounded-lg">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/20">
                          <Sparkles className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-purple-900 dark:text-purple-100">
                          {t('새 아티스트로 등록됩니다', 'Will be registered as a new artist', '新規アーティストとして登録されます')}
                        </p>
                        <p className="text-sm text-purple-700 dark:text-purple-300">
                          {t('Spotify에 아직 등록되지 않은 아티스트', 'Artist not yet on Spotify', 'Spotifyにまだ登録されていないアーティスト')}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setNewArtist({ ...newArtist, spotifyId: '' })}
                        className="p-2 text-purple-600 hover:bg-purple-100 dark:text-purple-400 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newArtist.spotifyId || ''}
                      onChange={(e) => setNewArtist({ ...newArtist, spotifyId: e.target.value })}
                      placeholder="spotify:artist:XXXXXXXXX"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-800"
                    />
                    <button
                      type="button"
                      onClick={() => setNewArtist({ ...newArtist, spotifyId: 'MAKE_NEW' })}
                      className="group relative px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-105 shadow-lg shadow-purple-500/25 overflow-hidden"
                    >
                      <span className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
                      <span className="relative flex items-center gap-2 font-bold">
                        <Plus className="w-4 h-4" />
                        {t('아직 없음', 'Not Listed', 'まだ登録なし')}
                      </span>
                    </button>
                  </div>
                )}

                {showSpotifyHelp && (
                  <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-sm">
                    <p className="font-medium text-green-800 dark:text-green-200 mb-2">
                      {t('Spotify Artist ID 찾는 방법', 'How to find Spotify Artist ID', 'Spotify Artist IDの見つけ方')}
                    </p>
                    <div className="space-y-2 text-green-700 dark:text-green-300">
                      <div>
                        <p className="font-medium">{t('Mac:', 'Mac:', 'Mac:')}</p>
                        <ol className="list-decimal list-inside ml-2">
                          <li>{t('Spotify 앱에서 아티스트 페이지 열기', 'Open artist page in Spotify app', 'Spotifyアプリでアーティストページを開く')}</li>
                          <li>{t('Option(⌥) 키를 누른 상태에서 아티스트 이름 옆 ⋯ 클릭', 'Hold Option(⌥) key and click ⋯ next to artist name', 'Option(⌥)キーを押しながらアーティスト名の横の⋯をクリック')}</li>
                          <li>{t('"Copy Spotify URI" 선택', 'Select "Copy Spotify URI"', '"Copy Spotify URI"を選択')}</li>
                          <li>{t('복사된 URI 예시: spotify:artist:XXXXXXXXX', 'Copied URI example: spotify:artist:XXXXXXXXX', 'コピーされたURIの例: spotify:artist:XXXXXXXXX')}</li>
                        </ol>
                        <p className="font-medium mt-2">{t('Windows:', 'Windows:', 'Windows:')}</p>
                        <ol className="list-decimal list-inside ml-2">
                          <li>{t('Spotify 앱에서 아티스트 페이지 열기', 'Open artist page in Spotify app', 'Spotifyアプリでアーティストページを開く')}</li>
                          <li>{t('Ctrl 키를 누른 상태에서 아티스트 이름 옆 ⋯ 클릭', 'Hold Ctrl key and click ⋯ next to artist name', 'Ctrlキーを押しながらアーティスト名の横の⋯をクリック')}</li>
                          <li>{t('"Copy Spotify URI" 선택', 'Select "Copy Spotify URI"', '"Copy Spotify URI"を選択')}</li>
                          <li>{t('복사된 URI 예시: spotify:artist:XXXXXXXXX', 'Copied URI example: spotify:artist:XXXXXXXXX', 'コピーされたURIの例: spotify:artist:XXXXXXXXX')}</li>
                          <li>{t('또는 웹에서 "Share" → "Copy link to artist"로 URL 복사 후 ID 추출', 'Or copy URL via web "Share" → "Copy link to artist" and extract ID', 'またはウェブで"Share" → "Copy link to artist"でURLをコピーしてIDを抽出')}</li>
                        </ol>
                      </div>
                      <p className="text-xs italic">
                        {t('아티스트가 Spotify에 없다면 비워두고 NEW 버튼을 클릭하세요.',
                          'If artist is not on Spotify, leave empty and click NEW button.',
                          'アーティストがSpotifyにない場合は、空のままNEWボタンをクリックしてください。')}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Apple Music ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Apple Music Artist ID <span className="text-red-500">*</span>
                  <button
                    type="button"
                    onClick={() => setShowAppleHelp(!showAppleHelp)}
                    className="ml-2 text-gray-400 hover:text-gray-600"
                  >
                    <HelpCircle className="w-4 h-4 inline" />
                  </button>
                </label>
                {newArtist.appleId === 'MAKE_NEW' ? (
                  <div className="relative">
                    <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-gradient-to-br from-gray-600 to-gray-800 rounded-lg flex items-center justify-center shadow-lg shadow-gray-600/20">
                          <Sparkles className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {t('새 아티스트로 등록됩니다', 'Will be registered as a new artist', '新規アーティストとして登録されます')}
                        </p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {t('Apple Music에 아직 등록되지 않은 아티스트', 'Artist not yet on Apple Music', 'Apple Musicにまだ登録されていないアーティスト')}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setNewArtist({ ...newArtist, appleId: '' })}
                        className="p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newArtist.appleId || ''}
                      onChange={(e) => setNewArtist({ ...newArtist, appleId: e.target.value })}
                      placeholder="123456789"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-800"
                    />
                    <button
                      type="button"
                      onClick={() => setNewArtist({ ...newArtist, appleId: 'MAKE_NEW' })}
                      className="group relative px-6 py-2 bg-gradient-to-r from-gray-600 to-gray-800 text-white rounded-lg hover:from-gray-700 hover:to-gray-900 transition-all transform hover:scale-105 shadow-lg shadow-gray-600/25 overflow-hidden"
                    >
                      <span className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
                      <span className="relative flex items-center gap-2 font-bold">
                        <Plus className="w-4 h-4" />
                        {t('아직 없음', 'Not Listed', 'まだ登録なし')}
                      </span>
                    </button>
                  </div>
                )}

                {showAppleHelp && (
                  <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-sm border border-gray-200 dark:border-gray-700">
                    <p className="font-medium text-gray-800 dark:text-gray-200 mb-2">
                      {t('Apple Music Artist ID 찾는 방법', 'How to find Apple Music Artist ID', 'Apple Music Artist IDの見つけ方')}
                    </p>
                    <div className="space-y-2 text-gray-700 dark:text-gray-300">
                      <div>
                        <p className="font-medium">{t('Mac:', 'Mac:', 'Mac:')}</p>
                        <ol className="list-decimal list-inside ml-2">
                          <li>{t('Apple Music 앱에서 아티스트 페이지 열기', 'Open artist page in Apple Music app', 'Apple Musicアプリでアーティストページを開く')}</li>
                          <li>{t('아티스트 이름 우클릭', 'Right-click artist name', 'アーティスト名を右クリック')}</li>
                          <li>{t('"Share" → "Copy Link" 선택', 'Select "Share" → "Copy Link"', '"Share" → "Copy Link"を選択')}</li>
                          <li>{t('URL에서 ID 추출: music.apple.com/artist/artist-name/[이 숫자가 ID]',
                            'Extract ID from URL: music.apple.com/artist/artist-name/[this number is the ID]',
                            'URLからIDを抽出: music.apple.com/artist/artist-name/[この数字がID]')}</li>
                        </ol>
                      </div>
                      <div>
                        <p className="font-medium">{t('Windows:', 'Windows:', 'Windows:')}</p>
                        <ol className="list-decimal list-inside ml-2">
                          <li>{t('웹브라우저에서 music.apple.com 접속', 'Go to music.apple.com in web browser', 'ウェブブラウザでmusic.apple.comにアクセス')}</li>
                          <li>{t('아티스트 검색 후 페이지 열기', 'Search and open artist page', 'アーティストを検索してページを開く')}</li>
                          <li>{t('URL에서 마지막 숫자가 ID', 'The last number in URL is the ID', 'URLの最後の数字がID')}</li>
                        </ol>
                      </div>
                      <p className="text-xs italic">
                        {t('아티스트가 Apple Music에 없다면 비워두고 NEW 버튼을 클릭하세요.',
                          'If artist is not on Apple Music, leave empty and click NEW button.',
                          'アーティストがApple Musicにない場合は、空のままNEWボタンをクリックしてください。')}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {errors.length > 0 && (
                <div className="text-sm text-red-600 dark:text-red-400">
                  {errors.map((err, idx) => <p key={idx}>{err}</p>)}
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  onClick={addArtist}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  {t('아티스트 추가', 'Add Artist', 'アーティストを追加')}
                </button>
                <button
                  onClick={() => {
                    setNewArtist({
                      name: '',
                      role: isFeaturing ? 'featured' : (albumLevel ? 'main' : 'additional'),
                      spotifyId: 'MAKE_NEW',
                      appleId: 'MAKE_NEW',
                      translations: {}
                    });
                    setErrors([]);
                    setActiveTranslations([]);
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  {t('초기화', 'Clear', 'クリア')}
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            {t('취소', 'Cancel', 'キャンセル')}
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            {t('완료', 'Done', '完了')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
