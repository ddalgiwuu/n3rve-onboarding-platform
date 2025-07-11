import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Download, Calendar, Music, Eye, CheckCircle, XCircle, Clock, Play, Image as ImageIcon, FileAudio, Globe, Target } from 'lucide-react';
import { useLanguageStore } from '@/store/language.store';
import { submissionService } from '@/services/submission.service';
import { dropboxService } from '@/services/dropbox.service';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface Track {
  id: string;
  titleKo: string;
  titleEn: string;
  artists: string[];
  featuringArtists?: string[];
  contributors?: Contributor[];
  composer: string;
  lyricist: string;
  isTitle: boolean;
  dolbyAtmos: boolean;
  stereo: boolean;
  audioFileUrl?: string;
}

interface Contributor {
  name: string;
  translations?: { language: string; name: string; }[];
  roles: string[];
  instruments: string[];
  spotifyUrl?: string;
  appleMusicUrl?: string;
}

interface Submission {
  id: string;
  submissionId?: string;
  artistName: string;
  artistNameEn?: string;
  albumTitle: string;
  albumTitleEn?: string;
  albumType: 'SINGLE' | 'EP' | 'ALBUM';
  releaseDate: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submitterEmail: string;
  submitterName: string;
  company?: string;
  phone?: string;
  createdAt: string;
  tracks: Track[];
  // Artist platform IDs
  spotifyId?: string;
  appleMusicId?: string;
  youtubeChannelId?: string;
  // Marketing info
  marketing?: {
    genre: string;
    subgenre?: string;
    tags?: string[];
    similarArtists?: string[];
    marketingAngle?: string;
    pressRelease?: string;
    marketingBudget?: string;
    socialMediaCampaign?: string;
    spotifyPitching?: string;
    appleMusicPitching?: string;
    tiktokStrategy?: string;
    youtubeStrategy?: string;
    instagramStrategy?: string;
    facebookStrategy?: string;
    twitterStrategy?: string;
    influencerOutreach?: string;
    playlistTargets?: string[];
    radioTargets?: string[];
    pressTargets?: string[];
    tourDates?: { date: string; venue: string; city: string; }[];
    merchandising?: string;
    specialEditions?: string;
    musicVideoPlans?: string;
    behindTheScenes?: string;
    documentaryPlans?: string;
    nftStrategy?: string;
    metaverseActivations?: string;
    brandPartnerships?: string;
    syncOpportunities?: string;
  };
  files: {
    coverImageUrl?: string;
    artistPhotoUrl?: string;
    pressShotUrl?: string;
    artistAvatarUrl?: string;
    artistLogoUrl?: string;
  };
  release: {
    albumIntroduction?: string;
    albumDescription?: string;
    marketingKeywords?: string;
    targetAudience?: string;
    promotionPlans?: string;
    artistBio?: string;
    similarArtists?: string;
    moods?: string[];
    instruments?: string[];
    spotifyArtistId?: string;
    appleMusicArtistId?: string;
    youtubeUrl?: string;
    instagramUrl?: string;
    tiktokUrl?: string;
    // ... 31개 마케팅 필드
  };
}

