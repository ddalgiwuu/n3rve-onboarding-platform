import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Clock, CheckCircle, XCircle, AlertCircle, Music, Calendar, Eye } from 'lucide-react';
import { useLanguageStore } from '@/store/language.store';
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
}

const Submissions = () => {
  const navigate = useNavigate();
  const { t } = useLanguageStore();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const data = await submissionService.getUserSubmissions();
      setSubmissions(data);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast.error(t('submissions.fetchError', 'Failed to load submissions'));
    } finally {
      setLoading(false);
    }
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
        return t('submissions.approved', 'Approved');
      case 'REJECTED':
        return t('submissions.rejected', 'Rejected');
      case 'PENDING':
      default:
        return t('submissions.pending', 'Pending');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30';
      case 'REJECTED':
        return 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30';
      case 'PENDING':
      default:
        return 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30';
    }
  };

  const filteredSubmissions = submissions.filter(submission => {
    const matchesSearch = submission.albumTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         submission.artistName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || submission.status === statusFilter.toUpperCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="glass-effect rounded-2xl p-8 animate-fade-in">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold gradient-text mb-2">
                {t('submissions.myTitle', 'My Submissions')}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">{t('submissions.myDescription', 'Track and manage your music submissions')}</p>
            </div>
            <button
              onClick={() => navigate('/onboarding')}
              className="btn-modern btn-primary flex items-center gap-2 hover-lift"
            >
              <Plus className="w-5 h-5" />
              {t('submissions.newSubmission', 'New Submission')}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card-glass p-6 hover-lift animate-fade-in">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg">
                <Music className="w-6 h-6 text-white" />
              </div>
              <span className="text-3xl font-bold text-gray-900 dark:text-white">{submissions.length}</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              {t('submissions.totalSubmissions', 'Total Submissions')}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('등록된 음원', 'Registered music')}
            </p>
          </div>
          
          <div className="card-glass p-6 hover-lift animate-fade-in" style={{ animationDelay: '100ms' }}>
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <span className="text-3xl font-bold text-gray-900 dark:text-white">{submissions.filter(s => s.status === 'APPROVED').length}</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              {t('submissions.approved', 'Approved')}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('승인 완료', 'Approved releases')}
            </p>
          </div>
          
          <div className="card-glass p-6 hover-lift animate-fade-in" style={{ animationDelay: '200ms' }}>
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 shadow-lg">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <span className="text-3xl font-bold text-gray-900 dark:text-white">{submissions.filter(s => s.status === 'PENDING').length}</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              {t('submissions.inReview', 'In Review')}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('검토 중', 'Under review')}
            </p>
          </div>
          
          <div className="card-glass p-6 hover-lift animate-fade-in" style={{ animationDelay: '300ms' }}>
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 shadow-lg">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
              <span className="text-3xl font-bold text-gray-900 dark:text-white">{submissions.filter(s => s.status === 'REJECTED').length}</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              {t('submissions.rejected', 'Rejected')}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('반려됨', 'Returned releases')}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="glass-effect rounded-2xl p-6 animate-fade-in-delay">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={t('submissions.searchPlaceholder', 'Search by album or artist...')}
                className="input-modern pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="input-modern"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">{t('submissions.allStatuses', 'All Statuses')}</option>
              <option value="pending">{t('submissions.pending', 'Pending')}</option>
              <option value="approved">{t('submissions.approved', 'Approved')}</option>
              <option value="rejected">{t('submissions.rejected', 'Rejected')}</option>
            </select>
          </div>
        </div>

        {/* Submissions List */}
        <div className="space-y-4">
          {loading ? (
            <div className="glass-effect rounded-2xl p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="glass-effect rounded-2xl p-12 text-center">
              <Music className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-6">{t('submissions.noSubmissions', 'No submissions found')}</p>
              <button
                onClick={() => navigate('/onboarding')}
                className="btn-modern btn-primary"
              >
                {t('submissions.createFirst', 'Create Your First Submission')}
              </button>
            </div>
          ) : (
            filteredSubmissions.map((submission, index) => (
              <div
                key={submission.id}
                className="glass-effect rounded-xl p-6 hover:shadow-lg transition-all duration-300 cursor-pointer animate-slide-in-left"
                style={{ animationDelay: `${index * 100}ms` }}
                onClick={() => navigate(`/submission/${submission.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                      <Music className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{submission.albumTitle}</h3>
                      <p className="text-gray-600 dark:text-gray-400">{submission.artistName}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                        <span>{submission.tracks?.length || 0} {t('submissions.tracks', 'tracks')}</span>
                        <span>•</span>
                        <span>{submission.albumGenre?.join(', ') || 'N/A'}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(submission.releaseDate), 'yyyy-MM-dd')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`badge-glass ${getStatusColor(submission.status)} px-3 py-1 flex items-center gap-2`}>
                      {getStatusIcon(submission.status)}
                      {getStatusText(submission.status)}
                    </span>
                    <Eye className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Submissions;