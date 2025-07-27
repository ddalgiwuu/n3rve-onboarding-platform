import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLanguageStore } from '@/store/language.store';
import useSafeStore from '@/hooks/useSafeStore';
import { Calendar, Globe, Music, Shield, Clock, FileText, Info, ChevronDown, ChevronRight, AlertCircle, Tag, AlertTriangle, ExternalLink, Camera, Link, Headphones, Film, Disc } from 'lucide-react';
import { continents, allCountries, getExcludedCountriesForDSPs, getCountryByCode, dspExclusions } from '@/data/territories';
import { validateField } from '@/utils/fugaQCValidation';
import QCWarnings from '@/components/submission/QCWarnings';
import { useSubmissionStore } from '@/store/submission.store';
import ValidatedFormInput from '@/components/ValidatedFormInput';

const releaseSchema = (language: 'ko' | 'en') => z.object({
  // 기본 정보
  upc: z.string().optional(),
  catalogNumber: z.string().optional(),
  distributors: z.array(z.string()).min(1, language === 'ko' ? '최소 1개의 유통사를 선택해주세요' : 'Please select at least one distributor'),

  // 발매일 정보
  consumerReleaseDate: z.string().min(1, language === 'ko' ? 'Consumer Release Date는 필수입니다' : 'Consumer Release Date is required'),
  originalReleaseDate: z.string().min(1, language === 'ko' ? 'Original Release Date는 필수입니다' : 'Original Release Date is required'),
  releaseTime: z.string().optional(),
  selectedTimezone: z.string().optional(),

  // 저작권 정보
  cRights: z.string().min(1, language === 'ko' ? 'C Rights는 필수입니다' : 'C Rights is required'),
  pRights: z.string().min(1, language === 'ko' ? 'P Rights는 필수입니다' : 'P Rights is required'),
  copyrightYear: z.string().min(4, language === 'ko' ? '저작권 연도는 필수입니다' : 'Copyright year is required'),

  // 프리뷰 설정
  previewStart: z.number().min(0).max(300).optional(),

  // 가격 설정
  priceType: z.enum(['free', 'paid']),
  price: z.number().optional(),

  // 배포 지역
  territoryType: z.enum(['worldwide', 'select', 'exclude']),
  territories: z.array(z.string()).optional(),

  // 녹음 정보
  recordingCountry: z.string().min(1, language === 'ko' ? '녹음 국가는 필수입니다' : 'Recording country is required'),
  recordingLanguage: z.string().min(1, language === 'ko' ? '녹음 언어는 필수입니다' : 'Recording language is required'),

  // 앨범 노트
  albumNotes: z.string().optional(),

  // 추가 메타데이터
  parentalAdvisory: z.enum(['none', 'explicit', 'clean']).optional(),
  preOrderEnabled: z.boolean().default(false),
  preOrderDate: z.string().optional(),
  releaseFormat: z.enum(['standard', 'deluxe', 'special', 'remastered', 'anniversary', 'remix', 'acoustic', 'live', 'instrumental']).default('standard'),
  releaseVersion: z.string().optional(), // e.g., "Radio Edit", "Extended Mix", "Club Mix"
  isCompilation: z.boolean().default(false),
  previouslyReleased: z.boolean().default(false),
  previousReleaseDate: z.string().optional(),
  previousReleaseInfo: z.string().optional(),
  trackGenres: z.record(z.string(), z.array(z.string())).optional(), // trackId -> genres

  // Advanced Format Options
  dolbyAtmos: z.boolean().default(false),
  hasMotionArt: z.boolean().default(false),
  motionArtSettings: z.object({
    autoPlay: z.boolean().default(true),
    loop: z.boolean().default(true),
    showControls: z.boolean().default(false)
  }).optional(),

  // DSP Profile Update
  dspProfileUpdate: z.object({
    updateProfile: z.boolean().default(false),
    internationalFormCompleted: z.boolean().default(false)
  }).optional(),

  // Album Introduction
  albumIntroduction: z.string().optional(),

  // 한국 DSP 정보
  koreanDSP: z.object({
    lyricsAttached: z.boolean(),
    artistPageLink: z.string().optional(),
    melonLink: z.string().optional(),
    genieLink: z.string().optional(),
    bugsLink: z.string().optional(),
    vibeLink: z.string().optional(),
    translation: z.object({
      hasTranslation: z.boolean(),
      koreanTitle: z.string().optional(),
      englishTitle: z.string().optional(),
      artistNameKo: z.string().optional(),
      artistNameEn: z.string().optional(),
      labelNameKo: z.string().optional(),
      labelNameEn: z.string().optional()
    }).optional(),
    newArtist: z.boolean().default(false),
    albumCredits: z.string().optional()
  }).optional(),

  // 추가 요청사항
  notes: z.string().optional()
});

type ReleaseForm = z.infer<ReturnType<typeof releaseSchema>>

const distributors = [
  { id: 'spotify', name: 'Spotify', icon: '🎵' },
  { id: 'apple', name: 'Apple Music', icon: '🍎' },
  { id: 'youtube', name: 'YouTube Music', icon: '📺' },
  { id: 'melon', name: 'Melon', icon: '🍈' },
  { id: 'genie', name: 'Genie', icon: '🧞' },
  { id: 'bugs', name: 'Bugs', icon: '🐛' },
  { id: 'flo', name: 'FLO', icon: '🌊' },
  { id: 'vibe', name: 'VIBE', icon: '🎧' },
  { id: 'tiktok', name: 'TikTok', icon: '🎤' },
  { id: 'instagram', name: 'Instagram', icon: '📷' }
];

// Using countries from territories.ts now

const languages = [
  { code: 'ko', name: '한국어' },
  { code: 'en', name: '영어' },
  { code: 'ja', name: '일본어' },
  { code: 'zh', name: '중국어' },
  { code: 'instrumental', name: 'Instrumental' },
  { code: 'other', name: '기타' }
];

