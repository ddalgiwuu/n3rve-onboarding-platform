import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguageStore } from '@/store/language.store'
import { 
  Upload, Music, FileText, Image, CheckCircle, AlertCircle, X, Plus, Trash2, 
  Globe, Target, Sparkles, Users, MapPin, Calendar, Shield, Languages, Disc, 
  Building2, Radio, ListMusic, ChevronRight, ChevronLeft, Info, Search,
  Music2, Mic, UserCheck, GripVertical, Edit3, Volume2, BookOpen, Megaphone,
  Tag, Heart, Link as LinkIcon, Video, Download, Eye, Clock
} from 'lucide-react'
import toast from 'react-hot-toast'
import { submissionService } from '@/services/submission.service'
import { dropboxService } from '@/services/dropbox.service'
import { useAuthStore } from '@/store/auth.store'
import { validateSubmission, validateField, type QCValidationResult, type QCValidationResults } from '@/utils/fugaQCValidation'
import QCWarnings from '@/components/submission/QCWarnings'
import ArtistModal from '@/components/submission/ArtistModal'
import { DatePicker } from '@/components/DatePicker'
import { v4 as uuidv4 } from 'uuid'
import { contributorRoles, getRolesByCategory, searchRoles } from '@/constants/contributorRoles'
import { instrumentList, searchInstruments, getInstrumentCategory } from '@/constants/instruments'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import AudioPlayer from '@/components/AudioPlayer'
import RegionSelector from '@/components/RegionSelector'
import MultiSelect from '@/components/ui/MultiSelect'
import { 
  moodOptions, 
  genderOptions, 
  socialMovementOptions, 
  ugcPriorityOptions, 
  instrumentOptions,
  subgenreOptions 
} from '@/constants/marketingOptions'
import { countries } from '@/constants/countries'
import { timezones, convertToUTC, formatUTCInTimezone } from '@/constants/timezones'
import { generateUPC, generateEAN, validateUPC, validateEAN } from '@/utils/identifiers'

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

