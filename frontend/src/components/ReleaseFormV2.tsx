import { useState, useEffect } from 'react'
import { ChevronRight, ChevronLeft, Save, Upload, Check, Info } from 'lucide-react'
import { useLanguageStore } from '@/store/language.store'
import useSafeStore from '@/hooks/useSafeStore'
import FileSpecsGuide from './FileSpecsGuide'
import ContributorForm from './ContributorForm'
import ReleaseDateSettings from './ReleaseDateSettings'
import CopyrightInfo from './CopyrightInfo'
import MobileFormNav from './MobileFormNav'
import TrackList from './TrackList'
import ValidationWarning, { ValidationWarning as ValidationWarningType } from './ValidationWarning'
import { 
  validateAlbumTitle, 
  validateArtistName, 
  createValidationState 
} from '@/utils/inputValidation'
// import { v4 as uuidv4 } from 'uuid' // Reserved for future use

// Form sections - reorganized from 12-13 steps to 7 logical groups
const formSections = [
  {
    id: 'basic',
    title: { ko: '기본 정보', en: 'Basic Information' },
    description: { ko: '릴리즈 타입, 아티스트, 앨범 정보', en: 'Release type, artist, and album information' },
    icon: '🎵'
  },
  {
    id: 'tracks',
    title: { ko: '트랙 정보', en: 'Track Information' },
    description: { ko: '트랙 목록, 아티스트, 기여자', en: 'Track list, artists, contributors' },
    icon: '💿'
  },
  {
    id: 'metadata',
    title: { ko: '메타데이터', en: 'Metadata' },
    description: { ko: 'UPC/EAN, ISRC, 카탈로그 번호 등', en: 'UPC/EAN, ISRC, catalog numbers, etc.' },
    icon: '📊'
  },
  {
    id: 'dates',
    title: { ko: '날짜 설정', en: 'Date Settings' },
    description: { ko: '컨수머 발매일, 원곡 발매일', en: 'Consumer release date, original release date' },
    icon: '📅'
  },
  {
    id: 'copyright',
    title: { ko: '저작권 정보', en: 'Copyright Information' },
    description: { ko: '℗ (음반 제작권), © (저작권)', en: '℗ (Sound recording), © (Copyright)' },
    icon: '©️'
  },
  {
    id: 'contributors',
    title: { ko: '기여자 & 크레딧', en: 'Contributors & Credits' },
    description: { ko: '앨범 전체 프로듀서, 작곡가 등', en: 'Album-wide producers, composers, etc.' },
    icon: '👥'
  },
  {
    id: 'files',
    title: { ko: '파일 업로드', en: 'File Upload' },
    description: { ko: '음원, 아트워크, 모션아트 등', en: 'Audio files, artwork, motion art, etc.' },
    icon: '📁'
  }
]

interface FormData {
  releaseType: string
  primaryArtist: string
  albumTitle: string
  albumVersion: string
  albumArtists: any[]
  tracks: any[]
  upc: string
  catalogNumber: string
  isrc: string
  consumerDate: {
    date: string
    time: string
    timezone: string
  }
  originalDate: {
    date: string
    time: string
    timezone: string
    isReRelease: boolean
  }
  copyright: {
    copyrightHolder: string
    copyrightYear: string
    productionHolder: string
    productionYear: string
  }
  contributors: any[]
  files: {
    audio: File[]
    artwork: File[]
    motionArt: File[]
    dolbyAtmos: File[]
  }
}

