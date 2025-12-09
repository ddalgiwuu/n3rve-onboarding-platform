import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Save,
  Send,
  Music2,
  Calendar,
  Building2,
  CheckCircle
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '@/hooks/useTranslationFixed';
import { MarketingSection } from '@/components/submission/MarketingSection';
import { FocusTrackSelector } from '@/components/submission/FocusTrackSelector';
import toast from 'react-hot-toast';

export default function MarketingSubmission() {
  const { id: urlId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language } = useTranslation();
  const queryClient = useQueryClient();

  // Selected submission ID (from URL or dropdown)
  const [selectedId, setSelectedId] = useState<string | null>(urlId || null);

  // Translation helper
  const translate = (ko: string, en: string, ja: string) => {
    if (language === 'ko') return ko;
    if (language === 'ja') return ja;
    return en;
  };

  // Marketing form state
  const [hook, setHook] = useState('');
  const [mainPitch, setMainPitch] = useState('');
  const [moods, setMoods] = useState<string[]>([]);
  const [instruments, setInstruments] = useState<string[]>([]);
  const [priority, setPriority] = useState(0);
  const [socialMediaPlan, setSocialMediaPlan] = useState('');
  const [marketingSpend, setMarketingSpend] = useState('');
  const [factSheetUrl, setFactSheetUrl] = useState('');
  const [youtubeShorts, setYoutubeShorts] = useState(false);
  const [thisIsPlaylist, setThisIsPlaylist] = useState(false);
  const [motionArtwork, setMotionArtwork] = useState(false);
  const [focusTrackIds, setFocusTrackIds] = useState<string[]>([]);

  // Fetch all submissions (for dropdown)
  const { data: allSubmissions = [] } = useQuery({
    queryKey: ['all-submissions'],
    queryFn: async () => {
      try {
        const response = await fetch('http://localhost:3001/api/submissions/user', {
          credentials: 'include'
        });
        if (!response.ok) return [];
        return response.json();
      } catch {
        return [];
      }
    },
    refetchOnWindowFocus: false
  });

  // Fetch selected submission data
  const { data: submission, isLoading } = useQuery({
    queryKey: ['submission', selectedId],
    queryFn: async () => {
      if (!selectedId) return null;
      const response = await fetch(`http://localhost:3001/api/submissions/${selectedId}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch submission');
      return response.json();
    },
    enabled: !!selectedId
  });

  // Load existing marketing data
  useEffect(() => {
    if (submission) {
      setHook(submission.hook || '');
      setMainPitch(submission.mainPitch || '');
      setMoods(submission.moods || []);
      setInstruments(submission.instruments || []);
      setPriority(submission.release?.priorityLevel || 0);
      setSocialMediaPlan(submission.socialMediaPlan || '');
      setMarketingSpend(submission.marketingDrivers || '');
      setFactSheetUrl(submission.release?.factSheetsUrl || '');
      setYoutubeShorts(submission.release?.youtubeShortsPreviews || false);
      setThisIsPlaylist(submission.release?.thisIsPlaylist || false);
      setMotionArtwork(submission.release?.motionArtwork || false);
      // Focus tracks from Track.isFocusTrack
      const focusTracks = submission.tracks?.filter((t: any) => t.isFocusTrack).map((t: any) => t.id) || [];
      setFocusTrackIds(focusTracks);
    }
  }, [submission]);

  // Save marketing data
  const saveMutation = useMutation({
    mutationFn: async (isDraft: boolean) => {
      if (!selectedId) throw new Error('No submission selected');
      const response = await fetch(`http://localhost:3001/api/submissions/${selectedId}/marketing`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hook,
          mainPitch,
          moods,
          instruments,
          socialMediaPlan,
          marketingDrivers: marketingSpend,
          release: {
            priorityLevel: priority,
            factSheetsUrl: factSheetUrl,
            youtubeShortsPreviews: youtubeShorts,
            thisIsPlaylist,
            motionArtwork
          },
          tracks: submission?.tracks.map((t: any) => ({
            ...t,
            isFocusTrack: focusTrackIds.includes(t.id)
          }))
        })
      });

      if (!response.ok) throw new Error('Failed to save');
      return response.json();
    },
    onSuccess: (data, isDraft) => {
      queryClient.invalidateQueries({ queryKey: ['submission', id] });
      queryClient.invalidateQueries({ queryKey: ['release-projects'] });

      toast.success(
        isDraft
          ? translate('임시저장 완료', 'Draft saved', '下書き保存完了')
          : translate('제출 완료', 'Submitted successfully', '提出完了')
      );

      if (!isDraft) {
        navigate('/release-projects');
      }
    },
    onError: () => {
      toast.error(translate('저장 실패', 'Save failed', '保存失敗'));
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mb-4" />
          <p className="text-gray-400">{translate('로딩 중...', 'Loading...', '読み込み中...')}</p>
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">{translate('프로젝트를 찾을 수 없습니다', 'Project not found', 'プロジェクトが見つかりません')}</p>
      </div>
    );
  }

  // If no submission selected, show album selector
  if (!selectedId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {translate('마케팅 정보 작성', 'Add Marketing Information', 'マーケティング情報を作成')}
            </h1>
            <p className="text-gray-400">
              {translate('마케팅 정보를 추가할 앨범을 선택하세요', 'Select an album to add marketing information', 'マーケティング情報を追加するアルバムを選択')}
            </p>
          </div>

          {/* Album selection cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allSubmissions.map((sub: any) => (
              <motion.button
                key={sub.id}
                onClick={() => setSelectedId(sub.id)}
                whileHover={{ scale: 1.02 }}
                className="
                  p-4 rounded-xl text-left
                  bg-white/5 backdrop-blur-md border border-white/10
                  hover:border-purple-500/50 hover:bg-white/10
                  transition-all
                "
              >
                <div className="flex items-center gap-4">
                  {sub.files?.coverImageUrl ? (
                    <img
                      src={sub.files.coverImageUrl}
                      alt={sub.albumTitle}
                      className="w-20 h-20 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                      <Music2 size={32} className="text-gray-600" />
                    </div>
                  )}

                  <div className="flex-1">
                    <h3 className="font-semibold text-white mb-1">{sub.albumTitle}</h3>
                    <p className="text-sm text-gray-400">{sub.artistName}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`
                        px-2 py-0.5 rounded text-xs font-medium
                        ${sub.hook && sub.mainPitch ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}
                      `}>
                        {sub.hook && sub.mainPitch
                          ? translate('마케팅 완료', 'Complete', '完了')
                          : translate('마케팅 필요', 'Needs Marketing', 'マーケティング必要')}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>

          {allSubmissions.length === 0 && (
            <div className="text-center py-20 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl">
              <Music2 size={64} className="mx-auto mb-4 text-gray-600" />
              <p className="text-gray-400">
                {translate('제출된 앨범이 없습니다', 'No submissions yet', '提出されたアルバムがありません')}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSelectedId(null)}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
            {translate('다른 앨범 선택', 'Select Different Album', '別のアルバムを選択')}
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() => saveMutation.mutate(true)}
              disabled={saveMutation.isPending}
              className="
                flex items-center gap-2 px-6 py-3
                bg-white/5 hover:bg-white/10
                border border-white/10
                rounded-xl font-medium text-white
                transition-all
                disabled:opacity-50
              "
            >
              <Save size={18} />
              {translate('임시저장', 'Save Draft', '下書き保存')}
            </button>

            <button
              onClick={() => saveMutation.mutate(false)}
              disabled={saveMutation.isPending || !hook || !mainPitch}
              className="
                flex items-center gap-2 px-6 py-3
                bg-gradient-to-r from-purple-500 to-pink-500
                hover:shadow-lg hover:shadow-purple-500/50
                rounded-xl font-medium text-white
                transition-all
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              <Send size={18} />
              {translate('제출', 'Submit', '提出')}
            </button>
          </div>
        </div>

        {/* Project Info Card (Read-only) */}
        <div className="p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl">
          <div className="flex items-start gap-6">
            {/* Cover Image */}
            {submission.files?.coverImageUrl ? (
              <img
                src={submission.files.coverImageUrl}
                alt={submission.albumTitle}
                className="w-32 h-32 rounded-xl object-cover border-2 border-white/10"
              />
            ) : (
              <div className="w-32 h-32 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border-2 border-white/10">
                <Music2 size={48} className="text-gray-600" />
              </div>
            )}

            {/* Info */}
            <div className="flex-1 space-y-3">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">{submission.albumTitle}</h2>
                <p className="text-lg text-gray-400">{submission.artistName}</p>
              </div>

              <div className="flex flex-wrap gap-4 text-sm">
                {submission.labelName && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <Building2 size={16} />
                    {submission.labelName}
                  </div>
                )}

                <div className="flex items-center gap-2 text-gray-400">
                  <Calendar size={16} />
                  {new Date(submission.releaseDate).toLocaleDateString()}
                </div>

                <span className={`
                  px-3 py-1 rounded-lg text-sm font-medium
                  ${submission.albumType === 'SINGLE' ? 'bg-blue-500/20 text-blue-400' :
      submission.albumType === 'EP' ? 'bg-purple-500/20 text-purple-400' :
        'bg-pink-500/20 text-pink-400'}
                `}>
                  {submission.albumType}
                </span>

                {submission.release?.upc && (
                  <span className="px-3 py-1 rounded-lg text-sm font-mono bg-white/5 text-gray-400">
                    UPC: {submission.release.upc}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Marketing Form */}
        <div className="space-y-8">
          <MarketingSection
            hook={hook}
            onHookChange={setHook}
            mainPitch={mainPitch}
            onMainPitchChange={setMainPitch}
            moods={moods}
            onMoodsChange={setMoods}
            instruments={instruments}
            onInstrumentsChange={setInstruments}
            priority={priority}
            onPriorityChange={setPriority}
            socialMediaPlan={socialMediaPlan}
            onSocialMediaPlanChange={setSocialMediaPlan}
            marketingSpend={marketingSpend}
            onMarketingSpendChange={setMarketingSpend}
            factSheetUrl={factSheetUrl}
            onFactSheetUrlChange={setFactSheetUrl}
            youtubeShorts={youtubeShorts}
            onYoutubeShortsChange={setYoutubeShorts}
            thisIsPlaylist={thisIsPlaylist}
            onThisIsPlaylistChange={setThisIsPlaylist}
            motionArtwork={motionArtwork}
            onMotionArtworkChange={setMotionArtwork}
          />

          {/* Focus Track Selection */}
          {submission.tracks && submission.tracks.length > 0 && (
            <div className="p-6 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl">
              <FocusTrackSelector
                tracks={submission.tracks}
                value={focusTrackIds}
                onChange={setFocusTrackIds}
                maxSelections={3}
              />
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-between p-6 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl sticky bottom-6">
          <div className="text-sm text-gray-400">
            {hook && mainPitch ? (
              <span className="flex items-center gap-2 text-green-400">
                <CheckCircle size={16} />
                {translate('필수 항목 완료', 'Required fields complete', '必須項目完了')}
              </span>
            ) : (
              <span className="text-yellow-400">
                {translate('Hook과 Main Pitch는 필수입니다', 'Hook and Main Pitch are required', 'フックとメインピッチは必須')}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => saveMutation.mutate(true)}
              disabled={saveMutation.isPending}
              className="
                flex items-center gap-2 px-6 py-3
                bg-white/5 hover:bg-white/10
                border border-white/10
                rounded-xl font-medium text-white
                transition-all
                disabled:opacity-50
              "
            >
              <Save size={18} />
              {translate('임시저장', 'Save Draft', '下書き保存')}
            </button>

            <button
              onClick={() => saveMutation.mutate(false)}
              disabled={saveMutation.isPending || !hook || !mainPitch}
              className="
                flex items-center gap-2 px-6 py-3
                bg-gradient-to-r from-purple-500 to-pink-500
                hover:shadow-lg hover:shadow-purple-500/50
                rounded-xl font-medium text-white
                transition-all
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              <Send size={18} />
              {translate('제출', 'Submit', '提出')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
