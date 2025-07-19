import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguageStore } from '@/store/language.store'
import { 
  Upload, Music, Image, CheckCircle, X, Plus, Trash2, 
  Globe, Users, Disc, 
  ChevronRight, ChevronLeft, Info,
  GripVertical,
  HelpCircle, AlertTriangle, Star,
  ExternalLink
} from 'lucide-react'
import toast from 'react-hot-toast'
import { submissionService } from '@/services/submission.service'
import useSafeStore from '@/hooks/useSafeStore'
import { validateSubmission, type QCValidationResults } from '@/utils/fugaQCValidation'
import QCWarnings from '@/components/submission/QCWarnings'
import DatePicker from '@/components/DatePicker'
import { v4 as uuidv4 } from 'uuid'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
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
            className="mt-0.5 w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
          />
          <div className="flex-1">
            <div className="font-medium text-gray-900 dark:text-white">{option.label}</div>
            {option.description && (
              <div className="text-sm text-gray-500 dark:text-gray-400">{option.description}</div>
            )}
          </div>
        </label>
      ))}
    </div>
  )
}

// Tooltip Component
const Tooltip: React.FC<{ content: string; children: React.ReactNode }> = ({ content, children }) => {
  const [show, setShow] = useState(false)
  
  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
      >
        {children}
      </div>
      {show && (
        <div className="absolute z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg -top-2 left-full ml-2 w-64">
          {content}
          <div className="absolute w-2 h-2 bg-gray-900 transform rotate-45 -left-1 top-3" />
        </div>
      )}
    </div>
  )
}

// Translation Manager Component
const TranslationManager: React.FC<{
  translations: { id: string; language: string; value: string }[]
  onChange: (translations: { id: string; language: string; value: string }[]) => void
  placeholder: string
  label: string
}> = ({ translations, onChange, placeholder, label }) => {
  const language = useSafeStore(useLanguageStore, state => state.language) || 'ko'
  const t = (ko: string, en: string) => language === 'ko' ? ko : en

  const addTranslation = () => {
    onChange([
      ...translations,
      { id: uuidv4(), language: '', value: '' }
    ])
  }

  const updateTranslation = (id: string, field: 'language' | 'value', value: string) => {
    onChange(
      translations.map(trans =>
        trans.id === id ? { ...trans, [field]: value } : trans
      )
    )
  }

  const removeTranslation = (id: string) => {
    onChange(translations.filter(trans => trans.id !== id))
  }

  const availableLanguages = [
    { code: 'en', name: 'English' },
    { code: 'ja', name: '日本語' },
    { code: 'zh', name: '中文' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'it', name: 'Italiano' },
    { code: 'pt', name: 'Português' },
    { code: 'ru', name: 'Русский' },
    { code: 'ar', name: 'العربية' }
  ]

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
        <button
          type="button"
          onClick={addTranslation}
          className="text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 flex items-center gap-1"
        >
          <Plus className="w-4 h-4" />
          {t('번역 추가', 'Add Translation')}
        </button>
      </div>
      
      {translations.map((translation) => (
        <div key={translation.id} className="flex gap-2">
          <select
            value={translation.language}
            onChange={(e) => updateTranslation(translation.id, 'language', e.target.value)}
            className="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="">{t('언어 선택', 'Select Language')}</option>
            {availableLanguages.map(lang => (
              <option key={lang.code} value={lang.code}>{lang.name}</option>
            ))}
          </select>
          <input
            type="text"
            value={translation.value}
            onChange={(e) => updateTranslation(translation.id, 'value', e.target.value)}
            placeholder={placeholder}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <button
            type="button"
            onClick={() => removeTranslation(translation.id)}
            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      ))}
    </div>
  )
}

