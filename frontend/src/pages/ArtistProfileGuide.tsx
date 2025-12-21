import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Image, Link, Music, CheckCircle, AlertCircle, Star, ExternalLink } from 'lucide-react';
import { useLanguageStore } from '@/store/language.store';

// Official Spotify Logo - Green Circle with White Waves
const SpotifyLogo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 496 512" fill="currentColor">
    <path d="M248 8C111.1 8 0 119.1 0 256s111.1 248 248 248 248-111.1 248-248S384.9 8 248 8zm100.7 364.9c-4.2 0-6.8-1.3-10.7-3.6-62.4-37.6-135-39.2-206.7-24.5-3.9 1-9 2.6-11.9 2.6-9.7 0-15.8-7.7-15.8-15.8 0-10.3 6.1-15.2 13.6-16.8 81.9-18.1 165.6-16.5 237 26.2 6.1 3.9 9.7 7.4 9.7 16.5s-7.1 15.4-15.2 15.4zm26.9-65.6c-5.2 0-8.7-2.3-12.3-4.2-62.5-37-155.7-51.9-238.6-29.4-4.8 1.3-7.4 2.6-11.9 2.6-10.7 0-19.4-8.7-19.4-19.4s5.2-17.8 15.5-20.7c27.8-7.8 56.2-13.6 97.8-13.6 64.9 0 127.6 16.1 177 45.5 8.1 4.8 11.3 11 11.3 19.7-.1 10.8-8.5 19.5-19.4 19.5zm31-76.2c-5.2 0-8.4-1.3-12.9-3.9-71.2-42.5-198.5-52.7-280.9-29.7-3.6 1-8.1 2.6-12.9 2.6-13.2 0-23.3-10.3-23.3-23.6 0-13.6 8.4-21.3 17.4-23.9 35.2-10.3 74.6-15.2 117.5-15.2 73 0 149.5 15.2 205.4 47.8 7.8 4.5 12.9 10.7 12.9 22.6 0 13.6-11 23.3-23.2 23.3z"/>
  </svg>
);

