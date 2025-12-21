import { clsx } from 'clsx';
import { AIPitchEditor } from './AIPitchEditor';
import { TagMultiSelect } from '../ui/TagMultiSelect';
import { StarRating } from '../ui/StarRating';
import { CharLimitTextarea } from '../ui/CharLimitTextarea';
import { Target, DollarSign, FileText, Settings2, Youtube, Music2, Image } from 'lucide-react';
import { FUGA_MOODS, FUGA_INSTRUMENTS } from '@/constants/fuga-data';
import { MARKETING_TOOLTIPS } from '@/constants/marketing-tooltips';
import { useTranslation } from '@/hooks/useTranslationFixed';

interface MarketingSectionProps {
  // Pitch fields
  hook: string;
  onHookChange: (value: string) => void;
  mainPitch: string;
  onMainPitchChange: (value: string) => void;

  // Metadata
  moods: string[];
  onMoodsChange: (value: string[]) => void;
  instruments: string[];
  onInstrumentsChange: (value: string[]) => void;

  // Priority
  priority: number;
  onPriorityChange: (value: number) => void;

  // Campaign details
  socialMediaPlan: string;
  onSocialMediaPlanChange: (value: string) => void;
  marketingSpend: string;
  onMarketingSpendChange: (value: string) => void;
  factSheetUrl: string;
  onFactSheetUrlChange: (value: string) => void;

  // Distribution preferences
  youtubeShorts: boolean;
  onYoutubeShortsChange: (value: boolean) => void;
  thisIsPlaylist: boolean;
  onThisIsPlaylistChange: (value: boolean) => void;
  motionArtwork: boolean;
  onMotionArtworkChange: (value: boolean) => void;

  className?: string;
}

// Mood options (18 from FUGA)
const MOOD_OPTIONS = FUGA_MOODS.map((mood) => ({
  id: mood.toLowerCase().replace(/\s+/g, '-'),
  label: mood,
  category: getMoodCategory(mood)
}));

function getMoodCategory(mood: string): string {
  const energyMoods = ['Energetic', 'Fitness', 'Party', 'Motivation'];
  const emotionMoods = ['Happy', 'Romantic', 'Sad', 'Feel Good', 'Fierce', 'Sexy'];
  const relaxMoods = ['Chill', 'Meditative', 'Sleep', 'Focus'];
  const nostalgicMoods = ['Throwback', 'Feeling Blue', 'Heartbreak'];

  if (energyMoods.includes(mood)) return 'Energy';
  if (emotionMoods.includes(mood)) return 'Emotion';
  if (relaxMoods.includes(mood)) return 'Relaxation';
  if (nostalgicMoods.includes(mood)) return 'Nostalgia';
  return 'Other';
}

// Instrument options (45 from FUGA)
const INSTRUMENT_OPTIONS = FUGA_INSTRUMENTS.map((instrument) => ({
  id: instrument.toLowerCase().replace(/\s+/g, '-'),
  label: instrument,
  category: getInstrumentCategory(instrument)
}));

function getInstrumentCategory(instrument: string): string {
  const strings = ['Acoustic Guitar', 'Electric Guitar', 'Bass Guitar', 'Classical Guitar', 'Banjo', 'Mandolin', 'Ukelele', 'Violin', 'Viola', 'Cello', 'Double Bass', 'Pedal Steel Guitar'];
  const keyboards = ['Piano', 'Organ', 'Synthesizer', 'Harpsichord', 'Cembalo'];
  const percussion = ['Drum Kit', 'Marimba', 'Vibraphone', 'Xylophone', 'Djembe', 'Steel Drum'];
  const woodwinds = ['Flute', 'Clarinet', 'Oboe', 'Bassoon', 'Saxophone', 'Piccolo', 'Recorder', 'Bass Clarinet'];
  const brass = ['Trumpet', 'Trombone', 'French Horn', 'Horn'];
  const world = ['Sitar', 'Oud', 'Erhu', 'Buzuq'];
  const vocal = ['Vocals'];
  const other = ['Harp', 'Accordion', 'Harmonica', 'Orchestra', 'Samples'];

  if (strings.includes(instrument)) return 'Strings';
  if (keyboards.includes(instrument)) return 'Keyboards';
  if (percussion.includes(instrument)) return 'Percussion';
  if (woodwinds.includes(instrument)) return 'Woodwinds';
  if (brass.includes(instrument)) return 'Brass';
  if (world.includes(instrument)) return 'World';
  if (vocal.includes(instrument)) return 'Vocal';
  if (other.includes(instrument)) return 'Other';
  return 'Miscellaneous';
}

