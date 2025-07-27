import { useState, useEffect } from 'react';
import { Search, Plus, Clock, Star, Music, Users, Languages, Link as LinkIcon, Edit2, Trash2, Check } from 'lucide-react';
import { useLanguageStore } from '@/store/language.store';
import useSafeStore from '@/hooks/useSafeStore';
import { useSavedArtistsStore, SavedArtist, SavedContributor } from '@/store/savedArtists.store';
import ContributorForm from './ContributorForm';

interface ArtistSelectorProps {
  type: 'artist' | 'contributor'
  onSelect: (selected: SavedArtist | SavedContributor) => void
  onCreateNew?: () => void  // Made optional since it's not used internally
  filterRoles?: string[]
  filterInstruments?: string[]
  selectedIds?: string[]  // IDs of already selected items
}

export default function ArtistSelector({
  type,
  onSelect,
  selectedIds = []
}: ArtistSelectorProps) {
  const language = useSafeStore(useLanguageStore, (state) => state.language);
  const t = (ko: string, en: string) => language === 'ko' ? ko : en;

  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingItem, setEditingItem] = useState<SavedArtist | SavedContributor | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const {
    artists,
    contributors,
    loading,
    searchArtists,
    searchContributors,
    useArtist,
    useContributor,
    addArtist,
    addContributor,
    updateArtist,
    updateContributor,
    deleteArtist,
    deleteContributor,
    fetchArtists,
    fetchContributors
  } = useSavedArtistsStore();

  // Fetch data on mount and when component becomes visible
  useEffect(() => {
    console.log('ArtistSelector: Fetching data for type:', type);
    if (type === 'artist') {
      fetchArtists();
    } else {
      fetchContributors();
    }
  }, [type, fetchArtists, fetchContributors]);

  // Also fetch fresh data whenever searchQuery changes from empty (component likely just opened)
  useEffect(() => {
    if (searchQuery === '') {
      console.log('ArtistSelector: Component opened, fetching fresh data');
      if (type === 'artist') {
        fetchArtists();
      } else {
        fetchContributors();
      }
    }
  }, []);

  const results = type === 'artist'
    ? searchArtists(searchQuery)
    : searchContributors(searchQuery);

  const handleSelect = async (item: SavedArtist | SavedContributor) => {
    if (type === 'artist') {
      const artist = await useArtist(item.id);
      if (artist) onSelect(artist);
    } else {
      const contributor = await useContributor(item.id);
      if (contributor) onSelect(contributor);
    }
  };

  const handleCreateNew = async (data: any) => {
    try {
      if (type === 'artist') {
        const newArtist = await addArtist({
          name: data.name,
          translations: data.translations,
          identifiers: data.identifiers
        });
        onSelect(newArtist);
      } else {
        const newContributor = await addContributor({
          name: data.name,
          roles: data.roles,
          instruments: data.instruments,
          translations: data.translations,
          identifiers: data.identifiers
        });
        onSelect(newContributor);
      }
      setShowCreateForm(false);
    } catch (error) {
      console.error('Error creating:', error);
    }
  };

  const handleUpdate = async (data: any) => {
    if (!editingItem) return;

    try {
      if (type === 'artist') {
        await updateArtist(editingItem.id, {
          name: data.name,
          translations: data.translations,
          identifiers: data.identifiers
        });
      } else {
        await updateContributor(editingItem.id, {
          name: data.name,
          roles: data.roles,
          instruments: data.instruments,
          translations: data.translations,
          identifiers: data.identifiers
        });
      }
      setEditingItem(null);
      // Refresh the list
      if (type === 'artist') {
        fetchArtists();
      } else {
        fetchContributors();
      }
    } catch (error) {
      console.error('Error updating:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      if (type === 'artist') {
        await deleteArtist(id);
        fetchArtists();
      } else {
        await deleteContributor(id);
        fetchContributors();
      }
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return t('오늘', 'Today');
    if (diffInDays === 1) return t('어제', 'Yesterday');
    if (diffInDays < 7) return t(`${diffInDays}일 전`, `${diffInDays} days ago`);
    if (diffInDays < 30) return t(`${Math.floor(diffInDays / 7)}주 전`, `${Math.floor(diffInDays / 7)} weeks ago`);
    return t(`${Math.floor(diffInDays / 30)}개월 전`, `${Math.floor(diffInDays / 30)} months ago`);
  };

  return (
    <>
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700"
            placeholder={t(
              type === 'artist' ? '아티스트 검색...' : '기여자 검색...',
              type === 'artist' ? 'Search artists...' : 'Search contributors...'
            )}
          />
        </div>

        {/* Results */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              <p className="text-gray-500 dark:text-gray-400 mt-2">
                {t('로딩 중...', 'Loading...')}
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {searchQuery ?
                  t('검색 결과가 없습니다', 'No search results') :
                  t(
                    type === 'artist' ? '저장된 아티스트가 없습니다' : '저장된 기여자가 없습니다',
                    type === 'artist' ? 'No saved artists' : 'No saved contributors'
                  )
                }
              </p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="text-purple-600 hover:text-purple-700 font-medium flex items-center gap-2 mx-auto"
              >
                <Plus className="w-4 h-4" />
                {t(
                  type === 'artist' ? '새 아티스트 추가' : '새 기여자 추가',
                  type === 'artist' ? 'Add new artist' : 'Add new contributor'
                )}
              </button>
            </div>
          ) : (
            <>
              {results.map((item) => {
                const isSelected = selectedIds.includes(item.id);

                return (
                  <div
                    key={item.id}
                    className="relative group"
                  >
                    <button
                      onClick={() => handleSelect(item)}
                      disabled={isSelected}
                      className={`
                        w-full p-4 rounded-lg transition-all text-left relative overflow-hidden
                        ${isSelected
                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-500 dark:border-green-400 cursor-not-allowed'
                    : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border-2 border-transparent'
                  }
                      `}
                    >
                      {/* Selected indicator */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 flex items-center gap-2 bg-green-100 dark:bg-green-900/50 px-3 py-1 rounded-full">
                          <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                          <span className="text-xs font-semibold text-green-700 dark:text-green-300">
                            {t('등록됨', 'Added')}
                          </span>
                        </div>
                      )}

                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className={`p-2 rounded-lg ${
                            isSelected
                              ? 'bg-green-100 dark:bg-green-900/30'
                              : 'bg-purple-100 dark:bg-purple-900/30'
                          }`}>
                            {type === 'artist' ?
                              <Music className={`w-5 h-5 ${
                                isSelected
                                  ? 'text-green-600 dark:text-green-400'
                                  : 'text-purple-600 dark:text-purple-400'
                              }`} /> :
                              <Users className={`w-5 h-5 ${
                                isSelected
                                  ? 'text-green-600 dark:text-green-400'
                                  : 'text-purple-600 dark:text-purple-400'
                              }`} />
                            }
                          </div>

                          <div className="flex-1">
                            <h4 className={`font-medium ${
                              isSelected
                                ? 'text-green-700 dark:text-green-300'
                                : 'text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400'
                            }`}>
                              {item.name}
                            </h4>

                            <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-500">
                              {item.translations.length > 0 && (
                                <span className="flex items-center gap-1">
                                  <Languages className="w-3 h-3" />
                                  {item.translations.length} {t('번역', 'translations')}
                                </span>
                              )}

                              {item.identifiers.length > 0 && (
                                <span className="flex items-center gap-1">
                                  <LinkIcon className="w-3 h-3" />
                                  {item.identifiers.map((i: any) => i.type).join(', ')}
                                </span>
                              )}

                              {'roles' in item && Array.isArray(item.roles) && item.roles.length > 0 && (
                                <span>{item.roles.join(', ')}</span>
                              )}

                              {'instruments' in item && Array.isArray(item.instruments) && item.instruments.length > 0 && (
                                <span>{item.instruments.join(', ')}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right text-xs text-gray-500">
                          <div className="flex items-center gap-1 mb-1">
                            <Star className="w-3 h-3" />
                            <span>{item.usageCount}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{formatDate(item.lastUsed)}</span>
                          </div>
                        </div>
                      </div>
                    </button>

                    {/* Edit/Delete buttons */}
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingItem(item);
                        }}
                        className="p-2 bg-white dark:bg-gray-700 rounded-lg shadow-sm hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                        title={t('수정', 'Edit')}
                      >
                        <Edit2 className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDeleteConfirm(item.id);
                        }}
                        className="p-2 bg-white dark:bg-gray-700 rounded-lg shadow-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        title={t('삭제', 'Delete')}
                      >
                        <Trash2 className="w-4 h-4 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400" />
                      </button>
                    </div>

                    {/* Delete confirmation */}
                    {showDeleteConfirm === item.id && (
                      <div className="absolute inset-0 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center p-4 z-10">
                        <div className="text-center">
                          <p className="text-sm mb-3">
                            {t('정말 삭제하시겠습니까?', 'Are you sure you want to delete?')}
                          </p>
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(item.id);
                              }}
                              className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                            >
                              {t('삭제', 'Delete')}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowDeleteConfirm(null);
                              }}
                              className="px-3 py-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 text-sm"
                            >
                              {t('취소', 'Cancel')}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Add New Button */}
              <button
                onClick={() => setShowCreateForm(true)}
                className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-purple-500 dark:hover:border-purple-400 rounded-lg transition-colors text-center group"
              >
                <div className="flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400">
                  <Plus className="w-5 h-5" />
                  <span className="font-medium">
                    {t(
                      type === 'artist' ? '새 아티스트 추가' : '새 기여자 추가',
                      type === 'artist' ? 'Add new artist' : 'Add new contributor'
                    )}
                  </span>
                </div>
              </button>
            </>
          )}
        </div>

        {/* Usage Stats */}
        {(type === 'artist' ? artists : contributors).length > 0 && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>
                {t(
                  type === 'artist'
                    ? `총 ${artists.length}명의 아티스트`
                    : `총 ${contributors.length}명의 기여자`,
                  type === 'artist'
                    ? `Total ${artists.length} artists`
                    : `Total ${contributors.length} contributors`
                )}
              </span>
              <span>
                {t(
                  `${results.length}개 검색됨`,
                  `${results.length} found`
                )}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Create New Form */}
      {showCreateForm && (
        <ContributorForm
          contributor={undefined}
          onSave={handleCreateNew}
          onCancel={() => setShowCreateForm(false)}
          isArtist={type === 'artist'}
        />
      )}

      {/* Edit Form */}
      {editingItem && (
        <ContributorForm
          contributor={editingItem as any}
          onSave={handleUpdate}
          onCancel={() => setEditingItem(null)}
          isArtist={type === 'artist'}
        />
      )}
    </>
  );
}
