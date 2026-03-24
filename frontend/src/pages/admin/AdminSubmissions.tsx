import { useState, useEffect } from 'react';
import { Search, Eye, Clock, CheckCircle, XCircle, Grid3X3, List, Trash2 } from 'lucide-react';
import { useLanguageStore } from '@/store/language.store';
import useSafeStore from '@/hooks/useSafeStore';
import { adminService } from '@/services/admin.service';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import SubmissionTileView from '@/components/admin/SubmissionTileView';

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
  const [viewMode, setViewMode] = useState<'table' | 'tile'>('tile');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [labelAccounts, setLabelAccounts] = useState<any[]>([]);
  const [selectedLabel, setSelectedLabel] = useState<string>('all');
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

  // Load label accounts on mount
  useEffect(() => {
    adminService.getLabelAccounts().then(setLabelAccounts).catch(() => {});
  }, []);

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
        search: searchTerm || undefined,
        limit: 500
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

  const handleDeleteClick = (id: string) => setDeleteTarget(id);

  const handleAutoMap = async () => {
    try {
      const result = await adminService.autoMapLabels();
      toast.success(
        t(
          `자동 매핑 완료: ${result.mapped}/${result.total}건 매핑됨`,
          `Auto-map complete: ${result.mapped}/${result.total} mapped`
        )
      );
      loadSubmissions();
    } catch {
      toast.error(t('자동 매핑에 실패했습니다', 'Auto-map failed'));
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await adminService.deleteSubmission(deleteTarget);
      toast.success(t('삭제되었습니다', 'Deleted successfully', '削除されました'));
      loadSubmissions();
    } catch (err) {
      toast.error(t('삭제에 실패했습니다', 'Failed to delete', '削除に失敗しました'));
    } finally {
      setDeleteTarget(null);
    }
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
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const matchesSearch =
        sub.artistName?.toLowerCase().includes(search) ||
        sub.albumTitle?.toLowerCase().includes(search) ||
        sub.submitterName?.toLowerCase().includes(search) ||
        sub.submitterEmail?.toLowerCase().includes(search);
      if (!matchesSearch) return false;
    }
    if (selectedLabel !== 'all') {
      if (selectedLabel === 'unmapped') {
        if (sub.labelAccountId) return false;
      } else {
        if (sub.labelAccountId !== selectedLabel) return false;
      }
    }
    return true;
  });

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('제출 관리', 'Submission Management', '提出管理')}</h1>

        <div className="flex gap-4 items-center">
          {/* 검색 / Search / 検索 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder={t('아티스트, 앨범명 검색...', 'Search artists, album names...', 'アーティスト、アルバム名を検索...')}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400"
            />
          </div>

          {/* 필터 / Filter / フィルター */}
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400"
          >
            <option value="all">{t('전체', 'All', '全て')}</option>
            <option value="pending">{t('검토중', 'Under Review', '審査中')}</option>
            <option value="approved">{t('승인됨', 'Approved', '承認済み')}</option>
            <option value="rejected">{t('반려됨', 'Rejected', '却下済み')}</option>
          </select>

          {/* 레이블 필터 / Label filter */}
          <select
            value={selectedLabel}
            onChange={(e) => setSelectedLabel(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400"
          >
            <option value="all">{t('전체 레이블', 'All Labels')}</option>
            <option value="unmapped">{t('미매핑', 'Unmapped')}</option>
            {labelAccounts.map(la => (
              <option key={la.id} value={la.id}>
                {la.company || la.name} ({la._count?.labelSubmissions || 0})
              </option>
            ))}
          </select>

          {/* 자동 매핑 버튼 / Auto-map button */}
          <button
            onClick={handleAutoMap}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition-colors whitespace-nowrap"
          >
            {t('자동 매핑', 'Auto Map')}
          </button>

          {/* 뷰 전환 / View toggle / ビュー切替 */}
          <div className="flex items-center gap-1 ml-2 border border-gray-200 dark:border-gray-600 rounded-lg p-1">
            <button
              onClick={() => setViewMode('tile')}
              aria-label={t('타일 뷰', 'Tile view', 'タイルビュー')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'tile'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              aria-label={t('테이블 뷰', 'Table view', 'テーブルビュー')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'table'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 로딩 / 에러 상태 / Loading / Error states */}
      {loading && (
        <div className="text-center py-16 text-gray-500 dark:text-gray-400">
          {t('데이터를 불러오는 중...', 'Loading data...', 'データを読み込み中...')}
        </div>
      )}

      {!loading && error && (
        <div className="text-center py-16 text-red-500 dark:text-red-400">
          {t('데이터를 불러오는데 실패했습니다', 'Failed to load data', 'データの読み込みに失敗しました')}: {error}
        </div>
      )}

      {!loading && !error && viewMode === 'tile' && (
        <SubmissionTileView
          submissions={filteredSubmissions}
          onView={handleViewSubmission}
          onDelete={handleDeleteClick}
        />
      )}

      {!loading && !error && viewMode === 'table' && (
        /* 제출 목록 테이블 / Submission List Table / 提出リストテーブル */
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('제출일', 'Submission Date', '提出日')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('아티스트', 'Artist', 'アーティスト')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('앨범명', 'Album Name', 'アルバム名')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('앨범 유형', 'Album Type', 'アルバムタイプ')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('발매일', 'Release Date', 'リリース日')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('제출자', 'Submitter', '提出者')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('상태', 'Status', 'ステータス')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('파일', 'Files', 'ファイル')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('작업', 'Actions', 'アクション')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    {t('제출물이 없습니다', 'No submissions found', '提出物がありません')}
                  </td>
                </tr>
              ) : (
                filteredSubmissions.map((submission) => (
                  <tr
                    key={submission.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                  >
                    <td
                      onClick={() => handleViewSubmission(submission.id)}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200"
                    >
                      {format(new Date(submission.createdAt), 'yyyy-MM-dd')}
                    </td>
                    <td
                      onClick={() => handleViewSubmission(submission.id)}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200"
                    >
                      {submission.artistName}
                    </td>
                    <td
                      onClick={() => handleViewSubmission(submission.id)}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200"
                    >
                      {submission.albumTitle}
                    </td>
                    <td
                      onClick={() => handleViewSubmission(submission.id)}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400"
                    >
                      {submission.albumType}
                    </td>
                    <td
                      onClick={() => handleViewSubmission(submission.id)}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400"
                    >
                      {format(new Date(submission.releaseDate), 'yyyy-MM-dd')}
                    </td>
                    <td
                      onClick={() => handleViewSubmission(submission.id)}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400"
                    >
                      <div className="text-gray-900 dark:text-gray-200">{submission.submitterName}</div>
                      <div className="text-xs text-gray-400 dark:text-gray-500">{submission.submitterEmail}</div>
                    </td>
                    <td
                      onClick={() => handleViewSubmission(submission.id)}
                      className="px-6 py-4 whitespace-nowrap"
                    >
                      {getStatusBadge(submission.status)}
                    </td>
                    <td
                      onClick={() => handleViewSubmission(submission.id)}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400"
                    >
                      <span className="inline-flex items-center gap-1">
                        <span className="font-medium text-gray-900 dark:text-gray-200">{getFileCount(submission.files)}</span>
                        {t('개', 'files', 'ファイル')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => handleViewSubmission(submission.id)}
                          className="inline-flex items-center gap-1 text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          {t('보기', 'View', '表示')}
                        </button>
                        <button
                          onClick={() => handleDeleteClick(submission.id)}
                          className="inline-flex items-center gap-1 text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          {t('삭제', 'Delete', '削除')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 삭제 확인 모달 / Delete confirmation modal / 削除確認モーダル */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                {t('정말 삭제하시겠습니까?', 'Confirm deletion?', '本当に削除しますか？')}
              </h3>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
              {t(
                '이 작업은 되돌릴 수 없습니다.',
                'This action cannot be undone.',
                'この操作は取り消せません。'
              )}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {t('취소', 'Cancel', 'キャンセル')}
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
              >
                {t('삭제', 'Delete', '削除')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
