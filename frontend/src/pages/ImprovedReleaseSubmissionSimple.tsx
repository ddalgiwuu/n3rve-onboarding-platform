import { useState, useEffect } from 'react'
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

// Tooltip Component
const Tooltip: React.FC<{
  content: string
  children: React.ReactNode
}> = ({ content, children }) => {
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
        <div className="absolute z-10 px-3 py-2 text-xs font-medium text-white bg-gray-900 dark:bg-gray-700 rounded-lg shadow-lg whitespace-normal max-w-xs bottom-full left-1/2 transform -translate-x-1/2 mb-2">
          {content}
          <div className="absolute w-2 h-2 bg-gray-900 dark:bg-gray-700 transform rotate-45 -bottom-1 left-1/2 -translate-x-1/2"></div>
        </div>
      )}
    </div>
  )
}

// Main component
export default function ImprovedReleaseSubmissionSimple() {
  const navigate = useNavigate()
  const language = useSafeStore(useLanguageStore, state => state.language) || 'ko'
  const user = useSafeStore(useAuthStore, state => state.user)
  const t = (ko: string, en: string) => language === 'ko' ? ko : en

  const [currentStep, setCurrentStep] = useState(1)
  const [validationResults, setValidationResults] = useState<QCValidationResults | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    // Artist Information
    artistName: '',
    displayArtistName: '',
    artistTranslations: [] as { id: string; language: string; value: string }[],
    artistType: 'individual',
    members: [] as any[],
    labelName: '',
    artistCountry: 'KR',
    dspProfiles: [] as { dspId: string; profileUrl: string }[],
    
    // Album Information
    albumTitle: '',
    albumTitleEn: '',
    albumType: 'single',
    genre: [] as string[],
    subgenre: [] as string[],
    originalReleaseDate: new Date().toISOString().split('T')[0],
    consumerReleaseDate: new Date().toISOString().split('T')[0],
    releaseTime: '00:00',
    timezone: 'Asia/Seoul',
    copyrightYear: new Date().getFullYear().toString(),
    copyrightHolder: '',
    recordingYear: new Date().getFullYear().toString(),
    recordingCountry: 'KR',
    upc: '',
    ean: '',
    albumNotes: '',
    
    // Track Information
    tracks: [
      {
        id: uuidv4(),
        title: '',
        titleEn: '',
        isrc: '',
        explicit: false,
        dolbyAtmos: false,
        writers: [''],
        composers: [''],
        arrangers: [''],
        producers: [''],
        performers: [''],
        genre: '',
        subgenre: '',
        language: 'ko',
        lyrics: '',
        audioFile: null,
        artistName: '',
        displayArtistName: ''
      }
    ],
    focusTrackId: '',
    
    // Files
    coverImage: null,
    audioFiles: [] as File[],
    
    // Distribution
    territories: [] as string[],
    excludedTerritories: [] as string[],
    territoryType: 'worldwide' as 'worldwide' | 'select' | 'exclude',
    selectedDSPs: [] as string[],
    priceType: 'paid' as 'paid' | 'free',
    
    // Additional
    qcReport: null
  })

  // Step definitions
  const steps = [
    { number: 1, title: t('아티스트 정보', 'Artist Information'), icon: Users },
    { number: 2, title: t('앨범 정보', 'Album Information'), icon: Disc },
    { number: 3, title: t('트랙 정보', 'Track Information'), icon: Music },
    { number: 4, title: t('파일 업로드', 'File Upload'), icon: Upload },
    { number: 5, title: t('배포 설정', 'Distribution Settings'), icon: Globe },
    { number: 6, title: t('검토 및 제출', 'Review & Submit'), icon: CheckCircle }
  ]

  // Validate on form change
  useEffect(() => {
    const results = validateSubmission(formData)
    setValidationResults(results)
  }, [formData])

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true)

      if (validationResults && validationResults.errors && validationResults.errors.length > 0) {
        toast.error(t('QC 검증을 통과하지 못했습니다', 'QC validation failed'))
        return
      }

      // Convert form data to submission format
      const submissionData = {
        artist: {
          name: formData.artistName,
          displayName: formData.displayArtistName,
          type: formData.artistType,
          translations: formData.artistTranslations,
          members: formData.members,
          label: formData.labelName,
          country: formData.artistCountry,
          dspProfiles: formData.dspProfiles
        },
        album: {
          title: formData.albumTitle,
          titleEn: formData.albumTitleEn,
          type: formData.albumType,
          genre: formData.genre,
          subgenre: formData.subgenre,
          originalReleaseDate: formData.originalReleaseDate,
          consumerReleaseDate: formData.consumerReleaseDate,
          releaseTime: formData.releaseTime,
          timezone: formData.timezone,
          copyrightYear: formData.copyrightYear,
          copyrightHolder: formData.copyrightHolder,
          recordingYear: formData.recordingYear,
          recordingCountry: formData.recordingCountry,
          upc: formData.upc,
          ean: formData.ean,
          notes: formData.albumNotes
        },
        tracks: formData.tracks,
        focusTrackId: formData.focusTrackId,
        distribution: {
          territories: formData.territories,
          excludedTerritories: formData.excludedTerritories,
          territoryType: formData.territoryType,
          selectedDSPs: formData.selectedDSPs,
          priceType: formData.priceType
        },
        files: {
          coverImage: formData.coverImage,
          audioFiles: formData.audioFiles
        },
        qcReport: validationResults
      }

      // Submit using the submission service
      await submissionService.createSubmission(submissionData as any)

      toast.success(t('제출이 완료되었습니다!', 'Submission completed!'))
      navigate('/submission-success')
    } catch (error) {
      console.error('Submission error:', error)
      toast.error(t('제출 중 오류가 발생했습니다', 'Error during submission'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <ArtistStep formData={formData} setFormData={setFormData} />
      case 2:
        return <AlbumStep formData={formData} setFormData={setFormData} />
      case 3:
        return <TrackStep formData={formData} setFormData={setFormData} />
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900 py-6 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isActive = step.number === currentStep
              const isCompleted = step.number < currentStep
              
              return (
                <div key={step.number} className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 ${
                      isActive
                        ? 'border-purple-600 bg-purple-600 text-white shadow-lg scale-110'
                        : isCompleted
                        ? 'border-green-500 bg-green-500 text-white'
                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-400'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <Icon className="w-6 h-6" />
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`h-1 w-full transition-all duration-300 ${
                        isCompleted ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    />
                  )}
                </div>
              )
            })}
          </div>
          <div className="mt-4 text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {steps[currentStep - 1].title}
            </h2>
          </div>
        </div>

        {/* QC Warnings */}
        {validationResults && validationResults.errors && validationResults.errors.length > 0 && (
          <div className="mb-6">
            <QCWarnings warnings={validationResults.errors} />
          </div>
        )}

        {/* Step Content */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6">
          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <button
            type="button"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              currentStep === 1
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
            {t('이전', 'Previous')}
          </button>

          {currentStep === steps.length ? (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || (validationResults?.errors?.length ?? 0) > 0}
              className="flex items-center gap-2 px-8 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  {t('제출 중...', 'Submitting...')}
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  {t('제출하기', 'Submit')}
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
            >
              {t('다음', 'Next')}
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Step 1: Artist Information
function ArtistStep({ formData, setFormData }: any) {
  const language = useSafeStore(useLanguageStore, state => state.language) || 'ko'
  const t = (ko: string, en: string) => language === 'ko' ? ko : en

  const artistTypes = [
    { value: 'individual', label: t('개인', 'Individual'), description: t('솔로 아티스트', 'Solo artist') },
    { value: 'group', label: t('그룹', 'Group'), description: t('밴드 또는 그룹', 'Band or group') },
    { value: 'various', label: t('다양한 아티스트', 'Various Artists'), description: t('컴필레이션 앨범', 'Compilation album') }
  ]

  const addTranslation = () => {
    setFormData({
      ...formData,
      artistTranslations: [
        ...formData.artistTranslations,
        { id: uuidv4(), language: '', value: '' }
      ]
    })
  }

  const removeTranslation = (id: string) => {
    setFormData({
      ...formData,
      artistTranslations: formData.artistTranslations.filter((t: any) => t.id !== id)
    })
  }

  const updateTranslation = (id: string, field: 'language' | 'value', value: string) => {
    setFormData({
      ...formData,
      artistTranslations: formData.artistTranslations.map((t: any) =>
        t.id === id ? { ...t, [field]: value } : t
      )
    })
  }

  const addDSPProfile = () => {
    setFormData({
      ...formData,
      dspProfiles: [
        ...formData.dspProfiles,
        { dspId: '', profileUrl: '' }
      ]
    })
  }

  const removeDSPProfile = (index: number) => {
    setFormData({
      ...formData,
      dspProfiles: formData.dspProfiles.filter((_: any, i: number) => i !== index)
    })
  }

  const updateDSPProfile = (index: number, field: 'dspId' | 'profileUrl', value: string) => {
    setFormData({
      ...formData,
      dspProfiles: formData.dspProfiles.map((p: any, i: number) =>
        i === index ? { ...p, [field]: value } : p
      )
    })
  }

  return (
    <div className="space-y-6">
      {/* Artist Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('아티스트명', 'Artist Name')} *
          <Tooltip content={t('음원 서비스에 표시될 공식 아티스트명', 'Official artist name for music services')}>
            <HelpCircle className="inline w-4 h-4 ml-1 text-gray-400" />
          </Tooltip>
        </label>
        <input
          type="text"
          value={formData.artistName}
          onChange={(e) => setFormData({ ...formData, artistName: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          placeholder={t('예: BTS, 아이유', 'e.g., BTS, IU')}
        />
      </div>

      {/* Display Artist Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('디스플레이 아티스트명', 'Display Artist Name')}
          <Tooltip content={t('피처링이나 협업 시 표시될 이름 (예: BTS feat. Halsey)', 'Display name for collaborations')}>
            <HelpCircle className="inline w-4 h-4 ml-1 text-gray-400" />
          </Tooltip>
        </label>
        <input
          type="text"
          value={formData.displayArtistName}
          onChange={(e) => setFormData({ ...formData, displayArtistName: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          placeholder={t('예: BTS feat. Halsey', 'e.g., BTS feat. Halsey')}
        />
      </div>

      {/* Artist Translations */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('아티스트명 번역', 'Artist Name Translations')}
            <Tooltip content={t('다른 언어로 된 아티스트명 (일본어, 중국어 등)', 'Artist name in other languages')}>
              <HelpCircle className="inline w-4 h-4 ml-1 text-gray-400" />
            </Tooltip>
          </label>
          <button
            type="button"
            onClick={addTranslation}
            className="text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400"
          >
            <Plus className="inline w-4 h-4" /> {t('추가', 'Add')}
          </button>
        </div>
        {formData.artistTranslations.map((translation: any) => (
          <div key={translation.id} className="flex gap-2 mb-2">
            <select
              value={translation.language}
              onChange={(e) => updateTranslation(translation.id, 'language', e.target.value)}
              className="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">{t('언어', 'Language')}</option>
              <option value="ja">日本語</option>
              <option value="zh">中文</option>
              <option value="en">English</option>
            </select>
            <input
              type="text"
              value={translation.value}
              onChange={(e) => updateTranslation(translation.id, 'value', e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder={t('번역된 이름', 'Translated name')}
            />
            <button
              type="button"
              onClick={() => removeTranslation(translation.id)}
              className="p-2 text-red-600 hover:text-red-700 dark:text-red-400"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>

      {/* Artist Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('아티스트 유형', 'Artist Type')} *
        </label>
        <RadioGroup
          options={artistTypes}
          value={formData.artistType}
          onChange={(value) => setFormData({ ...formData, artistType: value })}
          name="artistType"
        />
      </div>

      {/* Label */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('레이블', 'Label')} *
        </label>
        <input
          type="text"
          value={formData.labelName}
          onChange={(e) => setFormData({ ...formData, labelName: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          placeholder={t('예: HYBE Labels, YG Entertainment', 'e.g., HYBE Labels, YG Entertainment')}
        />
      </div>

      {/* Artist Country */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('아티스트 국가', 'Artist Country')} *
        </label>
        <select
          value={formData.artistCountry}
          onChange={(e) => setFormData({ ...formData, artistCountry: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        >
          {countries.map(country => (
            <option key={country.code} value={country.code}>
              {country.name} ({country.code})
            </option>
          ))}
        </select>
      </div>

      {/* DSP Profiles */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('DSP 프로필 URL', 'DSP Profile URLs')}
            <Tooltip content={t('스포티파이, 애플뮤직 등의 아티스트 프로필 링크', 'Artist profile links on Spotify, Apple Music, etc.')}>
              <HelpCircle className="inline w-4 h-4 ml-1 text-gray-400" />
            </Tooltip>
          </label>
          <button
            type="button"
            onClick={addDSPProfile}
            className="text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400"
          >
            <Plus className="inline w-4 h-4" /> {t('추가', 'Add')}
          </button>
        </div>
        {formData.dspProfiles.map((profile: any, index: number) => (
          <div key={index} className="flex gap-2 mb-2">
            <select
              value={profile.dspId}
              onChange={(e) => updateDSPProfile(index, 'dspId', e.target.value)}
              className="w-48 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">{t('DSP 선택', 'Select DSP')}</option>
              {dspList.map(dsp => (
                <option key={dsp.id} value={dsp.id}>{dsp.name}</option>
              ))}
            </select>
            <input
              type="url"
              value={profile.profileUrl}
              onChange={(e) => updateDSPProfile(index, 'profileUrl', e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder={t('프로필 URL', 'Profile URL')}
            />
            <button
              type="button"
              onClick={() => removeDSPProfile(index)}
              className="p-2 text-red-600 hover:text-red-700 dark:text-red-400"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// Step 2: Album Information
function AlbumStep({ formData, setFormData }: any) {
  const language = useSafeStore(useLanguageStore, state => state.language) || 'ko'
  const t = (ko: string, en: string) => language === 'ko' ? ko : en

  const albumTypes = [
    { value: 'single', label: t('싱글', 'Single'), description: t('1-3곡', '1-3 tracks') },
    { value: 'ep', label: t('EP', 'EP'), description: t('4-6곡', '4-6 tracks') },
    { value: 'album', label: t('정규 앨범', 'Full Album'), description: t('7곡 이상', '7+ tracks') },
    { value: 'compilation', label: t('컴필레이션', 'Compilation'), description: t('여러 아티스트의 곡', 'Multiple artists') }
  ]

  return (
    <div className="space-y-6">
      {/* Album Title */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('앨범 제목 (한국어)', 'Album Title (Korean)')} *
          </label>
          <input
            type="text"
            value={formData.albumTitle}
            onChange={(e) => setFormData({ ...formData, albumTitle: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder={t('예: 꽃', 'e.g., Flower')}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('앨범 제목 (영어)', 'Album Title (English)')} *
          </label>
          <input
            type="text"
            value={formData.albumTitleEn}
            onChange={(e) => setFormData({ ...formData, albumTitleEn: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder={t('예: Flower', 'e.g., Flower')}
          />
        </div>
      </div>

      {/* Album Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('앨범 유형', 'Album Type')} *
        </label>
        <RadioGroup
          options={albumTypes}
          value={formData.albumType}
          onChange={(value) => setFormData({ ...formData, albumType: value })}
          name="albumType"
        />
      </div>

      {/* Genre */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('장르', 'Genre')} *
          <Tooltip content={t('최대 3개까지 선택 가능', 'Select up to 3 genres')}>
            <HelpCircle className="inline w-4 h-4 ml-1 text-gray-400" />
          </Tooltip>
        </label>
        <MultiSelect
          options={genreList.map(g => ({ value: g, label: g }))}
          value={formData.genre}
          onChange={(selected) => setFormData({ ...formData, genre: selected })}
          placeholder={t('장르 선택', 'Select genres')}
          maxItems={3}
        />
      </div>

      {/* Subgenre */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('세부 장르', 'Subgenre')}
        </label>
        <MultiSelect
          options={Object.values(subgenreList).flat().map(g => ({ value: g, label: g }))}
          value={formData.subgenre}
          onChange={(selected) => setFormData({ ...formData, subgenre: selected })}
          placeholder={t('세부 장르 선택', 'Select subgenres')}
          maxItems={3}
        />
      </div>

      {/* Release Dates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('원 발매일', 'Original Release Date')} *
            <Tooltip content={t('최초 발매된 날짜', 'Date of first release')}>
              <HelpCircle className="inline w-4 h-4 ml-1 text-gray-400" />
            </Tooltip>
          </label>
          <DatePicker
            value={new Date(formData.originalReleaseDate)}
            onChange={(date) => setFormData({ ...formData, originalReleaseDate: date?.toISOString().split('T')[0] || '' })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('디지털 발매일', 'Digital Release Date')} *
            <Tooltip content={t('DSP에 공개될 날짜', 'Date to be available on DSPs')}>
              <HelpCircle className="inline w-4 h-4 ml-1 text-gray-400" />
            </Tooltip>
          </label>
          <DatePicker
            value={new Date(formData.consumerReleaseDate)}
            onChange={(date) => setFormData({ ...formData, consumerReleaseDate: date?.toISOString().split('T')[0] || '' })}
          />
        </div>
      </div>

      {/* Release Time & Timezone */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('발매 시간', 'Release Time')} *
          </label>
          <input
            type="time"
            value={formData.releaseTime}
            onChange={(e) => setFormData({ ...formData, releaseTime: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('시간대', 'Timezone')} *
          </label>
          <select
            value={formData.timezone}
            onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            {timezones.map(tz => (
              <option key={tz.value} value={tz.value}>
                {tz.label} ({tz.offset})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Copyright */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('저작권 연도', 'Copyright Year')} *
          </label>
          <input
            type="text"
            value={formData.copyrightYear}
            onChange={(e) => setFormData({ ...formData, copyrightYear: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder={new Date().getFullYear().toString()}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('저작권 소유자', 'Copyright Holder')} *
          </label>
          <input
            type="text"
            value={formData.copyrightHolder}
            onChange={(e) => setFormData({ ...formData, copyrightHolder: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder={t('예: HYBE Corporation', 'e.g., HYBE Corporation')}
          />
        </div>
      </div>

      {/* Identifiers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            UPC
            <Tooltip content={t('12자리 범용 제품 코드', '12-digit Universal Product Code')}>
              <HelpCircle className="inline w-4 h-4 ml-1 text-gray-400" />
            </Tooltip>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={formData.upc}
              onChange={(e) => setFormData({ ...formData, upc: e.target.value })}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="123456789012"
              maxLength={12}
            />
            <button
              type="button"
              onClick={() => setFormData({ ...formData, upc: generateUPC() })}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              {t('생성', 'Generate')}
            </button>
          </div>
          {formData.upc && !validateUPC(formData.upc) && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
              {t('유효하지 않은 UPC입니다', 'Invalid UPC')}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            EAN
            <Tooltip content={t('13자리 유럽 제품 번호', '13-digit European Article Number')}>
              <HelpCircle className="inline w-4 h-4 ml-1 text-gray-400" />
            </Tooltip>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={formData.ean}
              onChange={(e) => setFormData({ ...formData, ean: e.target.value })}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="1234567890123"
              maxLength={13}
            />
            <button
              type="button"
              onClick={() => setFormData({ ...formData, ean: generateEAN() })}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              {t('생성', 'Generate')}
            </button>
          </div>
          {formData.ean && !validateEAN(formData.ean) && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
              {t('유효하지 않은 EAN입니다', 'Invalid EAN')}
            </p>
          )}
        </div>
      </div>

      {/* Album Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('앨범 노트', 'Album Notes')}
          <Tooltip content={t('앨범에 대한 추가 정보나 설명', 'Additional information about the album')}>
            <HelpCircle className="inline w-4 h-4 ml-1 text-gray-400" />
          </Tooltip>
        </label>
        <textarea
          value={formData.albumNotes}
          onChange={(e) => setFormData({ ...formData, albumNotes: e.target.value })}
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          placeholder={t('앨범에 대한 추가 정보를 입력하세요', 'Enter additional information about the album')}
        />
      </div>
    </div>
  )
}

// Step 3: Track Information (Without Drag-and-Drop)
function TrackStep({ formData, setFormData }: any) {
  const language = useSafeStore(useLanguageStore, state => state.language) || 'ko'
  const t = (ko: string, en: string) => language === 'ko' ? ko : en

  const addTrack = () => {
    const newTrack = {
      id: uuidv4(),
      title: '',
      titleEn: '',
      isrc: '',
      explicit: false,
      dolbyAtmos: false,
      writers: [''],
      composers: [''],
      arrangers: [''],
      producers: [''],
      performers: [''],
      genre: '',
      subgenre: '',
      language: 'ko',
      lyrics: '',
      audioFile: null,
      artistName: formData.artistName,
      displayArtistName: formData.displayArtistName
    }
    setFormData({ ...formData, tracks: [...formData.tracks, newTrack] })
  }

  const updateTrack = (trackId: string, field: string, value: any) => {
    setFormData({
      ...formData,
      tracks: formData.tracks.map((track: any) =>
        track.id === trackId ? { ...track, [field]: value } : track
      )
    })
  }

  const removeTrack = (trackId: string) => {
    setFormData({
      ...formData,
      tracks: formData.tracks.filter((track: any) => track.id !== trackId)
    })
  }

  const setFocusTrack = (trackId: string) => {
    setFormData({ ...formData, focusTrackId: trackId })
  }

  const moveTrack = (index: number, direction: 'up' | 'down') => {
    const newTracks = [...formData.tracks]
    const newIndex = direction === 'up' ? index - 1 : index + 1
    
    if (newIndex >= 0 && newIndex < newTracks.length) {
      [newTracks[index], newTracks[newIndex]] = [newTracks[newIndex], newTracks[index]]
      setFormData({ ...formData, tracks: newTracks })
    }
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
        <div className="space-y-4">
          {formData.tracks.map((track: any, index: number) => (
            <TrackItem
              key={track.id}
              track={track}
              index={index}
              updateTrack={updateTrack}
              removeTrack={removeTrack}
              setFocusTrack={setFocusTrack}
              isFocusTrack={formData.focusTrackId === track.id}
              canRemove={formData.tracks.length > 1}
              moveTrack={moveTrack}
              totalTracks={formData.tracks.length}
            />
          ))}
        </div>

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

// Track Item Component (without drag-and-drop)
function TrackItem({ track, index, updateTrack, removeTrack, setFocusTrack, isFocusTrack, canRemove, moveTrack, totalTracks }: any) {
  const language = useSafeStore(useLanguageStore, state => state.language) || 'ko'
  const t = (ko: string, en: string) => language === 'ko' ? ko : en
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div
      className={`border rounded-lg ${
        isFocusTrack 
          ? 'border-purple-500 dark:border-purple-400 shadow-lg' 
          : 'border-gray-200 dark:border-gray-700'
      } bg-white dark:bg-gray-800`}
    >
      <div className="p-4">
        <div className="flex items-start gap-4">
          {/* Move buttons */}
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => moveTrack(index, 'up')}
              disabled={index === 0}
              className={`p-1 rounded ${
                index === 0 
                  ? 'text-gray-300 cursor-not-allowed' 
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-500 text-center">{index + 1}</span>
            <button
              type="button"
              onClick={() => moveTrack(index, 'down')}
              disabled={index === totalTracks - 1}
              className={`p-1 rounded ${
                index === totalTracks - 1
                  ? 'text-gray-300 cursor-not-allowed' 
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Track Content */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Music className="w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={track.title}
                  onChange={(e) => updateTrack(track.id, 'title', e.target.value)}
                  className="font-medium text-gray-900 dark:text-white bg-transparent border-b border-transparent hover:border-gray-300 dark:hover:border-gray-600 focus:border-purple-500 dark:focus:border-purple-400 outline-none px-1"
                  placeholder={t('트랙 제목', 'Track Title')}
                />
                {isFocusTrack && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-medium rounded-full">
                    <Star className="w-3 h-3" />
                    {t('포커스 트랙', 'Focus Track')}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {!isFocusTrack && (
                  <button
                    type="button"
                    onClick={() => setFocusTrack(track.id)}
                    className="text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400"
                  >
                    {t('포커스 트랙 설정', 'Set as Focus')}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400"
                >
                  {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
                {canRemove && (
                  <button
                    type="button"
                    onClick={() => removeTrack(track.id)}
                    className="text-red-600 hover:text-red-700 dark:text-red-400"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {t('영문 제목', 'English Title')}
                </label>
                <input
                  type="text"
                  value={track.titleEn}
                  onChange={(e) => updateTrack(track.id, 'titleEn', e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder={t('영문 제목', 'English Title')}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  ISRC
                </label>
                <input
                  type="text"
                  value={track.isrc}
                  onChange={(e) => updateTrack(track.id, 'isrc', e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="KR-XXX-YY-NNNNN"
                />
              </div>
            </div>

            {/* Toggles */}
            <div className="flex gap-6 mb-4">
              <Toggle
                checked={track.explicit}
                onChange={(checked) => updateTrack(track.id, 'explicit', checked)}
                label={t('청소년 유해', 'Explicit')}
                helpText={t('욕설이나 선정적 내용 포함', 'Contains profanity or explicit content')}
              />
              <Toggle
                checked={track.dolbyAtmos}
                onChange={(checked) => updateTrack(track.id, 'dolbyAtmos', checked)}
                label={t('Dolby Atmos', 'Dolby Atmos')}
                helpText={t('공간 음향 지원', 'Spatial audio support')}
              />
            </div>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="mt-4 space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                {/* Contributors */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      {t('작사가', 'Writers')}
                    </label>
                    <input
                      type="text"
                      value={track.writers.join(', ')}
                      onChange={(e) => updateTrack(track.id, 'writers', e.target.value.split(',').map((s: string) => s.trim()))}
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder={t('쉼표로 구분', 'Separate with commas')}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      {t('작곡가', 'Composers')}
                    </label>
                    <input
                      type="text"
                      value={track.composers.join(', ')}
                      onChange={(e) => updateTrack(track.id, 'composers', e.target.value.split(',').map((s: string) => s.trim()))}
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder={t('쉼표로 구분', 'Separate with commas')}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      {t('편곡가', 'Arrangers')}
                    </label>
                    <input
                      type="text"
                      value={track.arrangers.join(', ')}
                      onChange={(e) => updateTrack(track.id, 'arrangers', e.target.value.split(',').map((s: string) => s.trim()))}
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder={t('쉼표로 구분', 'Separate with commas')}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      {t('프로듀서', 'Producers')}
                    </label>
                    <input
                      type="text"
                      value={track.producers.join(', ')}
                      onChange={(e) => updateTrack(track.id, 'producers', e.target.value.split(',').map((s: string) => s.trim()))}
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder={t('쉼표로 구분', 'Separate with commas')}
                    />
                  </div>
                </div>

                {/* Genre & Language */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      {t('장르', 'Genre')}
                    </label>
                    <select
                      value={track.genre}
                      onChange={(e) => updateTrack(track.id, 'genre', e.target.value)}
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">{t('선택', 'Select')}</option>
                      {genreList.map(genre => (
                        <option key={genre} value={genre}>{genre}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      {t('세부 장르', 'Subgenre')}
                    </label>
                    <select
                      value={track.subgenre}
                      onChange={(e) => updateTrack(track.id, 'subgenre', e.target.value)}
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">{t('선택', 'Select')}</option>
                      {track.genre && subgenreList[track.genre]?.map((subgenre: string) => (
                        <option key={subgenre} value={subgenre}>{subgenre}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      {t('언어', 'Language')}
                    </label>
                    <select
                      value={track.language}
                      onChange={(e) => updateTrack(track.id, 'language', e.target.value)}
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="ko">한국어</option>
                      <option value="en">English</option>
                      <option value="ja">日本語</option>
                      <option value="zh">中文</option>
                      <option value="es">Español</option>
                      <option value="instrumental">{t('연주곡', 'Instrumental')}</option>
                    </select>
                  </div>
                </div>

                {/* Lyrics */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    {t('가사', 'Lyrics')}
                  </label>
                  <textarea
                    value={track.lyrics}
                    onChange={(e) => updateTrack(track.id, 'lyrics', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder={t('가사를 입력하세요', 'Enter lyrics')}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Step 4: File Upload
function FileUploadStep({ formData, setFormData }: any) {
  const language = useSafeStore(useLanguageStore, state => state.language) || 'ko'
  const t = (ko: string, en: string) => language === 'ko' ? ko : en

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData({ ...formData, coverImage: file })
    }
  }

  const handleAudioFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setFormData({ ...formData, audioFiles: files })
  }

  return (
    <div className="space-y-6">
      {/* Cover Image Upload */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          {t('커버 이미지', 'Cover Image')}
        </h3>
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
          <div className="text-center">
            <Image className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <label htmlFor="cover-upload" className="cursor-pointer">
                <span className="mt-2 block text-sm font-medium text-gray-900 dark:text-white">
                  {formData.coverImage ? formData.coverImage.name : t('이미지를 선택하거나 드래그하세요', 'Select or drag image')}
                </span>
                <input
                  id="cover-upload"
                  name="cover-upload"
                  type="file"
                  className="sr-only"
                  accept="image/*"
                  onChange={handleCoverImageChange}
                />
              </label>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {t('JPG, PNG 최대 10MB', 'JPG, PNG up to 10MB')}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('최소 3000x3000px 권장', 'Minimum 3000x3000px recommended')}
            </p>
          </div>
        </div>
        {formData.coverImage && (
          <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm">{t('이미지가 업로드되었습니다', 'Image uploaded')}</span>
            </div>
          </div>
        )}
      </div>

      {/* Audio Files Upload */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          {t('오디오 파일', 'Audio Files')}
        </h3>
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
          <div className="text-center">
            <Music className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <label htmlFor="audio-upload" className="cursor-pointer">
                <span className="mt-2 block text-sm font-medium text-gray-900 dark:text-white">
                  {formData.audioFiles.length > 0 
                    ? t(`${formData.audioFiles.length}개 파일 선택됨`, `${formData.audioFiles.length} files selected`)
                    : t('오디오 파일을 선택하거나 드래그하세요', 'Select or drag audio files')
                  }
                </span>
                <input
                  id="audio-upload"
                  name="audio-upload"
                  type="file"
                  className="sr-only"
                  accept="audio/*"
                  multiple
                  onChange={handleAudioFilesChange}
                />
              </label>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {t('WAV, FLAC 권장', 'WAV, FLAC recommended')}
            </p>
          </div>
        </div>
        {formData.audioFiles.length > 0 && (
          <div className="mt-4 space-y-2">
            {formData.audioFiles.map((file: File, index: number) => (
              <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center gap-3">
                <Music className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-700 dark:text-gray-300">{file.name}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Guidelines */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div className="text-sm text-blue-700 dark:text-blue-300">
            <p className="font-medium mb-2">{t('업로드 가이드라인', 'Upload Guidelines')}</p>
            <ul className="list-disc list-inside space-y-1">
              <li>{t('커버 이미지: 3000x3000px 이상, RGB 색상 모드', 'Cover: 3000x3000px or higher, RGB color mode')}</li>
              <li>{t('오디오: 44.1kHz/16bit 이상, WAV 또는 FLAC', 'Audio: 44.1kHz/16bit or higher, WAV or FLAC')}</li>
              <li>{t('파일명에 특수문자 사용 금지', 'No special characters in filenames')}</li>
              <li>{t('트랙 순서대로 파일명 지정 권장', 'Name files in track order recommended')}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

// Step 5: Distribution Settings
function DistributionStep({ formData, setFormData }: any) {
  const language = useSafeStore(useLanguageStore, state => state.language) || 'ko'
  const t = (ko: string, en: string) => language === 'ko' ? ko : en

  const territoryTypes = [
    { value: 'worldwide', label: t('전 세계', 'Worldwide'), description: t('모든 지역에 배포', 'Distribute to all territories') },
    { value: 'select', label: t('선택 지역', 'Select Territories'), description: t('특정 지역만 선택', 'Select specific territories') },
    { value: 'exclude', label: t('제외 지역', 'Exclude Territories'), description: t('특정 지역 제외', 'Exclude specific territories') }
  ]

  const priceTypes = [
    { value: 'paid', label: t('유료', 'Paid'), description: t('일반 유료 스트리밍/다운로드', 'Regular paid streaming/download') },
    { value: 'free', label: t('무료', 'Free'), description: t('무료 스트리밍 전용', 'Free streaming only') }
  ]

  const toggleDSP = (dspId: string) => {
    if (formData.selectedDSPs.includes(dspId)) {
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

  return (
    <div className="space-y-6">
      {/* Territory Settings */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          {t('배포 지역', 'Distribution Territories')}
        </h3>
        <RadioGroup
          options={territoryTypes}
          value={formData.territoryType}
          onChange={(value) => setFormData({ ...formData, territoryType: value })}
          name="territoryType"
        />

        {formData.territoryType === 'select' && (
          <div className="mt-4">
            <RegionSelector
              selectedRegions={formData.territories}
              onRegionsChange={(territories) => setFormData({ ...formData, territories })}
            />
          </div>
        )}

        {formData.territoryType === 'exclude' && (
          <div className="mt-4">
            <RegionSelector
              selectedRegions={formData.excludedTerritories}
              onRegionsChange={(excluded) => setFormData({ ...formData, excludedTerritories: excluded })}
            />
          </div>
        )}
      </div>

      {/* DSP Selection */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          {t('배포 플랫폼', 'Distribution Platforms')}
          <Tooltip content={t('음원을 배포할 스트리밍 서비스를 선택하세요', 'Select streaming services for distribution')}>
            <HelpCircle className="inline w-4 h-4 ml-2 text-gray-400" />
          </Tooltip>
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {dspList.map(dsp => (
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
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
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
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                  {section.icon}
                </div>
                <h3 className="font-medium text-gray-900 dark:text-white">
                  {section.title}
                </h3>
              </div>
              <div className="space-y-2">
                {section.fields.map((field, fieldIndex) => (
                  <div key={fieldIndex} className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">{field.label}:</span>
                    <span className="text-gray-900 dark:text-white font-medium">{field.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* QC Status */}
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center gap-3">
            {validationResults && validationResults.errors && validationResults.errors.length === 0 ? (
              <>
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                <div>
                  <p className="font-medium text-green-600 dark:text-green-400">
                    {t('QC 검증 통과', 'QC Validation Passed')}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('모든 항목이 FUGA 품질 기준을 충족합니다', 'All items meet FUGA quality standards')}
                  </p>
                </div>
              </>
            ) : (
              <>
                <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                <div>
                  <p className="font-medium text-yellow-600 dark:text-yellow-400">
                    {t('QC 경고 사항 있음', 'QC Warnings Present')}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t(`${validationResults?.errors?.length || 0}개의 경고사항을 확인하세요`, `Please review ${validationResults?.errors?.length || 0} warnings`)}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}