import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, Clock, CheckCircle, XCircle,
  Music, Calendar, Eye, Edit, Trash2, RefreshCw, Info,
  Grid, List, X, Filter
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslationFixed';
import { format } from 'date-fns';
import { submissionService } from '@/services/submission.service';
import toast from 'react-hot-toast';

interface Submission {
  id: string;
  albumTitle: string;
  artistName: string;
  tracks: any[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  releaseDate: string;
  albumGenre?: string[];
  adminNotes?: string;
}

const Submissions = () => {
  const navigate = useNavigate();
  const { t: useT, language } = useTranslation();

  // Simple translation function for direct text
  const t = (ko: string, en: string, ja?: string) => {
    switch (language) {
      case 'ko': return ko;
      case 'en': return en;
      case 'ja': return ja || en;
      default: return en;
    }
  };

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const data = await submissionService.getUserSubmissions();
      // Ensure data is an array
      if (Array.isArray(data)) {
        setSubmissions(data);
      } else if (data && Array.isArray(data.submissions)) {
        // Handle case where API returns {submissions: [...]}
        setSubmissions(data.submissions);
      } else if (data && Array.isArray(data.data)) {
        // Handle case where API returns {data: [...]}
        setSubmissions(data.data);
      } else {
        console.error('Unexpected data format:', data);
        setSubmissions([]);
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast.error(t('제출 내역을 불러오는데 실패했습니다', 'Failed to fetch submissions', '提出履歴の読み込みに失敗しました'));
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/release-submission-modern?edit=${id}`);
  };

  const handleDelete = async () => {
    if (!deletingId) return;

    try {
      // TODO: Implement delete API call
      // await submissionService.deleteSubmission(deletingId);
      toast.success(t('제출이 삭제되었습니다', 'Submission deleted successfully', '提出が削除されました'));
      setSubmissions(submissions.filter(s => s.id !== deletingId));
      setShowDeleteModal(false);
      setDeletingId(null);
    } catch (error) {
      toast.error(t('삭제 중 오류가 발생했습니다', 'Error deleting submission', '削除中にエラーが発生しました'));
    }
  };

  const handleResubmit = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Navigate to submission form with resubmit flag
    navigate(`/release-submission-modern?resubmit=${id}`);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />;
      case 'REJECTED':
        return <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />;
      case 'PENDING':
      default:
        return <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return t('승인완료', 'Approved', '承認済み');
      case 'REJECTED':
        return t('반려됨', 'Rejected', '却下');
      case 'PENDING':
      default:
        return t('검토중', 'Pending', '審査中');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30';
      case 'REJECTED':
        return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30';
      case 'PENDING':
      default:
        return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/30';
    }
  };

  const filteredSubmissions = Array.isArray(submissions)
    ? submissions.filter(submission => {
      const matchesSearch = submission.albumTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             submission.artistName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || submission.status === statusFilter.toUpperCase();
      return matchesSearch && matchesStatus;
    })
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50/50 via-white to-pink-50/50 dark:from-gray-900 dark:via-purple-900/10 dark:to-gray-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="glass-premium rounded-3xl p-6 md:p-8 animate-fade-in relative overflow-hidden group">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/8 via-pink-500/8 to-blue-500/8 opacity-60" />

          {/* Floating particles */}
          <div className="absolute top-4 right-4 opacity-15">
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
            <div className="w-1 h-1 bg-pink-400 rounded-full animate-bounce ml-6 -mt-1" style={{ animationDelay: '0.3s' }} />
            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce ml-3 -mt-2" style={{ animationDelay: '0.6s' }} />
          </div>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold gradient-text mb-2">
                {t('내 제출 내역', 'My Submissions', '提出履歴')}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">{t('제출한 릴리즈를 확인하고 관리하세요', 'View and manage your submitted releases', '提出したリリースを確認・管理します')}</p>
            </div>
            <button
              onClick={() => navigate('/release-submission-modern')}
              className="glass-btn-primary text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-6 py-3 rounded-xl font-medium flex items-center gap-2 hover:scale-105 active:scale-95 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5" />
              {t('새 릴리즈 등록', 'New Release', '新規リリース登録')}
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-enhanced rounded-2xl p-6 hover-glass-lift animate-fade-in group relative overflow-hidden" style={{ animationDelay: '0ms' }}>
            {/* Shimmer effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 transform translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
            </div>

            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 shadow-lg group-hover:scale-110 group-hover:shadow-xl transition-all duration-300">
                <Music className="w-6 h-6 text-white" />
              </div>
              <span className="text-3xl font-bold text-gray-900 dark:text-white group-hover:scale-110 transition-transform duration-300">{submissions.length}</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-300 relative z-10">
              {t('전체 제출', 'Total Submissions', '総提出数')}
            </h3>
          </div>

          <div className="glass-enhanced rounded-2xl p-6 hover-glass-lift animate-fade-in group relative overflow-hidden" style={{ animationDelay: '100ms' }}>
            {/* Shimmer effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 transform translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
            </div>

            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className="p-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg group-hover:scale-110 group-hover:shadow-xl transition-all duration-300">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <span className="text-3xl font-bold text-gray-900 dark:text-white group-hover:scale-110 transition-transform duration-300">
                {submissions.filter(s => s.status === 'APPROVED').length}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors duration-300 relative z-10">
              {t('승인됨', 'Approved', '承認済み')}
            </h3>
          </div>

          <div className="glass-enhanced rounded-2xl p-6 hover-glass-lift animate-fade-in group relative overflow-hidden" style={{ animationDelay: '200ms' }}>
            {/* Shimmer effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 transform translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
            </div>

            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className="p-4 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 shadow-lg group-hover:scale-110 group-hover:shadow-xl transition-all duration-300">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <span className="text-3xl font-bold text-gray-900 dark:text-white group-hover:scale-110 transition-transform duration-300">
                {submissions.filter(s => s.status === 'PENDING').length}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors duration-300 relative z-10">
              {t('검토 중', 'Under Review', '審査中')}
            </h3>
          </div>

          <div className="glass-enhanced rounded-2xl p-6 hover-glass-lift animate-fade-in group relative overflow-hidden" style={{ animationDelay: '300ms' }}>
            {/* Shimmer effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 transform translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
            </div>

            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className="p-4 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 shadow-lg group-hover:scale-110 group-hover:shadow-xl transition-all duration-300">
                <XCircle className="w-6 h-6 text-white" />
              </div>
              <span className="text-3xl font-bold text-gray-900 dark:text-white group-hover:scale-110 transition-transform duration-300">
                {submissions.filter(s => s.status === 'REJECTED').length}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors duration-300 relative z-10">
              {t('반려됨', 'Rejected', '却下')}
            </h3>
          </div>
        </div>

        {/* Filters and Search - Modern Toolbar Layout */}
        <div className="glass-enhanced rounded-2xl p-6 animate-fade-in-delay hover:shadow-xl transition-all duration-300 relative overflow-hidden">
          {/* Gradient background accent */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-pink-500/5 to-blue-500/5 opacity-50" />

          <div className="relative z-10 space-y-4">
            {/* Primary Toolbar: Search | Status | View Toggle */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
              {/* Search Input - Takes most space */}
              <div className="flex-1 relative group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-purple-500 w-5 h-5 transition-colors duration-200" />
                <input
                  type="text"
                  placeholder={t('앨범명 또는 아티스트명으로 검색', 'Search by album or artist name', 'アルバム名またはアーティスト名で検索')}
                  className="w-full pl-12 pr-10 py-3.5 glass-form border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 hover:shadow-lg transition-all duration-300 text-gray-900 dark:text-white placeholder:text-gray-400"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                    aria-label={t('검색어 지우기', 'Clear search', '検索をクリア')}
                  >
                    <X className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                  </button>
                )}
              </div>

              {/* Right Controls Group */}
              <div className="flex items-center gap-3">
                {/* Status Filter Dropdown */}
                <div className="relative group min-w-[160px]">
                  <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-purple-500 w-4 h-4 transition-colors duration-200 pointer-events-none z-10" />
                  <select
                    className="w-full pl-11 pr-10 py-3.5 glass-form border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 hover:shadow-lg transition-all duration-300 appearance-none cursor-pointer text-gray-900 dark:text-white bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">{t('모든 상태', 'All Status', 'すべて')}</option>
                    <option value="pending">{t('검토 중', 'Pending', '審査中')}</option>
                    <option value="approved">{t('승인됨', 'Approved', '承認済み')}</option>
                    <option value="rejected">{t('반려됨', 'Rejected', '却下')}</option>
                  </select>
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none z-10">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {/* View Mode Toggle - Compact */}
                <div className="glass-form rounded-xl p-1 flex gap-1 border-0 bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2.5 rounded-lg transition-all duration-300 ${
                      viewMode === 'list'
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-700/50'
                    }`}
                    title={t('리스트 보기', 'List View', 'リスト表示')}
                    aria-label={t('리스트 보기', 'List View', 'リスト表示')}
                  >
                    <List className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2.5 rounded-lg transition-all duration-300 ${
                      viewMode === 'grid'
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-700/50'
                    }`}
                    title={t('그리드 보기', 'Grid View', 'グリッド表示')}
                    aria-label={t('그리드 보기', 'Grid View', 'グリッド表示')}
                  >
                    <Grid className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Secondary Toolbar: Active Filters + Result Count */}
            {(searchTerm || statusFilter !== 'all' || filteredSubmissions.length > 0) && (
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-200/50 dark:border-gray-700/50">
                {/* Active Filter Chips */}
                <div className="flex flex-wrap items-center gap-2">
                  {searchTerm && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm font-medium border border-purple-200 dark:border-purple-800 animate-fade-in">
                      <Search className="w-3.5 h-3.5" />
                      <span className="max-w-[120px] truncate">{searchTerm}</span>
                      <button
                        onClick={() => setSearchTerm('')}
                        className="ml-0.5 hover:bg-purple-200 dark:hover:bg-purple-800 rounded p-0.5 transition-colors"
                        aria-label={t('검색 필터 제거', 'Remove search filter', '検索フィルタを削除')}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {statusFilter !== 'all' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 text-sm font-medium border border-pink-200 dark:border-pink-800 animate-fade-in">
                      <Filter className="w-3.5 h-3.5" />
                      {getStatusText(statusFilter.toUpperCase())}
                      <button
                        onClick={() => setStatusFilter('all')}
                        className="ml-0.5 hover:bg-pink-200 dark:hover:bg-pink-800 rounded p-0.5 transition-colors"
                        aria-label={t('상태 필터 제거', 'Remove status filter', 'ステータスフィルタを削除')}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                </div>

                {/* Result Count + Clear Button */}
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {filteredSubmissions.length} {t('개 결과', 'results', '件の結果')}
                  </span>

                  {(searchTerm || statusFilter !== 'all') && (
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setStatusFilter('all');
                      }}
                      className="text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-200"
                    >
                      <X className="w-3.5 h-3.5" />
                      {t('초기화', 'Clear', 'クリア')}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Submissions List */}
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
          {loading ? (
            <div className="col-span-full glass-enhanced rounded-2xl p-12 text-center animate-fade-in">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">{t('불러오는 중...', 'Loading...', '読み込み中...')}</p>
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="col-span-full glass-enhanced rounded-2xl p-12 text-center animate-fade-in">
              <Music className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-6">{t('제출된 릴리즈가 없습니다', 'No submissions found', '提出されたリリースがありません')}</p>
              <button
                onClick={() => navigate('/release-submission-modern')}
                className="glass-btn-primary text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-6 py-3 rounded-xl font-medium flex items-center gap-2 hover:scale-105 active:scale-95 transition-all duration-300 shadow-lg hover:shadow-xl mx-auto"
              >
                <Plus className="w-5 h-5" />
                {t('첫 번째 릴리즈 등록하기', 'Create your first release', '最初のリリースを登録')}
              </button>
            </div>
          ) : (
            filteredSubmissions.map((submission) => (
              <div
                key={submission.id}
                className={`glass-enhanced rounded-2xl hover-glass-lift transition-all duration-300 overflow-hidden group animate-fade-in ${
                  viewMode === 'list' ? 'p-6' : 'flex flex-col'
                }`}
                style={{ animationDelay: `${filteredSubmissions.indexOf(submission) * 100}ms` }}
              >
                {viewMode === 'grid' && (
                  <div className="aspect-square bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Music className="w-16 h-16 text-white opacity-50" />
                  </div>
                )}

                <div className={viewMode === 'grid' ? 'p-6 flex-1 flex flex-col' : ''}>
                  <div className={viewMode === 'list' ? 'flex items-start justify-between' : ''}>
                    <div className={viewMode === 'list' ? 'flex-1' : 'flex-1'}>
                      <div className={viewMode === 'list' ? 'flex items-start gap-4' : ''}>
                        {viewMode === 'list' && (
                          <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                            <Music className="w-7 h-7 text-white" />
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                            {submission.albumTitle}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400 mb-3">{submission.artistName}</p>

                          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <Music className="w-4 h-4" />
                              {submission.tracks?.length || 0} {t('트랙', 'tracks', 'トラック')}
                            </span>
                            {submission.albumGenre?.length > 0 && (
                              <span className="flex items-center gap-1">
                                <span className="text-purple-600 dark:text-purple-400">●</span>
                                {submission.albumGenre.join(', ')}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {format(new Date(submission.releaseDate), 'yyyy-MM-dd')}
                            </span>
                          </div>

                          {/* Status Badge */}
                          <div className="mt-3">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(submission.status)}`}>
                              {getStatusIcon(submission.status)}
                              {getStatusText(submission.status)}
                            </span>
                          </div>

