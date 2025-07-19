import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguageStore } from '@/store/language.store'
import { 
  Upload, Music, Image, CheckCircle, X, Plus, Trash2, 
  Globe, Users, Disc, 
  ChevronRight, ChevronLeft, Info,
  GripVertical,
  HelpCircle, AlertTriangle, Star,
  ExternalLink,
  ChevronUp, ChevronDown, User, Languages
} from 'lucide-react'
import toast from 'react-hot-toast'
import { submissionService } from '@/services/submission.service'
import { useAuthStore } from '@/store/auth.store'
import useSafeStore from '@/hooks/useSafeStore'
import { validateSubmission, type QCValidationResults } from '@/utils/fugaQCValidation'
import QCWarnings from '@/components/submission/QCWarnings'
import DatePicker from '@/components/DatePicker'
import { v4 as uuidv4 } from 'uuid'
import RegionSelector from '@/components/RegionSelector'
import MultiSelect from '@/components/ui/MultiSelect'
import SearchableSelect from '@/components/ui/SearchableSelect'
import ArtistManagementModal from '@/components/ArtistManagementModal'
import ContributorManagementModal from '@/components/ContributorManagementModal'
import { genreList, subgenreList } from '@/constants/genres'
import { timezones, convertToUTC } from '@/constants/timezones'
import { generateUPC, generateEAN } from '@/utils/identifiers'
import { dspList } from '@/constants/dspList'
import { SavedArtistsProvider } from '@/contexts/SavedArtistsContext'
import TranslationInput from '@/components/TranslationInput'

