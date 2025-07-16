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
  ChevronUp, ChevronDown
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
import { genreList, subgenreList } from '@/constants/genres'
import { countries } from '@/constants/countries'
import { timezones, convertToUTC } from '@/constants/timezones'
import { generateUPC, generateEAN, validateUPC, validateEAN } from '@/utils/identifiers'
import { dspList } from '@/constants/dspList'

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
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </label>
          {helpText && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{helpText}</p>
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
interface Track {
  id: string
  title: string
  artist: string
  isrc?: string
  duration?: string
  genre?: string
  subgenre?: string
  language?: string
  lyrics?: string
  composer?: string
  lyricist?: string
  producer?: string
  explicit?: boolean
  remixVersion?: string
  titleLanguage?: 'Korean' | 'English' | 'Japanese' | 'Chinese' | 'Other'
  trackNumber?: number
  dolbyAtmos?: boolean
}

interface FormData {
  // Album Info
  albumTitle: string
  albumArtist: string
  releaseType: 'single' | 'album' | 'ep'
  primaryGenre: string
  primarySubgenre: string
  secondaryGenre?: string
  secondarySubgenre?: string
  language: string
  releaseDate: string
  timezone: string
  originalReleaseDate?: string
  upc?: string
  ean?: string
  catalogNumber?: string
  recordLabel: string
  copyrightHolder: string
  copyrightYear: string
  productionHolder: string
  productionYear: string
  albumVersion?: string
  
  // Tracks
  tracks: Track[]
  
  // Files
  coverArt?: File
  audioFiles: File[]
  
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
    albumArtist: '',
    releaseType: 'single',
    primaryGenre: '',
    primarySubgenre: '',
    language: '',
    releaseDate: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Seoul',
    recordLabel: user?.company || '',
    copyrightHolder: user?.company || '',
    copyrightYear: new Date().getFullYear().toString(),
    productionHolder: user?.company || '',
    productionYear: new Date().getFullYear().toString(),
    tracks: [],
    audioFiles: [],
    distributionType: 'all',
    selectedStores: [],
    excludedStores: [],
    territories: [],
    excludedTerritories: [],
    previouslyReleased: false
  })

  // Generate identifiers
  const handleGenerateUPC = () => {
    const upc = generateUPC()
    setFormData(prev => ({ ...prev, upc }))
    toast.success(t('UPC가 생성되었습니다', 'UPC generated successfully'))
  }

  const handleGenerateEAN = () => {
    const ean = generateEAN() 
    setFormData(prev => ({ ...prev, ean }))
    toast.success(t('EAN이 생성되었습니다', 'EAN generated successfully'))
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
    const newTrack: Track = {
      id: uuidv4(),
      title: '',
      artist: formData.albumArtist,
      trackNumber: formData.tracks.length + 1,
      titleLanguage: 'Korean',
      dolbyAtmos: false
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
    setFormData(prev => ({
      ...prev,
      tracks: prev.tracks.map(track =>
        track.id === trackId ? { ...track, ...updates } : track
      )
    }))
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

  // Validation
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1: // Album Info
        if (!formData.albumTitle || !formData.albumArtist) {
          toast.error(t('앨범 제목과 아티스트명을 입력해주세요', 'Please enter album title and artist name'))
          return false
        }
        if (!formData.primaryGenre || !formData.language) {
          toast.error(t('장르와 언어를 선택해주세요', 'Please select genre and language'))
          return false
        }
        if (!formData.releaseDate) {
          toast.error(t('발매일을 선택해주세요', 'Please select release date'))
          return false
        }
        return true
        
      case 2: // Tracks
        if (formData.tracks.length === 0) {
          toast.error(t('최소 1개 이상의 트랙을 추가해주세요', 'Please add at least one track'))
          return false
        }
        for (const track of formData.tracks) {
          if (!track.title || !track.artist) {
            toast.error(t('모든 트랙의 제목과 아티스트를 입력해주세요', 'Please enter title and artist for all tracks'))
            return false
          }
        }
        return true
        
      case 3: // Files
        if (!formData.coverArt) {
          toast.error(t('커버 아트를 업로드해주세요', 'Please upload cover art'))
          return false
        }
        if (formData.audioFiles.length !== formData.tracks.length) {
          toast.error(t('트랙 수와 오디오 파일 수가 일치해야 합니다', 'Number of tracks and audio files must match'))
          return false
        }
        return true
        
      case 4: // Distribution
        if (formData.distributionType === 'selected' && formData.selectedStores.length === 0) {
          toast.error(t('최소 1개 이상의 스토어를 선택해주세요', 'Please select at least one store'))
          return false
        }
        if (formData.territories.length === 0) {
          toast.error(t('최소 1개 이상의 지역을 선택해주세요', 'Please select at least one territory'))
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

  // Submit
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true)
      
      // Run QC validation
      const results = await validateSubmission({
        albumTitle: formData.albumTitle,
        albumArtist: formData.albumArtist,
        tracks: formData.tracks,
        coverArt: formData.coverArt,
        audioFiles: formData.audioFiles,
        upc: formData.upc,
        ean: formData.ean,
        releaseDate: formData.releaseDate,
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
      
      // Add form data
      submissionData.append('releaseData', JSON.stringify({
        albumTitle: formData.albumTitle,
        albumArtist: formData.albumArtist,
        releaseType: formData.releaseType,
        primaryGenre: formData.primaryGenre,
        primarySubgenre: formData.primarySubgenre,
        secondaryGenre: formData.secondaryGenre,
        secondarySubgenre: formData.secondarySubgenre,
        language: formData.language,
        releaseDate: formData.releaseDate,
        originalReleaseDate: formData.originalReleaseDate,
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
        draggable
        onDragStart={(e) => handleDragStart(e, index)}
        onDragEnd={handleDragEnd}
        onDragOver={(e) => handleDragOver(e, index)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, index)}
        className={`
          p-4 border rounded-lg transition-all cursor-move
          ${isDragOver ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 scale-105' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'}
          ${draggedIndex === index ? 'opacity-50' : ''}
        `}
      >
        <div className="flex items-start gap-4">
          {/* Drag Handle */}
          <div className="flex flex-col items-center gap-1 mt-2">
            <GripVertical className="w-5 h-5 text-gray-400 cursor-move" />
            <span className="text-sm font-medium text-gray-500">#{track.trackNumber}</span>
          </div>
          
          {/* Track Content */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Track Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('트랙 제목', 'Track Title')} *
              </label>
              <input
                type="text"
                value={track.title}
                onChange={(e) => updateTrack(track.id, { title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                placeholder={t('트랙 제목 입력', 'Enter track title')}
              />
            </div>
            
            {/* Track Artist */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('아티스트', 'Artist')} *
              </label>
              <input
                type="text"
                value={track.artist}
                onChange={(e) => updateTrack(track.id, { artist: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                placeholder={t('아티스트명 입력', 'Enter artist name')}
              />
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
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('앨범 제목', 'Album Title')} *
                </label>
                <input
                  type="text"
                  value={formData.albumTitle}
                  onChange={(e) => setFormData(prev => ({ ...prev, albumTitle: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                  placeholder={t('앨범 제목을 입력하세요', 'Enter album title')}
                />
              </div>
              
              {/* Album Artist */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('앨범 아티스트', 'Album Artist')} *
                </label>
                <input
                  type="text"
                  value={formData.albumArtist}
                  onChange={(e) => setFormData(prev => ({ ...prev, albumArtist: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                  placeholder={t('아티스트명을 입력하세요', 'Enter artist name')}
                />
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
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('주 장르', 'Primary Genre')} *
                </label>
                <select
                  value={formData.primaryGenre}
                  onChange={(e) => setFormData(prev => ({ ...prev, primaryGenre: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">{t('장르 선택', 'Select genre')}</option>
                  {genreList.map(genre => (
                    <option key={genre.value} value={genre.value}>{genre.label}</option>
                  ))}
                </select>
              </div>
              
              {/* Language */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('언어', 'Language')} *
                </label>
                <select
                  value={formData.language}
                  onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">{t('언어 선택', 'Select language')}</option>
                  <option value="ko">{t('한국어', 'Korean')}</option>
                  <option value="en">{t('영어', 'English')}</option>
                  <option value="ja">{t('일본어', 'Japanese')}</option>
                  <option value="zh">{t('중국어', 'Chinese')}</option>
                  <option value="instrumental">{t('인스트루멘탈', 'Instrumental')}</option>
                  <option value="other">{t('기타', 'Other')}</option>
                </select>
              </div>
              
              {/* Release Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('발매일', 'Release Date')} *
                </label>
                <DatePicker
                  value={formData.releaseDate}
                  onChange={(date) => setFormData(prev => ({ ...prev, releaseDate: date }))}
                  minDate={new Date().toISOString().split('T')[0]}
                />
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
              
              {/* Copyright Info */}
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('저작권자', 'Copyright Holder')} *
                  </label>
                  <input
                    type="text"
                    value={formData.copyrightHolder}
                    onChange={(e) => setFormData(prev => ({ ...prev, copyrightHolder: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('저작권 연도', 'Copyright Year')} *
                  </label>
                  <input
                    type="text"
                    value={formData.copyrightYear}
                    onChange={(e) => setFormData(prev => ({ ...prev, copyrightYear: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
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
                type="button"
                onClick={addTrack}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                <Plus className="w-4 h-4" />
                {t('트랙 추가', 'Add Track')}
              </button>
            </div>
            
            <div className="space-y-4">
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
            
            {/* Cover Art */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('커버 아트', 'Cover Art')} *
              </label>
              {formData.coverArt ? (
                <div className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <Image className="w-8 h-8 text-gray-600 dark:text-gray-400" />
                  <div className="flex-1">
                    <p className="font-medium">{formData.coverArt.name}</p>
                    <p className="text-sm text-gray-500">
                      {(formData.coverArt.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, coverArt: undefined }))}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => coverArtInputRef.current?.click()}
                  className="w-full p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-purple-500 transition-colors"
                >
                  <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    {t('클릭하여 이미지 선택', 'Click to select image')}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    {t('최소 3000x3000px, JPG/PNG', 'Min 3000x3000px, JPG/PNG')}
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
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('오디오 파일', 'Audio Files')} * ({formData.audioFiles.length}/{formData.tracks.length})
              </label>
              
              {formData.audioFiles.length > 0 && (
                <div className="space-y-2 mb-4">
                  {formData.audioFiles.map((file, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
                      <Music className="w-8 h-8 text-gray-600 dark:text-gray-400" />
                      <div className="flex-1">
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-gray-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAudioFile(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-purple-500 transition-colors"
              >
                <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-600 dark:text-gray-400">
                  {t('오디오 파일 추가', 'Add audio files')}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
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
              <div>
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
            <div>
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
                    <dd className="font-medium">{formData.albumArtist}</dd>
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
                      {track.title} - {track.artist}
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
    </div>
  )
}

export default ImprovedReleaseSubmission