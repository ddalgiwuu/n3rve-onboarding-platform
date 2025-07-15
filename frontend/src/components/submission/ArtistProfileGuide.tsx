import { useState } from 'react'
import { ChevronDown, Music, Smartphone, CheckCircle, TrendingUp, Share2, ExternalLink } from 'lucide-react'
import { useLanguageStore } from '@/store/language.store'
import useSafeStore from '@/hooks/useSafeStore'

export default function ArtistProfileGuide() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<'spotify' | 'apple'>('spotify')
  const language = useSafeStore(useLanguageStore, (state) => state.language)
  const t = (ko: string, en: string) => language === 'ko' ? ko : en

  return (
    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors rounded-xl"
      >
        <div className="flex items-center gap-3">
          <Music className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('아티스트 프로필 관리 가이드', 'Artist Profile Management Guide')}
          </h3>
        </div>
        <ChevronDown 
          className={`w-5 h-5 text-purple-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
        />
      </button>

      {isExpanded && (
        <div className="px-6 pb-6">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            {t('Spotify for Artists와 Apple Music for Artists에서 아티스트 프로필을 관리하는 방법을 알아보세요', 'Learn how to manage your artist profile on Spotify for Artists and Apple Music for Artists')}
          </p>

          {/* Tab Navigation */}
          <div className="flex gap-4 mb-6 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('spotify')}
              className={`pb-3 px-1 font-medium transition-colors ${
                activeTab === 'spotify'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-green-500 rounded-full" />
                {t('Spotify for Artists', 'Spotify for Artists')}
              </div>
            </button>
            <button
              onClick={() => setActiveTab('apple')}
              className={`pb-3 px-1 font-medium transition-colors ${
                activeTab === 'apple'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-gradient-to-br from-pink-500 to-red-500 rounded-full" />
                {t('Apple Music for Artists', 'Apple Music for Artists')}
              </div>
            </button>
          </div>

          {/* Content */}
          <div className="space-y-6">
            {activeTab === 'spotify' ? (
              <>
                {/* Spotify Claim Process */}
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    {t('아티스트 프로필 클레임 방법', 'How to Claim Your Artist Profile')}
                  </h4>
                  <div className="space-y-2 ml-6">
                    {[1, 2, 3, 4, 5, 6].map((step) => (
                      <p key={step} className="text-sm text-gray-600 dark:text-gray-400">
                        {step === 1 && t('1. Spotify for Artists 앱 다운로드 또는 artists.spotify.com 접속', '1. Download Spotify for Artists app or visit artists.spotify.com')}
                        {step === 2 && t('2. Spotify 계정으로 로그인', '2. Log in with your Spotify account')}
                        {step === 3 && t('3. "아티스트 프로필 클레임" 클릭', '3. Click "Claim Your Artist Profile"')}
                        {step === 4 && t('4. 아티스트 검색 후 선택', '4. Search for and select your artist')}
                        {step === 5 && t('5. 본인 확인 정보 제출 (소셜 미디어, 웹사이트 등)', '5. Submit verification information (social media, website, etc.)')}
                        {step === 6 && t('6. 승인 대기 (1-2주 소요)', '6. Wait for approval (takes 1-2 weeks)')}
                      </p>
                    ))}
                  </div>
                </div>

                {/* Spotify Verification */}
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-500" />
                    {t('프로필 인증 배지 받기', 'Get Profile Verification Badge')}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 ml-6">
                    {t('월 250명 이상의 청취자를 보유한 아티스트는 파란색 체크 표시를 받을 수 있습니다', 'Artists with 250+ monthly listeners can receive a blue checkmark')}
                  </p>
                </div>

                {/* Spotify Management */}
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-purple-500" />
                    {t('프로필 관리 기능', 'Profile Management Features')}
                  </h4>
                  <ul className="space-y-2 ml-6">
                    {['bio', 'photo', 'social', 'playlist', 'concerts'].map((item) => (
                      <li key={item} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">•</span>
                        {item === 'bio' && t('아티스트 소개 및 바이오 작성', 'Write artist bio and introduction')}
                        {item === 'photo' && t('프로필 사진 및 헤더 이미지 업로드', 'Upload profile photo and header image')}
                        {item === 'social' && t('소셜 미디어 링크 연결', 'Connect social media links')}
                        {item === 'playlist' && t('아티스트 플레이리스트 생성 및 관리', 'Create and manage artist playlists')}
                        {item === 'concerts' && t('공연 일정 등록', 'Register concert schedules')}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Spotify Link */}
                <a
                  href="https://artists.spotify.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  {t('Spotify for Artists 바로가기', 'Go to Spotify for Artists')}
                  <ExternalLink className="w-4 h-4" />
                </a>
              </>
            ) : (
              <>
                {/* Apple Music Claim Process */}
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-pink-500" />
                    {t('아티스트 프로필 클레임 방법', 'How to Claim Your Artist Profile')}
                  </h4>
                  <div className="space-y-2 ml-6">
                    {[1, 2, 3, 4, 5, 6].map((step) => (
                      <p key={step} className="text-sm text-gray-600 dark:text-gray-400">
                        {step === 1 && t('1. artists.apple.com 접속', '1. Visit artists.apple.com')}
                        {step === 2 && t('2. Apple ID로 로그인', '2. Log in with your Apple ID')}
                        {step === 3 && t('3. "아티스트 프로필 클레임" 클릭', '3. Click "Claim Your Artist Profile"')}
                        {step === 4 && t('4. 아티스트 검색 후 선택', '4. Search for and select your artist')}
                        {step === 5 && t('5. 세부 정보 및 연락처 입력', '5. Enter detailed information and contact details')}
                        {step === 6 && t('6. 승인 대기 (1-2주 소요)', '6. Wait for approval (takes 1-2 weeks)')}
                      </p>
                    ))}
                  </div>
                </div>

                {/* Apple Music Management */}
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-purple-500" />
                    {t('프로필 관리 기능', 'Profile Management Features')}
                  </h4>
                  <ul className="space-y-2 ml-6">
                    {['bio', 'photo', 'social', 'milestones'].map((item) => (
                      <li key={item} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                        <span className="text-pink-500 mt-0.5">•</span>
                        {item === 'bio' && t('아티스트 스토리 작성', 'Write artist story')}
                        {item === 'photo' && t('프로필 사진 업로드', 'Upload profile photo')}
                        {item === 'social' && t('소셜 미디어 링크 연결', 'Connect social media links')}
                        {item === 'milestones' && t('주요 이정표 하이라이트', 'Highlight key milestones')}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Apple Music Link */}
                <a
                  href="https://artists.apple.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-lg hover:from-pink-600 hover:to-red-600 transition-colors"
                >
                  {t('Apple Music for Artists 바로가기', 'Go to Apple Music for Artists')}
                  <ExternalLink className="w-4 h-4" />
                </a>
              </>
            )}

            {/* Common Tips */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Share2 className="w-4 h-4 text-purple-500" />
                {t('공통 팁', 'Common Tips')}
              </h4>
              <ul className="space-y-2 ml-6">
                {['consistency', 'quality', 'update', 'engage', 'analytics'].map((tip) => (
                  <li key={tip} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                    <span className="text-purple-500 mt-0.5">✓</span>
                    {tip === 'consistency' && t('모든 플랫폼에서 일관된 프로필 유지', 'Maintain consistent profile across all platforms')}
                    {tip === 'quality' && t('고해상도 프로필 사진 사용 (3000x3000px 이상)', 'Use high-resolution profile photos (3000x3000px or higher)')}
                    {tip === 'update' && t('신규 릴리즈 전 프로필 업데이트', 'Update profile before new releases')}
                    {tip === 'engage' && t('팬들과 소통할 수 있는 콘텐츠 공유', 'Share content that engages with fans')}
                    {tip === 'analytics' && t('통계 데이터를 확인하여 청취자 파악', 'Check analytics data to understand your audience')}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}