// Common timezones for music release - organized by region
const timezones = [
  // Most common/recommended
  { value: 'Asia/Seoul', label: '🇰🇷 Seoul (UTC+9) - Recommended', offset: 9 },
  { value: 'UTC', label: '🌍 UTC (Universal Time)', offset: 0 },

  // Asia-Pacific
  { value: 'Pacific/Auckland', label: '🇳🇿 Auckland (UTC+12/+13)', offset: 12 },
  { value: 'Australia/Sydney', label: '🇦🇺 Sydney (UTC+10/+11)', offset: 10 },
  { value: 'Asia/Tokyo', label: '🇯🇵 Tokyo (UTC+9)', offset: 9 },
  { value: 'Asia/Shanghai', label: '🇨🇳 Beijing/Shanghai (UTC+8)', offset: 8 },
  { value: 'Asia/Singapore', label: '🇸🇬 Singapore (UTC+8)', offset: 8 },
  { value: 'Asia/Dubai', label: '🇦🇪 Dubai (UTC+4)', offset: 4 },

  // Europe
  { value: 'Europe/London', label: '🇬🇧 London (UTC+0/+1)', offset: 0 },
  { value: 'Europe/Paris', label: '🇫🇷 Paris/Berlin (UTC+1/+2)', offset: 1 },

  // Americas
  { value: 'America/New_York', label: '🇺🇸 New York (UTC-5/-4)', offset: -5 },
  { value: 'America/Chicago', label: '🇺🇸 Chicago (UTC-6/-5)', offset: -6 },
  { value: 'America/Los_Angeles', label: '🇺🇸 Los Angeles (UTC-8/-7)', offset: -8 }
];

interface Props {
  data: any
  onNext: (data: ReleaseForm) => void
  onPrevious: () => void
}

