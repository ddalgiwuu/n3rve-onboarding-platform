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
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'REJECTED':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'PENDING':
        return <Clock className="w-5 h-5 text-yellow-400" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'REJECTED':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'PENDING':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const filteredSubmissions = submissions.filter(submission => {
    const matchesSearch = submission.albumTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         submission.artistName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || submission.status === statusFilter.toUpperCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="glass-effect rounded-2xl p-8 mb-8 animate-fade-in">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent mb-4">
                {t('submissions.myTitle', 'My Submissions')}
              </h1>
              <p className="text-gray-300">{t('submissions.myDescription', 'Track and manage your music submissions')}</p>
            </div>
            <button
              onClick={() => navigate('/onboarding')}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg font-medium transition-all hover-lift flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              {t('submissions.newSubmission', 'New Submission')}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="glass-effect rounded-xl p-6 animate-slide-in">
            <div className="flex items-center justify-between mb-4">
              <Music className="w-8 h-8 text-purple-400" />
              <span className="text-2xl font-bold text-white">{submissions.length}</span>
            </div>
            <p className="text-gray-400 text-sm">{t('submissions.totalSubmissions', 'Total Submissions')}</p>
          </div>
          
          <div className="glass-effect rounded-xl p-6 animate-slide-in" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between mb-4">
              <CheckCircle className="w-8 h-8 text-green-400" />
              <span className="text-2xl font-bold text-white">{submissions.filter(s => s.status === 'APPROVED').length}</span>
            </div>
            <p className="text-gray-400 text-sm">{t('submissions.approved', 'Approved')}</p>
          </div>
          
          <div className="glass-effect rounded-xl p-6 animate-slide-in" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center justify-between mb-4">
              <Clock className="w-8 h-8 text-yellow-400" />
              <span className="text-2xl font-bold text-white">{submissions.filter(s => s.status === 'PENDING').length}</span>
            </div>
            <p className="text-gray-400 text-sm">{t('submissions.inReview', 'In Review')}</p>
          </div>
          
          <div className="glass-effect rounded-xl p-6 animate-slide-in" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center justify-between mb-4">
              <AlertCircle className="w-8 h-8 text-gray-400" />
              <span className="text-2xl font-bold text-white">{submissions.filter(s => s.status === 'REJECTED').length}</span>
            </div>
            <p className="text-gray-400 text-sm">{t('submissions.rejected', 'Rejected')}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="glass-effect rounded-xl p-6 mb-8 animate-slide-in-delayed">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={t('submissions.searchPlaceholder', 'Search by album or artist...')}
                className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none text-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none text-white"
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
            <div className="glass-effect rounded-xl p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="glass-effect rounded-xl p-12 text-center">
              <Music className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-6">{t('submissions.noSubmissions', 'No submissions found')}</p>
              <button
                onClick={() => navigate('/onboarding')}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-all hover-lift"
              >
                {t('submissions.createFirst', 'Create Your First Submission')}
              </button>
            </div>
          ) : (
            filteredSubmissions.map((submission, index) => (
              <div
                key={submission.id}
                className="glass-effect rounded-xl p-6 hover:bg-gray-800/30 transition-all cursor-pointer hover-lift animate-slide-in"
                style={{ animationDelay: `${index * 0.05}s` }}
                onClick={() => navigate(`/submission/${submission.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                      <Music className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-1">{submission.albumTitle}</h3>
                      <p className="text-gray-300">{submission.artistName}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                        <span>{submission.tracks?.length || 0} {t('submissions.tracks', 'tracks')}</span>
                        <span>•</span>
                        <span>{submission.albumGenre?.join(', ') || 'N/A'}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(submission.releaseDate), 'MMM dd, yyyy')}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm border ${getStatusBadgeClass(submission.status)}`}>
                        {getStatusIcon(submission.status)}
                        {t(`submissions.${submission.status}`, submission.status)}
                      </span>
                      <p className="text-sm text-gray-400 mt-2">
                        {t('submissions.submitted', 'Submitted')} {format(new Date(submission.createdAt), 'MMM dd')}
                      </p>
                    </div>
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