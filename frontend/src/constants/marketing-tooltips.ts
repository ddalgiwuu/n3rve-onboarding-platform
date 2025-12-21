// Marketing field tooltip content for best practices guidance
// Multilingual support: ko, en, ja

interface TooltipContent {
  title: string;
  description: string;
  note?: string;
}

interface MultilingualTooltip {
  ko: TooltipContent;
  en: TooltipContent;
  ja: TooltipContent;
}

export const MARKETING_TOOLTIPS: Record<string, MultilingualTooltip> = {
  ELEVATOR_PITCH: {
    ko: {
      title: '엘리베이터 피치 - 작성 가이드',
      description: `엘리베이터를 타고 이동하는 짧은 시간 동안 프로젝트를 설명한다면 무엇을 말하시겠습니까?

완벽한 엘리베이터 피치는 최대 500자의 단일 문단으로 작성됩니다. 이 트랙이 왜 중요한지를 요약하고, DSP에 명확하고 설득력 있으며 흥미로운 방식으로 음악에 대해 이야기할 수 있는 곳입니다.

다음과 같은 사항을 고려하면 유용합니다:
• 곡의 스토리는 무엇인가요?
• 이 곡을 특별하게 만드는 것은 무엇인가요?
• 곡을 홍보하기 위해 당신과 아티스트가 하고 있는 흥미로운 활동은 무엇인가요? (마케팅, 투어, 디지털 활성화, 팬 커뮤니티, D2F 전략, 프로모션)`,
      note: '특정 DSP를 언급하지 말고 플랫폼에 구애받지 않는 피치를 작성하여 폭넓은 호소력을 확보하세요.'
    },
    en: {
      title: 'Elevator Pitch - Best Practices',
      description: `If you had the duration of an elevator ride to pitch your project to someone - what would you say?

The perfect Elevator Pitch is written in one single paragraph of max 500 characters. It should be a summary of the track that details why it's so important - here's where you get to talk about your music to the DSPs in a way that should be clear, compelling and interesting.

It can be useful to think about such things as:
• What's the story of the song?
• What makes this song so special?
• What interesting things are you and the artist doing to promote the song - marketing, touring, digital activations, fan communities, D2F strategies, promo?`,
      note: 'Please avoid mentioning specific DSPs and keep your pitch platform-agnostic to ensure broad appeal.'
    },
    ja: {
      title: 'エレベーターピッチ - 作成ガイド',
      description: `エレベーターに乗っている短い時間でプロジェクトを説明するなら、何を言いますか？

完璧なエレベーターピッチは最大500文字の単一段落で書かれます。トラックがなぜ重要なのかを要約し、DSPに明確で説得力があり興味深い方法で音楽について話せる場所です。

次のような点を考慮すると役立ちます：
• 曲のストーリーは何ですか？
• この曲を特別にするものは何ですか？
• 曲を宣伝するためにあなたとアーティストが行っている興味深い活動は何ですか？（マーケティング、ツアー、デジタル活性化、ファンコミュニティ、D2F戦略、プロモ）`,
      note: '特定のDSPに言及せず、プラットフォームに依存しないピッチを作成して幅広い訴求力を確保してください。'
    }
  },

  HOOK: {
    ko: {
      title: '핵심 메시지(Hook) - 작성 가이드',
      description: `프로젝트를 판매하는 데 10초밖에 없다면 무엇을 말하시겠습니까?

이것은 최대 175자의 강력하고 주목을 끄는 단일 문장으로, 릴리즈를 흥미진진하게 만드는 요소를 즉시 요약하고 설명합니다. 가장 설득력 있는 정보만 사용하고 정말 돋보이는 것에 집중하세요.`,
      note: '헤드라인처럼 생각하세요 - DSP 편집자가 더 읽고 싶어지도록 만들어야 합니다.'
    },
    en: {
      title: 'Hook - Best Practices',
      description: `And if you had only 10 seconds to sell your project - what would you say?

This is a punchy, attention grabbing single sentence of max 175 characters that instantly summarises and explains what makes this release exciting. Use only the most compelling info here and focus on what really cuts through.`,
      note: 'Think of this as your headline - it should make DSP editors want to read more.'
    },
    ja: {
      title: 'フック - 作成ガイド',
      description: `プロジェクトを売り込むのに10秒しかなかったら、何を言いますか？

これは最大175文字の力強く注目を集める単一文で、リリースを興味深くする要素を即座に要約し説明します。最も説得力のある情報のみを使用し、本当に際立つものに焦点を当ててください。`,
      note: 'これをヘッドラインと考えてください - DSP編集者がもっと読みたくなるようにする必要があります。'
    }
  },

  MARKETING_DRIVERS: {
    ko: {
      title: '마케팅 드라이버 - 작성 가이드',
      description: `음악을 위한 영향력 있는 마케팅 드라이버 작성:

엘리베이터 피치가 음악에 대한 설득력 있는 스토리를 전달하는 반면, 마케팅 드라이버는 프로젝트를 돋보이게 하는 전략적 요소를 강조하는 명확한 포인트 세트로 제공됩니다. 이러한 드라이버를 글머리 기호로 형식화하여 엘리베이터 피치의 내러티브를 정확하게 보완합니다.

새로운 제출 구조: 관련성과 정확성에 중점:
새로운 라인별 제출 형식을 통해 글로벌하게 어필하고 타겟 지역에 특별히 맞춤화된 전략을 명확하게 표현할 수 있습니다. 이 구조화된 접근 방식은 보다 효과적인 시장 커버리지를 보장하여 현지 참여와 지원을 향상시킵니다.

영향력과 비전 입증:
소셜 미디어 지표, 파트너십, 프로모션 노력에 대한 명확한 세부 정보를 제출하여 음악의 도달 범위와 잠재력을 보여주세요. 이러한 포인트는 역사적 성과와 미래 지향적 계획을 모두 강조하여 엘리베이터 피치에서 소개된 역동적인 스토리를 더욱 풍부하게 합니다.`,
      note: '마케팅 드라이버를 명확하고 스캔 가능하게 만들기 위해 글머리 기호를 사용하세요.'
    },
    en: {
      title: 'Marketing Drivers - Best Practices',
      description: `Craft Impactful Marketing Drivers for Your Music:

While your Elevator Pitch tells a compelling story about your music, the Marketing Drivers serve as a clear set of points highlighting the strategic elements that make your project stand out. We will format these drivers into bullet points, ensuring they complement the narrative of your Elevator Pitch with precision.

New Submission Structure: Focus on Relevance and Precision:
Our new line-by-line submission format allows you to articulate strategies that appeal globally and cater specifically to targeted regions. This structured approach ensures more effective market coverage, enhancing local engagement and support.

Demonstrate Impact and Vision:
Submit clear details about your social media metrics, partnerships, and promotional efforts to illustrate your music's reach and potential. These points should highlight both your historical achievements and your forward-looking plans, further enriching the dynamic story introduced in your Elevator Pitch.`,
      note: 'Use bullet points to make your marketing drivers clear and scannable.'
    },
    ja: {
      title: 'マーケティングドライバー - 作成ガイド',
      description: `音楽のための影響力のあるマーケティングドライバーを作成：

エレベーターピッチが音楽について説得力のあるストーリーを伝える一方、マーケティングドライバーはプロジェクトを際立たせる戦略的要素を強調する明確なポイントセットとして機能します。これらのドライバーを箇条書きに形式化し、エレベーターピッチのナラティブを正確に補完します。

新しい提出構造：関連性と精度に焦点：
新しい行ごとの提出形式により、グローバルにアピールし、ターゲット地域に特化した戦略を明確に表現できます。この構造化されたアプローチにより、より効果的な市場カバレッジが保証され、地域のエンゲージメントとサポートが向上します。

影響力とビジョンを実証：
ソーシャルメディアの指標、パートナーシップ、プロモーション活動の明確な詳細を提出して、音楽のリーチと可能性を示してください。これらのポイントは、歴史的成果と将来を見据えた計画の両方を強調し、エレベーターピッチで紹介された動的なストーリーをさらに豊かにします。`,
      note: 'マーケティングドライバーを明確でスキャン可能にするために箇条書きを使用してください。'
    }
  },

  SOCIAL_MEDIA_PLAN: {
    ko: {
      title: '소셜 미디어 배포 계획 - 작성 가이드',
      description: `소셜 미디어 배포 계획에서 무엇을 찾고 있나요?

• 게시 일정: 언제, 얼마나 자주 콘텐츠를 게시할 것인가요?
• 콘텐츠 유형: 티저 비디오, 이미지, 비하인드 신 콘텐츠 또는 프로모션 그래픽을 공유할 것인가요?
• 해시태그와 키워드: 발견 가능성을 높이기 위해 관련 해시태그와 키워드를 선택하세요.
• 타겟 오디언스: 오디언스 인구통계 및 선호도를 정의하세요.
• KPI: 좋아요, 공유, 댓글, 클릭률, 전환율 등 추적할 핵심 성과 지표를 명시하세요.`,
      note: '전략과 측정 가능한 목표에 대해 구체적으로 작성하세요.'
    },
    en: {
      title: 'Social Media Rollout Plan - Best Practices',
      description: `What are we looking for in a Social Media Rollout Plan?

• Posting schedule: When and how frequently will you post content?
• Content types: Will you share teaser videos, images, behind-the-scenes content, or promotional graphics?
• Hashtags and keywords: Choose relevant hashtags and keywords to improve discoverability.
• Target audience: Define your audience demographics and preferences.
• KPIs: Specify the key performance indicators you'll track, such as likes, shares, comments, click-through rates, or conversions.`,
      note: 'Be specific about your strategy and measurable goals.'
    },
    ja: {
      title: 'ソーシャルメディア展開計画 - 作成ガイド',
      description: `ソーシャルメディア展開計画で何を求めていますか？

• 投稿スケジュール：いつ、どのくらいの頻度でコンテンツを投稿しますか？
• コンテンツタイプ：ティーザービデオ、画像、舞台裏コンテンツ、プロモーショングラフィックを共有しますか？
• ハッシュタグとキーワード：発見可能性を向上させるために関連するハッシュタグとキーワードを選択してください。
• ターゲットオーディエンス：オーディエンスの人口統計と好みを定義してください。
• KPI：いいね、シェア、コメント、クリック率、コンバージョンなど、追跡する主要業績評価指標を指定してください。`,
      note: '戦略と測定可能な目標について具体的に記述してください。'
    }
  },

  MARKETING_SPEND: {
    ko: {
      title: '마케팅 예산 - 작성 가이드',
      description: `예상 마케팅 예산을 제공하세요:

마케팅 예산은 음악의 성공을 이끄는 데 중요합니다. 이 예산에는 광고, 소셜 미디어 캠페인, 인플루언서 파트너십, 이벤트 등에 대한 투자가 포함됩니다. 이러한 노력은 새로운 청취자를 유치하고 팬을 유지하며 스트림 및 참여를 높이는 데 필수적입니다.

효과적인 분석을 위한 상세 분류:

마케팅 예산을 제공할 때 다음 핵심 사항을 고려하세요:
• DSP별 할당: Spotify, Apple Music, Amazon Music 등 각 디지털 서비스 제공업체(DSP)에 대한 마케팅 예산 금액을 명확하게 분할하세요.
• 대략적인 달러 금액: 각 DSP에 대한 대략적인 달러 금액을 제공하여 투자 규모를 이해할 수 있도록 하세요.
• 날짜 범위: 마케팅 예산이 활용될 날짜 범위를 명시하여 프로모션 활동의 기간을 파악할 수 있도록 하세요.
• 타겟 오디언스 또는 지역: 마케팅 활동으로 타겟팅하는 특정 오디언스 인구통계 또는 지역을 표시하세요.

모든 투자 영역 고려:
마케팅 예산을 추정할 때 소셜 미디어 캠페인, 이메일 마케팅, 웹사이트 및 블로그 업데이트, 콘텐츠 제작, 협업, 라이브 공연, 콘테스트, 언론 보도, 유료 광고 등 다양한 투자 영역을 고려하세요.`,
      note: 'DSP가 프로모션 의지를 이해할 수 있도록 예산 추정치에 대해 투명하고 현실적으로 작성하세요.'
    },
    en: {
      title: 'Marketing Spend - Best Practices',
      description: `Provide Your Estimated Marketing Spend:

Your marketing spend is crucial for driving the success of your music. This budget includes investments in advertising, social media campaigns, influencer partnerships, events, and more. These efforts are essential for attracting new listeners, retaining fans, and boosting streams and engagement.

Detailed Breakdown for Effective Analysis:

When providing your estimated marketing spend, consider the following key points:
• Allocate Per DSP: Clearly split your marketing spend amount for each digital service provider (DSP) such as Spotify, Apple Music, Amazon Music, etc.
• Rough Figure in Dollars: Provide an approximate amount in dollars for each DSP to help us understand your investment scale.
• Date Range: Specify the date range during which the marketing spend will be utilized, giving us insight into the timeframe of your promotional activities.
• Target Audience or Region: Indicate the specific audience demographics or regions you are targeting with your marketing efforts.

Consider All Investment Areas:
While estimating your marketing spend, think about various investment areas such as social media campaigns, email marketing, website and blog updates, content creation, collaborations, live performances, contests, press coverage, and paid advertising.`,
      note: 'Be transparent and realistic with budget estimates to help DSPs understand your promotional commitment.'
    },
    ja: {
      title: 'マーケティング予算 - 作成ガイド',
      description: `推定マーケティング予算を提供してください：

マーケティング予算は音楽の成功を推進するために重要です。この予算には、広告、ソーシャルメディアキャンペーン、インフルエンサーパートナーシップ、イベントなどへの投資が含まれます。これらの取り組みは、新しいリスナーを引き付け、ファンを維持し、ストリームとエンゲージメントを高めるために不可欠です。

効果的な分析のための詳細な内訳：

推定マーケティング予算を提供する際は、次の重要なポイントを考慮してください：
• DSPごとに割り当て：Spotify、Apple Music、Amazon Musicなど、各デジタルサービスプロバイダー（DSP）のマーケティング予算額を明確に分割してください。
• おおよその金額（ドル）：各DSPのおおよそのドル金額を提供して、投資規模を理解できるようにしてください。
• 日付範囲：マーケティング予算が活用される日付範囲を指定して、プロモーション活動の期間を把握できるようにしてください。
• ターゲットオーディエンスまたは地域：マーケティング活動でターゲットとしている特定のオーディエンス人口統計または地域を示してください。

すべての投資領域を考慮：
マーケティング予算を見積もる際は、ソーシャルメディアキャンペーン、メールマーケティング、ウェブサイトとブログの更新、コンテンツ作成、コラボレーション、ライブパフォーマンス、コンテスト、報道、有料広告など、さまざまな投資領域を考慮してください。`,
      note: 'DSPがプロモーションのコミットメントを理解できるように、予算見積もりについて透明かつ現実的に記述してください。'
    }
  }
};
