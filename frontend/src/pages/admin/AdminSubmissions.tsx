import { useState, useEffect } from 'react';
import { Search, Eye, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useLanguageStore } from '@/store/language.store';
import useSafeStore from '@/hooks/useSafeStore';
import { adminService } from '@/services/admin.service';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

interface Submission {
  id: string;
  artistName: string;
  albumTitle: string;
  albumType: string;
  releaseDate: string | Date;
  submitterName: string;
  submitterEmail: string;
  status: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  tracks?: any[];
  files?: any;
  release?: any;
  marketing?: any;
  biography?: string;
  socialLinks?: any;
  artistType?: string;
  members?: any;
  spotifyId?: string;
  appleMusicId?: string;
  youtubeChannelId?: string;
  albumTranslations?: any;
  albumDescription?: string;
  albumVersion?: string;
  releaseVersion?: string;
  primaryTitle?: string;
  hasTranslation?: boolean;
  translationLanguage?: string;
  translatedTitle?: string;
  albumContributors?: any;
  reviewedBy?: string;
  reviewedAt?: string | Date;
  adminNotes?: string;
}

export default function AdminSubmissions() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const language = useSafeStore(useLanguageStore, (state) => state.language);
  const t = (ko: string, en: string, ja?: string) => {
    switch (language) {
      case 'ko': return ko;
      case 'en': return en;
      case 'ja': return ja || en;
      default: return en;
    }
  };

  // Load submissions data
  useEffect(() => {
    loadSubmissions();
  }, [filterStatus]);

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminService.getSubmissions({
        status: filterStatus === 'all' ? undefined : filterStatus,
        search: searchTerm || undefined
      });
      setSubmissions(response.submissions || []);
    } catch (err: any) {
      console.error('Failed to load submissions:', err);
      setError(err.message || 'Failed to load submissions');
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadSubmissions();
  };

  const handleViewSubmission = (id: string) => {
    navigate(`/admin/submissions/${id}`);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { icon: any, color: string, text: [string, string, string] }> = {
      'PENDING': { icon: Clock, color: 'bg-yellow-100 text-yellow-800', text: ['검토중', 'Pending', '審査中'] },
      'IN_REVIEW': { icon: Clock, color: 'bg-blue-100 text-blue-800', text: ['검토중', 'In Review', 'レビュー中'] },
      'APPROVED': { icon: CheckCircle, color: 'bg-green-100 text-green-800', text: ['승인됨', 'Approved', '承認済み'] },
      'REJECTED': { icon: XCircle, color: 'bg-red-100 text-red-800', text: ['반려됨', 'Rejected', '却下済み'] }
    };
    const config = statusMap[status] || statusMap['PENDING'];
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3" />
        {t(...config.text)}
      </span>
    );
  };

  const getFileCount = (files: any): number => {
    if (!files) return 0;
    let count = 0;
    if (files.coverImageUrl) count++;
    if (files.artistPhotoUrl) count++;
    if (files.motionArtUrl) count++;
    if (files.musicVideoUrl) count++;
    if (files.audioFiles?.length) count += files.audioFiles.length;
    if (files.musicVideoFiles?.length) count += files.musicVideoFiles.length;
    if (files.musicVideoThumbnails?.length) count += files.musicVideoThumbnails.length;
    if (files.additionalFiles?.length) count += files.additionalFiles.length;
    return count;
  };

  const filteredSubmissions = submissions.filter(sub => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return sub.artistName?.toLowerCase().includes(search) ||
           sub.albumTitle?.toLowerCase().includes(search) ||
           sub.submitterName?.toLowerCase().includes(search) ||
           sub.submitterEmail?.toLowerCase().includes(search);
  });

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">{t('제출 관리', 'Submission Management', '提出管理')}</h1>

        <div className="flex gap-4">
          {/* 검색 / Search / 検索 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder={t('아티스트, 앨범명 검색...', 'Search artists, album names...', 'アーティスト、アルバム名を検索...')}
              className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* 필터 / Filter / フィルター */}
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">{t('전체', 'All', '全て')}</option>
            <option value="pending">{t('검토중', 'Under Review', '審査中')}</option>
            <option value="approved">{t('승인됨', 'Approved', '承認済み')}</option>
            <option value="rejected">{t('반려됨', 'Rejected', '却下済み')}</option>
          </select>
        </div>
      </div>

      {/* 제출 목록 테이블 / Submission List Table / 提出リストテーブル */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('제출일', 'Submission Date', '提出日')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('아티스트', 'Artist', 'アーティスト')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('앨범명', 'Album Name', 'アルバム名')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('앨범 유형', 'Album Type', 'アルバムタイプ')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('발매일', 'Release Date', 'リリース日')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('제출자', 'Submitter', '提出者')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('상태', 'Status', 'ステータス')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('파일', 'Files', 'ファイル')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('작업', 'Actions', 'アクション')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={9} className="px-6 py-4 text-center text-gray-500">
                  {t('데이터를 불러오는 중...', 'Loading data...', 'データを読み込み中...')}
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={9} className="px-6 py-4 text-center text-red-500">
                  {t('데이터를 불러오는데 실패했습니다', 'Failed to load data', 'データの読み込みに失敗しました')}: {error}
                </td>
              </tr>
            ) : filteredSubmissions.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-4 text-center text-gray-500">
                  {t('제출물이 없습니다', 'No submissions found', '提出物がありません')}
                </td>
              </tr>
            ) : (
              filteredSubmissions.map((submission) => (
                <tr
                  key={submission.id}
                  onClick={() => handleViewSubmission(submission.id)}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {format(new Date(submission.createdAt), 'yyyy-MM-dd')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {submission.artistName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {submission.albumTitle}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {submission.albumType}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(submission.releaseDate), 'yyyy-MM-dd')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>{submission.submitterName}</div>
                    <div className="text-xs text-gray-400">{submission.submitterEmail}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(submission.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      <span className="font-medium text-gray-900">{getFileCount(submission.files)}</span>
                      {t('개', 'files', 'ファイル')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="inline-flex items-center gap-1 text-purple-600">
                      <Eye className="w-4 h-4" />
                      {t('보기', 'View', '表示')}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
