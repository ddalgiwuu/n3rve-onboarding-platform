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
  CheckCircle,
  User,
  Disc,
  Target,
  AlertCircle
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '@/hooks/useTranslationFixed';
import { MarketingSection } from '@/components/submission/MarketingSection';
import { FocusTrackSelector } from '@/components/submission/FocusTrackSelector';
import { PrimaryArtistSelector } from '@/components/submission/PrimaryArtistSelector';
import { GenreSelector } from '@/components/submission/GenreSelector';
import { PlatformBudgetTable } from '@/components/submission/PlatformBudgetTable';
import { MarketingDriversList } from '@/components/submission/MarketingDriversList';
import FugaArtistModal from '@/components/fuga/FugaArtistModal';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { PlatformBudget } from '@/constants/fuga-data';
import { MARKETING_TOOLTIPS } from '@/constants/marketing-tooltips';

export default function MarketingSubmission() {
  const { id: urlId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language } = useTranslation();
  const queryClient = useQueryClient();

  // Selected submission ID (from URL or dropdown)
  const [selectedId, setSelectedId] = useState<string | null>(urlId || null);

  // Translation helper
  const translate = (ko: string, en: string, ja: string = en) => {
    if (language === 'ko') return ko;
    if (language === 'ja') return ja;
    return en;
  };

  // Marketing form state - Existing fields
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

  // P0: Primary Artist (NEW)
  const [primaryArtist, setPrimaryArtist] = useState('');
  const [showArtistForm, setShowArtistForm] = useState(false);

  // P1: Project Context (NEW)
  const [frontlineOrCatalog, setFrontlineOrCatalog] = useState<'Frontline' | 'Catalog'>('Frontline');
  const [moreProductsComing, setMoreProductsComing] = useState<'Yes' | 'No' | 'Maybe'>('No');

  // P1: About The Music (NEW)
  const [privateListeningLink, setPrivateListeningLink] = useState('');
  const [mainGenre, setMainGenre] = useState('');
  const [subgenres, setSubgenres] = useState<string[]>([]);
  const [isSoundtrack, setIsSoundtrack] = useState(false);
  const [dolbyAtmos, setDolbyAtmos] = useState(false);

  // P2: Marketing Details (NEW)
  const [marketingDrivers, setMarketingDrivers] = useState<string[]>([]);
  const [platformBudgets, setPlatformBudgets] = useState<PlatformBudget[]>([]);
  const [otherNotes, setOtherNotes] = useState('');

  // Fetch all submissions (for dropdown)
  const { data: allSubmissions = [] } = useQuery({
    queryKey: ['all-submissions'],
    queryFn: async () => {
      try {
        const response = await api.get('/submissions/user', {
          params: { page: 1, limit: 100 }
        });
        // Handle paginated response
        const data = response.data;
        if (data && typeof data === 'object' && 'data' in data) {
          return Array.isArray(data.data) ? data.data : [];
        }
        return Array.isArray(data) ? data : [];
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
      const response = await api.get(`/submissions/${selectedId}`);
      return response.data;
    },
    enabled: !!selectedId
  });

  // Load existing marketing data
  useEffect(() => {
    if (submission) {
      // Existing fields
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

      // NEW: Primary Artist
      setPrimaryArtist(submission.primaryArtist || '');

      // NEW: Project Context
      setFrontlineOrCatalog(submission.frontlineOrCatalog || 'Frontline');
      setMoreProductsComing(submission.moreProductsComing || 'No');
      // projectArtwork is File type, cannot be loaded from API

      // NEW: About The Music
      setPrivateListeningLink(submission.privateListeningLink || '');
      setMainGenre(submission.mainGenre || '');
      setSubgenres(submission.subgenres || []);
      setIsSoundtrack(submission.isSoundtrack || false);
      setDolbyAtmos(submission.dolbyAtmos || false);

      // NEW: Marketing Details
      setMarketingDrivers(submission.marketingDriversList || []);
      setPlatformBudgets(submission.platformBudgets || []);
      setOtherNotes(submission.otherNotes || '');
    }
  }, [submission]);

  // Save marketing data
  const saveMutation = useMutation({
    mutationFn: async (_isDraft: boolean) => {
      if (!selectedId) throw new Error('No submission selected');

      // Prepare payload with ALL fields
      const payload = {
        // Existing fields
        hook,
        mainPitch,
        moods,
        instruments,
        socialMediaPlan,
        marketingDrivers: marketingSpend, // Legacy field name

        // NEW: Primary Artist
        primaryArtist,

        // NEW: Project Context
        frontlineOrCatalog,
        moreProductsComing,
        // projectArtwork would need separate file upload handling

        // NEW: About The Music
        privateListeningLink,
        mainGenre,
        subgenres,
        isSoundtrack,
        dolbyAtmos,

        // NEW: Marketing Details
        marketingDriversList: marketingDrivers,
        platformBudgets,
        otherNotes,

        // Release nested data
        release: {
          priorityLevel: priority,
          factSheetsUrl: factSheetUrl,
          youtubeShortsPreviews: youtubeShorts,
          thisIsPlaylist,
          motionArtwork,
          dolbyAtmos // Add to release as well
        },

        // Tracks with focus track flags
        tracks: submission?.tracks.map((t: any) => ({
          ...t,
          isFocusTrack: focusTrackIds.includes(t.id)
        }))
      };

      const response = await api.patch(`/submissions/${selectedId}/marketing`, payload);
      return response.data;
    },
    onSuccess: (_data, isDraft) => {
      queryClient.invalidateQueries({ queryKey: ['submission', selectedId] });
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
    // Light/Dark dual mode
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-6 p-8 bg-white/[0.08] dark:bg-white/[0.06] backdrop-blur-xl saturate-0 border border-white/10 dark:border-white/8 shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.06)] rounded-2xl"
          >
            <div className="w-20 h-20 mx-auto bg-red-500/20 rounded-full flex items-center justify-center">
              <AlertCircle size={48} className="text-red-400" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">
                {translate('프로젝트를 찾을 수 없습니다', 'Project not found', 'プロジェクトが見つかりません')}
              </h2>
              <p className="text-gray-400">
                {translate(
                  '요청하신 프로젝트가 존재하지 않거나 접근 권한이 없습니다.',
                  'The requested project does not exist or you do not have access.',
                  'リクエストされたプロジェクトが存在しないか、アクセス権限がありません。'
                )}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => navigate(-1)}
                className="
                  flex items-center justify-center gap-2 px-6 py-3
                  bg-white/10 hover:bg-white/20
                  border border-white/20
                  rounded-xl font-medium text-white
                  transition-all
                "
              >
                <ArrowLeft size={18} />
                {translate('이전 페이지로', 'Go Back', '前のページへ')}
              </button>

              <button
                onClick={() => navigate('/release-projects')}
                // Legacy: bg-gradient-to-r from-purple-500 to-pink-500 hover:shadow-purple-500/50
                className="
                  flex items-center justify-center gap-2 px-6 py-3
                  bg-white/15 dark:bg-white/10 hover:bg-white/20 dark:bg-white/15
                  shadow-premium hover:shadow-premium-lg
                  rounded-xl font-medium text-white
                  transition-all
                "
              >
                <Music2 size={18} />
                {translate('릴리즈 프로젝트 목록', 'Release Projects', 'リリースプロジェクト一覧')}
              </button>

              <button
                onClick={() => navigate('/')}
                className="
                  px-6 py-2 text-sm
                  text-gray-400 hover:text-white
                  transition-colors
                "
              >
                {translate('홈으로', 'Go Home', 'ホームへ')}
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // If no submission selected, show album selector
  if (!selectedId) {
    // Light/Dark dual mode
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
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
                  bg-white/[0.08] dark:bg-white/[0.06] backdrop-blur-xl saturate-0 border border-white/10 dark:border-white/8 shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.06)]
                  hover:border-blue-500/30 hover:bg-glass-dark-strong
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
                    <div className="w-20 h-20 rounded-lg bg-gray-800/50 flex items-center justify-center">
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
            <div className="text-center py-20 bg-white/[0.08] dark:bg-white/[0.06] backdrop-blur-xl saturate-0 border border-white/10 dark:border-white/8 shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.06)] rounded-2xl">
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

  // Dashboard design system background
  return (
    <div className="min-h-screen bg-transparent p-6 relative overflow-hidden">
      {/* Gradient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/[0.02] dark:bg-white/[0.03] rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-white/[0.015] dark:bg-white/[0.025] rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-black/[0.02] dark:bg-black/[0.03] rounded-full blur-3xl" />
      </div>

      {/* Noise */}
      <div
        className="fixed inset-0 opacity-[0.015] dark:opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          mixBlendMode: 'overlay'
        }}
      />

      <div className="w-full space-y-6 relative z-10">
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
              // Legacy: bg-gradient-to-r from-purple-500 to-pink-500 hover:shadow-purple-500/50
              className="
                flex items-center gap-2 px-6 py-3
                bg-white/15 dark:bg-white/10 hover:bg-white/20 dark:bg-white/15
                shadow-premium hover:shadow-premium-lg
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
        <Card className="magnetic">
          <CardContent className="p-6">
            <div className="flex items-start gap-6">
              {/* Cover Image */}
              {submission.files?.coverImageUrl ? (
                <img
                  src={submission.files.coverImageUrl}
                  alt={submission.albumTitle}
                  className="w-32 h-32 rounded-xl object-cover border-2 border-white/10"
                />
              ) : (
                <div className="w-32 h-32 rounded-xl bg-gray-800/50 flex items-center justify-center border-2 border-glass-dark">
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
                    ${submission.albumType === 'SINGLE' ? 'bg-white/15 dark:bg-white/10/20 text-blue-400' :
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
          </CardContent>
        </Card>

        {/* Marketing Form */}
        <div className="space-y-6">
          {/* NEW SECTION 0: Primary Artist */}
          <Card className="magnetic">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-surface border-modern-soft rounded-lg glass-shimmer">
                  <User size={20} className="text-blue-400" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg font-bold text-gray-900 dark:text-white">
                    {translate('주 아티스트', 'Primary Artist', 'プライマリーアーティスト')}
                  </CardTitle>
                  <CardDescription className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {translate('이 릴리즈의 주 아티스트를 선택하세요', 'Select the primary artist for this release', 'このリリースのプライマリーアーティストを選択してください')}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">

              <PrimaryArtistSelector
                value={primaryArtist}
                onChange={setPrimaryArtist}
                onShowForm={() => setShowArtistForm(true)}
              />
            </CardContent>
          </Card>

          {/* NEW SECTION 1: Project Context */}
          <Card className="magnetic">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-surface border-modern-soft rounded-lg glass-shimmer">
                  <Disc size={20} className="text-green-400" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg font-bold text-gray-900 dark:text-white">
                    {translate('프로젝트 컨텍스트', 'Project Context', 'プロジェクトコンテキスト')}
                  </CardTitle>
                  <CardDescription className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {translate('릴리즈 유형 및 향후 계획', 'Release type and future plans', 'リリースタイプと今後の計画')}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">

            <div className="space-y-6">
              {/* Frontline or Catalog */}
              <div>
                <label className="block text-sm font-medium text-white mb-3">
                  {translate('릴리즈 타입', 'Release Type', 'リリースタイプ')}
                  <span className="text-red-400 ml-1">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFrontlineOrCatalog('Frontline')}
                    className={`
                      px-4 py-3 rounded-xl border-2 transition-all
                      ${frontlineOrCatalog === 'Frontline'
                        ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:border-purple-500/50'
                      }
                    `}
                  >
                    <span className="font-medium">Frontline</span>
                    <p className="text-xs mt-1 opacity-80">
                      {translate('신곡 릴리즈', 'New release', '新曲リリース')}
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFrontlineOrCatalog('Catalog')}
                    className={`
                      px-4 py-3 rounded-xl border-2 transition-all
                      ${frontlineOrCatalog === 'Catalog'
                        ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:border-purple-500/50'
                      }
                    `}
                  >
                    <span className="font-medium">Catalog</span>
                    <p className="text-xs mt-1 opacity-80">
                      {translate('카탈로그 항목', 'Catalog item', 'カタログ項目')}
                    </p>
                  </button>
                </div>
              </div>

              {/* More Products Coming */}
              <div>
                <label className="block text-sm font-medium text-white mb-3">
                  {translate('후속 작품 계획', 'More Products Coming', '続編計画')}
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(['Yes', 'No', 'Maybe'] as const).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setMoreProductsComing(option)}
                      className={`
                        px-4 py-3 rounded-xl border-2 transition-all
                        ${moreProductsComing === option
                          ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:border-purple-500/50'
                        }
                      `}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
              </div>
            </CardContent>
          </Card>

          {/* NEW SECTION 2: About The Music */}
          <Card className="magnetic">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-surface border-modern-soft rounded-lg glass-shimmer">
                  <Music2 size={20} className="text-pink-400" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg font-bold text-gray-900 dark:text-white">
                    {translate('음악 정보', 'About The Music', '音楽について')}
                  </CardTitle>
                  <CardDescription className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {translate('장르, 무드, 악기 등', 'Genre, mood, instruments, etc.', 'ジャンル、ムード、楽器など')}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">

            <div className="space-y-6">
              {/* Genre Selector */}
              <GenreSelector
                mainGenre={mainGenre}
                subgenres={subgenres}
                onMainGenreChange={setMainGenre}
                onSubgenresChange={setSubgenres}
                maxSubgenres={3}
              />

              {/* Private Listening Link */}
              <div>
                <label className="block text-sm font-medium text-white mb-3">
                  {translate('비공개 청취 링크', 'Private Listening Link', 'プライベート試聴リンク')}
                </label>
                <input
                  type="url"
                  value={privateListeningLink}
                  onChange={(e) => setPrivateListeningLink(e.target.value)}
                  placeholder="https://..."
                  className="
                    w-full px-4 py-3 rounded-xl
                    bg-white/[0.08] dark:bg-white/[0.06] backdrop-blur-xl saturate-0 border border-white/10 dark:border-white/8 shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.06)]
                    text-white placeholder-gray-500
                    outline-none focus:ring-2 focus:ring-blue-500/50
                    transition-all
                  "
                />
              </div>

              {/* Soundtrack & Dolby Atmos */}
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:border-purple-500/30 transition-all">
                  <input
                    type="checkbox"
                    checked={isSoundtrack}
                    onChange={(e) => setIsSoundtrack(e.target.checked)}
                    className="w-5 h-5 rounded bg-white/10 border-white/20 text-purple-500 focus:ring-blue-500/50"
                  />
                  <span className="text-sm text-white">
                    {translate('사운드트랙/스코어', 'Soundtrack/Score', 'サウンドトラック/スコア')}
                  </span>
                </label>

                <label className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:border-purple-500/30 transition-all">
                  <input
                    type="checkbox"
                    checked={dolbyAtmos}
                    onChange={(e) => setDolbyAtmos(e.target.checked)}
                    className="w-5 h-5 rounded bg-white/10 border-white/20 text-purple-500 focus:ring-blue-500/50"
                  />
                  <span className="text-sm text-white">
                    {translate('Dolby Atmos', 'Dolby Atmos')}
                  </span>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

          {/* NEW SECTION 3: Marketing Drivers */}
          <Card className="magnetic">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-surface border-modern-soft rounded-lg glass-shimmer">
                  <Target size={20} className="text-orange-400" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg font-bold text-gray-900 dark:text-white">
                    {translate('마케팅 드라이버', 'Marketing Drivers', 'マーケティングドライバー')}
                  </CardTitle>
                  <CardDescription className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {translate('주요 마케팅 전략 및 실행 계획', 'Key marketing strategies and execution plans', '主要マーケティング戦略と実行計画')}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <MarketingDriversList
                drivers={marketingDrivers}
                onChange={setMarketingDrivers}
                maxDrivers={10}
                tooltip={MARKETING_TOOLTIPS.MARKETING_DRIVERS[language]}
              />
            </CardContent>
          </Card>

          {/* NEW SECTION 4: Platform Budgets */}
          <Card className="magnetic">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-surface border-modern-soft rounded-lg glass-shimmer">
                  <Target size={20} className="text-cyan-400" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg font-bold text-gray-900 dark:text-white">
                    {translate('플랫폼별 예산', 'Platform Budgets', 'プラットフォーム別予算')}
                  </CardTitle>
                  <CardDescription className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {translate('각 플랫폼의 마케팅 예산 계획', 'Marketing budget plan for each platform', '各プラットフォームのマーケティング予算計画')}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <PlatformBudgetTable
                budgets={platformBudgets}
                onChange={setPlatformBudgets}
              />
            </CardContent>
          </Card>

          {/* EXISTING: Marketing Section (Pitch, Moods, Instruments, etc.) */}
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
            <div className="p-6 bg-white/[0.08] dark:bg-white/[0.06] backdrop-blur-xl saturate-0 border border-white/10 dark:border-white/8 shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.06)] rounded-xl">
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
        <div className="flex items-center justify-between p-6 bg-white/[0.08] dark:bg-white/[0.06] backdrop-blur-xl saturate-0 border border-white/10 dark:border-white/8 shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.06)] rounded-xl sticky bottom-6">
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
              // Legacy: bg-gradient-to-r from-purple-500 to-pink-500 hover:shadow-purple-500/50
              className="
                flex items-center gap-2 px-6 py-3
                bg-white/15 dark:bg-white/10 hover:bg-white/20 dark:bg-white/15
                shadow-premium hover:shadow-premium-lg
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

      {/* Complete FUGA Artist Registration Modal */}
      <FugaArtistModal
        isOpen={showArtistForm}
        onClose={() => setShowArtistForm(false)}
        onSave={(artist) => {
          setPrimaryArtist(artist.name);
          setShowArtistForm(false);
        }}
        editingArtist={null}
      />
    </div>
  );
}
