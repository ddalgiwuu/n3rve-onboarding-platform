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
    // Step 0: Artist Info
    artists: [] as Artist[],
    bandMembers: [] as Member[],
    
    // Step 1: Album Basic Info
    albumTitle: '',
    albumTranslations: [] as Translation[],
    albumType: 'single' as 'single' | 'ep' | 'album',
    releaseDate: new Date().toISOString().split('T')[0],
    releaseTime: '00:00',
    timezone: 'Asia/Seoul',
    
    // Step 2: Track Info
    tracks: [] as Track[],
    
    // Step 3: Contributors
    albumContributors: [] as Contributor[],
    
    // Step 4: Album Details
    albumCoverArt: null as File | null,
    albumCoverArtUrl: '',
    albumDescription: '',
    albumDescriptionTranslations: [] as Translation[],
    recordLabel: '',
    catalogNumber: '',
    
    // Step 5: Release Settings
    territories: [] as string[],
    excludedTerritories: [] as string[],
    digitalReleaseDate: '',
    physicalReleaseDate: '',
    preOrderDate: '',
    
    // Step 6: Marketing Info
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
    copyrightYear: new Date().getFullYear().toString(),
    copyrightOwner: '',
    publishingRights: '',
    masterRights: '',
    isrcCodes: {} as Record<string, string>,
    upc: '',
    licenses: [] as { type: string; territory: string; details: string }[],
    parentalAdvisory: false,
    
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
      case 0: // Artist Info
        return renderArtistInfo()
      case 1: // Album Basic Info
        return renderAlbumBasicInfo()
      case 2: // Track Info
        return renderTrackInfo()
      case 3: // Contributors
        return renderContributors()
      case 4: // Album Details
        return renderAlbumDetails()
      case 5: // Release Settings
        return renderReleaseSettings()
      case 6: // Marketing Info
        return renderMarketingInfo()
      case 7: // Distribution
        return renderDistribution()
      case 8: // Rights & Legal
        return renderRightsLegal()
      case 9: // Review & QC
        return renderReviewQC()
      case 10: // File Upload
        return renderFileUpload()
      case 11: // Final Submission
        return renderFinalSubmission()
      default:
        return null
    }
  }

  // Step 0: Artist Info
  const renderArtistInfo = () => (
    <div className="space-y-6">
      <div className="bg-glass-light dark:bg-glass-dark backdrop-blur-md rounded-xl p-6 border border-glass-lighter dark:border-glass-darker">
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
      <div className="bg-glass-light dark:bg-glass-dark backdrop-blur-md rounded-xl p-6 border border-glass-lighter dark:border-glass-darker">
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
        </div>
      </div>
    </div>
  )

  // Step 2: Track Info
  const renderTrackInfo = () => (
    <div className="space-y-6">
      <div className="bg-glass-light dark:bg-glass-dark backdrop-blur-md rounded-xl p-6 border border-glass-lighter dark:border-glass-darker">
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
      <div className="bg-glass-light dark:bg-glass-dark backdrop-blur-md rounded-xl p-6 border border-glass-lighter dark:border-glass-darker">
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
                      {Object.entries(contributorRoles.reduce((acc, role) => {
                        if (!acc[role.category]) acc[role.category] = []
                        acc[role.category].push(role)
                        return acc
                      }, {} as Record<string, typeof contributorRoles>)).map(([category, roles]) => (
                        <select
                          key={category}
                          className="input text-sm"
                          onChange={(e) => {
                            const role = e.target.value
                            if (role && !contributor.roles.includes(role)) {
                              updateContributor(contributor.id, {
                                roles: [...contributor.roles, role]
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
                      {contributor.roles.map(roleValue => {
                        const role = contributorRoles.find(r => r.value === roleValue)
                        return role ? (
                          <span
                            key={roleValue}
                            className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded flex items-center gap-1"
                          >
                            {language === 'ko' ? role.label : role.labelEn}
                            <button
                              onClick={() => updateContributor(contributor.id, {
                                roles: contributor.roles.filter(r => r !== roleValue)
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
      <div className="bg-glass-light dark:bg-glass-dark backdrop-blur-md rounded-xl p-6 border border-glass-lighter dark:border-glass-darker">
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
      <div className="bg-glass-light dark:bg-glass-dark backdrop-blur-md rounded-xl p-6 border border-glass-lighter dark:border-glass-darker">
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
      <div className="bg-glass-light dark:bg-glass-dark backdrop-blur-md rounded-xl p-6 border border-glass-lighter dark:border-glass-darker">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Megaphone className="w-5 h-5" />
          {t('마케팅 정보', 'Marketing Information')}
        </h3>

        <div className="space-y-6">
          {/* Genre & Tags */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                {t('마케팅 장르', 'Marketing Genre')}
              </label>
              <select
                value={formData.marketingGenre}
                onChange={(e) => setFormData(prev => ({ ...prev, marketingGenre: e.target.value }))}
                className="input"
              >
                <option value="">{t('장르 선택', 'Select genre')}</option>
                {genreOptions.map(genre => (
                  <option key={genre} value={genre}>{genre}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                {t('서브 장르', 'Sub-genre')}
              </label>
              <input
                type="text"
                value={formData.marketingSubgenre}
                onChange={(e) => setFormData(prev => ({ ...prev, marketingSubgenre: e.target.value }))}
                className="input"
                placeholder={t('서브 장르 입력', 'Enter sub-genre')}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {t('마케팅 태그', 'Marketing Tags')}
            </label>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="text"
                className="input flex-1"
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

          {/* Social Media Strategy */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Target className="w-4 h-4" />
              {t('소셜 미디어 전략', 'Social Media Strategy')}
            </h4>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Spotify {t('피칭', 'Pitching')}</label>
                <textarea
                  value={formData.spotifyPitching}
                  onChange={(e) => setFormData(prev => ({ ...prev, spotifyPitching: e.target.value }))}
                  className="input min-h-[80px]"
                  placeholder={t('Spotify 플레이리스트 피칭 전략', 'Spotify playlist pitching strategy')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Apple Music {t('피칭', 'Pitching')}</label>
                <textarea
                  value={formData.appleMusicPitching}
                  onChange={(e) => setFormData(prev => ({ ...prev, appleMusicPitching: e.target.value }))}
                  className="input min-h-[80px]"
                  placeholder={t('Apple Music 피칭 전략', 'Apple Music pitching strategy')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">TikTok {t('전략', 'Strategy')}</label>
                <textarea
                  value={formData.tiktokStrategy}
                  onChange={(e) => setFormData(prev => ({ ...prev, tiktokStrategy: e.target.value }))}
                  className="input min-h-[80px]"
                  placeholder={t('TikTok 마케팅 전략', 'TikTok marketing strategy')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">YouTube {t('전략', 'Strategy')}</label>
                <textarea
                  value={formData.youtubeStrategy}
                  onChange={(e) => setFormData(prev => ({ ...prev, youtubeStrategy: e.target.value }))}
                  className="input min-h-[80px]"
                  placeholder={t('YouTube 마케팅 전략', 'YouTube marketing strategy')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Instagram {t('전략', 'Strategy')}</label>
                <textarea
                  value={formData.instagramStrategy}
                  onChange={(e) => setFormData(prev => ({ ...prev, instagramStrategy: e.target.value }))}
                  className="input min-h-[80px]"
                  placeholder={t('Instagram 마케팅 전략', 'Instagram marketing strategy')}
                />
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
                  {t('유사 아티스트', 'Similar Artists')}
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
      <div className="bg-glass-light dark:bg-glass-dark backdrop-blur-md rounded-xl p-6 border border-glass-lighter dark:border-glass-darker">
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
      <div className="bg-glass-light dark:bg-glass-dark backdrop-blur-md rounded-xl p-6 border border-glass-lighter dark:border-glass-darker">
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
      <div className="bg-glass-light dark:bg-glass-dark backdrop-blur-md rounded-xl p-6 border border-glass-lighter dark:border-glass-darker">
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
      <div className="bg-glass-light dark:bg-glass-dark backdrop-blur-md rounded-xl p-6 border border-glass-lighter dark:border-glass-darker">
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
      <div className="bg-glass-light dark:bg-glass-dark backdrop-blur-md rounded-xl p-6 border border-glass-lighter dark:border-glass-darker">
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