export default function Step5ReleaseInfo({ data, onNext, onPrevious }: Props) {
  const language = useSafeStore(useLanguageStore, (state) => state.language);
  const t = (ko: string, en: string) => language === 'ko' ? ko : en;
  const { formData, updateFormData, setCurrentStep } = useSubmissionStore();
  const savedData = formData.release;

  const [showKoreanDSP, setShowKoreanDSP] = useState(false);
  const [hasTranslation, setHasTranslation] = useState(false);
  const [expandedContinents, setExpandedContinents] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [dspExcludedCountries, setDspExcludedCountries] = useState<string[]>([]);
  const [selectedTimezone, setSelectedTimezone] = useState(savedData?.selectedTimezone || 'Asia/Seoul'); // Load saved timezone or default
  const [isOriginalDateManuallySet, setIsOriginalDateManuallySet] = useState(false);

  const { register, handleSubmit, formState: { errors }, watch, setValue, getValues } = useForm<ReleaseForm>({
    resolver: zodResolver(releaseSchema(language)),
    defaultValues: savedData || data?.release || {
      distributors: [],
      priceType: 'paid',
      copyrightYear: new Date().getFullYear().toString(),
      territoryType: 'worldwide',
      previewStart: 0,
      selectedTimezone: 'Asia/Seoul', // Default to Seoul timezone
      koreanDSP: {
        lyricsAttached: false,
        newArtist: false,
        translation: {
          hasTranslation: false
        }
      },
      dspProfileUpdate: {
        updateProfile: false,
        internationalFormCompleted: false
      }
    }
  });

  // Auto-save form data every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const currentData = getValues();
      updateFormData({ release: currentData });
    }, 5000);

    return () => clearInterval(interval);
  }, [getValues, updateFormData]);

  // Save data when component unmounts
  useEffect(() => {
    return () => {
      const currentData = getValues();
      updateFormData({ release: currentData });
    };
  }, [getValues, updateFormData]);

  // Update current step
  useEffect(() => {
    setCurrentStep(5);
  }, [setCurrentStep]);

  // Check if original date was manually set on load
  useEffect(() => {
    const consumerDate = watch('consumerReleaseDate');
    const originalDate = watch('originalReleaseDate');

    // If dates are different on load, it means original date was manually set
    if (consumerDate && originalDate && consumerDate !== originalDate) {
      setIsOriginalDateManuallySet(true);
    }
  }, []);

  // Consumer date is already watched above
  // Watch for consumer date changes and auto-fill original date
  useEffect(() => {
    if (consumerReleaseDate && !isOriginalDateManuallySet) {
      setValue('originalReleaseDate', consumerReleaseDate);
    }
  }, [consumerReleaseDate, isOriginalDateManuallySet, setValue]);

  // Custom submit handler to save timezone with form data
  const handleFormSubmit = (formData: ReleaseForm) => {
    // Save to store before submitting
    const dataWithTimezone = {
      ...formData,
      selectedTimezone // Save the selected timezone
    };
    updateFormData({ release: dataWithTimezone });

    onNext(dataWithTimezone);
  };

  const selectedDistributors = watch('distributors') || [];
  const priceType = watch('priceType');
  const territoryType = watch('territoryType');
  const territories = watch('territories') || [];
  const copyrightYear = watch('copyrightYear');
  const cRights = watch('cRights');
  const pRights = watch('pRights');
  const consumerReleaseDate = watch('consumerReleaseDate');
  const releaseTime = watch('releaseTime');

  // Time conversion helper functions
  const convertTimeToUTC = (time: string, fromTimezone: string) => {
    const timezone = timezones.find(tz => tz.value === fromTimezone);
    if (!timezone) return time;

    const [hours, minutes] = time.split(':').map(Number);
    let utcHours = hours - timezone.offset;

    if (utcHours < 0) {
      utcHours += 24;
    } else if (utcHours >= 24) {
      utcHours -= 24;
    }

    return `${utcHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const convertTimeFromUTC = (time: string, toTimezone: string) => {
    const timezone = timezones.find(tz => tz.value === toTimezone);
    if (!timezone) return time;

    const [hours, minutes] = time.split(':').map(Number);
    let localHours = hours + timezone.offset;

    if (localHours < 0) {
      localHours += 24;
    } else if (localHours >= 24) {
      localHours -= 24;
    }

    return `${localHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  // Get display time for UTC conversion
  const getUTCTimeDisplay = () => {
    if (!releaseTime || !consumerReleaseDate) return '';

    const utcTime = convertTimeToUTC(releaseTime, selectedTimezone);
    const selectedTz = timezones.find(tz => tz.value === selectedTimezone);

    if (!selectedTz) return '';

    // Calculate if date changes
    const [hours] = releaseTime.split(':').map(Number);
    const [utcHours] = utcTime.split(':').map(Number);

    let dateNote = '';
    if (selectedTz.offset > 0 && utcHours < hours) {
      dateNote = ` ${t('release.previousDay', '(Previous Day)')}`;
    } else if (selectedTz.offset < 0 && utcHours > hours) {
      dateNote = ` ${t('release.nextDay', '(Next Day)')}`;
    }

    return `UTC ${utcTime}${dateNote}`;
  };

  // Real-time QC validation
  const qcValidationResults = useMemo(() => {
    const results = [];

    if (copyrightYear || cRights || pRights) {
      results.push(...validateField('copyrightYear', copyrightYear || '', { cRights, pRights }));
    }

    if (consumerReleaseDate) {
      results.push(...validateField('releaseDate', consumerReleaseDate));
    }

    return results;
  }, [copyrightYear, cRights, pRights, consumerReleaseDate]);

  // Update DSP exclusions when distributors change
  useEffect(() => {
    const excluded = getExcludedCountriesForDSPs(selectedDistributors);
    setDspExcludedCountries(excluded);
  }, [selectedDistributors]);

  // Update selected countries when territories change
  useEffect(() => {
    setSelectedCountries(territories);
  }, [territories]);

  const toggleDistributor = (distributorId: string) => {
    const current = selectedDistributors;
    if (current.includes(distributorId)) {
      setValue('distributors', current.filter(d => d !== distributorId));
    } else {
      setValue('distributors', [...current, distributorId]);
    }

    // 한국 DSP가 선택되었는지 확인
    const koreanDSPs = ['melon', 'genie', 'bugs', 'flo', 'vibe'];
    const hasKoreanDSP = [...current, distributorId].some(d => koreanDSPs.includes(d));
    setShowKoreanDSP(hasKoreanDSP);
  };

  // UPC 자동 생성 (실제로는 서버에서 생성)
  const generateUPC = () => {
    const upc = '880' + Math.random().toString().substr(2, 9);
    setValue('upc', upc);
  };

  return (
    <form onSubmit={handleSubmit(
      handleFormSubmit,
      (errors) => {
        // Find first error and scroll to it
        const firstErrorField = Object.keys(errors)[0];
        let elementId = '';

        switch(firstErrorField) {
          case 'distributors':
            elementId = 'distributors-section';
            break;
          case 'originalReleaseDate':
          case 'consumerReleaseDate':
          case 'releaseTime':
            elementId = 'release-date-section';
            break;
          case 'cRights':
          case 'pRights':
          case 'copyrightYear':
            elementId = 'copyright-section';
            break;
          case 'recordingCountry':
          case 'recordingLanguage':
            elementId = 'recording-info-section';
            break;
          default:
            elementId = 'basic-info-section';
        }

        if (elementId) {
          const element = document.getElementById(elementId);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Add visual indicator
            element.classList.add('ring-2', 'ring-red-500', 'ring-offset-2');
            setTimeout(() => {
              element.classList.remove('ring-2', 'ring-red-500', 'ring-offset-2');
            }, 3000);
          }
        }
      }
    )} className="w-full h-full">
      <div className="space-y-4">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('onboarding.step5', 'Step 5: Release Information')}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">{t('text.onboarding.step5.description', 'Configure release information and distribution settings')}</p>
        </div>

        {/* 기본 정보 */}
        <div id="basic-info-section" className="bg-gray-50 dark:bg-gray-700 rounded-xl p-5 mb-4 transition-all">
          <div className="flex items-center gap-2 mb-3">
            <Music className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('release.basicInfo', 'Basic Information')}</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {t('release.upc', 'UPC')}
              </label>
              <div className="flex gap-2">
                <input
                  {...register('upc')}
                  type="text"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                  placeholder={t('release.upc.placeholder', 'Auto-generated')}
                  readOnly
                />
                <button
                  type="button"
                  onClick={generateUPC}
                  className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                >
                  {t('release.upc.generate', 'Generate')}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {t('release.catalogNumber', 'Catalog Number')}
              </label>
              <input
                {...register('catalogNumber')}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                placeholder={t('release.catalogNumber.placeholder', 'e.g., N3RVE-2024-001')}
              />
            </div>
          </div>
        </div>

        {/* 유통사 선택 */}
        <div id="distributors-section" className="bg-gray-50 dark:bg-gray-700 rounded-xl p-5 mb-4 transition-all">
          <div className="flex items-center gap-2 mb-3">
            <Globe className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('release.distributors', 'Distributors')} <span className="text-red-500">*</span>
            </h3>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
            {distributors.map(distributor => (
              <button
                key={distributor.id}
                type="button"
                onClick={() => toggleDistributor(distributor.id)}
                className={`
                  p-2 rounded-lg border-2 transition-all text-center
                  ${selectedDistributors.includes(distributor.id)
                ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
              }
                `}
              >
                <div className="text-xl mb-0.5">{distributor.icon}</div>
                <div className="text-xs font-medium">{distributor.name}</div>
              </button>
            ))}
          </div>
          {errors.distributors && (
            <p className="mt-2 text-sm text-red-500">{errors.distributors.message}</p>
          )}
        </div>

        {/* 발매일 및 시간 정보 - COMBINED SECTION */}
        <div id="release-date-section" className="bg-gray-50 dark:bg-gray-700 rounded-xl p-5 mb-4 transition-all">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{language === 'ko' ? '발매일 및 시간 정보' : 'Release Date & Time Information'}</h3>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/10 rounded-lg p-3 mb-4 border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-medium mb-1">
                  {language === 'ko' ? '✨ 발매일 자동 설정' : '✨ Release Date Auto-fill'}
                </p>
                <p>
                  {language === 'ko' ? '컨슈머 발매일을 입력하면 오리지널 발매일이 자동으로 동일하게 설정됩니다!' : 'When you enter Consumer Release Date, Original Release Date will be automatically set to the same date!'}
                </p>
              </div>
            </div>
          </div>

          {/* Date Fields */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Consumer Release Date <span className="text-red-500">*</span>
              </label>
              <input
                {...register('consumerReleaseDate')}
                type="date"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">
                {language === 'ko' ? '실제 공개일 (스트리밍 서비스에서 음악이 공개되는 날짜)' : 'Actual release date (When music becomes available on streaming services)'}
              </p>
              {errors.consumerReleaseDate && (
                <p className="text-xs text-red-500">{errors.consumerReleaseDate.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Original Release Date <span className="text-red-500">*</span>
              </label>
              <input
                {...register('originalReleaseDate')}
                type="date"
                onChange={(e) => {
                  setValue('originalReleaseDate', e.target.value);
                  setIsOriginalDateManuallySet(true);
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">
                {language === 'ko' ? '최초 발매일 (음악이 처음 발매된 날짜, 신곡이면 Consumer와 동일)' : 'Original release date (When music was first released, same as Consumer for new releases)'}
              </p>
              {errors.originalReleaseDate && (
                <p className="text-xs text-red-500">{errors.originalReleaseDate.message}</p>
              )}
            </div>
          </div>

          {/* Time Settings */}
          <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-600" />
                {language === 'ko' ? '발매 시간 설정' : 'Release Time Settings'}
              </h4>
              <p className="text-xs text-gray-500 mb-3">
                {language === 'ko' ? '선택사항: 특정 시간에 발매하려면 설정하세요. 비워두면 자정(00:00)에 발매됩니다.' : 'Optional: Set if you want to release at a specific time. Leave empty to release at midnight (00:00).'}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {language === 'ko' ? '타임존 선택' : 'Select Timezone'}
                </label>
                <select
                  value={selectedTimezone}
                  onChange={(e) => setSelectedTimezone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                >
                  {timezones.map(tz => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  {language === 'ko' ? '발매 시간의 기준 타임존을 선택하세요. 한국 시간(KST)이 기본값입니다.' : 'Choose the timezone for your release time. Korea Time (KST) is the default.'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {language === 'ko' ? '발매 시간' : 'Release Time'}
                  <span className="text-xs text-gray-500 ml-2">({language === 'ko' ? '선택사항' : 'Optional'})</span>
                </label>
                <div
                  className="relative group cursor-pointer"
                  onClick={() => {
                    const input = document.getElementById('release-time-input') as HTMLInputElement;
                    if (input) {
                      input.showPicker();
                    }
                  }}
                >
                  <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 hover:border-purple-400 dark:hover:border-purple-600 transition-colors flex items-center justify-between">
                    <input
                      {...register('releaseTime')}
                      id="release-time-input"
                      type="time"
                      className="bg-transparent border-none focus:outline-none flex-1 text-gray-900 dark:text-white text-sm"
                      placeholder="00:00"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <Clock className="w-4 h-4 text-gray-400 group-hover:text-purple-500 transition-colors" />
                  </div>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {language === 'ko' ? `${timezones.find(tz => tz.value === selectedTimezone)?.label.split(' ')[0] || selectedTimezone} 기준 시간 (비워두면 00:00 자정)` : `Time in ${timezones.find(tz => tz.value === selectedTimezone)?.label.split(' ')[0] || selectedTimezone} (leave empty for 00:00 midnight)`}
                </p>
              </div>
            </div>

            {/* UTC Conversion Display */}
            {releaseTime && consumerReleaseDate && (
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-2 mb-1">
                  <Globe className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <h5 className="text-sm font-medium text-purple-900 dark:text-purple-100">
                    {language === 'ko' ? 'UTC 변환' : 'UTC Conversion'}
                  </h5>
                </div>
                <p className="text-sm text-purple-800 dark:text-purple-200">
                  {language === 'ko' ? '전 세계 기준시(UTC)로 변환하면' : 'Converted to Universal Time (UTC)'}: <span className="font-bold">{getUTCTimeDisplay()}</span>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 발매일 안내 - 개선된 설명 */}
        <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-4 mb-4 border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                {language === 'ko' ? '발매일 설정 안내' : 'Release Date Guide'}
              </h4>
              <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <p>
                  <span className="font-medium">Consumer Release Date:</span> {language === 'ko' ? '실제 음악이 공개되는 날짜' : 'When music becomes available to consumers'}
                </p>
                <p>
                  <span className="font-medium">Original Release Date:</span> {language === 'ko' ? '음악이 처음 발매된 날짜' : 'When music was first released'}
                </p>
                <div className="mt-2 text-xs bg-blue-100 dark:bg-blue-800/30 rounded p-2">
                  <p className="font-medium mb-1">{language === 'ko' ? '💡 자동 설정 기능:' : '💡 Auto-fill Feature:'}</p>
                  <p>• {language === 'ko' ? '컨슈머 발매일을 입력하면 오리지널 발매일이 자동으로 같은 날짜로 설정됩니다' : 'When you enter Consumer Release Date, Original Release Date is automatically set to the same date'}</p>
                  <p>• {language === 'ko' ? '신곡의 경우 두 날짜가 동일합니다' : 'For new releases, both dates should be the same'}</p>
                  <p>• {language === 'ko' ? '재발매/리마스터의 경우 오리지널 날짜를 별도로 수정하세요' : 'For re-releases/remasters, modify the Original date separately'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Timed Release Information Warning */}
        <div className="bg-amber-50 dark:bg-amber-900/10 rounded-xl p-4 mb-4 border border-amber-200 dark:border-amber-800">
          <div className="flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-1">
                {t('release.timedReleaseTitle', 'Timed Release Information')}
              </h4>
              <p className="text-xs text-amber-800 dark:text-amber-200 mb-2">
                {t('release.timedReleaseNotice', 'Please note that some DSPs may not support exact time release. Most platforms release at midnight local time.')}
              </p>
              <p className="text-xs font-medium text-amber-900 dark:text-amber-100 mb-1">
                {t('release.timedReleaseWorkaround', 'Workaround for timed release:')}
              </p>
              <ul className="space-y-0.5 text-xs text-amber-800 dark:text-amber-200">
                <li>{t('release.timedReleaseStep1', '1. Release at midnight first')}</li>
                <li>{t('release.timedReleaseStep2', '2. Update release time after initial release')}</li>
                <li>{t('release.timedReleaseStep3', '3. Coordinate with DSP support for specific timing')}</li>
              </ul>
              <p className="mt-2 text-xs text-amber-700 dark:text-amber-300 italic">
                {t('release.timedReleaseExample', 'Example: For a 6 PM release, set midnight first, then request time change.')}
              </p>
            </div>
          </div>
        </div>

        {/* 저작권 정보 */}
        <div id="copyright-section" className="bg-gray-50 dark:bg-gray-700 rounded-xl p-5 mb-4 transition-all">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('release.copyrightInfo', 'Copyright Information')}</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('release.cRights', 'C Rights (Copyright)')} <span className="text-red-500">*</span>
              </label>
              <input
                {...register('cRights')}
                type="text"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder={t('release.cRights.placeholder', 'e.g., N3RVE Entertainment')}
              />
              {errors.cRights && (
                <p className="mt-1 text-sm text-red-500">{errors.cRights.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('release.pRights', 'P Rights (Phonogram)')} <span className="text-red-500">*</span>
              </label>
              <input
                {...register('pRights')}
                type="text"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder={t('release.pRights.placeholder', 'e.g., N3RVE Entertainment')}
              />
              {errors.pRights && (
                <p className="mt-1 text-sm text-red-500">{errors.pRights.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('release.copyrightYear', 'Copyright Year')} <span className="text-red-500">*</span>
              </label>
              <input
                {...register('copyrightYear')}
                type="text"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder={new Date().getFullYear().toString()}
              />
              {errors.copyrightYear && (
                <p className="mt-1 text-sm text-red-500">{errors.copyrightYear.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* 프리뷰 설정 */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('release.preview', 'Preview Settings')}</h3>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('release.previewStart', 'Preview Start Time (seconds)')}
            </label>
            <input
              {...register('previewStart', { valueAsNumber: true })}
              type="number"
              min="0"
              max="300"
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="0"
            />
            <p className="mt-1 text-xs text-gray-500">{t('release.previewStartDesc', 'Set the start time for preview samples (0-300 seconds)')}</p>
          </div>
        </div>

        {/* 배포 지역 */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('release.territorySelection', 'Territory Selection')}</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-3">
                <input
                  {...register('territoryType')}
                  type="radio"
                  value="worldwide"
                  className="text-purple-600"
                />
                <span className="text-sm font-medium">{t('release.worldwide', 'Worldwide')}</span>
              </label>
            </div>

            <div>
              <label className="flex items-center gap-3">
                <input
                  {...register('territoryType')}
                  type="radio"
                  value="select"
                  className="text-purple-600"
                />
                <span className="text-sm font-medium">{t('release.selectSpecificCountries', 'Select Specific Countries')}</span>
              </label>
            </div>

            {territoryType === 'select' && (
              <div className="mt-6 space-y-4">
                {/* Selected Countries Count */}
                <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <span className="text-sm font-medium text-purple-900 dark:text-purple-100">
                    {t('release.selectedCountries', 'Selected Countries')}
                  </span>
                  <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                    {t('release.countriesSelected', `${selectedCountries.length} countries selected`)}
                  </span>
                </div>

                {/* DSP Exclusions Warning */}
                {dspExcludedCountries.length > 0 && (
                  <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-2">
                          {t('release.dspExclusions', 'DSP Exclusions')}
                        </p>
                        <p className="text-xs text-amber-800 dark:text-amber-200 mb-2">
                          {t('release.dspExclusionNotice', 'The following countries are excluded by selected DSPs:')}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {dspExcludedCountries.map(code => {
                            const country = getCountryByCode(code);
                            if (!country) return null;

                            // Find which DSPs exclude this country
                            const excludingDSPs = selectedDistributors.filter(dsp => {
                              const exclusions = dspExclusions[dsp as keyof typeof dspExclusions];
                              return exclusions && exclusions.includes(code);
                            });

                            return (
                              <div key={code} className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 dark:bg-amber-800/30 rounded text-xs">
                                <span className="font-medium">
                                  {t(`country.${code}`, country.name)}
                                </span>
                                <span className="text-amber-600 dark:text-amber-400">
                                  ({excludingDSPs.map(dsp => distributors.find(d => d.id === dsp)?.name).join(', ')})
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Continents with Countries */}
                <div className="space-y-2">
                  {continents.map(continent => {
                    const isExpanded = expandedContinents.includes(continent.id);
                    const continentCountries = continent.countries;
                    const selectedInContinent = continentCountries.filter(c => selectedCountries.includes(c.code)).length;

                    return (
                      <div key={continent.id} className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                        {/* Continent Header */}
                        <div className="bg-gray-100 dark:bg-gray-800 p-3">
                          <div className="flex items-center justify-between">
                            <button
                              type="button"
                              onClick={() => {
                                setExpandedContinents(prev =>
                                  isExpanded
                                    ? prev.filter(id => id !== continent.id)
                                    : [...prev, continent.id]
                                );
                              }}
                              className="flex items-center gap-2 text-left flex-1"
                            >
                              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                              <span className="font-medium">
                                {t(`continent.${continent.id}`, continent.name)}
                              </span>
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                ({selectedInContinent}/{continentCountries.length})
                              </span>
                            </button>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  const allCodes = continentCountries.map(c => c.code);
                                  const newSelected = [...new Set([...selectedCountries, ...allCodes])];
                                  setSelectedCountries(newSelected);
                                  setValue('territories', newSelected);
                                }}
                                className="text-xs px-2 py-1 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded"
                              >
                                {t('release.selectAll', 'Select All')}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const continentCodes = continentCountries.map(c => c.code);
                                  const newSelected = selectedCountries.filter(code => !continentCodes.includes(code));
                                  setSelectedCountries(newSelected);
                                  setValue('territories', newSelected);
                                }}
                                className="text-xs px-2 py-1 text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                              >
                                {t('release.deselectAll', 'Deselect All')}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Countries Grid */}
                        {isExpanded && (
                          <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {continentCountries.map(country => {
                              const isExcluded = dspExcludedCountries.includes(country.code);
                              const isChecked = selectedCountries.includes(country.code);

                              return (
                                <label
                                  key={country.code}
                                  className={`flex items-center gap-2 text-sm ${
                                    isExcluded ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    value={country.code}
                                    checked={isChecked}
                                    disabled={isExcluded}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        const newSelected = [...selectedCountries, country.code];
                                        setSelectedCountries(newSelected);
                                        setValue('territories', newSelected);
                                      } else {
                                        const newSelected = selectedCountries.filter(c => c !== country.code);
                                        setSelectedCountries(newSelected);
                                        setValue('territories', newSelected);
                                      }
                                    }}
                                    className="text-purple-600 disabled:opacity-50"
                                  />
                                  <span className={isExcluded ? 'line-through' : ''}>
                                    {t(`country.${country.code}`, country.name)}
                                  </span>
                                  {isExcluded && (
                                    <span className="text-xs text-amber-600 dark:text-amber-400">⚠️</span>
                                  )}
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 기타 정보 */}
        <div id="recording-info-section" className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 mb-6 transition-all">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('release.recordingCountry', 'Recording Country')} <span className="text-red-500">*</span>
              </label>
              <select
                {...register('recordingCountry')}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="">{t('common.select', 'Select')}</option>
                {allCountries.slice(0, 50).map(country => (
                  <option key={country.code} value={country.code}>
                    {t(`country.${country.code}`, country.name)}
                  </option>
                ))}
              </select>
              {errors.recordingCountry && (
                <p className="mt-1 text-sm text-red-500">{errors.recordingCountry.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('release.recordingLanguage', 'Recording Language')} <span className="text-red-500">*</span>
              </label>
              <select
                {...register('recordingLanguage')}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="">{t('common.select', 'Select')}</option>
                {languages.map(language => (
                  <option key={language.code} value={language.code}>
                    {language.name}
                  </option>
                ))}
              </select>
              {errors.recordingLanguage && (
                <p className="mt-1 text-sm text-red-500">{errors.recordingLanguage.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('release.priceType', 'Price Type')} <span className="text-red-500">*</span>
              </label>
              <select
                {...register('priceType')}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="paid">{t('release.paid', 'Paid')}</option>
                <option value="free">{t('release.free', 'Free')}</option>
              </select>
            </div>

            {priceType === 'paid' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('release.price', 'Price')}
                </label>
                <input
                  {...register('price', { valueAsNumber: true })}
                  type="number"
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder={t('release.price.placeholder', 'e.g., 700')}
                />
              </div>
            )}
          </div>
        </div>

        {/* Advanced Format Options */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Headphones className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('release.advancedFormats', 'Advanced Format Options')}</h3>
          </div>

          <div className="space-y-4">
            {/* Dolby Atmos */}
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <label className="flex items-start gap-3">
                <input
                  {...register('dolbyAtmos')}
                  type="checkbox"
                  className="text-purple-600 mt-1"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('Dolby Atmos 지원', 'Dolby Atmos Support')}
                  </span>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {t('Dolby Atmos 파일을 업로드하려면 체크하세요', 'Check to upload Dolby Atmos files')}
                  </p>
                  {watch('dolbyAtmos') && (
                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                      <div className="flex items-start gap-2">
                        <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                        <div className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                          <p className="font-medium">{t('Dolby Atmos 요구사항', 'Dolby Atmos Requirements')}:</p>
                          <ul className="space-y-0.5 ml-4">
                            <li>• ADM BWF format master file</li>
                            <li>• 48kHz/24-bit audio</li>
                            <li>• Binaural stereo render (required)</li>
                            <li>• Dolby Atmos metadata file</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </label>
            </div>

            {/* Motion Art */}
            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
              <label className="flex items-start gap-3">
                <input
                  {...register('hasMotionArt')}
                  type="checkbox"
                  className="text-purple-600 mt-1"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Film className="w-4 h-4" />
                    {t('Motion Art 지원', 'Motion Art Support')}
                  </span>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {t('Motion Art 파일을 업로드하려면 체크하세요', 'Check to upload Motion Art files')}
                  </p>

                  {watch('hasMotionArt') && (
                    <div className="mt-4 space-y-3 ml-6">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('Motion Art 설정', 'Motion Art Settings')}
                      </h4>
                      <label className="flex items-center gap-3">
                        <input
                          {...register('motionArtSettings.autoPlay')}
                          type="checkbox"
                          className="text-purple-600"
                        />
                        <span className="text-sm">{t('자동 재생', 'Auto Play')}</span>
                      </label>
                      <label className="flex items-center gap-3">
                        <input
                          {...register('motionArtSettings.loop')}
                          type="checkbox"
                          className="text-purple-600"
                        />
                        <span className="text-sm">{t('반복 재생', 'Loop')}</span>
                      </label>
                      <label className="flex items-center gap-3">
                        <input
                          {...register('motionArtSettings.showControls')}
                          type="checkbox"
                          className="text-purple-600"
                        />
                        <span className="text-sm">{t('컨트롤 표시', 'Show Controls')}</span>
                      </label>
                    </div>
                  )}
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* 릴리즈 메타데이터 */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Tag className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('메타데이터', 'Metadata')}</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('등급 표시', 'Parental Advisory')}
              </label>
              <select
                {...register('parentalAdvisory')}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="none">{t('없음', 'None')}</option>
                <option value="explicit">{t('성인', 'Explicit')}</option>
                <option value="clean">{t('전체이용가', 'Clean')}</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">{t('앨범의 등급 표시를 선택하세요', 'Select parental advisory rating for the album')}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('릴리즈 포맷', 'Release Format')}
              </label>
              <div className="relative">
                <select
                  {...register('releaseFormat')}
                  className="w-full px-4 py-3 pr-10 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white font-medium transition-all appearance-none"
                >
                  <option value="standard">{t('스탠다드', 'Standard')}</option>
                  <option value="deluxe">{t('디럭스', 'Deluxe')}</option>
                  <option value="special">{t('스페셜', 'Special')}</option>
                  <option value="remastered">{t('리마스터드', 'Remastered')}</option>
                  <option value="anniversary">{t('기념판', 'Anniversary')}</option>
                  <option value="remix">{t('리믹스', 'Remix')}</option>
                  <option value="acoustic">{t('어쿠스틱', 'Acoustic')}</option>
                  <option value="live">{t('라이브', 'Live')}</option>
                  <option value="instrumental">{t('인스트루멘탈', 'Instrumental')}</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {t('앨범의 형식을 선택하세요. 리믹스, 리마스터, 어쿠스틱 등', 'Select the album format. Remix, remaster, acoustic, etc.')}
              </p>
            </div>
          </div>

          {/* Release Version Field */}
          {(watch('releaseFormat') === 'remix' || watch('releaseFormat') === 'remastered' || watch('releaseFormat') === 'special') && (
            <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('릴리즈 버전', 'Release Version')}
                <span className="text-xs text-gray-500 ml-2">({t('선택사항', 'Optional')})</span>
              </label>
              <input
                {...register('releaseVersion')}
                type="text"
                className="w-full px-4 py-3 border-2 border-purple-200 dark:border-purple-700 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all"
                placeholder={t('예: Radio Edit, Extended Mix, Club Mix, Acoustic Version', 'e.g., Radio Edit, Extended Mix, Club Mix, Acoustic Version')}
              />
              <p className="mt-2 text-xs text-purple-600 dark:text-purple-400">
                {t('릴리즈의 특정 버전을 명시할 수 있습니다. 예: 라디오 편집판, 확장판, 클럽 믹스 등', 'You can specify the specific version of the release. e.g., Radio Edit, Extended Version, Club Mix, etc.')}
              </p>
            </div>
          )}

          {/* Release Format Info Box */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <Disc className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  {t('릴리즈 포맷 가이드', 'Release Format Guide')}
                </h4>
                <div className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                  <p><span className="font-medium">{t('스탠다드', 'Standard')}:</span> {t('일반적인 앨범 발매', 'Regular album release')}</p>
                  <p><span className="font-medium">{t('리믹스', 'Remix')}:</span> {t('기존 곡을 재해석한 버전', 'Reinterpreted version of existing tracks')}</p>
                  <p><span className="font-medium">{t('리마스터', 'Remaster')}:</span> {t('음질 개선된 재발매', 'Re-release with improved sound quality')}</p>
                  <p><span className="font-medium">{t('어쿠스틱', 'Acoustic')}:</span> {t('어쿠스틱 악기 버전', 'Acoustic instrument version')}</p>
                  <p><span className="font-medium">{t('라이브', 'Live')}:</span> {t('라이브 공연 녹음', 'Live performance recording')}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <label className="flex items-center gap-3">
              <input
                {...register('isCompilation')}
                type="checkbox"
                className="text-purple-600"
              />
              <div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('컴필레이션 앨범', 'Compilation Album')}
                </span>
                <p className="text-xs text-gray-500">{t('다양한 아티스트의 곡이 포함된 앨범', 'Album containing tracks from various artists')}</p>
              </div>
            </label>

            <label className="flex items-center gap-3">
              <input
                {...register('preOrderEnabled')}
                type="checkbox"
                className="text-purple-600"
                onChange={(e) => {
                  const checked = e.target.checked;
                  setValue('preOrderEnabled', checked);
                  if (!checked) {
                    setValue('preOrderDate', '');
                  }
                }}
              />
              <div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('사전 주문', 'Pre-order')}
                </span>
                <p className="text-xs text-gray-500">{t('발매 전 사전 주문을 받습니다', 'Accept pre-orders before release')}</p>
              </div>
            </label>

            {watch('preOrderEnabled') && (
              <div className="ml-7">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('사전 주문 날짜', 'Pre-order Date')}
                </label>
                <input
                  {...register('preOrderDate')}
                  type="date"
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
            )}

            <label className="flex items-center gap-3">
              <input
                {...register('previouslyReleased')}
                type="checkbox"
                className="text-purple-600"
                onChange={(e) => {
                  const checked = e.target.checked;
                  setValue('previouslyReleased', checked);
                  if (!checked) {
                    setValue('previousReleaseDate', '');
                    setValue('previousReleaseInfo', '');
                  }
                }}
              />
              <div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('이전 발매', 'Previously Released')}
                </span>
                <p className="text-xs text-gray-500">{t('이전에 발매된 적이 있습니다', 'Has been previously released')}</p>
              </div>
            </label>

            {watch('previouslyReleased') && (
              <div className="ml-7 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('이전 발매일', 'Previous Release Date')}
                  </label>
                  <input
                    {...register('previousReleaseDate')}
                    type="date"
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('이전 발매 정보', 'Previous Release Information')}
                  </label>
                  <textarea
                    {...register('previousReleaseInfo')}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder={t('이전 발매에 대한 상세 정보를 입력하세요', 'Enter details about the previous release')}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* DSP Profile Update */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Camera className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('DSP 프로필 업데이트', 'DSP Profile Update')}</h3>
          </div>

          <div className="space-y-4">
            <label className="flex items-center gap-3">
              <input
                {...register('dspProfileUpdate.updateProfile')}
                type="checkbox"
                className="text-purple-600"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('DSP 프로필 업데이트 요청', 'Request DSP Profile Update')}
              </span>
            </label>

            {watch('dspProfileUpdate.updateProfile') && (
              <div className="ml-7 space-y-4">
                {/* International DSP Profile Update */}
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                    {t('국제 DSP 프로필 업데이트', 'International DSP Profile Update')}
                  </h4>
                  <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                    {t('국제 DSP 프로필 정보를 업데이트하려면 아래 양식을 작성하세요', 'Fill out the form below to update international DSP profile information')}
                  </p>
                  <a
                    href="https://form.jotform.com/your-form-id" // Replace with actual JotForm URL
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {t('양식 작성하기', 'Fill out Form')}
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>

                {/* Korean DSP Profile Update Info */}
                {showKoreanDSP && (
                  <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                    <h4 className="font-medium text-amber-900 dark:text-amber-100 mb-2">
                      {t('한국 DSP 프로필 정보', 'Korean DSP Profile Information')}
                    </h4>
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      {t('한국 DSP 프로필은 별도로 관리됩니다', 'Korean DSP profiles are managed separately')}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Album Introduction */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('앨범 소개', 'Album Introduction')}</h3>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            {t('앨범에 대한 소개를 작성하세요', 'Write an introduction for the album')}
          </p>

          <textarea
            {...register('albumIntroduction')}
            rows={6}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            placeholder={t('앨범의 컨셉, 제작 배경, 메시지 등을 상세히 소개해주세요', 'Please provide details about the album concept, production background, message, etc.')}
          />
        </div>

        {/* 앨범 노트 */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('앨범 노트', 'Album Notes')}</h3>
          </div>

          <textarea
            {...register('albumNotes')}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            placeholder={t('앨범에 대한 추가 정보나 메모를 입력하세요', 'Enter additional information or notes about the album')}
          />
          <p className="mt-1 text-xs text-gray-500">{t('release.albumNotes.note', 'Displayed only on domestic music sites')}</p>
        </div>

        {/* 한국 DSP 정보 */}
        {showKoreanDSP && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-6 border border-yellow-200 dark:border-yellow-800 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Info className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('한국 DSP 정보', 'Korean DSP Information')}</h3>
            </div>

            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-3">
                    <input
                      {...register('koreanDSP.lyricsAttached')}
                      type="checkbox"
                      className="text-purple-600"
                    />
                    <span className="text-sm font-medium">{t('가사 첨부', 'Lyrics Attached')}</span>
                  </label>
                </div>

                <div>
                  <label className="flex items-center gap-3">
                    <input
                      {...register('koreanDSP.newArtist')}
                      type="checkbox"
                      className="text-purple-600"
                    />
                    <div>
                      <span className="text-sm font-medium">{t('신인 아티스트', 'New Artist')}</span>
                      <p className="text-xs text-gray-500">{t('처음 발매하는 아티스트입니다', 'This is the artist\'s first release')}</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Artist Page Links */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <Link className="w-4 h-4" />
                  {t('아티스트 페이지 링크', 'Artist Page Links')}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('Melon 링크', 'Melon Link')}
                    </label>
                    <input
                      {...register('koreanDSP.melonLink')}
                      type="url"
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      placeholder={t('https://www.melon.com/artist/...', 'https://www.melon.com/artist/...')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('Genie 링크', 'Genie Link')}
                    </label>
                    <input
                      {...register('koreanDSP.genieLink')}
                      type="url"
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      placeholder={t('https://www.genie.co.kr/artist/...', 'https://www.genie.co.kr/artist/...')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('Bugs 링크', 'Bugs Link')}
                    </label>
                    <input
                      {...register('koreanDSP.bugsLink')}
                      type="url"
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      placeholder={t('https://music.bugs.co.kr/artist/...', 'https://music.bugs.co.kr/artist/...')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('VIBE 링크', 'VIBE Link')}
                    </label>
                    <input
                      {...register('koreanDSP.vibeLink')}
                      type="url"
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      placeholder={t('https://vibe.naver.com/artist/...', 'https://vibe.naver.com/artist/...')}
                    />
                  </div>
                </div>
              </div>

              {/* Translation Section */}
              <div>
                <label className="flex items-center gap-3 mb-3">
                  <input
                    type="checkbox"
                    checked={hasTranslation}
                    onChange={(e) => {
                      setHasTranslation(e.target.checked);
                      setValue('koreanDSP.translation.hasTranslation', e.target.checked);
                    }}
                    className="text-purple-600"
                  />
                  <span className="text-sm font-medium">{t('번역', 'Translation')}</span>
                </label>

                {hasTranslation && (
                  <div className="space-y-4">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        <Info className="w-4 h-4 inline mr-1" />
                        {t('한국 DSP용 번역 정보를 제공하세요', 'Provide translation information for Korean DSPs')}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t('아티스트명 번역', 'Artist Name Translation')} (한글)
                        </label>
                        <input
                          {...register('koreanDSP.translation.artistNameKo')}
                          type="text"
                          className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          defaultValue={data?.artist?.nameKo}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t('아티스트명 번역', 'Artist Name Translation')} (English)
                        </label>
                        <input
                          {...register('koreanDSP.translation.artistNameEn')}
                          type="text"
                          className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          defaultValue={data?.artist?.nameEn}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t('레이블명 번역', 'Label Name Translation')} (한글)
                        </label>
                        <ValidatedFormInput
                          fieldId="label-translation-ko"
                          validationType="label"
                          register={register('koreanDSP.translation.labelNameKo')}
                          error={errors.koreanDSP?.translation?.labelNameKo}
                          showInlineWarnings={true}
                          language={language}
                          className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          placeholder={t('예: 엔쓰리브 엔터테인먼트', 'e.g., N3RVE Entertainment', '例: N3RVE Entertainment')}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t('레이블명 번역', 'Label Name Translation')} (English)
                        </label>
                        <ValidatedFormInput
                          fieldId="label-translation-en"
                          validationType="label"
                          register={register('koreanDSP.translation.labelNameEn')}
                          error={errors.koreanDSP?.translation?.labelNameEn}
                          showInlineWarnings={true}
                          language="en"
                          className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          placeholder="e.g., N3RVE Entertainment"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Album Credits */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('앨범 크레딧', 'Album Credits')}
                </label>
                <textarea
                  {...register('koreanDSP.albumCredits')}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder={t('앨범 크레딧 정보를 입력하세요', 'Enter album credits information')}
                />
              </div>
            </div>
          </div>
        )}

        {/* QC Validation Warnings */}
        {qcValidationResults.length > 0 && (
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-xl p-6 border border-orange-200 dark:border-orange-700 mb-6 shadow-sm">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 bg-orange-100 dark:bg-orange-800/30 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t('품질 검사 보고서', 'Quality Check Report')}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                  {t('제출하기 전에 다음 사항들을 확인하세요', 'Please review the following items before submitting')}
                </p>
              </div>
            </div>
            <QCWarnings results={qcValidationResults} />
          </div>
        )}

        {/* 추가 요청사항 */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('추가 요청사항', 'Additional Notes')}</h3>
          </div>

          <textarea
            {...register('notes')}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            placeholder={t('release.notes.placeholder', 'Enter any special requests or notes')}
          />
        </div>
      </div>
    </form>
  );
}