// Official Apple Music Logo - From Apple's Official SVG
const AppleMusicLogo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 361 361" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="SVGID_1_" gradientUnits="userSpaceOnUse" x1="180" y1="358.6047" x2="180" y2="7.7586">
        <stop offset="0" style={{ stopColor: '#FA233B' }} />
        <stop offset="1" style={{ stopColor: '#FB5C74' }} />
      </linearGradient>
    </defs>
    <path style={{ fillRule: 'evenodd', clipRule: 'evenodd', fill: 'url(#SVGID_1_)' }} d="M360,112.61c0-4.3,0-8.6-0.02-12.9c-0.02-3.62-0.06-7.24-0.16-10.86c-0.21-7.89-0.68-15.84-2.08-23.64
      c-1.42-7.92-3.75-15.29-7.41-22.49c-3.6-7.07-8.3-13.53-13.91-19.14c-5.61-5.61-12.08-10.31-19.15-13.91
      c-7.19-3.66-14.56-5.98-22.47-7.41c-7.8-1.4-15.76-1.87-23.65-2.08c-3.62-0.1-7.24-0.14-10.86-0.16C255.99,0,251.69,0,247.39,0
      H112.61c-4.3,0-8.6,0-12.9,0.02c-3.62,0.02-7.24,0.06-10.86,0.16C80.96,0.4,73,0.86,65.2,2.27c-7.92,1.42-15.28,3.75-22.47,7.41
      c-7.07,3.6-13.54,8.3-19.15,13.91c-5.61,5.61-10.31,12.07-13.91,19.14c-3.66,7.2-5.99,14.57-7.41,22.49
      c-1.4,7.8-1.87,15.76-2.08,23.64c-0.1,3.62-0.14,7.24-0.16,10.86C0,104.01,0,108.31,0,112.61v134.77c0,4.3,0,8.6,0.02,12.9
      c0.02,3.62,0.06,7.24,0.16,10.86c0.21,7.89,0.68,15.84,2.08,23.64c1.42,7.92,3.75,15.29,7.41,22.49c3.6,7.07,8.3,13.53,13.91,19.14
      c5.61,5.61,12.08,10.31,19.15,13.91c7.19,3.66,14.56,5.98,22.47,7.41c7.8,1.4,15.76,1.87,23.65,2.08c3.62,0.1,7.24,0.14,10.86,0.16
      c4.3,0.03,8.6,0.02,12.9,0.02h134.77c4.3,0,8.6,0,12.9-0.02c3.62-0.02,7.24-0.06,10.86-0.16c7.89-0.21,15.85-0.68,23.65-2.08
      c7.92-1.42,15.28-3.75,22.47-7.41c7.07-3.6,13.54-8.3,19.15-13.91c5.61-5.61,10.31-12.07,13.91-19.14
      c3.66-7.2,5.99-14.57,7.41-22.49c1.4-7.8,1.87-15.76,2.08-23.64c0.1-3.62,0.14-7.24,0.16-10.86c0.03-4.3,0.02-8.6,0.02-12.9V112.61z"/>
    <path style={{ fillRule: 'evenodd', clipRule: 'evenodd', fill: '#FFFFFF' }} d="M254.5,55c-0.87,0.08-8.6,1.45-9.53,1.64l-107,21.59l-0.04,0.01c-2.79,0.59-4.98,1.58-6.67,3
      c-2.04,1.71-3.17,4.13-3.6,6.95c-0.09,0.6-0.24,1.82-0.24,3.62c0,0,0,109.32,0,133.92c0,3.13-0.25,6.17-2.37,8.76
      c-2.12,2.59-4.74,3.37-7.81,3.99c-2.33,0.47-4.66,0.94-6.99,1.41c-8.84,1.78-14.59,2.99-19.8,5.01
      c-4.98,1.93-8.71,4.39-11.68,7.51c-5.89,6.17-8.28,14.54-7.46,22.38c0.7,6.69,3.71,13.09,8.88,17.82
      c3.49,3.2,7.85,5.63,12.99,6.66c5.33,1.07,11.01,0.7,19.31-0.98c4.42-0.89,8.56-2.28,12.5-4.61c3.9-2.3,7.24-5.37,9.85-9.11
      c2.62-3.75,4.31-7.92,5.24-12.35c0.96-4.57,1.19-8.7,1.19-13.26l0-116.15c0-6.22,1.76-7.86,6.78-9.08c0,0,88.94-17.94,93.09-18.75
      c5.79-1.11,8.52,0.54,8.52,6.61l0,79.29c0,3.14-0.03,6.32-2.17,8.92c-2.12,2.59-4.74,3.37-7.81,3.99
      c-2.33,0.47-4.66,0.94-6.99,1.41c-8.84,1.78-14.59,2.99-19.8,5.01c-4.98,1.93-8.71,4.39-11.68,7.51
      c-5.89,6.17-8.49,14.54-7.67,22.38c0.7,6.69,3.92,13.09,9.09,17.82c3.49,3.2,7.85,5.56,12.99,6.6c5.33,1.07,11.01,0.69,19.31-0.98
      c4.42-0.89,8.56-2.22,12.5-4.55c3.9-2.3,7.24-5.37,9.85-9.11c2.62-3.75,4.31-7.92,5.24-12.35c0.96-4.57,1-8.7,1-13.26V64.46
      C263.54,58.3,260.29,54.5,254.5,55z"/>
  </svg>
);

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
      color: 'bg-white/15 dark:bg-white/10',
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
      color: 'bg-white/12 dark:bg-white/8',
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
      color: 'bg-white/10 dark:bg-white/8',
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
      color: 'bg-white/8 dark:bg-white/6',
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
    <div className="min-h-screen bg-transparent p-6">
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="bg-surface backdrop-blur-2xl border-modern rounded-2xl p-8 shadow-2xl shadow-black/10 dark:shadow-black/30 magnetic">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            {t('뒤로가기', 'Back')}
          </button>

          <div className="flex items-center gap-4">
            <div className="p-4 rounded-xl bg-white/15 dark:bg-white/10 backdrop-blur-md saturate-0 border border-white/10 shadow-lg">
              <Star className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
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
          <div className="bg-surface backdrop-blur-2xl border-modern rounded-2xl p-6 shadow-2xl shadow-[#1DB954]/20 dark:shadow-[#1DB954]/30 magnetic border-l-4 border-[#1DB954]">
            <div className="flex items-center gap-4 mb-6">
              <SpotifyLogo className="w-12 h-12 text-[#1DB954]" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Spotify for Artists
              </h2>
            </div>

            <div className="space-y-6">
              {verificationSteps.spotify.map((step, index) => (
                <div key={index} className="border-l-4 border-[#1DB954] pl-4 bg-[#1DB954]/5 dark:bg-[#1DB954]/10 backdrop-blur-sm rounded-r-lg py-3">
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
                    {index + 1}. {step.title}
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 mb-3">
                    {step.description}
                  </p>
                  {step.link && (
                    <a
                      href={step.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-[#1DB954] hover:text-[#1ed760] dark:text-[#1ed760] dark:hover:text-[#1DB954] font-semibold transition-colors"
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
          <div className="bg-surface backdrop-blur-2xl border-modern rounded-2xl p-6 shadow-2xl shadow-[#FA2D48]/20 dark:shadow-[#FA2D48]/30 magnetic border-l-4 border-[#FA2D48]">
            <div className="flex items-center gap-4 mb-6">
              <AppleMusicLogo className="w-12 h-12 text-[#FA2D48]" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Apple Music for Artists
              </h2>
            </div>

            <div className="space-y-6">
              {verificationSteps.apple.map((step, index) => (
                <div key={index} className="border-l-4 border-[#FA2D48] pl-4 bg-gradient-to-r from-[#FA2D48]/5 to-[#FF6B35]/5 dark:from-[#FA2D48]/10 dark:to-[#FF6B35]/10 backdrop-blur-sm rounded-r-lg py-3">
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
                    {index + 1}. {step.title}
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 mb-3">
                    {step.description}
                  </p>
                  {step.link && (
                    <a
                      href={step.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-[#FA2D48] hover:text-[#FF6B35] dark:text-[#FF6B35] dark:hover:text-[#FA2D48] font-semibold transition-colors"
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 text-center">
            {t('프로필 구성 요소', 'Profile Elements')}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {profileElements.map((section, index) => {
              const Icon = section.icon;
              return (
                <div
                  key={index}
                  className="bg-surface backdrop-blur-2xl border-modern rounded-xl p-6 shadow-2xl shadow-black/10 dark:shadow-black/30 magnetic glass-shimmer"
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${section.color} backdrop-blur-md saturate-0 border border-white/10 shadow-lg flex-shrink-0`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">{section.title}</h3>
                      <ul className="space-y-2">
                        {section.items.map((item, itemIndex) => (
                          <li key={itemIndex} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                            <span className="text-gray-900 dark:text-white mt-1">•</span>
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
        <div className="bg-surface backdrop-blur-2xl border-modern rounded-2xl p-8 shadow-2xl shadow-black/10 dark:shadow-black/30 magnetic">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-gray-900 dark:text-white" />
            {t('모범 사례', 'Best Practices')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bestPractices.map((practice, index) => (
              <div key={index} className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-gray-900 dark:text-white mt-0.5 flex-shrink-0" />
                <p className="text-gray-700 dark:text-gray-300">{practice}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Important Notes */}
        <div className="bg-white/[0.08] dark:bg-white/[0.06] backdrop-blur-xl saturate-0 border border-white/10 dark:border-white/8 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-gray-900 dark:text-white flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                {t('중요 사항', 'Important Notes')}
              </h3>
              <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li>• {t('프로필 인증은 음악이 이미 플랫폼에 업로드된 후에만 가능합니다', 'Profile verification is only possible after your music is already on the platform')}</li>
                <li>• {t('인증 과정은 보통 48-72시간이 소요될 수 있습니다', 'Verification process usually takes 48-72 hours')}</li>
                <li>• {t('정확한 메타데이터가 있어야 프로필을 찾고 인증할 수 있습니다', 'Accurate metadata is required to find and verify your profile')}</li>
                <li>• {t('멀티 아티스트 프로젝트의 경우 각각 별도로 인증이 필요합니다', 'Multi-artist projects require separate verification for each')}</li>
              </ul>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-surface backdrop-blur-2xl border-modern rounded-2xl p-8 text-center shadow-2xl shadow-black/10 dark:shadow-black/30 magnetic glass-shimmer">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {t('지금 시작하세요!', 'Get Started Now!')}
          </h3>
          <p className="mb-6 text-gray-700 dark:text-gray-300">
            {t('아티스트 프로필을 인증하고 팬들과 더 가깝게 소통하세요', 'Verify your artist profile and connect more closely with your fans')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://artists.spotify.com/ko/claim"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#1DB954] hover:bg-[#1ed760] text-white rounded-lg transition-all font-semibold shadow-lg shadow-[#1DB954]/30 hover:shadow-xl hover:shadow-[#1DB954]/40 hover:scale-105"
            >
              <SpotifyLogo className="w-5 h-5" />
              Spotify for Artists
            </a>
            <a
              href="https://artists.apple.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#FA2D48] to-[#FF6B35] hover:from-[#FF6B35] hover:to-[#FA2D48] rounded-lg transition-all font-semibold shadow-lg shadow-[#FA2D48]/30 hover:shadow-xl hover:shadow-[#FA2D48]/40 hover:scale-105"
            >
              <AppleMusicLogo className="w-5 h-5" />
              <span className="text-white">Apple Music for Artists</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArtistProfileGuide;