export default function ReleaseFormV2() {
  const language = useSafeStore(useLanguageStore, (state) => state.language)
  const t = (ko: string, en: string) => language === 'ko' ? ko : en

  const [currentSection, setCurrentSection] = useState(0)
  const [formData, setFormData] = useState<FormData>({
    releaseType: '',
    primaryArtist: '',
    albumTitle: '',
    albumVersion: '',
    albumArtists: [],
    tracks: [],
    upc: '',
    catalogNumber: '',
    isrc: '',
    consumerDate: {
      date: '',
      time: '00:00',
      timezone: 'Asia/Seoul'
    },
    originalDate: {
      date: '',
      time: '00:00',
      timezone: 'Asia/Seoul',
      isReRelease: false
    },
    copyright: {
      copyrightHolder: '',
      copyrightYear: new Date().getFullYear().toString(),
      productionHolder: '',
      productionYear: new Date().getFullYear().toString()
    },
    contributors: [],
    files: {
      audio: [],
      artwork: [],
      motionArt: [],
      dolbyAtmos: []
    }
  })

  const [showContributorForm, setShowContributorForm] = useState(false)
  const [editingContributor, setEditingContributor] = useState<any>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [validationWarnings, setValidationWarnings] = useState<Record<string, ValidationWarningType[]>>({})
  const [completedSections, setCompletedSections] = useState<number[]>([])
  
  // Validation state management
  const validationState = createValidationState()

  // Auto-save draft
  useEffect(() => {
    const savedDraft = localStorage.getItem('n3rve-release-draft')
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft)
        setFormData(parsed)
      } catch (e) {
        console.error('Failed to load draft:', e)
      }
    }
  }, [])

  useEffect(() => {
    const saveTimer = setTimeout(() => {
      localStorage.setItem('n3rve-release-draft', JSON.stringify(formData))
    }, 2000)
    return () => clearTimeout(saveTimer)
  }, [formData])

  // Section navigation
  const nextSection = () => {
    if (validateCurrentSection()) {
      setCompletedSections(prev => [...new Set([...prev, currentSection])])
      setCurrentSection(prev => Math.min(prev + 1, formSections.length - 1))
    }
  }

  const prevSection = () => {
    setCurrentSection(prev => Math.max(prev - 1, 0))
  }

  const handleSectionChange = (index: number) => {
    if (index < currentSection || completedSections.includes(index - 1) || index === 0) {
      setCurrentSection(index)
    }
  }

  const validateCurrentSection = () => {
    const errors: Record<string, string> = {}
    
    switch (currentSection) {
      case 0: // Basic
        if (!formData.releaseType) errors.releaseType = t('필수 항목입니다', 'Required field')
        if (!formData.primaryArtist) errors.primaryArtist = t('필수 항목입니다', 'Required field')
        if (!formData.albumTitle) errors.albumTitle = t('필수 항목입니다', 'Required field')
        break
      case 1: // Tracks
        if (formData.tracks.length === 0) errors.tracks = t('최소 1개의 트랙이 필요합니다', 'At least 1 track is required')
        break
      case 3: // Dates
        if (!formData.consumerDate.date) errors.consumerDate = t('필수 항목입니다', 'Required field')
        break
      case 4: // Copyright
        if (!formData.copyright.copyrightHolder) errors.copyrightHolder = t('필수 항목입니다', 'Required field')
        if (!formData.copyright.productionHolder) errors.productionHolder = t('필수 항목입니다', 'Required field')
        break
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Progress indicator
  const progress = ((currentSection + 1) / formSections.length) * 100

  // Validation handlers
  const handleFieldValidation = (field: string, value: string, validationType: 'album' | 'artist' | 'track' = 'album') => {
    let result;
    switch (validationType) {
      case 'album':
        result = validateAlbumTitle(value);
        break;
      case 'artist':
        result = validateArtistName(value);
        break;
      default:
        result = validateAlbumTitle(value);
    }

    const activeWarnings = validationState.filterActiveWarnings(result.warnings);
    setValidationWarnings(prev => ({
      ...prev,
      [field]: activeWarnings
    }));

    // Check for errors
    const hasError = activeWarnings.some(w => w.type === 'error');
    if (hasError) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: activeWarnings.find(w => w.type === 'error')?.message || ''
      }));
    } else {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    return result;
  };

  const handleAcceptSuggestion = (warning: ValidationWarningType) => {
    if (warning.suggestedValue) {
      switch (warning.field) {
        case 'albumTitle':
          setFormData(prev => ({ ...prev, albumTitle: warning.suggestedValue! }));
          handleFieldValidation('albumTitle', warning.suggestedValue, 'album');
          break;
        case 'artistName':
        case 'primaryArtist':
          setFormData(prev => ({ ...prev, primaryArtist: warning.suggestedValue! }));
          handleFieldValidation('primaryArtist', warning.suggestedValue, 'artist');
          break;
      }
    }
    validationState.dismissWarning(warning.id);
  };

  const handleDismissWarning = (warning: ValidationWarningType) => {
    validationState.dismissWarning(warning.id);
    setValidationWarnings(prev => ({
      ...prev,
      [warning.field]: prev[warning.field]?.filter(w => w.id !== warning.id) || []
    }));
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Mobile Navigation */}
      <MobileFormNav 
        sections={formSections}
        currentSection={currentSection}
        completedSections={completedSections}
        onSectionChange={handleSectionChange}
      />

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">
            {t('릴리즈 등록', 'Release Registration')}
          </h1>
          <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800">
            <Save className="w-4 h-4" />
            {t('임시 저장됨', 'Auto-saved')}
          </button>
        </div>
        
        <div className="relative">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-purple-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          {/* Section indicators - Hidden on mobile */}
          <div className="absolute top-0 left-0 w-full h-full hidden md:flex justify-between">
            {formSections.map((section, idx) => (
              <div
                key={section.id}
                className={`w-8 h-8 -mt-3 rounded-full flex items-center justify-center text-sm font-medium transition-all cursor-pointer
                  ${idx < currentSection ? 'bg-purple-600 text-white' : 
                    idx === currentSection ? 'bg-purple-600 text-white ring-4 ring-purple-200' : 
                    'bg-gray-300 text-gray-600'}`}
                onClick={() => handleSectionChange(idx)}
              >
                {idx < currentSection ? <Check className="w-4 h-4" /> : section.icon}
              </div>
            ))}
          </div>
        </div>

        {/* Section labels - Hidden on mobile */}
        <div className="hidden md:flex justify-between mt-6">
          {formSections.map((section, idx) => (
            <div 
              key={section.id}
              className={`text-xs ${idx === currentSection ? 'text-purple-600 font-medium' : 'text-gray-500'}`}
            >
              {section.title[language as 'ko' | 'en']}
            </div>
          ))}
        </div>

        {/* Mobile current section indicator */}
        <div className="md:hidden mt-4 text-center">
          <p className="text-sm text-gray-500">
            {t('단계', 'Step')} {currentSection + 1} / {formSections.length}
          </p>
          <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
            {formSections[currentSection].title[language as 'ko' | 'en']}
          </p>
        </div>
      </div>

      {/* Section Content */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
            <span className="text-2xl">{formSections[currentSection].icon}</span>
            {formSections[currentSection].title[language as 'ko' | 'en']}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {formSections[currentSection].description[language as 'ko' | 'en']}
          </p>
        </div>

        {/* Dynamic Section Content */}
        {currentSection === 0 && (
          <div className="space-y-6">
            {/* Release Type */}
            <div>
              <label className="block text-sm font-medium mb-2">
                {t('릴리즈 타입', 'Release Type')} *
              </label>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3">
                {['Single', 'EP', 'Album', 'Compilation'].map(type => (
                  <button
                    key={type}
                    onClick={() => setFormData(prev => ({ ...prev, releaseType: type }))}
                    className={`p-2 md:p-3 text-sm md:text-base rounded-lg border-2 transition-all ${
                      formData.releaseType === type
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-600'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
              {validationErrors.releaseType && (
                <p className="mt-1 text-sm text-red-500">{validationErrors.releaseType}</p>
              )}
            </div>

            {/* Primary Artist */}
            <div>
              <label className="block text-sm font-medium mb-2">
                {t('대표 아티스트', 'Primary Artist')} *
              </label>
              <input
                type="text"
                value={formData.primaryArtist}
                onChange={(e) => setFormData(prev => ({ ...prev, primaryArtist: e.target.value }))}
                onBlur={(e) => handleFieldValidation('primaryArtist', e.target.value, 'artist')}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 ${
                  validationErrors.primaryArtist ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder={t('아티스트명을 입력하세요', 'Enter artist name')}
              />
              {validationWarnings.primaryArtist && validationWarnings.primaryArtist.length > 0 && (
                <ValidationWarning
                  warnings={validationWarnings.primaryArtist}
                  onAcceptSuggestion={handleAcceptSuggestion}
                  onDismissWarning={handleDismissWarning}
                  language={language as 'ko' | 'en'}
                />
              )}
            </div>

            {/* Album Title */}
            <div>
              <label className="block text-sm font-medium mb-2">
                {t('앨범 타이틀', 'Album Title')} *
              </label>
              <input
                type="text"
                value={formData.albumTitle}
                onChange={(e) => setFormData(prev => ({ ...prev, albumTitle: e.target.value }))}
                onBlur={(e) => handleFieldValidation('albumTitle', e.target.value, 'album')}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 ${
                  validationErrors.albumTitle ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder={t('앨범 타이틀을 입력하세요', 'Enter album title')}
              />
              {validationWarnings.albumTitle && validationWarnings.albumTitle.length > 0 && (
                <ValidationWarning
                  warnings={validationWarnings.albumTitle}
                  onAcceptSuggestion={handleAcceptSuggestion}
                  onDismissWarning={handleDismissWarning}
                  language={language as 'ko' | 'en'}
                />
              )}
            </div>

            {/* Album Version */}
            <div>
              <label className="block text-sm font-medium mb-2">
                {t('앨범 버전', 'Album Version')}
                <span className="text-xs text-gray-500 ml-2">
                  {t('(선택사항)', '(Optional)')}
                </span>
              </label>
              <input
                type="text"
                value={formData.albumVersion}
                onChange={(e) => setFormData(prev => ({ ...prev, albumVersion: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700"
                placeholder={t('예: Deluxe Edition, Remastered', 'e.g. Deluxe Edition, Remastered')}
              />
            </div>
          </div>
        )}

        {currentSection === 1 && (
          <TrackList
            tracks={formData.tracks}
            albumArtists={formData.albumArtists}
            releaseType={formData.releaseType as 'Single' | 'EP' | 'Album' | 'Compilation'}
            onUpdate={(tracks) => setFormData(prev => ({ ...prev, tracks }))}
          />
        )}

        {currentSection === 2 && (
          <div className="space-y-6">
            {/* UPC/EAN */}
            <div>
              <label className="block text-sm font-medium mb-2">
                {t('UPC/EAN 코드', 'UPC/EAN Code')}
                <button className="ml-2 text-gray-400 hover:text-gray-600">
                  <Info className="w-4 h-4 inline" />
                </button>
              </label>
              <input
                type="text"
                value={formData.upc}
                onChange={(e) => setFormData(prev => ({ ...prev, upc: e.target.value.replace(/\D/g, '') }))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700"
                placeholder={t('12-13자리 숫자', '12-13 digit number')}
                maxLength={13}
              />
              <p className="mt-1 text-xs text-gray-500">
                {t('자동 생성을 원하시면 비워두세요', 'Leave blank for auto-generation')}
              </p>
            </div>

            {/* Catalog Number */}
            <div>
              <label className="block text-sm font-medium mb-2">
                {t('카탈로그 번호', 'Catalog Number')}
              </label>
              <input
                type="text"
                value={formData.catalogNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, catalogNumber: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700"
                placeholder={t('예: N3RVE-001', 'e.g. N3RVE-001')}
              />
            </div>

            {/* ISRC */}
            <div>
              <label className="block text-sm font-medium mb-2">
                {t('ISRC 코드', 'ISRC Code')}
                <button className="ml-2 text-gray-400 hover:text-gray-600">
                  <Info className="w-4 h-4 inline" />
                </button>
              </label>
              <input
                type="text"
                value={formData.isrc}
                onChange={(e) => setFormData(prev => ({ ...prev, isrc: e.target.value.toUpperCase() }))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700"
                placeholder={t('예: USRC17607839', 'e.g. USRC17607839')}
                maxLength={12}
              />
              <p className="mt-1 text-xs text-gray-500">
                {t('트랙별 ISRC는 트랙 정보 입력 시 설정합니다', 'Track-specific ISRC will be set when entering track information')}
              </p>
            </div>

            {/* Metadata Info Box */}
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                {t('메타데이터란?', 'What is metadata?')}
              </h4>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>• <strong>UPC/EAN</strong>: {t('앨범의 고유 바코드', 'Unique barcode for the album')}</li>
                <li>• <strong>ISRC</strong>: {t('각 트랙의 국제 표준 녹음 코드', 'International Standard Recording Code for each track')}</li>
                <li>• <strong>{t('카탈로그 번호', 'Catalog Number')}</strong>: {t('레이블 내부 관리 번호', 'Label internal management number')}</li>
              </ul>
            </div>
          </div>
        )}

        {currentSection === 3 && (
          <ReleaseDateSettings
            consumerDate={formData.consumerDate}
            originalDate={formData.originalDate}
            onChange={(dates) => setFormData(prev => ({ ...prev, ...dates }))}
          />
        )}

        {currentSection === 4 && (
          <CopyrightInfo
            copyrightData={formData.copyright}
            onChange={(copyright) => setFormData(prev => ({ ...prev, copyright }))}
          />
        )}

        {currentSection === 5 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">{t('기여자 목록', 'Contributors List')}</h3>
              <button
                onClick={() => setShowContributorForm(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                {t('기여자 추가', 'Add Contributor')}
              </button>
            </div>

            {formData.contributors.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                <p className="text-gray-500 mb-4">
                  {t('아직 등록된 기여자가 없습니다', 'No contributors registered yet')}
                </p>
                <button
                  onClick={() => setShowContributorForm(true)}
                  className="text-purple-600 hover:text-purple-700"
                >
                  {t('첫 기여자를 추가하세요', 'Add your first contributor')}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {formData.contributors.map((contributor) => (
                  <div
                    key={contributor.id}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-purple-300 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">{contributor.name}</h4>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {contributor.roles.map((role: string) => (
                            <span
                              key={role}
                              className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs"
                            >
                              {role}
                            </span>
                          ))}
                          {contributor.instruments.map((instrument: string) => (
                            <span
                              key={instrument}
                              className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs"
                            >
                              {instrument}
                            </span>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setEditingContributor(contributor)
                          setShowContributorForm(true)
                        }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {t('수정', 'Edit')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Contributor Form Modal */}
            {showContributorForm && (
              <ContributorForm
                contributor={editingContributor}
                onSave={(contributor) => {
                  if (editingContributor) {
                    setFormData(prev => ({
                      ...prev,
                      contributors: prev.contributors.map(c => 
                        c.id === contributor.id ? contributor : c
                      )
                    }))
                  } else {
                    setFormData(prev => ({
                      ...prev,
                      contributors: [...prev.contributors, contributor]
                    }))
                  }
                  setShowContributorForm(false)
                  setEditingContributor(null)
                }}
                onCancel={() => {
                  setShowContributorForm(false)
                  setEditingContributor(null)
                }}
              />
            )}
          </div>
        )}

        {currentSection === 6 && (
          <div className="space-y-6">
            <FileSpecsGuide type="audio" />
            <FileSpecsGuide type="artwork" />
            <FileSpecsGuide type="motionart" />
            <FileSpecsGuide type="dolbyatmos" />
            
            {/* File upload sections would go here */}
            <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-900/50 rounded-lg text-center">
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 dark:text-gray-400">
                {t('파일 업로드 기능은 현재 개발 중입니다', 'File upload feature is currently under development')}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-8 gap-4">
        <button
          onClick={prevSection}
          disabled={currentSection === 0}
          className={`flex-1 md:flex-none px-4 md:px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition-all ${
            currentSection === 0
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-gray-600 text-white hover:bg-gray-700'
          }`}
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="hidden md:inline">{t('이전', 'Previous')}</span>
        </button>

        <button
          onClick={currentSection === formSections.length - 1 ? () => {} : nextSection}
          className="flex-1 md:flex-none px-4 md:px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2 transition-all"
        >
          {currentSection === formSections.length - 1 ? (
            <>
              {t('제출하기', 'Submit')}
              <Check className="w-5 h-5" />
            </>
          ) : (
            <>
              <span className="hidden md:inline">{t('다음', 'Next')}</span>
              <ChevronRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  )
}