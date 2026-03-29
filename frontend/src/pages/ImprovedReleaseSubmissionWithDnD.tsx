import { useState, useEffect, useRef, useCallback, memo, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Reorder, useDragControls } from 'framer-motion';
import { useLanguageStore } from '@/store/language.store';
import {
  Upload, Music, Image, CheckCircle, X, Plus, Trash2,
  Globe, Users, Disc,
  ChevronRight, ChevronLeft, Info,
  GripVertical,
  HelpCircle, AlertTriangle, AlertCircle, Star,
  ExternalLink, Download,
  ChevronUp, ChevronDown, User, Languages,
  Film, FileText, Folder, Megaphone, Target,
  MoreVertical, Eye, RefreshCw,
  Play, Pause
} from 'lucide-react';
import toast from 'react-hot-toast';
import { submissionService } from '@/services/submission.service';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import useSafeStore from '@/hooks/useSafeStore';
import { validateSubmission, type QCValidationResults } from '@/utils/fugaQCValidation';
import QCWarnings from '@/components/submission/QCWarnings';
import QCErrorModal from '@/components/submission/QCErrorModal';
import PersistentErrorBanner from '@/components/submission/PersistentErrorBanner';
import DatePicker from '@/components/DatePicker';
import { v4 as uuidv4 } from 'uuid';
import MultiSelect from '@/components/ui/MultiSelect';
import SearchableSelect from '@/components/ui/SearchableSelect';
import ArtistManagementModal from '@/components/ArtistManagementModal';
import ContributorManagementModal from '@/components/ContributorManagementModal';
import { genreList, subgenreList } from '@/constants/genres';
import { timezones, convertToUTC } from '@/constants/timezones';
import { generateUPC, generateEAN } from '@/utils/identifiers';
import { dspList } from '@/constants/dspList';
import { SavedArtistsProvider } from '@/contexts/SavedArtistsContext';
import TranslationInput from '@/components/TranslationInput';
import TrackTranslationUI from '@/components/TrackTranslationUI';
import TerritorySelector from '@/components/TerritorySelector';
import LanguageSelector from '@/components/LanguageSelector';
import Step11MarketingDetails from '@/components/steps/Step11MarketingDetails';
import Step12GoalsExpectations from '@/components/steps/Step12GoalsExpectations';
import SearchableMultiSelect from '@/components/ui/SearchableMultiSelect';
import { validateAlbumTitle, validateTrackTitle } from '@/utils/inputValidation';
import ValidatedInput from '@/components/ValidatedInput';
import TrackTitleInput, { TrackWarningsManager } from '@/components/TrackTitleInput';
import { ValidationProvider, useValidationContext } from '@/contexts/ValidationContext';
import ModernWaveform from '@/components/ModernWaveform';
import AudioPlayer from '@/components/AudioPlayer';
import { extractAudioMetadata, formatDuration, formatSampleRate, type AudioMetadata } from '@/utils/audioMetadata';
import DolbyAtmosDecisionCard from '@/components/DolbyAtmosDecisionCard';
import { FinalReviewContent } from '@/components/review';
import SubmissionSuccessModal from '@/components/SubmissionSuccessModal';

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
  );
};

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
  );
};

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
  composers?: Artist[]
  lyricists?: Artist[]
  arrangers?: Artist[]
  publishers?: Artist[]
  isrc?: string
  musicVideoISRC?: string
  hasMusicVideo?: boolean  // Track-level flag for music video
  musicVideoFile?: File    // Track-level music video file
  musicVideoThumbnail?: File  // Track-level music video thumbnail
  duration?: string
  genre?: string
  subgenre?: string
  language?: string
  audioLanguage?: string
  lyrics?: string
  lyricsFile?: File  // Track-level lyrics file
  explicit?: boolean
  explicitContent?: boolean
  remixVersion?: string
  titleLanguage?: 'Korean' | 'English' | 'Japanese' | 'Chinese' | 'Other'
  trackNumber?: number
  dolbyAtmos?: boolean
  volume?: number
  discNumber?: number
  audioFile?: File
  audioMetadata?: AudioMetadata
  translations?: { [key: string]: string }
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
  totalVolumes: number
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
  musicVideoFiles?: File[]
  musicVideoThumbnails?: File[]
  lyricsFiles?: File[]
  marketingAssets?: File[]

  // Distribution
  distributionType: 'all' | 'selected'
  selectedStores: string[]
  excludedStores: string[]
  territories: string[]
  // Territory selection with DSP overrides
  territorySelection: {
    base: {
      mode: 'worldwide' | 'include' | 'exclude'
      territories: string[]
    }
    dspOverrides: Array<{
      dspId: string
      mode: 'include' | 'exclude'
      territories: string[]
    }>
  }
  excludedTerritories: string[]

  // Additional
  albumNote?: string
  marketingInfo?: {
    artist_spotify_id?: string
    artist_apple_id?: string
    artist_facebook_url?: string
    artist_instagram_handle?: string
    marketing_genre?: string
    marketing_subgenre?: string
    pr_line?: string
    internal_note?: string

    // New marketing fields
    priorityLevel?: number
    projectType?: 'FRONTLINE' | 'CATALOG'
    moods?: string[]
    instruments?: string[]
    hook?: string
    mainPitch?: string
    marketingDrivers?: string[]
    socialMediaPlan?: string
    targetAudience?: string
    similarArtists?: string[]
    albumIntroduction?: string
    albumDescription?: string
    marketingKeywords?: string
    promotionPlans?: string

    // Additional social media
    youtubeUrl?: string
    tiktokUrl?: string
    xUrl?: string
    twitchUrl?: string
    threadsUrl?: string
    soundcloudArtistId?: string

    // Artist info
    artistBio?: string
    artistGender?: string
    socialMovements?: string[]
    syncHistory?: string

    // Goals & Expectations
    campaignGoals?: {
      goalType: string
      responses: string[]
      confidence: number
    }[]
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
];

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
];

