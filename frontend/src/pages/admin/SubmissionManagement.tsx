import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Play, Pause, CheckCircle, XCircle, MessageSquare, FileText, Music, Image, Clock, User, Calendar, Tag } from 'lucide-react';
import { useLanguageStore } from '@/store/language.store';
import { format } from 'date-fns';

interface Track {
  id: string;
  title: string;
  duration: string;
  hasAtmos: boolean;
  audioUrl?: string;
}

interface SubmissionDetail {
  id: string;
  artistName: string;
  albumName: string;
  status: 'pending' | 'reviewing' | 'approved' | 'rejected';
  submittedAt: string;
  genre: string;
  releaseDate: string;
  label: string;
  upc: string;
  coverArtUrl: string;
  tracks: Track[];
  marketingInfo: Record<string, any>;
  notes: string;
}

const SubmissionManagement = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguageStore();
  const [submission, setSubmission] = useState<SubmissionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [playingTrack, setPlayingTrack] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchSubmissionDetail();
  }, [id]);

  const fetchSubmissionDetail = async () => {
    try {
      setLoading(true);
      // Mock data for now
      const mockData: SubmissionDetail = {
        id: id || '1',
        artistName: 'Artist One',
        albumName: 'First Album',
        status: 'pending',
        submittedAt: new Date().toISOString(),
        genre: 'Pop',
        releaseDate: new Date(Date.now() + 30 * 86400000).toISOString(),
        label: 'N3RVE Records',
        upc: '123456789012',
        coverArtUrl: 'https://via.placeholder.com/300',
        tracks: [
          { id: '1', title: 'Track 1', duration: '3:24', hasAtmos: true },
          { id: '2', title: 'Track 2', duration: '4:12', hasAtmos: false },
          { id: '3', title: 'Track 3', duration: '3:45', hasAtmos: true },
        ],
        marketingInfo: {
          targetAudience: '18-34 years old',
          marketingBudget: '$50,000',
          promotionStrategy: 'Social media campaign'
        },
        notes: 'This is a promising submission with great production quality.'
      };
      setSubmission(mockData);
    } catch (error) {
      console.error('Error fetching submission:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      // API call to update status
      console.log('Updating status to:', newStatus);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const togglePlayTrack = (trackId: string) => {
    setPlayingTrack(playingTrack === trackId ? null : trackId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 p-6">
        <div className="text-center">
          <p className="text-gray-400">{t('submission.notFound', 'Submission not found')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="glass-effect rounded-2xl p-8 mb-8 animate-fade-in">
          <button
            onClick={() => navigate('/admin/submissions')}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            {t('submission.backToList', 'Back to Submissions')}
          </button>
          
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-6">
              <img
                src={submission.coverArtUrl}
                alt={submission.albumName}
                className="w-32 h-32 rounded-xl object-cover"
              />
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">{submission.albumName}</h1>
                <p className="text-xl text-gray-300 mb-4">{submission.artistName}</p>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span className="flex items-center gap-1">
                    <Music className="w-4 h-4" />
                    {submission.tracks.length} {t('submission.tracks', 'tracks')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Tag className="w-4 h-4" />
                    {submission.genre}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(submission.releaseDate), 'MMM dd, yyyy')}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-3">
              <button
                onClick={() => handleStatusUpdate('approved')}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-medium transition-all hover-lift flex items-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                {t('submission.approve', 'Approve')}
              </button>
              <button
                onClick={() => handleStatusUpdate('rejected')}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-all hover-lift flex items-center gap-2"
              >
                <XCircle className="w-5 h-5" />
                {t('submission.reject', 'Reject')}
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          {['overview', 'tracks', 'marketing', 'files'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === tab
                  ? 'bg-purple-600 text-white'
                  : 'glass-effect text-gray-300 hover:text-white'
              }`}
            >
              {t(`submission.tab.${tab}`, tab.charAt(0).toUpperCase() + tab.slice(1))}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="glass-effect rounded-xl p-8 animate-slide-in">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">{t('submission.details', 'Submission Details')}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">{t('submission.upc', 'UPC')}</p>
                    <p className="text-white">{submission.upc}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">{t('submission.label', 'Label')}</p>
                    <p className="text-white">{submission.label}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">{t('submission.submittedAt', 'Submitted')}</p>
                    <p className="text-white">{format(new Date(submission.submittedAt), 'MMM dd, yyyy HH:mm')}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">{t('submission.status', 'Status')}</p>
                    <p className="text-white capitalize">{submission.status}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">{t('submission.notes', 'Review Notes')}</h3>
                <textarea
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none text-white"
                  rows={4}
                  placeholder={t('submission.notesPlaceholder', 'Add your review notes here...')}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                />
              </div>
            </div>
          )}

          {activeTab === 'tracks' && (
            <div>
              <h3 className="text-xl font-semibold text-white mb-4">{t('submission.trackList', 'Track List')}</h3>
              <div className="space-y-3">
                {submission.tracks.map((track, index) => (
                  <div key={track.id} className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <span className="text-gray-400 w-8">{index + 1}</span>
                      <div>
                        <p className="text-white font-medium">{track.title}</p>
                        {track.hasAtmos && (
                          <span className="text-xs text-purple-400">{t('submission.dolbyAtmos', 'Dolby Atmos')}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-gray-400">{track.duration}</span>
                      <button
                        onClick={() => togglePlayTrack(track.id)}
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        {playingTrack === track.id ? (
                          <Pause className="w-5 h-5 text-purple-400" />
                        ) : (
                          <Play className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'marketing' && (
            <div>
              <h3 className="text-xl font-semibold text-white mb-4">{t('submission.marketingInfo', 'Marketing Information')}</h3>
              <div className="space-y-4">
                {Object.entries(submission.marketingInfo).map(([key, value]) => (
                  <div key={key}>
                    <p className="text-gray-400 text-sm capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                    <p className="text-white">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'files' && (
            <div>
              <h3 className="text-xl font-semibold text-white mb-4">{t('submission.files', 'Files')}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3 mb-2">
                    <Image className="w-8 h-8 text-purple-400" />
                    <div>
                      <p className="text-white font-medium">{t('submission.coverArt', 'Cover Art')}</p>
                      <p className="text-gray-400 text-sm">cover.jpg</p>
                    </div>
                  </div>
                  <button className="text-purple-400 hover:text-purple-300 text-sm flex items-center gap-1">
                    <Download className="w-4 h-4" />
                    {t('submission.download', 'Download')}
                  </button>
                </div>
                
                <div className="p-4 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3 mb-2">
                    <FileText className="w-8 h-8 text-purple-400" />
                    <div>
                      <p className="text-white font-medium">{t('submission.metadata', 'Metadata')}</p>
                      <p className="text-gray-400 text-sm">metadata.xlsx</p>
                    </div>
                  </div>
                  <button className="text-purple-400 hover:text-purple-300 text-sm flex items-center gap-1">
                    <Download className="w-4 h-4" />
                    {t('submission.download', 'Download')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubmissionManagement;