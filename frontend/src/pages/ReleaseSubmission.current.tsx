import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  Save, 
  Users, 
  FileText, 
  Calendar, 
  Music, 
  ListMusic, 
  Upload, 
  MapPin, 
  Radio, 
  Target, 
  Globe, 
  Sparkles, 
  AlertCircle,
  Plus,
  Trash2,
  X,
  Languages,
  Info
} from 'lucide-react'
import { useLanguageStore } from '@/store/language.store'
import { api } from '@/lib/api'
import FileUpload from '@/components/FileUpload'
import AudioPlayer from '@/components/AudioPlayer'
import RegionSelector from '@/components/RegionSelector'
import { formatPriceKRW } from '@/lib/utils'
import { cn } from '@/utils/cn'

// Modern UI color palette
const colors = {
  primary: 'purple-600',
  secondary: 'pink-600',
  accent: 'blue-600',
  success: 'green-600',
  warning: 'yellow-600',
  danger: 'red-600'
}

export default function ReleaseSubmission() {
  const navigate = useNavigate()
  const { language, t } = useLanguageStore()
  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState('')
  const [isTranslationMode, setIsTranslationMode] = useState(false)
  const [showHelp, setShowHelp] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    // Step 0: Album Information
    artists: [{
      nameKo: '',
      nameEn: '',
      type: 'PRIMARY',
      photo: null as File | null
    }],
    album: {
      titleKo: '',
      titleEn: '',
      versionKo: '',
      versionEn: '',
      labelName: '',
      format: 'DIGITAL',
      releaseDate: '',
      releaseTime: '00:00',
      genre: '',
      subgenre: '',
      coverArt: null as File | null
    },
    releaseSettings: {
      catalogNumber: '',
      upc: '',
      copyright: {
        year: new Date().getFullYear(),
        owner: ''
      },
      recordingCopyright: {
        year: new Date().getFullYear(),
        owner: ''
      }
    },

    // Step 1: Tracks & Credits
    tracks: [{
      id: Date.now().toString(),
      titleKo: '',
      titleEn: '',
      isTitle: false,
      dolbyAtmos: false,
      audioFile: null as File | null,
      credits: {
        artists: [''],
        featuring: [],
        composer: '',
        lyricist: '',
        arranger: '',
        producer: '',
        mixer: '',
        masterer: ''
      },
      settings: {
        isrc: '',
        explicitContent: false,
        genre: '',
        subgenre: '',
        language: 'ko'
      }
    }],

    // Step 3: Distribution
    distribution: {
      regions: [] as string[],
      koreanDSP: {
        melon: true,
        genie: true,
        bugs: true,
        flo: true,
        vibe: false,
        spotify: true,
        appleMusic: true,
        youtube: true
      },
      pricing: {
        preOrder: false,
        preOrderDate: '',
        specialPrice: false,
        priceKRW: 0
      }
    },

    // Step 4: Marketing & Promotion
    marketing: {
      targetAudience: '',
      marketingDrivers: '',
      promotionPlans: '',
      socialMedia: {
        instagram: '',
        twitter: '',
        tiktok: '',
        youtube: '',
        facebook: ''
      },
      pressKit: {
        biography: '',
        pressPhoto: null as File | null,
        musicVideo: ''
      },
      keySellingPoints: [] as string[]
    }
  })

  // Simplified steps with better organization
  const steps = [
    { 
      id: 0, 
      title: t('앨범 정보', 'Album Information'), 
      icon: FileText,
      description: t('아티스트와 앨범 기본 정보를 입력하세요', 'Enter artist and album basic information'),
      color: 'purple'
    },
    { 
      id: 1, 
      title: t('트랙 & 크레딧', 'Tracks & Credits'), 
      icon: Music,
      description: t('트랙 목록과 참여자 정보를 추가하세요', 'Add track list and contributor information'),
      color: 'pink'
    },
    { 
      id: 2, 
      title: t('파일 업로드', 'File Upload'), 
      icon: Upload,
      description: t('오디오 파일과 이미지를 업로드하세요', 'Upload audio files and images'),
      color: 'blue'
    },
    { 
      id: 3, 
      title: t('배급 설정', 'Distribution Settings'), 
      icon: MapPin,
      description: t('배급 지역과 플랫폼을 선택하세요', 'Select distribution regions and platforms'),
      color: 'green'
    },
    { 
      id: 4, 
      title: t('마케팅 & 프로모션', 'Marketing & Promotion'), 
      icon: Target,
      description: t('마케팅 전략과 홍보 계획을 작성하세요', 'Create marketing strategy and promotion plans'),
      color: 'yellow'
    },
    { 
      id: 5, 
      title: t('검토 및 제출', 'Review & Submit'), 
      icon: CheckCircle,
      description: t('정보를 확인하고 제출하세요', 'Review information and submit'),
      color: 'green'
    }
  ]

  const getStepColor = (stepIndex: number, isActive: boolean) => {
    const step = steps[stepIndex]
    if (isActive) {
      switch (step.color) {
        case 'purple': return 'bg-purple-600 text-white'
        case 'pink': return 'bg-pink-600 text-white'
        case 'blue': return 'bg-blue-600 text-white'
        case 'green': return 'bg-green-600 text-white'
        case 'yellow': return 'bg-yellow-600 text-white'
        default: return 'bg-gray-600 text-white'
      }
    }
    return 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
  }

  const validateStep = (stepIndex: number): boolean => {
    switch (stepIndex) {
      case 0: // Album Information
        return !!(
          formData.artists[0].nameKo && 
          formData.album.titleKo && 
          formData.album.releaseDate
        )
      case 1: // Tracks & Credits
        return formData.tracks.length > 0 && 
          formData.tracks.every(track => track.titleKo || track.titleEn)
      case 2: // File Upload
        return formData.album.coverArt !== null && 
          formData.tracks.every(track => track.audioFile !== null)
      case 3: // Distribution
        return formData.distribution.regions.length > 0
      case 4: // Marketing
        return true // Marketing is optional
      case 5: // Review
        return true
      default:
        return true
    }
  }

  const handleNext = () => {
    if (!validateStep(currentStep)) {
      setError(t('필수 정보를 모두 입력해주세요', 'Please fill in all required information'))
      return
    }
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
      setError('')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      setError('')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleStepClick = (stepId: number) => {
    if (stepId < currentStep || validateStep(currentStep)) {
      setCurrentStep(stepId)
      setError('')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      setError(t('현재 단계를 완료해주세요', 'Please complete the current step'))
    }
  }

  const handleSaveDraft = async () => {
    try {
      // Save draft logic here
      localStorage.setItem('release_draft', JSON.stringify(formData))
      alert(t('초안이 저장되었습니다', 'Draft saved successfully'))
    } catch (err) {
      setError(t('저장 중 오류가 발생했습니다', 'Error saving draft'))
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError('')
    
    try {
      // Validate all steps
      for (let i = 0; i < steps.length - 1; i++) {
        if (!validateStep(i)) {
          setError(t('모든 필수 정보를 입력해주세요', 'Please fill in all required information'))
          setCurrentStep(i)
          setIsSubmitting(false)
          return
        }
      }

      // Submit logic here
      const response = await api.post('/releases', formData, {
        onUploadProgress: (progressEvent) => {
          const progress = progressEvent.total 
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0
          setUploadProgress(progress)
        }
      })

      if (response.data.success) {
        navigate('/consumer/dashboard')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || t('제출 중 오류가 발생했습니다', 'Error submitting release'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Album Information
        return (
          <div className="space-y-8">
            {/* Translation mode toggle */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('앨범 정보', 'Album Information')}
              </h2>
              <button
                onClick={() => setIsTranslationMode(!isTranslationMode)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg transition-all",
                  isTranslationMode 
                    ? "bg-purple-600 text-white" 
                    : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                )}
              >
                <Languages className="w-4 h-4" />
                {t('번역 모드', 'Translation Mode')}
              </button>
            </div>

            {/* Artist Information */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                {t('아티스트 정보', 'Artist Information')}
              </h3>
              
              <div className="space-y-4">
                {formData.artists.map((artist, index) => (
                  <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t('아티스트명 (한글)', 'Artist Name (Korean)')} *
                        </label>
                        <input
                          type="text"
                          value={artist.nameKo}
                          onChange={(e) => {
                            const newArtists = [...formData.artists]
                            newArtists[index].nameKo = e.target.value
                            setFormData({ ...formData, artists: newArtists })
                          }}
                          className="input-modern"
                          placeholder={t('예: 아이유', 'e.g. IU')}
                        />
                      </div>
                      
                      {isTranslationMode && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t('아티스트명 (영문)', 'Artist Name (English)')}
                          </label>
                          <input
                            type="text"
                            value={artist.nameEn}
                            onChange={(e) => {
                              const newArtists = [...formData.artists]
                              newArtists[index].nameEn = e.target.value
                              setFormData({ ...formData, artists: newArtists })
                            }}
                            className="input-modern"
                            placeholder={t('예: IU', 'e.g. IU')}
                          />
                        </div>
                      )}
                    </div>

                    {index > 0 && (
                      <button
                        onClick={() => {
                          const newArtists = formData.artists.filter((_, i) => i !== index)
                          setFormData({ ...formData, artists: newArtists })
                        }}
                        className="mt-2 text-red-600 hover:text-red-700 text-sm"
                      >
                        {t('삭제', 'Delete')}
                      </button>
                    )}
                  </div>
                ))}
                
                <button
                  onClick={() => {
                    setFormData({
                      ...formData,
                      artists: [...formData.artists, { nameKo: '', nameEn: '', type: 'FEATURING', photo: null }]
                    })
                  }}
                  className="btn-secondary"
                >
                  <Plus className="w-4 h-4" />
                  {t('아티스트 추가', 'Add Artist')}
                </button>
              </div>
            </div>

            {/* Album Information */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-pink-600" />
                {t('앨범 기본 정보', 'Album Basic Information')}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('앨범명 (한글)', 'Album Title (Korean)')} *
                  </label>
                  <input
                    type="text"
                    value={formData.album.titleKo}
                    onChange={(e) => setFormData({
                      ...formData,
                      album: { ...formData.album, titleKo: e.target.value }
                    })}
                    className="input-modern"
                    placeholder={t('예: 꽃갈피 둘', 'e.g. Flower Bookmark 2')}
                  />
                </div>

                {isTranslationMode && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('앨범명 (영문)', 'Album Title (English)')}
                    </label>
                    <input
                      type="text"
                      value={formData.album.titleEn}
                      onChange={(e) => setFormData({
                        ...formData,
                        album: { ...formData.album, titleEn: e.target.value }
                      })}
                      className="input-modern"
                      placeholder={t('예: Flower Bookmark 2', 'e.g. Flower Bookmark 2')}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('발매일', 'Release Date')} *
                  </label>
                  <input
                    type="date"
                    value={formData.album.releaseDate}
                    onChange={(e) => setFormData({
                      ...formData,
                      album: { ...formData.album, releaseDate: e.target.value }
                    })}
                    className="input-modern"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('발매 시간', 'Release Time')}
                  </label>
                  <input
                    type="time"
                    value={formData.album.releaseTime}
                    onChange={(e) => setFormData({
                      ...formData,
                      album: { ...formData.album, releaseTime: e.target.value }
                    })}
                    className="input-modern"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('장르', 'Genre')} *
                  </label>
                  <select
                    value={formData.album.genre}
                    onChange={(e) => setFormData({
                      ...formData,
                      album: { ...formData.album, genre: e.target.value }
                    })}
                    className="input-modern"
                  >
                    <option value="">{t('선택하세요', 'Select')}</option>
                    <option value="pop">Pop</option>
                    <option value="rock">Rock</option>
                    <option value="hip-hop">Hip-Hop</option>
                    <option value="r&b">R&B</option>
                    <option value="electronic">Electronic</option>
                    <option value="k-pop">K-Pop</option>
                    <option value="indie">Indie</option>
                    <option value="jazz">Jazz</option>
                    <option value="classical">Classical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('레이블', 'Label')}
                  </label>
                  <input
                    type="text"
                    value={formData.album.labelName}
                    onChange={(e) => setFormData({
                      ...formData,
                      album: { ...formData.album, labelName: e.target.value }
                    })}
                    className="input-modern"
                    placeholder={t('예: EDAM Entertainment', 'e.g. EDAM Entertainment')}
                  />
                </div>
              </div>
            </div>

            {/* Release Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                {t('발매 설정', 'Release Settings')}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('카탈로그 번호', 'Catalog Number')}
                  </label>
                  <input
                    type="text"
                    value={formData.releaseSettings.catalogNumber}
                    onChange={(e) => setFormData({
                      ...formData,
                      releaseSettings: { ...formData.releaseSettings, catalogNumber: e.target.value }
                    })}
                    className="input-modern"
                    placeholder="N3RVE-001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    UPC
                  </label>
                  <input
                    type="text"
                    value={formData.releaseSettings.upc}
                    onChange={(e) => setFormData({
                      ...formData,
                      releaseSettings: { ...formData.releaseSettings, upc: e.target.value }
                    })}
                    className="input-modern"
                    placeholder="12 digits"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('저작권', 'Copyright')} ©
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={formData.releaseSettings.copyright.year}
                      onChange={(e) => setFormData({
                        ...formData,
                        releaseSettings: {
                          ...formData.releaseSettings,
                          copyright: { ...formData.releaseSettings.copyright, year: parseInt(e.target.value) }
                        }
                      })}
                      className="input-modern w-24"
                      min="2020"
                      max="2030"
                    />
                    <input
                      type="text"
                      value={formData.releaseSettings.copyright.owner}
                      onChange={(e) => setFormData({
                        ...formData,
                        releaseSettings: {
                          ...formData.releaseSettings,
                          copyright: { ...formData.releaseSettings.copyright, owner: e.target.value }
                        }
                      })}
                      className="input-modern flex-1"
                      placeholder={t('저작권 소유자', 'Copyright owner')}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('녹음 저작권', 'Recording Copyright')} ℗
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={formData.releaseSettings.recordingCopyright.year}
                      onChange={(e) => setFormData({
                        ...formData,
                        releaseSettings: {
                          ...formData.releaseSettings,
                          recordingCopyright: { ...formData.releaseSettings.recordingCopyright, year: parseInt(e.target.value) }
                        }
                      })}
                      className="input-modern w-24"
                      min="2020"
                      max="2030"
                    />
                    <input
                      type="text"
                      value={formData.releaseSettings.recordingCopyright.owner}
                      onChange={(e) => setFormData({
                        ...formData,
                        releaseSettings: {
                          ...formData.releaseSettings,
                          recordingCopyright: { ...formData.releaseSettings.recordingCopyright, owner: e.target.value }
                        }
                      })}
                      className="input-modern flex-1"
                      placeholder={t('녹음 저작권 소유자', 'Recording copyright owner')}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 1: // Tracks & Credits
        return (
          <div className="space-y-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('트랙 & 크레딧', 'Tracks & Credits')}
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">
                  {formData.tracks.length} {t('트랙', 'tracks')}
                </span>
                <button
                  onClick={() => setIsTranslationMode(!isTranslationMode)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg transition-all",
                    isTranslationMode 
                      ? "bg-purple-600 text-white" 
                      : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  )}
                >
                  <Languages className="w-4 h-4" />
                  {t('번역 모드', 'Translation Mode')}
                </button>
              </div>
            </div>

            {formData.tracks.map((track, trackIndex) => (
              <div key={track.id} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Music className="w-5 h-5 text-pink-600" />
                    {t('트랙', 'Track')} {trackIndex + 1}
                    {track.isTitle && (
                      <span className="ml-2 px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 text-xs rounded-full">
                        {t('타이틀', 'Title')}
                      </span>
                    )}
                  </h3>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={track.isTitle}
                        onChange={(e) => {
                          const newTracks = [...formData.tracks]
                          // Only one title track allowed
                          newTracks.forEach(t => t.isTitle = false)
                          newTracks[trackIndex].isTitle = e.target.checked
                          setFormData({ ...formData, tracks: newTracks })
                        }}
                        className="rounded text-purple-600"
                      />
                      {t('타이틀곡', 'Title Track')}
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={track.dolbyAtmos}
                        onChange={(e) => {
                          const newTracks = [...formData.tracks]
                          newTracks[trackIndex].dolbyAtmos = e.target.checked
                          setFormData({ ...formData, tracks: newTracks })
                        }}
                        className="rounded text-purple-600"
                      />
                      Dolby Atmos
                    </label>
                    {trackIndex > 0 && (
                      <button
                        onClick={() => {
                          const newTracks = formData.tracks.filter((_, i) => i !== trackIndex)
                          setFormData({ ...formData, tracks: newTracks })
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Track Title */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('곡명 (한글)', 'Track Title (Korean)')} *
                      </label>
                      <input
                        type="text"
                        value={track.titleKo}
                        onChange={(e) => {
                          const newTracks = [...formData.tracks]
                          newTracks[trackIndex].titleKo = e.target.value
                          setFormData({ ...formData, tracks: newTracks })
                        }}
                        className="input-modern"
                        placeholder={t('예: 밤편지', 'e.g. Through the Night')}
                      />
                    </div>

                    {isTranslationMode && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t('곡명 (영문)', 'Track Title (English)')}
                        </label>
                        <input
                          type="text"
                          value={track.titleEn}
                          onChange={(e) => {
                            const newTracks = [...formData.tracks]
                            newTracks[trackIndex].titleEn = e.target.value
                            setFormData({ ...formData, tracks: newTracks })
                          }}
                          className="input-modern"
                          placeholder={t('예: Through the Night', 'e.g. Through the Night')}
                        />
                      </div>
                    )}
                  </div>

                  {/* Credits Section */}
                  <div className="border-t pt-4 mt-4">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      {t('크레딧', 'Credits')}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                          {t('작곡', 'Composer')}
                        </label>
                        <input
                          type="text"
                          value={track.credits.composer}
                          onChange={(e) => {
                            const newTracks = [...formData.tracks]
                            newTracks[trackIndex].credits.composer = e.target.value
                            setFormData({ ...formData, tracks: newTracks })
                          }}
                          className="input-modern text-sm"
                          placeholder={t('작곡가', 'Composer')}
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                          {t('작사', 'Lyricist')}
                        </label>
                        <input
                          type="text"
                          value={track.credits.lyricist}
                          onChange={(e) => {
                            const newTracks = [...formData.tracks]
                            newTracks[trackIndex].credits.lyricist = e.target.value
                            setFormData({ ...formData, tracks: newTracks })
                          }}
                          className="input-modern text-sm"
                          placeholder={t('작사가', 'Lyricist')}
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                          {t('편곡', 'Arranger')}
                        </label>
                        <input
                          type="text"
                          value={track.credits.arranger}
                          onChange={(e) => {
                            const newTracks = [...formData.tracks]
                            newTracks[trackIndex].credits.arranger = e.target.value
                            setFormData({ ...formData, tracks: newTracks })
                          }}
                          className="input-modern text-sm"
                          placeholder={t('편곡자', 'Arranger')}
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                          {t('프로듀서', 'Producer')}
                        </label>
                        <input
                          type="text"
                          value={track.credits.producer}
                          onChange={(e) => {
                            const newTracks = [...formData.tracks]
                            newTracks[trackIndex].credits.producer = e.target.value
                            setFormData({ ...formData, tracks: newTracks })
                          }}
                          className="input-modern text-sm"
                          placeholder={t('프로듀서', 'Producer')}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Track Settings */}
                  <div className="border-t pt-4 mt-4">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      {t('트랙 설정', 'Track Settings')}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                          ISRC
                        </label>
                        <input
                          type="text"
                          value={track.settings.isrc}
                          onChange={(e) => {
                            const newTracks = [...formData.tracks]
                            newTracks[trackIndex].settings.isrc = e.target.value
                            setFormData({ ...formData, tracks: newTracks })
                          }}
                          className="input-modern text-sm"
                          placeholder="KR-XXX-XX-XXXXX"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                          {t('언어', 'Language')}
                        </label>
                        <select
                          value={track.settings.language}
                          onChange={(e) => {
                            const newTracks = [...formData.tracks]
                            newTracks[trackIndex].settings.language = e.target.value
                            setFormData({ ...formData, tracks: newTracks })
                          }}
                          className="input-modern text-sm"
                        >
                          <option value="ko">{t('한국어', 'Korean')}</option>
                          <option value="en">{t('영어', 'English')}</option>
                          <option value="ja">{t('일본어', 'Japanese')}</option>
                          <option value="zh">{t('중국어', 'Chinese')}</option>
                        </select>
                      </div>

                      <div>
                        <label className="flex items-center gap-2 text-sm mt-5">
                          <input
                            type="checkbox"
                            checked={track.settings.explicitContent}
                            onChange={(e) => {
                              const newTracks = [...formData.tracks]
                              newTracks[trackIndex].settings.explicitContent = e.target.checked
                              setFormData({ ...formData, tracks: newTracks })
                            }}
                            className="rounded text-red-600"
                          />
                          {t('청소년 유해 컨텐츠', 'Explicit Content')}
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={() => {
                const newTrack = {
                  id: Date.now().toString(),
                  titleKo: '',
                  titleEn: '',
                  isTitle: false,
                  dolbyAtmos: false,
                  audioFile: null,
                  credits: {
                    artists: [''],
                    featuring: [],
                    composer: '',
                    lyricist: '',
                    arranger: '',
                    producer: '',
                    mixer: '',
                    masterer: ''
                  },
                  settings: {
                    isrc: '',
                    explicitContent: false,
                    genre: '',
                    subgenre: '',
                    language: 'ko'
                  }
                }
                setFormData({
                  ...formData,
                  tracks: [...formData.tracks, newTrack]
                })
              }}
              className="btn-primary w-full"
            >
              <Plus className="w-4 h-4" />
              {t('트랙 추가', 'Add Track')}
            </button>
          </div>
        )

      case 2: // File Upload
        return (
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              {t('파일 업로드', 'File Upload')}
            </h2>

            {/* Album Artwork */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                {t('앨범 아트워크', 'Album Artwork')}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('앨범 커버', 'Album Cover')} *
                  </label>
                  <FileUpload
                    accept="image/*"
                    onFileSelect={(file) => setFormData({
                      ...formData,
                      album: { ...formData.album, coverArt: file }
                    })}
                    currentFile={formData.album.coverArt}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {t('최소 3000x3000px, JPG/PNG', 'Min 3000x3000px, JPG/PNG')}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('아티스트 사진', 'Artist Photo')}
                  </label>
                  <FileUpload
                    accept="image/*"
                    onFileSelect={(file) => {
                      const newArtists = [...formData.artists]
                      newArtists[0].photo = file
                      setFormData({ ...formData, artists: newArtists })
                    }}
                    currentFile={formData.artists[0].photo}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('프레스 사진', 'Press Photo')}
                  </label>
                  <FileUpload
                    accept="image/*"
                    onFileSelect={(file) => setFormData({
                      ...formData,
                      marketing: {
                        ...formData.marketing,
                        pressKit: { ...formData.marketing.pressKit, pressPhoto: file }
                      }
                    })}
                    currentFile={formData.marketing.pressKit.pressPhoto}
                  />
                </div>
              </div>
            </div>

            {/* Audio Files */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Music className="w-5 h-5 text-green-600" />
                {t('오디오 파일', 'Audio Files')}
              </h3>

              <div className="space-y-4">
                {formData.tracks.map((track, index) => (
                  <div key={track.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {index + 1}. {track.titleKo || track.titleEn || t('무제', 'Untitled')}
                        {track.dolbyAtmos && (
                          <span className="ml-2 text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
                            Dolby Atmos
                          </span>
                        )}
                      </h4>
                      {track.audioFile && (
                        <span className="text-green-600 text-sm">
                          ✓ {t('업로드됨', 'Uploaded')}
                        </span>
                      )}
                    </div>
                    
                    <FileUpload
                      accept="audio/*"
                      onFileSelect={(file) => {
                        const newTracks = [...formData.tracks]
                        newTracks[index].audioFile = file
                        setFormData({ ...formData, tracks: newTracks })
                      }}
                      currentFile={track.audioFile}
                    />
                    
                    {track.audioFile && (
                      <div className="mt-2">
                        <AudioPlayer file={track.audioFile} />
                      </div>
                    )}
                    
                    <p className="text-xs text-gray-500 mt-1">
                      {t('WAV, FLAC 권장 (최소 16bit/44.1kHz)', 'WAV, FLAC recommended (min 16bit/44.1kHz)')}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Upload Summary */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start">
                <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    {t('업로드 현황', 'Upload Status')}
                  </h4>
                  <ul className="mt-2 text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    <li className={formData.album.coverArt ? 'line-through' : ''}>
                      {formData.album.coverArt ? '✓' : '○'} {t('앨범 커버 이미지', 'Album cover image')}
                    </li>
                    <li className={formData.tracks.every(t => t.audioFile) ? 'line-through' : ''}>
                      {formData.tracks.every(t => t.audioFile) ? '✓' : '○'} {t('모든 트랙 오디오 파일', 'All track audio files')} 
                      ({formData.tracks.filter(t => t.audioFile).length}/{formData.tracks.length})
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )

      case 3: // Distribution Settings
        return (
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              {t('배급 설정', 'Distribution Settings')}
            </h2>

            {/* Region Selection */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-green-600" />
                {t('배급 지역', 'Distribution Regions')}
              </h3>

              <RegionSelector
                selected={formData.distribution.regions}
                onChange={(regions) => setFormData({
                  ...formData,
                  distribution: { ...formData.distribution, regions }
                })}
              />
            </div>

            {/* Korean DSP Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Radio className="w-5 h-5 text-yellow-600" />
                {t('한국 음원 플랫폼', 'Korean Music Platforms')}
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(formData.distribution.koreanDSP).map(([platform, enabled]) => (
                  <label key={platform} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={(e) => setFormData({
                        ...formData,
                        distribution: {
                          ...formData.distribution,
                          koreanDSP: {
                            ...formData.distribution.koreanDSP,
                            [platform]: e.target.checked
                          }
                        }
                      })}
                      className="rounded text-purple-600"
                    />
                    <span className="text-sm capitalize">{platform}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Pricing Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-600" />
                {t('가격 설정', 'Pricing Settings')}
              </h3>

              <div className="space-y-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.distribution.pricing.preOrder}
                    onChange={(e) => setFormData({
                      ...formData,
                      distribution: {
                        ...formData.distribution,
                        pricing: {
                          ...formData.distribution.pricing,
                          preOrder: e.target.checked
                        }
                      }
                    })}
                    className="rounded text-purple-600"
                  />
                  <span className="text-sm">{t('사전 예약 활성화', 'Enable Pre-order')}</span>
                </label>

                {formData.distribution.pricing.preOrder && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('사전 예약 시작일', 'Pre-order Start Date')}
                    </label>
                    <input
                      type="date"
                      value={formData.distribution.pricing.preOrderDate}
                      onChange={(e) => setFormData({
                        ...formData,
                        distribution: {
                          ...formData.distribution,
                          pricing: {
                            ...formData.distribution.pricing,
                            preOrderDate: e.target.value
                          }
                        }
                      })}
                      className="input-modern"
                    />
                  </div>
                )}

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.distribution.pricing.specialPrice}
                    onChange={(e) => setFormData({
                      ...formData,
                      distribution: {
                        ...formData.distribution,
                        pricing: {
                          ...formData.distribution.pricing,
                          specialPrice: e.target.checked
                        }
                      }
                    })}
                    className="rounded text-purple-600"
                  />
                  <span className="text-sm">{t('특별 가격 설정', 'Set Special Price')}</span>
                </label>

                {formData.distribution.pricing.specialPrice && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('판매 가격 (KRW)', 'Sale Price (KRW)')}
                    </label>
                    <input
                      type="number"
                      value={formData.distribution.pricing.priceKRW}
                      onChange={(e) => setFormData({
                        ...formData,
                        distribution: {
                          ...formData.distribution,
                          pricing: {
                            ...formData.distribution.pricing,
                            priceKRW: parseInt(e.target.value)
                          }
                        }
                      })}
                      className="input-modern"
                      placeholder="0"
                    />
                    {formData.distribution.pricing.priceKRW > 0 && (
                      <p className="text-sm text-gray-500 mt-1">
                        {formatPriceKRW(formData.distribution.pricing.priceKRW)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )

      case 4: // Marketing & Promotion
        return (
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              {t('마케팅 & 프로모션', 'Marketing & Promotion')}
            </h2>

            {/* Target Audience */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-yellow-600" />
                {t('타겟 오디언스', 'Target Audience')}
              </h3>

              <textarea
                value={formData.marketing.targetAudience}
                onChange={(e) => setFormData({
                  ...formData,
                  marketing: { ...formData.marketing, targetAudience: e.target.value }
                })}
                className="input-modern"
                rows={3}
                placeholder={t('주요 타겟층을 설명해주세요 (연령, 성별, 관심사 등)', 'Describe your target audience (age, gender, interests, etc.)')}
              />
            </div>

            {/* Key Selling Points */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                {t('핵심 판매 포인트', 'Key Selling Points')}
              </h3>

              <div className="space-y-2">
                {formData.marketing.keySellingPoints.map((point, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={point}
                      onChange={(e) => {
                        const newPoints = [...formData.marketing.keySellingPoints]
                        newPoints[index] = e.target.value
                        setFormData({
                          ...formData,
                          marketing: { ...formData.marketing, keySellingPoints: newPoints }
                        })
                      }}
                      className="input-modern flex-1"
                      placeholder={t('예: 감성적인 보컬', 'e.g. Emotional vocals')}
                    />
                    <button
                      onClick={() => {
                        const newPoints = formData.marketing.keySellingPoints.filter((_, i) => i !== index)
                        setFormData({
                          ...formData,
                          marketing: { ...formData.marketing, keySellingPoints: newPoints }
                        })
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setFormData({
                    ...formData,
                    marketing: {
                      ...formData.marketing,
                      keySellingPoints: [...formData.marketing.keySellingPoints, '']
                    }
                  })}
                  className="btn-secondary text-sm"
                >
                  <Plus className="w-4 h-4" />
                  {t('포인트 추가', 'Add Point')}
                </button>
              </div>
            </div>

            {/* Social Media */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-600" />
                {t('소셜 미디어', 'Social Media')}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(formData.marketing.socialMedia).map(([platform, url]) => (
                  <div key={platform}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 capitalize">
                      {platform}
                    </label>
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => setFormData({
                        ...formData,
                        marketing: {
                          ...formData.marketing,
                          socialMedia: {
                            ...formData.marketing.socialMedia,
                            [platform]: e.target.value
                          }
                        }
                      })}
                      className="input-modern"
                      placeholder={`https://${platform}.com/...`}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Promotion Plans */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-pink-600" />
                {t('프로모션 계획', 'Promotion Plans')}
              </h3>

              <textarea
                value={formData.marketing.promotionPlans}
                onChange={(e) => setFormData({
                  ...formData,
                  marketing: { ...formData.marketing, promotionPlans: e.target.value }
                })}
                className="input-modern"
                rows={4}
                placeholder={t('프로모션 전략을 상세히 설명해주세요', 'Describe your promotion strategy in detail')}
              />
            </div>
          </div>
        )

      case 5: // Review & Submit
        return (
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              {t('최종 검토', 'Final Review')}
            </h2>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Album Info Summary */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                  {t('앨범 정보', 'Album Information')}
                </h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-500">{t('아티스트', 'Artist')}:</dt>
                    <dd className="font-medium">{formData.artists[0].nameKo}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">{t('앨범명', 'Album')}:</dt>
                    <dd className="font-medium">{formData.album.titleKo}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">{t('발매일', 'Release Date')}:</dt>
                    <dd className="font-medium">{formData.album.releaseDate}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">{t('트랙 수', 'Tracks')}:</dt>
                    <dd className="font-medium">{formData.tracks.length}</dd>
                  </div>
                </dl>
              </div>

              {/* Distribution Summary */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                  {t('배급 정보', 'Distribution Info')}
                </h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-500">{t('배급 지역', 'Regions')}:</dt>
                    <dd className="font-medium">{formData.distribution.regions.length}개</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">{t('플랫폼', 'Platforms')}:</dt>
                    <dd className="font-medium">
                      {Object.values(formData.distribution.koreanDSP).filter(v => v).length}개
                    </dd>
                  </div>
                  {formData.distribution.pricing.preOrder && (
                    <div className="flex justify-between">
                      <dt className="text-gray-500">{t('사전예약', 'Pre-order')}:</dt>
                      <dd className="font-medium text-green-600">✓</dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* Files Summary */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                  {t('파일 업로드', 'File Upload')}
                </h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-500">{t('앨범 커버', 'Album Cover')}:</dt>
                    <dd className="font-medium">
                      {formData.album.coverArt ? (
                        <span className="text-green-600">✓</span>
                      ) : (
                        <span className="text-red-600">✗</span>
                      )}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">{t('오디오 파일', 'Audio Files')}:</dt>
                    <dd className="font-medium">
                      {formData.tracks.filter(t => t.audioFile).length}/{formData.tracks.length}
                    </dd>
                  </div>
                  {formData.tracks.some(t => t.dolbyAtmos) && (
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Dolby Atmos:</dt>
                      <dd className="font-medium text-blue-600">
                        {formData.tracks.filter(t => t.dolbyAtmos).length} tracks
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* Marketing Summary */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                  {t('마케팅', 'Marketing')}
                </h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-500">{t('소셜 미디어', 'Social Media')}:</dt>
                    <dd className="font-medium">
                      {Object.values(formData.marketing.socialMedia).filter(v => v).length}개
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">{t('핵심 포인트', 'Key Points')}:</dt>
                    <dd className="font-medium">{formData.marketing.keySellingPoints.length}개</dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Checklist */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    {t('제출 전 확인사항', 'Pre-submission Checklist')}
                  </h4>
                  <ul className="mt-2 text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                    <li>• {t('모든 필수 정보가 정확하게 입력되었는지 확인하세요', 'Ensure all required information is accurately entered')}</li>
                    <li>• {t('오디오 파일이 고품질(WAV 또는 FLAC)인지 확인하세요', 'Ensure audio files are high quality (WAV or FLAC)')}</li>
                    <li>• {t('앨범 커버가 3000x3000 픽셀인지 확인하세요', 'Ensure album cover is 3000x3000 pixels')}</li>
                    <li>• {t('저작권 정보가 정확한지 확인하세요', 'Ensure copyright information is accurate')}</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Submit Progress */}
            {isSubmitting && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                <div className="flex justify-between text-sm mb-2">
                  <span>{t('업로드 진행률', 'Upload Progress')}</span>
                  <span>{Math.round(uploadProgress)}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('릴리즈 제출', 'Release Submission')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('음원을 전 세계에 배포하세요', 'Distribute your music worldwide')}
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6 overflow-x-auto">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className="flex-1 min-w-[120px] cursor-pointer"
                onClick={() => handleStepClick(step.id)}
              >
                <div className="relative">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center mx-auto transition-all",
                      currentStep >= step.id 
                        ? getStepColor(index, true)
                        : getStepColor(index, false),
                      currentStep === step.id && "ring-4 ring-purple-200 dark:ring-purple-800"
                    )}
                  >
                    <step.icon className="w-6 h-6" />
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={cn(
                        "absolute top-6 left-1/2 w-full h-0.5 transition-all",
                        currentStep > step.id ? "bg-purple-600" : "bg-gray-300 dark:bg-gray-600"
                      )}
                    />
                  )}
                </div>
                <div className="mt-2 text-center">
                  <p className={cn(
                    "text-xs font-medium",
                    currentStep >= step.id 
                      ? "text-gray-900 dark:text-white" 
                      : "text-gray-500 dark:text-gray-400"
                  )}>
                    {step.title}
                  </p>
                  {currentStep === step.id && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 hidden md:block">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Mobile step description */}
          <div className="md:hidden text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {steps[currentStep].description}
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          </div>
        )}

        {/* Form Content */}
        <div className="mb-8">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className={cn(
              "btn-secondary",
              currentStep === 0 && "opacity-50 cursor-not-allowed"
            )}
          >
            <ChevronLeft className="w-4 h-4" />
            {t('이전', 'Previous')}
          </button>

          <div className="flex items-center gap-4">
            <button
              onClick={handleSaveDraft}
              className="btn-secondary"
            >
              <Save className="w-4 h-4" />
              {t('임시저장', 'Save Draft')}
            </button>

            {currentStep === steps.length - 1 ? (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="btn-primary"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    {t('제출 중...', 'Submitting...')}
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    {t('제출하기', 'Submit')}
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="btn-primary"
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