const ImprovedReleaseSubmissionContent: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { language } = useLanguageStore();
  const user = useSafeStore(useAuthStore, state => state.user);
  const { hasErrors, getSummary, getAllWarnings } = useValidationContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverArtInputRef = useRef<HTMLInputElement>(null);
  // Using validation functions directly from utils

  // Check for edit or resubmit mode
  const editId = searchParams.get('edit');
  const resubmitId = searchParams.get('resubmit');
  const [isEditMode, setIsEditMode] = useState(false);
  const [isResubmitMode, setIsResubmitMode] = useState(false);

  // State for drag and drop
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Audio playback state
  const [playingAudioIndex, setPlayingAudioIndex] = useState<number | null>(null);
  const [audioCurrentTimes, setAudioCurrentTimes] = useState<number[]>([]);
  const audioRefs = useRef<(HTMLAudioElement | null)[]>([]);
  const audioFileInputRef = useRef<HTMLInputElement>(null);
  const [audioMetadata, setAudioMetadata] = useState<(AudioMetadata | null)[]>([]);

  // Dolby Atmos decision state
  const [isDolbyDecisionStep, setIsDolbyDecisionStep] = useState(false);
  const [hasDolbyAtmos, setHasDolbyAtmos] = useState(false);

  // Scroll position preservation
  const scrollPositionRef = useRef<number>(0);
  const activeTrackRef = useRef<string | null>(null);

  const t = (ko: string, en: string, ja?: string) => {
    switch (language) {
      case 'ko': return ko;
      case 'en': return en;
      case 'ja': return ja || en;
      default: return en;
    }
  };

  // Steps
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [showWarnings, setShowWarnings] = useState(false);
  const [showQCErrorModal, setShowQCErrorModal] = useState(false);
  const [validationResults, setValidationResults] = useState<QCValidationResults | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submittedReleaseData, setSubmittedReleaseData] = useState<{
    id?: string;
    albumTitle?: string;
    artistName?: string;
    releaseDate?: string;
    timezone?: string;
    releaseUTC?: Date | string;
  }>({});

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
    totalVolumes: 1,
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
    musicVideoFiles: [],
    musicVideoThumbnails: [],
    lyricsFiles: [],
    marketingAssets: [],
    distributionType: 'all',
    selectedStores: [],
    excludedStores: [],
    territories: [],
    territorySelection: {
      base: {
        mode: 'worldwide',
        territories: []
      },
      dspOverrides: []
    },
    excludedTerritories: [],
    albumNote: '',
    marketingInfo: {}
  });

  // Modal states
  const [showAlbumArtistModal, setShowAlbumArtistModal] = useState(false);
  const [showAlbumFeaturingArtistModal, setShowAlbumFeaturingArtistModal] = useState(false);
  const [showTrackArtistModal, setShowTrackArtistModal] = useState<string | null>(null);
  const [showFeaturingArtistModal, setShowFeaturingArtistModal] = useState<string | null>(null);
  const [showContributorModal, setShowContributorModal] = useState<string | null>(null);

  // Translation states
  const [showAlbumTranslations, setShowAlbumTranslations] = useState(false);
  const [albumTranslationsArray, setAlbumTranslationsArray] = useState<Array<{id: string, language: string, title: string}>>([]);
  const [trackTranslations, setTrackTranslations] = useState<{ [trackId: string]: string[] }>({});
  const [showTrackTranslations, setShowTrackTranslations] = useState<{ [trackId: string]: boolean }>({});

  // Generate display artist name
  const generateDisplayArtist = (mainArtists: Artist[], featuringArtists: Artist[] = []): string => {
    if (mainArtists.length === 0) return '';

    // Join main artists with "and"
    const mainArtistNames = mainArtists.map(artist => artist.name);
    let displayName = mainArtistNames.length === 1
      ? mainArtistNames[0]
      : mainArtistNames.length === 2
        ? `${mainArtistNames[0]} and ${mainArtistNames[1]}`
        : mainArtistNames.slice(0, -1).join(', ') + ' and ' + mainArtistNames[mainArtistNames.length - 1];

    // Add featuring artists if any
    if (featuringArtists.length > 0) {
      const featuringNames = featuringArtists.map(artist => artist.name);
      const featuringPart = featuringNames.length === 1
        ? featuringNames[0]
        : featuringNames.length === 2
          ? `${featuringNames[0]} and ${featuringNames[1]}`
          : featuringNames.slice(0, -1).join(', ') + ' and ' + featuringNames[featuringNames.length - 1];

      displayName += ` featuring ${featuringPart}`;
    }

    return displayName;
  };

  // Update display artist whenever artists change
  useEffect(() => {
    const newDisplayArtist = generateDisplayArtist(formData.albumArtists, formData.albumFeaturingArtists);
    setFormData(prev => ({ ...prev, displayArtist: newDisplayArtist }));
  }, [formData.albumArtists, formData.albumFeaturingArtists]);

  // Initialize albumTranslationsArray from formData.albumTitleTranslations on mount
  // or when loading existing data (e.g., edit mode)
  useEffect(() => {
    if (Object.keys(formData.albumTitleTranslations || {}).length > 0 && albumTranslationsArray.length === 0) {
      const translationsArray = Object.entries(formData.albumTitleTranslations).map(([lang, title]) => ({
        id: `album-trans-${lang}`,
        language: lang,
        title: title
      }));
      setAlbumTranslationsArray(translationsArray);
    }
  }, [formData.albumTitleTranslations]);

  // Load existing submission data for edit/resubmit mode
  useEffect(() => {
    const loadSubmissionData = async (submissionId: string) => {
      try {
        const submission = await submissionService.getSubmissionById(submissionId);

        if (editId) {
          setIsEditMode(true);
          // Load all data for editing
          // TODO: Map submission data to formData structure
          toast.success(t('수정할 데이터를 불러왔습니다', 'Edit data loaded successfully', '編集データを読み込みました'));
        } else if (resubmitId) {
          setIsResubmitMode(true);
          // Load data but clear status-related fields
          // TODO: Map submission data to formData structure
          toast.success(t('재제출할 데이터를 불러왔습니다', 'Resubmission data loaded successfully', '再提出データを読み込みました'));
        }
      } catch (error) {
        console.error('Error loading submission:', error);
        toast.error(t('데이터를 불러오는데 실패했습니다', 'Failed to load submission data', 'データの読み込みに失敗しました'));
        navigate('/submissions');
      }
    };

    if (editId) {
      loadSubmissionData(editId);
    } else if (resubmitId) {
      loadSubmissionData(resubmitId);
    }
  }, [editId, resubmitId, navigate, t]);

  // Audio elements are now managed by JSX (see Line ~2128)
  // useEffect removed to prevent conflict with JSX audio refs

  // Stable audio URLs - prevent re-creation on every render
  const audioUrls = useMemo(() => {
    return formData.audioFiles.map(file => URL.createObjectURL(file));
  }, [formData.audioFiles]);

  // Cleanup URLs on unmount
  useEffect(() => {
    return () => {
      audioUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [audioUrls]);

  // Generate identifiers
  const handleGenerateUPC = () => {
    const upc = generateUPC();
    setFormData(prev => ({ ...prev, upc }));
    toast.success(t('UPC가 생성되었습니다', 'UPC generated successfully', 'UPCが生成されました'));
  };

  // Drag event handlers for native HTML5 drag and drop
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    // Add visual feedback
    const element = e.currentTarget as HTMLElement;
    element.style.opacity = '0.5';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const element = e.currentTarget as HTMLElement;
    element.style.opacity = '1';
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === dropIndex) {
      return;
    }

    const draggedTrack = formData.tracks[draggedIndex];
    const newTracks = [...formData.tracks];

    // Remove dragged item
    newTracks.splice(draggedIndex, 1);

    // Insert at new position
    const insertIndex = draggedIndex < dropIndex ? dropIndex - 1 : dropIndex;
    newTracks.splice(insertIndex, 0, draggedTrack);

    // Update track numbers
    const updatedTracks = newTracks.map((track, idx) => ({
      ...track,
      trackNumber: idx + 1
    }));

    setFormData(prev => ({ ...prev, tracks: updatedTracks }));
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Track management
  const addTrack = () => {
    // Copy album main artists and featuring artists to new track
    const mainArtists = formData.albumArtists || [];
    const featuringArtists = formData.albumFeaturingArtists || [];

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
    };
    setFormData(prev => ({
      ...prev,
      tracks: [...prev.tracks, newTrack]
    }));
  };

  const removeTrack = (trackId: string) => {
    setFormData(prev => ({
      ...prev,
      tracks: prev.tracks
        .filter(t => t.id !== trackId)
        .map((track, idx) => ({ ...track, trackNumber: idx + 1 }))
    }));
  };

  // Scroll position preservation helpers
  const saveScrollPosition = (trackId: string) => {
    scrollPositionRef.current = window.scrollY;
    activeTrackRef.current = trackId;
  };

  const restoreScrollPosition = () => {
    requestAnimationFrame(() => {
      if (activeTrackRef.current) {
        const trackElement = document.getElementById(`track-${activeTrackRef.current}`);
        if (trackElement) {
          trackElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          window.scrollTo({ top: scrollPositionRef.current, behavior: 'smooth' });
        }
      }
      activeTrackRef.current = null;
    });
  };

  const updateTrack = useCallback((trackId: string, updates: Partial<Track>) => {
    setFormData(prev => ({
      ...prev,
      tracks: prev.tracks.map(track => {
        if (track.id !== trackId) return track;

        // Auto-update hasMusicVideo based on musicVideoFile
        const updatedTrack = { ...track, ...updates };

        // If musicVideoFile is being added, auto-check hasMusicVideo
        if (updates.musicVideoFile !== undefined) {
          updatedTrack.hasMusicVideo = updates.musicVideoFile ? true : false;

          // If removing music video file, also clear ISRC and thumbnail
          if (!updates.musicVideoFile) {
            updatedTrack.musicVideoISRC = undefined;
            updatedTrack.musicVideoThumbnail = undefined;
          }
        }

        return updatedTrack;
      })
    }));
  }, []);

  const moveTrackUp = (index: number) => {
    if (index === 0) return;

    const newTracks = [...formData.tracks];
    const temp = newTracks[index - 1];
    newTracks[index - 1] = newTracks[index];
    newTracks[index] = temp;

    // Update track numbers
    const updatedTracks = newTracks.map((track, idx) => ({
      ...track,
      trackNumber: idx + 1
    }));

    setFormData(prev => ({ ...prev, tracks: updatedTracks }));
  };

  const moveTrackDown = (index: number) => {
    if (index >= formData.tracks.length - 1) return;

    const newTracks = [...formData.tracks];
    const temp = newTracks[index + 1];
    newTracks[index + 1] = newTracks[index];
    newTracks[index] = temp;

    // Update track numbers
    const updatedTracks = newTracks.map((track, idx) => ({
      ...track,
      trackNumber: idx + 1
    }));

    setFormData(prev => ({ ...prev, tracks: updatedTracks }));
  };

  // File handling
  const handleAudioFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setFormData(prev => ({
        ...prev,
        audioFiles: [...prev.audioFiles, ...files]
      }));

      // Extract metadata for each file
      const metadataPromises = files.map(file =>
        extractAudioMetadata(file).catch(() => null)
      );
      const newMetadata = await Promise.all(metadataPromises);
      setAudioMetadata(prev => [...prev, ...newMetadata]);

      toast.success(t(`${files.length}개의 오디오 파일이 추가되었습니다`, `${files.length} audio files added`, `${files.length}個のオーディオファイルが追加されました`));
    }
  };

  const handleCoverArtSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, coverArt: file }));
      toast.success(t('커버 아트가 업로드되었습니다', 'Cover art uploaded', 'カバーアートがアップロードされました'));
    }
  };

  const removeAudioFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      audioFiles: prev.audioFiles.filter((_, i) => i !== index)
    }));
    setAudioMetadata(prev => prev.filter((_, i) => i !== index));
    toast.success(t('오디오 파일이 제거되었습니다', 'Audio file removed', 'オーディオファイルが削除されました'));
  };

  // Audio playback handlers
  const toggleAudioPlayback = async (index: number) => {
    console.log(`🎵 [Playback] Button clicked for index ${index}`);
    console.log(`🎵 [Playback] audioRefs.current:`, audioRefs.current);
    console.log(`🎵 [Playback] audioRefs.current.length:`, audioRefs.current.length);

    const audio = audioRefs.current[index];
    console.log(`🎵 [Playback] audio element:`, audio);

    if (!audio) {
      console.error(`❌ [Playback] No audio found at index ${index}`);
      toast.error(t('오디오를 찾을 수 없습니다', 'Audio not found', 'オーディオが見つかりません'));
      return;
    }

    console.log(`🎵 [Playback] Audio properties:`, {
      src: audio.src,
      readyState: audio.readyState,
      volume: audio.volume,
      muted: audio.muted,
      paused: audio.paused
    });

    if (playingAudioIndex === index) {
      console.log(`⏸️ [Playback] Pausing audio ${index}`);
      audio.pause();
      setPlayingAudioIndex(null);
    } else {
      // Pause all other audios
      console.log(`⏹️ [Playback] Pausing all other audios`);
      audioRefs.current.forEach((a, i) => {
        if (a && i !== index) {
          console.log(`⏹️ [Playback] Pausing audio ${i}`);
          a.pause();
        }
      });

      console.log(`▶️ [Playback] Playing audio ${index}`);
      try {
        await audio.play();
        console.log(`✅ [Playback] Audio ${index} playing successfully!`);
        setPlayingAudioIndex(index);
      } catch (error) {
        console.error(`❌ [Playback] Play failed:`, error);
        toast.error(t(
          `재생 실패: ${(error as Error).message}`,
          `Play failed: ${(error as Error).message}`,
          `再生失敗: ${(error as Error).message}`
        ));
      }
    }
  };

  // Reorder audio files
  const handleAudioReorder = (newOrder: File[]) => {
    const oldOrder = formData.audioFiles;
    const newMetadata: (AudioMetadata | null)[] = [];

    // Reorder metadata to match new file order
    newOrder.forEach(file => {
      const oldIndex = oldOrder.findIndex(f => f.name === file.name);
      if (oldIndex !== -1) {
        newMetadata.push(audioMetadata[oldIndex] || null);
      }
    });

    setFormData(prev => ({ ...prev, audioFiles: newOrder }));
    setAudioMetadata(newMetadata);
  };

  // Dolby Atmos decision handler
  const handleDolbyDecision = (hasDolby: boolean) => {
    setHasDolbyAtmos(hasDolby);
    setIsDolbyDecisionStep(false); // Hide Dolby decision page

    // Auto-create tracks from uploaded audio files
    if (formData.audioFiles.length > 0 && formData.tracks.length === 0) {
      const newTracks = formData.audioFiles.map((file, index) => ({
        id: uuidv4(),
        title: file.name.replace(/\.[^/.]+$/, ''), // Remove file extension
        artists: [],
        featuringArtists: [],
        composers: [],
        lyricists: [],
        arrangers: [],
        publishers: [],
        contributors: [],
        translations: {},
        isrc: '',
        explicitContent: false,
        dolbyAtmos: hasDolby,
        trackNumber: index + 1,
        discNumber: 1,
        audioFile: file,
        audioMetadata: audioMetadata[index] || undefined
      }));

      setFormData(prev => ({ ...prev, tracks: newTracks }));
    }

    setCompletedSteps(prev => [...new Set([...prev, 1])]);
    setCurrentStep(2);

    if (hasDolby) {
      toast.info(t(
        'Step 2에서 각 트랙의 Dolby Atmos 파일을 업로드할 수 있습니다',
        'You can upload Dolby Atmos files for each track in Step 2',
        'ステップ2で各トラックのDolby Atmosファイルをアップロードできます'
      ));
    }
  };

  // Validation with visual feedback
  const highlightField = (fieldId: string) => {
    const element = document.getElementById(fieldId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('ring-2', 'ring-red-500', 'ring-offset-2', 'animate-pulse');
      setTimeout(() => {
        element.classList.remove('ring-2', 'ring-red-500', 'ring-offset-2', 'animate-pulse');
      }, 3000);
    }
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1: // Album Info
        if (!formData.albumTitle) {
          toast.error(t('앨범 제목을 입력해주세요', 'Please enter album title', 'アルバムタイトルを入力してください'));
          highlightField('album-title-input');
          return false;
        }

        // Check for validation errors on album title
        const albumTitleErrors = getAllWarnings().filter(w => w.field === 'album-title' && w.type === 'error');
        if (albumTitleErrors.length > 0) {
          toast.error(t('앨범 제목에 오류가 있습니다. 수정해주세요.', 'There are errors in the album title. Please fix them.', 'アルバムタイトルにエラーがあります。修正してください。'));
          highlightField('album-title-input');
          return false;
        }

        if (formData.albumArtists.length === 0) {
          toast.error(t('아티스트명을 입력해주세요', 'Please enter artist name', 'アーティスト名を入力してください'));
          highlightField('album-artist-section');
          return false;
        }

        // Check for validation errors on contributor names
        const contributorErrors = getAllWarnings().filter(w =>
          w.field.startsWith('contributor-name-') && w.type === 'error'
        );
        if (contributorErrors.length > 0) {
          toast.error(t('아티스트명에 오류가 있습니다. 수정해주세요.', 'There are errors in artist names. Please fix them.', 'アーティスト名にエラーがあります。修正してください。'));
          highlightField('album-artist-section');
          return false;
        }

        if (!formData.primaryGenre) {
          toast.error(t('장르를 선택해주세요', 'Please select genre', 'ジャンルを選択してください'));
          highlightField('genre-section');
          return false;
        }
        if (!formData.language) {
          toast.error(t('언어를 선택해주세요', 'Please select language', '言語を選択してください'));
          highlightField('language-section');
          return false;
        }
        if (!formData.consumerReleaseDate) {
          toast.error(t('컨슈머 발매일을 선택해주세요', 'Please select consumer release date', 'コンシューマーリリース日を選択してください'));
          highlightField('consumer-release-date');
          return false;
        }
        if (!formData.originalReleaseDate) {
          toast.error(t('오리지널 발매일을 선택해주세요', 'Please select original release date', 'オリジナルリリース日を選択してください'));
          highlightField('original-release-date');
          return false;
        }
        if (!formData.releaseTime) {
          toast.error(t('발매 시간을 입력해주세요', 'Please enter release time', 'リリース時間を入力してください'));
          highlightField('release-time-input');
          return false;
        }
        // Validate Cover Art (files are now in Step 1)
        if (!formData.coverArt) {
          toast.error(t('커버 아트를 업로드해주세요', 'Please upload cover art', 'カバーアートをアップロードしてください'));
          highlightField('cover-art-upload');
          return false;
        }
        return true;

      case 2: // Tracks
        if (formData.tracks.length === 0) {
          toast.error(t('최소 1개 이상의 트랙을 추가해주세요', 'Please add at least one track', '少なくとも1つのトラックを追加してください'));
          highlightField('add-track-button');
          return false;
        }
        for (const track of formData.tracks) {
          if (!track.title || track.artists.length === 0) {
            toast.error(t('모든 트랙의 제목과 아티스트를 입력해주세요', 'Please enter title and artist for all tracks', 'すべてのトラックのタイトルとアーティストを入力してください'));
            highlightField('tracks-section');
            return false;
          }
        }

        // Check for validation errors on track titles
        const trackErrors = getAllWarnings().filter(w =>
          w.field.startsWith('track-title-') && w.type === 'error'
        );
        if (trackErrors.length > 0) {
          toast.error(t('트랙 제목에 오류가 있습니다. 수정해주세요.', 'There are errors in track titles. Please fix them.', 'トラックタイトルにエラーがあります。修正してください。'));
          highlightField('tracks-section');
          return false;
        }

        // Validate Audio Files (files are now in Step 2)
        if (formData.audioFiles.length !== formData.tracks.length) {
          toast.error(t('트랙 수와 오디오 파일 수가 일치해야 합니다', 'Number of tracks and audio files must match', 'トラック数とオーディオファイル数が一致する必要があります'));
          highlightField('audio-files-upload');
          return false;
        }

        return true;

      case 3: // Distribution
        if (formData.distributionType === 'selected' && formData.selectedStores.length === 0) {
          toast.error(t('최소 1개 이상의 스토어를 선택해주세요', 'Please select at least one store', '少なくとも1つのストアを選択してください'));
          highlightField('store-selection');
          return false;
        }
        // Territory validation is handled by TerritorySelector component
        return true;

      case 4: // Final Review
        return true;

      case 99: // Marketing Details (REMOVED - keeping for reference)
        if (!formData.marketingInfo?.projectType) {
          toast.error(t('프로젝트 타입을 선택해주세요', 'Please select project type', 'プロジェクトタイプを選択してください'));
          return false;
        }
        if (!formData.marketingInfo?.moods || formData.marketingInfo.moods.length === 0) {
          toast.error(t('최소 1개 이상의 무드를 선택해주세요', 'Please select at least one mood', '少なくとも1つのムードを選択してください'));
          return false;
        }
        if (!formData.marketingInfo?.instruments || formData.marketingInfo.instruments.length === 0) {
          toast.error(t('최소 1개 이상의 악기를 선택해주세요', 'Please select at least one instrument', '少なくとも1つの楽器を選択してください'));
          return false;
        }
        if (!formData.marketingInfo?.hook) {
          toast.error(t('Hook을 입력해주세요', 'Please enter your hook', 'フックを入력してください'));
          return false;
        }
        if (!formData.marketingInfo?.mainPitch) {
          toast.error(t('메인 피치를 입력해주세요', 'Please enter your main pitch', 'メインピッチを入力してください'));
          return false;
        }
        if (!formData.marketingInfo?.marketingDrivers || formData.marketingInfo.marketingDrivers.length === 0) {
          toast.error(t('마케팅 드라이버를 입력해주세요', 'Please enter marketing drivers', 'マーケティングドライバーを入力してください'));
          return false;
        }
        if (!formData.marketingInfo?.socialMediaPlan) {
          toast.error(t('소셜 미디어 계획을 입력해주세요', 'Please enter social media plan', 'ソーシャルメディア計画を入力してください'));
          return false;
        }
        return true;

      case 98: // Goals & Expectations (REMOVED)
        // Only require goals if priority is 5 (highest)
        if (formData.marketingInfo?.priorityLevel === 5) {
          if (!formData.marketingInfo?.campaignGoals || formData.marketingInfo.campaignGoals.length === 0) {
            toast.error(t('최소 1개 이상의 목표를 추가해주세요', 'Please add at least one goal', '少なくとも1つの目標を追加してください'));
            return false;
          }
          for (const goal of formData.marketingInfo.campaignGoals) {
            if (!goal.goalType) {
              toast.error(t('모든 목표의 타입을 선택해주세요', 'Please select type for all goals', 'すべての目標のタイプを選択してください'));
              return false;
            }
          }
        }
        return true;

      case 97: // Distribution (REMOVED - now case 3)
        if (formData.distributionType === 'selected' && formData.selectedStores.length === 0) {
          toast.error(t('최소 1개 이상의 스토어를 선택해주세요', 'Please select at least one store', '少なくとも1つのストアを選択してください'));
          highlightField('store-selection');
          return false;
        }
        // Territory validation is handled by TerritorySelector component
        return true;

      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      // Step 1 completed - show Dolby Atmos decision page
      if (currentStep === 1 && formData.audioFiles.length > 0 && !isDolbyDecisionStep) {
        setIsDolbyDecisionStep(true);
        return; // Show Dolby decision page
      }

      setCompletedSteps(prev => [...new Set([...prev, currentStep])]);

      // Skip steps: Only use 1 (Album) → 2 (Tracks) → 6 (Distribution) → 7 (Review)
      // Skip: 3 (Files - duplicate), 4 (Marketing), 5 (Goals)
      let nextStep = currentStep + 1;
      if (currentStep === 2) {
        nextStep = 6; // Skip to Distribution after Tracks
      } else if (currentStep === 6) {
        nextStep = 7; // Go to Final Review after Distribution
      }

      setCurrentStep(nextStep);
    }
  };

  const handleBack = () => {
    if (isDolbyDecisionStep) {
      setIsDolbyDecisionStep(false);
      return;
    }

    // Skip steps when going back: 7 (Review) → 6 (Distribution) → 2 (Tracks) → 1 (Album)
    let prevStep = currentStep - 1;
    if (currentStep === 7) {
      prevStep = 6; // From Review back to Distribution
    } else if (currentStep === 6) {
      prevStep = 2; // From Distribution back to Tracks
    }

    setCurrentStep(Math.max(1, prevStep));
  };

  const handleStepClick = (displayStep: number) => {
    // Map display step (1-4) to actual step (1, 2, 6, 7)
    const stepMapping: Record<number, number> = {
      1: 1, // Album Info
      2: 2, // Tracks
      3: 6, // Distribution
      4: 7  // Final Review
    };

    const actualStep = stepMapping[displayStep];
    if (actualStep && (displayStep <= getCurrentDisplayStep() || completedSteps.includes(actualStep - 1))) {
      setCurrentStep(actualStep);
    }
  };

  // Handle edit navigation from Final Review
  const handleEdit = (stepNumber: number) => {
    // stepNumber is actual step (1, 2, 6)
    // Convert to display step for handleStepClick
    const reverseMapping: Record<number, number> = {
      1: 1, // Album Info
      2: 2, // Tracks
      6: 3, // Distribution
    };

    const displayStep = reverseMapping[stepNumber];
    if (displayStep) {
      handleStepClick(displayStep);
    }
  };

  // Get current display step (1-4) from actual step (1, 2, 6, 7)
  const getCurrentDisplayStep = () => {
    const reverseMapping: Record<number, number> = {
      1: 1,
      2: 2,
      6: 3,
      7: 4
    };
    return reverseMapping[currentStep] || 1;
  };

  // Calculate days until release
  const calculateDaysUntilRelease = (releaseDate: string) => {
    if (!releaseDate) return null;

    const today = new Date();
    const release = new Date(releaseDate);
    const timeDiff = release.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

    return daysDiff;
  };

  // Get marketing opportunity message
  const getMarketingMessage = (daysUntilRelease: number | null) => {
    if (daysUntilRelease === null) return null;

    if (daysUntilRelease < 0) {
      return {
        type: 'error',
        message: t('과거 날짜는 선택할 수 없습니다', 'Cannot select past dates', '過去の日付は選択できません')
      };
    } else if (daysUntilRelease < 7) {
      return {
        type: 'warning',
        message: t('발매일까지 일주일 미만입니다. 마케팅 기회가 매우 제한적입니다.', 'Less than a week until release. Marketing opportunities are very limited.', 'リリースまで1週間未満です。マーケティング機会が非常に限られています。')
      };
    } else if (daysUntilRelease < 21) {
      return {
        type: 'warning',
        message: t(`발매일까지 ${daysUntilRelease}일 남았습니다. 마케팅 기회가 제한적일 수 있습니다.`, `${daysUntilRelease} days until release. Marketing opportunities may be limited.`, `リリースまで${daysUntilRelease}日です。マーケティング機会が制限される可能性があります。`)
      };
    } else if (daysUntilRelease < 28) {
      return {
        type: 'caution',
        message: t(`발매일까지 ${daysUntilRelease}일 남았습니다. 마케팅 기회를 위해 빠른 제출을 권장합니다.`, `${daysUntilRelease} days until release. Quick submission recommended for marketing opportunities.`, `リリースまで${daysUntilRelease}日です。マーケティング機会のために早めの提出をお勧めします。`)
      };
    } else {
      return {
        type: 'success',
        message: t(`발매일까지 ${daysUntilRelease}일 남았습니다. 충분한 마케팅 기회가 있습니다!`, `${daysUntilRelease} days until release. Great marketing opportunities available!`, `リリースまで${daysUntilRelease}日です。十分なマーケティング機会があります！`)
      };
    }
  };

  // Submit
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      // Basic form validation
      if (!formData.consumerReleaseDate) {
        toast.error(t('컨슈머 발매일을 선택해주세요', 'Please select consumer release date', 'コンシューマーリリース日を選択してください'));
        return;
      }

      if (!formData.originalReleaseDate) {
        toast.error(t('오리지널 발매일을 선택해주세요', 'Please select original release date', 'オリジナルリリース日を選択してください'));
        return;
      }

      if (!formData.releaseTime) {
        toast.error(t('발매 시간을 입력해주세요', 'Please enter release time', 'リリース時間を入力してください'));
        return;
      }

      if (!formData.timezone) {
        toast.error(t('타임존을 선택해주세요', 'Please select timezone', 'タイムゾーンを選択してください'));
        return;
      }

      // Run QC validation
      const results = await validateSubmission({
        albumTitle: formData.albumTitle,
        albumArtist: formData.albumArtist || formData.albumArtists.find(a => a.role === 'main')?.name || '',
        tracks: formData.tracks.map(t => ({
          ...t,
          artist: t.artists.map(a => a.name).join(', '),
          contributors: t.contributors || []
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
      });

      setValidationResults(results);

      if (results.errors.length > 0) {
        setShowWarnings(true);
        setShowQCErrorModal(true);
        return;
      }

      if (results.warnings.length > 0) {
        setShowWarnings(true);
        const proceed = window.confirm(t(
          '경고사항이 있습니다. 계속 진행하시겠습니까?',
          'There are warnings. Do you want to proceed?'
        ));
        if (!proceed) return;
      }

      // Prepare submission data
      const submissionData = new FormData();

      // UTC 변환 계산
      const consumerReleaseUTC = formData.consumerReleaseDate && formData.releaseTime && formData.timezone
        ? convertToUTC(formData.consumerReleaseDate, formData.releaseTime, formData.timezone)
        : null;

      const originalReleaseUTC = formData.originalReleaseDate && formData.releaseTime && formData.timezone
        ? convertToUTC(formData.originalReleaseDate, formData.releaseTime, formData.timezone)
        : null;

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
        albumFeaturingArtists: formData.albumFeaturingArtists || [],
        totalVolumes: formData.totalVolumes || 1,
        albumNote: formData.albumNote || '',
        explicitContent: formData.explicitContent || false,
        displayArtist: formData.displayArtist || formData.albumArtist || '',
        tracks: formData.tracks.map(t => ({
          // Include ALL track fields (no file fields - those go separately)
          id: t.id,
          title: t.title,
          titleKo: t.titleTranslations?.ko || t.title,
          titleEn: t.titleTranslations?.en || t.titleTranslation || t.title,
          titleTranslations: t.titleTranslations,
          artists: t.artists?.filter(a => a.role === 'main' || a.role !== 'featured') || [],
          featuringArtists: t.featuringArtists || t.artists?.filter(a => a.role === 'featured') || [],
          contributors: t.contributors || [],
          // Extract composers, lyricists, arrangers from contributors
          composer: t.composers?.map(c => c.name).join(', ') ||
                    t.contributors?.reduce((acc: string[], c) => { if (c.role === 'composer') acc.push(c.name); return acc; }, []).join(', ') || '',
          lyricist: t.lyricists?.map(c => c.name).join(', ') ||
                    t.contributors?.reduce((acc: string[], c) => { if (c.role === 'lyricist') acc.push(c.name); return acc; }, []).join(', ') || '',
          arranger: t.arrangers?.map(c => c.name).join(', ') ||
                    t.contributors?.reduce((acc: string[], c) => { if (c.role === 'arranger') acc.push(c.name); return acc; }, []).join(', ') || '',
          isTitle: t.isTitle || false,
          isFocusTrack: false, // TODO: Add field to Track interface if needed
          isrc: t.isrc || '',
          musicVideoISRC: t.musicVideoISRC || '',
          hasMusicVideo: t.hasMusicVideo || false,
          explicitContent: t.explicitContent || t.explicit || false,
          dolbyAtmos: t.dolbyAtmos || false,
          stereo: true, // Default to true, can add field if needed
          trackType: 'AUDIO',
          versionType: t.remixVersion ? 'REMIX' : 'ORIGINAL',
          trackNumber: t.trackNumber,
          genre: t.genre || '',
          subgenre: t.subgenre || '',
          language: t.language || formData.language,
          audioLanguage: t.audioLanguage || formData.language,
          lyrics: t.lyrics || '',
          duration: t.duration,
          volume: t.volume,
          discNumber: t.discNumber,
          publishers: t.publishers || [],
          titleLanguage: t.titleLanguage || formData.language,
          featuring: t.featuringArtists?.map?.(a => a.name).join(', ') || ''
        })),
        distributionType: formData.distributionType,
        selectedStores: formData.selectedStores,
        excludedStores: formData.excludedStores,
        territories: formData.territories,
        excludedTerritories: formData.excludedTerritories,
        previouslyReleased: formData.previouslyReleased,
        marketingInfo: formData.marketingInfo
      }));

      // Add files
      if (formData.coverArt) {
        submissionData.append('coverArt', formData.coverArt);
      }

      formData.audioFiles.forEach((file, index) => {
        submissionData.append('audioFiles', file);
      });

      // Add Dolby Atmos files
      if (formData.dolbyAtmosFiles) {
        formData.dolbyAtmosFiles.forEach((file) => {
          submissionData.append('dolbyAtmosFiles', file);
        });
      }

      // Add Motion Art file
      if (formData.motionArtFile) {
        submissionData.append('motionArtFile', formData.motionArtFile);
      }

      // Add Music Video files (track-level)
      formData.tracks.forEach((track) => {
        if (track.musicVideoFile) {
          submissionData.append('musicVideoFiles', track.musicVideoFile);
          // Add track ID as metadata for backend to associate file with track
          submissionData.append(`musicVideoFile_trackId_${track.id}`, track.id);
        }
      });

      // Add Music Video Thumbnails (track-level)
      formData.tracks.forEach((track) => {
        if (track.musicVideoThumbnail) {
          submissionData.append('musicVideoThumbnails', track.musicVideoThumbnail);
          // Add track ID as metadata for backend to associate thumbnail with track
          submissionData.append(`musicVideoThumbnail_trackId_${track.id}`, track.id);
        }
      });

      // Add Lyrics Files (track-level)
      formData.tracks.forEach((track) => {
        if (track.lyricsFile) {
          submissionData.append('lyricsFiles', track.lyricsFile);
          // Add track ID as metadata for backend to associate lyrics with track
          submissionData.append(`lyricsFile_trackId_${track.id}`, track.id);
        }
      });

      // Add Lyrics files
      if (formData.lyricsFiles) {
        formData.lyricsFiles.forEach((file) => {
          submissionData.append('lyricsFiles', file);
        });
      }

      // Add Marketing Assets
      if (formData.marketingAssets) {
        formData.marketingAssets.forEach((file) => {
          submissionData.append('marketingAssets', file);
        });
      }

      // Submit based on mode
      if (isEditMode && editId) {
        // Direct API call for FormData
        await api.patch(`/submissions/${editId}`, submissionData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success(t('릴리즈가 성공적으로 수정되었습니다!', 'Release updated successfully!', 'リリースが正常に更新されました！'));
      } else if (isResubmitMode && resubmitId) {
        // For resubmit, create a new submission but mark it as a resubmission
        submissionData.append('resubmittedFrom', resubmitId);
        await api.post('/submissions', submissionData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success(t('릴리즈가 성공적으로 재제출되었습니다!', 'Release resubmitted successfully!', 'リリースが正常に재提출され었습니다！'));
      } else {
        const response = await api.post('/submissions', submissionData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        // Store submission data for modal
        setSubmittedReleaseData({
          id: response.data?.id,
          albumTitle: formData.albumTitle,
          artistName: formData.albumArtist,
          releaseDate: formData.consumerReleaseDate,
          timezone: formData.timezone,
          releaseUTC: response.data?.release?.releaseUTC || response.data?.release?.consumerReleaseUTC
        });

        toast.success(t('릴리즈가 성공적으로 제출되었습니다!', 'Release submitted successfully!', 'リリースが正常に提出されました！'));

        // Show success modal instead of immediate redirect
        setShowSuccessModal(true);
      }

    } catch (error) {
      console.error('Submission error:', error);
      toast.error(t('제출 중 오류가 발생했습니다', 'Error submitting release', 'リリースの提出中にエラーが発生しました'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Track Title Input Component with local state
  const TrackTitleInput = React.memo<{ trackId: string; initialValue: string }>(({ trackId, initialValue }) => {
    const [localValue, setLocalValue] = useState(initialValue);

    useEffect(() => {
      setLocalValue(initialValue);
    }, [initialValue]);

    const handleBlur = () => {
      const trackIndex = formData.tracks.findIndex(t => t.id === trackId);
      const trackNumber = trackIndex >= 0 ? trackIndex + 1 : undefined;
      const result = validateTrackTitle(localValue, trackNumber);
      if (result.formattedValue && result.formattedValue !== localValue) {
        setLocalValue(result.formattedValue);
        updateTrack(trackId, { title: result.formattedValue });
      } else {
        updateTrack(trackId, { title: localValue });
      }
    };

    return (
      <input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
        placeholder={t('트랙 제목 입력', 'Enter track title', 'トラックタイトルを入力')}
      />
    );
  });

  // Toggle translation handler with useCallback for memoization
  const handleToggleTrackTranslation = useCallback((trackId: string) => {
    setShowTrackTranslations(prev => ({
      ...prev,
      [trackId]: !prev[trackId]
    }));
  }, []);

  // Track Item Component with drag and drop
  const TrackItem = memo<{
    track: Track;
    index: number;
    isTranslationOpen: boolean;
    onToggleTranslation: (trackId: string) => void;
      }>(({ track, index, isTranslationOpen, onToggleTranslation }) => {
        const isDragOver = dragOverIndex === index;

        return (
          <div
            id={`track-${track.id}`}
            className={`
          p-4 border rounded-lg transition-all
          ${isDragOver ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 scale-105' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'}
          ${draggedIndex === index ? 'opacity-50' : ''}
        `}
          >
            {/* Audio File Info Section - Table Format */}
            {track.audioFile && (
              <div className="mb-4">
                <div className="bg-slate-800 dark:bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">
                  {/* Table Header */}
                  <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-slate-800/50 border-b border-slate-700 text-xs font-medium text-slate-400 uppercase tracking-wider">
                    <div className="col-span-4">Filename</div>
                    <div className="col-span-2">Quality</div>
                    <div className="col-span-2">Sample Rate</div>
                    <div className="col-span-2">Bit Depth</div>
                    <div className="col-span-2">Actions</div>
                  </div>

                  {/* Table Row */}
                  <div className="grid grid-cols-12 gap-4 px-6 py-4 items-center">
                    {/* Filename */}
                    <div className="col-span-4 flex items-center gap-3">
                      <Music className="w-5 h-5 text-purple-400 flex-shrink-0" />
                      <span className="text-sm text-white truncate">{track.audioFile.name}</span>
                    </div>

                    {/* Quality */}
                    <div className="col-span-2">
                      {track.audioMetadata && (
                        <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400">
                          {track.audioMetadata.qualityLabel}
                        </span>
                      )}
                    </div>

                    {/* Sample Rate */}
                    <div className="col-span-2">
                      {track.audioMetadata && (
                        <span className="text-sm text-slate-300">
                          {formatSampleRate(track.audioMetadata.sampleRate)}
                        </span>
                      )}
                    </div>

                    {/* Bit Depth */}
                    <div className="col-span-2">
                      {track.audioMetadata && (
                        <span className="inline-flex px-3 py-1 rounded-lg text-xs font-semibold bg-purple-500/20 text-purple-300">
                          {track.audioMetadata.bitDepth || 16} bits
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="col-span-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleAudioPlayback(index)}
                        className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                        title="Play"
                      >
                        {playingAudioIndex === index ? (
                          <Pause className="w-5 h-5 text-white" />
                        ) : (
                          <Play className="w-5 h-5 text-white" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const a = document.createElement('a');
                          a.href = URL.createObjectURL(track.audioFile!);
                          a.download = track.audioFile!.name;
                          a.click();
                        }}
                        className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                        title="Download"
                      >
                        <Download className="w-5 h-5 text-blue-400" />
                      </button>
                      <button
                        type="button"
                        className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                        title="Replace"
                      >
                        <RefreshCw className="w-5 h-5 text-slate-400" />
                      </button>
                    </div>
                  </div>

                  <audio
                    ref={(el) => (audioRefs.current[index] = el)}
                    src={track.audioFile ? URL.createObjectURL(track.audioFile) : ''}
                    onEnded={() => setPlayingAudioIndex(null)}
                    className="hidden"
                  />
                </div>
              </div>
            )}

            <div className="flex items-start gap-4">
              {/* Drag Handle */}
              <div
                className="flex flex-col items-center gap-1 mt-2 cursor-move"
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                style={{ touchAction: 'none' }}
              >
                <GripVertical className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-500">#{track.trackNumber}</span>
              </div>

              {/* Track Content */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Track Title */}
                <div className="md:col-span-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('트랙 제목', 'Track Title', 'トラックタイトル')} *
                    </label>
                    <button
                      type="button"
                      onClick={() => onToggleTranslation(track.id)}
                      className={`
                    inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-all
                    ${isTranslationOpen
            ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-sm'
            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:border-purple-300 hover:text-purple-600 dark:hover:text-purple-400'
          }
                  `}
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>{t('번역 추가', 'Add Translation', '翻訳を追加')}</span>
                    </button>
                  </div>
                  <TrackTitleInput
                    trackId={track.id}
                    trackNumber={track.trackNumber}
                    initialValue={track.title || ''}
                    onChange={(value) => updateTrack(track.id, { title: value })}
                    placeholder={t('트랙 제목을 입력하세요', 'Enter track title')}
                  />
                </div>

                {/* Track Title Translations - Enhanced UI */}
                {isTranslationOpen && (
                  <div className="md:col-span-2 mt-4 animate-in slide-in-from-top-2">
                    <div
                      className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 rounded-2xl p-6 border border-purple-100 dark:border-purple-800/30"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <TrackTranslationUI
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
                          }), {});
                          updateTrack(track.id, { titleTranslations: translationsObj });
                        }}
                        language={language}
                      />
                    </div>
                  </div>
                )}

                {/* Track Artists */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('트랙 아티스트', 'Track Artists', 'トラックアーティスト')} *
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
                    onClick={() => {
                      saveScrollPosition(track.id);
                      setShowTrackArtistModal(track.id);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:border-purple-500 dark:hover:border-purple-400 transition-colors text-sm text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400"
                  >
                    <Plus className="w-4 h-4 inline-block mr-1" />
                    {t('아티스트 관리', 'Manage Artists', 'アーティスト管理')}
                  </button>
                </div>

                {/* Featuring Artists */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('피처링 아티스트', 'Featuring Artists', 'フィーチャリングアーティスト')}
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
                    onClick={() => {
                      saveScrollPosition(track.id);
                      setShowFeaturingArtistModal(track.id);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:border-purple-500 dark:hover:border-purple-400 transition-colors text-sm text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400"
                  >
                    <Plus className="w-4 h-4 inline-block mr-1" />
                    {t('피처링 관리', 'Manage Featuring', 'フィーチャリング管理')}
                  </button>
                </div>

                {/* Contributors */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('기여자', 'Contributors', '貢献者')}
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
                    onClick={() => {
                      saveScrollPosition(track.id);
                      setShowContributorModal(track.id);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:border-purple-500 dark:hover:border-purple-400 transition-colors text-sm text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    {t('기여자 관리', 'Manage Contributors', '貢献者管理')}
                  </button>
                </div>

                {/* Music Video Toggle */}
                <div className="col-span-2">
                  <label className="flex items-center gap-3 cursor-pointer p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
                    <input
                      type="checkbox"
                      checked={track.hasMusicVideo || false}
                      onChange={(e) => updateTrack(track.id, { hasMusicVideo: e.target.checked })}
                      className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                    />
                    <div className="flex items-center gap-2">
                      <Film className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('이 트랙에 뮤직비디오가 있습니다', 'This track has a music video', 'このトラックにはミュージックビデオがあります')}
                      </span>
                    </div>
                  </label>
                </div>

                {/* ISRC - Label changes based on track's music video flag */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {track.hasMusicVideo
                      ? t('오디오 녹음 ISRC', 'Audio Recording ISRC', 'オーディオ録音ISRC')
                      : 'ISRC'}
                  </label>
                  <input
                    type="text"
                    value={track.isrc || ''}
                    onChange={(e) => updateTrack(track.id, { isrc: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                    placeholder="KR-XXX-YY-NNNNN"
                  />
                </div>

                {/* Music Video ISRC - Only show when track has music video */}
                {track.hasMusicVideo && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('뮤직비디오 ISRC', 'Music Video ISRC', 'ミュージックビデオISRC')}
                    </label>
                    <input
                      type="text"
                      value={track.musicVideoISRC || ''}
                      onChange={(e) => updateTrack(track.id, { musicVideoISRC: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                      placeholder="KR-XXX-YY-NNNNN"
                    />
                  </div>
                )}

                {/* Music Video File Upload - Only show when track has music video */}
                {track.hasMusicVideo && (
                  <div className="col-span-2 space-y-3">
                    {/* Music Video File */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('뮤직비디오 파일', 'Music Video File', 'ミュージックビデオファイル')}
                      </label>
                      {track.musicVideoFile ? (
                        <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                          <Film className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {track.musicVideoFile.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {(track.musicVideoFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                          <button
                            onClick={() => updateTrack(track.id, { musicVideoFile: undefined })}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-6 h-6 text-gray-400 mb-2" />
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {t('클릭하여 뮤직비디오 업로드', 'Click to upload music video', 'クリックしてアップロード')}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                              MP4, MOV (max 500MB)
                            </p>
                          </div>
                          <input
                            type="file"
                            accept="video/mp4,video/quicktime"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                updateTrack(track.id, { musicVideoFile: file });
                              }
                            }}
                          />
                        </label>
                      )}
                    </div>

                    {/* Music Video Thumbnail */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('뮤직비디오 썸네일', 'Music Video Thumbnail', 'ミュージックビデオサムネイル')} {t('(선택사항)', '(Optional)', '(オプション)')}
                      </label>
                      {track.musicVideoThumbnail ? (
                        <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
                          <Image className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {track.musicVideoThumbnail.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {(track.musicVideoThumbnail.size / 1024).toFixed(2)} KB
                            </p>
                          </div>
                          <button
                            onClick={() => updateTrack(track.id, { musicVideoThumbnail: undefined })}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-purple-500 dark:hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-colors">
                          <div className="flex flex-col items-center justify-center pt-4 pb-5">
                            <Upload className="w-5 h-5 text-gray-400 mb-1" />
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {t('썸네일 업로드', 'Upload thumbnail', 'サムネイルアップロード')}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                              JPG, PNG (1920x1080)
                            </p>
                          </div>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/jpg"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                updateTrack(track.id, { musicVideoThumbnail: file });
                              }
                            }}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                )}

                {/* Audio Language */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('오디오 언어', 'Audio Language', 'オーディオ言語')}
                  </label>
                  <select
                    value={track.audioLanguage || 'Korean'}
                    onChange={(e) => updateTrack(track.id, { audioLanguage: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="Korean">{t('한국어', 'Korean', '韓国語')}</option>
                    <option value="English">{t('영어', 'English', '英語')}</option>
                    <option value="Japanese">{t('일본어', 'Japanese', '日本語')}</option>
                    <option value="Chinese">{t('중국어', 'Chinese', '中国語')}</option>
                    <option value="Spanish">{t('스페인어', 'Spanish', 'スペイン語')}</option>
                    <option value="French">{t('프랑스어', 'French', 'フランス語')}</option>
                    <option value="German">{t('독일어', 'German', 'ドイツ語')}</option>
                    <option value="Instrumental">{t('인스트루멘탈', 'Instrumental', 'インストゥルメンタル')}</option>
                    <option value="Other">{t('기타', 'Other', 'その他')}</option>
                  </select>
                </div>

                {/* Track Version */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('트랙 버전', 'Track Version', 'トラックバージョン')} {t('(선택사항)', '(Optional)', '(オプション)')}
                  </label>
                  <input
                    type="text"
                    key={`remixVersion-${track.id}`}
                    defaultValue={track.remixVersion || ''}
                    onBlur={(e) => {
                      updateTrack(track.id, { remixVersion: e.target.value });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                    placeholder={t('예: Remix, Acoustic, Live', 'e.g., Remix, Acoustic, Live', '例: Remix, Acoustic, Live')}
                  />
                </div>

                {/* Lyrics File Upload */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('가사 파일', 'Lyrics File', '歌詞ファイル')} {t('(선택사항)', '(Optional)', '(オプション)')}
                  </label>
                  {track.lyricsFile ? (
                    <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
                      <FileText className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {track.lyricsFile.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {(track.lyricsFile.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                      <button
                        onClick={() => updateTrack(track.id, { lyricsFile: undefined })}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-green-500 dark:hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/10 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-4 pb-5">
                        <Upload className="w-5 h-5 text-gray-400 mb-1" />
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {t('가사 파일 업로드', 'Upload lyrics file', '歌詞ファイルアップロード')}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                          TXT, LRC (max 1MB)
                        </p>
                      </div>
                      <input
                        type="file"
                        accept=".txt,.lrc,.srt"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            updateTrack(track.id, { lyricsFile: file });
                          }
                        }}
                      />
                    </label>
                  )}
                </div>

                {/* Volume (for multi-volume albums) */}
                {formData.totalVolumes > 1 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('볼륨', 'Volume', 'ボリューム')}
                    </label>
                    <select
                      value={track.volume || 1}
                      onChange={(e) => updateTrack(track.id, { volume: parseInt(e.target.value) || 1 })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                    >
                      {Array.from({ length: formData.totalVolumes }, (_, i) => i + 1).map(vol => (
                        <option key={vol} value={vol}>
                          {t(`볼륨 ${vol}`, `Volume ${vol}`, `ボリューム ${vol}`)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => moveTrackUp(index)}
                  disabled={index === 0}
                  className="p-1 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={t('위로 이동', 'Move up', '上に移動')}
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => moveTrackDown(index)}
                  disabled={index === formData.tracks.length - 1}
                  className="p-1 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={t('아래로 이동', 'Move down', '下に移動')}
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => removeTrack(track.id)}
                  className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                  title={t('삭제', 'Delete', '削除')}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        );
      }, (prevProps, nextProps) => {
        // Custom comparison function for React.memo
        return (
          prevProps.track.id === nextProps.track.id &&
      prevProps.track.title === nextProps.track.title &&
      JSON.stringify(prevProps.track.titleTranslations) === JSON.stringify(nextProps.track.titleTranslations) &&
      JSON.stringify(prevProps.track.artists) === JSON.stringify(nextProps.track.artists) &&
      prevProps.track.trackNumber === nextProps.track.trackNumber &&
      prevProps.track.titleLanguage === nextProps.track.titleLanguage &&
      prevProps.track.dolbyAtmos === nextProps.track.dolbyAtmos &&
      prevProps.track.remixVersion === nextProps.track.remixVersion &&
      prevProps.track.audioLanguage === nextProps.track.audioLanguage &&
      prevProps.track.isrc === nextProps.track.isrc &&
      prevProps.track.hasMusicVideo === nextProps.track.hasMusicVideo &&
      prevProps.track.musicVideoISRC === nextProps.track.musicVideoISRC &&
      prevProps.track.volume === nextProps.track.volume &&
      prevProps.track.musicVideoFile?.name === nextProps.track.musicVideoFile?.name &&
      prevProps.track.musicVideoThumbnail?.name === nextProps.track.musicVideoThumbnail?.name &&
      prevProps.track.lyricsFile?.name === nextProps.track.lyricsFile?.name &&
      prevProps.index === nextProps.index &&
      prevProps.isTranslationOpen === nextProps.isTranslationOpen
      // onToggleTranslation is excluded from comparison since it's memoized with useCallback
        );
      });

  // Step Components
  const renderStepContent = () => {
    // Show Dolby Atmos decision page between Step 1 and Step 2
    if (isDolbyDecisionStep) {
      return (
        <div className="min-h-[600px] flex items-center justify-center">
          <DolbyAtmosDecisionCard
            trackCount={formData.audioFiles.length}
            onDecision={handleDolbyDecision}
          />
        </div>
      );
    }

    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('앨범 정보', 'Album Information', 'アルバム情報')}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Cover Art Upload - Moved from Step 3 */}
              <div className="md:col-span-2 mt-6">
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 border border-blue-200 dark:border-blue-800/30 rounded-xl p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
                        {t('커버 아트 가이드', 'Cover Art Guidelines', 'カバーアートガイド')}
                      </p>
                      <ul className="space-y-1 text-blue-800 dark:text-blue-300">
                        <li>• {t('최소 해상도: 3000x3000px', 'Min Resolution: 3000x3000px', '最小解像度：3000x3000px')}</li>
                        <li>• {t('파일 형식: JPG 또는 PNG', 'File Format: JPG or PNG', 'ファイル形式：JPGまたはPNG')}</li>
                        <li>• {t('색상 모드: RGB (CMYK 불가)', 'Color Mode: RGB (no CMYK)', 'カラーモード：RGB（CMYKは不可）')}</li>
                        <li>• {t('정사각형 비율 (1:1) 필수', 'Square aspect ratio (1:1) required', '正方形（1:1）必須')}</li>
                      </ul>
                    </div>
                  </div>

                  <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                    {t('커버 아트', 'Cover Art', 'カバーアート')}
                    <span className="text-red-500 ml-1">*</span>
                  </label>

                  {formData.coverArt ? (
                    <div className="relative group">
                      <div className="flex items-center gap-4 p-4 border-2 border-green-200 dark:border-green-700 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                        <div className="relative w-48 h-48 flex-shrink-0 overflow-hidden rounded-lg border-2 border-white dark:border-gray-700 shadow-lg">
                          <img
                            src={URL.createObjectURL(formData.coverArt!)}
                            alt="Cover art preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{formData.coverArt!.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {(formData.coverArt!.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex items-center gap-1 text-xs text-green-700 dark:text-green-300">
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>{t('업로드 완료', 'Uploaded', 'アップロード完了')}</span>
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, coverArt: undefined }))}
                          className="flex-shrink-0 p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title={t('제거', 'Remove', '削除')}
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      id="cover-art-upload"
                      type="button"
                      onClick={() => coverArtInputRef.current?.click()}
                      className="w-full p-10 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-purple-500 dark:hover:border-purple-400 transition-all duration-200 bg-white dark:bg-gray-800/30 hover:bg-gradient-to-br hover:from-purple-50 hover:to-pink-50 dark:hover:from-purple-900/20 dark:hover:to-pink-900/20 group">
                      <Upload className="w-14 h-14 mx-auto text-gray-400 dark:text-gray-500 mb-4 group-hover:text-purple-500 dark:group-hover:text-purple-400 transition-colors" />
                      <p className="text-gray-900 dark:text-gray-100 font-semibold text-lg mb-2">
                        {t('클릭하여 커버 아트 선택', 'Click to select cover art', 'クリックしてカバーアートを選択')}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t('최소 3000x3000px, JPG/PNG, RGB 색상 모드', 'Min 3000x3000px, JPG/PNG, RGB color mode', '最小3000x3000px、JPG/PNG、RGBカラーモード')}
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
              </div>

              {/* Audio Files Upload with Waveform & Player */}
              <div className="md:col-span-2 mt-6">
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 border border-purple-200 dark:border-purple-800/30 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                      {t('오디오 파일', 'Audio Files', 'オーディオファイル')}
                      <span className="text-red-500 ml-1">*</span>
                      <span className="ml-2 text-xs text-gray-500">
                        ({formData.audioFiles.length} {t('파일', 'files', 'ファイル')})
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={() => audioFileInputRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      {t('파일 추가', 'Add Files', 'ファイルを追加')}
                    </button>
                  </div>

                  {formData.audioFiles.length > 0 ? (
                    <Reorder.Group
                      axis="y"
                      values={formData.audioFiles}
                      onReorder={handleAudioReorder}
                      className="space-y-3"
                    >
                      {formData.audioFiles.map((file, index) => (
                        <Reorder.Item
                          key={`audio-${file.name}-${index}`}
                          value={file}
                          layoutId={`audio-card-${file.name}-${file.size}`}
                          layout="position"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          whileDrag={{
                            scale: 1.05,
                            boxShadow: "0 20px 50px rgba(139, 92, 246, 0.4)",
                            zIndex: 1000,
                            rotate: 2,
                            cursor: 'grabbing'
                          }}
                          transition={{
                            layout: {
                              type: "spring",
                              stiffness: 120,
                              damping: 30
                            },
                            default: {
                              duration: 0.4,
                              ease: [0.34, 1.56, 0.64, 1]
                            }
                          }}
                          dragElastic={0.3}
                          dragTransition={{
                            bounceStiffness: 180,
                            bounceDamping: 40,
                            power: 0.15,
                            timeConstant: 200
                          }}
                          className="group relative bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-5 hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-500/20 transition-all duration-300"
                          style={{ cursor: 'default' }}
                          dragListener={false}
                        >
                          {/* Header Row - Top Info */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              {/* Drag Handle */}
                              <div
                                className="flex-shrink-0 cursor-grab active:cursor-grabbing opacity-50 hover:opacity-100 transition-opacity"
                                onPointerDown={(e) => {
                                  console.log('🖱️ [Debug] Drag handle grabbed');
                                  // Reorder.Item will handle this with dragListener={false}
                                }}
                              >
                                <GripVertical className="w-5 h-5 text-slate-400" />
                              </div>

                              {/* Play Button - Compact */}
                              <button
                                type="button"
                                onPointerDown={(e) => {
                                  e.stopPropagation();
                                  console.log('🖱️ [Debug] Play button pointer down');
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  console.log('🖱️ [Debug] Play button clicked!');
                                  toggleAudioPlayback(index);
                                }}
                                className="relative flex-shrink-0 w-11 h-11 flex items-center justify-center bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-full transition-all shadow-lg shadow-purple-500/50 hover:shadow-xl hover:shadow-purple-500/70 hover:scale-110 group/play z-10 pointer-events-auto"
                              >
                                {playingAudioIndex === index ? (
                                  <Pause className="w-5 h-5" />
                                ) : (
                                  <Play className="w-5 h-5 ml-0.5" />
                                )}
                                {playingAudioIndex === index && (
                                  <span className="absolute inset-0 rounded-full bg-purple-500 animate-ping opacity-20"></span>
                                )}
                              </button>

                              {/* File Info */}
                              <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-white truncate text-base leading-tight mb-0.5">
                                  {file.name}
                                </h3>
                                {audioMetadata[index] && (
                                  <p className="text-sm text-slate-400">
                                    {formatDuration(audioMetadata[index]!.duration)}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Top Right Actions */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {/* HD Badge */}
                              {audioMetadata[index] && audioMetadata[index]!.isHD && (
                                <span className="px-3 py-1 rounded-md text-xs font-black tracking-tight bg-green-500 text-white border border-green-400/50">
                                  HD
                                </span>
                              )}
                              {/* Delete Button */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeAudioFile(index);
                                }}
                                className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200"
                                title={t('제거', 'Remove', '削除')}
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </div>
                          </div>

                          {/* Waveform - Enlarged Center */}
                          <div className="relative mb-4 bg-black/20 rounded-xl p-4 border border-slate-700/30">
                            <ModernWaveform
                              isPlaying={playingAudioIndex === index}
                              duration={audioMetadata[index]?.duration || 0}
                              currentTime={audioCurrentTimes[index] || 0}
                              onSeek={(time) => {
                                const audio = audioRefs.current[index];
                                if (audio) {
                                  audio.currentTime = time;
                                  console.log(`⏩ [Audio] Seeked to ${time}s`);
                                }
                              }}
                              className="h-20"
                            />
                            {/* Time Overlay */}
                            {audioMetadata[index] && (
                              <div className="flex justify-between text-xs text-slate-400 mt-2">
                                <span className="font-mono">{formatDuration(audioCurrentTimes[index] || 0)}</span>
                                <span className="font-mono">{formatDuration(audioMetadata[index]!.duration)}</span>
                              </div>
                            )}
                          </div>

                          {/* Audio Specs - Bottom Pills */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-3 py-1.5 rounded-lg bg-slate-700/60 text-slate-200 text-xs font-semibold backdrop-blur-sm">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </span>
                            {audioMetadata[index] && (
                              <>
                                <span className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-500/20 to-purple-600/20 text-purple-300 text-xs font-bold border border-purple-500/40">
                                  {formatSampleRate(audioMetadata[index]!.sampleRate)}
                                </span>
                                <span className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-pink-500/20 to-pink-600/20 text-pink-300 text-xs font-bold border border-pink-500/40">
                                  {audioMetadata[index]!.bitDepth || 16}-bit
                                </span>
                                <span className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-500/20 to-blue-600/20 text-blue-300 text-xs font-semibold border border-blue-500/40">
                                  {audioMetadata[index]!.numberOfChannels === 1 ? 'Mono' :
                                   audioMetadata[index]!.numberOfChannels === 2 ? 'Stereo' :
                                   `${audioMetadata[index]!.numberOfChannels}ch`}
                                </span>
                              </>
                            )}
                          </div>

                        </Reorder.Item>
                      ))}
                    </Reorder.Group>
                  ) : (
                    <button
                      type="button"
                      onClick={() => audioFileInputRef.current?.click()}
                      className="w-full p-10 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-purple-500 dark:hover:border-purple-400 transition-all duration-200 bg-white dark:bg-gray-800/30 hover:bg-gradient-to-br hover:from-purple-50 hover:to-pink-50 dark:hover:from-purple-900/20 dark:hover:to-pink-900/20 group"
                    >
                      <Music className="w-14 h-14 mx-auto text-gray-400 dark:text-gray-500 mb-4 group-hover:text-purple-500 dark:group-hover:text-purple-400 transition-colors" />
                      <p className="text-gray-900 dark:text-gray-100 font-semibold text-lg mb-2">
                        {t('오디오 파일 업로드', 'Upload Audio Files', 'オーディオファイルをアップロード')}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t('WAV, FLAC, MP3 - 여러 파일 선택 가능', 'WAV, FLAC, MP3 - Multiple files supported', 'WAV、FLAC、MP3 - 複数ファイル対応')}
                      </p>
                    </button>
                  )}

                  {/* Hidden Audio Elements - Outside Reorder to prevent re-creation on drag */}
                  {formData.audioFiles.map((file, index) => (
                    <audio
                      key={`audio-${file.name}-${index}`}
                      ref={(el) => {
                        if (el) audioRefs.current[index] = el;
                      }}
                      src={audioUrls[index]}
                      onTimeUpdate={(e) => {
                        const audio = e.currentTarget as HTMLAudioElement;
                        if (audio && !isNaN(audio.currentTime)) {
                          setAudioCurrentTimes(prev => {
                            const updated = [...prev];
                            updated[index] = audio.currentTime;
                            return updated;
                          });
                        }
                      }}
                      onEnded={() => setPlayingAudioIndex(null)}
                      className="hidden"
                    />
                  ))}

                  <input
                    ref={audioFileInputRef}
                    type="file"
                    accept="audio/*"
                    multiple
                    onChange={handleAudioFileSelect}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Album Title */}
              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('앨범 제목', 'Album Title', 'アルバムタイトル')} *
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
                    <span>{t('번역 추가', 'Add Translation', '翻訳を追加')}</span>
                  </button>
                </div>
                <ValidatedInput
                  fieldId="album-title"
                  validationType="album"
                  value={formData.albumTitle}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, albumTitle: value }))}
                  placeholder={t('앨범 제목을 입력하세요', 'Enter album title', 'アルバムタイトルを入력')}
                  language={language}
                  showInlineWarnings={true}
                />

                {/* Album Title Translations - Using TranslationInput Component */}
                {showAlbumTranslations && (
                  <div className="mt-4 animate-in slide-in-from-top-2 duration-300">
                    <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50 dark:from-purple-900/10 dark:via-pink-900/10 dark:to-purple-900/10 rounded-2xl p-6 border border-purple-200 dark:border-purple-800/30 shadow-sm hover:shadow-md transition-all duration-300">

                      {/* Header with Enhanced Design */}
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl blur opacity-40"></div>
                            <div className="relative p-2.5 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                              <Globe className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            </div>
                          </div>
                          <div>
                            <h4 className="text-base font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                              {t('글로벌 번역', 'Global Translations', 'グローバル翻訳')}
                              <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded-full font-semibold">
                                {Object.keys(formData.albumTitleTranslations || {}).length}
                              </span>
                            </h4>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                              {t('전 세계 팬들을 위한 다국어 지원', 'Multilingual support for global fans', 'グローバルファンのための多言語サポート')}
                            </p>
                          </div>
                        </div>

                        {/* Translation Progress Badge */}
                        {Object.keys(formData.albumTitleTranslations || {}).length > 0 && (
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-full">
                            <CheckCircle className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                            <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">
                              {Object.keys(formData.albumTitleTranslations || {}).length} {t('개 언어', 'languages', '言語')}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* TranslationInput Component Integration */}
                      <TranslationInput
                        translations={albumTranslationsArray}
                        onTranslationsChange={(translations) => {
                          // Update array state (allows empty entries)
                          setAlbumTranslationsArray(translations);

                          // Sync to formData object (only entries with language)
                          const translationsObj: { [key: string]: string } = {};
                          translations.forEach(t => {
                            if (t.language) {
                              translationsObj[t.language] = t.title || '';
                            }
                          });
                          setFormData(prev => ({
                            ...prev,
                            albumTitleTranslations: translationsObj
                          }));
                        }}
                        language={language}
                        placeholder={t(
                          '선택한 언어로 앨범 제목 번역',
                          'Album title in selected language',
                          '選択した言語でアルバムタイトル'
                        )}
                      />

                      {/* Help Text with Icon */}
                      <div className="mt-4 pt-4 border-t border-purple-200 dark:border-purple-800/30">
                        <div className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                          <Info className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
                          <p>
                            {t(
                              '앨범 제목을 여러 언어로 번역하면 전 세계 스트리밍 플랫폼에서 더 쉽게 발견될 수 있습니다. 최대 70개 이상의 언어를 지원합니다.',
                              'Translating your album title into multiple languages helps listeners discover your music on streaming platforms worldwide. Over 70 languages supported.',
                              'アルバムタイトルを複数の言語に翻訳することで、世界中のストリーミングプラットフォームでより簡単に発見されます。70以上の言語をサポートしています。'
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Album Artists */}
              <div id="album-artist-section" className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('앨범 아티스트', 'Album Artists', 'アルバムアーティスト')} *
                </label>

                {/* Artist List Display */}
                {formData.albumArtists.length > 0 && (
                  <div className="space-y-2">
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
                              {artist.role === 'main' && t('메인 아티스트', 'Main Artist', 'メインアーティスト')}
                              {artist.role === 'featured' && t('피처링', 'Featured', 'フィーチャリング')}
                              {artist.role === 'additional' && t('참여 아티스트', 'Additional Artist', '参加アーティスト')}
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
                  onClick={() => {
                    console.log('Album Artist Modal button clicked');
                    setShowAlbumArtistModal(true);
                  }}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-dashed border-gray-300 dark:border-gray-600
                           rounded-lg hover:border-purple-400 dark:hover:border-purple-500
                           transition-colors flex items-center justify-center gap-2
                           text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400"
                >
                  <Plus className="w-4 h-4" />
                  {t('아티스트 관리', 'Manage Artists', 'アーティスト管理')}
                </button>
              </div>

              {/* Featuring Artists */}
              <div id="featuring-artist-section" className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('피처링 아티스트', 'Featuring Artists', 'フィーチャリングアーティスト')}
                </label>

                {/* Featuring Artist List */}
                {formData.albumFeaturingArtists && formData.albumFeaturingArtists.length > 0 && (
                  <div className="space-y-2">
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
                              {t('피처링 아티스트', 'Featuring Artist', 'フィーチャリングアーティスト')}
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
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-dashed border-gray-300 dark:border-gray-600
                           rounded-lg hover:border-purple-400 dark:hover:border-purple-500
                           transition-colors flex items-center justify-center gap-2
                           text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400"
                >
                  <Plus className="w-4 h-4" />
                  {t('피처링 관리', 'Manage Featuring', 'フィーチャリング管理')}
                </button>
              </div>

              {/* Label and Display Artist */}
              <div className="md:col-span-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {t('레이블 및 표시 정보', 'Label & Display Information', 'レーベル・表示情報')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('레이블', 'Label', 'レーベル')}
                    </label>
                    <input
                      type="text"
                      value={formData.label || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                      placeholder={t('레이블명 입력', 'Enter label name', 'レーベル名を入力')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('디스플레이 아티스트', 'Display Artist', '表示アーティスト')}
                    </label>
                    <input
                      type="text"
                      value={formData.displayArtist || ''}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 cursor-not-allowed"
                      placeholder={t('아티스트 정보에서 자동 생성됨', 'Auto-generated from artist info', 'アーティスト情報から自動生成')}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {t('메인 및 피처링 아티스트 정보를 기반으로 자동 생성됩니다', 'Automatically generated based on main and featuring artists', 'メイン・フィーチャリングアーティスト情報に基づいて自動生成されます')}
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
                      {t('이 앨범은 청소년 유해 컨텐츠를 포함합니다', 'This album contains explicit content', 'このアルバムには明示的なコンテンツが含まれています')}
                    </span>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {t('욕설, 성적 내용, 폭력적 내용 등이 포함된 경우 체크하세요', 'Check if album contains profanity, sexual content, violence, etc.', '不適切な言葉、性的内容、暴力的内容などが含まれている場合はチェックしてください')}
                    </p>
                  </label>
                </div>
              </div>

              {/* Release Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('릴리즈 타입', 'Release Type', 'リリースタイプ')} *
                </label>
                <RadioGroup
                  name="releaseType"
                  value={formData.releaseType}
                  onChange={(value) => setFormData(prev => ({ ...prev, releaseType: value as any }))}
                  options={[
                    { value: 'single', label: t('싱글', 'Single', 'シングル'), description: t('1-3곡', '1-3 tracks', '1-3曲') },
                    { value: 'ep', label: 'EP', description: t('4-6곡', '4-6 tracks', '4-6曲') },
                    { value: 'album', label: t('정규', 'Album', 'アルバム'), description: t('7곡 이상', '7+ tracks', '7曲以上') }
                  ]}
                />
              </div>

              {/* Primary Genre */}
              <div id="genre-section">
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                  {t('주 장르', 'Primary Genre', 'メインジャンル')} <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  options={genreList}
                  value={formData.primaryGenre}
                  onChange={(value) => {
                    setFormData(prev => ({ ...prev, primaryGenre: value, primarySubgenre: '' }));
                  }}
                  placeholder={t('장르 선택', 'Select genre', 'ジャンルを選択')}
                  searchPlaceholder={t('장르 검색...', 'Search genres...', 'ジャンルを検索...')}
                />
              </div>

              {/* Primary Subgenre */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                  {t('주 서브장르', 'Primary Subgenre', 'メインサブジャンル')}
                </label>
                <SearchableSelect
                  options={formData.primaryGenre && subgenreList[formData.primaryGenre] ? subgenreList[formData.primaryGenre] : []}
                  value={formData.primarySubgenre}
                  onChange={(value) => setFormData(prev => ({ ...prev, primarySubgenre: value }))}
                  placeholder={t('서브장르 선택', 'Select subgenre', 'サブジャンルを選択')}
                  searchPlaceholder={t('서브장르 검색...', 'Search subgenres...', 'サブジャンルを検索...')}
                  disabled={!formData.primaryGenre}
                />
              </div>

              {/* Language */}
              <div id="language-section">
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                  {t('언어', 'Language', '言語')} <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  options={languageList.map(lang => ({ value: lang.code, label: lang.name }))}
                  value={formData.language}
                  onChange={(value) => {
                    setFormData(prev => ({ ...prev, language: value }));
                  }}
                  placeholder={t('언어 선택', 'Select language', '言語を選択')}
                  searchPlaceholder={t('언어 검색...', 'Search languages...', '言語を検索...')}
                />
              </div>

              {/* Total Volumes */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                  {t('총 볼륨 수', 'Total Volumes', '総ボリューム数')}
                  <span className="ml-1 text-xs text-gray-600 dark:text-gray-400">
                    {t('(멀티 볼륨 앨범의 경우)', '(For multi-volume albums)', '(マルチボリュームアルバムの場合)')}
                  </span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.totalVolumes || 1}
                  onChange={(e) => setFormData(prev => ({ ...prev, totalVolumes: Math.max(1, parseInt(e.target.value) || 1) }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700"
                />
                {formData.totalVolumes > 1 && (
                  <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                    {t('⚠️ 승인 후에는 볼륨 수와 트랙 순서 변경 불가', '⚠️ Cannot change volume count or track order after approval', '⚠️ 承認後はボリューム数とトラック順序の変更不可')}
                  </p>
                )}
              </div>

              {/* Album Note */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                  {t('앨범 노트', 'Album Note', 'アルバムノート')}
                  <span className="ml-1 text-xs text-gray-600 dark:text-gray-400">
                    {t('(한국 DSP용 앨범 소개 및 크레딧)', '(Album intro & credits for Korean DSPs)', '(韓国DSP用アルバム紹介・クレジット)')}
                  </span>
                </label>
                <textarea
                  value={formData.albumNote || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, albumNote: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 min-h-[120px]"
                  placeholder={t('앨범 소개, 참여 아티스트, 크레딧 등을 자유롭게 작성해주세요', 'Write album introduction, participating artists, credits, etc.', 'アルバム紹介、参加アーティスト、クレジットなどを自由に記載してください')}
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
                      {t('발매일 및 시간 설정', 'Release Date & Time Settings', 'リリース日時設定')}
                    </h3>
                  </div>

                  <div className="space-y-4">
                    {/* Marketing Notice */}
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
                            {t('마케팅 기회 안내', 'Marketing Opportunity Notice', 'マーケティング機会のお知らせ')}
                          </p>
                          <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                            {t(
                              '발매일 최소 3-4주 전에 제출해야 마케팅 기회를 얻을 수 있습니다. Apple Music은 4주 전 제출 시 마케팅 기회가 주어지나 보장되지는 않습니다.',
                              'Submit at least 3-4 weeks before release date for marketing opportunities. Apple Music provides marketing opportunities for submissions 4 weeks in advance, but it is not guaranteed.',
                              'リリース日の最低3-4週間前に提出することでマーケティング機会を得ることができます。Apple Musicは4週間前の提出時にマーケティング機会が与えられますが、保証されていません。'
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
                            '💡 When you enter Consumer Release Date, Original Release Date will be automatically set to the same date. For re-releases, please adjust the Original Release Date separately.',
                            '💡 コンシューマーリリース日を入力すると、オリジナルリリース日が自動的に同じ日付に設定されます。再発売の場合は、オリジナルリリース日を別途修正してください。'
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Consumer Release Date */}
                      <div id="consumer-release-date">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t('컨슈머 발매일', 'Consumer Release Date', 'コンシューマーリリース日')} <span className="text-red-500">*</span>
                        </label>
                        <DatePicker
                          value={formData.consumerReleaseDate || ''}
                          onChange={(date) => {
                            setFormData(prev => ({
                              ...prev,
                              consumerReleaseDate: date,
                              // 항상 오리지널 발매일을 컨슈머 발매일과 동일하게 설정
                              originalReleaseDate: date
                            }));
                          }}
                          minDate={new Date().toISOString().split('T')[0]}
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {t('실제 발매될 날짜', 'Actual release date', '実際のリリース日')}
                        </p>

                        {/* Days until release and marketing message */}
                        {formData.consumerReleaseDate && (() => {
                          const daysUntilRelease = calculateDaysUntilRelease(formData.consumerReleaseDate);
                          const marketingMessage = getMarketingMessage(daysUntilRelease);

                          if (!marketingMessage) return null;

                          const bgColor = {
                            error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700',
                            warning: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700',
                            caution: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700',
                            success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700'
                          };

                          const textColor = {
                            error: 'text-red-700 dark:text-red-300',
                            warning: 'text-orange-700 dark:text-orange-300',
                            caution: 'text-yellow-700 dark:text-yellow-300',
                            success: 'text-green-700 dark:text-green-300'
                          };

                          const icon = {
                            error: '❌',
                            warning: '⚠️',
                            caution: '⏰',
                            success: '✅'
                          };

                          return (
                            <div className={`mt-2 p-2 rounded-lg border ${bgColor[marketingMessage.type as keyof typeof bgColor]}`}>
                              <div className="flex items-start gap-2">
                                <span className="text-sm">{icon[marketingMessage.type as keyof typeof icon]}</span>
                                <p className={`text-xs font-medium ${textColor[marketingMessage.type as keyof typeof textColor]}`}>
                                  {marketingMessage.message}
                                </p>
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Original Release Date */}
                      <div id="original-release-date">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t('오리지널 발매일', 'Original Release Date', 'オリジナルリリース日')} <span className="text-red-500">*</span>
                        </label>
                        <DatePicker
                          value={formData.originalReleaseDate || ''}
                          onChange={(date) => setFormData(prev => ({ ...prev, originalReleaseDate: date }))}
                          maxDate={new Date().toISOString().split('T')[0]}
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {t('최초 발매된 날짜', 'First release date', '最初のリリース日')}
                        </p>
                      </div>

                      {/* Release Time */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t('발매 시간', 'Release Time', 'リリース時間')} <span className="text-red-500">*</span>
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
                            {t('정확한 발매 시간을 입력해주세요', 'Please enter the exact release time', '正確なリリース時間を入力してください')}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Timezone Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('타임존 (시간대)', 'Timezone', 'タイムゾーン')} <span className="text-red-500">*</span>
                      </label>
                      <SearchableSelect
                        options={timezones.map(tz => ({
                          value: tz.value,
                          label: `${tz.label} (${tz.offset})`
                        }))}
                        value={formData.timezone}
                        onChange={(value) => setFormData(prev => ({ ...prev, timezone: value }))}
                        placeholder={t('시간대 선택', 'Select timezone', 'タイムゾーンを選択')}
                        searchPlaceholder={t('시간대 검색...', 'Search timezones...', 'タイムゾーンを検索...')}
                        className="w-full"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {t('선택한 시간대를 기준으로 발매 시간이 설정됩니다', 'Release time will be set based on selected timezone', '選択したタイムゾーンに基づいてリリース時間が設定されます')}
                      </p>
                    </div>

                    {/* UTC Conversion Display */}
                    {formData.consumerReleaseDate && formData.releaseTime && formData.timezone && (
                      <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Globe className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          <h4 className="text-sm font-medium text-purple-800 dark:text-purple-200">
                            {t('UTC 변환 정보', 'UTC Conversion Info', 'UTC変換情報')}
                          </h4>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-purple-700 dark:text-purple-300">
                            <span className="font-medium">{t('컨슈머 발매시간', 'Consumer Release Time', 'コンシューマーリリース時間')}:</span> {formData.consumerReleaseDate} {formData.releaseTime} ({formData.timezone})
                          </p>
                          <p className="text-sm text-purple-700 dark:text-purple-300">
                            <span className="font-medium">{t('UTC 변환', 'UTC Time', 'UTC時間')}:</span> {
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

              {/* UPC & Copyright - Full Width Optimized Grid */}
              <div className="md:col-span-2 space-y-6">
                {/* UPC Row */}
                <div className="flex gap-3 items-end">
                  <div className="flex-1 max-w-md">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      UPC
                    </label>
                    <input
                      type="text"
                      value={formData.upc || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, upc: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 dark:bg-gray-700 dark:text-white"
                      placeholder={t('UPC 코드', 'UPC code', 'UPCコード')}
                    />
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={handleGenerateUPC}
                      className="px-6 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors font-medium whitespace-nowrap"
                    >
                      {t('생성', 'Generate', '生成')}
                    </button>
                  </div>
                </div>

                {/* Copyright Info (P&C) */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    {t('저작권 정보 (P&C)', 'Copyright Information (P&C)', '著作権情報 (P&C)')}
                  </h3>

                  {/* Optimized Grid: Name fields (3 cols) + Year fields (1 col each) */}
                  <div className="grid grid-cols-8 gap-4">
                    {/* Copyright Holder - 3 columns */}
                    <div className="col-span-3">
                      <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <span className="inline-flex items-center justify-center w-5 h-5 text-base mr-2">©</span> {t('저작권자 (Copyright)', 'Copyright Holder', '著作権者 (Copyright)')} *
                      </label>
                      <input
                        type="text"
                        value={formData.copyrightHolder}
                        onChange={(e) => setFormData(prev => ({ ...prev, copyrightHolder: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 dark:bg-gray-700 dark:text-white"
                        placeholder={t('저작권 소유자명', 'Copyright holder name', '著作権所有者名')}
                      />
                    </div>

                    {/* Copyright Year - 1 column */}
                    <div className="col-span-1">
                      <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <span className="inline-flex items-center justify-center w-5 h-5 text-base mr-2">©</span> {t('저작권 연도', 'Copyright Year', '著作権年')} *
                      </label>
                      <input
                        type="text"
                        value={formData.copyrightYear}
                        onChange={(e) => setFormData(prev => ({ ...prev, copyrightYear: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 dark:bg-gray-700 dark:text-white text-center"
                        placeholder="2025"
                        maxLength={4}
                      />
                    </div>

                    {/* Production Holder - 3 columns */}
                    <div className="col-span-3">
                      <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <span className="inline-flex items-center justify-center w-6 h-6 text-xl mr-2">℗</span> {t('제작권자 (Production)', 'Production Holder', '制作権者 (Production)')} *
                      </label>
                      <input
                        type="text"
                        value={formData.productionHolder}
                        onChange={(e) => setFormData(prev => ({ ...prev, productionHolder: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 dark:bg-gray-700 dark:text-white"
                        placeholder={t('음원 제작권 소유자명', 'Production rights holder name', '音源制作権所有者名')}
                      />
                    </div>

                    {/* Production Year - 1 column */}
                    <div className="col-span-1">
                      <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <span className="inline-flex items-center justify-center w-6 h-6 text-xl mr-2">℗</span> {t('제작권 연도', 'Production Year', '制作権年')} *
                      </label>
                      <input
                        type="text"
                        value={formData.productionYear}
                        onChange={(e) => setFormData(prev => ({ ...prev, productionYear: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 dark:bg-gray-700 dark:text-white text-center"
                        placeholder="2025"
                        maxLength={4}
                      />
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                    {t(
                      '© (Copyright)는 작곡/작사 권리, ℗ (Production)는 녹음/제작 권리를 의미합니다',
                      '© (Copyright) refers to composition/lyrics rights, ℗ (Production) refers to recording/production rights',
                      '© (Copyright)は作曲/作詞権利、℗ (Production)は録音/制作権利を意味します'
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('트랙 정보', 'Track Information', 'トラック情報')}
              </h2>
              <button
                id="add-track-button"
                type="button"
                onClick={addTrack}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                <Plus className="w-4 h-4" />
                {t('트랙 추가', 'Add Track', 'トラックを追加')}
              </button>
            </div>

            <div id="tracks-section" className="space-y-4">
              {formData.tracks.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                  <Music className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    {t('트랙을 추가해주세요', 'Please add tracks', 'トラックを追加してください')}
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('드래그하여 트랙 순서를 변경할 수 있습니다', 'Drag to reorder tracks', 'ドラッグしてトラックの順序を変更できます')}
                  </p>
                  {formData.tracks.map((track, index) => (
                    <TrackItem
                      key={track.id}
                      track={track}
                      index={index}
                      isTranslationOpen={showTrackTranslations[track.id] || false}
                      onToggleTranslation={handleToggleTrackTranslation}
                    />
                  ))}
                </>
              )}
            </div>

            {/* Track Warnings Manager for bulk operations */}
            <TrackWarningsManager
              trackIds={formData.tracks.map(t => t.id)}
              language={language}
              onAcceptAll={(group) => {
                console.log(`Accepted all warnings in group: ${group}`);
                // Track changes are already handled by the hook
              }}
              onDismissAll={(group) => {
                console.log(`Dismissed all warnings in group: ${group}`);
              }}
            />

            {/* Volume Setup Guide */}
            {formData.totalVolumes > 1 && (
              <div className="mt-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-amber-900 dark:text-amber-200 mb-2">
                      {t('멀티 볼륨 설정 가이드', 'Multi-Volume Setup Guide', 'マルチボリューム設定ガイド')}
                    </p>
                    <div className="space-y-2 text-amber-800 dark:text-amber-300">
                      <p>
                        {t(
                          '⚠️ 중요: 제품 승인 후에는 볼륨 수나 볼륨별 트랙 순서를 변경할 수 없습니다.',
                          '⚠️ Important: Once approved, you cannot change the number of volumes or track order per volume.',
                          '⚠️ 重要：製品承認後はボリューム数やボリューム別トラック順序を変更できません。'
                        )}
                      </p>
                      <p className="font-medium">
                        {t('현재 설정:', 'Current setup:', '現在の設定:')} {formData.totalVolumes} {t('볼륨', 'volumes', 'ボリューム')}
                      </p>
                      <div className="mt-3">
                        <p className="font-medium mb-1">{t('예시 (3개 볼륨, 각 3곡):', 'Example (3 volumes, 3 tracks each):', '例（3ボリューム、各3曲）：')}</p>
                        <ul className="space-y-1 ml-4">
                          <li>• {t('트랙 1-3 → 볼륨 1 선택', 'Tracks 1-3 → Select Volume 1', 'トラック1-3 → ボリューム1選択')}</li>
                          <li>• {t('트랙 4-6 → 볼륨 2 선택', 'Tracks 4-6 → Select Volume 2', 'トラック4-6 → ボリューム2選択')}</li>
                          <li>• {t('트랙 7-9 → 볼륨 3 선택', 'Tracks 7-9 → Select Volume 3', 'トラック7-9 → ボリューム3選択')}</li>
                        </ul>
                      </div>
                      <p className="text-xs mt-2">
                        {t(
                          '각 트랙을 올바른 볼륨에 연속적으로 할당해야 DSP에 정확히 표시됩니다.',
                          'Assign tracks consecutively per volume for correct display on DSPs.',
                          '各トラックを正しいボリュームに連続的に割り当てる必要があります。'
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('파일 업로드', 'File Upload', 'ファイルアップロード')}
            </h2>

            {/* File Guidelines */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
                    {t('파일 형식 가이드라인', 'File Format Guidelines', 'ファイル形式ガイドライン')}
                  </p>
                  <ul className="space-y-1 text-blue-800 dark:text-blue-300">
                    <li>• {t('커버 아트: 3000x3000px 이상, JPG/PNG, RGB 색상 모드', 'Cover Art: Min 3000x3000px, JPG/PNG, RGB color mode', 'カバーアート：3000x3000px以上、JPG/PNG、RGBカラーモード')}</li>
                    <li>• {t('오디오: WAV/FLAC, 24bit/96kHz 이상 권장, 스테레오', 'Audio: WAV/FLAC, 24bit/96kHz+ recommended, Stereo', 'オーディオ：WAV/FLAC、24bit/96kHz以上推奨、ステレオ')}</li>
                    <li>• {t('Dolby Atmos: ADM BWF 또는 .atmos 파일', 'Dolby Atmos: ADM BWF or .atmos file', 'Dolby Atmos：ADM BWFまたは.atmosファイル')}</li>
                    <li>• {t('모션 아트: MP4/MOV, 3-10초, 최대 100MB', 'Motion Art: MP4/MOV, 3-10 seconds, Max 100MB', 'モーションアート：MP4/MOV、3-10秒、最大100MB')}</li>
                    <li>• {t('뮤직비디오: MP4/MOV, H.264, 1920x1080 이상', 'Music Video: MP4/MOV, H.264, 1920x1080+', 'ミュージックビデオ：MP4/MOV、H.264、1920x1080以上')}</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Cover Art */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                {t('커버 아트', 'Cover Art', 'カバーアート')}
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
                    {t('클릭하여 이미지 선택', 'Click to select image', 'クリックして画像を選択')}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    {t('최소 3000x3000px, JPG/PNG, RGB 색상 모드', 'Min 3000x3000px, JPG/PNG, RGB color mode', '最小3000x3000px、JPG/PNG、RGBカラーモード')}
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
                {t('오디오 파일', 'Audio Files', 'オーディオファイル')}
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
                  {t('오디오 파일 추가', 'Add audio files', 'オーディオファイルを追加')}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {t('WAV, FLAC (24bit/96kHz 이상 권장)', 'WAV, FLAC (24bit/96kHz or higher recommended)', 'WAV、FLAC（24bit/96kHz以上推奨）')}
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
                {t('Dolby Atmos 파일', 'Dolby Atmos Files', 'Dolby Atmosファイル')}
                <span className="text-gray-500 ml-1">{t('(선택사항)', '(Optional)', '（オプション）')}</span>
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
                          const newFiles = [...(formData.dolbyAtmosFiles || [])];
                          newFiles.splice(index, 1);
                          setFormData(prev => ({ ...prev, dolbyAtmosFiles: newFiles }));
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
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = '.atmos,.bwf';
                  input.multiple = true;
                  input.onchange = (e) => {
                    const files = Array.from((e.target as HTMLInputElement).files || []);
                    setFormData(prev => ({ ...prev, dolbyAtmosFiles: [...(prev.dolbyAtmosFiles || []), ...files] }));
                  };
                  input.click();
                }}
                className="w-full p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-purple-500 dark:hover:border-purple-400 transition-colors bg-gray-50 dark:bg-gray-800/30 hover:bg-gray-100 dark:hover:bg-gray-800/50"
              >
                <Disc className="w-8 h-8 mx-auto text-gray-400 dark:text-gray-500 mb-2" />
                <p className="text-gray-700 dark:text-gray-300 font-medium">
                  {t('Dolby Atmos 파일 추가', 'Add Dolby Atmos files', 'Dolby Atmosファイルを追加')}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {t('ADM BWF 또는 .atmos 파일', 'ADM BWF or .atmos files', 'ADM BWFまたは.atmosファイル')}
                </p>
              </button>
            </div>

            {/* Motion Art */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                {t('모션 아트', 'Motion Art', 'モーションアート')}
                <span className="text-gray-500 ml-1">{t('(선택사항)', '(Optional)', '（オプション）')}</span>
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
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'video/mp4,video/quicktime';
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) setFormData(prev => ({ ...prev, motionArtFile: file }));
                    };
                    input.click();
                  }}
                  className="w-full p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-purple-500 dark:hover:border-purple-400 transition-colors bg-gray-50 dark:bg-gray-800/30 hover:bg-gray-100 dark:hover:bg-gray-800/50"
                >
                  <Star className="w-8 h-8 mx-auto text-gray-400 dark:text-gray-500 mb-2" />
                  <p className="text-gray-700 dark:text-gray-300 font-medium">
                    {t('모션 아트 추가', 'Add Motion Art', 'モーションアートを追加')}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {t('MP4/MOV, 3-10초, 최대 100MB', 'MP4/MOV, 3-10 seconds, Max 100MB', 'MP4/MOV、3-10秒、最大100MB')}
                  </p>
                </button>
              )}
            </div>

            {/* Music Videos */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                {t('뮤직비디오', 'Music Videos', 'ミュージックビデオ')}
                <span className="text-gray-500 ml-1">{t('(선택사항)', '(Optional)', '（オプション）')}</span>
              </label>

              {formData.musicVideoFiles && formData.musicVideoFiles.length > 0 ? (
                <div className="space-y-2">
                  {formData.musicVideoFiles.map((file, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                      <Film className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-gray-100">{file.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          musicVideoFiles: prev.musicVideoFiles?.filter((_, i) => i !== index)
                        }))}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'video/mp4,video/quicktime';
                      input.multiple = true;
                      input.onchange = (e) => {
                        const files = Array.from((e.target as HTMLInputElement).files || []);
                        if (files.length) {
                          setFormData(prev => ({
                            ...prev,
                            musicVideoFiles: [...(prev.musicVideoFiles || []), ...files]
                          }));
                        }
                      };
                      input.click();
                    }}
                    className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors cursor-pointer"
                  >
                    <Plus className="w-5 h-5 mx-auto text-gray-400 dark:text-gray-500" />
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {t('뮤직비디오 추가', 'Add More Videos', 'ミュージックビデオを追加')}
                    </p>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'video/mp4,video/quicktime';
                    input.multiple = true;
                    input.onchange = (e) => {
                      const files = Array.from((e.target as HTMLInputElement).files || []);
                      if (files.length) {
                        setFormData(prev => ({
                          ...prev,
                          musicVideoFiles: files
                        }));
                      }
                    };
                    input.click();
                  }}
                  className="w-full p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-purple-500 dark:hover:border-purple-400 transition-colors bg-gray-50 dark:bg-gray-800/30 hover:bg-gray-100 dark:hover:bg-gray-800/50"
                >
                  <Film className="w-8 h-8 mx-auto text-gray-400 dark:text-gray-500 mb-2" />
                  <p className="text-gray-700 dark:text-gray-300 font-medium">
                    {t('뮤직비디오 추가', 'Add Music Videos', 'ミュージックビデオを追加')}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {t('MP4/MOV, H.264, 1920x1080 이상 (여러 개 선택 가능)', 'MP4/MOV, H.264, 1920x1080+ (multiple selection)', 'MP4/MOV、H.264、1920x1080以上（複数選択可能）')}
                  </p>
                </button>
              )}
            </div>

            {/* Music Video Thumbnails */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                {t('뮤직비디오 썸네일', 'Music Video Thumbnails', 'ミュージックビデオサムネイル')}
                <span className="text-gray-500 ml-1">{t('(선택사항)', '(Optional)', '（オプション）')}</span>
              </label>

              {formData.musicVideoThumbnails && formData.musicVideoThumbnails.length > 0 ? (
                <div className="space-y-2">
                  {formData.musicVideoThumbnails.map((file, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                      <Image className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-gray-100">{file.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          musicVideoThumbnails: prev.musicVideoThumbnails?.filter((_, i) => i !== index)
                        }))}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/jpeg,image/jpg,image/png';
                      input.multiple = true;
                      input.onchange = (e) => {
                        const files = Array.from((e.target as HTMLInputElement).files || []);
                        if (files.length) {
                          setFormData(prev => ({
                            ...prev,
                            musicVideoThumbnails: [...(prev.musicVideoThumbnails || []), ...files]
                          }));
                        }
                      };
                      input.click();
                    }}
                    className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors cursor-pointer"
                  >
                    <Plus className="w-5 h-5 mx-auto text-gray-400 dark:text-gray-500" />
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {t('썸네일 추가', 'Add More Thumbnails', 'サムネイルを追加')}
                    </p>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/jpeg,image/jpg,image/png';
                    input.multiple = true;
                    input.onchange = (e) => {
                      const files = Array.from((e.target as HTMLInputElement).files || []);
                      if (files.length) {
                        setFormData(prev => ({
                          ...prev,
                          musicVideoThumbnails: files
                        }));
                      }
                    };
                    input.click();
                  }}
                  className="w-full p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-purple-500 dark:hover:border-purple-400 transition-colors bg-gray-50 dark:bg-gray-800/30 hover:bg-gray-100 dark:hover:bg-gray-800/50"
                >
                  <Image className="w-8 h-8 mx-auto text-gray-400 dark:text-gray-500 mb-2" />
                  <p className="text-gray-700 dark:text-gray-300 font-medium">
                    {t('썸네일 추가', 'Add Thumbnails', 'サムネイルを追加')}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {t('JPG, PNG 형식 (여러 개 선택 가능)', 'JPG, PNG format (multiple selection)', 'JPG、PNG形式（複数選択可能）')}
                  </p>
                </button>
              )}
            </div>

            {/* Lyrics Files */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                {t('가사 파일', 'Lyrics Files', '歌詞ファイル')}
                <span className="text-gray-500 ml-1">{t('(선택사항)', '(Optional)', '（オプション）')}</span>
              </label>

              {formData.lyricsFiles && formData.lyricsFiles.length > 0 ? (
                <div className="space-y-2">
                  {formData.lyricsFiles.map((file, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                      <FileText className="w-8 h-8 text-green-600 dark:text-green-400" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-gray-100">{file.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {(file.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          lyricsFiles: prev.lyricsFiles?.filter((_, i) => i !== index)
                        }))}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = '.txt,.lrc,.pdf';
                      input.multiple = true;
                      input.onchange = (e) => {
                        const files = Array.from((e.target as HTMLInputElement).files || []);
                        if (files.length) {
                          setFormData(prev => ({
                            ...prev,
                            lyricsFiles: [...(prev.lyricsFiles || []), ...files]
                          }));
                        }
                      };
                      input.click();
                    }}
                    className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors cursor-pointer"
                  >
                    <Plus className="w-5 h-5 mx-auto text-gray-400 dark:text-gray-500" />
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {t('가사 파일 추가', 'Add More Lyrics')}
                    </p>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '.txt,.lrc,.pdf';
                    input.multiple = true;
                    input.onchange = (e) => {
                      const files = Array.from((e.target as HTMLInputElement).files || []);
                      if (files.length) {
                        setFormData(prev => ({
                          ...prev,
                          lyricsFiles: files
                        }));
                      }
                    };
                    input.click();
                  }}
                  className="w-full p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-purple-500 dark:hover:border-purple-400 transition-colors bg-gray-50 dark:bg-gray-800/30 hover:bg-gray-100 dark:hover:bg-gray-800/50"
                >
                  <FileText className="w-8 h-8 mx-auto text-gray-400 dark:text-gray-500 mb-2" />
                  <p className="text-gray-700 dark:text-gray-300 font-medium">
                    {t('가사 파일 추가', 'Add Lyrics Files')}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {t('TXT, LRC, PDF 형식 (여러 개 선택 가능)', 'TXT, LRC, PDF format (multiple selection)')}
                  </p>
                </button>
              )}
            </div>

            {/* Marketing Assets */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                {t('마케팅 자료', 'Marketing Assets')}
                <span className="text-gray-500 ml-1">{t('(선택사항)', '(Optional)')}</span>
              </label>

              {formData.marketingAssets && formData.marketingAssets.length > 0 ? (
                <div className="space-y-2">
                  {formData.marketingAssets.map((file, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                      <Folder className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-gray-100">{file.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          marketingAssets: prev.marketingAssets?.filter((_, i) => i !== index)
                        }))}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*,video/*,.pdf,.doc,.docx,.ppt,.pptx,.zip';
                      input.multiple = true;
                      input.onchange = (e) => {
                        const files = Array.from((e.target as HTMLInputElement).files || []);
                        if (files.length) {
                          setFormData(prev => ({
                            ...prev,
                            marketingAssets: [...(prev.marketingAssets || []), ...files]
                          }));
                        }
                      };
                      input.click();
                    }}
                    className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors cursor-pointer"
                  >
                    <Plus className="w-5 h-5 mx-auto text-gray-400 dark:text-gray-500" />
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {t('마케팅 자료 추가', 'Add More Assets')}
                    </p>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*,video/*,.pdf,.doc,.docx,.ppt,.pptx,.zip';
                    input.multiple = true;
                    input.onchange = (e) => {
                      const files = Array.from((e.target as HTMLInputElement).files || []);
                      if (files.length) {
                        setFormData(prev => ({
                          ...prev,
                          marketingAssets: files
                        }));
                      }
                    };
                    input.click();
                  }}
                  className="w-full p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-purple-500 dark:hover:border-purple-400 transition-colors bg-gray-50 dark:bg-gray-800/30 hover:bg-gray-100 dark:hover:bg-gray-800/50"
                >
                  <Folder className="w-8 h-8 mx-auto text-gray-400 dark:text-gray-500 mb-2" />
                  <p className="text-gray-700 dark:text-gray-300 font-medium">
                    {t('마케팅 자료 추가', 'Add Marketing Assets')}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {t('이미지, 비디오, PDF, 문서 형식 (여러 개 선택 가능)', 'Images, Videos, PDF, Documents (multiple selection)')}
                  </p>
                </button>
              )}
            </div>
          </div>
        );

      case 4: // Marketing Details
        return (
          <Step11MarketingDetails
            formData={formData}
            onChange={(updates) => setFormData(prev => ({ ...prev, ...updates }))}
          />
        );

      case 5: // Goals & Expectations
        // Only show if priority is 5 (highest)
        if (formData.marketingInfo?.priorityLevel === 5) {
          return (
            <Step12GoalsExpectations
              formData={formData}
              onChange={(updates) => setFormData(prev => ({ ...prev, ...updates }))}
            />
          );
        } else {
          // If priority is not 5, skip to next step
          return (
            <div className="space-y-6">
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {t('목표 설정 건너뛰기', 'Skip Goals & Expectations', '目標設定をスキップ')}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 text-center">
                  {t(
                    '우선순위가 최고 레벨(5)이 아니므로 이 단계를 건너뜁니다. 다음을 클릭하여 계속하세요.',
                    'Since priority is not at the highest level (5), this step will be skipped. Click next to continue.',
                    '優先度が最高レベル（5）ではないため、このステップはスキップされます。次へをクリックして続行してください。'
                  )}
                </p>
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  {t('다음으로 계속', 'Continue to Next', '次へ続ける')}
                </button>
              </div>
            </div>
          );
        }

      case 6: // Distribution
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

            {/* Territory Selection */}
            <div id="territory-selection">
              <TerritorySelector
                value={formData.territorySelection}
                onChange={(value) => setFormData(prev => ({ ...prev, territorySelection: value }))}
              />
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-6">
            {/* Comprehensive Final Review */}
            <FinalReviewContent
              formData={formData}
              onEdit={handleEdit}
              t={t}
            />

            {/* QC Warnings */}
            {showWarnings && validationResults && (
              <div data-qc-warnings className="scroll-mt-4">
                <QCWarnings
                  warnings={validationResults.warnings}
                  errors={validationResults.errors}
                  onClose={() => setShowWarnings(false)}
                />
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-center pt-4">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                    {t('제출 중...', 'Submitting...')}
                  </span>
                ) : (
                  isEditMode
                    ? t('수정 완료', 'Update Release')
                    : isResubmitMode
                      ? t('재제출', 'Resubmit Release')
                      : t('릴리즈 제출', 'Submit Release')
                )}
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Progress Steps
  const steps = [
    { number: 1, title: t('앨범 정보', 'Album Info'), icon: Disc },
    { number: 2, title: t('트랙 정보', 'Track Info'), icon: Music },
    { number: 3, title: t('배포 설정', 'Distribution'), icon: Globe },
    { number: 4, title: t('최종 검토', 'Review'), icon: CheckCircle }
  ];

  return (
    <SavedArtistsProvider>
      {/* Persistent Error Banner - Always visible at top when errors exist */}
      {validationResults && validationResults.errors.length > 0 && (
        <PersistentErrorBanner
          errors={validationResults.errors.map(err => ({
            field: err.field || 'Unknown',
            message: err.message,
            severity: 'error' as const
          }))}
          onDismiss={() => setValidationResults(null)}
          onShowDetails={() => setShowQCErrorModal(true)}
        />
      )}

      <div className="min-h-screen bg-transparent py-8">
        <div className="w-full px-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {t('릴리즈 제출', 'Release Submission')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {t('새로운 음원을 전 세계에 배포하세요', 'Distribute your new music worldwide')}
            </p>
          </div>

          {/* Progress Bar - Hidden during Dolby decision */}
          {!isDolbyDecisionStep && (
            <div className="mb-8 w-full px-12">
              <div className="relative">
                {/* Background line */}
                <div className="absolute top-6 left-0 right-0 h-0.5 bg-gray-300 dark:bg-gray-700" />

                {/* Progress line */}
                <div
                  className="absolute top-6 left-0 h-0.5 bg-gray-900 dark:bg-white transition-all duration-300"
                  style={{ width: `${((getCurrentDisplayStep() - 1) / (steps.length - 1)) * 100}%` }}
                />

                {/* Steps */}
                <div className="relative flex items-start justify-between">
                  {steps.map((step, index) => {
                  const Icon = step.icon;
                  const displayStep = getCurrentDisplayStep();
                  const isActive = displayStep === step.number;
                  // Map display step to actual step for completion check
                  const stepMapping = { 1: 1, 2: 2, 3: 6, 4: 7 };
                  const actualStep = stepMapping[step.number as keyof typeof stepMapping];
                  const isCompleted = completedSteps.includes(actualStep);
                  const isClickable = step.number <= displayStep || isCompleted;

                  return (
                    <button
                      key={step.number}
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
                            ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 ring-4 ring-gray-900/20 dark:ring-white/20'
                            : isCompleted
                              ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                              : 'bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle className="w-6 h-6" />
                        ) : (
                          <Icon className="w-6 h-6" />
                        )}
                      </div>
                      <span
                        className={`mt-2 text-sm whitespace-nowrap ${
                          isActive
                            ? 'text-gray-900 dark:text-white font-semibold'
                            : 'text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        {step.title}
                      </span>
                    </button>
                  );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 md:p-8">
            {renderStepContent()}

            {/* Navigation - Hidden during Dolby decision (buttons are in the card) */}
            {!isDolbyDecisionStep && (
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

                {currentStep < 7 && (
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
            )}
          </div>
        </div>

        {/* Artist Management Modal */}
        {console.log('showAlbumArtistModal state:', showAlbumArtistModal)}
        {showAlbumArtistModal && (
          <ArtistManagementModal
            isOpen={showAlbumArtistModal}
            onClose={() => {
              console.log('Closing Album Artist Modal');
              setShowAlbumArtistModal(false);
            }}
            artists={formData.albumArtists}
            onSave={(artists) => {
              setFormData(prev => ({
                ...prev,
                albumArtists: artists,
                // Update albumArtist for backward compatibility
                albumArtist: artists.find(a => a.role === 'main')?.name || ''
              }));
              setShowAlbumArtistModal(false);
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
              }));
              setShowAlbumFeaturingArtistModal(false);
            }}
            albumLevel={false}
            isFeaturing={true}
          />
        )}

        {/* Track Artist Management Modal */}
        {showTrackArtistModal && (
          <ArtistManagementModal
            isOpen={!!showTrackArtistModal}
            onClose={() => {
              setShowTrackArtistModal(null);
              restoreScrollPosition();
            }}
            artists={formData.tracks.find(t => t.id === showTrackArtistModal)?.artists || []}
            onSave={(artists) => {
              setFormData(prev => ({
                ...prev,
                tracks: prev.tracks.map(t =>
                  t.id === showTrackArtistModal
                    ? { ...t, artists }
                    : t
                )
              }));
              setShowTrackArtistModal(null);
              restoreScrollPosition();
            }}
            albumLevel={false}
          />
        )}

        {/* Featuring Artist Management Modal */}
        {showFeaturingArtistModal && (
          <ArtistManagementModal
            isOpen={!!showFeaturingArtistModal}
            onClose={() => {
              setShowFeaturingArtistModal(null);
              restoreScrollPosition();
            }}
            artists={formData.tracks.find(t => t.id === showFeaturingArtistModal)?.featuringArtists || []}
            onSave={(artists) => {
              setFormData(prev => ({
                ...prev,
                tracks: prev.tracks.map(t =>
                  t.id === showFeaturingArtistModal
                    ? { ...t, featuringArtists: artists }
                    : t
                )
              }));
              setShowFeaturingArtistModal(null);
              restoreScrollPosition();
            }}
            albumLevel={false}
            isFeaturing={true}
          />
        )}

        {/* Contributor Management Modal */}
        {showContributorModal && (() => {
          const currentTrack = formData.tracks.find(t => t.id === showContributorModal);

          // Combine album artists and track artists for suggestions
          const allArtists = [
            ...(formData.albumArtists || []).map(a => ({ ...a, role: 'main' as const })),
            ...(currentTrack?.artists || [])
          ];

          const allFeaturingArtists = [
            ...(formData.albumFeaturingArtists || []),
            ...(currentTrack?.featuringArtists || [])
          ];

          return (
            <ContributorManagementModal
              isOpen={!!showContributorModal}
              onClose={() => {
                setShowContributorModal(null);
                restoreScrollPosition();
              }}
              contributors={currentTrack?.contributors || []}
              onSave={(contributors) => {
                setFormData(prev => ({
                  ...prev,
                  tracks: prev.tracks.map(t =>
                    t.id === showContributorModal
                      ? { ...t, contributors }
                      : t
                  )
                }));
                setShowContributorModal(null);
                restoreScrollPosition();
              }}
              trackTitle={currentTrack?.title}
              trackArtists={allArtists}
              trackFeaturingArtists={allFeaturingArtists}
            />
          );
        })()}
      </div>

      {/* QC Error Modal */}
      {showQCErrorModal && validationResults && validationResults.errors.length > 0 && (
        <QCErrorModal
          errors={validationResults.errors.map(err => ({
            field: err.field || 'Unknown',
            message: err.message,
            severity: 'error' as const,
            helpText: err.helpText
          }))}
          onClose={() => setShowQCErrorModal(false)}
          onFixError={(field) => {
            // Close modal and scroll to QC warnings
            setShowQCErrorModal(false);
            setTimeout(() => {
              const warningsElement = document.querySelector('[data-qc-warnings]');
              if (warningsElement) {
                warningsElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
              }
            }, 100);
          }}
        />
      )}

      {/* Success Modal */}
      <SubmissionSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        submissionId={submittedReleaseData.id}
        albumTitle={submittedReleaseData.albumTitle}
        artistName={submittedReleaseData.artistName}
        releaseDate={submittedReleaseData.releaseDate}
        timezone={submittedReleaseData.timezone}
        releaseUTC={submittedReleaseData.releaseUTC}
      />
    </SavedArtistsProvider>
  );
};

// Main component wrapped with ValidationProvider
const ImprovedReleaseSubmission: React.FC = () => {
  return (
    <ValidationProvider>
      <ImprovedReleaseSubmissionContent />
    </ValidationProvider>
  );
};

export default ImprovedReleaseSubmission;
