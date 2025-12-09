import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Trash2, Users, Music2, Edit3, Mic2, Search, ChevronDown, User, ExternalLink } from 'lucide-react';
import { useLanguageStore } from '@/store/language.store';
import ContributorForm from './ContributorForm';
import contributorRolesData from '@/data/contributorRoles.json';
import { useSavedArtistsStore } from '@/contexts/SavedArtistsContext';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import instrumentsData from '@/data/instruments.json';
import roleTranslationsData from '@/data/contributorRolesTranslations.json';
import instrumentTranslationsData from '@/data/instrumentTranslations.json';
import type { RoleTranslations, InstrumentTranslations } from '@/types/translations';
import { useFuzzySearch } from '@/hooks/useFuzzySearch';
import { prepareRolesForSearch, prepareInstrumentsForSearch } from '@/utils/searchDataPreparation';
import contributorRolesKoData from '@/data/contributorRolesKo.json';
import instrumentsKoData from '@/data/instrumentsKo.json';
import PendingContributorCard from './PendingContributorCard';

const contributorRolesKo = contributorRolesKoData as { translations: Record<string, string> };
const instrumentsKo = instrumentsKoData as { translations: Record<string, string> };

const roleTranslations = roleTranslationsData as RoleTranslations;
const instrumentTranslations = instrumentTranslationsData as InstrumentTranslations;

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

interface PendingContributor {
  savedId: string  // Original saved contributor/artist ID
  name: string
  translations: Translation[]
  identifiers: PlatformIdentifier[]
  isNewArtist: boolean
  selectedRoles: string[]
  selectedInstruments: string[]
  isFromArtists?: boolean  // Track if this came from artists collection
}

interface Artist {
  id: string
  name: string
  role: 'main' | 'featuring'
  translations?: any[]
  identifiers?: PlatformIdentifier[]
}

interface ContributorManagementModalProps {
  isOpen: boolean
  onClose: () => void
  contributors: Contributor[]
  onSave: (contributors: Contributor[]) => void
  trackTitle?: string
  trackArtists?: Artist[]
  trackFeaturingArtists?: Artist[]
}

