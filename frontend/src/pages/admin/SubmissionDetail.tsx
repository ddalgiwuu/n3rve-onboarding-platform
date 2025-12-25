import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, CheckCircle, XCircle } from 'lucide-react';
import { useLanguageStore } from '@/store/language.store';
import useSafeStore from '@/hooks/useSafeStore';
import { adminService } from '@/services/admin.service';
import SubmissionDetailView from '@/components/admin/SubmissionDetailView';
import toast from 'react-hot-toast';

export default function SubmissionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

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
      console.error('Failed to load submission:', err);
      toast.error(t('제출물을 불러오는데 실패했습니다', 'Failed to load submission'));
      navigate('/admin/submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (status: 'approved' | 'rejected', comments?: string) => {
    try {
      setUpdating(true);
      await adminService.updateSubmissionStatus(id!, status, comments);
      toast.success(t('상태가 업데이트되었습니다', 'Status updated successfully'));
      await loadSubmission(); // Reload to get updated data
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

      {/* Submission Details */}
      <SubmissionDetailView submission={submission} />
    </div>
  );
}