                          {/* Admin Notes for Rejected */}
                          {submission.status === 'REJECTED' && submission.adminNotes && (
                            <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                              <div className="flex items-start gap-2">
                                <Info className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5" />
                                <div>
                                  <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                                    {t('반려 사유', 'Rejection Reason', '却下理由')}
                                  </p>
                                  <p className="text-sm text-red-700 dark:text-red-300">
                                    {submission.adminNotes}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className={`${viewMode === 'list' ? 'ml-4' : 'mt-4'} flex items-center gap-2`}>
                      <button
                        onClick={() => navigate(`/submission/${submission.id}`)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors group"
                        title={t('상세보기', 'View Details', '詳細を見る')}
                      >
                        <Eye className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400" />
                      </button>

                      {submission.status === 'PENDING' && (
                        <button
                          onClick={(e) => handleEdit(submission.id, e)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors group"
                          title={t('수정', 'Edit', '編集')}
                        >
                          <Edit className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                        </button>
                      )}

                      {submission.status === 'REJECTED' && (
                        <button
                          onClick={(e) => handleResubmit(submission.id, e)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors group"
                          title={t('재제출', 'Resubmit', '再提出')}
                        >
                          <RefreshCw className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-green-600 dark:group-hover:text-green-400" />
                        </button>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingId(submission.id);
                          setShowDeleteModal(true);
                        }}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors group"
                        title={t('삭제', 'Delete', '削除')}
                      >
                        <Trash2 className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-red-600 dark:group-hover:text-red-400" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {t('제출 삭제', 'Delete Submission', '提出削除')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {t('이 제출을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
                'Are you sure you want to delete this submission? This action cannot be undone.',
                'この提出を削除してもよろしいですか？この操作は元に戻せません。')}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingId(null);
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {t('취소', 'Cancel', 'キャンセル')}
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                {t('삭제', 'Delete', '削除')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Submissions;
