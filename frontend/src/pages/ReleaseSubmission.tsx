import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguageStore, useTranslation } from '@/store/language.store'
import { 
  Upload, Music, FileText, Image, CheckCircle, AlertCircle, X, Plus, Trash2, 
  Globe, Target, Sparkles, Users, MapPin, Calendar, Shield, Languages, Disc, 
  Building2, Radio, ListMusic, ChevronRight, ChevronLeft, Info, Search,
  Music2, Mic, UserCheck, GripVertical, Edit3, Volume2, BookOpen, Megaphone,
  Tag, Heart, Link as LinkIcon, Video, Download, Eye, Clock, Package,
  HelpCircle, ChevronDown, ChevronUp, ExternalLink
} from 'lucide-react'
import toast from 'react-hot-toast'
import { submissionService } from '@/services/submission.service'
import { dropboxService } from '@/services/dropbox.service'
import { useAuthStore } from '@/store/auth.store'
import Button from '@/components/ui/Button'
import Checkbox from '@/components/ui/Checkbox'
import { v4 as uuidv4 } from 'uuid'
import { contributorRoles, getRolesByCategory, searchRoles } from '@/constants/contributorRoles'
import { instrumentList, searchInstruments, getInstrumentCategory } from '@/constants/instruments'
import { helpTexts, tooltips, errorExplanations } from '@/constants/helpTexts'
import { fugaQCHelp, qcResultGuide, qcFAQ } from '@/constants/fugaQCHelp'
import { timezones, convertToUTC, formatUTCInTimezone, getCurrentTimezone, releaseTimeHelp } from '@/constants/timezones'
import FugaQCHelpModal from '@/components/modals/FugaQCHelpModal'

// Types
interface Translation {
  id: string
  language: string
  text: string
}

interface ArtistIdentifier {
  type: string
  value: string
}

interface Artist {
  id: string
  primaryName: string
  translations: Translation[]
  isNewArtist: boolean
  countryOfOrigin?: string
  bookingAgent?: string
  customIdentifiers: ArtistIdentifier[]
  role: 'main' | 'featuring'
  youtubeChannelId?: string
  spotifyId?: string
  appleMusicId?: string
}

interface Member {
  id: string
  name: string
  role: string
  translations: Translation[]
  spotifyUrl?: string
  appleMusicUrl?: string
}

interface ContributorTranslation {
  language: string
  name: string
}

interface Contributor {
  id: string
  name: string
  translations: ContributorTranslation[]
  roles: string[]
  instruments: string[]
  appleMusicUrl?: string
  spotifyUrl?: string
}

interface TrackTranslation {
  id: string
  language: string
  title: string
}

interface Track {
  id: string
  title: string
  translations: TrackTranslation[]
  artists: Artist[]
  featuringArtists: Artist[]
  contributors: Contributor[]
  isTitle: boolean
  hasCustomReleaseDate?: boolean
  consumerReleaseDate?: string
  releaseTime?: string
  dolbyAtmos?: boolean
  stereo?: boolean
  audioFiles?: string[]
  genre?: string
  subgenre?: string
  alternateGenre?: string
  alternateSubgenre?: string
  lyrics?: string
  audioLanguage?: string
  metadataLanguage?: string
  explicitContent?: boolean
  playtimeStartShortClip?: number
  previewLength?: number
  isrc?: string
  trackType?: 'audio' | 'music_video'
  version?: string
  lyricist?: string
  composer?: string
  arranger?: string
  producer?: string
}

// Language options
const languageOptions = [
  { value: 'ko', label: '한국어' },
  { value: 'en', label: 'English' },
  { value: 'ja', label: '日本語' },
  { value: 'zh-CN', label: '中文 (简体)' },
  { value: 'zh-TW', label: '中文 (繁體)' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'it', label: 'Italiano' },
  { value: 'pt', label: 'Português' },
  { value: 'ru', label: 'Русский' },
  { value: 'ar', label: 'العربية' },
  { value: 'hi', label: 'हिन्दी' },
  { value: 'th', label: 'ไทย' },
  { value: 'vi', label: 'Tiếng Việt' },
  { value: 'id', label: 'Bahasa Indonesia' },
  { value: 'ms', label: 'Bahasa Melayu' },
  { value: 'tr', label: 'Türkçe' },
  { value: 'pl', label: 'Polski' },
  { value: 'nl', label: 'Nederlands' }
]

// Genre options
const genreOptions = [
  'Alternative', 'Blues', 'Classical', 'Country', 'Electronic', 'Folk',
  'Hip-Hop/Rap', 'Jazz', 'K-Pop', 'Latin', 'Metal', 'Pop', 'R&B/Soul',
  'Reggae', 'Rock', 'Soundtrack', 'World', 'Dance', 'Indie', 'Gospel'
]

// Album type options
const albumTypeOptions = [
  { value: 'single', label: '싱글', description: '1-3곡' },
  { value: 'ep', label: 'EP', description: '4-6곡' },
  { value: 'album', label: '정규 앨범', description: '7곡 이상' }
]

// Marketing fields based on the 31 fields mentioned
const marketingFields = {
  genre: ['marketingGenre', 'marketingSubgenre'],
  tags: ['marketingTags', 'similarArtists'],
  pitch: ['marketingAngle', 'pressRelease'],
  budget: ['marketingBudget'],
  social: ['socialMediaCampaign', 'spotifyPitching', 'appleMusicPitching', 'tiktokStrategy', 
           'youtubeStrategy', 'instagramStrategy', 'facebookStrategy', 'twitterStrategy'],
  outreach: ['influencerOutreach', 'playlistTargets', 'radioTargets', 'pressTargets'],
  events: ['tourDates'],
  products: ['merchandising', 'specialEditions'],
  content: ['musicVideoPlans', 'behindTheScenes', 'documentaryPlans'],
  digital: ['nftStrategy', 'metaverseActivations'],
  partnerships: ['brandPartnerships', 'syncOpportunities']
}

