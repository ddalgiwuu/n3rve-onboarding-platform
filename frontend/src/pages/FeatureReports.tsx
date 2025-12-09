import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  Search,
  Filter,
  Download,
  Plus,
  TrendingUp,
  TrendingDown,
  Minus,
  Music,
  Calendar,
  Award,
  X
} from 'lucide-react';
import { clsx } from 'clsx';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from '@/hooks/useTranslationFixed';
import { useAuthStore } from '@/store/auth.store';
import { PlaylistSpreadsheetEditor } from '@/components/admin/PlaylistSpreadsheetEditor';

interface FeatureReport {
  id: string;
  upc: string;
  digitalProduct: {
    title: string;
    artistName: string;
    format: string;
    releaseDate: string;
  };
  autoPlaylists: PlaylistPlacement[];
  adminPlaylists: AdminPlaylistPlacement[];
  reportStatus: 'NEW' | 'UPDATED' | 'STABLE';
  lastUpdated: string;
  genres: string[];
  moods: string[];
}

interface PlaylistPlacement {
  playlistName: string;
  platform: string;
  position: number;
  followers?: number;
  trend: 'NEW' | 'UP' | 'DOWN' | 'STABLE';
  entryDate: string;
}

interface AdminPlaylistPlacement {
  id: string;
  playlistName: string;
  platform: string;
  position?: number;
  curatorName?: string;
  followers?: number;
  addedBy: string;
  addedAt: string;
  notes?: string;
}

