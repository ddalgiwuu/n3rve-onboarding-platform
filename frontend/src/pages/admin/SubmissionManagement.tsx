import React, { useState, useEffect, useMemo } from 'react';
import {
  Search, Eye, Check, X, Download, ChevronLeft, ChevronRight,
  FileSpreadsheet, Calendar, Clock, CheckSquare, XSquare,
  Music, FileText, Info, History, TrendingUp,
  AlertCircle, Package, Loader2
} from 'lucide-react';
import { useLanguageStore } from '@/store/language.store';
import useSafeStore from '@/hooks/useSafeStore';
import { CheckCircle } from 'lucide-react';
import { cn } from '@/utils/cn';
import { exportSubmissionsToExcel } from '@/utils/excelExport';
import { submissionService } from '@/services/submission.service';
import SubmissionDetailView from '@/components/admin/SubmissionDetailView';
import toast from 'react-hot-toast';

// Stats Card Component
const StatsCard: React.FC<{
  title: string
  value: string | number
  icon: React.ReactNode
  trend?: number
  color: string
}> = ({ title, value, icon, trend, color }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
        {trend !== undefined && (
          <div className="flex items-center mt-2">
            <TrendingUp className={cn(
              'w-4 h-4 mr-1',
              trend >= 0 ? 'text-green-500' : 'text-red-500 rotate-180'
            )} />
            <span className={cn(
              'text-sm font-medium',
              trend >= 0 ? 'text-green-600' : 'text-red-600'
            )}>
              {Math.abs(trend)}%
            </span>
          </div>
        )}
      </div>
      <div className={cn('p-3 rounded-full', color)}>
        {icon}
      </div>
    </div>
  </div>
);

// Tab Component
const Tab: React.FC<{
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={cn(
      'flex items-center gap-2 px-4 py-2 font-medium rounded-lg transition-colors',
      active
        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
    )}
  >
    {icon}
    {label}
  </button>
);

