import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Search, Clock, CheckCircle, XCircle, AlertCircle, 
  Music, Calendar, Eye, Edit, Trash2, RefreshCw, MoreVertical,
  Filter, Download, Upload, ChevronRight, Info
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
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
  const { t } = useTranslation();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null);
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
      toast.error(t('submissions.fetchError'));
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
      toast.success(t('submissions.deleteSuccess'));
      setSubmissions(submissions.filter(s => s.id !== deletingId));
      setShowDeleteModal(false);
      setDeletingId(null);
    } catch (error) {
      toast.error(t('submissions.deleteError'));
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
        return t('승인완료', 'Approved');
      case 'REJECTED':
        return t('반려됨', 'Rejected');
      case 'PENDING':
      default:
        return t('검토중', 'Pending');
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 md:p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {t('내 제출 내역', 'My Submissions')}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">{t('제출한 릴리즈를 확인하고 관리하세요', 'View and manage your submitted releases')}</p>
            </div>
            <button
              onClick={() => navigate('/release-submission-modern')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium shadow-sm"
            >
              <Plus className="w-5 h-5" />
              {t('새 릴리즈 등록', 'New Release')}
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <Music className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">{submissions.length}</span>
            </div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('전체 제출', 'Total Submissions')}
            </h3>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {submissions.filter(s => s.status === 'APPROVED').length}
              </span>
            </div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('승인됨', 'Approved')}
            </h3>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {submissions.filter(s => s.status === 'PENDING').length}
              </span>
            </div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('검토 중', 'Under Review')}
            </h3>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {submissions.filter(s => s.status === 'REJECTED').length}
              </span>
            </div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('반려됨', 'Rejected')}
            </h3>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 md:p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={t('앨범명 또는 아티스트명으로 검색', 'Search by album or artist name')}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <select
                className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">{t('모든 상태', 'All Status')}</option>
                <option value="pending">{t('검토 중', 'Pending')}</option>
                <option value="approved">{t('승인됨', 'Approved')}</option>
                <option value="rejected">{t('반려됨', 'Rejected')}</option>
              </select>
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {viewMode === 'grid' ? '📋' : '📱'}
              </button>
            </div>
          </div>
        </div>

        {/* Submissions List */}
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
          {loading ? (
            <div className="col-span-full bg-white dark:bg-gray-800 rounded-xl p-12 text-center shadow-sm">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">{t('불러오는 중...', 'Loading...')}</p>
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="col-span-full bg-white dark:bg-gray-800 rounded-xl p-12 text-center shadow-sm">
              <Music className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-6">{t('제출된 릴리즈가 없습니다', 'No submissions found')}</p>
              <button
                onClick={() => navigate('/release-submission-modern')}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium"
              >
                <Plus className="w-5 h-5" />
                {t('첫 번째 릴리즈 등록하기', 'Create your first release')}
              </button>
            </div>
          ) : (
            filteredSubmissions.map((submission) => (
              <div
                key={submission.id}
                className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group ${
                  viewMode === 'list' ? 'p-6' : 'flex flex-col'
                }`}
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
                              {submission.tracks?.length || 0} {t('트랙', 'tracks')}
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
                                    {t('반려 사유', 'Rejection Reason')}
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
                        title={t('상세보기', 'View Details')}
                      >
                        <Eye className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400" />
                      </button>
                      
                      {submission.status === 'PENDING' && (
                        <button
                          onClick={(e) => handleEdit(submission.id, e)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors group"
                          title={t('수정', 'Edit')}
                        >
                          <Edit className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                        </button>
                      )}
                      
                      {submission.status === 'REJECTED' && (
                        <button
                          onClick={(e) => handleResubmit(submission.id, e)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors group"
                          title={t('재제출', 'Resubmit')}
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
                        title={t('삭제', 'Delete')}
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
              {t('제출 삭제', 'Delete Submission')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {t('이 제출을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.', 
                'Are you sure you want to delete this submission? This action cannot be undone.')}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingId(null);
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {t('취소', 'Cancel')}
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                {t('삭제', 'Delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Submissions;