const AdminSubmissions = () => {
  const navigate = useNavigate();
  const { t } = useLanguageStore();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [audioPlayer, setAudioPlayer] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetchSubmissions();
    return () => {
      if (audioPlayer) {
        audioPlayer.pause();
      }
    };
  }, []);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const data = await submissionService.getAllSubmissions();
      setSubmissions(data);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast.error(t('제출물을 불러오는데 실패했습니다', 'Failed to load submissions'));
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
      default:
        return <Clock className="w-5 h-5 text-yellow-400" />;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'REJECTED':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      default:
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
    }
  };

  const handleStatusChange = async (submissionId: string, newStatus: string) => {
    try {
      await submissionService.updateSubmissionStatus(submissionId, newStatus);
      toast.success(t('상태가 업데이트되었습니다', 'Status updated'));
      fetchSubmissions();
    } catch (error) {
      toast.error(t('상태 업데이트 실패', 'Failed to update status'));
    }
  };

  const playAudio = (url: string) => {
    if (audioPlayer) {
      audioPlayer.pause();
    }
    
    const directUrl = dropboxService.getDirectUrl(url);
    const audio = new Audio(directUrl);
    audio.play();
    setAudioPlayer(audio);
  };

  const viewImage = (url: string) => {
    const directUrl = dropboxService.getDirectUrl(url);
    window.open(directUrl, '_blank');
  };

  const filteredSubmissions = submissions.filter(submission => {
    const matchesSearch = 
      submission.artistName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.albumTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.submitterEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || submission.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const exportToCSV = () => {
    const headers = [
      'Submission ID', 'Artist Name', 'Album Title', 'Album Type', 'Release Date',
      'Submitter', 'Email', 'Company', 'Phone', 'Status', 'Tracks',
      'Has Dolby Atmos', 'Has Stereo', 'Spotify ID', 'Apple Music ID', 'YouTube Channel ID',
      'Marketing Genre', 'Marketing Subgenre', 'Marketing Keywords', 'Target Audience',
      'Similar Artists', 'Marketing Angle', 'Social Media Campaign'
    ];
    
    const rows = filteredSubmissions.map(sub => [
      sub.submissionId || sub.id,
      sub.artistName,
      sub.albumTitle,
      sub.albumType,
      sub.releaseDate,
      sub.submitterName,
      sub.submitterEmail,
      sub.company || '',
      sub.phone || '',
      sub.status,
      sub.tracks.length,
      sub.tracks.some(t => t.dolbyAtmos) ? 'Yes' : 'No',
      sub.tracks.some(t => t.stereo) ? 'Yes' : 'No',
      sub.spotifyId || '',
      sub.appleMusicId || '',
      sub.youtubeChannelId || '',
      sub.marketing?.genre || '',
      sub.marketing?.subgenre || '',
      sub.release.marketingKeywords || sub.marketing?.marketingAngle || '',
      sub.release.targetAudience || '',
      sub.marketing?.similarArtists?.join('; ') || sub.release.similarArtists || '',
      sub.marketing?.marketingAngle || '',
      sub.marketing?.socialMediaCampaign || ''
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `submissions_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const SubmissionDetailsModal = () => {
    if (!selectedSubmission || !showDetails) return null;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
        <div className="glassmorphism max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold text-white">
              {t('제출 상세 정보', 'Submission Details')}
            </h2>
            <button
              onClick={() => setShowDetails(false)}
              className="text-gray-400 hover:text-white"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>

          {/* 기본 정보 */}
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-400">{t('제출 ID', 'Submission ID')}</p>
                <p className="text-white">{selectedSubmission.submissionId || selectedSubmission.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">{t('상태', 'Status')}</p>
                <div className="flex items-center gap-2 mt-1">
                  {getStatusIcon(selectedSubmission.status)}
                  <select
                    value={selectedSubmission.status}
                    onChange={(e) => handleStatusChange(selectedSubmission.id, e.target.value)}
                    className={`px-3 py-1 rounded-full text-sm border ${getStatusBadgeClass(selectedSubmission.status)} bg-transparent`}
                  >
                    <option value="PENDING">{t('대기중', 'Pending')}</option>
                    <option value="APPROVED">{t('승인됨', 'Approved')}</option>
                    <option value="REJECTED">{t('거절됨', 'Rejected')}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 아티스트 & 앨범 정보 */}
            <div className="glassmorphism p-4">
              <h3 className="text-lg font-semibold text-white mb-3">{t('아티스트 & 앨범', 'Artist & Album')}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">{t('아티스트명', 'Artist Name')}</p>
                  <p className="text-white">{selectedSubmission.artistName}</p>
                  {selectedSubmission.artistNameEn && (
                    <p className="text-gray-300 text-sm">{selectedSubmission.artistNameEn}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-400">{t('앨범명', 'Album Title')}</p>
                  <p className="text-white">{selectedSubmission.albumTitle}</p>
                  {selectedSubmission.albumTitleEn && (
                    <p className="text-gray-300 text-sm">{selectedSubmission.albumTitleEn}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-400">{t('앨범 타입', 'Album Type')}</p>
                  <p className="text-white">{selectedSubmission.albumType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">{t('발매일', 'Release Date')}</p>
                  <p className="text-white">{format(new Date(selectedSubmission.releaseDate), 'yyyy-MM-dd')}</p>
                </div>
              </div>
              
              {/* 아티스트 플랫폼 ID */}
              {(selectedSubmission.spotifyId || selectedSubmission.appleMusicId || selectedSubmission.youtubeChannelId) && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-sm text-gray-400 mb-2">{t('아티스트 플랫폼 ID', 'Artist Platform IDs')}</p>
                  <div className="space-y-1">
                    {selectedSubmission.spotifyId && (
                      <p className="text-white text-sm">
                        <span className="text-green-400">Spotify:</span> {selectedSubmission.spotifyId}
                      </p>
                    )}
                    {selectedSubmission.appleMusicId && (
                      <p className="text-white text-sm">
                        <span className="text-red-400">Apple Music:</span> {selectedSubmission.appleMusicId}
                      </p>
                    )}
                    {selectedSubmission.youtubeChannelId && (
                      <p className="text-white text-sm">
                        <span className="text-red-500">YouTube:</span> {selectedSubmission.youtubeChannelId}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 제출자 정보 */}
            <div className="glassmorphism p-4">
              <h3 className="text-lg font-semibold text-white mb-3">{t('제출자 정보', 'Submitter Info')}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">{t('이름', 'Name')}</p>
                  <p className="text-white">{selectedSubmission.submitterName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">{t('이메일', 'Email')}</p>
                  <p className="text-white">{selectedSubmission.submitterEmail}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">{t('회사', 'Company')}</p>
                  <p className="text-white">{selectedSubmission.company || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">{t('전화번호', 'Phone')}</p>
                  <p className="text-white">{selectedSubmission.phone || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* 파일 미리보기 */}
            <div className="glassmorphism p-4">
              <h3 className="text-lg font-semibold text-white mb-3">{t('업로드된 파일', 'Uploaded Files')}</h3>
              <div className="grid grid-cols-3 gap-4">
                {selectedSubmission.files.coverImageUrl && (
                  <div>
                    <p className="text-sm text-gray-400 mb-2">{t('앨범 커버', 'Album Cover')}</p>
                    <img
                      src={dropboxService.getDirectUrl(selectedSubmission.files.coverImageUrl)}
                      alt="Album Cover"
                      className="w-full h-32 object-cover rounded cursor-pointer hover:opacity-80"
                      onClick={() => viewImage(selectedSubmission.files.coverImageUrl!)}
                    />
                  </div>
                )}
                {selectedSubmission.files.artistPhotoUrl && (
                  <div>
                    <p className="text-sm text-gray-400 mb-2">{t('아티스트 사진', 'Artist Photo')}</p>
                    <img
                      src={dropboxService.getDirectUrl(selectedSubmission.files.artistPhotoUrl)}
                      alt="Artist Photo"
                      className="w-full h-32 object-cover rounded cursor-pointer hover:opacity-80"
                      onClick={() => viewImage(selectedSubmission.files.artistPhotoUrl!)}
                    />
                  </div>
                )}
                {selectedSubmission.files.pressShotUrl && (
                  <div>
                    <p className="text-sm text-gray-400 mb-2">{t('프레스 샷', 'Press Shot')}</p>
                    <img
                      src={dropboxService.getDirectUrl(selectedSubmission.files.pressShotUrl)}
                      alt="Press Shot"
                      className="w-full h-32 object-cover rounded cursor-pointer hover:opacity-80"
                      onClick={() => viewImage(selectedSubmission.files.pressShotUrl!)}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* 트랙 정보 */}
            <div className="glassmorphism p-4">
              <h3 className="text-lg font-semibold text-white mb-3">{t('트랙 목록', 'Track List')}</h3>
              <div className="space-y-2">
                {selectedSubmission.tracks.map((track, index) => (
                  <div key={track.id} className="flex items-center justify-between p-3 bg-black/20 rounded">
                    <div className="flex-1">
                      <p className="text-white font-medium">
                        {index + 1}. {track.titleKo}
                        {track.isTitle && (
                          <span className="ml-2 text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded">
                            {t('타이틀', 'Title')}
                          </span>
                        )}
                      </p>
                      <p className="text-gray-400 text-sm">{track.titleEn}</p>
                      <p className="text-gray-500 text-xs mt-1">
                        {t('작곡', 'Composer')}: {track.composer} | {t('작사', 'Lyricist')}: {track.lyricist}
                        {track.dolbyAtmos && (
                          <span className="ml-2 text-blue-400">• Dolby Atmos</span>
                        )}
                        {track.stereo && (
                          <span className="ml-2 text-gray-400">• Stereo</span>
                        )}
                      </p>
                      {track.featuringArtists && track.featuringArtists.length > 0 && (
                        <p className="text-gray-400 text-xs">
                          {t('피처링', 'Featuring')}: {track.featuringArtists.join(', ')}
                        </p>
                      )}
                      {track.contributors && track.contributors.length > 0 && (
                        <p className="text-gray-400 text-xs">
                          {t('기여자', 'Contributors')}: {track.contributors.map(c => c.name).join(', ')}
                        </p>
                      )}
                    </div>
                    {track.audioFileUrl && (
                      <button
                        onClick={() => playAudio(track.audioFileUrl!)}
                        className="p-2 bg-purple-500/20 hover:bg-purple-500/30 rounded-full transition-colors"
                      >
                        <Play className="w-4 h-4 text-purple-300" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 마케팅 정보 */}
            {selectedSubmission.marketing && (
              <div className="glassmorphism p-4">
                <h3 className="text-lg font-semibold text-white mb-3">{t('마케팅 정보', 'Marketing Info')}</h3>
                <div className="space-y-3">
                  {/* 장르 */}
                  {selectedSubmission.marketing.genre && (
                    <div>
                      <p className="text-sm text-gray-400">{t('장르', 'Genre')}</p>
                      <p className="text-white text-sm mt-1">
                        {selectedSubmission.marketing.genre}
                        {selectedSubmission.marketing.subgenre && ` - ${selectedSubmission.marketing.subgenre}`}
                      </p>
                    </div>
                  )}
                  
                  {/* 태그 */}
                  {selectedSubmission.marketing.tags && selectedSubmission.marketing.tags.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-400">{t('태그', 'Tags')}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedSubmission.marketing.tags.map((tag, i) => (
                          <span key={i} className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* 비슷한 아티스트 */}
                  {selectedSubmission.marketing.similarArtists && selectedSubmission.marketing.similarArtists.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-400">{t('비슷한 아티스트', 'Similar Artists')}</p>
                      <p className="text-white text-sm mt-1">{selectedSubmission.marketing.similarArtists.join(', ')}</p>
                    </div>
                  )}
                  
                  {/* 마케팅 전략 */}
                  {selectedSubmission.marketing.marketingAngle && (
                    <div>
                      <p className="text-sm text-gray-400">{t('마케팅 전략', 'Marketing Strategy')}</p>
                      <p className="text-white text-sm mt-1">{selectedSubmission.marketing.marketingAngle}</p>
                    </div>
                  )}
                  
                  {/* 소셜 미디어 캐페인 */}
                  {selectedSubmission.marketing.socialMediaCampaign && (
                    <div>
                      <p className="text-sm text-gray-400">{t('소셜 미디어 캘페인', 'Social Media Campaign')}</p>
                      <p className="text-white text-sm mt-1">{selectedSubmission.marketing.socialMediaCampaign}</p>
                    </div>
                  )}
                  
                  {/* 플레이리스트 타겟 */}
                  {selectedSubmission.marketing.playlistTargets && selectedSubmission.marketing.playlistTargets.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-400">{t('플레이리스트 타겟', 'Playlist Targets')}</p>
                      <p className="text-white text-sm mt-1">{selectedSubmission.marketing.playlistTargets.join(', ')}</p>
                    </div>
                  )}
                  
                  {/* 투어 일정 */}
                  {selectedSubmission.marketing.tourDates && selectedSubmission.marketing.tourDates.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-400">{t('투어 일정', 'Tour Dates')}</p>
                      <div className="space-y-1 mt-1">
                        {selectedSubmission.marketing.tourDates.map((tour, i) => (
                          <p key={i} className="text-white text-sm">
                            {tour.date} - {tour.venue}, {tour.city}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* 기타 중요 필드들 */}
                  {selectedSubmission.marketing.spotifyPitching && (
                    <div>
                      <p className="text-sm text-gray-400">{t('Spotify 피칭', 'Spotify Pitching')}</p>
                      <p className="text-white text-sm mt-1">{selectedSubmission.marketing.spotifyPitching}</p>
                    </div>
                  )}
                  
                  {selectedSubmission.marketing.brandPartnerships && (
                    <div>
                      <p className="text-sm text-gray-400">{t('브랜드 파트너십', 'Brand Partnerships')}</p>
                      <p className="text-white text-sm mt-1">{selectedSubmission.marketing.brandPartnerships}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* 기존 마케팅 정보 (하위 호환성) */}
            {selectedSubmission.release && (
              <div className="glassmorphism p-4">
                <h3 className="text-lg font-semibold text-white mb-3">{t('기타 정보', 'Additional Info')}</h3>
                <div className="space-y-3">
                  {selectedSubmission.release.albumIntroduction && (
                    <div>
                      <p className="text-sm text-gray-400">{t('앨범 소개', 'Album Introduction')}</p>
                      <p className="text-white text-sm mt-1">{selectedSubmission.release.albumIntroduction}</p>
                    </div>
                  )}
                  {selectedSubmission.release.marketingKeywords && (
                    <div>
                      <p className="text-sm text-gray-400">{t('마케팅 키워드', 'Marketing Keywords')}</p>
                      <p className="text-white text-sm mt-1">{selectedSubmission.release.marketingKeywords}</p>
                    </div>
                  )}
                  {selectedSubmission.release.targetAudience && (
                    <div>
                      <p className="text-sm text-gray-400">{t('타겟 청중', 'Target Audience')}</p>
                      <p className="text-white text-sm mt-1">{selectedSubmission.release.targetAudience}</p>
                    </div>
                  )}
                  {selectedSubmission.release.moods && selectedSubmission.release.moods.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-400">{t('무드', 'Moods')}</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {selectedSubmission.release.moods.map((mood, i) => (
                          <span key={i} className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs">
                            {mood}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 소셜 미디어 링크 */}
            {(selectedSubmission.release.spotifyArtistId || 
              selectedSubmission.release.youtubeUrl || 
              selectedSubmission.release.instagramUrl) && (
              <div className="glassmorphism p-4">
                <h3 className="text-lg font-semibold text-white mb-3">{t('소셜 미디어', 'Social Media')}</h3>
                <div className="flex flex-wrap gap-3">
                  {selectedSubmission.release.spotifyArtistId && (
                    <a
                      href={`https://open.spotify.com/artist/${selectedSubmission.release.spotifyArtistId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 bg-green-500/20 text-green-300 rounded hover:bg-green-500/30"
                    >
                      Spotify
                    </a>
                  )}
                  {selectedSubmission.release.youtubeUrl && (
                    <a
                      href={selectedSubmission.release.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 bg-red-500/20 text-red-300 rounded hover:bg-red-500/30"
                    >
                      YouTube
                    </a>
                  )}
                  {selectedSubmission.release.instagramUrl && (
                    <a
                      href={selectedSubmission.release.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 bg-pink-500/20 text-pink-300 rounded hover:bg-pink-500/30"
                    >
                      Instagram
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">{t('제출물 관리', 'Submission Management')}</h1>
          <button
            onClick={exportToCSV}
            className="btn-primary flex items-center gap-2"
          >
            <Download className="w-5 h-5" />
            {t('CSV 내보내기', 'Export CSV')}
          </button>
        </div>

        {/* 필터 및 검색 */}
        <div className="glassmorphism p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={t('아티스트, 앨범, 이메일로 검색...', 'Search by artist, album, email...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-400"
            >
              <option value="all">{t('모든 상태', 'All Status')}</option>
              <option value="PENDING">{t('대기중', 'Pending')}</option>
              <option value="APPROVED">{t('승인됨', 'Approved')}</option>
              <option value="REJECTED">{t('거절됨', 'Rejected')}</option>
            </select>
          </div>
        </div>

        {/* 제출물 테이블 */}
        <div className="glassmorphism overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left p-4 text-gray-400 font-medium">{t('제출일', 'Submitted')}</th>
                  <th className="text-left p-4 text-gray-400 font-medium">{t('아티스트', 'Artist')}</th>
                  <th className="text-left p-4 text-gray-400 font-medium">{t('앨범', 'Album')}</th>
                  <th className="text-left p-4 text-gray-400 font-medium">{t('트랙', 'Tracks')}</th>
                  <th className="text-left p-4 text-gray-400 font-medium">{t('타입', 'Type')}</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Dolby Atmos</th>
                  <th className="text-left p-4 text-gray-400 font-medium">{t('상태', 'Status')}</th>
                  <th className="text-left p-4 text-gray-400 font-medium">{t('액션', 'Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center p-8 text-gray-400">
                      {t('로딩 중...', 'Loading...')}
                    </td>
                  </tr>
                ) : filteredSubmissions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center p-8 text-gray-400">
                      {t('제출물이 없습니다', 'No submissions found')}
                    </td>
                  </tr>
                ) : (
                  filteredSubmissions.map((submission) => (
                    <tr key={submission.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-gray-300">
                          <Calendar className="w-4 h-4" />
                          <span className="text-sm">{format(new Date(submission.createdAt), 'yyyy-MM-dd')}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-white font-medium">{submission.artistName}</div>
                        <div className="text-gray-400 text-sm">{submission.submitterEmail}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-white">{submission.albumTitle}</div>
                        <div className="text-gray-400 text-sm">{format(new Date(submission.releaseDate), 'yyyy-MM-dd')}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-gray-300">
                          <Music className="w-4 h-4" />
                          <span>{submission.tracks.length}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-gray-300">{submission.albumType}</span>
                      </td>
                      <td className="p-4">
                        {submission.tracks.some(t => t.dolbyAtmos) ? (
                          <span className="text-blue-400">✓</span>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(submission.status)}
                          <span className={`px-3 py-1 rounded-full text-sm border ${getStatusBadgeClass(submission.status)}`}>
                            {t(submission.status.toLowerCase(), submission.status.toLowerCase())}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => {
                            setSelectedSubmission(submission);
                            setShowDetails(true);
                          }}
                          className="p-2 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg transition-colors"
                        >
                          <Eye className="w-5 h-5 text-purple-300" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 상세 정보 모달 */}
      <SubmissionDetailsModal />
    </div>
  );
}

export default AdminSubmissions;