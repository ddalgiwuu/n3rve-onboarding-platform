import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Image, Link, Music, CheckCircle, AlertCircle, Star, ExternalLink, Apple } from 'lucide-react';
import { useLanguageStore } from '@/store/language.store';

const ArtistProfileGuide = () => {
  const navigate = useNavigate();
  const { language } = useLanguageStore();
  const t = (ko: string, en: string) => language === 'ko' ? ko : en;

  const verificationSteps = {
    spotify: [
      {
        title: t('아티스트 프로필 인증받기', 'Claim Your Artist Profile'),
        description: t(
          '이미 스포티파이에 음악이 올라와 있다면, Spotify for Artists 웹사이트로 가서 "아티스트 또는 매니저"를 선택한 후, 소셜 미디어 채널이나 배급사가 제공한 링크를 이용해 프로필을 인증받을 수 있습니다.',
          'If your music is already on Spotify, go to Spotify for Artists website and select "Artist or Manager", then verify your profile using social media channels or links provided by your distributor.'
        ),
        link: 'https://artists.spotify.com/ko/claim',
        linkText: t('프로필 인증하기', 'Claim Profile')
      },
      {
        title: t('프로필 이미지와 바이오 업데이트', 'Update Profile Image and Bio'),
        description: t(
          '프로필 인증 후, Spotify for Artists 대시보드에서 아바타를 추가하거나 업데이트하고, 바이오를 작성할 수 있습니다. 또한, 아티스트 픽과 피처드 플레이리스트 같은 다양한 아티스트 페이지 요소를 관리할 수 있습니다.',
          'After verification, you can add or update your avatar and write your bio in the Spotify for Artists dashboard. You can also manage various artist page elements like Artist Pick and Featured Playlists.'
        )
      },
      {
        title: t('소셜 미디어 계정 링크 추가', 'Add Social Media Links'),
        description: t(
          'Spotify for Artists 대시보드에서 "프로필" 탭을 통해 소셜 미디어 프로필 링크를 추가할 수 있습니다. 여기에서 아티스트 페이지의 다른 개인 설정 요소도 관리할 수 있습니다.',
          'In the Spotify for Artists dashboard, you can add social media profile links through the "Profile" tab. Here you can also manage other personalization elements of your artist page.'
        )
      }
    ],
    apple: [
      {
        title: t('Apple Music for Artists 접속', 'Access Apple Music for Artists'),
        description: t(
          'Apple Music for Artists에 접속하여 Apple ID로 로그인합니다. 이미 Apple Music에 음악이 있어야 프로필을 인증할 수 있습니다.',
          'Access Apple Music for Artists and sign in with your Apple ID. Your music must already be on Apple Music to claim your profile.'
        ),
        link: 'https://artists.apple.com',
        linkText: t('Apple Music for Artists', 'Apple Music for Artists')
      },
      {
        title: t('아티스트 프로필 검색 및 인증', 'Search and Claim Your Profile'),
        description: t(
          '아티스트 이름을 검색하여 프로필을 찾고, "Request Access" 버튼을 클릭합니다. 본인 확인을 위해 추가 정보를 제공해야 할 수 있습니다.',
          'Search for your artist name to find your profile, then click "Request Access". You may need to provide additional information for verification.'
        )
      },
      {
        title: t('프로필 커스터마이즈', 'Customize Your Profile'),
        description: t(
          '승인 후 아티스트 이미지, 바이오, 소셜 링크를 추가하고, 실시간 데이터와 분석을 확인할 수 있습니다. Milestones와 Featured Content도 관리할 수 있습니다.',
          'After approval, you can add artist images, bio, social links, and view real-time data and analytics. You can also manage Milestones and Featured Content.'
        )
      }
    ]
  };

  const profileElements = [
    {
      icon: User,
      title: t('기본 정보', 'Basic Information'),
      color: 'from-purple-500 to-pink-500',
      items: [
        t('아티스트 이름 (정확한 표기)', 'Artist Name (Accurate Spelling)'),
        t('아티스트 바이오그래피 (500자 이상 권장)', 'Artist Biography (500+ characters recommended)'),
        t('장르 및 스타일 정의', 'Genre and Style Definition'),
        t('활동 지역 및 국가', 'Location and Country')
      ]
    },
    {
      icon: Image,
      title: t('비주얼 자산', 'Visual Assets'),
      color: 'from-blue-500 to-cyan-500',
      items: [
        t('고해상도 프로필 사진 (최소 2400x2400px)', 'High-res Profile Photo (min 2400x2400px)'),
        t('배너/커버 이미지', 'Banner/Cover Image'),
        t('일관된 비주얼 아이덴티티', 'Consistent Visual Identity'),
        t('프로페셔널한 사진 퀄리티', 'Professional Photo Quality')
      ]
    },
    {
      icon: Link,
      title: t('소셜 미디어 연동', 'Social Media Integration'),
      color: 'from-green-500 to-emerald-500',
      items: [
        t('Instagram, Twitter, Facebook 링크', 'Instagram, Twitter, Facebook Links'),
        t('YouTube 채널 연결', 'YouTube Channel Connection'),
        t('공식 웹사이트 URL', 'Official Website URL'),
        t('TikTok 및 기타 플랫폼', 'TikTok and Other Platforms')
      ]
    },
    {
      icon: Music,
      title: t('음악 카탈로그 관리', 'Music Catalog Management'),
      color: 'from-orange-500 to-red-500',
      items: [
        t('정확한 디스코그래피 정보', 'Accurate Discography Information'),
        t('피처링 및 협업 크레딧', 'Featured and Collaboration Credits'),
        t('작곡/작사 크레딧 표시', 'Songwriting/Production Credits'),
        t('앨범 아트워크 일관성', 'Album Artwork Consistency')
      ]
    }
  ];

  const bestPractices = [
    t('정기적으로 프로필을 업데이트하여 최신 정보 유지', 'Regularly update your profile to keep information current'),
    t('팬들과 소통할 수 있는 콘텐츠 게시', 'Post content that engages with your fans'),
    t('SEO를 고려한 키워드 사용 (장르, 스타일, 관련 아티스트)', 'Use SEO-friendly keywords (genre, style, related artists)'),
    t('진정성 있고 개인적인 스토리 공유', 'Share authentic and personal stories'),
    t('고퀄리티 비주얼 자산 사용', 'Use high-quality visual assets'),
    t('모든 플랫폼에서 일관된 브랜딩 유지', 'Maintain consistent branding across all platforms')
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            {t('뒤로가기', 'Back')}
          </button>

          <div className="flex items-center gap-4">
            <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg">
              <Star className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                {t('아티스트 프로필 가이드', 'Artist Profile Guide')}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {t('스포티파이와 애플뮤직에서 아티스트 프로필을 인증하고 관리하는 방법', 'How to verify and manage your artist profile on Spotify and Apple Music')}
              </p>
            </div>
          </div>
        </div>

        {/* Platform Verification Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Spotify Section */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-green-500 rounded-xl">
                <Music className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Spotify for Artists
              </h2>
            </div>

            <div className="space-y-6">
              {verificationSteps.spotify.map((step, index) => (
                <div key={index} className="border-l-4 border-green-500 pl-4">
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
                    {index + 1}. {step.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-3">
                    {step.description}
                  </p>
                  {step.link && (
                    <a
                      href={step.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 font-medium"
                    >
                      <ExternalLink className="w-4 h-4" />
                      {step.linkText}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Apple Music Section */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gray-800 dark:bg-gray-700 rounded-xl">
                <Apple className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Apple Music for Artists
              </h2>
            </div>

            <div className="space-y-6">
              {verificationSteps.apple.map((step, index) => (
                <div key={index} className="border-l-4 border-gray-700 dark:border-gray-600 pl-4">
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
                    {index + 1}. {step.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-3">
                    {step.description}
                  </p>
                  {step.link && (
                    <a
                      href={step.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-gray-700 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 font-medium"
                    >
                      <ExternalLink className="w-4 h-4" />
                      {step.linkText}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Profile Elements */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center">
            {t('프로필 구성 요소', 'Profile Elements')}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {profileElements.map((section, index) => {
              const Icon = section.icon;
              return (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-r ${section.color} shadow-lg flex-shrink-0`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">{section.title}</h3>
                      <ul className="space-y-2">
                        {section.items.map((item, itemIndex) => (
                          <li key={itemIndex} className="flex items-start gap-2 text-gray-600 dark:text-gray-400">
                            <span className="text-purple-500 mt-1">•</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Best Practices */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-purple-500" />
            {t('모범 사례', 'Best Practices')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bestPractices.map((practice, index) => (
              <div key={index} className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <p className="text-gray-600 dark:text-gray-400">{practice}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Important Notes */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-900 dark:text-amber-200 mb-2">
                {t('중요 사항', 'Important Notes')}
              </h3>
              <ul className="space-y-2 text-sm text-amber-800 dark:text-amber-300">
                <li>• {t('프로필 인증은 음악이 이미 플랫폼에 업로드된 후에만 가능합니다', 'Profile verification is only possible after your music is already on the platform')}</li>
                <li>• {t('인증 과정은 보통 48-72시간이 소요될 수 있습니다', 'Verification process usually takes 48-72 hours')}</li>
                <li>• {t('정확한 메타데이터가 있어야 프로필을 찾고 인증할 수 있습니다', 'Accurate metadata is required to find and verify your profile')}</li>
                <li>• {t('멀티 아티스트 프로젝트의 경우 각각 별도로 인증이 필요합니다', 'Multi-artist projects require separate verification for each')}</li>
              </ul>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-4">
            {t('지금 시작하세요!', 'Get Started Now!')}
          </h3>
          <p className="mb-6 opacity-90">
            {t('아티스트 프로필을 인증하고 팬들과 더 가깝게 소통하세요', 'Verify your artist profile and connect more closely with your fans')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://artists.spotify.com/ko/claim"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-colors font-medium"
            >
              <Music className="w-5 h-5" />
              Spotify for Artists
            </a>
            <a
              href="https://artists.apple.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
            >
              <Apple className="w-5 h-5" />
              Apple Music for Artists
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArtistProfileGuide;
