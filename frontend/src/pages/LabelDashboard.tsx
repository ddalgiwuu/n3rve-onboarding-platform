import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { useLanguageStore } from '@/contexts/LanguageContext';
import { useHydration } from '@/hooks/useHydration';
import useSafeStore from '@/hooks/useSafeStore';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Building2, Music, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import SubmissionTileView from '@/components/admin/SubmissionTileView';
import { Button } from '@/components/ui/Button';

export default function LabelDashboard() {
  const isHydrated = useHydration();
  const user = useSafeStore(useAuthStore, (state) => state.user);
  const language = useSafeStore(useLanguageStore, (state) => state.language);
  const navigate = useNavigate();

  const t = (ko: string, en: string, ja?: string) => {
    switch (language) {
      case 'ko': return ko;
      case 'en': return en;
      case 'ja': return ja || en;
      default: return en;
    }
  };

  const { data: submissionsData, isLoading } = useQuery({
    queryKey: ['label-submissions'],
    queryFn: async () => {
      try {
        const response = await api.get('/submissions/user', {
          params: { limit: 500 }
        });
        return response.data;
      } catch (error) {
        console.error('Error fetching label submissions:', error);
        return { data: [], total: 0 };
      }
    },
    enabled: isHydrated && !!user,
    retry: 1
  });

  if (!isHydrated) {
    return <LoadingSpinner />;
  }

  const submissions: any[] = submissionsData?.data || [];
  const total: number = submissionsData?.total ?? submissions.length;

  const labelName =
    user?.company ||
    user?.companyName ||
    user?.name ||
    user?.email ||
    t('레이블', 'Label');

  const handleView = (id: string) => {
    navigate(`/submissions/${id}`);
  };

  // no-op: label users cannot delete
  const handleDelete = (_id: string) => {};

  return (
    <div className="min-h-screen bg-transparent p-6 relative overflow-hidden">
      {/* Background depth layers */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/[0.02] dark:bg-white/[0.03] rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-white/[0.015] dark:bg-white/[0.025] rounded-full blur-3xl" />
      </div>

      <div className="w-full space-y-6 relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between animate-fade-in gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-surface border-modern-soft">
              <Building2 className="w-7 h-7 text-gray-900 dark:text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                {labelName}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {t('레이블 대시보드', 'Label Dashboard')}
              </p>
            </div>
          </div>
          <Button asChild size="lg" variant="default">
            <Link to="/release-submission-modern">
              <Upload className="w-5 h-5" />
              {t('새 릴리스', 'New Release')}
            </Link>
          </Button>
        </div>

        {/* Album count summary */}
        <div className="flex items-center gap-2 px-1">
          <Music className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {language === 'ko'
              ? `총 ${total}개 앨범`
              : `${total} Album${total !== 1 ? 's' : ''} Total`}
          </span>
        </div>

        {/* Tile grid */}
        <div className="animate-fade-in-delay">
          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <LoadingSpinner />
            </div>
          ) : submissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Music className="w-14 h-14 text-gray-300 dark:text-gray-600" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {t('아직 등록된 앨범이 없습니다', 'No albums registered yet')}
              </p>
              <Button asChild variant="default" size="sm">
                <Link to="/release-submission-modern">
                  {t('첫 릴리스 등록하기', 'Register your first release')}
                </Link>
              </Button>
            </div>
          ) : (
            <SubmissionTileView
              submissions={submissions}
              onView={handleView}
              onDelete={handleDelete}
              readOnly
            />
          )}
        </div>
      </div>
    </div>
  );
}