// Main Component
export default function ImprovedReleaseSubmission() {
  const navigate = useNavigate()
  const language = useSafeStore(useLanguageStore, state => state.language) || 'ko'
  const t = (ko: string, en: string) => language === 'ko' ? ko : en

  // Form States
  const [currentStep, setCurrentStep] = useState(1)
  const [validationResults, setValidationResults] = useState<QCValidationResults | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    // Artist Information
    artistName: '',
    displayArtistName: '',
    artistTranslations: [] as { id: string; language: string; value: string }[],
    artistType: 'SOLO',
    members: [] as any[],
    labelName: '',
    artistCountry: 'KR',
    artistSpotifyId: '',
    artistAppleMusicId: '',
    artistYoutubeChannelId: '',
    
    // Album Information
    albumTitle: '',
    albumTitleEn: '',
    albumTranslations: [] as { id: string; language: string; value: string }[],
    albumType: 'SINGLE',
    releaseVersion: '',
    upc: '',
    ean: '',
    catalogNumber: '',
    
    // Release Dates
    originalReleaseDate: '',
    consumerReleaseDate: '',
    releaseTime: '00:00',
    selectedTimezone: 'Asia/Seoul',
    
    // Product Level
    genre: [] as string[],
    subgenre: [] as string[],
    mood: [] as string[],
    copyrightHolder: '',
    copyrightYear: new Date().getFullYear().toString(),
    productionHolder: '',
    productionYear: new Date().getFullYear().toString(),
    parentalAdvisory: 'NONE',
    
    // Tracks
    tracks: [] as any[],
    focusTrackId: '',
    
    // Distribution
    territories: [] as string[],
    excludedTerritories: [] as string[],
    selectedDSPs: [] as string[],
    priceType: 'PAID',
    
    // Marketing
    marketingGenre: [] as string[],
    marketingSubgenre: [] as string[],
    targetDemographic: {
      ageGroups: [] as string[],
      genders: [] as string[],
      regions: [] as string[]
    },
    socialMovements: [] as string[],
    similarArtists: [] as string[],
    marketingAngle: '',
    
    // Files
    coverArt: null as File | null,
    audioFiles: [] as File[],
    lyrics: [] as any[],
    
    // Additional
    notes: '',
    qcReport: null as any
  })

  // Steps Configuration
  const steps = [
    {
      id: 1,
      title: t('아티스트 정보', 'Artist Information'),
      icon: <Users className="w-5 h-5" />,
      description: t('아티스트 기본 정보 및 프로필 설정', 'Basic artist information and profile setup')
    },
    {
      id: 2,
      title: t('앨범 정보', 'Album Information'),
      icon: <Disc className="w-5 h-5" />,
      description: t('앨범 제목, 타입 및 기본 정보', 'Album title, type and basic information')
    },
    {
      id: 3,
      title: t('트랙 정보', 'Track Information'),
      icon: <Music className="w-5 h-5" />,
      description: t('트랙 목록 및 상세 정보', 'Track list and detailed information')
    },
    {
      id: 4,
      title: t('파일 업로드', 'File Upload'),
      icon: <Upload className="w-5 h-5" />,
      description: t('음원 파일 및 커버 아트 업로드', 'Upload audio files and cover art')
    },
    {
      id: 5,
      title: t('배포 설정', 'Distribution Settings'),
      icon: <Globe className="w-5 h-5" />,
      description: t('배포 지역 및 플랫폼 설정', 'Configure distribution regions and platforms')
    },
    {
      id: 6,
      title: t('검토 및 제출', 'Review & Submit'),
      icon: <CheckCircle className="w-5 h-5" />,
      description: t('최종 검토 및 제출', 'Final review and submission')
    }
  ]

  // Validation
  useEffect(() => {
    const results = validateSubmission(formData)
    setValidationResults(results)
  }, [formData])

  // Step Navigation
  const canProceed = () => {
    if (!validationResults) return true
    
    const stepFields: Record<number, string[]> = {
      1: ['artistName', 'displayArtistName', 'labelName'],
      2: ['albumTitle', 'albumType', 'releaseDate'],
      3: ['tracks'],
      4: ['coverArt', 'audioFiles'],
      5: ['territories', 'selectedDSPs'],
      6: []
    }

    const currentStepFields = stepFields[currentStep] || []
    return !currentStepFields.some(field => 
      validationResults.errors.some((error: any) => error.field === field && error.severity === 'error')
    )
  }

  const nextStep = () => {
    if (canProceed() && currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
      window.scrollTo(0, 0)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      window.scrollTo(0, 0)
    }
  }

  // Form Submit
  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const submissionData = {
        artist: {
          name: formData.artistName,
          displayName: formData.displayArtistName,
          type: formData.artistType,
          labelName: formData.labelName,
          country: formData.artistCountry,
          translations: formData.artistTranslations
        },
        album: {
          title: formData.albumTitle,
          titleEn: formData.albumTitleEn,
          type: formData.albumType,
          translations: formData.albumTranslations,
          upc: formData.upc,
          catalogNumber: formData.catalogNumber
        },
        tracks: formData.tracks,
        release: {
          originalReleaseDate: formData.originalReleaseDate,
          consumerReleaseDate: formData.consumerReleaseDate,
          releaseTime: formData.releaseTime,
          timezone: formData.selectedTimezone,
          genre: formData.genre,
          subgenre: formData.subgenre,
          copyrightHolder: formData.copyrightHolder,
          copyrightYear: formData.copyrightYear,
          productionHolder: formData.productionHolder,
          productionYear: formData.productionYear,
          parentalAdvisory: formData.parentalAdvisory,
          territories: formData.territories,
          selectedDSPs: formData.selectedDSPs,
          priceType: formData.priceType
        },
        files: {
          coverImage: formData.coverArt || undefined,
          audioFiles: formData.audioFiles.map((file: File, index: number) => ({
            trackId: formData.tracks[index]?.id || index.toString(),
            file: file,
            fileName: file.name,
            fileSize: file.size
          }))
        }
      }
      const response = await submissionService.createSubmission(submissionData)
      toast.success(t('제출이 완료되었습니다!', 'Submission completed!'))
      navigate('/submission-success', { state: { submissionId: response.id } })
    } catch (error) {
      console.error('Submission error:', error)
      toast.error(t('제출 중 오류가 발생했습니다', 'Error during submission'))
    } finally {
      setIsSubmitting(false)
    }
  }

  // Render Step Content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <ArtistInfoStep formData={formData} setFormData={setFormData} />
      case 2:
        return <AlbumInfoStep formData={formData} setFormData={setFormData} />
      case 3:
        return <TrackInfoStep formData={formData} setFormData={setFormData} />
      case 4:
        return <FileUploadStep formData={formData} setFormData={setFormData} />
      case 5:
        return <DistributionStep formData={formData} setFormData={setFormData} />
      case 6:
        return <ReviewStep formData={formData} validationResults={validationResults} />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('릴리즈 제출', 'Release Submission')}
            </h1>
            <button
              onClick={() => navigate('/dashboard')}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {t(`${currentStep}단계 / ${steps.length}단계`, `Step ${currentStep} of ${steps.length}`)}
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {Math.round((currentStep / steps.length) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / steps.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Step Indicators */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between overflow-x-auto">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center ${index < steps.length - 1 ? 'flex-1' : ''}`}
              >
                <div className="flex items-center">
                  <div
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center
                      ${currentStep >= step.id
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                      }
                    `}
                  >
                    {currentStep > step.id ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      step.icon
                    )}
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm font-medium ${
                      currentStep >= step.id 
                        ? 'text-gray-900 dark:text-white' 
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {step.title}
                    </p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-4 ${
                    currentStep > step.id 
                      ? 'bg-purple-600' 
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* QC Warnings */}
      {validationResults && validationResults.errors.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <QCWarnings results={validationResults.errors} />
        </div>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <div className="p-6">
            {renderStepContent()}
          </div>

          {/* Navigation */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 rounded-b-lg flex justify-between items-center">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors
                ${currentStep === 1
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-500 border border-gray-300 dark:border-gray-600'
                }
              `}
            >
              <ChevronLeft className="w-5 h-5" />
              {t('이전', 'Previous')}
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (confirm(t('저장하고 나중에 계속하시겠습니까?', 'Save and continue later?'))) {
                    // Save draft logic
                    navigate('/dashboard')
                  }
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                {t('임시 저장', 'Save Draft')}
              </button>

              {currentStep < steps.length ? (
                <button
                  onClick={nextStep}
                  disabled={!canProceed()}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors
                    ${canProceed()
                      ? 'bg-purple-600 text-white hover:bg-purple-700'
                      : 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
                    }
                  `}
                >
                  {t('다음', 'Next')}
                  <ChevronRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !canProceed()}
                  className={`
                    flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors
                    ${canProceed() && !isSubmitting
                      ? 'bg-purple-600 text-white hover:bg-purple-700'
                      : 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
                    }
                  `}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      {t('제출 중...', 'Submitting...')}
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      {t('제출', 'Submit')}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Step 1: Artist Information
function ArtistInfoStep({ formData, setFormData }: any) {
  const language = useSafeStore(useLanguageStore, state => state.language) || 'ko'
  const t = (ko: string, en: string) => language === 'ko' ? ko : en

  const artistTypes = [
    { value: 'SOLO', label: t('솔로', 'Solo'), description: t('개인 아티스트', 'Individual artist') },
    { value: 'GROUP', label: t('그룹', 'Group'), description: t('2인 이상의 그룹', 'Group of 2 or more') },
    { value: 'BAND', label: t('밴드', 'Band'), description: t('악기 연주 밴드', 'Instrumental band') },
    { value: 'ORCHESTRA', label: t('오케스트라', 'Orchestra'), description: t('관현악단', 'Orchestra ensemble') }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('아티스트 기본 정보', 'Basic Artist Information')}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Artist Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('아티스트명', 'Artist Name')}
              <span className="text-red-500 ml-1">*</span>
              <Tooltip content={t('실제 활동명을 입력하세요', 'Enter the actual performing name')}>
                <HelpCircle className="inline w-4 h-4 ml-1 text-gray-400" />
              </Tooltip>
            </label>
            <input
              type="text"
              value={formData.artistName}
              onChange={(e) => setFormData({ ...formData, artistName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder={t('예: BTS, IU', 'e.g., BTS, IU')}
            />
          </div>

          {/* Display Artist Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('디스플레이 아티스트명', 'Display Artist Name')}
              <span className="text-red-500 ml-1">*</span>
              <Tooltip content={t('음원 사이트에 표시될 이름 (feat. 아티스트 포함)', 'Name to be displayed on music platforms (including feat. artists)')}>
                <HelpCircle className="inline w-4 h-4 ml-1 text-gray-400" />
              </Tooltip>
            </label>
            <input
              type="text"
              value={formData.displayArtistName}
              onChange={(e) => setFormData({ ...formData, displayArtistName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder={t('예: BTS (feat. Halsey)', 'e.g., BTS (feat. Halsey)')}
            />
          </div>
        </div>

        {/* Artist Translations */}
        <div className="mt-6">
          <TranslationManager
            translations={formData.artistTranslations}
            onChange={(translations) => setFormData({ ...formData, artistTranslations: translations })}
            placeholder={t('번역된 아티스트명', 'Translated artist name')}
            label={t('아티스트명 번역', 'Artist Name Translations')}
          />
        </div>

        {/* Artist Type */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            {t('아티스트 유형', 'Artist Type')}
            <span className="text-red-500 ml-1">*</span>
          </label>
          <RadioGroup
            options={artistTypes}
            value={formData.artistType}
            onChange={(value) => setFormData({ ...formData, artistType: value })}
            name="artistType"
          />
        </div>

        {/* Label Name */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('레이블명', 'Label Name')}
            <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="text"
            value={formData.labelName}
            onChange={(e) => setFormData({ ...formData, labelName: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder={t('예: HYBE Labels, YG Entertainment', 'e.g., HYBE Labels, YG Entertainment')}
          />
        </div>

        {/* Artist Country */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('아티스트 국가', 'Artist Country')}
            <Tooltip content={t('아티스트의 주요 활동 국가', 'Main country of artist activity')}>
              <HelpCircle className="inline w-4 h-4 ml-1 text-gray-400" />
            </Tooltip>
          </label>
          <select
            value={formData.artistCountry}
            onChange={(e) => setFormData({ ...formData, artistCountry: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            {countries.map(country => (
              <option key={country.code} value={country.code}>
                {country.name} ({country.code})
              </option>
            ))}
          </select>
        </div>

        {/* Artist Profile URLs */}
        <div className="mt-6">
          <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">
            {t('아티스트 프로필 URL', 'Artist Profile URLs')}
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <span className="flex items-center gap-2">
                  <img src="/spotify-icon.svg" alt="Spotify" className="w-4 h-4" />
                  Spotify Artist ID
                </span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.artistSpotifyId}
                  onChange={(e) => setFormData({ ...formData, artistSpotifyId: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="예: 3Nrfpe0tUJi4K4DXYWgMUX"
                />
                <button
                  type="button"
                  className="px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  <ExternalLink className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <span className="flex items-center gap-2">
                  <img src="/apple-music-icon.svg" alt="Apple Music" className="w-4 h-4" />
                  Apple Music ID
                </span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.artistAppleMusicId}
                  onChange={(e) => setFormData({ ...formData, artistAppleMusicId: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="예: 883131348"
                />
                <button
                  type="button"
                  className="px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  <ExternalLink className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <span className="flex items-center gap-2">
                  <img src="/youtube-icon.svg" alt="YouTube" className="w-4 h-4" />
                  YouTube Channel ID
                </span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.artistYoutubeChannelId}
                  onChange={(e) => setFormData({ ...formData, artistYoutubeChannelId: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="예: UC3IZKseVpdzPSBaWxBxundA"
                />
                <button
                  type="button"
                  className="px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  <ExternalLink className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Step 2: Album Information  
function AlbumInfoStep({ formData, setFormData }: any) {
  const language = useSafeStore(useLanguageStore, state => state.language) || 'ko'
  const t = (ko: string, en: string) => language === 'ko' ? ko : en

  const albumTypes = [
    { 
      value: 'SINGLE', 
      label: t('싱글', 'Single'), 
      description: t('1~3곡이 수록된 음반', 'Album with 1-3 tracks') 
    },
    { 
      value: 'EP', 
      label: t('EP', 'EP'), 
      description: t('4~6곡이 수록된 음반', 'Album with 4-6 tracks') 
    },
    { 
      value: 'ALBUM', 
      label: t('정규 앨범', 'Full Album'), 
      description: t('7곡 이상이 수록된 음반', 'Album with 7 or more tracks') 
    },
    { 
      value: 'COMPILATION', 
      label: t('컴필레이션', 'Compilation'), 
      description: t('여러 아티스트의 곡이 수록된 음반', 'Album with tracks from various artists') 
    }
  ]

  const parentalAdvisoryOptions = [
    { value: 'NONE', label: t('없음', 'None'), description: t('연령 제한 없음', 'No age restriction') },
    { value: 'EXPLICIT', label: t('명시적 콘텐츠', 'Explicit'), description: t('19세 이상 청취 권장', 'Recommended for 19+') },
    { value: 'CLEAN', label: t('클린 버전', 'Clean'), description: t('명시적 콘텐츠 편집됨', 'Explicit content edited') }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('앨범 기본 정보', 'Basic Album Information')}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Album Title (Korean) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('앨범 제목 (한국어)', 'Album Title (Korean)')}
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="text"
              value={formData.albumTitle}
              onChange={(e) => setFormData({ ...formData, albumTitle: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder={t('예: 꽃갈피 둘', 'e.g., Flower Bookmark 2')}
            />
          </div>

          {/* Album Title (English) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('앨범 제목 (영어)', 'Album Title (English)')}
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="text"
              value={formData.albumTitleEn}
              onChange={(e) => setFormData({ ...formData, albumTitleEn: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder={t('예: Flower Bookmark 2', 'e.g., Flower Bookmark 2')}
            />
          </div>
        </div>

        {/* Album Translations */}
        <div className="mt-6">
          <TranslationManager
            translations={formData.albumTranslations}
            onChange={(translations) => setFormData({ ...formData, albumTranslations: translations })}
            placeholder={t('번역된 앨범 제목', 'Translated album title')}
            label={t('앨범 제목 번역', 'Album Title Translations')}
          />
        </div>

        {/* Album Type */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            {t('앨범 유형', 'Album Type')}
            <span className="text-red-500 ml-1">*</span>
          </label>
          <RadioGroup
            options={albumTypes}
            value={formData.albumType}
            onChange={(value) => setFormData({ ...formData, albumType: value })}
            name="albumType"
          />
        </div>

        {/* Release Dates */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Original Release Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('오리지널 발매일', 'Original Release Date')}
              <span className="text-red-500 ml-1">*</span>
              <Tooltip content={t('음원이 처음 발매된 날짜 (재발매인 경우)', 'Date when the music was first released (for re-releases)')}>
                <HelpCircle className="inline w-4 h-4 ml-1 text-gray-400" />
              </Tooltip>
            </label>
            <DatePicker
              value={formData.originalReleaseDate}
              onChange={(date) => setFormData({ ...formData, originalReleaseDate: date })}
              minDate="1900-01-01"
              maxDate={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Consumer Release Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('컨수머 발매일', 'Consumer Release Date')}
              <span className="text-red-500 ml-1">*</span>
              <Tooltip content={t('실제 음원 사이트에 공개될 날짜', 'Date when music will be available on streaming platforms')}>
                <HelpCircle className="inline w-4 h-4 ml-1 text-gray-400" />
              </Tooltip>
            </label>
            <DatePicker
              value={formData.consumerReleaseDate}
              onChange={(date) => setFormData({ ...formData, consumerReleaseDate: date })}
              minDate={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>

        {/* Release Time & Timezone */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('발매 시간', 'Release Time')}
              <Tooltip content={t('음원이 공개될 정확한 시간', 'Exact time when music will be released')}>
                <HelpCircle className="inline w-4 h-4 ml-1 text-gray-400" />
              </Tooltip>
            </label>
            <input
              type="time"
              value={formData.releaseTime}
              onChange={(e) => setFormData({ ...formData, releaseTime: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('시간대', 'Timezone')}
            </label>
            <select
              value={formData.selectedTimezone}
              onChange={(e) => setFormData({ ...formData, selectedTimezone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {timezones.map(tz => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </select>
            {formData.consumerReleaseDate && formData.releaseTime && (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                UTC: {convertToUTC(formData.consumerReleaseDate, formData.releaseTime, formData.selectedTimezone).toISOString()}
              </p>
            )}
          </div>
        </div>

        {/* Product Level Information */}
        <div className="mt-8">
          <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">
            {t('프로덕트 레벨 정보', 'Product Level Information')}
            <Tooltip content={t('앨범 전체에 적용되는 정보', 'Information applied to the entire album')}>
              <HelpCircle className="inline w-4 h-4 ml-1 text-gray-400" />
            </Tooltip>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Genre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('장르', 'Genre')}
                <span className="text-red-500 ml-1">*</span>
              </label>
              <MultiSelect
                options={genreList}
                value={formData.genre}
                onChange={(genres) => setFormData({ ...formData, genre: genres })}
                placeholder={t('장르 선택', 'Select genres')}
                max={3}
              />
            </div>

            {/* Subgenre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('서브장르', 'Subgenre')}
              </label>
              <MultiSelect
                options={subgenreList}
                value={formData.subgenre}
                onChange={(subgenres: string[]) => setFormData({ ...formData, subgenre: subgenres })}
                placeholder={t('서브장르 선택', 'Select subgenres')}
                max={3}
              />
            </div>

            {/* Copyright Holder */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('저작권자 (℗)', 'Copyright Holder (℗)')}
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="text"
                value={formData.copyrightHolder}
                onChange={(e) => setFormData({ ...formData, copyrightHolder: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder={t('예: YG Entertainment', 'e.g., YG Entertainment')}
              />
            </div>

            {/* Copyright Year */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('저작권 연도', 'Copyright Year')}
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="text"
                value={formData.copyrightYear}
                onChange={(e) => setFormData({ ...formData, copyrightYear: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                maxLength={4}
                placeholder={new Date().getFullYear().toString()}
              />
            </div>

            {/* Production Holder */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('제작자 (©)', 'Production Holder (©)')}
              </label>
              <input
                type="text"
                value={formData.productionHolder}
                onChange={(e) => setFormData({ ...formData, productionHolder: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder={t('예: YG Entertainment', 'e.g., YG Entertainment')}
              />
            </div>

            {/* Production Year */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('제작 연도', 'Production Year')}
              </label>
              <input
                type="text"
                value={formData.productionYear}
                onChange={(e) => setFormData({ ...formData, productionYear: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                maxLength={4}
                placeholder={new Date().getFullYear().toString()}
              />
            </div>
          </div>

          {/* Parental Advisory */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              {t('연령 제한', 'Parental Advisory')}
            </label>
            <RadioGroup
              options={parentalAdvisoryOptions}
              value={formData.parentalAdvisory}
              onChange={(value) => setFormData({ ...formData, parentalAdvisory: value })}
              name="parentalAdvisory"
            />
          </div>

          {/* Identifiers */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* UPC */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('UPC', 'UPC')}
                <Tooltip content={t('12자리 범용 상품 코드', '12-digit Universal Product Code')}>
                  <HelpCircle className="inline w-4 h-4 ml-1 text-gray-400" />
                </Tooltip>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.upc}
                  onChange={(e) => setFormData({ ...formData, upc: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="123456789012"
                  maxLength={12}
                />
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, upc: generateUPC() })}
                  className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                  {t('생성', 'Generate')}
                </button>
              </div>
              {formData.upc && !validateUPC(formData.upc) && (
                <p className="mt-1 text-sm text-red-500">{t('유효하지 않은 UPC', 'Invalid UPC')}</p>
              )}
            </div>

            {/* EAN */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('EAN', 'EAN')}
                <Tooltip content={t('13자리 유럽 상품 번호', '13-digit European Article Number')}>
                  <HelpCircle className="inline w-4 h-4 ml-1 text-gray-400" />
                </Tooltip>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.ean}
                  onChange={(e) => setFormData({ ...formData, ean: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="1234567890123"
                  maxLength={13}
                />
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, ean: generateEAN() })}
                  className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                  {t('생성', 'Generate')}
                </button>
              </div>
              {formData.ean && !validateEAN(formData.ean) && (
                <p className="mt-1 text-sm text-red-500">{t('유효하지 않은 EAN', 'Invalid EAN')}</p>
              )}
            </div>

            {/* Catalog Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('카탈로그 번호', 'Catalog Number')}
              </label>
              <input
                type="text"
                value={formData.catalogNumber}
                onChange={(e) => setFormData({ ...formData, catalogNumber: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder={t('예: YGE-001', 'e.g., YGE-001')}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Step 3: Track Information
function TrackInfoStep({ formData, setFormData }: any) {
  const language = useSafeStore(useLanguageStore, state => state.language) || 'ko'
  const t = (ko: string, en: string) => language === 'ko' ? ko : en

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      const oldIndex = formData.tracks.findIndex((t: any) => t.id === active.id)
      const newIndex = formData.tracks.findIndex((t: any) => t.id === over?.id)
      
      const newTracks = arrayMove(formData.tracks, oldIndex, newIndex).map((track: any, index: number) => ({
        ...track,
        trackNumber: index + 1
      }))
      
      setFormData({ ...formData, tracks: newTracks })
    }
  }

  const addTrack = () => {
    const newTrack = {
      id: uuidv4(),
      trackNumber: formData.tracks.length + 1,
      title: '',
      titleEn: '',
      translations: [],
      isrc: '',
      duration: '',
      artists: [],
      contributors: [],
      genre: formData.genre[0] || '',
      subgenre: formData.subgenre[0] || '',
      parentalAdvisory: 'NONE',
      isInstrumental: false,
      languageCode: 'ko',
      lyrics: '',
      audioFile: null
    }
    
    setFormData({ ...formData, tracks: [...formData.tracks, newTrack] })
  }

  const updateTrack = (trackId: string, updates: any) => {
    setFormData({
      ...formData,
      tracks: formData.tracks.map((track: any) =>
        track.id === trackId ? { ...track, ...updates } : track
      )
    })
  }

  const removeTrack = (trackId: string) => {
    if (formData.tracks.length > 1) {
      const newTracks = formData.tracks
        .filter((t: any) => t.id !== trackId)
        .map((track: any, index: number) => ({
          ...track,
          trackNumber: index + 1
        }))
      
      setFormData({ ...formData, tracks: newTracks })
    }
  }

  const setFocusTrack = (trackId: string) => {
    setFormData({ ...formData, focusTrackId: trackId })
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('트랙 목록', 'Track List')}
          </h2>
          <button
            type="button"
            onClick={addTrack}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            {t('트랙 추가', 'Add Track')}
          </button>
        </div>

        {/* Track Count Info */}
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="text-sm text-blue-700 dark:text-blue-300">
              <p className="font-medium mb-1">{t('앨범 타입별 트랙 수', 'Track Count by Album Type')}</p>
              <ul className="list-disc list-inside space-y-1">
                <li>{t('싱글: 1-3곡', 'Single: 1-3 tracks')}</li>
                <li>{t('EP: 4-6곡', 'EP: 4-6 tracks')}</li>
                <li>{t('정규 앨범: 7곡 이상', 'Full Album: 7+ tracks')}</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Track List */}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={formData.tracks.map((t: any) => t.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-4">
              {formData.tracks.map((track: any) => (
                <SortableTrackItem
                  key={track.id}
                  track={track}
                  updateTrack={updateTrack}
                  removeTrack={removeTrack}
                  setFocusTrack={setFocusTrack}
                  isFocusTrack={formData.focusTrackId === track.id}
                  canRemove={formData.tracks.length > 1}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {formData.tracks.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
            <Music className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {t('트랙이 없습니다', 'No tracks added')}
            </p>
            <button
              type="button"
              onClick={addTrack}
              className="text-purple-600 hover:text-purple-700 dark:text-purple-400"
            >
              {t('첫 번째 트랙 추가하기', 'Add your first track')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// Sortable Track Item
function SortableTrackItem({ track, updateTrack, removeTrack, setFocusTrack, isFocusTrack, canRemove }: any) {
  const language = useSafeStore(useLanguageStore, state => state.language) || 'ko'
  const t = (ko: string, en: string) => language === 'ko' ? ko : en
  const [isExpanded, setIsExpanded] = useState(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: track.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border rounded-lg ${
        isFocusTrack 
          ? 'border-purple-500 dark:border-purple-400 shadow-lg' 
          : 'border-gray-200 dark:border-gray-700'
      } bg-white dark:bg-gray-800`}
    >
      <div className="p-4">
        <div className="flex items-center gap-4">
          {/* Drag Handle */}
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
            <GripVertical className="w-5 h-5 text-gray-400" />
          </div>

          {/* Track Number */}
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">
              {track.trackNumber}
            </span>
            {isFocusTrack && (
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            )}
          </div>

          {/* Track Title */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              value={track.title}
              onChange={(e) => updateTrack(track.id, { title: e.target.value })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder={t('트랙 제목 (한국어)', 'Track Title (Korean)')}
            />
            <input
              type="text"
              value={track.titleEn}
              onChange={(e) => updateTrack(track.id, { titleEn: e.target.value })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder={t('트랙 제목 (영어)', 'Track Title (English)')}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFocusTrack(track.id)}
              className={`p-2 rounded-lg transition-colors ${
                isFocusTrack
                  ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
                  : 'text-gray-400 hover:text-yellow-500'
              }`}
              title={t('포커스 트랙으로 설정', 'Set as focus track')}
            >
              <Star className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition-colors"
            >
              <ChevronRight className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
            </button>
            {canRemove && (
              <button
                type="button"
                onClick={() => removeTrack(track.id)}
                className="p-2 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
            {/* Track Translations */}
            <TranslationManager
              translations={track.translations}
              onChange={(translations) => updateTrack(track.id, { translations })}
              placeholder={t('번역된 트랙 제목', 'Translated track title')}
              label={t('트랙 제목 번역', 'Track Title Translations')}
            />

            {/* Track Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* ISRC */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('ISRC', 'ISRC')}
                  <Tooltip content={t('국제 표준 녹음 코드', 'International Standard Recording Code')}>
                    <HelpCircle className="inline w-4 h-4 ml-1 text-gray-400" />
                  </Tooltip>
                </label>
                <input
                  type="text"
                  value={track.isrc}
                  onChange={(e) => updateTrack(track.id, { isrc: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="KR-A00-24-00001"
                />
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('재생 시간', 'Duration')}
                </label>
                <input
                  type="text"
                  value={track.duration}
                  onChange={(e) => updateTrack(track.id, { duration: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="3:45"
                />
              </div>

              {/* Language */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('가사 언어', 'Lyrics Language')}
                </label>
                <select
                  value={track.languageCode}
                  onChange={(e) => updateTrack(track.id, { languageCode: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="ko">{t('한국어', 'Korean')}</option>
                  <option value="en">{t('영어', 'English')}</option>
                  <option value="ja">{t('일본어', 'Japanese')}</option>
                  <option value="zh">{t('중국어', 'Chinese')}</option>
                  <option value="es">{t('스페인어', 'Spanish')}</option>
                  <option value="INST">{t('연주곡', 'Instrumental')}</option>
                </select>
              </div>
            </div>

            {/* Track Options */}
            <div className="space-y-3">
              <Toggle
                checked={track.isInstrumental}
                onChange={(checked) => updateTrack(track.id, { isInstrumental: checked })}
                label={t('연주곡', 'Instrumental Track')}
                helpText={t('가사가 없는 연주곡인 경우 선택', 'Select if this is an instrumental track without lyrics')}
              />
              
              <Toggle
                checked={track.parentalAdvisory === 'EXPLICIT'}
                onChange={(checked) => updateTrack(track.id, { parentalAdvisory: checked ? 'EXPLICIT' : 'NONE' })}
                label={t('명시적 콘텐츠', 'Explicit Content')}
                helpText={t('19세 이상 청취 권장 콘텐츠', 'Content recommended for 19+')}
              />
            </div>

            {/* Contributors Button */}
            <div className="flex items-center gap-4">
              <button
                type="button"
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Users className="w-4 h-4" />
                {t('아티스트 및 기여자 관리', 'Manage Artists & Contributors')}
                <span className="text-sm text-gray-500">
                  ({track.artists.length + track.contributors.length})
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Step 4: File Upload
function FileUploadStep({ formData, setFormData }: any) {
  const language = useSafeStore(useLanguageStore, state => state.language) || 'ko'
  const t = (ko: string, en: string) => language === 'ko' ? ko : en
  const [uploadProgress] = useState<{ [key: string]: number }>({})

  const handleCoverArtUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type and size
      if (!file.type.startsWith('image/')) {
        toast.error(t('이미지 파일만 업로드 가능합니다', 'Only image files are allowed'))
        return
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB
        toast.error(t('파일 크기는 10MB 이하여야 합니다', 'File size must be less than 10MB'))
        return
      }
      setFormData({ ...formData, coverArt: file })
    }
  }

  const handleAudioFilesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('audio/') && !file.name.endsWith('.wav') && !file.name.endsWith('.flac')) {
        toast.error(t(`${file.name}은 오디오 파일이 아닙니다`, `${file.name} is not an audio file`))
        return false
      }
      if (file.size > 500 * 1024 * 1024) { // 500MB
        toast.error(t(`${file.name}의 크기가 너무 큽니다 (최대 500MB)`, `${file.name} is too large (max 500MB)`))
        return false
      }
      return true
    })
    
    setFormData({ ...formData, audioFiles: [...formData.audioFiles, ...validFiles] })
  }

  const removeAudioFile = (index: number) => {
    const newFiles = [...formData.audioFiles]
    newFiles.splice(index, 1)
    setFormData({ ...formData, audioFiles: newFiles })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('파일 업로드', 'File Upload')}
        </h2>

        {/* Cover Art Upload */}
        <div className="mb-8">
          <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">
            {t('커버 아트', 'Cover Art')}
            <span className="text-red-500 ml-1">*</span>
          </h3>

          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
            {formData.coverArt ? (
              <div className="flex items-center gap-4">
                <img
                  src={URL.createObjectURL(formData.coverArt)}
                  alt="Cover Art"
                  className="w-32 h-32 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formData.coverArt.name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {(formData.coverArt.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, coverArt: null })}
                    className="mt-2 text-sm text-red-500 hover:text-red-600"
                  >
                    {t('삭제', 'Remove')}
                  </button>
                </div>
              </div>
            ) : (
              <label className="cursor-pointer block text-center">
                <input
                  type="file"
                  onChange={handleCoverArtUpload}
                  accept="image/*"
                  className="sr-only"
                />
                <Image className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  {t('클릭하여 이미지 업로드', 'Click to upload image')}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                  {t('3000x3000px, RGB, JPG/PNG (최대 10MB)', '3000x3000px, RGB, JPG/PNG (max 10MB)')}
                </p>
              </label>
            )}
          </div>
        </div>

        {/* Audio Files Upload */}
        <div>
          <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">
            {t('음원 파일', 'Audio Files')}
            <span className="text-red-500 ml-1">*</span>
          </h3>

          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
            <label className="cursor-pointer block text-center">
              <input
                type="file"
                onChange={handleAudioFilesUpload}
                accept="audio/*,.wav,.flac"
                multiple
                className="sr-only"
              />
              <Music className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                {t('클릭하여 음원 파일 업로드', 'Click to upload audio files')}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                {t('WAV, FLAC 권장 (최대 500MB)', 'WAV, FLAC recommended (max 500MB)')}
              </p>
            </label>
          </div>

          {/* Uploaded Files List */}
          {formData.audioFiles.length > 0 && (
            <div className="mt-4 space-y-2">
              {formData.audioFiles.map((file: File, index: number) => (
                <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <Music className="w-5 h-5 text-gray-400" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white text-sm">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  {uploadProgress[file.name] !== undefined && (
                    <div className="w-32">
                      <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-600 transition-all"
                          style={{ width: `${uploadProgress[file.name]}%` }}
                        />
                      </div>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeAudioFile(index)}
                    className="p-1 text-gray-400 hover:text-red-500"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Technical Specifications */}
        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            {t('음원 파일 기술 사양', 'Audio File Technical Specifications')}
          </h4>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>• {t('형식: WAV, FLAC (무손실 권장)', 'Format: WAV, FLAC (lossless recommended)')}</li>
            <li>• {t('샘플레이트: 44.1kHz 이상', 'Sample Rate: 44.1kHz or higher')}</li>
            <li>• {t('비트뎁스: 16bit 이상 (24bit 권장)', 'Bit Depth: 16bit or higher (24bit recommended)')}</li>
            <li>• {t('채널: 스테레오', 'Channels: Stereo')}</li>
            <li>• {t('최대 파일 크기: 500MB', 'Max File Size: 500MB')}</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

// Step 5: Distribution Settings
function DistributionStep({ formData, setFormData }: any) {
  const language = useSafeStore(useLanguageStore, state => state.language) || 'ko'
  const t = (ko: string, en: string) => language === 'ko' ? ko : en

  const priceTypes = [
    { value: 'FREE', label: t('무료', 'Free'), description: t('무료로 제공', 'Provided for free') },
    { value: 'PAID', label: t('유료', 'Paid'), description: t('구매 필요', 'Purchase required') },
    { value: 'PREMIUM', label: t('프리미엄', 'Premium'), description: t('프리미엄 구독자 전용', 'Premium subscribers only') }
  ]

  const toggleDSP = (dspId: string) => {
    const isSelected = formData.selectedDSPs.includes(dspId)
    if (isSelected) {
      setFormData({
        ...formData,
        selectedDSPs: formData.selectedDSPs.filter((id: string) => id !== dspId)
      })
    } else {
      setFormData({
        ...formData,
        selectedDSPs: [...formData.selectedDSPs, dspId]
      })
    }
  }

  const selectAllDSPs = () => {
    setFormData({
      ...formData,
      selectedDSPs: dspList.map(dsp => dsp.id)
    })
  }

  const deselectAllDSPs = () => {
    setFormData({
      ...formData,
      selectedDSPs: []
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('배포 설정', 'Distribution Settings')}
        </h2>

        {/* Territory Selection */}
        <div className="mb-8">
          <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">
            {t('배포 지역', 'Distribution Territories')}
            <Tooltip content={t('음원을 배포할 국가/지역을 선택하세요', 'Select countries/regions to distribute your music')}>
              <HelpCircle className="inline w-4 h-4 ml-1 text-gray-400" />
            </Tooltip>
          </h3>

          <RegionSelector
            selectedRegions={formData.territories}
            onRegionsChange={(territories) => setFormData({ ...formData, territories })}
          />
        </div>

        {/* DSP Selection */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-md font-medium text-gray-900 dark:text-white">
              {t('음원 플랫폼 (DSP)', 'Digital Service Providers (DSP)')}
              <Tooltip content={t('음원을 배포할 스트리밍 플랫폼을 선택하세요', 'Select streaming platforms to distribute your music')}>
                <HelpCircle className="inline w-4 h-4 ml-1 text-gray-400" />
              </Tooltip>
            </h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={selectAllDSPs}
                className="text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400"
              >
                {t('모두 선택', 'Select All')}
              </button>
              <span className="text-gray-400">|</span>
              <button
                type="button"
                onClick={deselectAllDSPs}
                className="text-sm text-gray-600 hover:text-gray-700 dark:text-gray-400"
              >
                {t('모두 해제', 'Deselect All')}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {dspList.map((dsp) => (
              <label
                key={dsp.id}
                className={`
                  flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all
                  ${formData.selectedDSPs.includes(dsp.id)
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }
                `}
              >
                <input
                  type="checkbox"
                  checked={formData.selectedDSPs.includes(dsp.id)}
                  onChange={() => toggleDSP(dsp.id)}
                  className="sr-only"
                />
                <div className="flex items-center gap-2">
                  {dsp.logo && <img src={dsp.logo} alt={dsp.name} className="w-5 h-5" />}
                  <span className="text-sm font-medium">{dsp.name}</span>
                </div>
                {dsp.regions && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    ({dsp.regions.join(', ')})
                  </span>
                )}
              </label>
            ))}
          </div>
        </div>

        {/* Price Type */}
        <div>
          <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">
            {t('가격 유형', 'Price Type')}
          </h3>
          <RadioGroup
            options={priceTypes}
            value={formData.priceType}
            onChange={(value) => setFormData({ ...formData, priceType: value })}
            name="priceType"
          />
        </div>
      </div>
    </div>
  )
}

// Step 6: Review & Submit
function ReviewStep({ formData, validationResults }: any) {
  const language = useSafeStore(useLanguageStore, state => state.language) || 'ko'
  const t = (ko: string, en: string) => language === 'ko' ? ko : en

  const sections = [
    {
      title: t('아티스트 정보', 'Artist Information'),
      icon: <Users className="w-5 h-5" />,
      fields: [
        { label: t('아티스트명', 'Artist Name'), value: formData.artistName },
        { label: t('디스플레이 아티스트명', 'Display Artist Name'), value: formData.displayArtistName },
        { label: t('레이블', 'Label'), value: formData.labelName },
        { label: t('아티스트 유형', 'Artist Type'), value: formData.artistType }
      ]
    },
    {
      title: t('앨범 정보', 'Album Information'),
      icon: <Disc className="w-5 h-5" />,
      fields: [
        { label: t('앨범 제목', 'Album Title'), value: `${formData.albumTitle} / ${formData.albumTitleEn}` },
        { label: t('앨범 유형', 'Album Type'), value: formData.albumType },
        { label: t('발매일', 'Release Date'), value: formData.consumerReleaseDate },
        { label: t('장르', 'Genre'), value: formData.genre.join(', ') }
      ]
    },
    {
      title: t('트랙 정보', 'Track Information'),
      icon: <Music className="w-5 h-5" />,
      fields: [
        { label: t('트랙 수', 'Number of Tracks'), value: formData.tracks.length },
        { label: t('포커스 트랙', 'Focus Track'), value: formData.tracks.find((t: any) => t.id === formData.focusTrackId)?.title || '-' }
      ]
    },
    {
      title: t('배포 설정', 'Distribution Settings'),
      icon: <Globe className="w-5 h-5" />,
      fields: [
        { label: t('배포 지역', 'Territories'), value: `${formData.territories.length}개 지역` },
        { label: t('플랫폼', 'Platforms'), value: `${formData.selectedDSPs.length}개 DSP` },
        { label: t('가격 유형', 'Price Type'), value: formData.priceType }
      ]
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('최종 검토', 'Final Review')}
        </h2>

        {/* Summary Sections */}
        <div className="space-y-4">
          {sections.map((section, index) => (
            <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                {section.icon}
                <h3 className="font-medium text-gray-900 dark:text-white">{section.title}</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {section.fields.map((field, fieldIndex) => (
                  <div key={fieldIndex}>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{field.label}:</span>
                    <span className="ml-2 text-sm font-medium text-gray-900 dark:text-white">
                      {field.value || '-'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* QC Status */}
        {validationResults && (
          <div className="mt-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900 dark:text-white">
                {t('품질 검사 결과', 'Quality Check Results')}
              </h3>
              {validationResults.errors.length > 0 ? (
                <span className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <AlertTriangle className="w-5 h-5" />
                  {t('오류 발견', 'Errors Found')}
                </span>
              ) : (
                <span className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle className="w-5 h-5" />
                  {t('통과', 'Passed')}
                </span>
              )}
            </div>
            
            {validationResults.errors.length > 0 && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p>{t('제출 전에 모든 오류를 수정해야 합니다.', 'All errors must be fixed before submission.')}</p>
              </div>
            )}
          </div>
        )}

        {/* Agreement */}
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              className="mt-0.5 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p>{t(
                '본인은 제출하는 모든 콘텐츠에 대한 권리를 보유하고 있으며, N3RVE 플랫폼의 이용약관에 동의합니다.',
                'I confirm that I own all rights to the submitted content and agree to the N3RVE platform terms of service.'
              )}</p>
            </div>
          </label>
        </div>
      </div>
    </div>
  )
}