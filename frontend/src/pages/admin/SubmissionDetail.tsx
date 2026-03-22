import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { useLanguageStore } from '@/store/language.store';
import useSafeStore from '@/hooks/useSafeStore';
import { adminService } from '@/services/admin.service';
import SubmissionDetailView from '@/components/admin/SubmissionDetailView';
import QCLogTab from '@/components/admin/QCLogTab';
import DSPMemoTab from '@/components/admin/DSPMemoTab';
import toast from 'react-hot-toast';

type TabId = 'details' | 'qclogs' | 'dspmemo';

export default function SubmissionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('details');

  const language = useSafeStore(useLanguageStore, (state) => state.language);
  const t = (ko: string, en: string) => language === 'ko' ? ko : en;

  useEffect(() => {
    if (id) {
      loadSubmission();
    }
  }, [id]);

  const loadSubmission = async () => {
    try {
      setLoading(true);
      const data = await adminService.getSubmission(id!);
      setSubmission(data);
    } catch (err: any) {
      console.error('Failed to load submission:', err, err?.message, err?.stack);
      toast.error(t('제출물을 불러오는데 실패했습니다', 'Failed to load submission') + ': ' + (err?.message || ''));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (status: 'approved' | 'rejected', comments?: string) => {
    try {
      setUpdating(true);
      await adminService.updateSubmissionStatus(id!, status, comments);
      toast.success(t('상태가 업데이트되었습니다', 'Status updated successfully'));
      await loadSubmission();
    } catch (err: any) {
      console.error('Failed to update status:', err);
      toast.error(t('상태 업데이트에 실패했습니다', 'Failed to update status'));
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">{t('로딩 중...', 'Loading...')}</div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-red-500">{t('제출물을 찾을 수 없습니다', 'Submission not found')}</div>
      </div>
    );
  }

  const tracks: Array<{ id: string; titleKo?: string; titleEn?: string; trackNumber?: number }> =
    Array.isArray(submission.tracks)
      ? submission.tracks.map((tr: any, idx: number) => ({
          id: tr.id || tr._id || String(idx),
          titleKo: tr.titleKo || tr.title,
          titleEn: tr.titleEn || tr.title,
          trackNumber: tr.trackNumber ?? idx + 1,
        }))
      : [];

  const tabs: Array<{ id: TabId; label: string }> = [
    { id: 'details', label: t('기본 정보', 'Details') },
    { id: 'qclogs', label: t('QC 로그', 'QC Logs') },
    { id: 'dspmemo', label: t('DSP 메모', 'DSP Memo') },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin/submissions')}
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          {t('목록으로 돌아가기', 'Back to List')}
        </button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {submission.albumTitle}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {submission.artistName} • {submission.albumType}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {submission.status === 'PENDING' && (
              <>
                <button
                  onClick={() => handleUpdateStatus('approved')}
                  disabled={updating}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  <CheckCircle className="w-5 h-5" />
                  {t('승인', 'Approve')}
                </button>
                <button
                  onClick={() => handleUpdateStatus('rejected')}
                  disabled={updating}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  <XCircle className="w-5 h-5" />
                  {t('반려', 'Reject')}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-0" aria-label="Tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={[
                'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
                activeTab === tab.id
                  ? 'border-purple-600 text-purple-600 dark:text-purple-400 dark:border-purple-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600',
              ].join(' ')}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === 'details' && (
        <SubmissionDetailView submission={submission} />
      )}

      {activeTab === 'qclogs' && (
        <QCLogTab submissionId={id!} tracks={tracks} />
      )}

      {activeTab === 'dspmemo' && (
        <DSPMemoTab submissionId={id!} tracks={tracks} />
      )}
    </div>
  );
}
