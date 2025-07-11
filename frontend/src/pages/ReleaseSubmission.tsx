import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguageStore } from '@/store/language.store'
import { 
  Upload, Music, FileText, Image, CheckCircle, AlertCircle, X, Plus, Trash2, 
  Globe, Target, Sparkles, Users, MapPin, Calendar, Shield, Languages, Disc, 
  Building2, Radio, ListMusic, ChevronRight, ChevronLeft, Info, Search,
  Music2, Mic, UserCheck, GripVertical, Edit3, Volume2, BookOpen, Megaphone,
  Tag, Heart, Link as LinkIcon, Video, Download, Eye, Clock, Package
} from 'lucide-react'
import toast from 'react-hot-toast'
import { submissionService } from '@/services/submission.service'
import { dropboxService } from '@/services/dropbox.service'
import { useAuthStore } from '@/store/auth.store'
import Button from '@/components/ui/Button'
import Checkbox from '@/components/ui/Checkbox'
import { v4 as uuidv4 } from 'uuid'

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
  const { t, language } = useLanguageStore()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [currentSection, setCurrentSection] = useState<'album' | 'asset' | 'marketing'>('album')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showQCWarnings, setShowQCWarnings] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    // Album (Product Level) Section
    albumTitle: '',
    albumTranslations: [] as Translation[],
    albumType: 'single' as 'single' | 'ep' | 'album',
    releaseDate: new Date().toISOString().split('T')[0],
    releaseTime: '00:00',
    timezone: 'Asia/Seoul',
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

          {/* Release Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                {t('발매일', 'Release Date')} <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.releaseDate}
                onChange={(e) => setFormData(prev => ({ ...prev, releaseDate: e.target.value }))}
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
                value={formData.releaseTime}
                onChange={(e) => setFormData(prev => ({ ...prev, releaseTime: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                         focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
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
      {/* Artists */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-purple-500" />
          {t('아티스트 정보', 'Artist Information')}
        </h3>
        
        <div className="space-y-4">
          {formData.artists.map((artist, index) => (
            <div key={artist.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium">{artist.primaryName}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {artist.role === 'main' ? t('메인 아티스트', 'Main Artist') : t('피처링 아티스트', 'Featuring Artist')}
                  </p>
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
                customIdentifiers: []
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
                
                <div className="flex items-end gap-2">
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
                    checked={track.stereo || false}
                    onChange={(e) => {
                      const newTracks = [...formData.tracks]
                      newTracks[index].stereo = e.target.checked
                      setFormData(prev => ({ ...prev, tracks: newTracks }))
                    }}
                  />
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
                artists: [],
                featuringArtists: [],
                contributors: [],
                isTitle: formData.tracks.length === 0
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
    </div>
  )
}