export default function ReleaseSubmission() {
  const language = useLanguageStore(state => state.language)
  const navigate = useNavigate()
  const { user } = useAuthStore()
  
  // Translation function
  const t = (ko: string, en: string) => language === 'ko' ? ko : en
  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationResults, setValidationResults] = useState<QCValidationResults | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    // Step 0: Metadata (NEW - moved to first)
    releaseVersion: '',
    upc: '',
    ean: '',
    catalogNumber: '',
    recordLabel: '',
    copyrightHolder: '',
    copyrightYear: new Date().getFullYear().toString(),
    productionHolder: '',
    productionYear: new Date().getFullYear().toString(),
    parentalAdvisory: 'none' as 'none' | 'explicit' | 'edited',
    
    // Consumer Release Date and Original Release Date
    consumerReleaseDate: new Date().toISOString().split('T')[0],
    consumerReleaseTime: '00:00',
    consumerTimezone: 'Asia/Seoul',
    originalReleaseDate: '',
    originalReleaseTime: '00:00',
    originalTimezone: 'Asia/Seoul',
    hasOriginalRelease: false,
    
    // Step 1: Artist Info
    artists: [] as Artist[],
    bandMembers: [] as Member[],
    
    // Step 2: Album Basic Info
    albumTitle: '',
    albumTranslations: [] as Translation[],
    albumType: 'single' as 'single' | 'ep' | 'album',
    releaseDate: new Date().toISOString().split('T')[0],
    releaseTime: '00:00',
    timezone: 'Asia/Seoul',
    albumNotes: '', // Album notes for Korean DSPs
    
    // Step 3: Track Info
    tracks: [] as Track[],
    
    // Step 4: Contributors
    albumContributors: [] as Contributor[],
    
    // Step 5: Album Details
    albumCoverArt: null as File | null,
    albumCoverArtUrl: '',
    albumDescription: '',
    albumDescriptionTranslations: [] as Translation[],
    
    // Step 6: Release Settings
    territories: [] as string[],
    excludedTerritories: [] as string[],
    digitalReleaseDate: '',
    physicalReleaseDate: '',
    preOrderDate: '',
    
    // Step 7: Marketing Info
    mainGenre: '',
    moods: [] as string[],
    subgenres: [] as string[], // Changed to array for custom input
    youtubeShortsPreviews: false,
    thisIsPlaylist: false,
    dolbyAtmosSpatialAudio: false,
    motionArtwork: false,
    soundtrackScore: '',
    instruments: [] as string[],
    // FUGA 호환 추가 필드들
    priorityLevel: 3,
    projectType: 'FRONTLINE' as 'FRONTLINE' | 'CATALOG',
    privateListeningLink: '',
    factSheetsUrl: '',
    
    marketingGenre: '',
    marketingSubgenre: '',
    marketingTags: [] as string[],
    similarArtists: [] as string[],
    marketingAngle: '',
    pressRelease: '',
    marketingDrivers: '',
    socialMediaPoliticalPlan: '',
    // Artist Profile fields
    artistCurrentCity: '',
    artistHometown: '',
    artistGender: '',
    socialMovements: [] as string[],
    artistBio: '',
    artistSyncHistory: '',
    artistSyncHistoryDetails: '',
    spotifyArtistId: '',
    appleMusicArtistId: '',
    soundcloudArtistId: '',
    ugcPriorities: [] as string[],
    youtubeUrl: '',
    tiktokUrl: '',
    facebookUrl: '',
    instagramUrl: '',
    twitterUrl: '',
    trillerUrl: '',
    snapchatUrl: '',
    twitchUrl: '',
    pinterestUrl: '',
    tumblrUrl: '',
    // Artist images
    artistImageFile: null as File | null,
    artistLogoFile: null as File | null,
    pressShotUrl: '',
    pressShotCredits: '',
    tourdatesUrl: '',
    artistCountry: '',
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
    
    // Step 7: Distribution
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
    
    // Step 8: Rights & Legal
    copyrightOwner: '',
    publishingRights: '',
    masterRights: '',
    isrcCodes: {} as Record<string, string>,
    licenses: [] as { type: string; territory: string; details: string }[],
    
    // Step 9: Review & QC
    qcNotes: '',
    internalNotes: '',
    
    // Step 10: File Upload
    audioFiles: {} as Record<string, File[]>,
    
    // Step 11: Final Submission
    agreedToTerms: false,
    submissionNotes: ''
  })

  // Refs for preventing duplicates
  const isValidatingRef = useRef(false)
  const lastValidatedDataRef = useRef<string>('')

  // Steps configuration
  const steps = [
    { id: 0, label: t('아티스트 정보', 'Artist Info'), icon: Users },
    { id: 1, label: t('앨범 기본 정보', 'Album Basic Info'), icon: FileText },
    { id: 2, label: t('트랙 정보', 'Track Info'), icon: Music },
    { id: 3, label: t('기여자', 'Contributors'), icon: UserCheck },
    { id: 4, label: t('앨범 상세', 'Album Details'), icon: Image },
    { id: 5, label: t('릴리즈 설정', 'Release Settings'), icon: Calendar },
    { id: 6, label: t('마케팅 정보', 'Marketing Info'), icon: Megaphone },
    { id: 7, label: t('배포', 'Distribution'), icon: Globe },
    { id: 8, label: t('권리 및 법적 사항', 'Rights & Legal'), icon: Shield },
    { id: 9, label: t('검토 및 QC', 'Review & QC'), icon: CheckCircle },
    { id: 10, label: t('파일 업로드', 'File Upload'), icon: Upload },
    { id: 11, label: t('최종 제출', 'Final Submission'), icon: CheckCircle }
  ]

  // Translation management functions
  const addTranslation = (field: string, parentId?: string) => {
    const newTranslation: Translation = {
      id: uuidv4(),
      language: '',
      text: ''
    }

    if (field === 'albumTitle') {
      setFormData(prev => ({
        ...prev,
        albumTranslations: [...prev.albumTranslations, newTranslation]
      }))
    } else if (field === 'albumDescription') {
      setFormData(prev => ({
        ...prev,
        albumDescriptionTranslations: [...prev.albumDescriptionTranslations, newTranslation]
      }))
    } else if (field === 'track' && parentId) {
      setFormData(prev => ({
        ...prev,
        tracks: prev.tracks.map(track => 
          track.id === parentId
            ? { ...track, translations: [...(track.translations || []), newTranslation] }
            : track
        )
      }))
    }
  }

  const updateTranslation = (field: string, translationId: string, updates: Partial<Translation>, parentId?: string) => {
    if (field === 'albumTitle') {
      setFormData(prev => ({
        ...prev,
        albumTranslations: prev.albumTranslations.map(t =>
          t.id === translationId ? { ...t, ...updates } : t
        )
      }))
    } else if (field === 'albumDescription') {
      setFormData(prev => ({
        ...prev,
        albumDescriptionTranslations: prev.albumDescriptionTranslations.map(t =>
          t.id === translationId ? { ...t, ...updates } : t
        )
      }))
    } else if (field === 'track' && parentId) {
      setFormData(prev => ({
        ...prev,
        tracks: prev.tracks.map(track => 
          track.id === parentId
            ? {
                ...track,
                translations: track.translations.map(t =>
                  t.id === translationId ? { ...t, ...updates } : t
                )
              }
            : track
        )
      }))
    }
  }

  const removeTranslation = (field: string, translationId: string, parentId?: string) => {
    if (field === 'albumTitle') {
      setFormData(prev => ({
        ...prev,
        albumTranslations: prev.albumTranslations.filter(t => t.id !== translationId)
      }))
    } else if (field === 'albumDescription') {
      setFormData(prev => ({
        ...prev,
        albumDescriptionTranslations: prev.albumDescriptionTranslations.filter(t => t.id !== translationId)
      }))
    } else if (field === 'track' && parentId) {
      setFormData(prev => ({
        ...prev,
        tracks: prev.tracks.map(track => 
          track.id === parentId
            ? { ...track, translations: track.translations.filter(t => t.id !== translationId) }
            : track
        )
      }))
    }
  }

  // Artist management
  const addArtist = () => {
    const newArtist: Artist = {
      id: uuidv4(),
      primaryName: '',
      translations: [],
      isNewArtist: true,
      customIdentifiers: [],
      role: 'main'
    }
    setFormData(prev => ({ ...prev, artists: [...prev.artists, newArtist] }))
  }

  const updateArtist = (id: string, updates: Partial<Artist>) => {
    setFormData(prev => ({
      ...prev,
      artists: prev.artists.map(artist =>
        artist.id === id ? { ...artist, ...updates } : artist
      )
    }))
  }

  const removeArtist = (id: string) => {
    setFormData(prev => ({
      ...prev,
      artists: prev.artists.filter(artist => artist.id !== id)
    }))
  }

  // Track management
  const addTrack = () => {
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
      genre: formData.marketingGenre,
      audioLanguage: 'ko',
      metadataLanguage: 'ko',
      explicitContent: false,
      previewLength: 30
    }
    setFormData(prev => ({ ...prev, tracks: [...prev.tracks, newTrack] }))
  }

  const updateTrack = (id: string, updates: Partial<Track>) => {
    setFormData(prev => ({
      ...prev,
      tracks: prev.tracks.map(track =>
        track.id === id ? { ...track, ...updates } : track
      )
    }))
  }

  const removeTrack = (id: string) => {
    setFormData(prev => ({
      ...prev,
      tracks: prev.tracks.filter(track => track.id !== id)
    }))
  }

  // Contributor management
  const addContributor = (trackId?: string) => {
    const newContributor: Contributor = {
      id: uuidv4(),
      name: '',
      translations: [],
      roles: [],
      instruments: []
    }

    if (trackId) {
      setFormData(prev => ({
        ...prev,
        tracks: prev.tracks.map(track =>
          track.id === trackId
            ? { ...track, contributors: [...track.contributors, newContributor] }
            : track
        )
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        albumContributors: [...prev.albumContributors, newContributor]
      }))
    }
  }

  const updateContributor = (id: string, updates: Partial<Contributor>, trackId?: string) => {
    if (trackId) {
      setFormData(prev => ({
        ...prev,
        tracks: prev.tracks.map(track =>
          track.id === trackId
            ? {
                ...track,
                contributors: track.contributors.map(c =>
                  c.id === id ? { ...c, ...updates } : c
                )
              }
            : track
        )
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        albumContributors: prev.albumContributors.map(c =>
          c.id === id ? { ...c, ...updates } : c
        )
      }))
    }
  }

  const removeContributor = (id: string, trackId?: string) => {
    if (trackId) {
      setFormData(prev => ({
        ...prev,
        tracks: prev.tracks.map(track =>
          track.id === trackId
            ? { ...track, contributors: track.contributors.filter(c => c.id !== id) }
            : track
        )
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        albumContributors: prev.albumContributors.filter(c => c.id !== id)
      }))
    }
  }

  // Track reordering
  const onDragEnd = (result: any) => {
    if (!result.destination) return

    const items = Array.from(formData.tracks)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setFormData(prev => ({ ...prev, tracks: items }))
  }

  // File upload
  const handleFileUpload = async (files: File[], trackId: string) => {
    try {
      // Here you would integrate with Dropbox upload
      setFormData(prev => ({
        ...prev,
        audioFiles: {
          ...prev.audioFiles,
          [trackId]: files
        }
      }))
      toast.success(t('파일 업로드 성공', 'Files uploaded successfully'))
    } catch (error) {
      toast.error(t('파일 업로드 실패', 'File upload failed'))
    }
  }

  // Validation
  useEffect(() => {
    const dataString = JSON.stringify(formData)
    if (!isValidatingRef.current && dataString !== lastValidatedDataRef.current) {
      isValidatingRef.current = true
      lastValidatedDataRef.current = dataString
      
      const validationData = {
        artist: {
          nameKo: formData.artists[0]?.primaryName || '',
          nameEn: formData.artists[0]?.translations.find(t => t.language === 'en')?.text || '',
          genre: formData.marketingGenre ? [formData.marketingGenre] : []
        },
        album: {
          titleKo: formData.albumTitle,
          titleEn: formData.albumTranslations.find(t => t.language === 'en')?.text || '',
          format: formData.albumType,
          parentalAdvisory: formData.parentalAdvisory
        },
        tracks: formData.tracks.map(track => ({
          titleKo: track.title,
          titleEn: track.translations.find(t => t.language === 'en')?.text || '',
          featuring: track.featuringArtists.map(a => a.primaryName).join(', '),
          isrc: track.isrc,
          trackVersion: track.version,
          lyricsLanguage: track.audioLanguage,
          lyricsExplicit: track.explicitContent
        })),
        release: {
          consumerReleaseDate: formData.releaseDate,
          copyrightYear: formData.copyrightYear,
          cRights: formData.copyrightOwner,
          pRights: formData.masterRights
        }
      }

      const results = validateSubmission(validationData)
      setValidationResults(results)
      isValidatingRef.current = false
    }
  }, [formData])

  // Step renderer
  const renderStep = () => {
    switch (currentStep) {
      case 0: // Metadata (NEW - moved to first)
        return renderMetadata()
      case 1: // Artist Info
        return renderArtistInfo()
      case 2: // Album Basic Info
        return renderAlbumBasicInfo()
      case 3: // Track Info
        return renderTrackInfo()
      case 4: // Contributors
        return renderContributors()
      case 5: // Album Details
        return renderAlbumDetails()
      case 6: // Release Settings
        return renderReleaseSettings()
      case 7: // Marketing Info
        return renderMarketingInfo()
      case 8: // Distribution
        return renderDistribution()
      case 9: // Rights & Legal
        return renderRightsLegal()
      case 10: // Review & QC
        return renderReviewQC()
      case 11: // File Upload
        return renderFileUpload()
      case 12: // Final Submission
        return renderFinalSubmission()
      default:
        return null
    }
  }

  // Step 0: Metadata
  const renderMetadata = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          {t('음원 메타데이터', 'Release Metadata')}
        </h3>
        
        {/* Release Version */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-1">
              {t('릴리즈 버전', 'Release Version')}
            </label>
            <input
              type="text"
              value={formData.releaseVersion || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, releaseVersion: e.target.value }))}
              className="input"
              placeholder={t('예: Remix, Remastered, Acoustic Version', 'e.g., Remix, Remastered, Acoustic Version')}
            />
            <p className="text-xs text-gray-500 mt-1">
              {t('리믹스나 특별 버전인 경우에만 입력', 'Only fill for remixes or special versions')}
            </p>
          </div>

          {/* Identifiers */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              {t('식별자', 'Identifiers')}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">UPC</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.upc || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, upc: e.target.value.replace(/\D/g, '').slice(0, 12) }))}
                    className="input flex-1"
                    placeholder="000000000000"
                    maxLength={12}
                  />
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, upc: generateUPC() }))}
                    className="btn-secondary"
                  >
                    {t('자동생성', 'Generate')}
                  </button>
                </div>
                {formData.upc && !validateUPC(formData.upc) && (
                  <p className="text-xs text-red-500 mt-1">{t('유효하지 않은 UPC', 'Invalid UPC')}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">EAN</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.ean || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, ean: e.target.value.replace(/\D/g, '').slice(0, 13) }))}
                    className="input flex-1"
                    placeholder="0000000000000"
                    maxLength={13}
                  />
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, ean: generateEAN() }))}
                    className="btn-secondary"
                  >
                    {t('자동생성', 'Generate')}
                  </button>
                </div>
                {formData.ean && !validateEAN(formData.ean) && (
                  <p className="text-xs text-red-500 mt-1">{t('유효하지 않은 EAN', 'Invalid EAN')}</p>
                )}
              </div>
            </div>
          </div>

          {/* Release Dates */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {t('발매일 설정', 'Release Date Settings')}
            </h4>
            
            {/* Consumer Release Date */}
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <h5 className="font-medium mb-2">{t('일반 발매일', 'Consumer Release Date')} *</h5>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {t('음원이 스트리밍 플랫폼에 공개되는 날짜와 시간', 'Date and time when the release becomes available on streaming platforms')}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">{t('날짜', 'Date')} *</label>
                    <DatePicker
                      selected={new Date(formData.consumerReleaseDate)}
                      onChange={(date) => setFormData(prev => ({ 
                        ...prev, 
                        consumerReleaseDate: date?.toISOString().split('T')[0] || ''
                      }))}
                      className="input w-full"
                      dateFormat="yyyy-MM-dd"
                      minDate={new Date()}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">{t('시간', 'Time')} *</label>
                    <input
                      type="time"
                      value={formData.consumerReleaseTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, consumerReleaseTime: e.target.value }))}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">{t('시간대', 'Timezone')} *</label>
                    <select
                      value={formData.consumerTimezone}
                      onChange={(e) => setFormData(prev => ({ ...prev, consumerTimezone: e.target.value }))}
                      className="input"
                    >
                      {timezones.map(tz => (
                        <option key={tz.value} value={tz.value}>
                          {language === 'ko' ? tz.label : tz.labelEn}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {formData.consumerReleaseDate && formData.consumerReleaseTime && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    UTC: {convertToUTC(formData.consumerReleaseDate, formData.consumerReleaseTime, formData.consumerTimezone).toISOString()}
                  </p>
                )}
              </div>

              {/* Original Release Date */}
              <div className="bg-gray-50 dark:bg-gray-900/20 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium">{t('원곡 발매일', 'Original Release Date')}</h5>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.hasOriginalRelease}
                      onChange={(e) => setFormData(prev => ({ ...prev, hasOriginalRelease: e.target.checked }))}
                      className="rounded text-purple-500"
                    />
                    <span className="text-sm">{t('재발매/리믹스', 'Re-release/Remix')}</span>
                  </label>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {t('리믹스, 리마스터, 재발매의 경우 원곡이 처음 발매된 날짜', 'For remixes, remasters, or re-releases, the date when the original was first released')}
                </p>
                {formData.hasOriginalRelease && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">{t('날짜', 'Date')}</label>
                      <DatePicker
                        selected={formData.originalReleaseDate ? new Date(formData.originalReleaseDate) : null}
                        onChange={(date) => setFormData(prev => ({ 
                          ...prev, 
                          originalReleaseDate: date?.toISOString().split('T')[0] || ''
                        }))}
                        className="input w-full"
                        dateFormat="yyyy-MM-dd"
                        maxDate={new Date()}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">{t('시간', 'Time')}</label>
                      <input
                        type="time"
                        value={formData.originalReleaseTime}
                        onChange={(e) => setFormData(prev => ({ ...prev, originalReleaseTime: e.target.value }))}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">{t('시간대', 'Timezone')}</label>
                      <select
                        value={formData.originalTimezone}
                        onChange={(e) => setFormData(prev => ({ ...prev, originalTimezone: e.target.value }))}
                        className="input"
                      >
                        {timezones.map(tz => (
                          <option key={tz.value} value={tz.value}>
                            {language === 'ko' ? tz.label : tz.labelEn}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Label and Copyright Info */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              {t('레이블 및 저작권 정보', 'Label & Copyright Information')}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('레코드 레이블', 'Record Label')} *
                </label>
                <input
                  type="text"
                  value={formData.recordLabel || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, recordLabel: e.target.value }))}
                  className="input"
                  placeholder={t('레이블명 입력', 'Enter label name')}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('카탈로그 번호', 'Catalog Number')}
                </label>
                <input
                  type="text"
                  value={formData.catalogNumber || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, catalogNumber: e.target.value }))}
                  className="input"
                  placeholder={t('예: CAT-001', 'e.g., CAT-001')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('저작권 소유자', 'Copyright Holder')} *
                </label>
                <input
                  type="text"
                  value={formData.copyrightHolder || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, copyrightHolder: e.target.value }))}
                  className="input"
                  placeholder={t('© 소유자명', '© Holder name')}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('저작권 연도', 'Copyright Year')} *
                </label>
                <input
                  type="text"
                  value={formData.copyrightYear || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, copyrightYear: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                  className="input"
                  placeholder="2025"
                  maxLength={4}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('제작권 소유자', 'Production Holder')} *
                </label>
                <input
                  type="text"
                  value={formData.productionHolder || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, productionHolder: e.target.value }))}
                  className="input"
                  placeholder={t('℗ 소유자명', '℗ Holder name')}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('제작권 연도', 'Production Year')} *
                </label>
                <input
                  type="text"
                  value={formData.productionYear || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, productionYear: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                  className="input"
                  placeholder="2025"
                  maxLength={4}
                  required
                />
              </div>
            </div>
          </div>

          {/* Parental Advisory */}
          <div>
            <label className="block text-sm font-medium mb-1">
              {t('부모 권고 사항', 'Parental Advisory')}
            </label>
            <select
              value={formData.parentalAdvisory}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                parentalAdvisory: e.target.value as 'none' | 'explicit' | 'edited'
              }))}
              className="input"
            >
              <option value="none">{t('없음', 'None')}</option>
              <option value="explicit">{t('명시적 콘텐츠', 'Explicit Content')}</option>
              <option value="edited">{t('편집됨/깨끗한 버전', 'Edited/Clean')}</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )

  // Step 1: Artist Info
  const renderArtistInfo = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" />
          {t('아티스트 정보', 'Artist Information')}
        </h3>

        <div className="space-y-4">
          {formData.artists.map((artist, index) => (
            <div key={artist.id} className="bg-white/10 dark:bg-white/5 rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">
                  {t('아티스트', 'Artist')} {index + 1}
                </h4>
                {formData.artists.length > 1 && (
                  <button
                    onClick={() => removeArtist(artist.id)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t('기본 이름', 'Primary Name')} *
                  </label>
                  <input
                    type="text"
                    value={artist.primaryName}
                    onChange={(e) => updateArtist(artist.id, { primaryName: e.target.value })}
                    className="input"
                    placeholder={t('아티스트 이름 입력', 'Enter artist name')}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">
                      {t('번역', 'Translations')}
                    </label>
                    <button
                      onClick={() => {
                        const newTranslation: Translation = {
                          id: uuidv4(),
                          language: '',
                          text: ''
                        }
                        updateArtist(artist.id, {
                          translations: [...artist.translations, newTranslation]
                        })
                      }}
                      className="btn-ghost text-sm"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      {t('번역 추가', 'Add Translation')}
                    </button>
                  </div>

                  {artist.translations.map((translation) => (
                    <div key={translation.id} className="flex items-center gap-2">
                      <select
                        value={translation.language}
                        onChange={(e) => {
                          updateArtist(artist.id, {
                            translations: artist.translations.map(t =>
                              t.id === translation.id
                                ? { ...t, language: e.target.value }
                                : t
                            )
                          })
                        }}
                        className="input flex-none w-32"
                      >
                        <option value="">{t('언어 선택', 'Select language')}</option>
                        {languageOptions.map(lang => (
                          <option key={lang.value} value={lang.value}>
                            {lang.label}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={translation.text}
                        onChange={(e) => {
                          updateArtist(artist.id, {
                            translations: artist.translations.map(t =>
                              t.id === translation.id
                                ? { ...t, text: e.target.value }
                                : t
                            )
                          })
                        }}
                        className="input flex-1"
                        placeholder={t('번역된 이름', 'Translated name')}
                      />
                      <button
                        onClick={() => {
                          updateArtist(artist.id, {
                            translations: artist.translations.filter(t => t.id !== translation.id)
                          })
                        }}
                        className="text-red-500 hover:text-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {t('출신 국가', 'Country of Origin')}
                    </label>
                    <input
                      type="text"
                      value={artist.countryOfOrigin || ''}
                      onChange={(e) => updateArtist(artist.id, { countryOfOrigin: e.target.value })}
                      className="input"
                      placeholder="KR"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {t('역할', 'Role')}
                    </label>
                    <select
                      value={artist.role}
                      onChange={(e) => updateArtist(artist.id, { role: e.target.value as 'main' | 'featuring' })}
                      className="input"
                    >
                      <option value="main">{t('메인 아티스트', 'Main Artist')}</option>
                      <option value="featuring">{t('피처링 아티스트', 'Featuring Artist')}</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  <h5 className="text-sm font-medium">{t('소셜 미디어 링크', 'Social Media Links')}</h5>
                  
                  <div>
                    <label className="block text-sm mb-1">YouTube Channel ID</label>
                    <input
                      type="text"
                      value={artist.youtubeChannelId || ''}
                      onChange={(e) => updateArtist(artist.id, { youtubeChannelId: e.target.value })}
                      className="input"
                      placeholder="UCxxxxxxxxxxxxxxxxxxxxxx"
                    />
                  </div>

                  <div>
                    <label className="block text-sm mb-1">Spotify Artist ID</label>
                    <input
                      type="text"
                      value={artist.spotifyId || ''}
                      onChange={(e) => updateArtist(artist.id, { spotifyId: e.target.value })}
                      className="input"
                      placeholder="xxxxxxxxxxxxxxxxxx"
                    />
                  </div>

                  <div>
                    <label className="block text-sm mb-1">Apple Music Artist ID</label>
                    <input
                      type="text"
                      value={artist.appleMusicId || ''}
                      onChange={(e) => updateArtist(artist.id, { appleMusicId: e.target.value })}
                      className="input"
                      placeholder="xxxxxxxxxx"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}

          <button
            onClick={addArtist}
            className="btn-secondary w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t('아티스트 추가', 'Add Artist')}
          </button>
        </div>
      </div>
    </div>
  )

  // Step 1: Album Basic Info
  const renderAlbumBasicInfo = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          {t('앨범 기본 정보', 'Album Basic Information')}
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              {t('앨범 제목', 'Album Title')} *
            </label>
            <input
              type="text"
              value={formData.albumTitle}
              onChange={(e) => setFormData(prev => ({ ...prev, albumTitle: e.target.value }))}
              className="input"
              placeholder={t('앨범 제목 입력', 'Enter album title')}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">
                {t('앨범 제목 번역', 'Album Title Translations')}
              </label>
              <button
                onClick={() => addTranslation('albumTitle')}
                className="btn-ghost text-sm"
              >
                <Plus className="w-4 h-4 mr-1" />
                {t('번역 추가', 'Add Translation')}
              </button>
            </div>

            {formData.albumTranslations.map((translation) => (
              <div key={translation.id} className="flex items-center gap-2">
                <select
                  value={translation.language}
                  onChange={(e) => updateTranslation('albumTitle', translation.id, { language: e.target.value })}
                  className="input flex-none w-32"
                >
                  <option value="">{t('언어 선택', 'Select language')}</option>
                  {languageOptions.map(lang => (
                    <option key={lang.value} value={lang.value}>
                      {lang.label}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={translation.text}
                  onChange={(e) => updateTranslation('albumTitle', translation.id, { text: e.target.value })}
                  className="input flex-1"
                  placeholder={t('번역된 제목', 'Translated title')}
                />
                <button
                  onClick={() => removeTranslation('albumTitle', translation.id)}
                  className="text-red-500 hover:text-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                {t('앨범 유형', 'Album Type')} *
              </label>
              <select
                value={formData.albumType}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  albumType: e.target.value as 'single' | 'ep' | 'album'
                }))}
                className="input"
              >
                <option value="single">{t('싱글', 'Single')}</option>
                <option value="ep">{t('EP', 'EP')}</option>
                <option value="album">{t('정규', 'Album')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                {t('발매일', 'Release Date')} *
              </label>
              <DatePicker
                selected={new Date(formData.releaseDate)}
                onChange={(date) => setFormData(prev => ({ 
                  ...prev, 
                  releaseDate: date?.toISOString().split('T')[0] || ''
                }))}
                className="input w-full"
                placeholderText={t('발매일 선택', 'Select release date')}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                {t('발매 시간', 'Release Time')}
              </label>
              <input
                type="time"
                value={formData.releaseTime}
                onChange={(e) => setFormData(prev => ({ ...prev, releaseTime: e.target.value }))}
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                {t('시간대', 'Timezone')}
              </label>
              <select
                value={formData.timezone}
                onChange={(e) => setFormData(prev => ({ ...prev, timezone: e.target.value }))}
                className="input"
              >
                <option value="Asia/Seoul">Asia/Seoul (KST)</option>
                <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                <option value="Asia/Shanghai">Asia/Shanghai (CST)</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
                <option value="Europe/Paris">Europe/Paris (CET)</option>
              </select>
            </div>
          </div>

          {/* Album Notes field for Korean DSPs */}
          <div>
            <label className="block text-sm font-medium mb-1">
              {t('앨범 노트', 'Album Notes')}
            </label>
            <textarea
              value={formData.albumNotes || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, albumNotes: e.target.value }))}
              className="input min-h-[150px]"
              placeholder={t('한국 DSP에서 보여질 앨범 소개글 및 크레딧 정보를 입력하세요', 'Enter album introduction and credits information for Korean DSPs')}
              rows={6}
            />
            <p className="text-xs text-gray-500 mt-1">
              {t('한국 음원 사이트에서 앨범 정보 페이지에 표시될 소개글입니다', 'This will be displayed on the album information page on Korean music streaming platforms')}
            </p>
          </div>

          {/* FUGA 마케팅 필드 - Priority Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('우선순위 레벨', 'Priority Level')}
            </label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setFormData({ ...formData, priorityLevel: level })}
                  className={`p-2 transition-colors ${
                    formData.priorityLevel === level
                      ? 'text-yellow-500'
                      : 'text-gray-300 hover:text-yellow-400'
                  }`}
                >
                  <svg className="w-6 h-6 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>
              ))}
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                ({formData.priorityLevel || 3}/5)
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {t('릴리즈의 마케팅 우선순위를 설정하세요 (1: 낮음, 5: 높음)', 'Set marketing priority for this release (1: Low, 5: High)')}
            </p>
          </div>

          {/* FUGA 마케팅 필드 - Project Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('프로젝트 타입', 'Project Type')}
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="projectType"
                  value="FRONTLINE"
                  checked={formData.projectType === 'FRONTLINE'}
                  onChange={(e) => setFormData({ ...formData, projectType: e.target.value as 'FRONTLINE' | 'CATALOG' })}
                  className="w-4 h-4 text-n3rve-main bg-gray-100 border-gray-300 focus:ring-n3rve-accent focus:ring-2"
                />
                <span className="ml-2 text-sm text-gray-900 dark:text-white">
                  {t('프론트라인', 'Frontline')}
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="projectType"
                  value="CATALOG"
                  checked={formData.projectType === 'CATALOG'}
                  onChange={(e) => setFormData({ ...formData, projectType: e.target.value as 'FRONTLINE' | 'CATALOG' })}
                  className="w-4 h-4 text-n3rve-main bg-gray-100 border-gray-300 focus:ring-n3rve-accent focus:ring-2"
                />
                <span className="ml-2 text-sm text-gray-900 dark:text-white">
                  {t('카탈로그', 'Catalog')}
                </span>
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {t('프론트라인: 신규 릴리즈, 카탈로그: 기존 음원', 'Frontline: New release, Catalog: Existing music')}
            </p>
          </div>

          {/* FUGA 마케팅 필드 - Private Listening Link */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('비공개 청취 링크', 'Private Listening Link')}
            </label>
            <input
              type="url"
              value={formData.privateListeningLink}
              onChange={(e) => setFormData({ ...formData, privateListeningLink: e.target.value })}
              className="input"
              placeholder={t('https://example.com/private-link', 'https://example.com/private-link')}
            />
            <p className="text-xs text-gray-500 mt-1">
              {t('미리 들어볼 수 있는 비공개 링크를 입력하세요', 'Enter a private link for preview listening')}
            </p>
          </div>

          {/* FUGA 마케팅 필드 - Fact Sheets URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('팩트시트/프로젝트 덱 URL', 'Fact Sheets/Project Deck URL')}
            </label>
            <input
              type="url"
              value={formData.factSheetsUrl}
              onChange={(e) => setFormData({ ...formData, factSheetsUrl: e.target.value })}
              className="input"
              placeholder={t('https://example.com/factsheet.pdf', 'https://example.com/factsheet.pdf')}
            />
            <p className="text-xs text-gray-500 mt-1">
              {t('아티스트/앨범 정보가 담긴 팩트시트나 프로젝트 덱 URL을 입력하세요', 'Enter URL for fact sheet or project deck containing artist/album information')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  // Step 2: Track Info
  const renderTrackInfo = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Music className="w-5 h-5" />
            {t('트랙 정보', 'Track Information')}
          </h3>
          <button
            onClick={addTrack}
            className="btn-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t('트랙 추가', 'Add Track')}
          </button>
        </div>

        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="tracks">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                {formData.tracks.map((track, index) => (
                  <Draggable key={track.id} draggableId={track.id} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="bg-white/10 dark:bg-white/5 rounded-lg p-4 space-y-4"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div {...provided.dragHandleProps}>
                              <GripVertical className="w-5 h-5 text-gray-400" />
                            </div>
                            <h4 className="font-medium">
                              {t('트랙', 'Track')} {index + 1}
                            </h4>
                            {track.isTitle && (
                              <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded">
                                {t('타이틀', 'Title')}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => removeTrack(track.id)}
                            className="text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium mb-1">
                              {t('트랙 제목', 'Track Title')} *
                            </label>
                            <input
                              type="text"
                              value={track.title}
                              onChange={(e) => updateTrack(track.id, { title: e.target.value })}
                              className="input"
                              placeholder={t('트랙 제목 입력', 'Enter track title')}
                            />
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="text-sm font-medium">
                                {t('트랙 제목 번역', 'Track Title Translations')}
                              </label>
                              <button
                                onClick={() => addTranslation('track', track.id)}
                                className="btn-ghost text-sm"
                              >
                                <Plus className="w-4 h-4 mr-1" />
                                {t('번역 추가', 'Add Translation')}
                              </button>
                            </div>

                            {track.translations.map((translation) => (
                              <div key={translation.id} className="flex items-center gap-2">
                                <select
                                  value={translation.language}
                                  onChange={(e) => updateTranslation('track', translation.id, { language: e.target.value }, track.id)}
                                  className="input flex-none w-32"
                                >
                                  <option value="">{t('언어 선택', 'Select language')}</option>
                                  {languageOptions.map(lang => (
                                    <option key={lang.value} value={lang.value}>
                                      {lang.label}
                                    </option>
                                  ))}
                                </select>
                                <input
                                  type="text"
                                  value={translation.text}
                                  onChange={(e) => updateTranslation('track', translation.id, { text: e.target.value }, track.id)}
                                  className="input flex-1"
                                  placeholder={t('번역된 제목', 'Translated title')}
                                />
                                <button
                                  onClick={() => removeTranslation('track', translation.id, track.id)}
                                  className="text-red-500 hover:text-red-600"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-medium mb-1">
                                {t('장르', 'Genre')}
                              </label>
                              <select
                                value={track.genre || ''}
                                onChange={(e) => updateTrack(track.id, { genre: e.target.value })}
                                className="input"
                              >
                                <option value="">{t('장르 선택', 'Select genre')}</option>
                                {genreOptions.map(genre => (
                                  <option key={genre} value={genre}>{genre}</option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium mb-1">ISRC</label>
                              <input
                                type="text"
                                value={track.isrc || ''}
                                onChange={(e) => updateTrack(track.id, { isrc: e.target.value })}
                                className="input"
                                placeholder="USKRE2400001"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-sm font-medium mb-1">
                                {t('작곡가', 'Composer')}
                              </label>
                              <input
                                type="text"
                                value={track.composer || ''}
                                onChange={(e) => updateTrack(track.id, { composer: e.target.value })}
                                className="input"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium mb-1">
                                {t('작사가', 'Lyricist')}
                              </label>
                              <input
                                type="text"
                                value={track.lyricist || ''}
                                onChange={(e) => updateTrack(track.id, { lyricist: e.target.value })}
                                className="input"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium mb-1">
                                {t('편곡자', 'Arranger')}
                              </label>
                              <input
                                type="text"
                                value={track.arranger || ''}
                                onChange={(e) => updateTrack(track.id, { arranger: e.target.value })}
                                className="input"
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={track.isTitle}
                                onChange={(e) => {
                                  // Only one title track allowed
                                  setFormData(prev => ({
                                    ...prev,
                                    tracks: prev.tracks.map(t => ({
                                      ...t,
                                      isTitle: t.id === track.id ? e.target.checked : false
                                    }))
                                  }))
                                }}
                                className="rounded"
                              />
                              <span className="text-sm">{t('타이틀 트랙', 'Title Track')}</span>
                            </label>

                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={track.explicitContent || false}
                                onChange={(e) => updateTrack(track.id, { explicitContent: e.target.checked })}
                                className="rounded"
                              />
                              <span className="text-sm">{t('19금 콘텐츠', 'Explicit Content')}</span>
                            </label>

                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={track.dolbyAtmos || false}
                                onChange={(e) => updateTrack(track.id, { dolbyAtmos: e.target.checked })}
                                className="rounded"
                              />
                              <span className="text-sm">Dolby Atmos</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </div>
  )

  // Step 3: Contributors
  const renderContributors = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <UserCheck className="w-5 h-5" />
          {t('기여자 정보', 'Contributor Information')}
        </h3>

        <div className="space-y-6">
          {/* Album Contributors */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">{t('앨범 기여자', 'Album Contributors')}</h4>
              <button
                onClick={() => addContributor()}
                className="btn-ghost text-sm"
              >
                <Plus className="w-4 h-4 mr-1" />
                {t('기여자 추가', 'Add Contributor')}
              </button>
            </div>

            <div className="space-y-3">
              {formData.albumContributors.map((contributor) => (
                <div key={contributor.id} className="bg-white/10 dark:bg-white/5 rounded-lg p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      value={contributor.name}
                      onChange={(e) => updateContributor(contributor.id, { name: e.target.value })}
                      className="input flex-1 mr-2"
                      placeholder={t('기여자 이름', 'Contributor name')}
                    />
                    <button
                      onClick={() => removeContributor(contributor.id)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {t('역할', 'Roles')}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries((contributorRoles || []).reduce((acc, role) => {
                        if (!acc[role.category]) acc[role.category] = []
                        acc[role.category].push(role)
                        return acc
                      }, {} as Record<string, typeof contributorRoles>)).map(([category, roles]) => (
                        <select
                          key={category}
                          className="input text-sm"
                          onChange={(e) => {
                            const role = e.target.value
                            if (role && !(contributor.roles || []).includes(role)) {
                              updateContributor(contributor.id, {
                                roles: [...(contributor.roles || []), role]
                              })
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
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(contributor.roles || []).map(roleValue => {
                        const role = (contributorRoles || []).find(r => r.value === roleValue)
                        return role ? (
                          <span
                            key={roleValue}
                            className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded flex items-center gap-1"
                          >
                            {language === 'ko' ? role.label : role.labelEn}
                            <button
                              onClick={() => updateContributor(contributor.id, {
                                roles: (contributor.roles || []).filter(r => r !== roleValue)
                              })}
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
                        className="input pl-10 text-sm"
                        placeholder={t('악기 검색...', 'Search instruments...')}
                        onChange={(e) => {
                          const results = searchInstruments(e.target.value)
                          // Show results in dropdown (implement dropdown UI)
                        }}
                      />
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {contributor.instruments?.map(instrument => (
                        <span
                          key={instrument}
                          className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded flex items-center gap-1"
                        >
                          {instrument}
                          <button
                            onClick={() => updateContributor(contributor.id, {
                              instruments: contributor.instruments?.filter(i => i !== instrument) || []
                            })}
                            className="hover:text-blue-100"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Track Contributors */}
          {formData.tracks.map((track, trackIndex) => (
            <div key={track.id}>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">
                  {t('트랙', 'Track')} {trackIndex + 1} {t('기여자', 'Contributors')}
                </h4>
                <button
                  onClick={() => addContributor(track.id)}
                  className="btn-ghost text-sm"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  {t('기여자 추가', 'Add Contributor')}
                </button>
              </div>

              <div className="space-y-3">
                {track.contributors.map((contributor) => (
                  <div key={contributor.id} className="bg-white/10 dark:bg-white/5 rounded-lg p-3 space-y-3">
                    {/* Similar contributor UI as album contributors */}
                    <div className="flex items-center justify-between">
                      <input
                        type="text"
                        value={contributor.name}
                        onChange={(e) => updateContributor(contributor.id, { name: e.target.value }, track.id)}
                        className="input flex-1 mr-2"
                        placeholder={t('기여자 이름', 'Contributor name')}
                      />
                      <button
                        onClick={() => removeContributor(contributor.id, track.id)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  // Step 4: Album Details
  const renderAlbumDetails = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Image className="w-5 h-5" />
          {t('앨범 상세 정보', 'Album Details')}
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              {t('앨범 커버', 'Album Cover')} *
            </label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
              {formData.albumCoverArtUrl ? (
                <div className="space-y-3">
                  <img
                    src={formData.albumCoverArtUrl}
                    alt="Album cover"
                    className="mx-auto w-48 h-48 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => setFormData(prev => ({ 
                      ...prev, 
                      albumCoverArt: null,
                      albumCoverArtUrl: ''
                    }))}
                    className="btn-ghost text-sm"
                  >
                    {t('변경', 'Change')}
                  </button>
                </div>
              ) : (
                <div>
                  <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-sm text-gray-500 mb-2">
                    {t('이미지를 드래그하거나 클릭하여 업로드', 'Drag image or click to upload')}
                  </p>
                  <input
                    type="file"
                    accept="image/*"
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
                  <label
                    htmlFor="album-cover-upload"
                    className="btn-primary cursor-pointer"
                  >
                    {t('파일 선택', 'Choose File')}
                  </label>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {t('최소 3000x3000px, JPG 또는 PNG', 'Minimum 3000x3000px, JPG or PNG')}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {t('앨범 설명', 'Album Description')}
            </label>
            <textarea
              value={formData.albumDescription}
              onChange={(e) => setFormData(prev => ({ ...prev, albumDescription: e.target.value }))}
              className="input min-h-[100px]"
              placeholder={t('앨범에 대한 설명을 입력하세요', 'Enter album description')}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">
                {t('앨범 설명 번역', 'Album Description Translations')}
              </label>
              <button
                onClick={() => addTranslation('albumDescription')}
                className="btn-ghost text-sm"
              >
                <Plus className="w-4 h-4 mr-1" />
                {t('번역 추가', 'Add Translation')}
              </button>
            </div>

            {formData.albumDescriptionTranslations.map((translation) => (
              <div key={translation.id} className="space-y-2">
                <div className="flex items-center gap-2">
                  <select
                    value={translation.language}
                    onChange={(e) => updateTranslation('albumDescription', translation.id, { language: e.target.value })}
                    className="input flex-none w-32"
                  >
                    <option value="">{t('언어 선택', 'Select language')}</option>
                    {languageOptions.map(lang => (
                      <option key={lang.value} value={lang.value}>
                        {lang.label}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => removeTranslation('albumDescription', translation.id)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <textarea
                  value={translation.text}
                  onChange={(e) => updateTranslation('albumDescription', translation.id, { text: e.target.value })}
                  className="input min-h-[80px]"
                  placeholder={t('번역된 설명', 'Translated description')}
                />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                {t('레이블', 'Record Label')}
              </label>
              <input
                type="text"
                value={formData.recordLabel}
                onChange={(e) => setFormData(prev => ({ ...prev, recordLabel: e.target.value }))}
                className="input"
                placeholder={t('레이블명', 'Label name')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                {t('카탈로그 번호', 'Catalog Number')}
              </label>
              <input
                type="text"
                value={formData.catalogNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, catalogNumber: e.target.value }))}
                className="input"
                placeholder="CAT-001"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  // Step 5: Release Settings
  const renderReleaseSettings = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          {t('릴리즈 설정', 'Release Settings')}
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              {t('배포 지역', 'Distribution Territories')}
            </label>
            <RegionSelector
              selectedRegions={formData.territories}
              onChange={(regions) => setFormData(prev => ({ ...prev, territories: regions }))}
              excludedRegions={formData.excludedTerritories}
              onExcludedChange={(regions) => setFormData(prev => ({ ...prev, excludedTerritories: regions }))}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                {t('디지털 발매일', 'Digital Release Date')}
              </label>
              <DatePicker
                selected={formData.digitalReleaseDate ? new Date(formData.digitalReleaseDate) : null}
                onChange={(date) => setFormData(prev => ({ 
                  ...prev, 
                  digitalReleaseDate: date?.toISOString().split('T')[0] || ''
                }))}
                className="input w-full"
                placeholderText={t('디지털 발매일', 'Digital release date')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                {t('피지컬 발매일', 'Physical Release Date')}
              </label>
              <DatePicker
                selected={formData.physicalReleaseDate ? new Date(formData.physicalReleaseDate) : null}
                onChange={(date) => setFormData(prev => ({ 
                  ...prev, 
                  physicalReleaseDate: date?.toISOString().split('T')[0] || ''
                }))}
                className="input w-full"
                placeholderText={t('피지컬 발매일', 'Physical release date')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                {t('예약 판매 시작일', 'Pre-order Date')}
              </label>
              <DatePicker
                selected={formData.preOrderDate ? new Date(formData.preOrderDate) : null}
                onChange={(date) => setFormData(prev => ({ 
                  ...prev, 
                  preOrderDate: date?.toISOString().split('T')[0] || ''
                }))}
                className="input w-full"
                placeholderText={t('예약 판매 시작일', 'Pre-order date')}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  // Step 6: Marketing Info
  const renderMarketingInfo = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Megaphone className="w-5 h-5" />
          {t('마케팅 정보', 'Marketing Information')}
        </h3>

        <div className="space-y-6">
          {/* Private Listening Link */}
          <div>
            <label className="block text-sm font-medium mb-1">
              {t('프라이빗 리스닝 링크', 'Private Listening Link')} *
            </label>
            <input
              type="url"
              value={formData.privateListeningLink || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, privateListeningLink: e.target.value }))}
              className="input"
              placeholder={t('프라이빗 스트리밍 링크 입력', 'Enter private streaming link')}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              {t('릴리즈 전 음원을 들을 수 있는 프라이빗 링크', 'Private link to listen to the release before launch')}
            </p>
          </div>

          {/* Main Genre */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                {t('메인 장르', 'Main Genre')} *
              </label>
              <select
                value={formData.mainGenre || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, mainGenre: e.target.value }))}
                className="input"
                required
              >
                <option value="">{t('장르 선택', 'Select genre')}</option>
                {genreOptions.map(genre => (
                  <option key={genre} value={genre}>{genre}</option>
                ))}
              </select>
            </div>

            {/* Mood(s) */}
            <div>
              <label className="block text-sm font-medium mb-1">
                {t('분위기', 'Mood(s)')}
              </label>
              <MultiSelect
                options={moodOptions}
                value={formData.moods}
                onChange={(value) => setFormData(prev => ({ ...prev, moods: value }))}
                placeholder={t('분위기 선택 (최대 3개)', 'Select moods (max 3)')}
                max={3}
              />
            </div>
          </div>

          {/* YouTube Shorts & This Is Playlist */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                {t('YouTube Shorts 프리뷰', 'YouTube Shorts Previews')}
                <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded">
                  {formData.youtubeShortsPreviews ? 'Yes' : 'No'}
                </span>
              </label>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, youtubeShortsPreviews: !prev.youtubeShortsPreviews }))}
                className={`w-full py-2 rounded-lg transition-colors ${
                  formData.youtubeShortsPreviews 
                    ? 'bg-purple-500 text-white' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                {formData.youtubeShortsPreviews ? t('활성화됨', 'Enabled') : t('비활성화됨', 'Disabled')}
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                {t('"This Is" 플레이리스트', '"This Is" Playlist')}
                <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded">
                  {formData.thisIsPlaylist ? 'Yes' : 'No'}
                </span>
              </label>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, thisIsPlaylist: !prev.thisIsPlaylist }))}
                className={`w-full py-2 rounded-lg transition-colors ${
                  formData.thisIsPlaylist 
                    ? 'bg-purple-500 text-white' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                {formData.thisIsPlaylist ? t('포함', 'Include') : t('미포함', 'Exclude')}
              </button>
            </div>
          </div>

          {/* Dolby Atmos & Motion Artwork */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                {t('Dolby Atmos 공간 음향', 'Dolby Atmos Spatial Audio')}
                <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded">
                  {formData.dolbyAtmosSpatialAudio ? 'Yes' : 'No'}
                </span>
              </label>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, dolbyAtmosSpatialAudio: !prev.dolbyAtmosSpatialAudio }))}
                className={`w-full py-2 rounded-lg transition-colors ${
                  formData.dolbyAtmosSpatialAudio 
                    ? 'bg-purple-500 text-white' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                {formData.dolbyAtmosSpatialAudio ? t('지원', 'Supported') : t('미지원', 'Not Supported')}
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                {t('모션 아트워크', 'Motion Artwork')}
                <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded">
                  {formData.motionArtwork ? 'Yes' : 'No'}
                </span>
              </label>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, motionArtwork: !prev.motionArtwork }))}
                className={`w-full py-2 rounded-lg transition-colors ${
                  formData.motionArtwork 
                    ? 'bg-purple-500 text-white' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                {formData.motionArtwork ? t('있음', 'Available') : t('없음', 'Not Available')}
              </button>
            </div>
          </div>

          {/* Soundtrack/Score */}
          <div>
            <label className="block text-sm font-medium mb-1">
              {t('사운드트랙/스코어 정보', 'Soundtrack/Score Information')}
            </label>
            <textarea
              value={formData.soundtrackScore || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, soundtrackScore: e.target.value }))}
              className="input min-h-[80px]"
              placeholder={t('영화, TV, 게임 등의 사운드트랙 정보', 'Information about movie, TV, game soundtracks')}
            />
          </div>

          {/* Instruments */}
          <div>
            <label className="block text-sm font-medium mb-1">
              {t('사용된 악기', 'Instruments Used')}
            </label>
            <MultiSelect
              options={instrumentOptions}
              value={formData.instruments}
              onChange={(value) => setFormData(prev => ({ ...prev, instruments: value }))}
              placeholder={t('악기 선택', 'Select instruments')}
            />
          </div>

          {/* Subgenres - Custom Input */}
          <div>
            <label className="block text-sm font-medium mb-1">
              {t('서브장르', 'Subgenre(s)')}
            </label>
            <div className="space-y-2">
              {formData.subgenres.map((subgenre, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={subgenre}
                    onChange={(e) => {
                      const newSubgenres = [...formData.subgenres];
                      newSubgenres[index] = e.target.value;
                      setFormData(prev => ({ ...prev, subgenres: newSubgenres }));
                    }}
                    className="input flex-1"
                    placeholder={t('서브장르 입력', 'Enter subgenre')}
                  />
                  <button
                    onClick={() => {
                      const newSubgenres = formData.subgenres.filter((_, i) => i !== index);
                      setFormData(prev => ({ ...prev, subgenres: newSubgenres }));
                    }}
                    className="text-red-500 hover:text-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => setFormData(prev => ({ ...prev, subgenres: [...prev.subgenres, ''] }))}
                className="btn-ghost text-sm"
              >
                <Plus className="w-4 h-4 mr-1" />
                {t('서브장르 추가', 'Add Subgenre')}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {t('직접 서브장르를 입력할 수 있습니다', 'You can enter custom subgenres')}
            </p>
          </div>

          {/* Marketing Drivers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div>
              <label className="block text-sm font-medium mb-1">
                {t('마케팅 드라이버', 'Marketing Drivers')}
              </label>
              <input
                type="text"
                value={formData.marketingDrivers || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, marketingDrivers: e.target.value }))}
                className="input"
                placeholder={t('예: Radio, Playlist, Social Media', 'e.g., Radio, Playlist, Social Media')}
              />
            </div>
          </div>

          {/* Social Media/Political Plan */}
          <div>
            <label className="block text-sm font-medium mb-1">
              {t('소셜 미디어/정치적 계획', 'Social Media/Political Plan')}
            </label>
            <textarea
              value={formData.socialMediaPoliticalPlan || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, socialMediaPoliticalPlan: e.target.value }))}
              className="input min-h-[100px]"
              placeholder={t('소셜 미디어 캠페인 및 관련 전략 설명', 'Describe social media campaigns and related strategies')}
            />
          </div>

          {/* Artist Profile for Marketing */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" />
              {t('아티스트 프로필', 'Artist Profile')}
            </h4>

            <div className="space-y-4">
              {/* Artist Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t('아티스트 국가', "Artist's Country")} *
                  </label>
                  <select
                    value={formData.artistCountry || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, artistCountry: e.target.value }))}
                    className="input"
                    required
                  >
                    <option value="">{t('국가 선택', 'Select country')}</option>
                    {countries.map(country => (
                      <option key={country.code} value={country.name}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t('아티스트 성별', 'Artist Gender')}
                  </label>
                  <select
                    value={formData.artistGender || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, artistGender: e.target.value }))}
                    className="input"
                  >
                    <option value="">{t('선택', 'Select')}</option>
                    {genderOptions.map(gender => (
                      <option key={gender} value={gender}>{gender}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Artist Location Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t('현재 거주 도시', "Artist's Current City")}
                  </label>
                  <input
                    type="text"
                    value={formData.artistCurrentCity || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, artistCurrentCity: e.target.value }))}
                    className="input"
                    placeholder={t('예: Seoul, Los Angeles', 'e.g., Seoul, Los Angeles')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t('고향', "Artist's Hometown")}
                  </label>
                  <input
                    type="text"
                    value={formData.artistHometown || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, artistHometown: e.target.value }))}
                    className="input"
                    placeholder={t('예: Busan, Tokyo', 'e.g., Busan, Tokyo')}
                  />
                </div>
              </div>

              {/* Artist Gender */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('아티스트 성별', 'Artist Gender')}
                </label>
                <select
                  value={formData.artistGender || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, artistGender: e.target.value }))}
                  className="input"
                >
                  <option value="">{t('선택하세요', 'Select')}</option>
                  <option value="male">{t('남성', 'Male')}</option>
                  <option value="female">{t('여성', 'Female')}</option>
                  <option value="mixed-band">{t('혼성 밴드', 'Mixed (band)')}</option>
                  <option value="non-binary">{t('논바이너리', 'Non-Binary')}</option>
                  <option value="trans">{t('트랜스젠더', 'Trans')}</option>
                  <option value="prefer-not-to-say">{t('밝히고 싶지 않음', 'Prefer Not To Say')}</option>
                  <option value="other">{t('기타', 'Other')}</option>
                </select>
              </div>

              {/* Social Movements */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('사회 운동 / 인식 개선', 'Social Movements / Awareness-Raising')}
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                  {[
                    { value: 'aapi', label: 'AAPI' },
                    { value: 'blm', label: 'Black History Month / BLM' },
                    { value: 'climate', label: 'Climate Action' },
                    { value: 'democracy', label: 'Democracy & Peace' },
                    { value: 'gender-equality', label: 'Gender Equality' },
                    { value: 'lgbtq', label: 'LGBTQ+ Rights' },
                    { value: 'mental-health', label: 'Mental Health' },
                    { value: 'indigenous', label: 'Indigenous Heritage' },
                    { value: 'humanitarian', label: 'Humanitarian Aid' }
                  ].map(movement => (
                    <label key={movement.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.socialMovements?.includes(movement.value) || false}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData(prev => ({
                              ...prev,
                              socialMovements: [...(prev.socialMovements || []), movement.value]
                            }))
                          } else {
                            setFormData(prev => ({
                              ...prev,
                              socialMovements: (prev.socialMovements || []).filter(m => m !== movement.value)
                            }))
                          }
                        }}
                        className="rounded text-purple-500"
                      />
                      <span className="text-sm">{movement.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Artist Bio */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('아티스트 바이오', 'Artist Bio')}
                </label>
                <textarea
                  value={formData.artistBio || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, artistBio: e.target.value }))}
                  className="input min-h-[120px]"
                  placeholder={t('아티스트 소개 및 배경 정보', 'Artist introduction and background information')}
                />
              </div>

              {/* Similar Artists */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('유사 아티스트 (사운드)', 'Similar Artists (Sounds Like)')}
                </label>
                <input
                  type="text"
                  className="input"
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

              {/* Sync History */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t('싱크 히스토리 여부', 'Artist Sync History Y/N')}
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="syncHistory"
                        value="yes"
                        checked={formData.artistSyncHistory === 'yes'}
                        onChange={(e) => setFormData(prev => ({ ...prev, artistSyncHistory: e.target.value }))}
                        className="text-purple-500"
                      />
                      <span>{t('예', 'Yes')}</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="syncHistory"
                        value="no"
                        checked={formData.artistSyncHistory === 'no'}
                        onChange={(e) => setFormData(prev => ({ ...prev, artistSyncHistory: e.target.value }))}
                        className="text-purple-500"
                      />
                      <span>{t('아니오', 'No')}</span>
                    </label>
                  </div>
                </div>

                {formData.artistSyncHistory === 'yes' && (
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {t('싱크 히스토리 상세', 'Artist Sync History Details')}
                    </label>
                    <textarea
                      value={formData.artistSyncHistoryDetails || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, artistSyncHistoryDetails: e.target.value }))}
                      className="input min-h-[60px]"
                      placeholder={t('싱크 사용 이력 설명', 'Describe sync usage history')}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* DSP Artist Profile IDs */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Music className="w-4 h-4" />
              {t('DSP 아티스트 프로필 ID', 'DSP Artist Profile IDs')}
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Spotify Identifier (URI)
                </label>
                <input
                  type="text"
                  value={formData.spotifyArtistId || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, spotifyArtistId: e.target.value }))}
                  className="input"
                  placeholder="spotify:artist:..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Apple Music Artist ID
                </label>
                <input
                  type="text"
                  value={formData.appleMusicArtistId || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, appleMusicArtistId: e.target.value }))}
                  className="input"
                  placeholder="123456789"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  SoundCloud Artist ID
                </label>
                <input
                  type="text"
                  value={formData.soundcloudArtistId || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, soundcloudArtistId: e.target.value }))}
                  className="input"
                  placeholder="artist-name"
                />
              </div>
            </div>
          </div>

          {/* Social Media & UGC Details */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <LinkIcon className="w-4 h-4" />
              {t('소셜 미디어 & UGC 상세', 'Social Media & UGC Details')}
            </h4>

            <div className="space-y-4">
              {/* UGC Priorities */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('UGC / 소셜 DSP 우선순위', "Artist's UGC / Social DSP Priorities")}
                </label>
                <MultiSelect
                  options={ugcPriorityOptions}
                  value={formData.ugcPriorities}
                  onChange={(value) => setFormData(prev => ({ ...prev, ugcPriorities: value }))}
                  placeholder={t('플랫폼 선택', 'Select platforms')}
                />
              </div>

              {/* Social Media URLs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">YouTube URL</label>
                  <input
                    type="url"
                    value={formData.youtubeUrl || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, youtubeUrl: e.target.value }))}
                    className="input"
                    placeholder="https://www.youtube.com/channel/..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">TikTok URL</label>
                  <input
                    type="url"
                    value={formData.tiktokUrl || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, tiktokUrl: e.target.value }))}
                    className="input"
                    placeholder="https://www.tiktok.com/@..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Facebook URL</label>
                  <input
                    type="url"
                    value={formData.facebookUrl || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, facebookUrl: e.target.value }))}
                    className="input"
                    placeholder="https://www.facebook.com/..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Instagram URL</label>
                  <input
                    type="url"
                    value={formData.instagramUrl || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, instagramUrl: e.target.value }))}
                    className="input"
                    placeholder="https://www.instagram.com/..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">X/Twitter URL</label>
                  <input
                    type="url"
                    value={formData.twitterUrl || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, twitterUrl: e.target.value }))}
                    className="input"
                    placeholder="https://x.com/..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Triller URL</label>
                  <input
                    type="url"
                    value={formData.trillerUrl || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, trillerUrl: e.target.value }))}
                    className="input"
                    placeholder="https://triller.co/@..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Snapchat URL</label>
                  <input
                    type="url"
                    value={formData.snapchatUrl || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, snapchatUrl: e.target.value }))}
                    className="input"
                    placeholder="https://snapchat.com/add/..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Twitch URL</label>
                  <input
                    type="url"
                    value={formData.twitchUrl || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, twitchUrl: e.target.value }))}
                    className="input"
                    placeholder="https://twitch.tv/..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Pinterest URL</label>
                  <input
                    type="url"
                    value={formData.pinterestUrl || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, pinterestUrl: e.target.value }))}
                    className="input"
                    placeholder="https://pinterest.com/..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tumblr URL</label>
                  <input
                    type="url"
                    value={formData.tumblrUrl || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, tumblrUrl: e.target.value }))}
                    className="input"
                    placeholder="https://tumblr.com/..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Additional Marketing Fields */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              {t('추가 마케팅 정보', 'Additional Marketing Info')}
            </h4>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('마케팅 앵글', 'Marketing Angle')}
                </label>
                <textarea
                  value={formData.marketingAngle}
                  onChange={(e) => setFormData(prev => ({ ...prev, marketingAngle: e.target.value }))}
                  className="input min-h-[80px]"
                  placeholder={t('주요 마케팅 포인트', 'Key marketing points')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('뮤직비디오 계획', 'Music Video Plans')}
                </label>
                <textarea
                  value={formData.musicVideoPlans}
                  onChange={(e) => setFormData(prev => ({ ...prev, musicVideoPlans: e.target.value }))}
                  className="input min-h-[80px]"
                  placeholder={t('뮤직비디오 제작 계획', 'Music video production plans')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('브랜드 파트너십', 'Brand Partnerships')}
                </label>
                <textarea
                  value={formData.brandPartnerships}
                  onChange={(e) => setFormData(prev => ({ ...prev, brandPartnerships: e.target.value }))}
                  className="input min-h-[80px]"
                  placeholder={t('브랜드 협업 계획', 'Brand collaboration plans')}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  // Step 7: Distribution
  const renderDistribution = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Globe className="w-5 h-5" />
          {t('배포 설정', 'Distribution Settings')}
        </h3>

        <div className="space-y-6">
          {/* Distribution Platforms */}
          <div>
            <h4 className="font-medium mb-3">{t('배포 플랫폼', 'Distribution Platforms')}</h4>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries({
                spotify: 'Spotify',
                appleMusic: 'Apple Music',
                youtube: 'YouTube Music',
                amazonMusic: 'Amazon Music',
                tidal: 'TIDAL',
                deezer: 'Deezer',
                soundcloud: 'SoundCloud',
                bandcamp: 'Bandcamp',
                audiomack: 'Audiomack',
                kkbox: 'KKBOX',
                lineMusic: 'LINE Music',
                qq: 'QQ Music',
                netease: 'NetEase Cloud Music',
                joox: 'JOOX',
                boomplay: 'Boomplay',
                anghami: 'Anghami',
                yandex: 'Yandex Music',
                vk: 'VK Music'
              }).map(([key, name]) => (
                <label key={key} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.distributionPlatforms[key as keyof typeof formData.distributionPlatforms] as boolean}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      distributionPlatforms: {
                        ...prev.distributionPlatforms,
                        [key]: e.target.checked
                      }
                    }))}
                    className="rounded"
                  />
                  <span className="text-sm">{name}</span>
                </label>
              ))}
            </div>

            {/* Custom Platforms */}
            <div className="mt-4">
              <label className="block text-sm font-medium mb-1">
                {t('기타 플랫폼', 'Other Platforms')}
              </label>
              <input
                type="text"
                className="input"
                placeholder={t('플랫폼 이름 입력 후 Enter', 'Enter platform name and press Enter')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value) {
                    setFormData(prev => ({
                      ...prev,
                      distributionPlatforms: {
                        ...prev.distributionPlatforms,
                        custom: [...(prev.distributionPlatforms.custom || []), e.currentTarget.value]
                      }
                    }))
                    e.currentTarget.value = ''
                  }
                }}
              />
              <div className="flex flex-wrap gap-2 mt-2">
                {(formData.distributionPlatforms.custom || []).map((platform, index) => (
                  <span
                    key={index}
                    className="bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-sm flex items-center gap-1"
                  >
                    {platform}
                    <button
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        distributionPlatforms: {
                          ...prev.distributionPlatforms,
                          custom: prev.distributionPlatforms.custom?.filter((_, i) => i !== index) || []
                        }
                      }))}
                      className="hover:text-green-100"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div>
            <h4 className="font-medium mb-3">{t('가격 설정', 'Pricing Settings')}</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('기본 가격', 'Default Price')}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={formData.pricing.defaultPrice}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      pricing: { ...prev.pricing, defaultPrice: e.target.value }
                    }))}
                    className="input flex-1"
                    step="0.01"
                    min="0"
                  />
                  <select
                    value={formData.pricing.currency}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      pricing: { ...prev.pricing, currency: e.target.value }
                    }))}
                    className="input w-24"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="KRW">KRW</option>
                    <option value="JPY">JPY</option>
                    <option value="CNY">CNY</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  // Step 8: Rights & Legal
  const renderRightsLegal = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          {t('권리 및 법적 사항', 'Rights & Legal')}
        </h3>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                {t('저작권 연도', 'Copyright Year')} *
              </label>
              <input
                type="text"
                value={formData.copyrightYear}
                onChange={(e) => setFormData(prev => ({ ...prev, copyrightYear: e.target.value }))}
                className="input"
                placeholder={new Date().getFullYear().toString()}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                {t('저작권 소유자', 'Copyright Owner')} *
              </label>
              <input
                type="text"
                value={formData.copyrightOwner}
                onChange={(e) => setFormData(prev => ({ ...prev, copyrightOwner: e.target.value }))}
                className="input"
                placeholder={t('저작권 소유자명', 'Copyright owner name')}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {t('출판권', 'Publishing Rights')}
            </label>
            <textarea
              value={formData.publishingRights}
              onChange={(e) => setFormData(prev => ({ ...prev, publishingRights: e.target.value }))}
              className="input min-h-[80px]"
              placeholder={t('출판권 정보', 'Publishing rights information')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {t('마스터 권리', 'Master Rights')}
            </label>
            <textarea
              value={formData.masterRights}
              onChange={(e) => setFormData(prev => ({ ...prev, masterRights: e.target.value }))}
              className="input min-h-[80px]"
              placeholder={t('마스터 권리 정보', 'Master rights information')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">UPC</label>
            <input
              type="text"
              value={formData.upc}
              onChange={(e) => setFormData(prev => ({ ...prev, upc: e.target.value }))}
              className="input"
              placeholder="123456789012"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="parental-advisory"
              checked={formData.parentalAdvisory}
              onChange={(e) => setFormData(prev => ({ ...prev, parentalAdvisory: e.target.checked }))}
              className="rounded"
            />
            <label htmlFor="parental-advisory" className="text-sm">
              {t('19금 콘텐츠 포함', 'Contains Explicit Content')}
            </label>
          </div>
        </div>
      </div>
    </div>
  )

  // Step 9: Review & QC
  const renderReviewQC = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          {t('검토 및 품질 확인', 'Review & Quality Check')}
        </h3>

        {/* QC Warnings */}
        {validationResults && (
          <div className="mb-6">
            <QCWarnings results={validationResults} />
          </div>
        )}

        {/* Summary */}
        <div className="space-y-4">
          <div className="bg-white/10 dark:bg-white/5 rounded-lg p-4">
            <h4 className="font-medium mb-3">{t('제출 요약', 'Submission Summary')}</h4>
            
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-400">{t('아티스트', 'Artists')}:</dt>
                <dd>{formData.artists.map(a => a.primaryName).join(', ')}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-400">{t('앨범명', 'Album')}:</dt>
                <dd>{formData.albumTitle}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-400">{t('트랙 수', 'Tracks')}:</dt>
                <dd>{formData.tracks.length}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-400">{t('발매일', 'Release Date')}:</dt>
                <dd>{formData.releaseDate}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-400">{t('배포 플랫폼', 'Platforms')}:</dt>
                <dd>{Object.entries(formData.distributionPlatforms)
                  .filter(([key, value]) => key !== 'custom' && value)
                  .length + (formData.distributionPlatforms.custom?.length || 0)}</dd>
              </div>
            </dl>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {t('QC 노트', 'QC Notes')}
            </label>
            <textarea
              value={formData.qcNotes}
              onChange={(e) => setFormData(prev => ({ ...prev, qcNotes: e.target.value }))}
              className="input min-h-[100px]"
              placeholder={t('품질 확인 관련 메모', 'Quality check related notes')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {t('내부 메모', 'Internal Notes')}
            </label>
            <textarea
              value={formData.internalNotes}
              onChange={(e) => setFormData(prev => ({ ...prev, internalNotes: e.target.value }))}
              className="input min-h-[100px]"
              placeholder={t('내부 검토용 메모', 'Internal review notes')}
            />
          </div>
        </div>
      </div>
    </div>
  )

  // Step 10: File Upload
  const renderFileUpload = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Upload className="w-5 h-5" />
          {t('파일 업로드', 'File Upload')}
        </h3>

        <div className="space-y-6">
          {formData.tracks.map((track, index) => (
            <div key={track.id} className="bg-white/10 dark:bg-white/5 rounded-lg p-4">
              <h4 className="font-medium mb-3">
                {t('트랙', 'Track')} {index + 1}: {track.title}
              </h4>

              <div className="space-y-3">
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center">
                  {formData.audioFiles[track.id]?.length > 0 ? (
                    <div className="space-y-2">
                      {formData.audioFiles[track.id].map((file, fileIndex) => (
                        <div key={fileIndex} className="flex items-center justify-between bg-white/10 dark:bg-white/5 rounded p-2">
                          <div className="flex items-center gap-2">
                            <Music className="w-4 h-4" />
                            <span className="text-sm">{file.name}</span>
                            <span className="text-xs text-gray-400">
                              ({(file.size / 1024 / 1024).toFixed(2)} MB)
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                audioFiles: {
                                  ...prev.audioFiles,
                                  [track.id]: prev.audioFiles[track.id].filter((_, i) => i !== fileIndex)
                                }
                              }))
                            }}
                            className="text-red-500 hover:text-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-500 mb-2">
                        {t('오디오 파일을 드래그하거나 클릭하여 업로드', 'Drag audio files or click to upload')}
                      </p>
                    </div>
                  )}
                  
                  <input
                    type="file"
                    accept="audio/*"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files || [])
                      if (files.length > 0) {
                        handleFileUpload(files, track.id)
                      }
                    }}
                    className="hidden"
                    id={`audio-upload-${track.id}`}
                  />
                  <label
                    htmlFor={`audio-upload-${track.id}`}
                    className="btn-primary cursor-pointer inline-block mt-2"
                  >
                    {t('파일 선택', 'Choose Files')}
                  </label>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={track.stereo}
                      onChange={(e) => updateTrack(track.id, { stereo: e.target.checked })}
                      className="rounded"
                    />
                    <span>Stereo</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={track.dolbyAtmos}
                      onChange={(e) => updateTrack(track.id, { dolbyAtmos: e.target.checked })}
                      className="rounded"
                    />
                    <span>Dolby Atmos</span>
                  </label>
                </div>

                <p className="text-xs text-gray-500">
                  {t('지원 형식: WAV, FLAC, MP3 (최소 16bit/44.1kHz)', 'Supported formats: WAV, FLAC, MP3 (minimum 16bit/44.1kHz)')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  // Step 11: Final Submission
  const renderFinalSubmission = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          {t('최종 제출', 'Final Submission')}
        </h3>

        <div className="space-y-4">
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
            <p className="text-sm">
              {t(
                '제출 전 모든 정보를 다시 한 번 확인해주세요. 제출 후에는 수정이 제한될 수 있습니다.',
                'Please review all information once more before submission. Modifications may be limited after submission.'
              )}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {t('제출 메모', 'Submission Notes')}
            </label>
            <textarea
              value={formData.submissionNotes}
              onChange={(e) => setFormData(prev => ({ ...prev, submissionNotes: e.target.value }))}
              className="input min-h-[100px]"
              placeholder={t('추가 요청사항이나 메모', 'Additional requests or notes')}
            />
          </div>

          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              id="agree-terms"
              checked={formData.agreedToTerms}
              onChange={(e) => setFormData(prev => ({ ...prev, agreedToTerms: e.target.checked }))}
              className="rounded mt-1"
            />
            <label htmlFor="agree-terms" className="text-sm">
              {t(
                '본인은 제출한 모든 정보가 정확하며, N3RVE의 이용약관 및 배포 정책에 동의합니다.',
                'I confirm that all submitted information is accurate and agree to N3RVE\'s terms of service and distribution policies.'
              )}
            </label>
          </div>

          {validationResults && !validationResults.isValid && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <p className="text-sm text-red-300">
                {t(
                  '검증 오류가 있습니다. 제출 전에 모든 오류를 수정해주세요.',
                  'There are validation errors. Please fix all errors before submission.'
                )}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  // Submit handler
  const handleSubmit = async () => {
    if (!formData.agreedToTerms) {
      toast.error(t('이용약관에 동의해주세요', 'Please agree to the terms'))
      return
    }

    if (validationResults && !validationResults.isValid) {
      toast.error(t('검증 오류를 수정해주세요', 'Please fix validation errors'))
      return
    }

    setIsSubmitting(true)
    try {
      // Submit the form data
      await submissionService.createSubmission(formData)
      toast.success(t('제출이 완료되었습니다', 'Submission completed'))
      navigate('/submissions')
    } catch (error) {
      toast.error(t('제출 중 오류가 발생했습니다', 'Error during submission'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900/20 via-black to-purple-900/20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-white">
              {t('릴리즈 신청', 'Release Submission')}
            </h1>
            <div className="text-sm text-gray-400">
              {t('단계', 'Step')} {currentStep + 1} / {steps.length}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-white/10 rounded-full" />
            <div
              className="relative h-2 bg-purple-500 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>

          <div className="flex items-center justify-between mt-4">
            {steps.map((step) => (
              <button
                key={step.id}
                onClick={() => setCurrentStep(step.id)}
                className={`flex items-center gap-2 text-sm transition-colors ${
                  currentStep === step.id
                    ? 'text-purple-400'
                    : currentStep > step.id
                    ? 'text-green-400'
                    : 'text-gray-500'
                }`}
                disabled={currentStep < step.id}
              >
                {currentStep > step.id ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <step.icon className="w-5 h-5" />
                )}
                <span className="hidden md:inline">{step.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="mb-8">
          {renderStep()}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
            disabled={currentStep === 0}
            className="btn-secondary disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            {t('이전', 'Previous')}
          </button>

          {currentStep === steps.length - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !formData.agreedToTerms}
              className="btn-primary disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  {t('제출 중...', 'Submitting...')}
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {t('제출하기', 'Submit')}
                </>
              )}
            </button>
          ) : (
            <button
              onClick={() => setCurrentStep(prev => Math.min(steps.length - 1, prev + 1))}
              className="btn-primary"
            >
              {t('다음', 'Next')}
              <ChevronRight className="w-4 h-4 ml-2" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}