// Priority descriptions
const PRIORITY_DESCRIPTIONS = {
  1: '⭐ Specialist release or compilation',
  2: '⭐⭐ Standard release',
  3: '⭐⭐⭐ Important release',
  4: '⭐⭐⭐⭐ Very important release',
  5: '⭐⭐⭐⭐⭐ Biggest release of the year'
};

export function MarketingSection({
  hook,
  onHookChange,
  mainPitch,
  onMainPitchChange,
  moods,
  onMoodsChange,
  instruments,
  onInstrumentsChange,
  priority,
  onPriorityChange,
  socialMediaPlan,
  onSocialMediaPlanChange,
  marketingSpend,
  onMarketingSpendChange,
  factSheetUrl,
  onFactSheetUrlChange,
  youtubeShorts,
  onYoutubeShortsChange,
  thisIsPlaylist,
  onThisIsPlaylistChange,
  motionArtwork,
  onMotionArtworkChange,
  className
}: MarketingSectionProps) {
  const { language } = useTranslation();
  const translate = (ko: string, en: string, ja: string = en) => {
    if (language === 'ko') return ko;
    if (language === 'ja') return ja;
    return en;
  };

  return (
    <div className={clsx('space-y-8', className)}>
      {/* Section 1: Marketing Pitch */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <Target size={20} className="text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{translate('마케팅 피치', 'Marketing Pitch', 'マーケティングピッチ')}</h3>
            <p className="text-sm text-gray-400">{translate('DSP 편집팀을 위한 내용', 'For DSP editorial teams', 'DSP編集チーム向け')}</p>
          </div>
        </div>

        <div className="space-y-6 p-6 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl">
          <AIPitchEditor
            label={translate('핵심 메시지 (Hook)', "What's Your Hook?", 'フック')}
            value={hook}
            onChange={onHookChange}
            minChars={50}
            maxChars={175}
            placeholder={translate('릴리즈의 핵심을 한 문장으로...', 'A powerful one-sentence essence of your release...', 'リリースの本質を一文で...')}
            helpText={translate('DSP 편집자들이 가장 먼저 보는 내용입니다. 간결하고 강력하게 작성하세요.', 'DSP editors see this first. Make it compelling and concise.', 'DSP編集者が最初に見る内容です。簡潔で強力に。')}
            tooltip={MARKETING_TOOLTIPS.HOOK[language]}
          />

          <AIPitchEditor
            label={translate('메인 피치 (엘리베이터 피치)', 'The Main Pitch (Elevator Pitch)', 'メインピッチ (エレベーターピッチ)')}
            value={mainPitch}
            onChange={onMainPitchChange}
            maxChars={500}
            rows={8}
            required
            placeholder={translate('릴리즈, 협업, 특별한 점을 설명하세요...', 'Describe your release, collaboration, and what makes it special...', 'リリース、コラボレーション、特別な点を説明...')}
            helpText={translate('플레이리스트 큐레이터와 편집자를 위한 종합 요약', 'Comprehensive project summary for playlist curators and editors', 'プレイリストキュレーターと編集者向けの総合要約')}
            tooltip={MARKETING_TOOLTIPS.ELEVATOR_PITCH[language]}
          />
        </div>
      </div>

      {/* Section 2: Music Metadata */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-green-500/20 rounded-lg">
            <Music2 size={20} className="text-green-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{translate('음악 특성', 'Music Characterization', '音楽特性')}</h3>
            <p className="text-sm text-gray-400">{translate('DSP가 릴리즈를 분류할 수 있도록 도와주세요', 'Help DSPs categorize your release', 'DSPがリリースを分類できるように')}</p>
          </div>
        </div>

        <div className="space-y-6 p-6 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl">
          <TagMultiSelect
            label={translate('무드', 'Mood(s)', 'ムード')}
            placeholder={translate('최대 3개 선택...', 'Choose up to 3 moods...', '最大3つ選択...')}
            value={moods}
            onChange={onMoodsChange}
            options={MOOD_OPTIONS}
            maxSelections={3}
            required
            helpText={translate('이 릴리즈를 특징짓는 무드를 선택하세요', 'Select moods that characterize this release', 'このリリースを特徴付けるムードを選択')}
            variant="glass-enhanced"
            groupByCategory
          />

          <TagMultiSelect
            label={translate('악기', 'Instruments', '楽器')}
            placeholder={translate('주요 악기 선택...', 'Select instruments featured...', '主要楽器を選択...')}
            value={instruments}
            onChange={onInstrumentsChange}
            options={INSTRUMENT_OPTIONS}
            required
            helpText={translate('릴리즈에 등장하는 주요 악기', 'Main instruments featured in the release', 'リリースに登場する主要楽器')}
            variant="glass-enhanced"
            groupByCategory
          />

          <StarRating
            label={translate('릴리즈 우선순위', 'Release Priority', 'リリース優先順位')}
            value={priority}
            onChange={onPriorityChange}
            max={5}
            variant="glass"
            size="lg"
            descriptions={PRIORITY_DESCRIPTIONS}
            helpText={translate('팀 내부 중요도 표시자', 'Internal importance indicator for your team', 'チーム内部重要度指標')}
          />
        </div>
      </div>

      {/* Section 3: Campaign Details */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <DollarSign size={20} className="text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{translate('캠페인 상세정보', 'Campaign Details', 'キャンペーン詳細')}</h3>
            <p className="text-sm text-gray-400">{translate('마케팅 전략 및 리소스', 'Marketing strategy and resources', 'マーケティング戦略とリソース')}</p>
          </div>
        </div>

        <div className="space-y-6 p-6 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl">
          <CharLimitTextarea
            label={translate('소셜 미디어 배포 계획', 'Social Media Rollout Plan', 'ソーシャルメディア展開計画')}
            value={socialMediaPlan}
            onChange={onSocialMediaPlanChange}
            maxChars={2000}
            rows={8}
            required
            variant="glass-enhanced"
            helpText={translate('포함 내용: 게시 일정, 콘텐츠 유형, 해시태그, 타겟 오디언스, KPI', 'Include: posting schedule, content types, hashtags, target audience, KPIs', '含む内容: 投稿スケジュール、コンテンツタイプ、ハッシュタグ、ターゲット、KPI')}
            tooltip={MARKETING_TOOLTIPS.SOCIAL_MEDIA_PLAN[language]}
          />

          <CharLimitTextarea
            label={translate('마케팅 예산', 'Marketing Spend', 'マーケティング予算')}
            value={marketingSpend}
            onChange={onMarketingSpendChange}
            maxChars={1000}
            rows={6}
            variant="glass-enhanced"
            placeholder="Spotify: $X / TikTok: $X / Meta: $X / YouTube: $X / ..."
            helpText={translate('플랫폼별 예산 분할', 'Platform-by-platform budget breakdown', 'プラットフォーム別予算分割')}
            tooltip={MARKETING_TOOLTIPS.MARKETING_SPEND[language]}
          />

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              {translate('팩트 시트 / 프로젝트 덱 URL', 'Fact Sheet / Project Deck URL', 'ファクトシート / プロジェクトデックURL')}
            </label>
            <input
              type="url"
              value={factSheetUrl}
              onChange={(e) => onFactSheetUrlChange(e.target.value)}
              placeholder="https://..."
              className="
                w-full px-4 py-3 rounded-xl
                bg-white/5 backdrop-blur-md border border-white/10
                text-white placeholder-gray-500
                outline-none focus:ring-2 focus:ring-purple-500/50
                transition-all
              "
            />
            <p className="mt-1 text-xs text-gray-400">
              {translate('상세 보도자료, 아티스트 바이오, 프로젝트 덱 링크', 'Link to detailed press materials, artist bio, or project deck', '詳細なプレス資料、アーティストバイオ、プロジェクトデックへのリンク')}
            </p>
          </div>
        </div>
      </div>

      {/* Section 4: Distribution Preferences */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-pink-500/20 rounded-lg">
            <Settings2 size={20} className="text-pink-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{translate('배포 설정', 'Distribution Preferences', '配信設定')}</h3>
            <p className="text-sm text-gray-400">{translate('플랫폼별 옵션', 'Platform-specific options', 'プラットフォーム別オプション')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* YouTube Shorts */}
          <label className={clsx(
            'flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all',
            'bg-white/5 backdrop-blur-md border border-white/10',
            'hover:border-purple-500/30 hover:bg-white/10',
            youtubeShorts && 'border-purple-500/50 bg-purple-500/10'
          )}>
            <input
              type="checkbox"
              checked={youtubeShorts}
              onChange={(e) => onYoutubeShortsChange(e.target.checked)}
              className="sr-only"
            />
            <Youtube size={20} className={youtubeShorts ? 'text-purple-400' : 'text-gray-400'} />
            <div className="flex-1">
              <p className="text-sm font-medium text-white">YouTube Shorts</p>
              <p className="text-xs text-gray-400">{translate('쇼츠 프리뷰 활성화', 'Enable short previews', 'ショーツプレビュー有効化')}</p>
            </div>
            {youtubeShorts && (
              <div className="w-5 h-5 bg-purple-500 rounded flex items-center justify-center">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            )}
          </label>

          {/* This Is Playlist */}
          <label className={clsx(
            'flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all',
            'bg-white/5 backdrop-blur-md border border-white/10',
            'hover:border-green-500/30 hover:bg-white/10',
            thisIsPlaylist && 'border-green-500/50 bg-green-500/10'
          )}>
            <input
              type="checkbox"
              checked={thisIsPlaylist}
              onChange={(e) => onThisIsPlaylistChange(e.target.checked)}
              className="sr-only"
            />
            <Music2 size={20} className={thisIsPlaylist ? 'text-green-400' : 'text-gray-400'} />
            <div className="flex-1">
              <p className="text-sm font-medium text-white">{translate('"This Is" 플레이리스트', '"This Is" Playlist', '"This Is" プレイリスト')}</p>
              <p className="text-xs text-gray-400">{translate('Spotify 고정', 'Spotify pinning', 'Spotify固定')}</p>
            </div>
            {thisIsPlaylist && (
              <div className="w-5 h-5 bg-green-500 rounded flex items-center justify-center">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            )}
          </label>

          {/* Motion Artwork */}
          <label className={clsx(
            'flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all',
            'bg-white/5 backdrop-blur-md border border-white/10',
            'hover:border-pink-500/30 hover:bg-white/10',
            motionArtwork && 'border-pink-500/50 bg-pink-500/10'
          )}>
            <input
              type="checkbox"
              checked={motionArtwork}
              onChange={(e) => onMotionArtworkChange(e.target.checked)}
              className="sr-only"
            />
            <Image size={20} className={motionArtwork ? 'text-pink-400' : 'text-gray-400'} />
            <div className="flex-1">
              <p className="text-sm font-medium text-white">{translate('모션 아트워크', 'Motion Artwork', 'モーションアートワーク')}</p>
              <p className="text-xs text-gray-400">{translate('애니메이션 커버', 'Animated cover', 'アニメーションカバー')}</p>
            </div>
            {motionArtwork && (
              <div className="w-5 h-5 bg-pink-500 rounded flex items-center justify-center">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            )}
          </label>
        </div>
      </div>
    </div>
  );
}
