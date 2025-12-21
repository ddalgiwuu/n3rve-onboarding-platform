import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  Filter,
  Plus,
  Grid3x3,
  List,
  Download,
  UserPlus
} from 'lucide-react';
import { clsx } from 'clsx';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from '@/hooks/useTranslationFixed';
import ArtistManagementModal from '@/components/ArtistManagementModal';
import api from '@/lib/api';

interface SavedArtist {
  id: string;
  name: string;
  country?: string;
  bio?: string;
  status: 'DRAFT' | 'COMPLETE' | 'VERIFIED';
  completionScore: number;
  releaseCount: number;
  totalStreams?: number;
  artistAvatarUrl?: string;
  dspProfiles: Array<{ platform: string; verified: boolean }>;
  socialProfiles: Array<{ platform: string; followerCount?: number }>;
  lastReleaseDate?: string;
}

type ViewMode = 'bento' | 'grid' | 'list';

export default function ArtistRoster() {
  const { t, language } = useTranslation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'DRAFT' | 'COMPLETE' | 'VERIFIED'>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('bento');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingArtist, setEditingArtist] = useState<SavedArtist | null>(null);

  // Simple translation helper
  const translate = (ko: string, en: string, ja: string) => {
    if (language === 'ko') return ko;
    if (language === 'ja') return ja;
    return en;
  };

  // Fetch artists from API using api client (includes auth headers)
  const { data: artists = [], isLoading, error } = useQuery({
    queryKey: ['saved-artists'],
    queryFn: async () => {
      try {
        const response = await api.get('/saved-artists/artists');
        return response.data;
      } catch (err: any) {
        console.error('Error fetching artists:', err);
        if (err.response?.status === 401) {
          console.log('Not authenticated - showing empty state');
          return [];
        }
        return [];
      }
    },
    retry: false,
    refetchOnWindowFocus: false
  });

  // Filter artists
  const filteredArtists = useMemo(() => {
    let filtered = artists;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(a => a.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(a =>
        a.name.toLowerCase().includes(query) ||
        a.country?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [artists, searchQuery, statusFilter]);

  // Calculate card size based on artist importance
  const getCardSize = (artist: SavedArtist): 'large' | 'medium' | 'compact' => {
    if (artist.totalStreams && artist.totalStreams > 1000000) return 'large';
    if (artist.releaseCount > 5) return 'medium';
    return 'compact';
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'COMPLETE':
        return { color: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500/30', label: 'Complete' };
      case 'VERIFIED':
        return { color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/30', label: 'Verified' };
      default:
        return { color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30', label: 'Draft' };
    }
  };

  return (
    <div className="min-h-screen bg-transparent p-6">
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
              <Users size={32} className="text-purple-500 dark:text-purple-400" />
              {translate('아티스트 로스터', 'Artist Roster', 'アーティストロスター')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {translate('제출한 아티스트 프로필을 확인하고 DSP 연동을 관리하세요', 'Manage artist profiles and DSP connections', 'アーティストプロフィールとDSP連携を管理')}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl"
          >
            <p className="text-gray-400 text-sm mb-1">Total Artists</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{artists.length}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl"
          >
            <p className="text-gray-400 text-sm mb-1">Complete Profiles</p>
            <p className="text-3xl font-bold text-green-400">
              {artists.filter(a => a.status === 'COMPLETE' || a.status === 'VERIFIED').length}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl"
          >
            <p className="text-gray-400 text-sm mb-1">Draft Profiles</p>
            <p className="text-3xl font-bold text-yellow-400">
              {artists.filter(a => a.status === 'DRAFT').length}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-6 bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl"
          >
            <p className="text-gray-400 text-sm mb-1">Verified</p>
            <p className="text-3xl font-bold text-blue-400">
              {artists.filter(a => a.status === 'VERIFIED').length}
            </p>
          </motion.div>
        </div>

        {/* Search, Filters, View Toggle */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search artists..."
              className="
                w-full pl-12 pr-4 py-3
                bg-white/80 dark:bg-white/5 backdrop-blur-md
                border border-gray-300 dark:border-white/10 rounded-xl
                text-gray-900 dark:text-white placeholder-gray-500
                outline-none focus:ring-2 focus:ring-purple-500/50
                transition-all
              "
            />
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray-400" />
            {['all', 'COMPLETE', 'DRAFT', 'VERIFIED'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status as any)}
                className={clsx(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  statusFilter === status
                    ? 'bg-purple-500 text-white'
                    : 'bg-white/80 dark:bg-white/5 text-gray-700 dark:text-gray-400 hover:bg-white dark:hover:bg-white/10 border border-gray-200 dark:border-white/10'
                )}
              >
                {status === 'all' ? 'All' : status}
              </button>
            ))}
          </div>

          {/* View mode toggle */}
          <div className="flex items-center gap-2 p-1 bg-white/5 backdrop-blur-md border border-white/10 rounded-lg">
            {[
              { mode: 'bento' as ViewMode, icon: Grid3x3, label: 'Bento' },
              { mode: 'grid' as ViewMode, icon: Grid3x3, label: 'Grid' },
              { mode: 'list' as ViewMode, icon: List, label: 'List' }
            ].map(({ mode, icon: Icon, label }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={clsx(
                  'flex items-center gap-2 px-3 py-2 rounded text-sm font-medium transition-all',
                  viewMode === mode
                    ? 'bg-purple-500 text-white'
                    : 'text-gray-400 hover:text-white'
                )}
                title={label}
              >
                <Icon size={16} />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Artists Grid/List */}
        {isLoading ? (
          <div className="text-center py-20">
            <div className="inline-block w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mb-4" />
            <p className="text-gray-400">Loading artists...</p>
          </div>
        ) : filteredArtists.length > 0 ? (
          <div className={clsx(
            'grid gap-4',
            viewMode === 'bento' && 'grid-cols-1 md:grid-cols-3 lg:grid-cols-4 auto-rows-auto',
            viewMode === 'grid' && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
            viewMode === 'list' && 'grid-cols-1'
          )}>
            {filteredArtists.map((artist, index) => {
              const cardSize = viewMode === 'bento' ? getCardSize(artist) : 'medium';
              const statusConfig = getStatusConfig(artist.status);

              return (
                <motion.div
                  key={artist.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.02, y: -4 }}
                  className={clsx(
                    'relative overflow-hidden rounded-2xl cursor-pointer',
                    'bg-white/80 dark:bg-white/5 backdrop-blur-xl',
                    'border border-gray-200 dark:border-white/10',
                    'hover:border-purple-500 dark:hover:border-purple-500/30',
                    'hover:bg-white dark:hover:bg-white/10',
                    'transition-all group',
                    cardSize === 'large' && 'md:col-span-2 md:row-span-2',
                    cardSize === 'medium' && 'md:col-span-1 md:row-span-1',
                    cardSize === 'compact' && 'md:col-span-1 md:row-span-1'
                  )}
                >
                  {/* Background gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  {/* Content */}
                  <div className="relative p-6">
                    {/* Avatar */}
                    <div className="flex items-start gap-4 mb-4">
                      {artist.artistAvatarUrl ? (
                        <img
                          src={artist.artistAvatarUrl}
                          alt={artist.name}
                          className="w-16 h-16 rounded-full object-cover border-2 border-white/10"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl">
                          {artist.name[0]}
                        </div>
                      )}

                      {/* Status badge */}
                      <div className={clsx(
                        'px-2 py-1 rounded-lg text-xs font-medium border',
                        statusConfig.color,
                        statusConfig.bg,
                        statusConfig.border
                      )}>
                        {statusConfig.label}
                      </div>
                    </div>

                    {/* Artist info */}
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                      {artist.name}
                    </h3>

                    {artist.country && (
                      <p className="text-sm text-gray-700 dark:text-gray-400 mb-3">
                        {artist.country}
                      </p>
                    )}

                    {artist.bio && cardSize === 'large' && (
                      <p className="text-sm text-gray-400 line-clamp-3 mb-4">
                        {artist.bio}
                      </p>
                    )}

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <div className="p-3 bg-white/5 rounded-lg">
                        <p className="text-lg font-bold text-white">
                          {artist.releaseCount}
                        </p>
                        <p className="text-xs text-gray-400">Releases</p>
                      </div>

                      <div className="p-3 bg-white/5 rounded-lg">
                        <p className="text-lg font-bold text-purple-400">
                          {artist.completionScore}%
                        </p>
                        <p className="text-xs text-gray-400">Complete</p>
                      </div>

                      {cardSize === 'large' && artist.totalStreams && (
                        <>
                          <div className="p-3 bg-white/5 rounded-lg">
                            <p className="text-lg font-bold text-green-400">
                              {(artist.totalStreams / 1000000).toFixed(1)}M
                            </p>
                            <p className="text-xs text-gray-400">Streams</p>
                          </div>

                          <div className="p-3 bg-white/5 rounded-lg">
                            <p className="text-lg font-bold text-blue-400">
                              {artist.dspProfiles.filter(d => d.verified).length}
                            </p>
                            <p className="text-xs text-gray-400">Verified DSPs</p>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Open Details button */}
                    <div className="mt-4">
                      <button
                        onClick={() => navigate(`/artist-roster/${artist.id}`)}
                        className="
                          w-full flex items-center justify-center gap-2
                          px-4 py-2.5 rounded-lg
                          bg-white/10 hover:bg-white/20
                          border border-white/20 hover:border-white/30
                          text-white font-medium text-sm
                          transition-all
                        "
                      >
                        {translate('상세 보기', 'Open Details', '詳細を開く')}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-white/80 dark:bg-white/5 backdrop-blur-md border border-gray-300 dark:border-white/10 rounded-2xl">
            <Users size={64} className="mx-auto mb-4 text-gray-400 dark:text-gray-600" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {translate('아티스트가 없습니다', 'No Artists Yet', 'アーティストがありません')}
            </h3>
            <p className="text-gray-700 dark:text-gray-400 mb-6">
              {searchQuery
                ? translate('검색 결과가 없습니다', 'No artists match your search', '検索結果がありません')
                : translate('Release를 제출하면 아티스트가 자동으로 추가됩니다', 'Artists are automatically added when you submit releases', 'リリースを提出するとアーティストが自動的に追加されます')}
            </p>
          </div>
        )}
      </div>

      {/* Artist Detail Modal */}
      {editingArtist && (
        <ArtistManagementModal
          isOpen={editingArtist !== null}
          onClose={() => setEditingArtist(null)}
          artist={editingArtist}
          mode="edit"
        />
      )}
    </div>
  );
}