export default function ReleaseSubmission() {
  const { t } = useTranslation()
  const { language } = useLanguageStore()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [currentSection, setCurrentSection] = useState<'album' | 'asset' | 'marketing'>('album')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showQCWarnings, setShowQCWarnings] = useState(false)
  const [showQCHelp, setShowQCHelp] = useState(false)
  const [showArtistHelp, setShowArtistHelp] = useState(false)
  const [showSpotifyHelp, setShowSpotifyHelp] = useState(false)
  const [showAppleHelp, setShowAppleHelp] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    // Album (Product Level) Section
    albumTitle: '',
    albumTranslations: [] as Translation[],
    albumType: 'single' as 'single' | 'ep' | 'album',
    // Release dates and times
    consumerReleaseDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 weeks from now
    consumerReleaseTime: '00:00',
    originalReleaseDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Same as consumer for new releases
    originalReleaseTime: '00:00',
    timezone: getCurrentTimezone(),
    isRerelease: false, // Track if this is a re-release/remix
    albumCoverArt: null as File | null,
    albumCoverArtUrl: '',
    albumDescription: '',
    albumDescriptionTranslations: [] as Translation[],
    recordLabel: '',
    catalogNumber: '',
    territories: [] as string[],
    excludedTerritories: [] as string[],
    digitalReleaseDate: '',
    physicalReleaseDate: '',
    preOrderDate: '',
    copyrightYear: new Date().getFullYear().toString(),
    copyrightOwner: '',
    publishingRights: '',
    masterRights: '',
    upc: '',
    licenses: [] as { type: string; territory: string; details: string }[],
    parentalAdvisory: false,
    distributionPlatforms: {
      spotify: true,
      appleMusic: true,
      youtube: true,
      amazonMusic: true,
      tidal: false,
      deezer: false,
      soundcloud: false,
      bandcamp: false,
      audiomack: false,
      kkbox: false,
      lineMusic: false,
      qq: false,
      netease: false,
      joox: false,
      boomplay: false,
      anghami: false,
      yandex: false,
      vk: false,
      custom: [] as string[]
    },
    pricing: {
      defaultPrice: '9.99',
      currency: 'USD',
      territoryPricing: {} as Record<string, { price: string; currency: string }>
    },
    
    // Asset Level Section
    artists: [] as Artist[],
    bandMembers: [] as Member[],
    tracks: [] as Track[],
    albumContributors: [] as Contributor[],
    audioFiles: {} as Record<string, File[]>,
    isrcCodes: {} as Record<string, string>,
    
    // Marketing Section
    marketingGenre: '',
    marketingSubgenre: '',
    marketingTags: [] as string[],
    similarArtists: [] as string[],
    marketingAngle: '',
    pressRelease: '',
    marketingBudget: '',
    socialMediaCampaign: '',
    spotifyPitching: '',
    appleMusicPitching: '',
    tiktokStrategy: '',
    youtubeStrategy: '',
    instagramStrategy: '',
    facebookStrategy: '',
    twitterStrategy: '',
    influencerOutreach: '',
    playlistTargets: [] as string[],
    radioTargets: [] as string[],
    pressTargets: [] as string[],
    tourDates: [] as { date: string; venue: string; city: string }[],
    merchandising: '',
    specialEditions: '',
    musicVideoPlans: '',
    behindTheScenes: '',
    documentaryPlans: '',
    nftStrategy: '',
    metaverseActivations: '',
    brandPartnerships: '',
    syncOpportunities: '',
    
    // Submission
    qcNotes: '',
    internalNotes: '',
    agreedToTerms: false,
    submissionNotes: ''
  })

  // Section configuration
  const sections = [
    { 
      id: 'album', 
      label: t('앨범 (제품 레벨)', 'Album (Product Level)'), 
      icon: Package,
      description: t('앨범 기본 정보, 배포 설정, 권리 관리', 'Album info, distribution settings, rights management')
    },
    { 
      id: 'asset', 
      label: t('에셋 레벨', 'Asset Level'), 
      icon: Music2,
      description: t('아티스트, 트랙, 기여자 정보', 'Artists, tracks, contributors')
    },
    { 
      id: 'marketing', 
      label: t('마케팅', 'Marketing'), 
      icon: Megaphone,
      description: t('31개 마케팅 필드', '31 marketing fields')
    }
  ]

  // Validation state
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const validateSection = (section: string) => {
    const errors: Record<string, string> = {}
    
    if (section === 'album') {
      if (!formData.albumTitle.trim()) {
        errors.albumTitle = t('앨범명은 필수입니다', 'Album title is required')
      }
      if (!formData.releaseDate) {
        errors.releaseDate = t('발매일은 필수입니다', 'Release date is required')
      }
      if (!formData.copyrightOwner.trim()) {
        errors.copyrightOwner = t('저작권 소유자는 필수입니다', 'Copyright owner is required')
      }
    } else if (section === 'asset') {
      if (formData.artists.length === 0) {
        errors.artists = t('최소 1명의 아티스트가 필요합니다', 'At least one artist is required')
      }
      if (formData.tracks.length === 0) {
        errors.tracks = t('최소 1개의 트랙이 필요합니다', 'At least one track is required')
      }
    } else if (section === 'marketing') {
      if (!formData.marketingGenre) {
        errors.marketingGenre = t('마케팅 장르는 필수입니다', 'Marketing genre is required')
      }
    }
    
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSectionChange = (newSection: 'album' | 'asset' | 'marketing') => {
    if (validateSection(currentSection)) {
      setCurrentSection(newSection)
    } else {
      toast.error(t('현재 섹션의 필수 항목을 모두 입력해주세요', 'Please fill in all required fields in the current section'))
    }
  }

  const handleSubmit = async () => {
    // Validate all sections
    const albumValid = validateSection('album')
    const assetValid = validateSection('asset')
    const marketingValid = validateSection('marketing')
    
    if (!albumValid || !assetValid || !marketingValid) {
      toast.error(t('모든 필수 항목을 입력해주세요', 'Please fill in all required fields'))
      return
    }
    
    if (!formData.agreedToTerms) {
      toast.error(t('이용약관에 동의해주세요', 'Please agree to the terms and conditions'))
      return
    }
    
    setIsSubmitting(true)
    
    try {
      // Submit logic here
      const submission = await submissionService.createSubmission({
        ...formData,
        userId: user?.id || '',
        status: 'pending'
      })
      
      toast.success(t('음원 발매 신청이 완료되었습니다!', 'Release submission completed!'))
      navigate('/dashboard')
    } catch (error) {
      console.error('Submission error:', error)
      toast.error(t('제출 중 오류가 발생했습니다', 'An error occurred during submission'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderAlbumSection = () => (
    <div className="space-y-8">
      {/* Album Basic Info */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-purple-500" />
          {t('앨범 기본 정보', 'Album Basic Info')}
        </h3>
        
        <div className="space-y-6">
          {/* Album Title */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {t('앨범명', 'Album Title')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.albumTitle}
              onChange={(e) => setFormData(prev => ({ ...prev, albumTitle: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                       focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder={t('앨범명을 입력하세요', 'Enter album title')}
            />
            {validationErrors.albumTitle && (
              <p className="mt-1 text-sm text-red-500">{validationErrors.albumTitle}</p>
            )}
          </div>

          {/* Album Type */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {t('앨범 유형', 'Album Type')} <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-4">
              {albumTypeOptions.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setFormData(prev => ({ ...prev, albumType: type.value as any }))}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.albumType === type.value
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-purple-300'
                  }`}
                >
                  <div className="font-medium">{type.label}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{type.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Release Date and Time Section */}
          <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-500" />
                {t('발매 일정', 'Release Schedule')}
              </h4>
              <button
                onClick={() => setShowReleaseHelp(!showReleaseHelp)}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                title={t('도움말', 'Help')}
              >
                <HelpCircle className="w-3 h-3 text-gray-400" />
              </button>
            </div>

            {showReleaseHelp && (
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
                <p className="text-blue-800 dark:text-blue-200 mb-2">
                  <strong>{releaseTimeHelp.consumerRelease.title}</strong>: {releaseTimeHelp.consumerRelease.description}
                </p>
                <p className="text-blue-800 dark:text-blue-200">
                  <strong>{releaseTimeHelp.originalRelease.title}</strong>: {releaseTimeHelp.originalRelease.description}
                </p>
              </div>
            )}

            {/* Timezone Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">
                {t('시간대', 'Timezone')}
              </label>
              <select
                value={formData.timezone}
                onChange={(e) => setFormData(prev => ({ ...prev, timezone: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                         focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {timezones.map(tz => (
                  <option key={tz.value} value={tz.value}>{tz.label}</option>
                ))}
              </select>
            </div>

            {/* Consumer Release Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('일반 발매일', 'Consumer Release Date')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.consumerReleaseDate}
                  onChange={(e) => {
                    setFormData(prev => ({ 
                      ...prev, 
                      consumerReleaseDate: e.target.value,
                      // Auto-update original release date if not a re-release
                      originalReleaseDate: prev.isRerelease ? prev.originalReleaseDate : e.target.value
                    }))
                  }}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                           focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('발매 시간', 'Release Time')}
                </label>
                <input
                  type="time"
                  value={formData.consumerReleaseTime}
                  onChange={(e) => {
                    setFormData(prev => ({ 
                      ...prev, 
                      consumerReleaseTime: e.target.value,
                      // Auto-update original release time if not a re-release
                      originalReleaseTime: prev.isRerelease ? prev.originalReleaseTime : e.target.value
                    }))
                  }}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                           focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* UTC Display */}
            {formData.consumerReleaseDate && formData.consumerReleaseTime && (
              <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm">
                <p className="text-gray-600 dark:text-gray-300">
                  <strong>UTC:</strong> {(() => {
                    try {
                      const utcDate = convertToUTC(formData.consumerReleaseDate, formData.consumerReleaseTime, formData.timezone)
                      return utcDate.toISOString().replace('T', ' ').slice(0, 16)
                    } catch {
                      return 'Invalid date/time'
                    }
                  })()}
                </p>
                <div className="mt-1 grid grid-cols-2 gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <div>🇰🇷 서울: {(() => {
                    try {
                      const utcDate = convertToUTC(formData.consumerReleaseDate, formData.consumerReleaseTime, formData.timezone)
                      return formatUTCInTimezone(utcDate, 'Asia/Seoul')
                    } catch {
                      return '-'
                    }
                  })()}</div>
                  <div>🇺🇸 LA: {(() => {
                    try {
                      const utcDate = convertToUTC(formData.consumerReleaseDate, formData.consumerReleaseTime, formData.timezone)
                      return formatUTCInTimezone(utcDate, 'America/Los_Angeles')
                    } catch {
                      return '-'
                    }
                  })()}</div>
                  <div>🇬🇧 런던: {(() => {
                    try {
                      const utcDate = convertToUTC(formData.consumerReleaseDate, formData.consumerReleaseTime, formData.timezone)
                      return formatUTCInTimezone(utcDate, 'Europe/London')
                    } catch {
                      return '-'
                    }
                  })()}</div>
                  <div>🇯🇵 도쿄: {(() => {
                    try {
                      const utcDate = convertToUTC(formData.consumerReleaseDate, formData.consumerReleaseTime, formData.timezone)
                      return formatUTCInTimezone(utcDate, 'Asia/Tokyo')
                    } catch {
                      return '-'
                    }
                  })()}</div>
                </div>
              </div>
            )}

            {/* Re-release Toggle */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <Checkbox
                label={t('재발매/리믹스/커버곡입니다', 'This is a re-release/remix/cover')}
                checked={formData.isRerelease}
                onChange={(e) => {
                  const isRerelease = e.target.checked
                  setFormData(prev => ({ 
                    ...prev, 
                    isRerelease,
                    // Reset original release date if unchecked
                    originalReleaseDate: isRerelease ? prev.originalReleaseDate : prev.consumerReleaseDate,
                    originalReleaseTime: isRerelease ? prev.originalReleaseTime : prev.consumerReleaseTime
                  }))
                }}
              />
            </div>

            {/* Original Release Date (shown only for re-releases) */}
            {formData.isRerelease && (
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t('원곡 발매일', 'Original Release Date')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.originalReleaseDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, originalReleaseDate: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                             focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {t('원곡이 처음 발매된 날짜를 입력하세요', 'Enter the date when the original was first released')}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t('원곡 발매 시간', 'Original Release Time')}
                  </label>
                  <input
                    type="time"
                    value={formData.originalReleaseTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, originalReleaseTime: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                             focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Copyright Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                {t('저작권 연도', 'Copyright Year')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.copyrightYear}
                onChange={(e) => setFormData(prev => ({ ...prev, copyrightYear: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                         focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="2024"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                {t('저작권 소유자', 'Copyright Owner')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.copyrightOwner}
                onChange={(e) => setFormData(prev => ({ ...prev, copyrightOwner: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                         focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder={t('저작권 소유자명', 'Copyright owner name')}
              />
            </div>
          </div>

          {/* Record Label */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {t('레코드 레이블', 'Record Label')}
            </label>
            <input
              type="text"
              value={formData.recordLabel}
              onChange={(e) => setFormData(prev => ({ ...prev, recordLabel: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                       focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder={t('레코드 레이블명', 'Record label name')}
            />
          </div>
        </div>
      </div>

      {/* Album Cover */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Image className="w-5 h-5 text-purple-500" />
          {t('앨범 커버', 'Album Cover')}
        </h3>
        
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
          {formData.albumCoverArtUrl ? (
            <div className="relative inline-block">
              <img 
                src={formData.albumCoverArtUrl} 
                alt="Album cover" 
                className="w-64 h-64 object-cover rounded-lg"
              />
              <button
                onClick={() => setFormData(prev => ({ ...prev, albumCoverArtUrl: '', albumCoverArt: null }))}
                className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div>
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                {t('앨범 커버를 업로드하세요', 'Upload album cover')}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
                {t('최소 3000x3000px, JPG 또는 PNG', 'Minimum 3000x3000px, JPG or PNG')}
              </p>
              <input
                type="file"
                accept="image/jpeg,image/png"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    setFormData(prev => ({ 
                      ...prev, 
                      albumCoverArt: file,
                      albumCoverArtUrl: URL.createObjectURL(file)
                    }))
                  }
                }}
                className="hidden"
                id="album-cover-upload"
              />
              <label htmlFor="album-cover-upload">
                <Button variant="primary">
                  {t('파일 선택', 'Choose File')}
                </Button>
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Distribution Platforms */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Globe className="w-5 h-5 text-purple-500" />
          {t('배포 플랫폼', 'Distribution Platforms')}
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(formData.distributionPlatforms).map(([platform, enabled]) => {
            if (platform === 'custom') return null
            return (
              <Checkbox
                key={platform}
                label={platform.charAt(0).toUpperCase() + platform.slice(1)}
                checked={enabled as boolean}
                onChange={(e) => {
                  setFormData(prev => ({
                    ...prev,
                    distributionPlatforms: {
                      ...prev.distributionPlatforms,
                      [platform]: e.target.checked
                    }
                  }))
                }}
              />
            )
          })}
        </div>
      </div>
    </div>
  )

  const renderAssetSection = () => (
    <div className="space-y-8">
      {/* FUGA QC Info Banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-500 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
              {t('FUGA QC 검증 안내', 'FUGA QC Validation Guide')}
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
              {t(
                '입력하신 정보는 실시간으로 FUGA QC 기준에 따라 검증됩니다. 빨간색 오류는 반드시 수정해야 하며, 노란색 경고는 권장사항입니다.',
                'Your input is validated in real-time according to FUGA QC standards. Red errors must be fixed, yellow warnings are recommendations.'
              )}
            </p>
            <button
              onClick={() => setShowQCHelp(true)}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              {t('FUGA QC 가이드 보기', 'View FUGA QC Guide')}
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Artist Level Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-6 h-6 text-purple-500" />
          <h2 className="text-xl font-semibold">{t('아티스트 레벨', 'Artist Level')}</h2>
        </div>

        {/* Main Artists */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">{t('아티스트 정보', 'Artist Information')}</h3>
            <button
              onClick={() => setShowArtistHelp(!showArtistHelp)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title={t('도움말', 'Help')}
            >
              <HelpCircle className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {showArtistHelp && (
            <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                {t(
                  '아티스트 정보는 모든 음원 플랫폼에서 가장 중요한 정보입니다. 정확한 정보를 입력해주세요.',
                  'Artist information is the most important data across all music platforms. Please enter accurate information.'
                )}
              </p>
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1 list-disc list-inside">
                <li>{t('실명 또는 활동명을 정확히 입력하세요', 'Enter real name or stage name accurately')}</li>
                <li>{t('특수문자나 이모지는 사용할 수 없습니다', 'Special characters and emojis are not allowed')}</li>
                <li>{t('feat. 표기는 피처링 아티스트로 별도 등록하세요', 'Register featuring artists separately')}</li>
              </ul>
            </div>
          )}
          
          <div className="space-y-4">
            {formData.artists.map((artist, index) => (
              <div key={artist.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="text"
                        value={artist.primaryName}
                        onChange={(e) => {
                          const newArtists = [...formData.artists]
                          newArtists[index].primaryName = e.target.value
                          setFormData(prev => ({ ...prev, artists: newArtists }))
                        }}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                                 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                                 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder={t('아티스트 이름', 'Artist name')}
                      />
                      <select
                        value={artist.role}
                        onChange={(e) => {
                          const newArtists = [...formData.artists]
                          newArtists[index].role = e.target.value as 'main' | 'featuring'
                          setFormData(prev => ({ ...prev, artists: newArtists }))
                        }}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                                 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                      >
                        <option value="main">{t('메인', 'Main')}</option>
                        <option value="featuring">{t('피처링', 'Featuring')}</option>
                      </select>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        artists: prev.artists.filter(a => a.id !== artist.id)
                      }))
                    }}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Platform IDs Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <LinkIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('플랫폼 연동', 'Platform Integration')}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <label className="block text-sm font-medium">
                          Spotify ID
                        </label>
                        <button
                          onClick={() => setShowSpotifyHelp(!showSpotifyHelp)}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                          title={tooltips.spotifyId}
                        >
                          <HelpCircle className="w-3 h-3 text-gray-400" />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={artist.spotifyId || ''}
                        onChange={(e) => {
                          const newArtists = [...formData.artists]
                          newArtists[index].spotifyId = e.target.value
                          setFormData(prev => ({ ...prev, artists: newArtists }))
                        }}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                                 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm
                                 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="3Nrfpe0tUJi4K4DXYWgMUX"
                      />
                      {showSpotifyHelp && (
                        <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-xs">
                          <p className="font-medium text-green-800 dark:text-green-200 mb-1">
                            {helpTexts.spotifyId.title}
                          </p>
                          <ol className="list-decimal list-inside space-y-1 text-green-700 dark:text-green-300">
                            {helpTexts.spotifyId.content.split('\n').filter(line => line.trim()).map((line, i) => (
                              <li key={i}>{line.trim()}</li>
                            ))}
                          </ol>
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <label className="block text-sm font-medium">
                          Apple Music ID
                        </label>
                        <button
                          onClick={() => setShowAppleHelp(!showAppleHelp)}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                          title={tooltips.appleMusicId}
                        >
                          <HelpCircle className="w-3 h-3 text-gray-400" />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={artist.appleMusicId || ''}
                        onChange={(e) => {
                          const newArtists = [...formData.artists]
                          newArtists[index].appleMusicId = e.target.value
                          setFormData(prev => ({ ...prev, artists: newArtists }))
                        }}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                                 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm
                                 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="1419227"
                      />
                      {showAppleHelp && (
                        <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-xs">
                          <p className="font-medium text-red-800 dark:text-red-200 mb-1">
                            {helpTexts.appleMusicId.title}
                          </p>
                          <ol className="list-decimal list-inside space-y-1 text-red-700 dark:text-red-300">
                            {helpTexts.appleMusicId.content.split('\n').filter(line => line.trim()).map((line, i) => (
                              <li key={i}>{line.trim()}</li>
                            ))}
                          </ol>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            <Button
              variant="secondary"
              onClick={() => {
                const newArtist: Artist = {
                  id: uuidv4(),
                  primaryName: '',
                  translations: [],
                  isNewArtist: true,
                  role: 'main',
                  customIdentifiers: [],
                  spotifyId: '',
                  appleMusicId: ''
                }
                setFormData(prev => ({
                  ...prev,
                  artists: [...prev.artists, newArtist]
                }))
              }}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('아티스트 추가', 'Add Artist')}
            </Button>
          </div>
        </div>
      </div>

      {/* Tracks */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Music className="w-5 h-5 text-purple-500" />
          {t('트랙 정보', 'Track Information')}
        </h3>
        
        <div className="space-y-4">
          {formData.tracks.map((track, index) => (
            <div key={track.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <input
                    type="text"
                    value={track.title}
                    onChange={(e) => {
                      const newTracks = [...formData.tracks]
                      newTracks[index].title = e.target.value
                      setFormData(prev => ({ ...prev, tracks: newTracks }))
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                             focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder={t('트랙 제목', 'Track title')}
                  />
                </div>
                <button
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      tracks: prev.tracks.filter(t => t.id !== track.id)
                    }))
                  }}
                  className="ml-2 p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t('장르', 'Genre')}
                  </label>
                  <select
                    value={track.genre || ''}
                    onChange={(e) => {
                      const newTracks = [...formData.tracks]
                      newTracks[index].genre = e.target.value
                      setFormData(prev => ({ ...prev, tracks: newTracks }))
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                             focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">{t('장르 선택', 'Select genre')}</option>
                    {genreOptions.map(genre => (
                      <option key={genre} value={genre}>{genre}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t('포맷', 'Format')}
                  </label>
                  <div className="flex gap-4">
                    <Checkbox
                      label="Dolby Atmos"
                      checked={track.dolbyAtmos || false}
                      onChange={(e) => {
                        const newTracks = [...formData.tracks]
                        newTracks[index].dolbyAtmos = e.target.checked
                        setFormData(prev => ({ ...prev, tracks: newTracks }))
                      }}
                    />
                    <Checkbox
                      label="Stereo"
                      checked={track.stereo || true}
                      onChange={(e) => {
                        const newTracks = [...formData.tracks]
                        newTracks[index].stereo = e.target.checked
                        setFormData(prev => ({ ...prev, tracks: newTracks }))
                      }}
                    />
                  </div>
                </div>
              </div>
              
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    ISRC
                  </label>
                  <input
                    type="text"
                    value={track.isrc || ''}
                    onChange={(e) => {
                      const newTracks = [...formData.tracks]
                      newTracks[index].isrc = e.target.value
                      setFormData(prev => ({ ...prev, tracks: newTracks }))
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm
                             focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="KR-XXX-XX-XXXXX"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t('악곡 구성', 'Song Credits')}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={track.composer || ''}
                      onChange={(e) => {
                        const newTracks = [...formData.tracks]
                        newTracks[index].composer = e.target.value
                        setFormData(prev => ({ ...prev, tracks: newTracks }))
                      }}
                      className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded 
                               bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm
                               focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder={t('작곡가', 'Composer')}
                    />
                    <input
                      type="text"
                      value={track.lyricist || ''}
                      onChange={(e) => {
                        const newTracks = [...formData.tracks]
                        newTracks[index].lyricist = e.target.value
                        setFormData(prev => ({ ...prev, tracks: newTracks }))
                      }}
                      className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded 
                               bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm
                               focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder={t('작사가', 'Lyricist')}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          <Button
            variant="secondary"
            onClick={() => {
              const newTrack: Track = {
                id: uuidv4(),
                title: '',
                translations: [],
                artists: [...formData.artists],
                featuringArtists: [],
                contributors: [],
                isTitle: formData.tracks.length === 0,
                stereo: true,
                dolbyAtmos: false,
                genre: formData.marketingGenre || '',
                audioLanguage: 'ko',
                metadataLanguage: 'ko',
                explicitContent: false
              }
              setFormData(prev => ({
                ...prev,
                tracks: [...prev.tracks, newTrack]
              }))
            }}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t('트랙 추가', 'Add Track')}
          </Button>
        </div>
      </div>
      
      {/* Contributors */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-purple-500" />
          {t('기여자 정보', 'Contributor Information')}
        </h3>
        
        <div className="space-y-4">
          {formData.albumContributors.map((contributor, index) => (
            <div key={contributor.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <input
                    type="text"
                    value={contributor.name}
                    onChange={(e) => {
                      const newContributors = [...formData.albumContributors]
                      newContributors[index].name = e.target.value
                      setFormData(prev => ({ ...prev, albumContributors: newContributors }))
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                             focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder={t('기여자 이름', 'Contributor name')}
                  />
                </div>
                <button
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      albumContributors: prev.albumContributors.filter(c => c.id !== contributor.id)
                    }))
                  }}
                  className="ml-2 p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t('역할', 'Roles')}
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {Object.entries(contributorRoles.reduce((acc, role) => {
                      if (!acc[role.category]) acc[role.category] = []
                      acc[role.category].push(role)
                      return acc
                    }, {} as Record<string, typeof contributorRoles>)).map(([category, roles]) => (
                      <select
                        key={category}
                        className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg 
                                 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                        onChange={(e) => {
                          const role = e.target.value
                          if (role && !contributor.roles.includes(role)) {
                            const newContributors = [...formData.albumContributors]
                            newContributors[index].roles = [...contributor.roles, role]
                            setFormData(prev => ({ ...prev, albumContributors: newContributors }))
                          }
                        }}
                      >
                        <option value="">{t(category, category)}</option>
                        {roles.map(role => (
                          <option key={role.value} value={role.value}>
                            {language === 'ko' ? role.label : role.labelEn}
                          </option>
                        ))}
                      </select>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {contributor.roles.map(roleValue => {
                      const role = contributorRoles.find(r => r.value === roleValue)
                      return role ? (
                        <span
                          key={roleValue}
                          className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded flex items-center gap-1"
                        >
                          {language === 'ko' ? role.label : role.labelEn}
                          <button
                            onClick={() => {
                              const newContributors = [...formData.albumContributors]
                              newContributors[index].roles = contributor.roles.filter(r => r !== roleValue)
                              setFormData(prev => ({ ...prev, albumContributors: newContributors }))
                            }}
                            className="hover:text-purple-100"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ) : null
                    })}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t('악기', 'Instruments')}
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                               bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm
                               focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder={t('악기 검색...', 'Search instruments...')}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.currentTarget.value) {
                          const results = searchInstruments(e.currentTarget.value)
                          if (results.length > 0 && !contributor.instruments.includes(results[0].value)) {
                            const newContributors = [...formData.albumContributors]
                            newContributors[index].instruments = [...contributor.instruments, results[0].value]
                            setFormData(prev => ({ ...prev, albumContributors: newContributors }))
                            e.currentTarget.value = ''
                          }
                        }
                      }}
                    />
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {contributor.instruments?.map(instrument => {
                      const inst = instrumentList.find(i => i.value === instrument)
                      return (
                        <span
                          key={instrument}
                          className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded flex items-center gap-1"
                        >
                          {inst ? (language === 'ko' ? inst.label : inst.labelEn) : instrument}
                          <button
                            onClick={() => {
                              const newContributors = [...formData.albumContributors]
                              newContributors[index].instruments = contributor.instruments?.filter(i => i !== instrument) || []
                              setFormData(prev => ({ ...prev, albumContributors: newContributors }))
                            }}
                            className="hover:text-blue-100"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      )
                    })}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Spotify URL
                    </label>
                    <input
                      type="text"
                      value={contributor.spotifyUrl || ''}
                      onChange={(e) => {
                        const newContributors = [...formData.albumContributors]
                        newContributors[index].spotifyUrl = e.target.value
                        setFormData(prev => ({ ...prev, albumContributors: newContributors }))
                      }}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                               bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm
                               focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="https://open.spotify.com/artist/..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Apple Music URL
                    </label>
                    <input
                      type="text"
                      value={contributor.appleMusicUrl || ''}
                      onChange={(e) => {
                        const newContributors = [...formData.albumContributors]
                        newContributors[index].appleMusicUrl = e.target.value
                        setFormData(prev => ({ ...prev, albumContributors: newContributors }))
                      }}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                               bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm
                               focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="https://music.apple.com/artist/..."
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          <Button
            variant="secondary"
            onClick={() => {
              const newContributor: Contributor = {
                id: uuidv4(),
                name: '',
                translations: [],
                roles: [],
                instruments: [],
                appleMusicUrl: '',
                spotifyUrl: ''
              }
              setFormData(prev => ({
                ...prev,
                albumContributors: [...prev.albumContributors, newContributor]
              }))
            }}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t('기여자 추가', 'Add Contributor')}
          </Button>
        </div>
      </div>
    </div>
  )

  const renderMarketingSection = () => (
    <div className="space-y-8">
      {/* Genre & Tags */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Tag className="w-5 h-5 text-purple-500" />
          {t('장르 및 태그', 'Genre & Tags')}
        </h3>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                {t('마케팅 장르', 'Marketing Genre')} <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.marketingGenre}
                onChange={(e) => setFormData(prev => ({ ...prev, marketingGenre: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                         focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">{t('장르 선택', 'Select genre')}</option>
                {genreOptions.map(genre => (
                  <option key={genre} value={genre}>{genre}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                {t('서브 장르', 'Sub-genre')}
              </label>
              <input
                type="text"
                value={formData.marketingSubgenre}
                onChange={(e) => setFormData(prev => ({ ...prev, marketingSubgenre: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                         focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder={t('서브 장르 입력', 'Enter sub-genre')}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              {t('마케팅 태그', 'Marketing Tags')}
            </label>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="text"
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                         focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder={t('태그 입력 후 Enter', 'Enter tag and press Enter')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value) {
                    setFormData(prev => ({
                      ...prev,
                      marketingTags: [...prev.marketingTags, e.currentTarget.value]
                    }))
                    e.currentTarget.value = ''
                  }
                }}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.marketingTags.map((tag, index) => (
                <span
                  key={index}
                  className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-sm flex items-center gap-1"
                >
                  {tag}
                  <button
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      marketingTags: prev.marketingTags.filter((_, i) => i !== index)
                    }))}
                    className="hover:text-purple-100"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              {t('유사 아티스트', 'Similar Artists')}
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                       focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder={t('유사 아티스트 입력 후 Enter', 'Enter similar artist and press Enter')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value) {
                  setFormData(prev => ({
                    ...prev,
                    similarArtists: [...prev.similarArtists, e.currentTarget.value]
                  }))
                  e.currentTarget.value = ''
                }
              }}
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.similarArtists.map((artist, index) => (
                <span
                  key={index}
                  className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-sm flex items-center gap-1"
                >
                  {artist}
                  <button
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      similarArtists: prev.similarArtists.filter((_, i) => i !== index)
                    }))}
                    className="hover:text-blue-100"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Marketing Strategy */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-purple-500" />
          {t('마케팅 전략', 'Marketing Strategy')}
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              {t('마케팅 앵글', 'Marketing Angle')}
            </label>
            <textarea
              value={formData.marketingAngle}
              onChange={(e) => setFormData(prev => ({ ...prev, marketingAngle: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                       focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              rows={3}
              placeholder={t('이 앨범의 독특한 포인트나 스토리를 설명해주세요', 'Describe the unique points or story of this album')}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              {t('프레스 릴리스', 'Press Release')}
            </label>
            <textarea
              value={formData.pressRelease}
              onChange={(e) => setFormData(prev => ({ ...prev, pressRelease: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                       focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              rows={3}
              placeholder={t('프레스 릴리스 내용', 'Press release content')}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              {t('마케팅 예산', 'Marketing Budget')}
            </label>
            <input
              type="text"
              value={formData.marketingBudget}
              onChange={(e) => setFormData(prev => ({ ...prev, marketingBudget: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                       focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder={t('예: $10,000', 'e.g. $10,000')}
            />
          </div>
        </div>
      </div>

      {/* Social Media Strategy */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Heart className="w-5 h-5 text-purple-500" />
          {t('소셜 미디어 전략', 'Social Media Strategy')}
        </h3>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                {t('Spotify 피칭', 'Spotify Pitching')}
              </label>
              <textarea
                value={formData.spotifyPitching}
                onChange={(e) => setFormData(prev => ({ ...prev, spotifyPitching: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                         focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows={2}
                placeholder={t('Spotify 플레이리스트 피칭 전략', 'Spotify playlist pitching strategy')}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                {t('Apple Music 피칭', 'Apple Music Pitching')}
              </label>
              <textarea
                value={formData.appleMusicPitching}
                onChange={(e) => setFormData(prev => ({ ...prev, appleMusicPitching: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                         focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows={2}
                placeholder={t('Apple Music 플레이리스트 피칭 전략', 'Apple Music playlist pitching strategy')}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                {t('TikTok 전략', 'TikTok Strategy')}
              </label>
              <textarea
                value={formData.tiktokStrategy}
                onChange={(e) => setFormData(prev => ({ ...prev, tiktokStrategy: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                         focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows={2}
                placeholder={t('TikTok 바이럴 전략', 'TikTok viral strategy')}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                {t('YouTube 전략', 'YouTube Strategy')}
              </label>
              <textarea
                value={formData.youtubeStrategy}
                onChange={(e) => setFormData(prev => ({ ...prev, youtubeStrategy: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                         focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows={2}
                placeholder={t('YouTube 마케팅 전략', 'YouTube marketing strategy')}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                {t('Instagram 전략', 'Instagram Strategy')}
              </label>
              <textarea
                value={formData.instagramStrategy}
                onChange={(e) => setFormData(prev => ({ ...prev, instagramStrategy: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                         focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows={2}
                placeholder={t('Instagram 마케팅 전략', 'Instagram marketing strategy')}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                {t('Facebook 전략', 'Facebook Strategy')}
              </label>
              <textarea
                value={formData.facebookStrategy}
                onChange={(e) => setFormData(prev => ({ ...prev, facebookStrategy: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                         focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows={2}
                placeholder={t('Facebook 마케팅 전략', 'Facebook marketing strategy')}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                {t('Twitter 전략', 'Twitter Strategy')}
              </label>
              <textarea
                value={formData.twitterStrategy}
                onChange={(e) => setFormData(prev => ({ ...prev, twitterStrategy: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                         focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows={2}
                placeholder={t('Twitter 마케팅 전략', 'Twitter marketing strategy')}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              {t('소셜 미디어 캔페인', 'Social Media Campaign')}
            </label>
            <textarea
              value={formData.socialMediaCampaign}
              onChange={(e) => setFormData(prev => ({ ...prev, socialMediaCampaign: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                       focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              rows={3}
              placeholder={t('전체 소셜 미디어 캔페인 계획', 'Overall social media campaign plan')}
            />
          </div>
        </div>
      </div>

      {/* Outreach & Targeting */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-purple-500" />
          {t('아웃리치 및 타겟팅', 'Outreach & Targeting')}
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              {t('인플루언서 아웃리치', 'Influencer Outreach')}
            </label>
            <textarea
              value={formData.influencerOutreach}
              onChange={(e) => setFormData(prev => ({ ...prev, influencerOutreach: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                       focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              rows={2}
              placeholder={t('인플루언서 협업 계획', 'Influencer collaboration plans')}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              {t('플레이리스트 타겟', 'Playlist Targets')}
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                       focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder={t('타겟 플레이리스트 입력 후 Enter', 'Enter target playlist and press Enter')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value) {
                  setFormData(prev => ({
                    ...prev,
                    playlistTargets: [...prev.playlistTargets, e.currentTarget.value]
                  }))
                  e.currentTarget.value = ''
                }
              }}
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.playlistTargets.map((playlist, index) => (
                <span
                  key={index}
                  className="bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-sm flex items-center gap-1"
                >
                  {playlist}
                  <button
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      playlistTargets: prev.playlistTargets.filter((_, i) => i !== index)
                    }))}
                    className="hover:text-green-100"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                {t('라디오 타겟', 'Radio Targets')}
              </label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                         focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder={t('라디오 방송국 입력 후 Enter', 'Enter radio station and press Enter')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value) {
                    setFormData(prev => ({
                      ...prev,
                      radioTargets: [...prev.radioTargets, e.currentTarget.value]
                    }))
                    e.currentTarget.value = ''
                  }
                }}
              />
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.radioTargets.map((radio, index) => (
                  <span
                    key={index}
                    className="bg-yellow-500/20 text-yellow-300 px-3 py-1 rounded-full text-sm flex items-center gap-1"
                  >
                    {radio}
                    <button
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        radioTargets: prev.radioTargets.filter((_, i) => i !== index)
                      }))}
                      className="hover:text-yellow-100"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                {t('프레스 타겟', 'Press Targets')}
              </label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                         focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder={t('언론사 입력 후 Enter', 'Enter press outlet and press Enter')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value) {
                    setFormData(prev => ({
                      ...prev,
                      pressTargets: [...prev.pressTargets, e.currentTarget.value]
                    }))
                    e.currentTarget.value = ''
                  }
                }}
              />
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.pressTargets.map((press, index) => (
                  <span
                    key={index}
                    className="bg-red-500/20 text-red-300 px-3 py-1 rounded-full text-sm flex items-center gap-1"
                  >
                    {press}
                    <button
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        pressTargets: prev.pressTargets.filter((_, i) => i !== index)
                      }))}
                      className="hover:text-red-100"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content & Media */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Video className="w-5 h-5 text-purple-500" />
          {t('콘텐츠 및 미디어', 'Content & Media')}
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              {t('뮤직비디오 계획', 'Music Video Plans')}
            </label>
            <textarea
              value={formData.musicVideoPlans}
              onChange={(e) => setFormData(prev => ({ ...prev, musicVideoPlans: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                       focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              rows={3}
              placeholder={t('뮤직비디오 제작 계획', 'Music video production plans')}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                {t('비하인드 더 신', 'Behind The Scenes')}
              </label>
              <textarea
                value={formData.behindTheScenes}
                onChange={(e) => setFormData(prev => ({ ...prev, behindTheScenes: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                         focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows={2}
                placeholder={t('메이킹 콘텐츠 계획', 'Making-of content plans')}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                {t('다큐멘터리 계획', 'Documentary Plans')}
              </label>
              <textarea
                value={formData.documentaryPlans}
                onChange={(e) => setFormData(prev => ({ ...prev, documentaryPlans: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                         focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows={2}
                placeholder={t('다큐멘터리 제작 계획', 'Documentary production plans')}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Events & Products */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-purple-500" />
          {t('이벤트 및 상품', 'Events & Products')}
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              {t('투어 날짜', 'Tour Dates')}
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="date"
                id="tourDate"
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                         focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <input
                type="text"
                id="tourVenue"
                placeholder={t('장소', 'Venue')}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                         focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <input
                type="text"
                id="tourCity"
                placeholder={t('도시', 'City')}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                         focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <Button
                variant="secondary"
                onClick={() => {
                  const dateInput = document.getElementById('tourDate') as HTMLInputElement
                  const venueInput = document.getElementById('tourVenue') as HTMLInputElement
                  const cityInput = document.getElementById('tourCity') as HTMLInputElement
                  
                  if (dateInput.value && venueInput.value && cityInput.value) {
                    setFormData(prev => ({
                      ...prev,
                      tourDates: [...prev.tourDates, {
                        date: dateInput.value,
                        venue: venueInput.value,
                        city: cityInput.value
                      }]
                    }))
                    dateInput.value = ''
                    venueInput.value = ''
                    cityInput.value = ''
                  }
                }}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-2">
              {formData.tourDates.map((tour, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-700 rounded">
                  <span className="text-sm">
                    {tour.date} - {tour.venue}, {tour.city}
                  </span>
                  <button
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      tourDates: prev.tourDates.filter((_, i) => i !== index)
                    }))}
                    className="text-red-500 hover:text-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                {t('머쳐다이징', 'Merchandising')}
              </label>
              <textarea
                value={formData.merchandising}
                onChange={(e) => setFormData(prev => ({ ...prev, merchandising: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                         focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows={2}
                placeholder={t('굳즈 및 머쳐다이징 계획', 'Goods and merchandising plans')}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                {t('특별판', 'Special Editions')}
              </label>
              <textarea
                value={formData.specialEditions}
                onChange={(e) => setFormData(prev => ({ ...prev, specialEditions: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                         focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows={2}
                placeholder={t('한정판 및 특별판 계획', 'Limited and special edition plans')}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Digital & Partnerships */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-500" />
          {t('디지털 및 파트너십', 'Digital & Partnerships')}
        </h3>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                {t('NFT 전략', 'NFT Strategy')}
              </label>
              <textarea
                value={formData.nftStrategy}
                onChange={(e) => setFormData(prev => ({ ...prev, nftStrategy: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                         focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows={2}
                placeholder={t('NFT 활용 계획', 'NFT utilization plans')}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                {t('메타버스 활성화', 'Metaverse Activations')}
              </label>
              <textarea
                value={formData.metaverseActivations}
                onChange={(e) => setFormData(prev => ({ ...prev, metaverseActivations: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                         focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows={2}
                placeholder={t('메타버스 플랫폼 활용 계획', 'Metaverse platform utilization plans')}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              {t('브랜드 파트너십', 'Brand Partnerships')}
            </label>
            <textarea
              value={formData.brandPartnerships}
              onChange={(e) => setFormData(prev => ({ ...prev, brandPartnerships: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                       focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              rows={2}
              placeholder={t('브랜드 협업 계획', 'Brand collaboration plans')}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              {t('싱크 기회', 'Sync Opportunities')}
            </label>
            <textarea
              value={formData.syncOpportunities}
              onChange={(e) => setFormData(prev => ({ ...prev, syncOpportunities: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                       focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              rows={2}
              placeholder={t('영화, 드라마, 광고 등 싱크 기회', 'Film, drama, advertising sync opportunities')}
            />
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {t('음원 발매 신청', 'Release Submission')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('N3RVE를 통해 전 세계에 당신의 음악을 들려주세요', 'Share your music with the world through N3RVE')}
          </p>
        </div>

        {/* Progress Section Navigation */}
        <div className="mb-8">
          <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700">
            {sections.map((section) => {
              const Icon = section.icon
              return (
                <button
                  key={section.id}
                  onClick={() => handleSectionChange(section.id as any)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all ${
                    currentSection === section.id
                      ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{section.label}</span>
                </button>
              )
            })}
          </div>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {sections.find(s => s.id === currentSection)?.description}
          </p>
        </div>

        {/* Content */}
        <div className="mb-8">
          {currentSection === 'album' && renderAlbumSection()}
          {currentSection === 'asset' && renderAssetSection()}
          {currentSection === 'marketing' && renderMarketingSection()}
        </div>

        {/* Bottom Navigation */}
        <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => setShowQCWarnings(!showQCWarnings)}
              className="flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4" />
              {t('QC 검증', 'QC Validation')}
            </Button>
          </div>
          
          <div className="flex gap-4">
            {currentSection !== 'album' && (
              <Button
                variant="secondary"
                onClick={() => {
                  const sectionIndex = sections.findIndex(s => s.id === currentSection)
                  setCurrentSection(sections[sectionIndex - 1].id as any)
                }}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                {t('이전', 'Previous')}
              </Button>
            )}
            
            {currentSection !== 'marketing' ? (
              <Button
                variant="primary"
                onClick={() => {
                  const sectionIndex = sections.findIndex(s => s.id === currentSection)
                  handleSectionChange(sections[sectionIndex + 1].id as any)
                }}
              >
                {t('다음', 'Next')}
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <div className="flex items-center gap-4">
                <Checkbox
                  label={t('이용약관에 동의합니다', 'I agree to the terms and conditions')}
                  checked={formData.agreedToTerms}
                  onChange={(e) => setFormData(prev => ({ ...prev, agreedToTerms: e.target.checked }))}
                />
                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  loading={isSubmitting}
                  disabled={!formData.agreedToTerms}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {t('제출하기', 'Submit')}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* FUGA QC Help Modal */}
      <FugaQCHelpModal 
        isOpen={showQCHelp} 
        onClose={() => setShowQCHelp(false)} 
      />
    </div>
  )
}