export default function ContributorManagementModal({
  isOpen,
  onClose,
  contributors: initialContributors,
  onSave,
  trackTitle,
  trackArtists = [],
  trackFeaturingArtists = []
}: ContributorManagementModalProps) {
  const { language } = useLanguageStore();
  const t = (ko: string, en: string) => language === 'ko' ? ko : en;

  const [contributors, setContributors] = useState<Contributor[]>(initialContributors);
  const [editingContributor, setEditingContributor] = useState<Contributor | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [pendingContributors, setPendingContributors] = useState<PendingContributor[]>([]);

  // Fuzzy search setup
  const preparedRoles = useMemo(() => prepareRolesForSearch(), []);
  const preparedInstruments = useMemo(() => prepareInstrumentsForSearch(), []);

  const fuzzySearchRoles = useFuzzySearch(preparedRoles, {
    keys: [
      { name: 'id', weight: 2.0 },
      { name: 'name', weight: 1.5 },
      { name: 'koName', weight: 1.0 }
    ],
    threshold: 0.4
  });

  const fuzzySearchInstruments = useFuzzySearch(preparedInstruments, {
    keys: [
      { name: 'id', weight: 2.0 },
      { name: 'name', weight: 1.5 },
      { name: 'koName', weight: 1.0 }
    ],
    threshold: 0.35
  });

  // Get saved artists and contributors from context
  const {
    artists: savedArtists,
    contributors: savedContributors,
    recordContributorUsage,
    addContributor: saveContributor,
    updateContributor: updateSavedContributor,
    updateArtist: updateSavedArtist
  } = useSavedArtistsStore();

  // Add saved contributor to pending for role/instrument selection
  const addToPending = (saved: any, fromArtists = false) => {
    console.log('[addToPending] Called with:', {
      id: saved?.id,
      name: saved?.name,
      hasIdentifiers: saved?.identifiers?.length,
      identifiers: saved?.identifiers,
      identifiersDetail: saved?.identifiers?.map((i: any) => ({ type: i.type, value: i.value })),
      fromArtists
    });

    // Validate saved object has required ID
    if (!saved || !saved.id) {
      console.error('[addToPending] Invalid saved contributor - missing ID:', saved);
      toast.error(t('유효하지 않은 기여자입니다', 'Invalid contributor'));
      return;
    }

    // Check if already in pending
    if (pendingContributors.some(p => p.savedId === saved.id)) {
      toast.error(t('이미 추가된 기여자입니다', 'Already added'));
      return;
    }

    // Properly detect if this is a new artist:
    // - No identifiers array → new artist
    // - Empty identifiers array → new artist
    // - All identifiers have empty values → new artist
    // - At least one identifier has a value → existing artist
    const hasIdentifiers = saved.identifiers && Array.isArray(saved.identifiers) && saved.identifiers.length > 0;
    const hasAnyValue = hasIdentifiers && saved.identifiers.some((i: any) => i.value && i.value.trim() !== '');
    const isNewArtist = !hasAnyValue;

    // Ensure translations have IDs for React keys
    const translationsWithIds = (saved.translations || []).map((t: any) => ({
      id: t.id || uuidv4(),
      language: t.language,
      name: t.name
    }));

    const pending: PendingContributor = {
      savedId: saved.id,
      name: saved.name,
      translations: translationsWithIds,
      identifiers: saved.identifiers || [
        { type: 'SPOTIFY' as any, value: '' },
        { type: 'APPLE_MUSIC' as any, value: '' }
      ],
      isNewArtist: isNewArtist,
      selectedRoles: [],
      selectedInstruments: [],
      isFromArtists: fromArtists
    };

    console.log('[addToPending] Created pending:', {
      savedId: pending.savedId,
      name: pending.name,
      translationsCount: pending.translations.length,
      identifiersCount: pending.identifiers.length,
      identifiersValues: pending.identifiers.map(i => ({ type: i.type, value: i.value })),
      isNewArtist: pending.isNewArtist
    });

    setPendingContributors([...pendingContributors, pending]);
  };

  // Remove from pending
  const removeFromPending = (savedId: string) => {
    setPendingContributors(pendingContributors.filter(p => p.savedId !== savedId));
  };

  // Update pending contributor fields
  const updatePending = (savedId: string, updates: Partial<PendingContributor>) => {
    setPendingContributors(pendingContributors.map(p =>
      p.savedId === savedId ? { ...p, ...updates } : p
    ));
  };

  // Get role icons based on category
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Composition': return Edit3;
      case 'Performance': return Mic2;
      case 'Production': return Music2;
      default: return Users;
    }
  };

  const addContributor = async (contributor: Contributor) => {
    // 1. Update modal's local state (for current track)
    setContributors([...contributors, contributor]);

    // 2. Save to global context (for future reuse in other tracks)
    try {
      await saveContributor({
        name: contributor.name,
        // Remove 'id' field from translations to match Prisma schema
        translations: contributor.translations.map(({ language, name }) => ({ language, name })),
        // Don't save roles - they can differ per track
        roles: [],
        // Don't save instruments - they can differ per track
        instruments: [],
        // Convert type to Prisma enum format (SPOTIFY, APPLE_MUSIC)
        identifiers: contributor.identifiers
          .filter(({ value }) => value && value.trim() !== '')  // Only save non-empty identifiers
          .map(({ type, value, url }) => ({
            type: type === 'apple' ? 'APPLE_MUSIC' : type.toUpperCase(),  // apple → APPLE_MUSIC, spotify → SPOTIFY
            value,
            url
          }))
        // Note: isNewArtist is not saved to SavedContributor schema
      });
      toast.success(t('기여자가 저장되었습니다', 'Contributor saved for future use'));
    } catch (error) {
      console.error('Failed to save contributor to global store:', error);
      console.error('Contributor data:', contributor);
      // Still close form since contributor was added to current track
    }

    setShowAddForm(false);
  };

  const updateContributor = (updatedContributor: Contributor) => {
    setContributors(contributors.map(c =>
      c.id === updatedContributor.id ? updatedContributor : c
    ));
    setEditingContributor(null);
  };

  const removeContributor = (id: string) => {
    setContributors(contributors.filter(c => c.id !== id));
  };

  const handleSave = async () => {
    // 1. Convert pending contributors to track contributors
    const newContributors = pendingContributors.map(pending => ({
      id: `track_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      name: pending.name,
      translations: pending.translations,
      roles: pending.selectedRoles,
      instruments: pending.selectedInstruments,
      identifiers: pending.identifiers,
      isNewArtist: pending.isNewArtist
    }));

    // 2. Add to track
    const allContributors = [...contributors, ...newContributors];
    onSave(allContributors);

    // 3. Update saved contributors/artists with new data (IDs, isNewArtist changes)
    for (const pending of pendingContributors) {
      try {
        // Check if savedId is a valid MongoDB ObjectID (24 hex characters)
        const isMongoId = /^[a-f\d]{24}$/i.test(pending.savedId);

        console.log('[handleSave] Processing pending:', {
          name: pending.name,
          savedId: pending.savedId,
          isMongoId,
          hasIdentifiers: pending.identifiers?.length,
          isFromArtists: pending.isFromArtists
        });

        if (isMongoId) {
          // Use correct API based on source
          if (pending.isFromArtists) {
            console.log('[handleSave] Updating ARTIST with MongoDB ID:', pending.savedId);
            await updateSavedArtist(pending.savedId, {
              identifiers: pending.identifiers,
              translations: pending.translations
            });
          } else {
            console.log('[handleSave] Updating CONTRIBUTOR with MongoDB ID:', pending.savedId);
            await updateSavedContributor(pending.savedId, {
              identifiers: pending.identifiers,
              isNewArtist: pending.isNewArtist,
              translations: pending.translations
            });
            await recordContributorUsage(pending.savedId);
          }
        } else {
          // Invalid MongoDB ID - find by name
          console.log('[handleSave] Invalid MongoDB ID, finding by name:', pending.name);

          if (pending.isFromArtists) {
            const savedArtist = savedArtists.find(a => a.name === pending.name);
            if (savedArtist && savedArtist.id) {
              await updateSavedArtist(savedArtist.id, {
                identifiers: pending.identifiers,
                translations: pending.translations
              });
            } else {
              console.warn('[handleSave] Could not find saved artist for:', pending.name);
            }
          } else {
            const savedContributor = savedContributors.find(s => s.name === pending.name);
            if (savedContributor && savedContributor.id) {
              await updateSavedContributor(savedContributor.id, {
                identifiers: pending.identifiers,
                isNewArtist: pending.isNewArtist,
                translations: pending.translations
              });
              await recordContributorUsage(savedContributor.id);
            } else {
              console.warn('[handleSave] Could not find saved contributor for:', pending.name);
            }
          }
        }
      } catch (error) {
        console.error('Failed to update saved contributor:', error);
      }
    }

    // 4. Clear pending and close
    setPendingContributors([]);
    onClose();
  };

  if (!isOpen) return null;

  // Group contributors by their primary role category
  const groupedContributors = contributors.reduce((acc, contributor) => {
    if (contributor.roles.length > 0) {
      const primaryRoleId = contributor.roles[0];
      const primaryRole = contributorRolesData.roles.find(r => r.id === primaryRoleId);
      const category = primaryRole?.category || 'Other';

      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(contributor);
    } else {
      // Include contributors without roles in "Uncategorized" section
      if (!acc['Uncategorized']) {
        acc['Uncategorized'] = [];
      }
      acc['Uncategorized'].push(contributor);
    }
    return acc;
  }, {} as Record<string, Contributor[]>);

  const getRoleName = (roleId: string) => {
    const role = contributorRolesData.roles.find(r => r.id === roleId);
    const roleName = role?.name || roleId;

    // Get translation if available
    const translation = roleTranslations.roleTranslations[roleId];
    if (translation && language === 'ko') {
      return `${translation.ko} (${roleName})`;
    }

    return roleName;
  };

  const getInstrumentName = (instrumentId: string) => {
    const instrument = instrumentsData.instruments.find(i => i.id === instrumentId);
    const instrumentName = instrument?.name || instrumentId;

    // Get translation if available
    const translation = instrumentTranslations.instrumentTranslations[instrumentId];
    if (translation && language === 'ko') {
      return `${translation.ko} (${instrumentName})`;
    }

    return instrumentName;
  };

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]" style={{ zIndex: 9999 }}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('기여자 관리', 'Contributor Management')}
              </h2>
              {trackTitle && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {t('트랙:', 'Track:')} {trackTitle}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {editingContributor ? (
            <ContributorForm
              contributor={editingContributor}
              onSave={updateContributor}
              onCancel={() => setEditingContributor(null)}
            />
          ) : showAddForm ? (
            <ContributorForm
              onSave={addContributor}
              onCancel={() => setShowAddForm(false)}
            />
          ) : (
            <>
              {/* Add New Contributor Button */}
              <button
                onClick={() => setShowAddForm(true)}
                className="w-full mb-6 px-4 py-3 border-2 border-dashed border-purple-300 dark:border-purple-700 rounded-lg hover:border-purple-500 dark:hover:border-purple-500 transition-colors text-purple-600 dark:text-purple-400 font-medium flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                {t('새 기여자 추가', 'Add New Contributor')}
              </button>

              {/* Track Artists - Quick Add Section */}
              {(trackArtists.length > 0 || trackFeaturingArtists.length > 0) && (
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                  <div className="flex items-center gap-2 mb-3">
                    <Music2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {t('트랙 아티스트', 'Track Artists')}
                    </h3>
                    <span className="text-sm text-gray-500">
                      ({trackArtists.length + trackFeaturingArtists.length})
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {t('아티스트를 클릭하여 기여자로 추가하세요', 'Click artists to add as contributors')}
                  </p>

                  <div className="space-y-2">
                    {/* Combine and deduplicate artists by name, preserving their actual role */}
                    {(() => {
                      // Merge both arrays
                      const allArtists = [...trackArtists, ...trackFeaturingArtists];

                      // Deduplicate by name - keep first occurrence
                      const uniqueArtists = allArtists.filter((artist, index, self) =>
                        index === self.findIndex(a => a.name === artist.name)
                      );

                      return uniqueArtists;
                    })().map(artist => {
                      const alreadyPending = pendingContributors.some(p => p.name === artist.name);
                      return (
                        <button
                          key={artist.id}
                          onClick={async () => {
                            if (alreadyPending) return;

                            // Convert artist format (spotifyId/appleId) to identifiers array
                            // IMPORTANT: type must be uppercase enum (SPOTIFY, APPLE_MUSIC) for Prisma
                            const artistIdentifiers: PlatformIdentifier[] = [];
                            if ((artist as any).spotifyId) {
                              artistIdentifiers.push({
                                type: 'SPOTIFY' as any,
                                value: (artist as any).spotifyId
                              });
                            }
                            if ((artist as any).appleId) {
                              artistIdentifiers.push({
                                type: 'APPLE_MUSIC' as any,
                                value: (artist as any).appleId
                              });
                            }

                            // Convert translations from object to array
                            const artistTranslations: Translation[] = [];
                            if (artist.translations && typeof artist.translations === 'object') {
                              Object.entries(artist.translations).forEach(([language, name]) => {
                                if (name) {
                                  artistTranslations.push({
                                    id: uuidv4(),
                                    language,
                                    name: name as string
                                  });
                                }
                              });
                            }

                            console.log('[Track Artist Click]', {
                              artistName: artist.name,
                              artistId: artist.id,
                              spotifyId: (artist as any).spotifyId,
                              appleId: (artist as any).appleId,
                              convertedIdentifiers: artistIdentifiers,
                              convertedTranslations: artistTranslations
                            });

                            // Check savedArtists FIRST (they usually have identifiers)
                            let savedArtist = savedArtists.find(a => a.name === artist.name);
                            let isFromArtists = false;

                            if (savedArtist) {
                              // Found in artists collection
                              isFromArtists = true;
                              console.log('[Track Artist] Found in savedArtists:', savedArtist.id, 'identifiers:', savedArtist.identifiers?.length);
                            } else {
                              // Check in contributors if not found in artists
                              savedArtist = savedContributors.find(s => s.name === artist.name);

                              if (savedArtist) {
                                console.log('[Track Artist] Found in savedContributors:', savedArtist?.id);

                                // 🔥 FIX: Check if existing contributor lacks identifiers but we have new ones
                                const hasNoIdentifiers = !savedArtist.identifiers || savedArtist.identifiers.length === 0;
                                const hasNewIdentifiers = artistIdentifiers && artistIdentifiers.length > 0;

                                if (hasNoIdentifiers && hasNewIdentifiers) {
                                  console.log('[Track Artist] Existing contributor has no IDs, updating with:', artistIdentifiers);

                                  // Update existing contributor with new identifiers
                                  try {
                                    await updateSavedContributor(savedArtist.id, {
                                      identifiers: artistIdentifiers,
                                      translations: artistTranslations.length > 0 ? artistTranslations : savedArtist.translations
                                    });

                                    // Update local reference with new identifiers
                                    savedArtist = {
                                      ...savedArtist,
                                      identifiers: artistIdentifiers,
                                      translations: artistTranslations.length > 0 ? artistTranslations : savedArtist.translations
                                    };

                                    console.log('[Track Artist] Updated existing contributor with IDs:', savedArtist.identifiers);
                                    toast.success(t('아티스트 정보가 업데이트되었습니다', 'Artist information updated'));
                                  } catch (error) {
                                    console.error('Failed to update contributor identifiers:', error);
                                    toast.error(t('업데이트 실패', 'Update failed'));
                                    return;
                                  }
                                }
                              }
                            }

                            // 🔥 NEW FIX: If found in artists collection, update using artist endpoint
                            if (savedArtist && isFromArtists) {
                              const hasNoIdentifiers = !savedArtist.identifiers || savedArtist.identifiers.length === 0;
                              const hasNewIdentifiers = artistIdentifiers && artistIdentifiers.length > 0;

                              if (hasNoIdentifiers && hasNewIdentifiers) {
                                console.log('[Track Artist] Artist has no IDs, updating artist with:', artistIdentifiers);

                                try {
                                  await updateSavedArtist(savedArtist.id, {
                                    identifiers: artistIdentifiers,
                                    translations: artistTranslations.length > 0 ? artistTranslations : savedArtist.translations
                                  });

                                  savedArtist = {
                                    ...savedArtist,
                                    identifiers: artistIdentifiers,
                                    translations: artistTranslations.length > 0 ? artistTranslations : savedArtist.translations
                                  };

                                  console.log('[Track Artist] Updated existing artist with IDs:', savedArtist.identifiers);
                                  toast.success(t('아티스트 정보가 업데이트되었습니다', 'Artist information updated'));
                                } catch (error) {
                                  console.error('Failed to update artist identifiers:', error);
                                  toast.error(t('업데이트 실패', 'Update failed'));
                                  return;
                                }
                              }
                            }

                            if (!savedArtist) {
                              // Create new saved contributor for this track artist
                              console.log('[Track Artist] Creating new saved contributor with identifiers:', artistIdentifiers);
                              try {
                                savedArtist = await saveContributor({
                                  name: artist.name,
                                  translations: artistTranslations,
                                  roles: [],
                                  instruments: [],
                                  identifiers: artistIdentifiers
                                });
                                console.log('[Track Artist] Created saved contributor:', savedArtist?.id);
                                toast.success(t('트랙 아티스트를 저장했습니다', 'Track artist saved'));
                              } catch (error) {
                                console.error('Failed to save track artist:', error);
                                toast.error(t('저장 실패', 'Failed to save'));
                                return;
                              }
                            }

                            // Validate savedArtist before adding to pending
                            if (!savedArtist || !savedArtist.id) {
                              console.error('Failed to get valid saved artist:', savedArtist);
                              toast.error(t('기여자 저장에 실패했습니다', 'Failed to save contributor'));
                              return;
                            }

                            // Now add to pending with proper saved ID and source flag
                            addToPending(savedArtist, isFromArtists);
                          }}
                          disabled={alreadyPending}
                          className={`w-full p-3 rounded-lg border transition-all text-left ${
                            alreadyPending
                              ? 'bg-gray-100 dark:bg-gray-700/50 border-gray-300 opacity-50 cursor-not-allowed'
                              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-400 hover:shadow-md cursor-pointer'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-blue-600" />
                              <span className="font-medium text-gray-900 dark:text-white">
                                {artist.name}
                              </span>
                              <span className="text-xs text-blue-600 dark:text-blue-400 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 rounded">
                                {artist.role === 'main' ? t('메인', 'Main') : t('피처링', 'Featuring')}
                              </span>
                            </div>
                            {alreadyPending && (
                              <span className="text-xs text-green-600 dark:text-green-400">✓</span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Saved Contributors Quick Add Section */}
              {savedContributors.length > 0 && (
                <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {t('저장된 기여자', 'Saved Contributors')}
                    </h3>
                    <span className="text-sm text-gray-500">({savedContributors.length})</span>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {t('클릭하여 선택하고 아래에서 역할/악기를 지정하세요', 'Click to select and assign roles/instruments below')}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                    {savedContributors
                      .sort((a, b) => b.usageCount - a.usageCount)
                      .map(saved => {
                        const alreadyPending = pendingContributors.some(p => p.savedId === saved.id);
                        return (
                          <button
                            key={saved.id}
                            onClick={() => !alreadyPending && addToPending(saved)}
                            disabled={alreadyPending}
                            className={`p-3 rounded-lg border transition-all text-left ${
                              alreadyPending
                                ? 'bg-gray-100 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 opacity-50 cursor-not-allowed'
                                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-md cursor-pointer'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="font-medium text-gray-900 dark:text-white text-sm">
                                  {saved.name}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                                  ({saved.usageCount} {t('회', 'uses')})
                                </span>
                              </div>
                              {alreadyPending && (
                                <span className="text-xs text-green-600 dark:text-green-400">✓</span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Pending Contributors - Selected for Addition */}
              {pendingContributors.length > 0 && (
                <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {t('선택된 기여자', 'Selected Contributors')} ({pendingContributors.length})
                      </h3>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {t('역할과 악기를 선택한 후 Save를 눌러주세요', 'Select roles & instruments, then click Save')}
                    </p>
                  </div>

                  <div className="space-y-3">
                    {pendingContributors.map(pending => (
                      <PendingContributorCard
                        key={pending.savedId}
                        {...pending}
                        onUpdate={(updates) => updatePending(pending.savedId, updates)}
                        onRemove={() => removeFromPending(pending.savedId)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Contributors List */}
              {Object.keys(groupedContributors).length > 0 ? (
                <div className="space-y-6">
                  {Object.entries(groupedContributors).map(([category, categoryContributors]) => {
                    const CategoryIcon = getCategoryIcon(category);
                    return (
                      <div key={category}>
                        <div className="flex items-center gap-2 mb-3">
                          <CategoryIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                            {(() => {
                              // Handle special "Uncategorized" category
                              if (category === 'Uncategorized') {
                                return t('미분류', 'Uncategorized');
                              }
                              const categoryTranslation = roleTranslations.categoryTranslations[category];
                              if (categoryTranslation && language === 'ko') {
                                return categoryTranslation.ko;
                              }
                              return category;
                            })()}
                          </h3>
                          <span className="text-sm text-gray-500">({categoryContributors.length})</span>
                        </div>

                        <div className="grid gap-4">
                          {categoryContributors.map(contributor => {
                            // Extract platform IDs
                            const spotifyId = contributor.identifiers.find(i => i.type === 'SPOTIFY' || i.type === 'spotify')?.value;
                            const appleId = contributor.identifiers.find(i => i.type === 'APPLE_MUSIC' || i.type === 'apple')?.value;

                            // Parse Spotify ID from URI
                            const spotifyArtistId = spotifyId?.replace('spotify:artist:', '');

                            return (
                            <div
                              key={contributor.id}
                              className="relative overflow-hidden bg-gradient-to-br from-slate-800/90 via-slate-900/90 to-slate-800/90 backdrop-blur-xl rounded-xl border border-slate-700 hover:border-purple-500/50 transition-all duration-300 group"
                            >
                              {/* Shine effect */}
                              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                              </div>

                              <div className="relative p-5">
                                <div className="flex items-start justify-between mb-4">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-3">
                                      <h4 className="text-lg font-semibold text-white">
                                        {contributor.name}
                                      </h4>
                                      {contributor.isNewArtist && (
                                        <span className="px-2.5 py-1 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 text-green-400 text-xs font-medium rounded-full">
                                          ✨ {t('신규', 'New')}
                                        </span>
                                      )}
                                      {contributor.roles.length === 0 && contributor.instruments.length === 0 && (
                                        <span className="px-2.5 py-1 bg-gradient-to-r from-orange-500/20 to-yellow-500/20 border border-orange-500/30 text-orange-400 text-xs font-medium rounded-full">
                                          ⚠️ {t('역할 미지정', 'No Role Assigned')}
                                        </span>
                                      )}
                                    </div>

                                    {/* Roles */}
                                    {contributor.roles.length > 0 && (
                                      <div className="flex flex-wrap gap-2 mb-3">
                                        {contributor.roles.map(roleId => (
                                          <span
                                            key={roleId}
                                            className="px-3 py-1.5 bg-gradient-to-r from-purple-500/15 to-pink-500/15 border border-purple-500/30 text-purple-300 text-xs font-medium rounded-lg hover:scale-105 transition-transform duration-200"
                                          >
                                            <User className="w-3 h-3 inline mr-1" />
                                            {getRoleName(roleId)}
                                          </span>
                                        ))}
                                      </div>
                                    )}

                                    {/* Instruments */}
                                    {contributor.instruments.length > 0 && (
                                      <div className="flex flex-wrap gap-2 mb-3">
                                        {contributor.instruments.map(instrumentId => (
                                          <span
                                            key={instrumentId}
                                            className="px-3 py-1.5 bg-gradient-to-r from-blue-500/15 to-cyan-500/15 border border-blue-500/30 text-blue-300 text-xs font-medium rounded-lg hover:scale-105 transition-transform duration-200"
                                          >
                                            <Music2 className="w-3 h-3 inline mr-1" />
                                            {getInstrumentName(instrumentId)}
                                          </span>
                                        ))}
                                      </div>
                                    )}

                                    {/* Platform IDs - Vertical stack with full IDs */}
                                    {contributor.identifiers.length > 0 && (
                                      <div className="flex flex-col gap-2">
                                        {spotifyId && (
                                          <a
                                            href={`https://open.spotify.com/artist/${spotifyArtistId}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group/spotify flex items-start gap-3 px-3 py-2.5 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-lg hover:from-green-500/20 hover:to-emerald-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200"
                                          >
                                            <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mt-0.5">
                                              <span className="text-white text-xs font-bold">S</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <div className="text-xs text-green-400 font-semibold mb-0.5">Spotify</div>
                                              <div className="text-xs text-gray-300 font-mono break-all">{spotifyArtistId}</div>
                                            </div>
                                            <ExternalLink className="flex-shrink-0 w-4 h-4 text-green-400 opacity-0 group-hover/spotify:opacity-100 transition-opacity mt-1" />
                                          </a>
                                        )}
                                        {appleId && (
                                          <a
                                            href={`https://music.apple.com/artist/${appleId}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group/apple flex items-start gap-3 px-3 py-2.5 bg-gradient-to-r from-pink-500/10 to-red-500/10 border border-pink-500/30 rounded-lg hover:from-pink-500/20 hover:to-red-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200"
                                          >
                                            <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-pink-500 to-red-500 rounded-full flex items-center justify-center mt-0.5">
                                              <span className="text-white text-xs font-bold">A</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <div className="text-xs text-pink-400 font-semibold mb-0.5">Apple Music</div>
                                              <div className="text-xs text-gray-300 font-mono break-all">{appleId}</div>
                                            </div>
                                            <ExternalLink className="flex-shrink-0 w-4 h-4 text-pink-400 opacity-0 group-hover/apple:opacity-100 transition-opacity mt-1" />
                                          </a>
                                        )}
                                      </div>
                                    )}
                                  </div>

                                  {/* Actions - Glassmorphic buttons */}
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => setEditingContributor(contributor)}
                                      className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/50 rounded-lg backdrop-blur-sm transition-all duration-200 hover:scale-110"
                                      title={t('수정', 'Edit')}
                                    >
                                      <Edit3 className="w-4 h-4 text-purple-400" />
                                    </button>
                                    <button
                                      onClick={() => removeContributor(contributor.id)}
                                      className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-red-500/50 rounded-lg backdrop-blur-sm transition-all duration-200 hover:scale-110"
                                      title={t('삭제', 'Delete')}
                                    >
                                      <Trash2 className="w-4 h-4 text-red-400" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">
                    {t('아직 기여자가 없습니다', 'No contributors yet')}
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                    {t('위의 버튼을 클릭하여 기여자를 추가하세요', 'Click the button above to add contributors')}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!editingContributor && !showAddForm && (
          <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-white dark:bg-gray-800 flex-shrink-0">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {t(
                  `총 ${contributors.length}명의 기여자 | ${contributorRolesData.roles.length}개 역할 | ${instrumentsData.instruments.length}개 악기 사용 가능`,
                  `Total ${contributors.length} contributors | ${contributorRolesData.roles.length} roles | ${instrumentsData.instruments.length} instruments available`
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  {t('취소', 'Cancel')}
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium"
                >
                  {t('저장', 'Save')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