export default function FeatureReports() {
  const { t, language } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'ADMIN';
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'NEW' | 'UPDATED' | 'STABLE'>('all');
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [editingReport, setEditingReport] = useState<FeatureReport | null>(null);

  // Simple translation helper
  const translate = (ko: string, en: string, ja: string) => {
    if (language === 'ko') return ko;
    if (language === 'ja') return ja;
    return en;
  };

  // Fetch reports from API
  const { data: reports = [], isLoading, error } = useQuery({
    queryKey: ['feature-reports'],
    queryFn: async () => {
      try {
        const response = await fetch('http://localhost:3001/api/feature-reports', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        if (!response.ok) {
          if (response.status === 401) {
            console.log('Not authenticated - showing empty state');
            return [];
          }
          throw new Error('Failed to fetch reports');
        }
        return response.json();
      } catch (err) {
        console.error('Error fetching reports:', err);
        return [];
      }
    },
    retry: false,
    refetchOnWindowFocus: false
  });

  // Filter reports
  const filteredReports = useMemo(() => {
    let filtered = reports;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.reportStatus === statusFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r =>
        r.digitalProduct.title.toLowerCase().includes(query) ||
        r.digitalProduct.artistName.toLowerCase().includes(query) ||
        r.upc.includes(query)
      );
    }

    return filtered;
  }, [reports, searchQuery, statusFilter]);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'UP':
        return <TrendingUp size={16} className="text-green-400" />;
      case 'DOWN':
        return <TrendingDown size={16} className="text-red-400" />;
      case 'NEW':
        return <Plus size={16} className="text-blue-400" />;
      default:
        return <Minus size={16} className="text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const config = {
      NEW: { color: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500/30' },
      UPDATED: { color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/30' },
      STABLE: { color: 'text-gray-400', bg: 'bg-gray-500/20', border: 'border-gray-500/30' }
    }[status];

    return (
      <div className={clsx(
        'px-2 py-1 rounded-lg text-xs font-medium border',
        config.color,
        config.bg,
        config.border
      )}>
        {status}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
              <BarChart3 size={32} className="text-purple-500 dark:text-purple-400" />
              {translate('피처 리포트', 'Feature Reports', 'フィーチャーレポート')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {translate('플레이리스트 등재 및 성과를 추적하세요', 'Track your releases\' playlist placements and performance', 'プレイリストの掲載とパフォーマンスを追跡')}
            </p>
          </div>

          <button className="
            flex items-center gap-2 px-4 py-2
            bg-gradient-to-r from-purple-500 to-pink-500
            rounded-xl font-medium text-white
            hover:shadow-lg hover:shadow-purple-500/50
            transition-all
          ">
            <Download size={18} />
            Export All
          </button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Total Reports</span>
              <Music size={20} className="text-purple-400" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{reports.length}</p>
            <p className="text-xs text-gray-500 mt-1">All releases tracked</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">New Placements</span>
              <TrendingUp size={20} className="text-green-400" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {reports.reduce((acc, r) => acc + r.autoPlaylists.filter(p => p.trend === 'NEW').length, 0)}
            </p>
            <p className="text-xs text-gray-500 mt-1">This week</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Total Playlists</span>
              <Award size={20} className="text-yellow-400" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {reports.reduce((acc, r) => acc + r.autoPlaylists.length + r.adminPlaylists.length, 0)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Across all platforms</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-6 bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Updated Today</span>
              <Calendar size={20} className="text-blue-400" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {reports.filter(r => r.reportStatus === 'NEW' || r.reportStatus === 'UPDATED').length}
            </p>
            <p className="text-xs text-gray-500 mt-1">Fresh data</p>
          </motion.div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by artist, release, or UPC..."
              className="
                w-full pl-12 pr-4 py-3
                bg-white/80 dark:bg-white/5 backdrop-blur-md
                border border-gray-300 dark:border-white/10 rounded-xl
                text-gray-900 dark:text-white
                placeholder-gray-500 dark:placeholder-gray-500
                outline-none focus:ring-2 focus:ring-purple-500/50
                transition-all
              "
            />
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray-400" />
            {['all', 'NEW', 'UPDATED', 'STABLE'].map((status) => (
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
        </div>

        {/* Reports List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mb-4" />
              <p className="text-gray-400">Loading reports...</p>
            </div>
          ) : filteredReports.length > 0 ? (
            filteredReports.map((report, index) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="
                  p-6 bg-white/80 dark:bg-white/5 backdrop-blur-xl
                  border border-gray-200 dark:border-white/10
                  rounded-2xl hover:border-purple-500 dark:hover:border-purple-500/30
                  hover:bg-white dark:hover:bg-white/10
                  transition-all cursor-pointer
                "
                onClick={() => setSelectedReport(report.id)}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                      {report.digitalProduct.title}
                    </h3>
                    <p className="text-gray-700 dark:text-gray-400">
                      {report.digitalProduct.artistName}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {report.digitalProduct.format} • UPC: {report.upc}
                    </p>
                  </div>

                  {getStatusBadge(report.reportStatus)}
                </div>

                {/* Playlist count summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="p-3 bg-purple-500/10 rounded-lg">
                    <p className="text-2xl font-bold text-purple-400">
                      {report.autoPlaylists.length}
                    </p>
                    <p className="text-xs text-gray-400">Auto-detected</p>
                  </div>

                  <div className="p-3 bg-blue-500/10 rounded-lg">
                    <p className="text-2xl font-bold text-blue-400">
                      {report.adminPlaylists.length}
                    </p>
                    <p className="text-xs text-gray-400">Admin-added</p>
                  </div>

                  <div className="p-3 bg-green-500/10 rounded-lg">
                    <p className="text-2xl font-bold text-green-400">
                      {report.autoPlaylists.filter(p => p.trend === 'NEW').length}
                    </p>
                    <p className="text-xs text-gray-400">New this week</p>
                  </div>

                  <div className="p-3 bg-orange-500/10 rounded-lg">
                    <p className="text-2xl font-bold text-orange-400">
                      {report.autoPlaylists.filter(p => p.trend === 'UP').length}
                    </p>
                    <p className="text-xs text-gray-400">Climbing</p>
                  </div>
                </div>

                {/* Top playlists preview */}
                {(report.autoPlaylists.length > 0 || report.adminPlaylists.length > 0) && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-400">Top Placements:</p>
                    <div className="space-y-1.5">
                      {[...report.autoPlaylists, ...report.adminPlaylists]
                        .slice(0, 3)
                        .map((playlist, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between p-2 bg-white/5 rounded-lg"
                          >
                            <div className="flex items-center gap-2 flex-1">
                              {'trend' in playlist && getTrendIcon(playlist.trend)}
                              <span className="text-sm text-white truncate">
                                {playlist.playlistName}
                              </span>
                            </div>
                            {playlist.position && (
                              <span className="text-sm font-medium text-purple-400">
                                #{playlist.position}
                              </span>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Last updated */}
                <p className="text-xs text-gray-500 mt-4">
                  Last updated: {new Date(report.lastUpdated).toLocaleDateString()}
                </p>

                {/* Admin: Edit playlists button */}
                {isAdmin && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingReport(report);
                      }}
                      className="
                        w-full flex items-center justify-center gap-2
                        px-4 py-2 rounded-lg
                        bg-purple-500/20 hover:bg-purple-500/30
                        border border-purple-500/30
                        text-purple-300 font-medium text-sm
                        transition-all
                      "
                    >
                      <Plus size={16} />
                      {translate('플레이리스트 추가', 'Add Playlists', 'プレイリストを追加')}
                    </button>
                  </div>
                )}
              </motion.div>
            ))
          ) : (
            <div className="text-center py-20 bg-white/80 dark:bg-white/5 backdrop-blur-md border border-gray-300 dark:border-white/10 rounded-2xl">
              <BarChart3 size={64} className="mx-auto mb-4 text-gray-400 dark:text-gray-600" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {translate('리포트가 없습니다', 'No Reports Yet', 'レポートがありません')}
              </h3>
              <p className="text-gray-700 dark:text-gray-400 mb-6">
                {searchQuery
                  ? translate('검색 결과가 없습니다', 'No reports match your search', '検索結果がありません')
                  : translate('발매 후 플레이리스트 성과 리포트가 여기에 표시됩니다', 'Feature reports will appear here once your releases go live', 'リリース後、プレイリストのパフォーマンスレポートがここに表示されます')}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Admin: Playlist Editor Modal */}
      {isAdmin && editingReport && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-white/10 flex items-center justify-between sticky top-0 bg-gray-900/95 backdrop-blur-xl z-10">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  {translate('플레이리스트 관리', 'Manage Playlists', 'プレイリスト管理')}
                </h2>
                <p className="text-sm text-gray-400 mt-1">
                  {editingReport.digitalProduct.title} - {editingReport.digitalProduct.artistName}
                </p>
              </div>
              <button
                onClick={() => setEditingReport(null)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <div className="p-6">
              <PlaylistSpreadsheetEditor
                reportId={editingReport.id}
                upc={editingReport.upc}
                playlists={editingReport.adminPlaylists.map(p => ({
                  id: p.id,
                  playlistName: p.playlistName,
                  platform: p.platform as any,
                  position: p.position,
                  playlistUrl: p.playlistUrl,
                  curatorName: p.curatorName,
                  followers: p.followers,
                  notes: p.notes,
                  addedBy: p.addedBy,
                  addedAt: p.addedAt
                }))}
                onSave={async (playlists) => {
                  // TODO: API call to save
                  console.log('Saving playlists:', playlists);
                  setEditingReport(null);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