// Modern Toggle Component
const Toggle: React.FC<{
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  helpText?: string
  disabled?: boolean
}> = ({ checked, onChange, label, helpText, disabled = false }) => {
  return (
    <div className="flex items-start gap-3">
      <button
        type="button"
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full transition-colors
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${checked ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'}
        `}
      >
        <span
          className={`
            inline-block h-4 w-4 transform rounded-full bg-white transition-transform
            ${checked ? 'translate-x-6' : 'translate-x-1'}
          `}
        />
      </button>
      {label && (
        <div className="flex-1">
          <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {label}
          </label>
          {helpText && (
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{helpText}</p>
          )}
        </div>
      )}
    </div>
  )
}

// Radio Group Component
const RadioGroup: React.FC<{
  options: { value: string; label: string; description?: string }[]
  value: string
  onChange: (value: string) => void
  name: string
}> = ({ options, value, onChange, name }) => {
  return (
    <div className="space-y-2">
      {options.map(option => (
        <label
          key={option.value}
          className="flex items-start gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            className="mt-1"
          />
          <div className="flex-1">
            <div className="font-medium text-sm text-gray-900 dark:text-white">
              {option.label}
            </div>
            {option.description && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {option.description}
              </p>
            )}
          </div>
        </label>
      ))}
    </div>
  )
}

// Types
interface Artist {
  id: string
  name: string
  role: 'main' | 'featured' | 'additional'
  spotifyId?: string
  appleId?: string
  translations?: {
    [language: string]: string
  }
}

interface Contributor {
  id: string
  name: string
  role: 'composer' | 'lyricist' | 'arranger' | 'producer' | 'engineer' | 'performer'
  instrument?: string
  description?: string
}

interface Track {
  id: string
  title: string
  titleTranslation?: string
  titleTranslations?: {
    [language: string]: string
  }
  artists: Artist[]
  featuringArtists: Artist[]
  contributors: Contributor[]
  isrc?: string
  duration?: string
  genre?: string
  subgenre?: string
  language?: string
  lyrics?: string
  explicit?: boolean
  remixVersion?: string
  titleLanguage?: 'Korean' | 'English' | 'Japanese' | 'Chinese' | 'Other'
  trackNumber?: number
  dolbyAtmos?: boolean
}

interface FormData {
  // Album Info
  albumTitle: string
  albumTitleTranslation?: string
  albumTitleTranslations?: {
    [language: string]: string
  }
  albumArtist?: string // For backward compatibility
  albumArtists: Artist[]
  albumFeaturingArtists?: Artist[]
  releaseType: 'single' | 'album' | 'ep'
  primaryGenre: string
  primarySubgenre: string
  secondaryGenre?: string
  secondarySubgenre?: string
  language: string
  releaseTime: string
  timezone: string
  originalReleaseDate: string
  consumerReleaseDate: string
  upc?: string
  ean?: string
  catalogNumber?: string
  recordLabel: string
  copyrightHolder: string
  copyrightYear: string
  productionHolder: string
  productionYear: string
  albumVersion?: string
  explicitContent?: boolean
  label?: string
  displayArtist?: string
  
  // Tracks
  tracks: Track[]
  
  // Files
  coverArt?: File
  audioFiles: File[]
  dolbyAtmosFiles?: File[]
  motionArtFile?: File
  musicVideoFile?: File
  
  // Distribution
  distributionType: 'all' | 'selected'
  selectedStores: string[]
  excludedStores: string[]
  territories: string[]
  excludedTerritories: string[]
  
  // Additional
  previouslyReleased: boolean
  marketingInfo?: {
    artist_spotify_id?: string
    artist_apple_id?: string
    artist_facebook_url?: string
    artist_instagram_handle?: string
    marketing_genre?: string
    marketing_subgenre?: string
    pr_line?: string
    internal_note?: string
  }
}

// Language list
const languageList = [
  { code: 'ko', name: '한국어 (Korean)' },
  { code: 'en', name: '영어 (English)' },
  { code: 'ja', name: '일본어 (Japanese)' },
  { code: 'zh', name: '중국어 (Chinese)' },
  { code: 'es', name: '스페인어 (Spanish)' },
  { code: 'fr', name: '프랑스어 (French)' },
  { code: 'de', name: '독일어 (German)' },
  { code: 'it', name: '이탈리아어 (Italian)' },
  { code: 'pt', name: '포르투갈어 (Portuguese)' },
  { code: 'ru', name: '러시아어 (Russian)' },
  { code: 'ar', name: '아랍어 (Arabic)' },
  { code: 'hi', name: '힌디어 (Hindi)' },
  { code: 'th', name: '태국어 (Thai)' },
  { code: 'vi', name: '베트남어 (Vietnamese)' },
  { code: 'id', name: '인도네시아어 (Indonesian)' },
  { code: 'ms', name: '말레이어 (Malay)' },
  { code: 'tl', name: '타갈로그어 (Filipino)' },
  { code: 'tr', name: '터키어 (Turkish)' },
  { code: 'pl', name: '폴란드어 (Polish)' },
  { code: 'nl', name: '네덜란드어 (Dutch)' },
  { code: 'sv', name: '스웨덴어 (Swedish)' },
  { code: 'no', name: '노르웨이어 (Norwegian)' },
  { code: 'da', name: '덴마크어 (Danish)' },
  { code: 'fi', name: '핀란드어 (Finnish)' },
  { code: 'el', name: '그리스어 (Greek)' },
  { code: 'he', name: '히브리어 (Hebrew)' },
  { code: 'instrumental', name: '인스트루멘탈 (Instrumental)' }
]

// Translation languages for titles (exclude instrumental)
const translationLanguages = [
  { code: 'en', name: 'English' },
  { code: 'ja', name: '日本語 (Japanese)' },
  { code: 'zh', name: '中文 (Chinese)' },
  { code: 'es', name: 'Español (Spanish)' },
  { code: 'fr', name: 'Français (French)' },
  { code: 'de', name: 'Deutsch (German)' },
  { code: 'it', name: 'Italiano (Italian)' },
  { code: 'pt', name: 'Português (Portuguese)' },
  { code: 'ru', name: 'Русский (Russian)' }
]

const ImprovedReleaseSubmission: React.FC = () => {
  const navigate = useNavigate()
  const { language } = useLanguageStore()
  const user = useSafeStore(useAuthStore, state => state.user)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const coverArtInputRef = useRef<HTMLInputElement>(null)
  
  // State for drag and drop
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  
  const t = (ko: string, en: string) => language === 'ko' ? ko : en

  // Steps
  const [currentStep, setCurrentStep] = useState(1)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [showWarnings, setShowWarnings] = useState(false)
  const [validationResults, setValidationResults] = useState<QCValidationResults | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Form Data
  const [formData, setFormData] = useState<FormData>({
    albumTitle: '',
    albumTitleTranslation: '',
    albumTitleTranslations: {},
    albumArtist: '',
    albumArtists: [],
    albumFeaturingArtists: [],
    releaseType: 'single',
    primaryGenre: '',
    primarySubgenre: '',
    language: '',
    releaseTime: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Seoul',
    consumerReleaseDate: '',
    originalReleaseDate: '',
    recordLabel: '',
    copyrightHolder: '',
    copyrightYear: new Date().getFullYear().toString(),
    productionHolder: '',
    productionYear: new Date().getFullYear().toString(),
    tracks: [],
    audioFiles: [],
    dolbyAtmosFiles: [],
    distributionType: 'all',
    selectedStores: [],
    excludedStores: [],
    territories: [],
    excludedTerritories: [],
    previouslyReleased: false,
    marketingInfo: {}
  })
  
  // Modal states
  const [showAlbumArtistModal, setShowAlbumArtistModal] = useState(false)
  const [showAlbumFeaturingArtistModal, setShowAlbumFeaturingArtistModal] = useState(false)
  const [showTrackArtistModal, setShowTrackArtistModal] = useState<string | null>(null)
  const [showFeaturingArtistModal, setShowFeaturingArtistModal] = useState<string | null>(null)
  const [showContributorModal, setShowContributorModal] = useState<string | null>(null)
  
  // Translation states
  const [showAlbumTranslations, setShowAlbumTranslations] = useState(false)
  const [activeAlbumTranslations, setActiveAlbumTranslations] = useState<string[]>([])
  const [trackTranslations, setTrackTranslations] = useState<{ [trackId: string]: string[] }>({})

  // Generate display artist name
  const generateDisplayArtist = (mainArtists: Artist[], featuringArtists: Artist[] = []): string => {
    if (mainArtists.length === 0) return ''
    
    // Join main artists with "and"
    const mainArtistNames = mainArtists.map(artist => artist.name)
    let displayName = mainArtistNames.length === 1 
      ? mainArtistNames[0]
      : mainArtistNames.length === 2
      ? `${mainArtistNames[0]} and ${mainArtistNames[1]}`
      : mainArtistNames.slice(0, -1).join(', ') + ' and ' + mainArtistNames[mainArtistNames.length - 1]
    
    // Add featuring artists if any
    if (featuringArtists.length > 0) {
      const featuringNames = featuringArtists.map(artist => artist.name)
      const featuringPart = featuringNames.length === 1
        ? featuringNames[0]
        : featuringNames.length === 2
        ? `${featuringNames[0]} and ${featuringNames[1]}`
        : featuringNames.slice(0, -1).join(', ') + ' and ' + featuringNames[featuringNames.length - 1]
      
      displayName += ` featuring ${featuringPart}`
    }
    
    return displayName
  }

  // Update display artist whenever artists change
  useEffect(() => {
    const newDisplayArtist = generateDisplayArtist(formData.albumArtists, formData.albumFeaturingArtists)
    setFormData(prev => ({ ...prev, displayArtist: newDisplayArtist }))
  }, [formData.albumArtists, formData.albumFeaturingArtists])

  // Generate identifiers
  const handleGenerateUPC = () => {
    const upc = generateUPC()
    setFormData(prev => ({ ...prev, upc }))
    toast.success(t('UPC가 생성되었습니다', 'UPC generated successfully'))
  }


  // Drag event handlers for native HTML5 drag and drop
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    // Add visual feedback
    const element = e.currentTarget as HTMLElement
    element.style.opacity = '0.5'
  }

  const handleDragEnd = (e: React.DragEvent) => {
    const element = e.currentTarget as HTMLElement
    element.style.opacity = '1'
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIndex(index)
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      return
    }

    const draggedTrack = formData.tracks[draggedIndex]
    const newTracks = [...formData.tracks]
    
    // Remove dragged item
    newTracks.splice(draggedIndex, 1)
    
    // Insert at new position
    const insertIndex = draggedIndex < dropIndex ? dropIndex - 1 : dropIndex
    newTracks.splice(insertIndex, 0, draggedTrack)
    
    // Update track numbers
    const updatedTracks = newTracks.map((track, idx) => ({
      ...track,
      trackNumber: idx + 1
    }))
    
    setFormData(prev => ({ ...prev, tracks: updatedTracks }))
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  // Track management
  const addTrack = () => {
    // Copy album main artists and featuring artists to new track
    const mainArtists = formData.albumArtists || []
    const featuringArtists = formData.albumFeaturingArtists || []
    
    const newTrack: Track = {
      id: uuidv4(),
      title: '',
      titleTranslation: '',
      artists: [...mainArtists], // Copy album main artists
      featuringArtists: [...featuringArtists], // Copy album featuring artists
      contributors: [],
      trackNumber: formData.tracks.length + 1,
      titleLanguage: 'Korean',
      dolbyAtmos: false,
      titleTranslations: {}
    }
    setFormData(prev => ({
      ...prev,
      tracks: [...prev.tracks, newTrack]
    }))
  }

  const removeTrack = (trackId: string) => {
    setFormData(prev => ({
      ...prev,
      tracks: prev.tracks
        .filter(t => t.id !== trackId)
        .map((track, idx) => ({ ...track, trackNumber: idx + 1 }))
    }))
  }

  const updateTrack = (trackId: string, updates: Partial<Track>) => {
    console.log('updateTrack called:', { trackId, updates })
    setFormData(prev => {
      const newTracks = prev.tracks.map(track =>
        track.id === trackId ? { ...track, ...updates } : track
      )
      console.log('Updated tracks:', newTracks)
      return {
        ...prev,
        tracks: newTracks
      }
    })
  }

  const moveTrackUp = (index: number) => {
    if (index === 0) return
    
    const newTracks = [...formData.tracks]
    const temp = newTracks[index - 1]
    newTracks[index - 1] = newTracks[index]
    newTracks[index] = temp
    
    // Update track numbers
    const updatedTracks = newTracks.map((track, idx) => ({
      ...track,
      trackNumber: idx + 1
    }))
    
    setFormData(prev => ({ ...prev, tracks: updatedTracks }))
  }

  const moveTrackDown = (index: number) => {
    if (index >= formData.tracks.length - 1) return
    
    const newTracks = [...formData.tracks]
    const temp = newTracks[index + 1]
    newTracks[index + 1] = newTracks[index]
    newTracks[index] = temp
    
    // Update track numbers  
    const updatedTracks = newTracks.map((track, idx) => ({
      ...track,
      trackNumber: idx + 1
    }))
    
    setFormData(prev => ({ ...prev, tracks: updatedTracks }))
  }

  // File handling
  const handleAudioFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      setFormData(prev => ({
        ...prev,
        audioFiles: [...prev.audioFiles, ...files]
      }))
      toast.success(t(`${files.length}개의 오디오 파일이 추가되었습니다`, `${files.length} audio files added`))
    }
  }

  const handleCoverArtSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData(prev => ({ ...prev, coverArt: file }))
      toast.success(t('커버 아트가 업로드되었습니다', 'Cover art uploaded'))
    }
  }

  const removeAudioFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      audioFiles: prev.audioFiles.filter((_, i) => i !== index)
    }))
    toast.success(t('오디오 파일이 제거되었습니다', 'Audio file removed'))
  }

  // Validation with visual feedback
  const highlightField = (fieldId: string) => {
    const element = document.getElementById(fieldId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      element.classList.add('ring-2', 'ring-red-500', 'ring-offset-2', 'animate-pulse')
      setTimeout(() => {
        element.classList.remove('ring-2', 'ring-red-500', 'ring-offset-2', 'animate-pulse')
      }, 3000)
    }
  }

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1: // Album Info
        if (!formData.albumTitle) {
          toast.error(t('앨범 제목을 입력해주세요', 'Please enter album title'))
          highlightField('album-title-input')
          return false
        }
        if (formData.albumArtists.length === 0) {
          toast.error(t('아티스트명을 입력해주세요', 'Please enter artist name'))
          highlightField('album-artist-section')
          return false
        }
        if (!formData.primaryGenre) {
          toast.error(t('장르를 선택해주세요', 'Please select genre'))
          highlightField('genre-section')
          return false
        }
        if (!formData.language) {
          toast.error(t('언어를 선택해주세요', 'Please select language'))
          highlightField('language-section')
          return false
        }
        if (!formData.consumerReleaseDate) {
          toast.error(t('컨슈머 발매일을 선택해주세요', 'Please select consumer release date'))
          highlightField('consumer-release-date')
          return false
        }
        if (!formData.originalReleaseDate) {
          toast.error(t('오리지널 발매일을 선택해주세요', 'Please select original release date'))
          highlightField('original-release-date')
          return false
        }
        if (!formData.releaseTime) {
          toast.error(t('발매 시간을 입력해주세요', 'Please enter release time'))
          highlightField('release-time-input')
          return false
        }
        return true
        
      case 2: // Tracks
        if (formData.tracks.length === 0) {
          toast.error(t('최소 1개 이상의 트랙을 추가해주세요', 'Please add at least one track'))
          highlightField('add-track-button')
          return false
        }
        for (const track of formData.tracks) {
          if (!track.title || track.artists.length === 0) {
            toast.error(t('모든 트랙의 제목과 아티스트를 입력해주세요', 'Please enter title and artist for all tracks'))
            highlightField('tracks-section')
            return false
          }
        }
        return true
        
      case 3: // Files
        if (!formData.coverArt) {
          toast.error(t('커버 아트를 업로드해주세요', 'Please upload cover art'))
          highlightField('cover-art-upload')
          return false
        }
        if (formData.audioFiles.length !== formData.tracks.length) {
          toast.error(t('트랙 수와 오디오 파일 수가 일치해야 합니다', 'Number of tracks and audio files must match'))
          highlightField('audio-files-upload')
          return false
        }
        return true
        
      case 4: // Distribution
        if (formData.distributionType === 'selected' && formData.selectedStores.length === 0) {
          toast.error(t('최소 1개 이상의 스토어를 선택해주세요', 'Please select at least one store'))
          highlightField('store-selection')
          return false
        }
        if (formData.territories.length === 0) {
          toast.error(t('최소 1개 이상의 지역을 선택해주세요', 'Please select at least one territory'))
          highlightField('territory-selection')
          return false
        }
        return true
        
      default:
        return true
    }
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCompletedSteps(prev => [...new Set([...prev, currentStep])])
      setCurrentStep(prev => prev + 1)
    }
  }

  const handleBack = () => {
    setCurrentStep(prev => prev - 1)
  }

  const handleStepClick = (step: number) => {
    if (step <= currentStep || completedSteps.includes(step - 1)) {
      setCurrentStep(step)
    }
  }

  // Calculate days until release
  const calculateDaysUntilRelease = (releaseDate: string) => {
    if (!releaseDate) return null
    
    const today = new Date()
    const release = new Date(releaseDate)
    const timeDiff = release.getTime() - today.getTime()
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24))
    
    return daysDiff
  }

  // Get marketing opportunity message
  const getMarketingMessage = (daysUntilRelease: number | null) => {
    if (daysUntilRelease === null) return null
    
    if (daysUntilRelease < 0) {
      return {
        type: 'error',
        message: t('과거 날짜는 선택할 수 없습니다', 'Cannot select past dates')
      }
    } else if (daysUntilRelease < 7) {
      return {
        type: 'warning',
        message: t('발매일까지 일주일 미만입니다. 마케팅 기회가 매우 제한적입니다.', 'Less than a week until release. Marketing opportunities are very limited.')
      }
    } else if (daysUntilRelease < 21) {
      return {
        type: 'warning',
        message: t(`발매일까지 ${daysUntilRelease}일 남았습니다. 마케팅 기회가 제한적일 수 있습니다.`, `${daysUntilRelease} days until release. Marketing opportunities may be limited.`)
      }
    } else if (daysUntilRelease < 28) {
      return {
        type: 'caution',
        message: t(`발매일까지 ${daysUntilRelease}일 남았습니다. 마케팅 기회를 위해 빠른 제출을 권장합니다.`, `${daysUntilRelease} days until release. Quick submission recommended for marketing opportunities.`)
      }
    } else {
      return {
        type: 'success',
        message: t(`발매일까지 ${daysUntilRelease}일 남았습니다. 충분한 마케팅 기회가 있습니다!`, `${daysUntilRelease} days until release. Great marketing opportunities available!`)
      }
    }
  }

  // Submit
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true)
      
      // Basic form validation
      if (!formData.consumerReleaseDate) {
        toast.error(t('컨슈머 발매일을 선택해주세요', 'Please select consumer release date'))
        return
      }
      
      if (!formData.originalReleaseDate) {
        toast.error(t('오리지널 발매일을 선택해주세요', 'Please select original release date'))
        return
      }
      
      if (!formData.releaseTime) {
        toast.error(t('발매 시간을 입력해주세요', 'Please enter release time'))
        return
      }
      
      if (!formData.timezone) {
        toast.error(t('타임존을 선택해주세요', 'Please select timezone'))
        return
      }
      
      // Run QC validation
      const results = await validateSubmission({
        albumTitle: formData.albumTitle,
        albumArtist: formData.albumArtist || formData.albumArtists.find(a => a.role === 'main')?.name || '',
        tracks: formData.tracks.map(t => ({
          ...t,
          artist: t.artists.map(a => a.name).join(', ')
        })),
        coverArt: formData.coverArt,
        audioFiles: formData.audioFiles,
        upc: formData.upc,
        ean: formData.ean,
        releaseDate: formData.consumerReleaseDate,
        recordLabel: formData.recordLabel,
        copyrightHolder: formData.copyrightHolder,
        copyrightYear: formData.copyrightYear,
        productionHolder: formData.productionHolder,
        productionYear: formData.productionYear,
        territories: formData.territories
      })
      
      setValidationResults(results)
      
      if (results.errors.length > 0) {
        setShowWarnings(true)
        toast.error(t('QC 검증 실패: 오류를 수정해주세요', 'QC validation failed: Please fix the errors'))
        return
      }
      
      if (results.warnings.length > 0) {
        setShowWarnings(true)
        const proceed = window.confirm(t(
          '경고사항이 있습니다. 계속 진행하시겠습니까?',
          'There are warnings. Do you want to proceed?'
        ))
        if (!proceed) return
      }
      
      // Prepare submission data
      const submissionData = new FormData()
      
      // UTC 변환 계산
      const consumerReleaseUTC = formData.consumerReleaseDate && formData.releaseTime && formData.timezone
        ? convertToUTC(formData.consumerReleaseDate, formData.releaseTime, formData.timezone)
        : null

      const originalReleaseUTC = formData.originalReleaseDate && formData.releaseTime && formData.timezone
        ? convertToUTC(formData.originalReleaseDate, formData.releaseTime, formData.timezone)
        : null

      // Add form data
      submissionData.append('releaseData', JSON.stringify({
        albumTitle: formData.albumTitle,
        albumArtist: formData.albumArtist || formData.albumArtists.find(a => a.role === 'main')?.name || '',
        albumArtists: formData.albumArtists,
        releaseType: formData.releaseType,
        primaryGenre: formData.primaryGenre,
        primarySubgenre: formData.primarySubgenre,
        secondaryGenre: formData.secondaryGenre,
        secondarySubgenre: formData.secondarySubgenre,
        language: formData.language,
        consumerReleaseDate: formData.consumerReleaseDate,
        originalReleaseDate: formData.originalReleaseDate,
        releaseTime: formData.releaseTime,
        timezone: formData.timezone,
        // UTC 변환값 추가
        consumerReleaseUTC: consumerReleaseUTC?.toISOString(),
        originalReleaseUTC: originalReleaseUTC?.toISOString(),
        upc: formData.upc,
        ean: formData.ean,
        catalogNumber: formData.catalogNumber,
        recordLabel: formData.recordLabel,
        copyrightHolder: formData.copyrightHolder,
        copyrightYear: formData.copyrightYear,
        productionHolder: formData.productionHolder,
        productionYear: formData.productionYear,
        albumVersion: formData.albumVersion,
        tracks: formData.tracks,
        distributionType: formData.distributionType,
        selectedStores: formData.selectedStores,
        excludedStores: formData.excludedStores,
        territories: formData.territories,
        excludedTerritories: formData.excludedTerritories,
        previouslyReleased: formData.previouslyReleased,
        marketingInfo: formData.marketingInfo
      }))
      
      // Add files
      if (formData.coverArt) {
        submissionData.append('coverArt', formData.coverArt)
      }
      
      formData.audioFiles.forEach((file, index) => {
        submissionData.append('audioFiles', file)
      })
      
      // Submit
      await submissionService.createSubmission(submissionData)
      
      toast.success(t('릴리즈가 성공적으로 제출되었습니다!', 'Release submitted successfully!'))
      navigate('/submission-success')
      
    } catch (error) {
      console.error('Submission error:', error)
      toast.error(t('제출 중 오류가 발생했습니다', 'Error submitting release'))
    } finally {
      setIsSubmitting(false)
    }
  }

  // Track Item Component with drag and drop
  const TrackItem: React.FC<{ track: Track; index: number }> = ({ track, index }) => {
    const isDragOver = dragOverIndex === index
    
    return (
      <div
        className={`
          p-4 border rounded-lg transition-all
          ${isDragOver ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 scale-105' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'}
          ${draggedIndex === index ? 'opacity-50' : ''}
        `}
        onDragOver={(e) => handleDragOver(e, index)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, index)}
      >
        <div className="flex items-start gap-4">
          {/* Drag Handle */}
          <div 
            className="flex flex-col items-center gap-1 mt-2 cursor-move"
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragEnd={handleDragEnd}
            style={{ touchAction: 'none' }}
          >
            <GripVertical className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-500">#{track.trackNumber}</span>
          </div>
          
          {/* Track Content */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Track Title */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('트랙 제목', 'Track Title')} *
              </label>
              <input
                type="text"
                value={track.title || ''}
                onChange={(e) => {
                  e.stopPropagation()
                  updateTrack(track.id, { title: e.target.value })
                }}
                onMouseDown={(e) => e.stopPropagation()}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                placeholder={t('트랙 제목 입력', 'Enter track title')}
              />
            </div>

            {/* Track Title Translations */}
            <div className="md:col-span-2 mt-4">
              <TranslationInput
                translations={track.titleTranslations ? 
                  Object.entries(track.titleTranslations).map(([language, title]) => ({
                    id: `${track.id}-${language}`,
                    language,
                    title: title as string
                  })) : []
                }
                onTranslationsChange={(translations) => {
                  const translationsObj = translations.reduce((acc, t) => ({
                    ...acc,
                    [t.language]: t.title
                  }), {})
                  updateTrack(track.id, { titleTranslations: translationsObj })
                }}
                language={language}
                placeholder={t('트랙 제목의 번역', 'Translation of track title')}
              />
            </div>
            
            {/* Track Artists */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('트랙 아티스트', 'Track Artists')} *
              </label>
              
              {/* Artist List */}
              {track.artists.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {track.artists.map((artist) => (
                    <span
                      key={artist.id}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-full text-sm"
                    >
                      {artist.name}
                    </span>
                  ))}
                </div>
              )}
              
              <button
                type="button"
                onClick={() => setShowTrackArtistModal(track.id)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:border-purple-500 dark:hover:border-purple-400 transition-colors text-sm text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400"
              >
                <Plus className="w-4 h-4 inline-block mr-1" />
                {t('아티스트 관리', 'Manage Artists')}
              </button>
            </div>
            
            {/* Featuring Artists */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('피처링 아티스트', 'Featuring Artists')}
              </label>
              
              {/* Featuring Artist List */}
              {track.featuringArtists.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {track.featuringArtists.map((artist) => (
                    <span
                      key={artist.id}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-pink-100 dark:bg-pink-900/20 text-pink-700 dark:text-pink-300 rounded-full text-sm"
                    >
                      {artist.name}
                    </span>
                  ))}
                </div>
              )}
              
              <button
                type="button"
                onClick={() => setShowFeaturingArtistModal(track.id)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:border-purple-500 dark:hover:border-purple-400 transition-colors text-sm text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400"
              >
                <Plus className="w-4 h-4 inline-block mr-1" />
                {t('피처링 관리', 'Manage Featuring')}
              </button>
            </div>
            
            {/* Contributors */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('기여자', 'Contributors')}
              </label>
              
              {/* Contributor List */}
              {track.contributors && track.contributors.length > 0 && (
                <div className="mb-3 space-y-2">
                  {track.contributors.map((contributor) => (
                    <div
                      key={contributor.id}
                      className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Users className="w-4 h-4 text-green-600 dark:text-green-400" />
                            <span className="font-medium text-gray-900 dark:text-white">
                              {contributor.name}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2 text-xs">
                            {contributor.roles && contributor.roles.map((role, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full"
                              >
                                <User className="w-3 h-3" />
                                {role}
                              </span>
                            ))}
                            {contributor.instruments && contributor.instruments.map((instrument, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full"
                              >
                                <Music className="w-3 h-3" />
                                {instrument}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <button
                type="button"
                onClick={() => setShowContributorModal(track.id)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:border-purple-500 dark:hover:border-purple-400 transition-colors text-sm text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                {t('기여자 관리', 'Manage Contributors')}
              </button>
            </div>
            
            {/* ISRC */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                ISRC
              </label>
              <input
                type="text"
                value={track.isrc || ''}
                onChange={(e) => updateTrack(track.id, { isrc: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                placeholder="KR-XXX-YY-NNNNN"
              />
            </div>
            
            {/* Title Language */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('제목 언어', 'Title Language')}
              </label>
              <select
                value={track.titleLanguage || 'Korean'}
                onChange={(e) => updateTrack(track.id, { titleLanguage: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="Korean">{t('한국어', 'Korean')}</option>
                <option value="English">{t('영어', 'English')}</option>
                <option value="Japanese">{t('일본어', 'Japanese')}</option>
                <option value="Chinese">{t('중국어', 'Chinese')}</option>
                <option value="Other">{t('기타', 'Other')}</option>
              </select>
            </div>
            
            {/* Dolby Atmos Toggle */}
            <div className="md:col-span-2">
              <Toggle
                checked={track.dolbyAtmos || false}
                onChange={(checked) => updateTrack(track.id, { dolbyAtmos: checked })}
                label={t('Dolby Atmos 지원', 'Dolby Atmos Support')}
                helpText={t('이 트랙이 Dolby Atmos로 마스터링되었나요?', 'Is this track mastered in Dolby Atmos?')}
              />
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => moveTrackUp(index)}
              disabled={index === 0}
              className="p-1 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              title={t('위로 이동', 'Move up')}
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => moveTrackDown(index)}
              disabled={index === formData.tracks.length - 1}
              className="p-1 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              title={t('아래로 이동', 'Move down')}
            >
              <ChevronDown className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => removeTrack(track.id)}
              className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
              title={t('삭제', 'Delete')}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Step Components
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('앨범 정보', 'Album Information')}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Album Title */}
              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('앨범 제목', 'Album Title')} *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAlbumTranslations(!showAlbumTranslations)}
                    className={`
                      inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-all
                      ${showAlbumTranslations 
                        ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-sm' 
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:border-purple-300 hover:text-purple-600 dark:hover:text-purple-400'
                      }
                    `}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>{t('번역 추가', 'Add Translation')}</span>
                  </button>
                </div>
                <input
                  id="album-title-input"
                  type="text"
                  value={formData.albumTitle}
                  onChange={(e) => setFormData(prev => ({ ...prev, albumTitle: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                  placeholder={t('앨범 제목을 입력하세요', 'Enter album title')}
                />
                
                {/* Album Title Translations - Modern Design */}
                {showAlbumTranslations && (
                  <div className="mt-4 animate-in slide-in-from-top-2">
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 rounded-2xl p-6 border border-purple-100 dark:border-purple-800/30">
                      
                      {/* Header with Animation */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                            <Globe className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div>
                            <h4 className="text-base font-semibold text-gray-800 dark:text-gray-200">
                              {t('글로벌 번역', 'Global Translations')}
                            </h4>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {t('전 세계 팬들을 위한 다국어 지원', 'Multilingual support for global fans')}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                          {activeAlbumTranslations.length}/{translationLanguages.length} {t('언어', 'languages')}
                        </span>
                      </div>
                      
                      {/* Translations Grid */}
                      <div className="space-y-3">
                        {activeAlbumTranslations.length === 0 ? (
                          <div className="text-center py-8">
                            <Languages className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {t('아래에서 언어를 선택하여 번역을 추가하세요', 'Select a language below to add translations')}
                            </p>
                          </div>
                        ) : (
                          <div className="grid gap-3">
                            {activeAlbumTranslations.map((langCode, index) => {
                              const lang = translationLanguages.find(l => l.code === langCode)
                              return (
                                <div 
                                  key={langCode} 
                                  className="group bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200"
                                  style={{ animationDelay: `${index * 50}ms` }}
                                >
                                  <div className="flex items-start gap-3">
                                    {/* Language Flag/Icon */}
                                    <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-800/20 dark:to-pink-800/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                      <span className="text-sm font-bold text-purple-700 dark:text-purple-300">
                                        {langCode.toUpperCase().slice(0, 2)}
                                      </span>
                                    </div>
                                    
                                    {/* Input Area */}
                                    <div className="flex-1">
                                      <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">
                                        {lang?.name}
                                      </label>
                                      <input
                                        type="text"
                                        value={formData.albumTitleTranslations?.[langCode] || ''}
                                        onChange={(e) => setFormData(prev => ({
                                          ...prev,
                                          albumTitleTranslations: {
                                            ...prev.albumTitleTranslations,
                                            [langCode]: e.target.value
                                          }
                                        }))}
                                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border-0 rounded-lg 
                                                 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white dark:focus:bg-gray-800
                                                 transition-all duration-200 text-sm text-gray-900 dark:text-gray-100 
                                                 placeholder-gray-400 dark:placeholder-gray-500"
                                        placeholder={t(`${lang?.name}로 번역`, `Translate to ${lang?.name}`)}
                                      />
                                    </div>
                                    
                                    {/* Delete Button */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveAlbumTranslations(activeAlbumTranslations.filter(l => l !== langCode))
                                        const newTranslations = { ...formData.albumTitleTranslations }
                                        delete newTranslations[langCode]
                                        setFormData(prev => ({ ...prev, albumTitleTranslations: newTranslations }))
                                      }}
                                      className="mt-6 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 
                                               rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                        
                        {/* Language Selection */}
                        <div className="mt-4 pt-4 border-t border-purple-100 dark:border-purple-800/30">
                          <div className="flex flex-wrap gap-2">
                            {translationLanguages
                              .filter(lang => !activeAlbumTranslations.includes(lang.code))
                              .slice(0, 6)
                              .map(lang => (
                                <button
                                  key={lang.code}
                                  type="button"
                                  onClick={() => setActiveAlbumTranslations([...activeAlbumTranslations, lang.code])}
                                  className="px-3 py-1.5 text-xs font-medium text-purple-700 dark:text-purple-300 
                                           bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-900/50 
                                           rounded-full transition-all duration-200"
                                >
                                  + {lang.name}
                                </button>
                              ))}
                            
                            {translationLanguages.filter(lang => !activeAlbumTranslations.includes(lang.code)).length > 6 && (
                              <select
                                value=""
                                onChange={(e) => {
                                  if (e.target.value) {
                                    setActiveAlbumTranslations([...activeAlbumTranslations, e.target.value])
                                  }
                                }}
                                className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 
                                         bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700
                                         rounded-full cursor-pointer transition-all duration-200 appearance-none pr-8"
                                style={{ backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e")', backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
                              >
                                <option value="">{t('더 많은 언어...', 'More languages...')}</option>
                                {translationLanguages
                                  .filter(lang => !activeAlbumTranslations.includes(lang.code))
                                  .slice(6)
                                  .map(lang => (
                                    <option key={lang.code} value={lang.code}>
                                      {lang.name}
                                    </option>
                                  ))}
                              </select>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Album Artists */}
              <div id="album-artist-section" className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('앨범 아티스트', 'Album Artists')} *
                </label>
                
                {/* Artist List Display */}
                {formData.albumArtists.length > 0 && (
                  <div className="mb-3 space-y-2">
                    {formData.albumArtists.map((artist) => (
                      <div
                        key={artist.id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-purple-100 dark:bg-purple-900/20 rounded">
                            {artist.role === 'main' ? (
                              <User className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                            ) : artist.role === 'featured' ? (
                              <Music className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                            ) : (
                              <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {artist.name}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {artist.role === 'main' && t('메인 아티스트', 'Main Artist')}
                              {artist.role === 'featured' && t('피처링', 'Featured')}
                              {artist.role === 'additional' && t('참여 아티스트', 'Additional Artist')}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Add Artist Button */}
                <button
                  type="button"
                  onClick={() => setShowAlbumArtistModal(true)}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-dashed border-gray-300 dark:border-gray-600 
                           rounded-lg hover:border-purple-400 dark:hover:border-purple-500 
                           transition-colors flex items-center justify-center gap-2 
                           text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400"
                >
                  <Plus className="w-5 h-5" />
                  {t('아티스트 관리', 'Manage Artists')}
                </button>
              </div>
              
              {/* Featuring Artists */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('피처링 아티스트', 'Featuring Artists')}
                </label>
                
                {/* Featuring Artist List */}
                {formData.albumFeaturingArtists && formData.albumFeaturingArtists.length > 0 && (
                  <div className="mb-3 space-y-2">
                    {formData.albumFeaturingArtists.map((artist) => (
                      <div
                        key={artist.id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-pink-100 dark:bg-pink-900/20 rounded">
                            <Music className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {artist.name}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {t('피처링 아티스트', 'Featuring Artist')}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                <button
                  type="button"
                  onClick={() => setShowAlbumFeaturingArtistModal(true)}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-dashed border-gray-300 dark:border-gray-600 
                           rounded-lg hover:border-purple-400 dark:hover:border-purple-500 
                           transition-colors flex items-center justify-center gap-2 
                           text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400"
                >
                  <Plus className="w-5 h-5" />
                  {t('피처링 관리', 'Manage Featuring')}
                </button>
              </div>

              {/* Label and Display Artist */}
              <div className="md:col-span-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {t('레이블 및 표시 정보', 'Label & Display Information')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('레이블', 'Label')}
                    </label>
                    <input
                      type="text"
                      value={formData.label || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                      placeholder={t('레이블명 입력', 'Enter label name')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('디스플레이 아티스트', 'Display Artist')}
                    </label>
                    <input
                      type="text"
                      value={formData.displayArtist || ''}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 cursor-not-allowed"
                      placeholder={t('아티스트 정보에서 자동 생성됨', 'Auto-generated from artist info')}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {t('메인 및 피처링 아티스트 정보를 기반으로 자동 생성됩니다', 'Automatically generated based on main and featuring artists')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Explicit Content */}
              <div className="md:col-span-2">
                <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <input
                    type="checkbox"
                    id="explicit-content"
                    checked={formData.explicitContent || false}
                    onChange={(e) => setFormData(prev => ({ ...prev, explicitContent: e.target.checked }))}
                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="explicit-content" className="flex-1 cursor-pointer">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {t('이 앨범은 청소년 유해 컨텐츠를 포함합니다', 'This album contains explicit content')}
                    </span>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {t('욕설, 성적 내용, 폭력적 내용 등이 포함된 경우 체크하세요', 'Check if album contains profanity, sexual content, violence, etc.')}
                    </p>
                  </label>
                </div>
              </div>
              
              {/* Release Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('릴리즈 타입', 'Release Type')} *
                </label>
                <RadioGroup
                  name="releaseType"
                  value={formData.releaseType}
                  onChange={(value) => setFormData(prev => ({ ...prev, releaseType: value as any }))}
                  options={[
                    { value: 'single', label: t('싱글', 'Single'), description: t('1-3곡', '1-3 tracks') },
                    { value: 'ep', label: 'EP', description: t('4-6곡', '4-6 tracks') },
                    { value: 'album', label: t('정규', 'Album'), description: t('7곡 이상', '7+ tracks') }
                  ]}
                />
              </div>
              
              {/* Primary Genre */}
              <div id="genre-section">
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                  {t('주 장르', 'Primary Genre')} <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  options={genreList}
                  value={formData.primaryGenre}
                  onChange={(value) => {
                    setFormData(prev => ({ ...prev, primaryGenre: value, primarySubgenre: '' }))
                  }}
                  placeholder={t('장르 선택', 'Select genre')}
                  searchPlaceholder={t('장르 검색...', 'Search genres...')}
                />
              </div>
              
              {/* Primary Subgenre */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                  {t('주 서브장르', 'Primary Subgenre')}
                </label>
                <SearchableSelect
                  options={formData.primaryGenre && subgenreList[formData.primaryGenre] ? subgenreList[formData.primaryGenre] : []}
                  value={formData.primarySubgenre}
                  onChange={(value) => setFormData(prev => ({ ...prev, primarySubgenre: value }))}
                  placeholder={t('서브장르 선택', 'Select subgenre')}
                  searchPlaceholder={t('서브장르 검색...', 'Search subgenres...')}
                  disabled={!formData.primaryGenre}
                />
              </div>
              
              {/* Language */}
              <div id="language-section">
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                  {t('주요 가사 언어', 'Primary Lyrics Language')} <span className="text-red-500">*</span>
                  <span className="ml-1 text-xs text-gray-600 dark:text-gray-400">
                    {t('(가장 많이 사용된 언어)', '(Most used language)')}
                  </span>
                </label>
                <SearchableSelect
                  options={languageList.map(lang => ({ value: lang.code, label: lang.name }))}
                  value={formData.language}
                  onChange={(value) => setFormData(prev => ({ ...prev, language: value }))}
                  placeholder={t('언어 선택', 'Select language')}
                  searchPlaceholder={t('언어 검색...', 'Search languages...')}
                />
              </div>
              
              {/* Release Date and Time */}
              <div className="md:col-span-2">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-700">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">📅</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {t('발매일 및 시간 설정', 'Release Date & Time Settings')}
                    </h3>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Marketing Notice */}
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
                            {t('마케팅 기회 안내', 'Marketing Opportunity Notice')}
                          </p>
                          <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                            {t(
                              '발매일 최소 3-4주 전에 제출해야 마케팅 기회를 얻을 수 있습니다. Apple Music은 4주 전 제출 시 마케팅 기회가 주어지나 보장되지는 않습니다.',
                              'Submit at least 3-4 weeks before release date for marketing opportunities. Apple Music provides marketing opportunities for submissions 4 weeks in advance, but it is not guaranteed.'
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Auto-fill Notice */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                          {t(
                            '💡 컨슈머 발매일을 입력하면 오리지널 발매일이 자동으로 같은 날짜로 설정됩니다. 재발매인 경우 오리지널 발매일을 별도로 수정해주세요.',
                            '💡 When you enter Consumer Release Date, Original Release Date will be automatically set to the same date. For re-releases, please adjust the Original Release Date separately.'
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Consumer Release Date */}
                      <div id="consumer-release-date">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t('컨슈머 발매일', 'Consumer Release Date')} <span className="text-red-500">*</span>
                        </label>
                        <DatePicker
                          value={formData.consumerReleaseDate || ''}
                          onChange={(date) => {
                            setFormData(prev => ({ 
                              ...prev, 
                              consumerReleaseDate: date,
                              // 항상 오리지널 발매일을 컨슈머 발매일과 동일하게 설정
                              originalReleaseDate: date
                            }))
                          }}
                          minDate={new Date().toISOString().split('T')[0]}
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {t('실제 발매될 날짜', 'Actual release date')}
                        </p>
                        
                        {/* Days until release and marketing message */}
                        {formData.consumerReleaseDate && (() => {
                          const daysUntilRelease = calculateDaysUntilRelease(formData.consumerReleaseDate)
                          const marketingMessage = getMarketingMessage(daysUntilRelease)
                          
                          if (!marketingMessage) return null
                          
                          const bgColor = {
                            error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700',
                            warning: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700',
                            caution: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700',
                            success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700'
                          }
                          
                          const textColor = {
                            error: 'text-red-700 dark:text-red-300',
                            warning: 'text-orange-700 dark:text-orange-300',
                            caution: 'text-yellow-700 dark:text-yellow-300',
                            success: 'text-green-700 dark:text-green-300'
                          }
                          
                          const icon = {
                            error: '❌',
                            warning: '⚠️',
                            caution: '⏰',
                            success: '✅'
                          }
                          
                          return (
                            <div className={`mt-2 p-2 rounded-lg border ${bgColor[marketingMessage.type as keyof typeof bgColor]}`}>
                              <div className="flex items-start gap-2">
                                <span className="text-sm">{icon[marketingMessage.type as keyof typeof icon]}</span>
                                <p className={`text-xs font-medium ${textColor[marketingMessage.type as keyof typeof textColor]}`}>
                                  {marketingMessage.message}
                                </p>
                              </div>
                            </div>
                          )
                        })()}
                      </div>
                      
                      {/* Original Release Date */}
                      <div id="original-release-date">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t('오리지널 발매일', 'Original Release Date')} <span className="text-red-500">*</span>
                        </label>
                        <DatePicker
                          value={formData.originalReleaseDate || ''}
                          onChange={(date) => setFormData(prev => ({ ...prev, originalReleaseDate: date }))}
                          maxDate={new Date().toISOString().split('T')[0]}
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {t('최초 발매된 날짜', 'First release date')}
                        </p>
                      </div>
                      
                      {/* Release Time */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t('발매 시간', 'Release Time')} <span className="text-red-500">*</span>
                        </label>
                        <div className="space-y-2">
                          <input
                            id="release-time-input"
                            type="time"
                            value={formData.releaseTime}
                            onChange={(e) => setFormData(prev => ({ ...prev, releaseTime: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                            required
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {t('정확한 발매 시간을 입력해주세요', 'Please enter the exact release time')}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Timezone Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('타임존 (시간대)', 'Timezone')} <span className="text-red-500">*</span>
                      </label>
                      <SearchableSelect
                        options={timezones.map(tz => ({ 
                          value: tz.value, 
                          label: `${tz.label} (${tz.offset})` 
                        }))}
                        value={formData.timezone}
                        onChange={(value) => setFormData(prev => ({ ...prev, timezone: value }))}
                        placeholder={t('시간대 선택', 'Select timezone')}
                        searchPlaceholder={t('시간대 검색...', 'Search timezones...')}
                        className="w-full"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {t('선택한 시간대를 기준으로 발매 시간이 설정됩니다', 'Release time will be set based on selected timezone')}
                      </p>
                    </div>

                    {/* UTC Conversion Display */}
                    {formData.consumerReleaseDate && formData.releaseTime && formData.timezone && (
                      <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Globe className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          <h4 className="text-sm font-medium text-purple-800 dark:text-purple-200">
                            {t('UTC 변환 정보', 'UTC Conversion Info')}
                          </h4>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-purple-700 dark:text-purple-300">
                            <span className="font-medium">{t('컨슈머 발매시간', 'Consumer Release Time')}:</span> {formData.consumerReleaseDate} {formData.releaseTime} ({formData.timezone})
                          </p>
                          <p className="text-sm text-purple-700 dark:text-purple-300">
                            <span className="font-medium">{t('UTC 변환', 'UTC Time')}:</span> {
                              (() => {
                                const utcDate = convertToUTC(formData.consumerReleaseDate, formData.releaseTime, formData.timezone);
                                const hours = utcDate.getUTCHours();
                                const minutes = String(utcDate.getUTCMinutes()).padStart(2, '0');
                                const ampm = hours >= 12 ? 'PM' : 'AM';
                                const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
                                return `${utcDate.getUTCFullYear()}-${String(utcDate.getUTCMonth() + 1).padStart(2, '0')}-${String(utcDate.getUTCDate()).padStart(2, '0')} ${displayHours}:${minutes} ${ampm} UTC`;
                              })()
                            }
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* UPC */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  UPC
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.upc || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, upc: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                    placeholder={t('UPC 코드', 'UPC code')}
                  />
                  <button
                    type="button"
                    onClick={handleGenerateUPC}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    {t('생성', 'Generate')}
                  </button>
                </div>
              </div>
              
              {/* Copyright Info (P&C) */}
              <div className="md:col-span-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {t('저작권 정보 (P&C)', 'Copyright Information (P&C)')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('© 저작권자 (Copyright)', '© Copyright Holder')} *
                    </label>
                    <input
                      type="text"
                      value={formData.copyrightHolder}
                      onChange={(e) => setFormData(prev => ({ ...prev, copyrightHolder: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                      placeholder={t('저작권 소유자명', 'Copyright holder name')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('© 저작권 연도', '© Copyright Year')} *
                    </label>
                    <input
                      type="text"
                      value={formData.copyrightYear}
                      onChange={(e) => setFormData(prev => ({ ...prev, copyrightYear: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                      placeholder="2024"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('℗ 제작권자 (Production)', '℗ Production Holder')} *
                    </label>
                    <input
                      type="text"
                      value={formData.productionHolder}
                      onChange={(e) => setFormData(prev => ({ ...prev, productionHolder: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                      placeholder={t('음원 제작권 소유자명', 'Production rights holder name')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('℗ 제작권 연도', '℗ Production Year')} *
                    </label>
                    <input
                      type="text"
                      value={formData.productionYear}
                      onChange={(e) => setFormData(prev => ({ ...prev, productionYear: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                      placeholder="2024"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {t(
                    '© (Copyright)는 작곡/작사 권리, ℗ (Production)는 녹음/제작 권리를 의미합니다',
                    '© (Copyright) refers to composition/lyrics rights, ℗ (Production) refers to recording/production rights'
                  )}
                </p>
              </div>
            </div>
          </div>
        )
        
      case 2:
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('트랙 정보', 'Track Information')}
              </h2>
              <button
                id="add-track-button"
                type="button"
                onClick={addTrack}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                <Plus className="w-4 h-4" />
                {t('트랙 추가', 'Add Track')}
              </button>
            </div>
            
            <div id="tracks-section" className="space-y-4">
              {formData.tracks.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                  <Music className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    {t('트랙을 추가해주세요', 'Please add tracks')}
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('드래그하여 트랙 순서를 변경할 수 있습니다', 'Drag to reorder tracks')}
                  </p>
                  {formData.tracks.map((track, index) => (
                    <TrackItem key={track.id} track={track} index={index} />
                  ))}
                </>
              )}
            </div>
          </div>
        )
        
      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('파일 업로드', 'File Upload')}
            </h2>
            
            {/* File Guidelines */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
                    {t('파일 형식 가이드라인', 'File Format Guidelines')}
                  </p>
                  <ul className="space-y-1 text-blue-800 dark:text-blue-300">
                    <li>• {t('커버 아트: 3000x3000px 이상, JPG/PNG, RGB 색상 모드', 'Cover Art: Min 3000x3000px, JPG/PNG, RGB color mode')}</li>
                    <li>• {t('오디오: WAV/FLAC, 24bit/96kHz 이상 권장, 스테레오', 'Audio: WAV/FLAC, 24bit/96kHz+ recommended, Stereo')}</li>
                    <li>• {t('Dolby Atmos: ADM BWF 또는 .atmos 파일', 'Dolby Atmos: ADM BWF or .atmos file')}</li>
                    <li>• {t('모션 아트: MP4/MOV, 3-10초, 최대 100MB', 'Motion Art: MP4/MOV, 3-10 seconds, Max 100MB')}</li>
                    <li>• {t('뮤직비디오: MP4/MOV, H.264, 1920x1080 이상', 'Music Video: MP4/MOV, H.264, 1920x1080+')}</li>
                  </ul>
                </div>
              </div>
            </div>
            
            {/* Cover Art */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                {t('커버 아트', 'Cover Art')} 
                <span className="text-red-500 ml-1">*</span>
              </label>
              {formData.coverArt ? (
                <div className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <Image className="w-8 h-8 text-gray-600 dark:text-gray-400" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-gray-100">{formData.coverArt.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {(formData.coverArt.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, coverArt: undefined }))}
                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <button
                  id="cover-art-upload"
                  type="button"
                  onClick={() => coverArtInputRef.current?.click()}
                  className="w-full p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-purple-500 dark:hover:border-purple-400 transition-colors bg-gray-50 dark:bg-gray-800/30 hover:bg-gray-100 dark:hover:bg-gray-800/50"
                >
                  <Upload className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
                  <p className="text-gray-700 dark:text-gray-300 font-medium">
                    {t('클릭하여 이미지 선택', 'Click to select image')}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    {t('최소 3000x3000px, JPG/PNG, RGB 색상 모드', 'Min 3000x3000px, JPG/PNG, RGB color mode')}
                  </p>
                </button>
              )}
              <input
                ref={coverArtInputRef}
                type="file"
                accept="image/jpeg,image/png"
                onChange={handleCoverArtSelect}
                className="hidden"
              />
            </div>
            
            {/* Audio Files */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                {t('오디오 파일', 'Audio Files')} 
                <span className="text-red-500 ml-1">*</span>
                <span className="ml-2 text-gray-600 dark:text-gray-400">
                  ({formData.audioFiles.length}/{formData.tracks.length})
                </span>
              </label>
              
              {formData.audioFiles.length > 0 && (
                <div className="space-y-2 mb-4">
                  {formData.audioFiles.map((file, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                      <Music className="w-8 h-8 text-gray-600 dark:text-gray-400" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-gray-100">{file.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAudioFile(index)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <button
                id="audio-files-upload"
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-purple-500 dark:hover:border-purple-400 transition-colors bg-gray-50 dark:bg-gray-800/30 hover:bg-gray-100 dark:hover:bg-gray-800/50"
              >
                <Upload className="w-8 h-8 mx-auto text-gray-400 dark:text-gray-500 mb-2" />
                <p className="text-gray-700 dark:text-gray-300 font-medium">
                  {t('오디오 파일 추가', 'Add audio files')}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {t('WAV, FLAC (24bit/96kHz 이상 권장)', 'WAV, FLAC (24bit/96kHz or higher recommended)')}
                </p>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/wav,audio/flac,audio/x-flac"
                multiple
                onChange={handleAudioFileSelect}
                className="hidden"
              />
            </div>
            
            {/* Dolby Atmos Files */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                {t('Dolby Atmos 파일', 'Dolby Atmos Files')} 
                <span className="text-gray-500 ml-1">{t('(선택사항)', '(Optional)')}</span>
              </label>
              
              {formData.dolbyAtmosFiles && formData.dolbyAtmosFiles.length > 0 && (
                <div className="space-y-2 mb-4">
                  {formData.dolbyAtmosFiles.map((file, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                      <Disc className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-gray-100">{file.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {(file.size / 1024 / 1024).toFixed(2)} MB • Dolby Atmos
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const newFiles = [...(formData.dolbyAtmosFiles || [])]
                          newFiles.splice(index, 1)
                          setFormData(prev => ({ ...prev, dolbyAtmosFiles: newFiles }))
                        }}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <button
                type="button"
                onClick={() => {
                  const input = document.createElement('input')
                  input.type = 'file'
                  input.accept = '.atmos,.bwf'
                  input.multiple = true
                  input.onchange = (e) => {
                    const files = Array.from((e.target as HTMLInputElement).files || [])
                    setFormData(prev => ({ ...prev, dolbyAtmosFiles: [...(prev.dolbyAtmosFiles || []), ...files] }))
                  }
                  input.click()
                }}
                className="w-full p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-purple-500 dark:hover:border-purple-400 transition-colors bg-gray-50 dark:bg-gray-800/30 hover:bg-gray-100 dark:hover:bg-gray-800/50"
              >
                <Disc className="w-8 h-8 mx-auto text-gray-400 dark:text-gray-500 mb-2" />
                <p className="text-gray-700 dark:text-gray-300 font-medium">
                  {t('Dolby Atmos 파일 추가', 'Add Dolby Atmos files')}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {t('ADM BWF 또는 .atmos 파일', 'ADM BWF or .atmos files')}
                </p>
              </button>
            </div>
            
            {/* Motion Art */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                {t('모션 아트', 'Motion Art')} 
                <span className="text-gray-500 ml-1">{t('(선택사항)', '(Optional)')}</span>
              </label>
              
              {formData.motionArtFile ? (
                <div className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <Star className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-gray-100">{formData.motionArtFile.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {(formData.motionArtFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, motionArtFile: undefined }))}
                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    const input = document.createElement('input')
                    input.type = 'file'
                    input.accept = 'video/mp4,video/quicktime'
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0]
                      if (file) setFormData(prev => ({ ...prev, motionArtFile: file }))
                    }
                    input.click()
                  }}
                  className="w-full p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-purple-500 dark:hover:border-purple-400 transition-colors bg-gray-50 dark:bg-gray-800/30 hover:bg-gray-100 dark:hover:bg-gray-800/50"
                >
                  <Star className="w-8 h-8 mx-auto text-gray-400 dark:text-gray-500 mb-2" />
                  <p className="text-gray-700 dark:text-gray-300 font-medium">
                    {t('모션 아트 추가', 'Add Motion Art')}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {t('MP4/MOV, 3-10초, 최대 100MB', 'MP4/MOV, 3-10 seconds, Max 100MB')}
                  </p>
                </button>
              )}
            </div>
            
            {/* Music Video */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                {t('뮤직비디오', 'Music Video')} 
                <span className="text-gray-500 ml-1">{t('(선택사항)', '(Optional)')}</span>
              </label>
              
              {formData.musicVideoFile ? (
                <div className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <ExternalLink className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-gray-100">{formData.musicVideoFile.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {(formData.musicVideoFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, musicVideoFile: undefined }))}
                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    const input = document.createElement('input')
                    input.type = 'file'
                    input.accept = 'video/mp4,video/quicktime'
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0]
                      if (file) setFormData(prev => ({ ...prev, musicVideoFile: file }))
                    }
                    input.click()
                  }}
                  className="w-full p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-purple-500 dark:hover:border-purple-400 transition-colors bg-gray-50 dark:bg-gray-800/30 hover:bg-gray-100 dark:hover:bg-gray-800/50"
                >
                  <ExternalLink className="w-8 h-8 mx-auto text-gray-400 dark:text-gray-500 mb-2" />
                  <p className="text-gray-700 dark:text-gray-300 font-medium">
                    {t('뮤직비디오 추가', 'Add Music Video')}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {t('MP4/MOV, H.264, 1920x1080 이상', 'MP4/MOV, H.264, 1920x1080+')}
                  </p>
                </button>
              )}
            </div>
          </div>
        )
        
      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('배포 설정', 'Distribution Settings')}
            </h2>
            
            {/* Distribution Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('배포 방식', 'Distribution Type')}
              </label>
              <RadioGroup
                name="distributionType"
                value={formData.distributionType}
                onChange={(value) => setFormData(prev => ({ ...prev, distributionType: value as any }))}
                options={[
                  { 
                    value: 'all', 
                    label: t('모든 스토어', 'All Stores'),
                    description: t('모든 가능한 음원 플랫폼에 배포', 'Distribute to all available platforms')
                  },
                  { 
                    value: 'selected', 
                    label: t('선택한 스토어', 'Selected Stores'),
                    description: t('특정 플랫폼만 선택하여 배포', 'Distribute to specific platforms only')
                  }
                ]}
              />
            </div>
            
            {/* Store Selection */}
            {formData.distributionType === 'selected' && (
              <div id="store-selection">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('스토어 선택', 'Select Stores')}
                </label>
                <MultiSelect
                  options={dspList.map(dsp => ({ value: dsp.id, label: dsp.name }))}
                  value={formData.selectedStores}
                  onChange={(stores) => setFormData(prev => ({ ...prev, selectedStores: stores }))}
                  placeholder={t('스토어를 선택하세요', 'Select stores')}
                />
              </div>
            )}
            
            {/* Territories */}
            <div id="territory-selection">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('배포 지역', 'Distribution Territories')} *
              </label>
              <RegionSelector
                selectedRegions={formData.territories}
                onChange={(territories) => setFormData(prev => ({ ...prev, territories }))}
              />
            </div>
            
            {/* Previously Released */}
            <div>
              <Toggle
                checked={formData.previouslyReleased}
                onChange={(checked) => setFormData(prev => ({ ...prev, previouslyReleased: checked }))}
                label={t('이전 발매 여부', 'Previously Released')}
                helpText={t('이 음원이 다른 플랫폼에서 이미 발매되었나요?', 'Has this content been released on other platforms?')}
              />
            </div>
          </div>
        )
        
      case 5:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('최종 검토', 'Final Review')}
            </h2>
            
            {/* Summary */}
            <div className="space-y-4">
              {/* Album Info Summary */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">{t('앨범 정보', 'Album Information')}</h3>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div>
                    <dt className="text-gray-600 dark:text-gray-400">{t('앨범명', 'Album Title')}:</dt>
                    <dd className="font-medium">{formData.albumTitle}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-600 dark:text-gray-400">{t('아티스트', 'Artist')}:</dt>
                    <dd className="font-medium">{formData.albumArtists.map(a => a.name).join(', ') || formData.albumArtist}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-600 dark:text-gray-400">{t('발매일', 'Release Date')}:</dt>
                    <dd className="font-medium">{formData.releaseDate}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-600 dark:text-gray-400">{t('장르', 'Genre')}:</dt>
                    <dd className="font-medium">{formData.primaryGenre}</dd>
                  </div>
                </dl>
              </div>
              
              {/* Tracks Summary */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">
                  {t('트랙 목록', 'Track List')} ({formData.tracks.length})
                </h3>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  {formData.tracks.map((track, index) => (
                    <li key={track.id}>
                      {track.title} - {track.artists.map(a => a.name).join(', ')}
                      {track.dolbyAtmos && (
                        <span className="ml-2 text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded">
                          Dolby Atmos
                        </span>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
              
              {/* Files Summary */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">{t('파일', 'Files')}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>{t('커버 아트', 'Cover Art')}: {formData.coverArt?.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>{t('오디오 파일', 'Audio Files')}: {formData.audioFiles.length}개</span>
                  </div>
                  {formData.dolbyAtmosFiles && formData.dolbyAtmosFiles.length > 0 && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>{t('Dolby Atmos 파일', 'Dolby Atmos Files')}: {formData.dolbyAtmosFiles.length}개</span>
                    </div>
                  )}
                  {formData.motionArtFile && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>{t('모션 아트', 'Motion Art')}: {formData.motionArtFile.name}</span>
                    </div>
                  )}
                  {formData.musicVideoFile && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>{t('뮤직비디오', 'Music Video')}: {formData.musicVideoFile.name}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* QC Warnings */}
              {showWarnings && validationResults && (
                <QCWarnings
                  warnings={validationResults.warnings}
                  errors={validationResults.errors}
                  onClose={() => setShowWarnings(false)}
                />
              )}
            </div>
            
            {/* Submit Button */}
            <div className="flex justify-center pt-4">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                    {t('제출 중...', 'Submitting...')}
                  </span>
                ) : (
                  t('릴리즈 제출', 'Submit Release')
                )}
              </button>
            </div>
          </div>
        )
        
      default:
        return null
    }
  }

  // Progress Steps
  const steps = [
    { number: 1, title: t('앨범 정보', 'Album Info'), icon: Disc },
    { number: 2, title: t('트랙 정보', 'Track Info'), icon: Music },
    { number: 3, title: t('파일 업로드', 'File Upload'), icon: Upload },
    { number: 4, title: t('배포 설정', 'Distribution'), icon: Globe },
    { number: 5, title: t('최종 검토', 'Review'), icon: CheckCircle }
  ]

  return (
    <SavedArtistsProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('릴리즈 제출', 'Release Submission')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('새로운 음원을 전 세계에 배포하세요', 'Distribute your new music worldwide')}
          </p>
        </div>
        
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isActive = currentStep === step.number
              const isCompleted = completedSteps.includes(step.number)
              const isClickable = step.number <= currentStep || completedSteps.includes(step.number - 1)
              
              return (
                <div key={step.number} className="flex-1 relative">
                  {index > 0 && (
                    <div
                      className={`absolute left-0 top-6 w-full h-0.5 -translate-x-1/2 ${
                        completedSteps.includes(step.number - 1)
                          ? 'bg-purple-600'
                          : 'bg-gray-300 dark:bg-gray-700'
                      }`}
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => handleStepClick(step.number)}
                    disabled={!isClickable}
                    className={`relative z-10 flex flex-col items-center ${
                      isClickable ? 'cursor-pointer' : 'cursor-not-allowed'
                    }`}
                  >
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                        isActive
                          ? 'bg-purple-600 text-white'
                          : isCompleted
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-6 h-6" />
                      ) : (
                        <Icon className="w-6 h-6" />
                      )}
                    </div>
                    <span
                      className={`mt-2 text-sm ${
                        isActive
                          ? 'text-purple-600 font-medium'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {step.title}
                    </span>
                  </button>
                </div>
              )
            })}
          </div>
        </div>
        
        {/* Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 md:p-8">
          {renderStepContent()}
          
          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={handleBack}
              disabled={currentStep === 1}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              {t('이전', 'Previous')}
            </button>
            
            {currentStep < 5 && (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                {t('다음', 'Next')}
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Artist Management Modal */}
      {showAlbumArtistModal && (
        <ArtistManagementModal
          isOpen={showAlbumArtistModal}
          onClose={() => setShowAlbumArtistModal(false)}
          artists={formData.albumArtists}
          onSave={(artists) => {
            setFormData(prev => ({ 
              ...prev, 
              albumArtists: artists,
              // Update albumArtist for backward compatibility
              albumArtist: artists.find(a => a.role === 'main')?.name || ''
            }))
            setShowAlbumArtistModal(false)
          }}
          albumLevel={true}
        />
      )}
      
      {/* Album Featuring Artist Management Modal */}
      {showAlbumFeaturingArtistModal && (
        <ArtistManagementModal
          isOpen={showAlbumFeaturingArtistModal}
          onClose={() => setShowAlbumFeaturingArtistModal(false)}
          artists={formData.albumFeaturingArtists || []}
          onSave={(artists) => {
            setFormData(prev => ({ 
              ...prev, 
              albumFeaturingArtists: artists
            }))
            setShowAlbumFeaturingArtistModal(false)
          }}
          albumLevel={false}
          isFeaturing={true}
        />
      )}
      
      {/* Track Artist Management Modal */}
      {showTrackArtistModal && (
        <ArtistManagementModal
          isOpen={!!showTrackArtistModal}
          onClose={() => setShowTrackArtistModal(null)}
          artists={formData.tracks.find(t => t.id === showTrackArtistModal)?.artists || []}
          onSave={(artists) => {
            setFormData(prev => ({
              ...prev,
              tracks: prev.tracks.map(t => 
                t.id === showTrackArtistModal 
                  ? { ...t, artists }
                  : t
              )
            }))
            setShowTrackArtistModal(null)
          }}
          albumLevel={false}
        />
      )}
      
      {/* Featuring Artist Management Modal */}
      {showFeaturingArtistModal && (
        <ArtistManagementModal
          isOpen={!!showFeaturingArtistModal}
          onClose={() => setShowFeaturingArtistModal(null)}
          artists={formData.tracks.find(t => t.id === showFeaturingArtistModal)?.featuringArtists || []}
          onSave={(artists) => {
            setFormData(prev => ({
              ...prev,
              tracks: prev.tracks.map(t => 
                t.id === showFeaturingArtistModal 
                  ? { ...t, featuringArtists: artists }
                  : t
              )
            }))
            setShowFeaturingArtistModal(null)
          }}
          albumLevel={false}
          isFeaturing={true}
        />
      )}
      
      {/* Contributor Management Modal */}
      {showContributorModal && (
        <ContributorManagementModal
          isOpen={!!showContributorModal}
          onClose={() => setShowContributorModal(null)}
          contributors={formData.tracks.find(t => t.id === showContributorModal)?.contributors || []}
          onSave={(contributors) => {
            setFormData(prev => ({
              ...prev,
              tracks: prev.tracks.map(t => 
                t.id === showContributorModal 
                  ? { ...t, contributors }
                  : t
              )
            }))
            setShowContributorModal(null)
          }}
          trackTitle={formData.tracks.find(t => t.id === showContributorModal)?.title}
        />
      )}
    </div>
    </SavedArtistsProvider>
  )
}

export default ImprovedReleaseSubmission