const SubmissionManagement: React.FC = () => {
  const language = useSafeStore(useLanguageStore, (state) => state.language);
  // Note: t function is not available from useLanguageStore, need to create local t function
  const t = (ko: string, en: string) => language === 'ko' ? ko : en;
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSubmissions, setSelectedSubmissions] = useState<Set<string>>(new Set());
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [activeTab, setActiveTab] = useState<'details' | 'overview' | 'history'>('details');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });
  const itemsPerPage = 10;

  // Fetch submissions from API
  useEffect(() => {
    fetchSubmissions();
  }, [selectedStatus, searchQuery, dateRange, currentPage]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const response = await submissionService.getAllSubmissions({
        status: selectedStatus,
        searchQuery,
        dateRange: dateRange.start && dateRange.end ? dateRange : undefined,
        page: currentPage,
        limit: itemsPerPage
      });

      // Add defensive programming
      if (!response || !Array.isArray(response.submissions)) {
        console.error('Invalid response format:', response);
        setSubmissions([]);
        setStats({
          total: 0,
          pending: 0,
          approved: 0,
          rejected: 0
        });
        return;
      }

      setSubmissions(response.submissions || []);

      // Update stats
      if (response.stats) {
        setStats(response.stats);
      }
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
      toast.error(t('제출 목록을 불러오는데 실패했습니다', 'Failed to load submission list'));
    } finally {
      setLoading(false);
    }
  };

  // Filter submissions
  const filteredSubmissions = useMemo(() => {
    return submissions.filter(submission => {
      const matchesStatus = selectedStatus === 'all' || submission.status === selectedStatus;
      const matchesSearch = !searchQuery ||
        submission.artistName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        submission.albumTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        submission.id.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesStatus && matchesSearch;
    });
  }, [submissions, selectedStatus, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredSubmissions.length / itemsPerPage);
  const paginatedSubmissions = filteredSubmissions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handle status update
  const handleStatusUpdate = async (submissionId: string, newStatus: 'approved' | 'rejected') => {
    try {
      await submissionService.updateSubmissionStatus(submissionId, newStatus, adminNotes);
      toast.success(t('상태가 업데이트되었습니다', 'Status updated successfully'));

      // Refresh submissions
      await fetchSubmissions();

      // Reset
      setAdminNotes('');
      setShowDetailModal(false);
      setSelectedSubmission(null);
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error(t('상태 업데이트에 실패했습니다', 'Failed to update status'));
    }
  };

  // Handle bulk actions
  const handleBulkAction = async (action: 'approve' | 'reject') => {
    if (selectedSubmissions.size === 0) {
      toast.error(t('선택된 제출이 없습니다', 'No submissions selected'));
      return;
    }

    try {
      await submissionService.bulkUpdateStatus(
        Array.from(selectedSubmissions),
        action === 'approve' ? 'approved' : 'rejected',
        adminNotes
      );

      toast.success(
        t(
          `${selectedSubmissions.size}개의 제출이 ${action === 'approve' ? '승인' : '거절'}되었습니다`,
          `${selectedSubmissions.size} submissions ${action === 'approve' ? 'approved' : 'rejected'}`
        )
      );

      // Reset and refresh
      setSelectedSubmissions(new Set());
      await fetchSubmissions();
    } catch (error) {
      console.error('Failed to perform bulk action:', error);
      toast.error(t('일괄 작업에 실패했습니다', 'Failed to perform bulk action'));
    }
  };

  // Export functions
  const handleExportToExcel = async () => {
    try {
      await submissionService.exportSubmissions({
        status: selectedStatus,
        searchQuery,
        dateRange: dateRange.start && dateRange.end ? dateRange : undefined
      });
      toast.success(t('Excel 파일이 다운로드되었습니다', 'Excel file downloaded'));
    } catch (error) {
      console.error('Failed to export:', error);
      toast.error(t('Excel 내보내기에 실패했습니다', 'Failed to export Excel'));
    }
  };

  const handleExportSelected = async () => {
    if (selectedSubmissions.size === 0) {
      toast.error(t('선택된 제출이 없습니다', 'No submissions selected'));
      return;
    }

    const selected = submissions.filter(s => selectedSubmissions.has(s.id));
    try {
      await exportSubmissionsToExcel({ submissions: selected });
      toast.success(t('선택된 제출이 내보내기되었습니다', 'Selected submissions exported'));
    } catch (error) {
      console.error('Export error:', error);
      toast.error(t('내보내기 중 오류가 발생했습니다', 'Error during export'));
    }
  };

  const handleSelectAll = () => {
    if (selectedSubmissions.size === paginatedSubmissions.length) {
      setSelectedSubmissions(new Set());
    } else {
      setSelectedSubmissions(new Set(paginatedSubmissions.map(s => s.id)));
    }
  };

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedSubmissions);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedSubmissions(newSelection);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t('제출 관리', 'Submission Management')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('아티스트 제출을 검토하고 관리합니다', 'Review and manage artist submissions')}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExportToExcel}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <FileSpreadsheet className="w-5 h-5" />
            {t('Excel 내보내기', 'Export Excel')}
          </button>
          <button
            onClick={handleExportSelected}
            disabled={selectedSubmissions.size === 0}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Download className="w-5 h-5" />
            {t('선택 내보내기', 'Export Selected')} ({selectedSubmissions.size})
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatsCard
          title={t('전체 제출', 'Total Submissions')}
          value={stats.total}
          icon={<FileText className="w-6 h-6 text-white" />}
          color="bg-blue-500"
        />
        <StatsCard
          title={t('검토 대기중', 'Pending Review')}
          value={stats.pending}
          icon={<Clock className="w-6 h-6 text-white" />}
          color="bg-yellow-500"
        />
        <StatsCard
          title={t('승인됨', 'Approved')}
          value={stats.approved}
          icon={<CheckSquare className="w-6 h-6 text-white" />}
          color="bg-green-500"
        />
        <StatsCard
          title={t('거절됨', 'Rejected')}
          value={stats.rejected}
          icon={<XSquare className="w-6 h-6 text-white" />}
          color="bg-red-500"
        />
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Search */}
          <div className="flex-1 min-w-[300px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('아티스트, 앨범, ID로 검색...', 'Search by artist, album, ID...')}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedStatus('all')}
              className={cn(
                'px-4 py-2 rounded-lg font-medium transition-colors',
                selectedStatus === 'all'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              )}
            >
              {t('전체', 'All')}
            </button>
            <button
              onClick={() => setSelectedStatus('pending')}
              className={cn(
                'px-4 py-2 rounded-lg font-medium transition-colors',
                selectedStatus === 'pending'
                  ? 'bg-yellow-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              )}
            >
              {t('대기중', 'Pending')}
            </button>
            <button
              onClick={() => setSelectedStatus('approved')}
              className={cn(
                'px-4 py-2 rounded-lg font-medium transition-colors',
                selectedStatus === 'approved'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              )}
            >
              {t('승인됨', 'Approved')}
            </button>
            <button
              onClick={() => setSelectedStatus('rejected')}
              className={cn(
                'px-4 py-2 rounded-lg font-medium transition-colors',
                selectedStatus === 'rejected'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              )}
            >
              {t('거절됨', 'Rejected')}
            </button>
          </div>

          {/* Date Range */}
          <div className="flex gap-2 items-center">
            <Calendar className="w-5 h-5 text-gray-400" />
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
            />
            <span className="text-gray-500">-</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedSubmissions.size > 0 && (
          <div className="mt-4 flex items-center gap-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
              {t(`${selectedSubmissions.size}개 선택됨`, `${selectedSubmissions.size} selected`)}
            </span>
            <button
              onClick={() => handleBulkAction('approve')}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Check className="w-4 h-4" />
              {t('일괄 승인', 'Bulk Approve')}
            </button>
            <button
              onClick={() => handleBulkAction('reject')}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <X className="w-4 h-4" />
              {t('일괄 거절', 'Bulk Reject')}
            </button>
            <input
              type="text"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder={t('관리자 노트 (선택사항)', 'Admin notes (optional)')}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            />
          </div>
        )}
      </div>

      {/* Submissions Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedSubmissions.size === paginatedSubmissions.length && paginatedSubmissions.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('ID', 'ID')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('아티스트', 'Artist')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('앨범', 'Album')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('제출일', 'Submit Date')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('상태', 'Status')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('파일', 'Files')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('작업', 'Actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {paginatedSubmissions.map((submission) => (
                    <tr key={submission.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedSubmissions.has(submission.id)}
                          onChange={() => toggleSelection(submission.id)}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {submission.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {submission.artistName || '-'}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {submission.labelName || '-'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {submission.albumTitle || '-'}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {submission.tracks?.length || 0} {t('트랙', 'tracks')}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(submission.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={cn(
                          'px-2 inline-flex text-xs leading-5 font-semibold rounded-full',
                          submission.status === 'pending' && 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
                          submission.status === 'approved' && 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
                          submission.status === 'rejected' && 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        )}>
                          {submission.status === 'pending' && t('대기중', 'Pending')}
                          {submission.status === 'approved' && t('승인됨', 'Approved')}
                          {submission.status === 'rejected' && t('거절됨', 'Rejected')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm">
                          {submission.files?.coverImageUrl && (
                            <span className="text-green-600 dark:text-green-400" title={t('커버 이미지', 'Cover Image')}>
                              <FileText className="w-4 h-4" />
                            </span>
                          )}
                          {submission.files?.audioFiles?.length > 0 && (
                            <span className="text-blue-600 dark:text-blue-400" title={t('오디오 파일', 'Audio Files')}>
                              <Music className="w-4 h-4" />
                            </span>
                          )}
                          {submission.files?.motionArtUrl && (
                            <span className="text-purple-600 dark:text-purple-400" title={t('모션 아트', 'Motion Art')}>
                              <Package className="w-4 h-4" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedSubmission(submission);
                              setShowDetailModal(true);
                            }}
                            className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          {submission.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleStatusUpdate(submission.id, 'approved')}
                                className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                              >
                                <Check className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleStatusUpdate(submission.id, 'rejected')}
                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    {t(
                      `${(currentPage - 1) * itemsPerPage + 1} - ${Math.min(currentPage * itemsPerPage, filteredSubmissions.length)} / ${filteredSubmissions.length}개`,
                      `Showing ${(currentPage - 1) * itemsPerPage + 1} - ${Math.min(currentPage * itemsPerPage, filteredSubmissions.length)} of ${filteredSubmissions.length}`
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={cn(
                          'px-3 py-1 rounded-lg',
                          currentPage === page
                            ? 'bg-purple-600 text-white'
                            : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                        )}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-6xl max-h-[90vh] overflow-y-auto p-6 w-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('제출 상세 정보', 'Submission Details')}
              </h2>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedSubmission(null);
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b border-gray-200 dark:border-gray-700">
              <Tab
                active={activeTab === 'details'}
                onClick={() => setActiveTab('details')}
                icon={<FileText className="w-4 h-4" />}
                label={t('상세 정보', 'Details')}
              />
              <Tab
                active={activeTab === 'overview'}
                onClick={() => setActiveTab('overview')}
                icon={<Info className="w-4 h-4" />}
                label={t('개요', 'Overview')}
              />
              <Tab
                active={activeTab === 'history'}
                onClick={() => setActiveTab('history')}
                icon={<History className="w-4 h-4" />}
                label={t('이력', 'History')}
              />
            </div>

            {/* Tab Content */}
            {activeTab === 'details' && (
              <SubmissionDetailView submission={selectedSubmission} />
            )}

            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h3 className="font-semibold mb-3">{t('제출 정보', 'Submission Info')}</h3>
                    <dl className="space-y-2">
                      <div>
                        <dt className="text-sm text-gray-500 dark:text-gray-400">ID</dt>
                        <dd className="font-mono text-sm">{selectedSubmission.id}</dd>
                      </div>
                      <div>
                        <dt className="text-sm text-gray-500 dark:text-gray-400">{t('제출일', 'Submit Date')}</dt>
                        <dd className="text-sm">{new Date(selectedSubmission.createdAt).toLocaleString()}</dd>
                      </div>
                      <div>
                        <dt className="text-sm text-gray-500 dark:text-gray-400">{t('마지막 수정', 'Last Modified')}</dt>
                        <dd className="text-sm">{new Date(selectedSubmission.updatedAt).toLocaleString()}</dd>
                      </div>
                    </dl>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h3 className="font-semibold mb-3">{t('검증 상태', 'Validation Status')}</h3>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        {t('메타데이터 완료', 'Metadata Complete')}
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        {selectedSubmission.files?.coverImageUrl ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-yellow-500" />
                        )}
                        {t('커버 아트', 'Cover Art')}
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        {selectedSubmission.files?.audioFiles?.length === selectedSubmission.tracks?.length ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-yellow-500" />
                        )}
                        {t('오디오 파일', 'Audio Files')}
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('이력 기능은 곧 추가됩니다', 'History feature coming soon')}
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            {selectedSubmission.status === 'pending' && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-4">
                  <input
                    type="text"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder={t('관리자 노트 (선택사항)', 'Admin notes (optional)')}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                  <button
                    onClick={() => handleStatusUpdate(selectedSubmission.id, 'approved')}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Check className="w-5 h-5" />
                    {t('승인', 'Approve')}
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(selectedSubmission.id, 'rejected')}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <X className="w-5 h-5" />
                    {t('거절', 'Reject')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Explicit default export for React 19 + Vite compatibility
export { SubmissionManagement as default };
