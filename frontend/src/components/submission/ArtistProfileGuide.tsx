import { useState } from 'react'
import { ChevronDown, Music, Smartphone, CheckCircle, TrendingUp, Share2, ExternalLink } from 'lucide-react'
import { t } from '@/store/language.store'

export default function ArtistProfileGuide() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<'spotify' | 'apple'>('spotify')

  return (
    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors rounded-xl"
      >
        <div className="flex items-center gap-3">
          <Music className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('artistProfile.title')}
          </h3>
        </div>
        <ChevronDown 
          className={`w-5 h-5 text-purple-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
        />
      </button>

      {isExpanded && (
        <div className="px-6 pb-6">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            {t('artistProfile.subtitle')}
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
                {t('artistProfile.spotify.title')}
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
                {t('artistProfile.apple.title')}
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
                    {t('artistProfile.spotify.claim')}
                  </h4>
                  <div className="space-y-2 ml-6">
                    {[1, 2, 3, 4, 5, 6].map((step) => (
                      <p key={step} className="text-sm text-gray-600 dark:text-gray-400">
                        {t(`artistProfile.spotify.claim.step${step}`)}
                      </p>
                    ))}
                  </div>
                </div>

                {/* Spotify Verification */}
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-500" />
                    {t('artistProfile.spotify.verify')}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 ml-6">
                    {t('artistProfile.spotify.verify.desc')}
                  </p>
                </div>

                {/* Spotify Management */}
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-purple-500" />
                    {t('artistProfile.spotify.manage')}
                  </h4>
                  <ul className="space-y-2 ml-6">
                    {['bio', 'photo', 'social', 'playlist', 'concerts'].map((item) => (
                      <li key={item} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">•</span>
                        {t(`artistProfile.spotify.manage.${item}`)}
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
                  {t('artistProfile.spotifyLink')}
                  <ExternalLink className="w-4 h-4" />
                </a>
              </>
            ) : (
              <>
                {/* Apple Music Claim Process */}
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-pink-500" />
                    {t('artistProfile.apple.claim')}
                  </h4>
                  <div className="space-y-2 ml-6">
                    {[1, 2, 3, 4, 5, 6].map((step) => (
                      <p key={step} className="text-sm text-gray-600 dark:text-gray-400">
                        {t(`artistProfile.apple.claim.step${step}`)}
                      </p>
                    ))}
                  </div>
                </div>

                {/* Apple Music Management */}
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-purple-500" />
                    {t('artistProfile.apple.manage')}
                  </h4>
                  <ul className="space-y-2 ml-6">
                    {['bio', 'photo', 'social', 'milestones'].map((item) => (
                      <li key={item} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                        <span className="text-pink-500 mt-0.5">•</span>
                        {t(`artistProfile.apple.manage.${item}`)}
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
                  {t('artistProfile.appleLink')}
                  <ExternalLink className="w-4 h-4" />
                </a>
              </>
            )}

            {/* Common Tips */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Share2 className="w-4 h-4 text-purple-500" />
                {t('artistProfile.tips.title')}
              </h4>
              <ul className="space-y-2 ml-6">
                {['consistency', 'quality', 'update', 'engage', 'analytics'].map((tip) => (
                  <li key={tip} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                    <span className="text-purple-500 mt-0.5">✓</span>
                    {t(`artistProfile.tips.${tip}`)}
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