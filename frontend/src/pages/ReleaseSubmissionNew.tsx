import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguageStore, t } from '@/store/language.store'
import { 
  Upload, Music, FileText, Image, CheckCircle, AlertCircle, X, Plus, Trash2, 
  Globe, Target, Sparkles, Users, MapPin, Calendar, Shield, Languages, Disc, 
  Building2, Radio, ListMusic, ChevronRight, ChevronLeft, Info, Search,
  Music2, Mic, UserCheck, GripVertical, Edit3, Volume2, BookOpen, Megaphone,
  Tag, Heart, Link as LinkIcon, Video, Download, Eye, Clock, Check
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
import Button from '@/components/ui/Button'
import Toggle from '@/components/ui/Toggle'
import Select from '@/components/ui/Select'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'

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

// Album format options
const albumFormats = [
  { value: 'single', label: 'Single (1-3 tracks)' },
  { value: 'ep', label: 'EP (4-6 tracks)' },
  { value: 'album', label: 'Album (7+ tracks)' }
]

export default function ReleaseSubmissionNew() {
  const { language } = useLanguageStore()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  
  // Helper function for bilingual text
  const tBilingual = (ko: string, en: string) => language === 'ko' ? ko : en
  const [activeSection, setActiveSection] = useState<'album' | 'asset' | 'marketing'>('album')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationResults, setValidationResults] = useState<QCValidationResults | null>(null)
  const [showQCWarnings, setShowQCWarnings] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    // Album (Product Level)
    artists: [] as Artist[],
    bandMembers: [] as Member[],
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
    parentalAdvisory: false,
    
    // Asset Level
    tracks: [] as Track[],
    audioFiles: {} as Record<string, File[]>,
    isrcCodes: {} as Record<string, string>,
    
    // Marketing
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
    
    // Final submission
    agreedToTerms: false,
    submissionNotes: ''
  })

  // Refs for preventing duplicates
  const isValidatingRef = useRef(false)
  const lastValidatedDataRef = useRef<string>('')

  // Section configuration
  const sections = {
    album: {
      label: tBilingual('앨범 (프로덕트 레벨)', 'Album (Product Level)'),
      icon: Disc,
      description: tBilingual('앨범 기본 정보, 아티스트, 권리 설정', 'Album basics, artists, rights')
    },
    asset: {
      label: tBilingual('에셋 레벨', 'Asset Level'),
      icon: Music,
      description: tBilingual('트랙 정보, 오디오 파일, ISRC', 'Track info, audio files, ISRC')
    },
    marketing: {
      label: tBilingual('마케팅', 'Marketing'),
      icon: Megaphone,
      description: tBilingual('장르, 배포, 프로모션 전략', 'Genre, distribution, promotion')
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
      setFormData(prev => ({
        ...prev,
        audioFiles: {
          ...prev.audioFiles,
          [trackId]: files
        }
      }))
      toast.success(tBilingual('파일 업로드 성공', 'Files uploaded successfully'))
    } catch (error) {
      toast.error(tBilingual('파일 업로드 실패', 'File upload failed'))
    }
  }

  // Album cover upload
  const handleAlbumCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData(prev => ({
        ...prev,
        albumCoverArt: file,
        albumCoverArtUrl: URL.createObjectURL(file)
      }))
    }
  }

  // Submit handler
  const handleSubmit = async () => {
    if (!validationResults?.isValid) {
      setShowQCWarnings(true)
      toast.error(tBilingual('검증 오류를 수정해주세요', 'Please fix validation errors'))
      return
    }

    if (!formData.agreedToTerms) {
      toast.error(tBilingual('이용약관에 동의해주세요', 'Please agree to terms'))
      return
    }

    setIsSubmitting(true)
    try {
      // Here you would submit to your backend
      await submissionService.createSubmission(formData)
      toast.success(tBilingual('제출 완료!', 'Submission complete!'))
      navigate('/submission-success')
    } catch (error) {
      toast.error(tBilingual('제출 실패', 'Submission failed'))
    } finally {
      setIsSubmitting(false)
    }
  }

  // Section validation
  const getSectionValidation = (section: 'album' | 'asset' | 'marketing') => {
    if (!validationResults) return { hasErrors: false, errorCount: 0 }
    
    const sectionErrors = validationResults.errors.filter(error => {
      if (!error.field) return false
      
      switch (section) {
        case 'album':
          return error.field.includes('artist') || 
                 error.field.includes('album') || 
                 error.field.includes('release') ||
                 error.field.includes('copyright')
        case 'asset':
          return error.field.includes('track') || error.field.includes('isrc')
        case 'marketing':
          return error.field.includes('genre') || error.field.includes('marketing')
        default:
          return false
      }
    })
    
    return {
      hasErrors: sectionErrors.length > 0,
      errorCount: sectionErrors.length
    }
  }

  // Render Album section
  const renderAlbumSection = () => (
    <div className="space-y-6">
      {/* Artists */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" />
          {tBilingual('아티스트 정보', 'Artist Information')}
        </h3>
        
        <div className="space-y-4">
          {formData.artists.map((artist, index) => (
            <div key={artist.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-start justify-between mb-3">
                <h4 className="font-medium">
                  {tBilingual('아티스트', 'Artist')} {index + 1}
                </h4>
                <button
                  onClick={() => removeArtist(artist.id)}
                  className="text-red-500 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label={tBilingual('아티스트명 (한국어)', 'Artist Name (Korean)')}
                  value={artist.primaryName}
                  onChange={(e) => updateArtist(artist.id, { primaryName: e.target.value })}
                  placeholder={tBilingual('아티스트명 입력', 'Enter artist name')}
                  required
                />
                
                <Select
                  label={tBilingual('역할', 'Role')}
                  value={artist.role}
                  onChange={(e) => updateArtist(artist.id, { role: e.target.value as 'main' | 'featuring' })}
                >
                  <option value="main">{tBilingual('메인 아티스트', 'Main Artist')}</option>
                  <option value="featuring">{tBilingual('피처링 아티스트', 'Featuring Artist')}</option>
                </Select>
              </div>
              
              {/* Artist translations */}
              <div className="mt-4">
                <label className="block text-sm font-medium mb-2">
                  {tBilingual('번역', 'Translations')}
                </label>
                {artist.translations.map((trans) => (
                  <div key={trans.id} className="flex items-center gap-2 mb-2">
                    <Select
                      value={trans.language}
                      onChange={(e) => updateArtist(artist.id, {
                        translations: artist.translations.map(t =>
                          t.id === trans.id ? { ...t, language: e.target.value } : t
                        )
                      })}
                      className="w-32"
                    >
                      <option value="">{tBilingual('언어', 'Language')}</option>
                      {languageOptions.map(lang => (
                        <option key={lang.value} value={lang.value}>{lang.label}</option>
                      ))}
                    </Select>
                    <Input
                      value={trans.text}
                      onChange={(e) => updateArtist(artist.id, {
                        translations: artist.translations.map(t =>
                          t.id === trans.id ? { ...t, text: e.target.value } : t
                        )
                      })}
                      placeholder={tBilingual('번역된 아티스트명', 'Translated artist name')}
                      className="flex-1"
                    />
                    <button
                      onClick={() => updateArtist(artist.id, {
                        translations: artist.translations.filter(t => t.id !== trans.id)
                      })}
                      className="text-red-500 hover:text-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <Button
                  onClick={() => updateArtist(artist.id, {
                    translations: [...artist.translations, {
                      id: uuidv4(),
                      language: '',
                      text: ''
                    }]
                  })}
                  variant="ghost"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  {tBilingual('번역 추가', 'Add Translation')}
                </Button>
              </div>
            </div>
          ))}
          
          <Button onClick={addArtist} variant="secondary">
            <Plus className="w-4 h-4 mr-2" />
            {tBilingual('아티스트 추가', 'Add Artist')}
          </Button>
        </div>
      </div>

      {/* Album Info */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          {tBilingual('앨범 정보', 'Album Information')}
        </h3>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={tBilingual('앨범명 (한국어)', 'Album Title (Korean)')}
              value={formData.albumTitle}
              onChange={(e) => setFormData(prev => ({ ...prev, albumTitle: e.target.value }))}
              placeholder={tBilingual('앨범명 입력', 'Enter album title')}
              required
            />
            
            <Select
              label={tBilingual('앨범 형식', 'Album Format')}
              value={formData.albumType}
              onChange={(e) => setFormData(prev => ({ ...prev, albumType: e.target.value as 'single' | 'ep' | 'album' }))}
            >
              {albumFormats.map(format => (
                <option key={format.value} value={format.value}>{format.label}</option>
              ))}
            </Select>
          </div>
          
          {/* Album translations */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {tBilingual('앨범명 번역', 'Album Title Translations')}
            </label>
            {formData.albumTranslations.map((trans) => (
              <div key={trans.id} className="flex items-center gap-2 mb-2">
                <Select
                  value={trans.language}
                  onChange={(e) => updateTranslation('albumTitle', trans.id, { language: e.target.value })}
                  className="w-32"
                >
                  <option value="">{tBilingual('언어', 'Language')}</option>
                  {languageOptions.map(lang => (
                    <option key={lang.value} value={lang.value}>{lang.label}</option>
                  ))}
                </Select>
                <Input
                  value={trans.text}
                  onChange={(e) => updateTranslation('albumTitle', trans.id, { text: e.target.value })}
                  placeholder={tBilingual('번역된 앨범명', 'Translated album title')}
                  className="flex-1"
                />
                <button
                  onClick={() => removeTranslation('albumTitle', trans.id)}
                  className="text-red-500 hover:text-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            <Button
              onClick={() => addTranslation('albumTitle')}
              variant="ghost"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-1" />
              {tBilingual('번역 추가', 'Add Translation')}
            </Button>
          </div>
          
          {/* Album cover */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {tBilingual('앨범 커버', 'Album Cover')} *
            </label>
            <div className="flex items-center gap-4">
              {formData.albumCoverArtUrl && (
                <img
                  src={formData.albumCoverArtUrl}
                  alt="Album cover"
                  className="w-24 h-24 rounded-lg object-cover"
                />
              )}
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAlbumCoverUpload}
                  className="hidden"
                />
                <Button variant="secondary" size="sm">
                  <Upload className="w-4 h-4 mr-2" />
                  {tBilingual('이미지 업로드', 'Upload Image')}
                </Button>
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {tBilingual('최소 3000x3000px, JPG/PNG', 'Min 3000x3000px, JPG/PNG')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={tBilingual('레이블', 'Label')}
              value={formData.recordLabel}
              onChange={(e) => setFormData(prev => ({ ...prev, recordLabel: e.target.value }))}
              placeholder="N3RVE Records"
            />
            
            <Input
              label={tBilingual('카탈로그 번호', 'Catalog Number')}
              value={formData.catalogNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, catalogNumber: e.target.value }))}
              placeholder="CAT-001"
            />
          </div>
        </div>
      </div>

      {/* Release Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          {tBilingual('릴리즈 설정', 'Release Settings')}
        </h3>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              type="date"
              label={tBilingual('릴리즈 날짜', 'Release Date')}
              value={formData.releaseDate}
              onChange={(e) => setFormData(prev => ({ ...prev, releaseDate: e.target.value }))}
              required
            />
            
            <Input
              type="time"
              label={tBilingual('릴리즈 시간', 'Release Time')}
              value={formData.releaseTime}
              onChange={(e) => setFormData(prev => ({ ...prev, releaseTime: e.target.value }))}
            />
            
            <Select
              label={tBilingual('시간대', 'Timezone')}
              value={formData.timezone}
              onChange={(e) => setFormData(prev => ({ ...prev, timezone: e.target.value }))}
            >
              <option value="Asia/Seoul">Asia/Seoul (KST)</option>
              <option value="America/New_York">America/New_York (EST)</option>
              <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
              <option value="Europe/London">Europe/London (GMT)</option>
            </Select>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              type="date"
              label={tBilingual('디지털 발매일', 'Digital Release')}
              value={formData.digitalReleaseDate}
              onChange={(e) => setFormData(prev => ({ ...prev, digitalReleaseDate: e.target.value }))}
            />
            
            <Input
              type="date"
              label={tBilingual('피지컬 발매일', 'Physical Release')}
              value={formData.physicalReleaseDate}
              onChange={(e) => setFormData(prev => ({ ...prev, physicalReleaseDate: e.target.value }))}
            />
            
            <Input
              type="date"
              label={tBilingual('예약 판매일', 'Pre-order Date')}
              value={formData.preOrderDate}
              onChange={(e) => setFormData(prev => ({ ...prev, preOrderDate: e.target.value }))}
            />
          </div>
        </div>
      </div>

      {/* Rights & Legal */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          {tBilingual('권리 및 법적 사항', 'Rights & Legal')}
        </h3>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={tBilingual('저작권 연도', 'Copyright Year')}
              value={formData.copyrightYear}
              onChange={(e) => setFormData(prev => ({ ...prev, copyrightYear: e.target.value }))}
              placeholder={new Date().getFullYear().toString()}
              required
            />
            
            <Input
              label={tBilingual('저작권 소유자', 'Copyright Owner')}
              value={formData.copyrightOwner}
              onChange={(e) => setFormData(prev => ({ ...prev, copyrightOwner: e.target.value }))}
              placeholder={tBilingual('저작권 소유자명', 'Copyright owner name')}
              required
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={tBilingual('출판권', 'Publishing Rights')}
              value={formData.publishingRights}
              onChange={(e) => setFormData(prev => ({ ...prev, publishingRights: e.target.value }))}
              placeholder={tBilingual('출판권 소유자', 'Publishing rights owner')}
            />
            
            <Input
              label={tBilingual('마스터 권리', 'Master Rights')}
              value={formData.masterRights}
              onChange={(e) => setFormData(prev => ({ ...prev, masterRights: e.target.value }))}
              placeholder={tBilingual('마스터 권리 소유자', 'Master rights owner')}
            />
          </div>
          
          <Input
            label={tBilingual('UPC 코드', 'UPC Code')}
            value={formData.upc}
            onChange={(e) => setFormData(prev => ({ ...prev, upc: e.target.value }))}
            placeholder="012345678901"
          />
          
          <Checkbox
            id="parentalAdvisory"
            checked={formData.parentalAdvisory}
            onChange={(e) => setFormData(prev => ({ ...prev, parentalAdvisory: e.target.checked }))}
            label={tBilingual('부모 권고 필요', 'Parental Advisory Required')}
          />
        </div>
      </div>
    </div>
  )

  // Render Asset section
  const renderAssetSection = () => (
    <div className="space-y-6">
      {/* Tracks */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Music className="w-5 h-5" />
            {tBilingual('트랙 정보', 'Track Information')}
          </h3>
          <Button onClick={addTrack} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            {tBilingual('트랙 추가', 'Add Track')}
          </Button>
        </div>
        
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="tracks">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                {formData.tracks.map((track, index) => (
                  <Draggable key={track.id} draggableId={track.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`p-4 bg-gray-50 dark:bg-gray-700 rounded-lg ${
                          snapshot.isDragging ? 'shadow-lg' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div {...provided.dragHandleProps} className="mt-2 cursor-move">
                            <GripVertical className="w-5 h-5 text-gray-400" />
                          </div>
                          
                          <div className="flex-1 space-y-4">
                            <div className="flex items-start justify-between">
                              <h4 className="font-medium">
                                {tBilingual('트랙', 'Track')} {index + 1}
                                {track.isTitle && (
                                  <span className="ml-2 text-xs bg-purple-500 text-white px-2 py-1 rounded">
                                    {tBilingual('타이틀', 'Title')}
                                  </span>
                                )}
                              </h4>
                              <button
                                onClick={() => removeTrack(track.id)}
                                className="text-red-500 hover:text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <Input
                                label={tBilingual('트랙명 (한국어)', 'Track Title (Korean)')}
                                value={track.title}
                                onChange={(e) => updateTrack(track.id, { title: e.target.value })}
                                placeholder={tBilingual('트랙명 입력', 'Enter track title')}
                                required
                              />
                              
                              <Checkbox
                                id={`title-track-${track.id}`}
                                checked={track.isTitle}
                                onChange={(e) => {
                                  // Unset other title tracks
                                  if (e.target.checked) {
                                    setFormData(prev => ({
                                      ...prev,
                                      tracks: prev.tracks.map(t => ({
                                        ...t,
                                        isTitle: t.id === track.id
                                      }))
                                    }))
                                  } else {
                                    updateTrack(track.id, { isTitle: false })
                                  }
                                }}
                                label={tBilingual('타이틀 트랙', 'Title Track')}
                              />
                            </div>
                            
                            {/* Track translations */}
                            <div>
                              <label className="block text-sm font-medium mb-2">
                                {tBilingual('트랙명 번역', 'Track Title Translations')}
                              </label>
                              {track.translations.map((trans) => (
                                <div key={trans.id} className="flex items-center gap-2 mb-2">
                                  <Select
                                    value={trans.language}
                                    onChange={(e) => updateTranslation('track', trans.id, { language: e.target.value }, track.id)}
                                    className="w-32"
                                  >
                                    <option value="">{tBilingual('언어', 'Language')}</option>
                                    {languageOptions.map(lang => (
                                      <option key={lang.value} value={lang.value}>{lang.label}</option>
                                    ))}
                                  </Select>
                                  <Input
                                    value={trans.title}
                                    onChange={(e) => updateTranslation('track', trans.id, { title: e.target.value }, track.id)}
                                    placeholder={tBilingual('번역된 트랙명', 'Translated track title')}
                                    className="flex-1"
                                  />
                                  <button
                                    onClick={() => removeTranslation('track', trans.id, track.id)}
                                    className="text-red-500 hover:text-red-600"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                              <Button
                                onClick={() => addTranslation('track', track.id)}
                                variant="ghost"
                                size="sm"
                              >
                                <Plus className="w-4 h-4 mr-1" />
                                {tBilingual('번역 추가', 'Add Translation')}
                              </Button>
                            </div>
                            
                            {/* Track details */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <Input
                                label={tBilingual('ISRC 코드', 'ISRC Code')}
                                value={track.isrc || ''}
                                onChange={(e) => updateTrack(track.id, { isrc: e.target.value })}
                                placeholder="USKRE2400001"
                              />
                              
                              <Select
                                label={tBilingual('버전', 'Version')}
                                value={track.version || 'original'}
                                onChange={(e) => updateTrack(track.id, { version: e.target.value })}
                              >
                                <option value="original">{tBilingual('원곡', 'Original')}</option>
                                <option value="remix">{tBilingual('리믹스', 'Remix')}</option>
                                <option value="acoustic">{tBilingual('어쿠스틱', 'Acoustic')}</option>
                                <option value="live">{tBilingual('라이브', 'Live')}</option>
                                <option value="instrumental">{tBilingual('인스트루멘탈', 'Instrumental')}</option>
                                <option value="extended">{tBilingual('익스텐디드', 'Extended')}</option>
                                <option value="radio">{tBilingual('라디오 에디트', 'Radio Edit')}</option>
                              </Select>
                              
                              <Select
                                label={tBilingual('오디오 언어', 'Audio Language')}
                                value={track.audioLanguage || 'ko'}
                                onChange={(e) => updateTrack(track.id, { audioLanguage: e.target.value })}
                              >
                                {languageOptions.map(lang => (
                                  <option key={lang.value} value={lang.value}>{lang.label}</option>
                                ))}
                              </Select>
                            </div>
                            
                            <div className="flex items-center gap-6">
                              <Toggle
                                checked={track.dolbyAtmos || false}
                                onChange={(checked) => updateTrack(track.id, { dolbyAtmos: checked })}
                                label={tBilingual('돌비 애트모스', 'Dolby Atmos')}
                                size="md"
                              />
                              
                              <Toggle
                                checked={track.explicitContent || false}
                                onChange={(checked) => updateTrack(track.id, { explicitContent: checked })}
                                label={tBilingual('수위 제한 콘텐츠', 'Explicit Content')}
                                size="md"
                              />
                              
                              <Toggle
                                checked={track.stereo || false}
                                onChange={(checked) => updateTrack(track.id, { stereo: checked })}
                                label={tBilingual('스테레오', 'Stereo')}
                                size="md"
                              />
                            </div>
                            
                            {/* Audio file upload */}
                            <div>
                              <label className="block text-sm font-medium mb-2">
                                {tBilingual('오디오 파일', 'Audio Files')}
                              </label>
                              <div className="flex items-center gap-2">
                                <label className="cursor-pointer">
                                  <input
                                    type="file"
                                    accept="audio/*"
                                    multiple
                                    onChange={(e) => {
                                      const files = Array.from(e.target.files || [])
                                      if (files.length) {
                                        handleFileUpload(files, track.id)
                                      }
                                    }}
                                    className="hidden"
                                  />
                                  <Button variant="secondary" size="sm">
                                    <Upload className="w-4 h-4 mr-2" />
                                    {tBilingual('오디오 업로드', 'Upload Audio')}
                                  </Button>
                                </label>
                              </div>
                              {formData.audioFiles[track.id]?.map((file, idx) => (
                                <div key={idx} className="flex items-center gap-2 mt-2">
                                  <Volume2 className="w-4 h-4 text-gray-400" />
                                  <span className="text-sm">{file.name}</span>
                                </div>
                              ))}
                            </div>
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

  // Render Marketing section
  const renderMarketingSection = () => (
    <div className="space-y-6">
      {/* Genre & Tags */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Tag className="w-5 h-5" />
          {tBilingual('장르 및 태그', 'Genre & Tags')}
        </h3>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label={tBilingual('마케팅 장르', 'Marketing Genre')}
              value={formData.marketingGenre}
              onChange={(e) => setFormData(prev => ({ ...prev, marketingGenre: e.target.value }))}
              required
            >
              <option value="">{tBilingual('장르 선택', 'Select genre')}</option>
              {genreOptions.map(genre => (
                <option key={genre} value={genre}>{genre}</option>
              ))}
            </Select>
            
            <Input
              label={tBilingual('서브 장르', 'Sub-genre')}
              value={formData.marketingSubgenre}
              onChange={(e) => setFormData(prev => ({ ...prev, marketingSubgenre: e.target.value }))}
              placeholder={tBilingual('서브 장르 입력', 'Enter sub-genre')}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              {tBilingual('마케팅 태그', 'Marketing Tags')}
            </label>
            <div className="flex items-center gap-2 mb-2">
              <Input
                placeholder={tBilingual('태그 입력 후 Enter', 'Enter tag and press Enter')}
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
                  className="bg-purple-500/20 text-purple-600 dark:text-purple-300 px-3 py-1 rounded-full text-sm flex items-center gap-1"
                >
                  {tag}
                  <button
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      marketingTags: prev.marketingTags.filter((_, i) => i !== index)
                    }))}
                    className="hover:text-purple-800 dark:hover:text-purple-100"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Distribution Platforms */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Globe className="w-5 h-5" />
          {tBilingual('배포 플랫폼', 'Distribution Platforms')}
        </h3>
        
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
            <Checkbox
              key={key}
              id={`platform-${key}`}
              checked={formData.distributionPlatforms[key as keyof typeof formData.distributionPlatforms] as boolean}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                distributionPlatforms: {
                  ...prev.distributionPlatforms,
                  [key]: e.target.checked
                }
              }))}
              label={name}
            />
          ))}
        </div>
      </div>

      {/* Marketing Strategy */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Target className="w-5 h-5" />
          {tBilingual('마케팅 전략', 'Marketing Strategy')}
        </h3>
        
        <div className="space-y-4">
          <Textarea
            label={tBilingual('마케팅 앵글', 'Marketing Angle')}
            value={formData.marketingAngle}
            onChange={(e) => setFormData(prev => ({ ...prev, marketingAngle: e.target.value }))}
            placeholder={tBilingual('주요 마케팅 포인트를 설명해주세요', 'Describe key marketing points')}
            rows={3}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Textarea
              label="Spotify Pitching"
              value={formData.spotifyPitching}
              onChange={(e) => setFormData(prev => ({ ...prev, spotifyPitching: e.target.value }))}
              placeholder={tBilingual('Spotify 플레이리스트 피칭 전략', 'Spotify playlist pitching strategy')}
              rows={3}
            />
            
            <Textarea
              label="Apple Music Pitching"
              value={formData.appleMusicPitching}
              onChange={(e) => setFormData(prev => ({ ...prev, appleMusicPitching: e.target.value }))}
              placeholder={tBilingual('Apple Music 피칭 전략', 'Apple Music pitching strategy')}
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Textarea
              label="TikTok Strategy"
              value={formData.tiktokStrategy}
              onChange={(e) => setFormData(prev => ({ ...prev, tiktokStrategy: e.target.value }))}
              placeholder={tBilingual('TikTok 마케팅 전략', 'TikTok marketing strategy')}
              rows={3}
            />
            
            <Textarea
              label="YouTube Strategy"
              value={formData.youtubeStrategy}
              onChange={(e) => setFormData(prev => ({ ...prev, youtubeStrategy: e.target.value }))}
              placeholder={tBilingual('YouTube 마케팅 전략', 'YouTube marketing strategy')}
              rows={3}
            />
          </div>
          
          <Textarea
            label="Instagram Strategy"
            value={formData.instagramStrategy}
            onChange={(e) => setFormData(prev => ({ ...prev, instagramStrategy: e.target.value }))}
            placeholder={tBilingual('Instagram 마케팅 전략', 'Instagram marketing strategy')}
            rows={3}
          />
        </div>
      </div>

      {/* Additional Marketing Fields (31 fields) */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          {tBilingual('추가 마케팅 정보', 'Additional Marketing Info')}
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              {tBilingual('유사 아티스트', 'Similar Artists')}
            </label>
            <div className="flex items-center gap-2 mb-2">
              <Input
                placeholder={tBilingual('유사 아티스트 입력 후 Enter', 'Enter similar artist and press Enter')}
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
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.similarArtists.map((artist, index) => (
                <span
                  key={index}
                  className="bg-blue-500/20 text-blue-600 dark:text-blue-300 px-3 py-1 rounded-full text-sm flex items-center gap-1"
                >
                  {artist}
                  <button
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      similarArtists: prev.similarArtists.filter((_, i) => i !== index)
                    }))}
                    className="hover:text-blue-800 dark:hover:text-blue-100"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
          
          <Textarea
            label={tBilingual('보도 자료', 'Press Release')}
            value={formData.pressRelease}
            onChange={(e) => setFormData(prev => ({ ...prev, pressRelease: e.target.value }))}
            placeholder={tBilingual('보도 자료 내용', 'Press release content')}
            rows={4}
          />
          
          <Input
            label={tBilingual('마케팅 예산', 'Marketing Budget')}
            value={formData.marketingBudget}
            onChange={(e) => setFormData(prev => ({ ...prev, marketingBudget: e.target.value }))}
            placeholder={tBilingual('예산 금액', 'Budget amount')}
          />
          
          <Textarea
            label={tBilingual('뮤직비디오 계획', 'Music Video Plans')}
            value={formData.musicVideoPlans}
            onChange={(e) => setFormData(prev => ({ ...prev, musicVideoPlans: e.target.value }))}
            placeholder={tBilingual('뮤직비디오 제작 계획', 'Music video production plans')}
            rows={3}
          />
          
          <Textarea
            label={tBilingual('브랜드 파트너십', 'Brand Partnerships')}
            value={formData.brandPartnerships}
            onChange={(e) => setFormData(prev => ({ ...prev, brandPartnerships: e.target.value }))}
            placeholder={tBilingual('브랜드 협업 계획', 'Brand collaboration plans')}
            rows={3}
          />
          
          <Textarea
            label={tBilingual('인플루언서 아웃리치', 'Influencer Outreach')}
            value={formData.influencerOutreach}
            onChange={(e) => setFormData(prev => ({ ...prev, influencerOutreach: e.target.value }))}
            placeholder={tBilingual('인플루언서 협업 계획', 'Influencer collaboration plans')}
            rows={3}
          />
          
          <Textarea
            label={tBilingual('소셜 미디어 캠페인', 'Social Media Campaign')}
            value={formData.socialMediaCampaign}
            onChange={(e) => setFormData(prev => ({ ...prev, socialMediaCampaign: e.target.value }))}
            placeholder={tBilingual('소셜 미디어 캠페인 계획', 'Social media campaign plans')}
            rows={3}
          />
          
          {/* Additional fields for comprehensive marketing */}
          <Textarea
            label={tBilingual('Facebook 전략', 'Facebook Strategy')}
            value={formData.facebookStrategy}
            onChange={(e) => setFormData(prev => ({ ...prev, facebookStrategy: e.target.value }))}
            rows={2}
          />
          
          <Textarea
            label={tBilingual('Twitter 전략', 'Twitter Strategy')}
            value={formData.twitterStrategy}
            onChange={(e) => setFormData(prev => ({ ...prev, twitterStrategy: e.target.value }))}
            rows={2}
          />
          
          <Textarea
            label={tBilingual('머천다이징', 'Merchandising')}
            value={formData.merchandising}
            onChange={(e) => setFormData(prev => ({ ...prev, merchandising: e.target.value }))}
            rows={2}
          />
          
          <Textarea
            label={tBilingual('특별판', 'Special Editions')}
            value={formData.specialEditions}
            onChange={(e) => setFormData(prev => ({ ...prev, specialEditions: e.target.value }))}
            rows={2}
          />
          
          <Textarea
            label={tBilingual('비하인드 더 씬', 'Behind The Scenes')}
            value={formData.behindTheScenes}
            onChange={(e) => setFormData(prev => ({ ...prev, behindTheScenes: e.target.value }))}
            rows={2}
          />
          
          <Textarea
            label={tBilingual('다큐멘터리 계획', 'Documentary Plans')}
            value={formData.documentaryPlans}
            onChange={(e) => setFormData(prev => ({ ...prev, documentaryPlans: e.target.value }))}
            rows={2}
          />
          
          <Textarea
            label={tBilingual('NFT 전략', 'NFT Strategy')}
            value={formData.nftStrategy}
            onChange={(e) => setFormData(prev => ({ ...prev, nftStrategy: e.target.value }))}
            rows={2}
          />
          
          <Textarea
            label={tBilingual('메타버스 활동', 'Metaverse Activations')}
            value={formData.metaverseActivations}
            onChange={(e) => setFormData(prev => ({ ...prev, metaverseActivations: e.target.value }))}
            rows={2}
          />
          
          <Textarea
            label={tBilingual('싱크 기회', 'Sync Opportunities')}
            value={formData.syncOpportunities}
            onChange={(e) => setFormData(prev => ({ ...prev, syncOpportunities: e.target.value }))}
            rows={2}
          />
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {tBilingual('릴리즈 제출', 'Release Submission')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {tBilingual('새로운 릴리즈를 등록하고 배포를 준비하세요', 'Register your new release and prepare for distribution')}
          </p>
        </div>

        {/* Section tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm mb-6">
          <div className="flex">
            {Object.entries(sections).map(([key, section]) => {
              const Icon = section.icon
              const validation = getSectionValidation(key as 'album' | 'asset' | 'marketing')
              
              return (
                <button
                  key={key}
                  onClick={() => setActiveSection(key as 'album' | 'asset' | 'marketing')}
                  className={`flex-1 px-6 py-4 flex items-center justify-center gap-3 border-b-2 transition-colors ${
                    activeSection === key
                      ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-medium">{section.label}</div>
                    <div className="text-xs opacity-75">{section.description}</div>
                  </div>
                  {validation.hasErrors && (
                    <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                      {validation.errorCount}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* QC Warnings */}
        {showQCWarnings && validationResults && (
          <div className="mb-6">
            <QCWarnings
              results={validationResults}
              onClose={() => setShowQCWarnings(false)}
              onAutoFix={(field, suggestion) => {
                // Implement auto-fix logic based on field
                console.log('Auto-fix:', field, suggestion)
              }}
            />
          </div>
        )}

        {/* Section content */}
        <div className="mb-8">
          {activeSection === 'album' && renderAlbumSection()}
          {activeSection === 'asset' && renderAssetSection()}
          {activeSection === 'marketing' && renderMarketingSection()}
        </div>

        {/* Bottom actions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <Toggle
              checked={formData.agreedToTerms}
              onChange={(checked) => setFormData(prev => ({ ...prev, agreedToTerms: checked }))}
              label={tBilingual('이용약관 및 배포 조건에 동의합니다', 'I agree to the terms and distribution conditions')}
              size="lg"
            />
            
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setShowQCWarnings(true)}
                variant="secondary"
                disabled={!validationResults}
              >
                <AlertCircle className="w-4 h-4 mr-2" />
                {tBilingual('QC 검증', 'QC Validation')}
                {validationResults && !validationResults.isValid && (
                  <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {validationResults.errors.length}
                  </span>
                )}
              </Button>
              
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !formData.agreedToTerms}
                loading={isSubmitting}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {tBilingual('제출하기', 'Submit')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}