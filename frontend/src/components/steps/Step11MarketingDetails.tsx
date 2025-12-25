import { useTranslation } from '@/hooks/useTranslation';
import SearchableMultiSelect from '@/components/ui/SearchableMultiSelect';
import { MOODS, INSTRUMENTS, PROJECT_TYPES, PRIORITY_LEVELS } from '@/constants/marketingData';
import { Info, Target, Music, Hash, Users, Megaphone, Globe } from 'lucide-react';

interface Step11MarketingDetailsProps {
  formData: any
  onChange: (updates: any) => void
}

export default function Step11MarketingDetails({ formData, onChange }: Step11MarketingDetailsProps) {
  const { t } = useTranslation();

  const updateMarketingInfo = (field: string, value: any) => {
    onChange({
      marketingInfo: {
        ...formData.marketingInfo,
        [field]: value
      }
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {t('마케팅 정보', 'Marketing Details', 'マーケティング情報')}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {t(
            'DSP와 마케팅을 위한 중요한 정보를 입력해주세요',
            'Enter important information for DSPs and marketing',
            'DSPとマーケティングのための重要な情報を入力してください'
          )}
        </p>
      </div>

      {/* Project Context */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-purple-600" />
          {t('프로젝트 컨텍스트', 'Project Context', 'プロジェクトコンテキスト')}
        </h3>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('프로젝트 타입', 'Project Type', 'プロジェクトタイプ')}
              <span className="text-red-500 ml-1">*</span>
            </label>
            <select
              value={formData.marketingInfo?.projectType || ''}
              onChange={(e) => updateMarketingInfo('projectType', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            >
              <option value="">{t('선택하세요', 'Select', '選択')}</option>
              {PROJECT_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('우선순위 레벨', 'Priority Level', '優先度レベル')}
            </label>
            <select
              value={formData.marketingInfo?.priorityLevel || ''}
              onChange={(e) => updateMarketingInfo('priorityLevel', parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">{t('선택하세요', 'Select', '選択')}</option>
              {PRIORITY_LEVELS.map(level => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Moods & Instruments */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Music className="w-5 h-5 text-blue-600" />
          {t('음악 특성', 'Music Characteristics', '音楽特性')}
        </h3>

        <div className="space-y-6">
          <SearchableMultiSelect
            label={t('무드', 'Moods', 'ムード')}
            options={MOODS}
            value={formData.marketingInfo?.moods || []}
            onChange={(value) => updateMarketingInfo('moods', value)}
            placeholder={t('이 릴리즈를 특징짓는 무드를 선택하세요', 'Choose moods that characterise this release', 'このリリースを特徴づけるムードを選択')}
            maxItems={3}
            required
          />

          <SearchableMultiSelect
            label={t('악기', 'Instruments', '楽器')}
            options={INSTRUMENTS}
            value={formData.marketingInfo?.instruments || []}
            onChange={(value) => updateMarketingInfo('instruments', value)}
            placeholder={t('이 레코드에 사용된 악기는 무엇입니까?', 'What instruments are used on this record?', 'このレコードで使用されている楽器は？')}
            required
          />
        </div>
      </div>

      {/* Elevator Pitch */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-green-600" />
          {t('엘리베이터 피치', 'Elevator Pitch', 'エレベーターピッチ')}
        </h3>

        <div className="space-y-6">
          {/* Hook */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t("What's Your Hook?", "What's Your Hook?", 'フックは何ですか？')}
              <span className="text-red-500 ml-1">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.marketingInfo?.hook || ''}
                onChange={(e) => updateMarketingInfo('hook', e.target.value)}
                maxLength={175}
                placeholder={t(
                  '이 프로젝트를 흥미롭고 독특하게 만드는 것은 무엇입니까?',
                  'What makes this project exciting, unique, or newsworthy?',
                  'このプロジェクトを興味深く、ユニークにするものは何ですか？'
                )}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
              <span className="absolute right-3 bottom-2 text-xs text-gray-500">
                {(formData.marketingInfo?.hook || '').length} / 175
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {t(
                '즉시 주목을 끌 수 있는 한두 문장으로 릴리즈를 설명하세요',
                'Describe your release in one or two sentences that instantly capture attention',
                'すぐに注目を集める1〜2文でリリースを説明してください'
              )}
            </p>
          </div>

          {/* Main Pitch */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('메인 피치', 'The Main Pitch', 'メインピッチ')}
              <span className="text-red-500 ml-1">*</span>
            </label>
            <div className="relative">
              <textarea
                value={formData.marketingInfo?.mainPitch || ''}
                onChange={(e) => updateMarketingInfo('mainPitch', e.target.value)}
                maxLength={500}
                rows={4}
                placeholder={t(
                  '프로젝트의 본질, 스토리, 영향력, 비전을 500자 이내로 요약하세요',
                  'Deliver a concise and compelling summary that captures the essence of your project—its story, impact, and vision—all within 500 characters',
                  'プロジェクトの本質、ストーリー、インパクト、ビジョンを500文字以内で要約してください'
                )}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                required
              />
              <span className="absolute right-3 bottom-2 text-xs text-gray-500">
                {(formData.marketingInfo?.mainPitch || '').length} / 500
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Marketing Drivers */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-orange-600" />
          {t('마케팅 드라이버', 'Marketing Drivers', 'マーケティングドライバー')}
        </h3>

        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
            <div className="flex gap-2">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900 dark:text-blue-100">
                <p className="font-semibold mb-1">
                  {t('마케팅 드라이버 작성법', 'Creating Impactful Marketing Drivers', 'インパクトのあるマーケティングドライバーの作成')}
                </p>
                <p>
                  {t(
                    '프로젝트를 돋보이게 만드는 전략적 요소를 강조하는 명확한 포인트를 작성하세요. 각 드라이버는 새 줄에 작성하면 자동으로 불릿 포인트로 변환됩니다.',
                    'Craft clear points highlighting the strategic elements that make your project stand out. Write each driver on a new line - they will be formatted as bullet points.',
                    'プロジェクトを際立たせる戦略的要素を強調する明確なポイントを作成してください。各ドライバーを新しい行に書くと、自動的に箇条書きに変換されます。'
                  )}
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('마케팅 드라이버', 'Marketing Drivers', 'マーケティングドライバー')}
              <span className="text-red-500 ml-1">*</span>
            </label>
            <textarea
              value={formData.marketingInfo?.marketingDrivers?.join('\n') || ''}
              onChange={(e) => updateMarketingInfo('marketingDrivers', e.target.value.split('\n').filter(line => line.trim()))}
              rows={6}
              placeholder={t(
                '예시:\n소셜 미디어에서 100만 팔로워 보유\n주요 브랜드와의 파트너십 확정\n이전 싱글 1000만 스트리밍 달성\n전국 투어 예정',
                'Example:\n1M+ followers across social media\nConfirmed partnerships with major brands\nPrevious single reached 10M streams\nUpcoming national tour',
                '例:\nソーシャルメディアで100万人以上のフォロワー\n主要ブランドとのパートナーシップ確定\n前のシングルが1000万ストリーミング達成\n全国ツアー予定'
              )}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
              required
            />
          </div>
        </div>
      </div>

      {/* Social Media Plan */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 relative z-0">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Globe className="w-5 h-5 text-pink-600" />
          {t('소셜 미디어 계획', 'Social Media Rollout Plan', 'ソーシャルメディア計画')}
        </h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('소셜 미디어 롤아웃 계획', 'Your Social Media Rollout Plan', 'ソーシャルメディア展開計画')}
            <span className="text-red-500 ml-1">*</span>
          </label>
          <textarea
            value={formData.marketingInfo?.socialMediaPlan || ''}
            onChange={(e) => updateMarketingInfo('socialMediaPlan', e.target.value)}
            rows={4}
            placeholder={t(
              '게시 일정, 콘텐츠 유형, 해시태그, 타겟 청중, KPI 등을 포함한 소셜 미디어 전략을 설명하세요',
              'Describe your social media strategy including posting schedule, content types, hashtags, target audience, and KPIs',
              '投稿スケジュール、コンテンツタイプ、ハッシュタグ、ターゲットオーディエンス、KPIを含むソーシャルメディア戦略を説明してください'
            )}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
            required
          />
        </div>
      </div>

      {/* Additional Information */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 relative z-0">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-600" />
          {t('추가 정보', 'Additional Information', '追加情報')}
        </h3>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('타겟 청중', 'Target Audience', 'ターゲットオーディエンス')}
            </label>
            <input
              type="text"
              value={formData.marketingInfo?.targetAudience || ''}
              onChange={(e) => updateMarketingInfo('targetAudience', e.target.value)}
              placeholder={t('예: 18-24세 K-pop 팬', 'e.g., 18-24 K-pop fans', '例：18-24歳のK-popファン')}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('마케팅 키워드', 'Marketing Keywords', 'マーケティングキーワード')}
            </label>
            <input
              type="text"
              value={formData.marketingInfo?.marketingKeywords || ''}
              onChange={(e) => updateMarketingInfo('marketingKeywords', e.target.value)}
              placeholder={t('쉼표로 구분', 'Comma separated', 'カンマ区切り')}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('유사 아티스트', 'Similar Artists', '類似アーティスト')}
            </label>
            <input
              type="text"
              value={formData.marketingInfo?.similarArtists?.join(', ') || ''}
              onChange={(e) => updateMarketingInfo('similarArtists', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
              placeholder={t('쉼표로 구분', 'Comma separated', 'カンマ区切り')}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('아티스트 성별', 'Artist Gender', 'アーティストの性別')}
            </label>
            <select
              value={formData.marketingInfo?.artistGender || ''}
              onChange={(e) => updateMarketingInfo('artistGender', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">{t('선택하세요', 'Select', '選択')}</option>
              <option value="male">{t('남성', 'Male', '男性')}</option>
              <option value="female">{t('여성', 'Female', '女性')}</option>
              <option value="non-binary">{t('논바이너리', 'Non-binary', 'ノンバイナリー')}</option>
              <option value="other">{t('기타', 'Other', 'その他')}</option>
            </select>
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('아티스트 소개', 'Artist Bio', 'アーティスト紹介')}
          </label>
          <textarea
            value={formData.marketingInfo?.artistBio || ''}
            onChange={(e) => updateMarketingInfo('artistBio', e.target.value)}
            rows={4}
            placeholder={t(
              '아티스트의 배경, 스타일, 성과 등을 설명하세요',
              'Describe the artist background, style, achievements, etc.',
              'アーティストの背景、スタイル、実績などを説明してください'
            )}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
          />
        </div>
      </div>

      {/* Social Media Links */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Hash className="w-5 h-5 text-blue-600" />
          {t('소셜 미디어 링크', 'Social Media Links', 'ソーシャルメディアリンク')}
        </h3>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              YouTube
            </label>
            <input
              type="url"
              value={formData.marketingInfo?.youtubeUrl || ''}
              onChange={(e) => updateMarketingInfo('youtubeUrl', e.target.value)}
              placeholder="https://youtube.com/@artistname"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              TikTok
            </label>
            <input
              type="url"
              value={formData.marketingInfo?.tiktokUrl || ''}
              onChange={(e) => updateMarketingInfo('tiktokUrl', e.target.value)}
              placeholder="https://tiktok.com/@artistname"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              X (Twitter)
            </label>
            <input
              type="url"
              value={formData.marketingInfo?.xUrl || ''}
              onChange={(e) => updateMarketingInfo('xUrl', e.target.value)}
              placeholder="https://x.com/artistname"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Twitch
            </label>
            <input
              type="url"
              value={formData.marketingInfo?.twitchUrl || ''}
              onChange={(e) => updateMarketingInfo('twitchUrl', e.target.value)}
              placeholder="https://twitch.tv/artistname"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Threads
            </label>
            <input
              type="url"
              value={formData.marketingInfo?.threadsUrl || ''}
              onChange={(e) => updateMarketingInfo('threadsUrl', e.target.value)}
              placeholder="https://threads.net/@artistname"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              SoundCloud Artist ID
            </label>
            <input
              type="text"
              value={formData.marketingInfo?.soundcloudArtistId || ''}
              onChange={(e) => updateMarketingInfo('soundcloudArtistId', e.target.value)}
              placeholder="soundcloud-artist-id"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
