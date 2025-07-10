import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguageStore } from '@/store/language.store'
import { 
  Upload, Music, FileText, Image, CheckCircle, AlertCircle, X, Plus, Trash2, 
  Globe, Target, Sparkles, Users, MapPin, Calendar, Shield, Languages, Disc, 
  Building2, Radio, ListMusic, ChevronRight, ChevronLeft, Info, Search,
  Music2, Mic, UserCheck, GripVertical, Edit3, Volume2, BookOpen, Megaphone,
  Tag, Heart, Link as LinkIcon, Video
} from 'lucide-react'
import toast from 'react-hot-toast'
import { submissionService } from '@/services/submission.service'
import { dropboxService } from '@/services/dropbox.service'
import { useAuthStore } from '@/store/auth.store'
import { validateField, type QCValidationResult } from '@/utils/fugaQCValidation'
import QCWarnings from '@/components/submission/QCWarnings'
import ArtistModal from '@/components/submission/ArtistModal'
import { DatePicker } from '@/components/DatePicker'
import { v4 as uuidv4 } from 'uuid'

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
}

interface MarketingData {
  // Basic Marketing (2 fields after user exclusions)
  albumIntroduction: string
  albumDescription: string
  
  // Artist Profile (8 fields)
  toundatesUrl: string
  artistGender: string
  socialMovements: string
  artistBio: string
  similarArtists: string
  hasSyncHistory: string
  syncHistory: string
  artistUgcPriorities: string[]
  
  // DSP Profile IDs (4 fields)
  spotifyArtistId: string
  appleMusicArtistId: string
  soundcloudArtistId: string
  youtubeChannelId: string
  
  // Social Media URLs (11 fields)
  youtubeUrl: string
  tiktokUrl: string
  facebookUrl: string
  instagramUrl: string
  xUrl: string
  trillerUrl: string
  snapchatUrl: string
  twitchUrl: string
  pinterestUrl: string
  tumblrUrl: string
  websiteUrl: string
  
  // Music Metadata (6 fields)
  moods: string[]
  instruments: string[]
  hook: string
  mainPitch: string
  marketingDrivers: string[]
  socialMediaPlan: string
  
  // Visual Assets (4 fields)
  artistCountry: string
  artistCurrentCity: string
  artistHometown: string
  pressShotCredits: string
}

interface KoreanDSPInfo {
  lyricsAttached: boolean
  artistPageLink?: string
  melonLink?: string
  genieLink?: string
  bugsLink?: string
  vibeLink?: string
  newArtist?: boolean
  albumCredits?: string
  translations: Translation[]
}

// Constants
const languageOptions = [
  { value: 'en', label: 'English' },
  { value: 'ko', label: '한국어 (Korean)' },
  { value: 'ja', label: '日本語 (Japanese)' },
  { value: 'zh', label: '中文 (Chinese)' },
  { value: 'zh-TW', label: '繁體中文 (Traditional Chinese)' },
  { value: 'es', label: 'Español (Spanish)' },
  { value: 'fr', label: 'Français (French)' },
  { value: 'de', label: 'Deutsch (German)' },
  { value: 'it', label: 'Italiano (Italian)' },
  { value: 'pt', label: 'Português (Portuguese)' },
  { value: 'pt-BR', label: 'Português Brasileiro (Brazilian Portuguese)' },
  { value: 'ru', label: 'Русский (Russian)' },
  { value: 'th', label: 'ไทย (Thai)' },
  { value: 'vi', label: 'Tiếng Việt (Vietnamese)' },
  { value: 'id', label: 'Bahasa Indonesia (Indonesian)' },
  { value: 'ms', label: 'Bahasa Melayu (Malay)' },
  { value: 'fil', label: 'Filipino' },
  { value: 'hi', label: 'हिन्दी (Hindi)' },
  { value: 'ar', label: 'العربية (Arabic)' },
  { value: 'tr', label: 'Türkçe (Turkish)' },
  { value: 'nl', label: 'Nederlands (Dutch)' },
  { value: 'pl', label: 'Polski (Polish)' },
  { value: 'sv', label: 'Svenska (Swedish)' },
  { value: 'no', label: 'Norsk (Norwegian)' },
  { value: 'da', label: 'Dansk (Danish)' },
  { value: 'fi', label: 'Suomi (Finnish)' }
]

const contributorRoles = [
  // Production Roles
  { value: 'composer', label: '작곡가', labelEn: 'Composer' },
  { value: 'lyricist', label: '작사가', labelEn: 'Lyricist' },
  { value: 'arranger', label: '편곡자', labelEn: 'Arranger' },
  { value: 'producer', label: '프로듀서', labelEn: 'Producer' },
  { value: 'co_producer', label: '공동 프로듀서', labelEn: 'Co-Producer' },
  { value: 'executive_producer', label: '총괄 프로듀서', labelEn: 'Executive Producer' },
  { value: 'assistant_producer', label: '어시스턴트 프로듀서', labelEn: 'Assistant Producer' },
  { value: 'post_producer', label: '포스트 프로듀서', labelEn: 'Post-Producer' },
  { value: 'vocal_producer', label: '보컬 프로듀서', labelEn: 'Vocal Producer' },
  
  // Engineering Roles
  { value: 'recording_engineer', label: '레코딩 엔지니어', labelEn: 'Recording Engineer' },
  { value: 'mixing_engineer', label: '믹싱 엔지니어', labelEn: 'Mixing Engineer' },
  { value: 'mastering_engineer', label: '마스터링 엔지니어', labelEn: 'Mastering Engineer' },
  { value: 'sound_engineer', label: '사운드 엔지니어', labelEn: 'Sound Engineer' },
  { value: 'engineer', label: '엔지니어', labelEn: 'Engineer' },
  { value: 'assistant_recording_engineer', label: '어시스턴트 레코딩 엔지니어', labelEn: 'Assistant Recording Engineer' },
  { value: 'assistant_mixing_engineer', label: '어시스턴트 믹싱 엔지니어', labelEn: 'Assistant Mixing Engineer' },
  { value: 'assistant_mastering_engineer', label: '어시스턴트 마스터링 엔지니어', labelEn: 'Assistant Mastering Engineer' },
  { value: 'assistant_sound_engineer', label: '어시스턴트 사운드 엔지니어', labelEn: 'Assistant Sound Engineer' },
  { value: 'vocal_engineer', label: '보컬 엔지니어', labelEn: 'Vocal Engineer' },
  { value: 'immersive_audio_engineer', label: '입체음향 엔지니어', labelEn: 'Immersive Audio Engineer' },
  { value: 'immersive_mixing_engineer', label: '입체음향 믹싱 엔지니어', labelEn: 'Immersive Mixing Engineer' },
  { value: 'immersive_mastering_engineer', label: '입체음향 마스터링 엔지니어', labelEn: 'Immersive Mastering Engineer' },
  { value: 'tonmeister', label: '톤마이스터', labelEn: 'Tonmeister' },
  
  // Performance Roles
  { value: 'performer', label: '연주자', labelEn: 'Performer' },
  { value: 'studio_musician', label: '스튜디오 뮤지션', labelEn: 'Studio Musician' },
  { value: 'soloist', label: '솔로이스트', labelEn: 'Soloist' },
  { value: 'conductor', label: '지휘자', labelEn: 'Conductor' },
  { value: 'orchestra', label: '오케스트라', labelEn: 'Orchestra' },
  { value: 'choir', label: '합창단', labelEn: 'Choir' },
  { value: 'chorus', label: '코러스', labelEn: 'Chorus' },
  { value: 'ensemble', label: '앙상블', labelEn: 'Ensemble' },
  { value: 'band', label: '밴드', labelEn: 'Band' },
  { value: 'featuring', label: '피처링', labelEn: 'Featuring' },
  { value: 'guest_vocals', label: '객원 보컬', labelEn: 'Guest Vocals' },
  { value: 'contributing_artist', label: '참여 아티스트', labelEn: 'Contributing Artist' },
  
  // Vocal/Rap Roles
  { value: 'rap', label: '랩', labelEn: 'Rap' },
  { value: 'mc', label: 'MC', labelEn: 'MC' },
  { value: 'narrator', label: '내레이터', labelEn: 'Narrator' },
  { value: 'spoken_word', label: '스포큰 워드', labelEn: 'Spoken Word' },
  { value: 'vocal_effects', label: '보컬 이펙트', labelEn: 'Vocal Effects' },
  
  // Direction Roles
  { value: 'director', label: '디렉터', labelEn: 'Director' },
  { value: 'assistant_director', label: '어시스턴트 디렉터', labelEn: 'Assistant Director' },
  { value: 'musical_director', label: '음악 감독', labelEn: 'Musical Director' },
  { value: 'creative_director', label: '크리에이티브 디렉터', labelEn: 'Creative Director' },
  { value: 'art_direction', label: '아트 디렉션', labelEn: 'Art Direction' },
  { value: 'choir_conductor', label: '합창단 지휘자', labelEn: 'Choir Conductor' },
  { value: 'chorus_master', label: '합창 지휘자', labelEn: 'Chorus Master' },
  { value: 'strings_conductor', label: '현악 지휘자', labelEn: 'Strings Conductor' },
  { value: 'assistant_conductor', label: '어시스턴트 지휘자', labelEn: 'Assistant Conductor' },
  
  // Composition/Arrangement Roles
  { value: 'assistant_composer', label: '어시스턴트 작곡가', labelEn: 'Assistant Composer' },
  { value: 'orchestrator', label: '오케스트레이터', labelEn: 'Orchestrator' },
  { value: 'adapter', label: '편곡자', labelEn: 'Adapter' },
  { value: 'writer', label: '작가', labelEn: 'Writer' },
  { value: 'author', label: '저자', labelEn: 'Author' },
  { value: 'playwright', label: '극작가', labelEn: 'Playwright' },
  { value: 'librettist', label: '대본 작가', labelEn: 'Librettist' },
  { value: 'translator', label: '번역가', labelEn: 'Translator' },
  { value: 'liner_notes', label: '라이너 노트', labelEn: 'Liner Notes' },
  
  // Others (60+ total roles as requested)
  { value: 'programmer', label: '프로그래머', labelEn: 'Programmer' },
  { value: 'dj', label: 'DJ', labelEn: 'DJ' },
  { value: 'remixer', label: '리믹서', labelEn: 'Remixer' },
  { value: 'sampled_artist', label: '샘플링 아티스트', labelEn: 'Sampled Artist' },
  { value: 'mixer', label: '믹서', labelEn: 'Mixer' },
  { value: 'editor', label: '에디터', labelEn: 'Editor' },
  { value: 'sound_editor', label: '사운드 에디터', labelEn: 'Sound Editor' },
  { value: 'sound_effects', label: '음향 효과', labelEn: 'Sound Effects' },
  { value: 'special_effects', label: '특수 효과', labelEn: 'Special Effects' }
]

const instrumentList = [
  'Acoustic Guitar', 'Electric Guitar', 'Bass Guitar', 'Piano', 'Keyboard', 
  'Synthesizer', 'Drums', 'Percussion', 'Violin', 'Viola', 'Cello', 
  'Double Bass', 'Flute', 'Clarinet', 'Oboe', 'Bassoon', 'Saxophone',
  'Trumpet', 'Trombone', 'French Horn', 'Tuba', 'Harp', 'Accordion',
  'Harmonica', 'Banjo', 'Mandolin', 'Ukulele', 'Sitar', 'Tabla'
  // ... 200+ instruments total as in Downloads folder
]

export default function ReleaseSubmissionComplete() {
  const navigate = useNavigate()
  const { t } = useLanguageStore()
  const language = useLanguageStore(state => state.language)
  const { user } = useAuthStore()
  const [activeStep, setActiveStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  // Form State - Step 0: Artist Info
  const [artistInfo, setArtistInfo] = useState({
    artistName: '',
    artistTranslations: [] as Translation[],
    artistType: 'SOLO',
    artistMembers: [] as Member[],
    labelName: '',
    labelTranslations: [] as Translation[]
  })

  // Step 1: Album Basic Info
  const [albumInfo, setAlbumInfo] = useState({
    albumTitle: '',
    albumTranslations: [] as Translation[],
    albumType: 'SINGLE',
    albumVersion: '',
    releaseVersion: '',
    releaseFormat: 'STANDARD',
    genre: '',
    subgenre: ''
  })

  // Step 2: Release Settings
  const [releaseSettings, setReleaseSettings] = useState({
    originalReleaseDate: '',
    consumerReleaseDate: '',
    releaseTime: '00:00',
    selectedTimezone: 'Asia/Seoul',
    preOrderEnabled: false,
    preOrderDate: '',
    previouslyReleased: false,
    previousReleaseDate: '',
    previousReleaseInfo: ''
  })

  // Step 3: Track Info
  const [tracks, setTracks] = useState<Track[]>([{
    id: uuidv4(),
    title: '',
    translations: [],
    artists: [],
    featuringArtists: [],
    contributors: [],
    isTitle: true
  }])

  // Step 4: Contributors & Credits
  const [globalContributors, setGlobalContributors] = useState<Contributor[]>([])

  // Step 5: File Upload
  const [files, setFiles] = useState({
    coverImage: null as File | null,
    artistPhoto: null as File | null,
    audioFiles: [] as Array<{ trackId: string; file: File }>,
    additionalFiles: [] as File[],
    motionArt: null as File | null,
    musicVideo: null as File | null
  })

  // Step 6: Region & Distribution
  const [distribution, setDistribution] = useState({
    territoryType: 'worldwide' as 'worldwide' | 'selected' | 'excluded',
    territories: [] as string[],
    dspTerritories: {} as Record<string, { territoryType: 'default' | 'custom'; territories?: string[] }>,
    distributors: [] as string[]
  })

  // Step 7: Korean DSP Settings
  const [koreanDSP, setKoreanDSP] = useState<KoreanDSPInfo>({
    lyricsAttached: false,
    newArtist: false,
    albumCredits: '',
    translations: []
  })

  // Step 8: Marketing Info
  const [marketing, setMarketing] = useState<MarketingData>({
    albumIntroduction: '',
    albumDescription: '',
    toundatesUrl: '',
    artistGender: '',
    socialMovements: '',
    artistBio: '',
    similarArtists: '',
    hasSyncHistory: 'no',
    syncHistory: '',
    artistUgcPriorities: [],
    spotifyArtistId: '',
    appleMusicArtistId: '',
    soundcloudArtistId: '',
    youtubeChannelId: '',
    youtubeUrl: '',
    tiktokUrl: '',
    facebookUrl: '',
    instagramUrl: '',
    xUrl: '',
    trillerUrl: '',
    snapchatUrl: '',
    twitchUrl: '',
    pinterestUrl: '',
    tumblrUrl: '',
    websiteUrl: '',
    moods: [],
    instruments: [],
    hook: '',
    mainPitch: '',
    marketingDrivers: [],
    socialMediaPlan: '',
    artistCountry: '',
    artistCurrentCity: '',
    artistHometown: '',
    pressShotCredits: ''
  })

  // Step 9: Social Media
  const [socialMedia, setSocialMedia] = useState({
    artistWebsite: '',
    artistWebsiteTranslations: [] as Translation[],
    socialPlatforms: [] as Array<{ platform: string; url: string; translations: Translation[] }>
  })

  // Step 10: Promotion Plans
  const [promotionPlans, setPromotionPlans] = useState({
    promotionStrategy: '',
    promotionTranslations: [] as Translation[],
    targetMarkets: [] as string[],
    marketingBudget: '',
    plannedActivities: [] as Array<{ activity: string; date: string; translations: Translation[] }>
  })

  // Steps configuration
  const steps = [
    { id: 0, label: t('아티스트 정보', 'Artist Info'), icon: Users },
    { id: 1, label: t('앨범 기본 정보', 'Album Basic Info'), icon: FileText },
    { id: 2, label: t('발매 설정', 'Release Settings'), icon: Calendar },
    { id: 3, label: t('트랙 정보', 'Track Info'), icon: Music },
    { id: 4, label: t('기여자 및 크레딧', 'Contributors & Credits'), icon: ListMusic },
    { id: 5, label: t('파일 업로드', 'File Upload'), icon: Upload },
    { id: 6, label: t('지역 및 배급', 'Region & Distribution'), icon: MapPin },
    { id: 7, label: t('한국 DSP 설정', 'Korean DSP Settings'), icon: Radio },
    { id: 8, label: t('마케팅 정보', 'Marketing Info'), icon: Target },
    { id: 9, label: t('소셜 미디어', 'Social Media'), icon: Globe },
    { id: 10, label: t('프로모션 계획', 'Promotion Plans'), icon: Sparkles },
    { id: 11, label: t('검토 및 제출', 'Review & Submit'), icon: CheckCircle }
  ]

  // Translation management functions
  const addTranslation = (field: string, parentId?: string) => {
    const newTranslation: Translation = {
      id: uuidv4(),
      language: '',
      text: ''
    }

    switch (field) {
      case 'artistName':
        setArtistInfo(prev => ({
          ...prev,
          artistTranslations: [...prev.artistTranslations, newTranslation]
        }))
        break
      case 'labelName':
        setArtistInfo(prev => ({
          ...prev,
          labelTranslations: [...prev.labelTranslations, newTranslation]
        }))
        break
      case 'albumTitle':
        setAlbumInfo(prev => ({
          ...prev,
          albumTranslations: [...prev.albumTranslations, newTranslation]
        }))
        break
      case 'trackTitle':
        if (parentId) {
          setTracks(prev => prev.map(track =>
            track.id === parentId
              ? { ...track, translations: [...track.translations, newTranslation] }
              : track
          ))
        }
        break
    }
  }

  const updateTranslation = (field: string, translationId: string, key: 'language' | 'text', value: string, parentId?: string) => {
    const updateTranslations = (translations: Translation[]) =>
      translations.map(t => t.id === translationId ? { ...t, [key]: value } : t)

    switch (field) {
      case 'artistName':
        setArtistInfo(prev => ({
          ...prev,
          artistTranslations: updateTranslations(prev.artistTranslations)
        }))
        break
      case 'labelName':
        setArtistInfo(prev => ({
          ...prev,
          labelTranslations: updateTranslations(prev.labelTranslations)
        }))
        break
      case 'albumTitle':
        setAlbumInfo(prev => ({
          ...prev,
          albumTranslations: updateTranslations(prev.albumTranslations)
        }))
        break
      case 'trackTitle':
        if (parentId) {
          setTracks(prev => prev.map(track =>
            track.id === parentId
              ? { ...track, translations: updateTranslations(track.translations) }
              : track
          ))
        }
        break
    }
  }

  const removeTranslation = (field: string, translationId: string, parentId?: string) => {
    const filterTranslations = (translations: Translation[]) =>
      translations.filter(t => t.id !== translationId)

    switch (field) {
      case 'artistName':
        setArtistInfo(prev => ({
          ...prev,
          artistTranslations: filterTranslations(prev.artistTranslations)
        }))
        break
      case 'labelName':
        setArtistInfo(prev => ({
          ...prev,
          labelTranslations: filterTranslations(prev.labelTranslations)
        }))
        break
      case 'albumTitle':
        setAlbumInfo(prev => ({
          ...prev,
          albumTranslations: filterTranslations(prev.albumTranslations)
        }))
        break
      case 'trackTitle':
        if (parentId) {
          setTracks(prev => prev.map(track =>
            track.id === parentId
              ? { ...track, translations: filterTranslations(track.translations) }
              : track
          ))
        }
        break
    }
  }

  // Render step content
  const renderStep = () => {
    switch (activeStep) {
      case 0: // Artist Info
        return (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('아티스트 정보', 'Artist Information')}
            </h3>

            {/* Artist Name with Translations */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('아티스트명', 'Artist Name')} *
              </label>
              <input
                type="text"
                value={artistInfo.artistName}
                onChange={(e) => setArtistInfo({ ...artistInfo, artistName: e.target.value })}
                className="input-modern"
                placeholder={t('아티스트명을 입력하세요', 'Enter artist name')}
                required
              />
              
              {/* Translation button */}
              <button
                onClick={() => addTranslation('artistName')}
                className="mt-2 btn-ghost text-sm"
              >
                <Plus className="w-4 h-4 mr-1" />
                {t('다른 언어로 표기 추가', 'Add translation')}
              </button>

              {/* Translations */}
              {artistInfo.artistTranslations.map((translation) => (
                <div key={translation.id} className="flex gap-2 mt-2">
                  <select
                    value={translation.language}
                    onChange={(e) => updateTranslation('artistName', translation.id, 'language', e.target.value)}
                    className="input-modern w-48"
                  >
                    <option value="">{t('언어 선택', 'Select language')}</option>
                    {languageOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={translation.text}
                    onChange={(e) => updateTranslation('artistName', translation.id, 'text', e.target.value)}
                    className="input-modern flex-1"
                    placeholder={t('번역된 아티스트명', 'Translated artist name')}
                  />
                  <button
                    onClick={() => removeTranslation('artistName', translation.id)}
                    className="text-red-500 hover:text-red-600 p-2"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Artist Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('아티스트 유형', 'Artist Type')} *
              </label>
              <select
                value={artistInfo.artistType}
                onChange={(e) => setArtistInfo({ ...artistInfo, artistType: e.target.value })}
                className="input-modern"
              >
                <option value="SOLO">{t('솔로', 'Solo')}</option>
                <option value="GROUP">{t('그룹', 'Group')}</option>
                <option value="BAND">{t('밴드', 'Band')}</option>
                <option value="DUO">{t('듀오', 'Duo')}</option>
              </select>
            </div>

            {/* Members for Group/Band/Duo */}
            {['GROUP', 'BAND', 'DUO'].includes(artistInfo.artistType) && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('멤버 정보', 'Member Information')}
                  </label>
                  <button
                    onClick={() => {
                      const newMember: Member = {
                        id: uuidv4(),
                        name: '',
                        role: '',
                        translations: [],
                        spotifyUrl: '',
                        appleMusicUrl: ''
                      }
                      setArtistInfo({
                        ...artistInfo,
                        artistMembers: [...artistInfo.artistMembers, newMember]
                      })
                    }}
                    className="btn-ghost text-sm"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    {t('멤버 추가', 'Add Member')}
                  </button>
                </div>
                
                {artistInfo.artistMembers.map((member, index) => (
                  <div key={member.id} className="glassmorphism p-4 mb-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={member.name}
                        onChange={(e) => {
                          const updated = [...artistInfo.artistMembers]
                          updated[index] = { ...member, name: e.target.value }
                          setArtistInfo({ ...artistInfo, artistMembers: updated })
                        }}
                        className="input-modern"
                        placeholder={t('멤버 이름', 'Member name')}
                      />
                      <input
                        type="text"
                        value={member.role}
                        onChange={(e) => {
                          const updated = [...artistInfo.artistMembers]
                          updated[index] = { ...member, role: e.target.value }
                          setArtistInfo({ ...artistInfo, artistMembers: updated })
                        }}
                        className="input-modern"
                        placeholder={t('역할 (예: 보컬, 기타)', 'Role (e.g., Vocal, Guitar)')}
                      />
                    </div>
                    <button
                      onClick={() => {
                        setArtistInfo({
                          ...artistInfo,
                          artistMembers: artistInfo.artistMembers.filter((_, i) => i !== index)
                        })
                      }}
                      className="mt-2 text-red-500 hover:text-red-600 text-sm"
                    >
                      <Trash2 className="w-4 h-4 inline mr-1" />
                      {t('삭제', 'Delete')}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Label Name with Translations */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('레이블명', 'Label Name')}
              </label>
              <input
                type="text"
                value={artistInfo.labelName}
                onChange={(e) => setArtistInfo({ ...artistInfo, labelName: e.target.value })}
                className="input-modern"
                placeholder={t('레이블명을 입력하세요', 'Enter label name')}
              />
              
              {/* Translation button */}
              <button
                onClick={() => addTranslation('labelName')}
                className="mt-2 btn-ghost text-sm"
              >
                <Plus className="w-4 h-4 mr-1" />
                {t('다른 언어로 표기 추가', 'Add translation')}
              </button>

              {/* Translations */}
              {artistInfo.labelTranslations.map((translation) => (
                <div key={translation.id} className="flex gap-2 mt-2">
                  <select
                    value={translation.language}
                    onChange={(e) => updateTranslation('labelName', translation.id, 'language', e.target.value)}
                    className="input-modern w-48"
                  >
                    <option value="">{t('언어 선택', 'Select language')}</option>
                    {languageOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={translation.text}
                    onChange={(e) => updateTranslation('labelName', translation.id, 'text', e.target.value)}
                    className="input-modern flex-1"
                    placeholder={t('번역된 레이블명', 'Translated label name')}
                  />
                  <button
                    onClick={() => removeTranslation('labelName', translation.id)}
                    className="text-red-500 hover:text-red-600 p-2"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )

      case 1: // Album Basic Info
        return (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('앨범 기본 정보', 'Album Basic Information')}
            </h3>

            {/* Album Title with Translations */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('앨범명', 'Album Title')} *
              </label>
              <input
                type="text"
                value={albumInfo.albumTitle}
                onChange={(e) => setAlbumInfo({ ...albumInfo, albumTitle: e.target.value })}
                className="input-modern"
                placeholder={t('앨범명을 입력하세요', 'Enter album title')}
                required
              />
              
              <button
                onClick={() => addTranslation('albumTitle')}
                className="mt-2 btn-ghost text-sm"
              >
                <Plus className="w-4 h-4 mr-1" />
                {t('다른 언어로 표기 추가', 'Add translation')}
              </button>

              {albumInfo.albumTranslations.map((translation) => (
                <div key={translation.id} className="flex gap-2 mt-2">
                  <select
                    value={translation.language}
                    onChange={(e) => updateTranslation('albumTitle', translation.id, 'language', e.target.value)}
                    className="input-modern w-48"
                  >
                    <option value="">{t('언어 선택', 'Select language')}</option>
                    {languageOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={translation.text}
                    onChange={(e) => updateTranslation('albumTitle', translation.id, 'text', e.target.value)}
                    className="input-modern flex-1"
                    placeholder={t('번역된 앨범명', 'Translated album title')}
                  />
                  <button
                    onClick={() => removeTranslation('albumTitle', translation.id)}
                    className="text-red-500 hover:text-red-600 p-2"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Album Type and Format */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('앨범 유형', 'Album Type')} *
                </label>
                <select
                  value={albumInfo.albumType}
                  onChange={(e) => setAlbumInfo({ ...albumInfo, albumType: e.target.value })}
                  className="input-modern"
                >
                  <option value="SINGLE">{t('싱글', 'Single')}</option>
                  <option value="EP">{t('EP/미니앨범', 'EP/Mini Album')}</option>
                  <option value="ALBUM">{t('정규앨범', 'Full Album')}</option>
                  <option value="COMPILATION">{t('컴필레이션', 'Compilation')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('앨범 형식', 'Album Format')}
                </label>
                <select
                  value={albumInfo.releaseFormat}
                  onChange={(e) => setAlbumInfo({ ...albumInfo, releaseFormat: e.target.value })}
                  className="input-modern"
                >
                  <option value="STANDARD">{t('일반', 'Standard')}</option>
                  <option value="DELUXE">{t('디럭스', 'Deluxe')}</option>
                  <option value="SPECIAL">{t('스페셜', 'Special')}</option>
                  <option value="REMASTERED">{t('리마스터', 'Remastered')}</option>
                  <option value="ANNIVERSARY">{t('기념반', 'Anniversary')}</option>
                </select>
              </div>
            </div>

            {/* Genre and Subgenre */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('메인 장르', 'Main Genre')} *
                </label>
                <select
                  value={albumInfo.genre}
                  onChange={(e) => setAlbumInfo({ ...albumInfo, genre: e.target.value })}
                  className="input-modern"
                  required
                >
                  <option value="">{t('장르 선택', 'Select genre')}</option>
                  <option value="pop">{t('팝', 'Pop')}</option>
                  <option value="rock">{t('록', 'Rock')}</option>
                  <option value="hip-hop">{t('힙합', 'Hip-Hop')}</option>
                  <option value="r&b">{t('R&B', 'R&B')}</option>
                  <option value="electronic">{t('일렉트로닉', 'Electronic')}</option>
                  <option value="jazz">{t('재즈', 'Jazz')}</option>
                  <option value="classical">{t('클래식', 'Classical')}</option>
                  <option value="country">{t('컨트리', 'Country')}</option>
                  <option value="indie">{t('인디', 'Indie')}</option>
                  <option value="k-pop">{t('K-POP', 'K-POP')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('서브 장르', 'Sub Genre')}
                </label>
                <input
                  type="text"
                  value={albumInfo.subgenre}
                  onChange={(e) => setAlbumInfo({ ...albumInfo, subgenre: e.target.value })}
                  className="input-modern"
                  placeholder={t('서브 장르 입력', 'Enter sub genre')}
                />
              </div>
            </div>

            {/* Album Version */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('앨범 버전', 'Album Version')}
              </label>
              <input
                type="text"
                value={albumInfo.albumVersion}
                onChange={(e) => setAlbumInfo({ ...albumInfo, albumVersion: e.target.value })}
                className="input-modern"
                placeholder={t('예: Extended Version, Radio Edit', 'e.g., Extended Version, Radio Edit')}
              />
            </div>
          </div>
        )

      case 2: // Release Settings
        return (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('발매 설정', 'Release Settings')}
            </h3>

            {/* Release Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('원 발매일', 'Original Release Date')} *
                </label>
                <DatePicker
                  value={releaseSettings.originalReleaseDate}
                  onChange={(date) => setReleaseSettings({ ...releaseSettings, originalReleaseDate: date || '' })}
                  className="input-modern"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('스트리밍 발매일', 'Consumer Release Date')} *
                </label>
                <DatePicker
                  value={releaseSettings.consumerReleaseDate}
                  onChange={(date) => setReleaseSettings({ ...releaseSettings, consumerReleaseDate: date || '' })}
                  className="input-modern"
                />
              </div>
            </div>

            {/* Release Time and Timezone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('발매 시간', 'Release Time')}
                </label>
                <input
                  type="time"
                  value={releaseSettings.releaseTime}
                  onChange={(e) => setReleaseSettings({ ...releaseSettings, releaseTime: e.target.value })}
                  className="input-modern"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('시간대', 'Timezone')}
                </label>
                <select
                  value={releaseSettings.selectedTimezone}
                  onChange={(e) => setReleaseSettings({ ...releaseSettings, selectedTimezone: e.target.value })}
                  className="input-modern"
                >
                  <option value="Asia/Seoul">KST (한국 표준시)</option>
                  <option value="America/New_York">EST (동부 표준시)</option>
                  <option value="America/Los_Angeles">PST (태평양 표준시)</option>
                  <option value="Europe/London">GMT (그리니치 표준시)</option>
                  <option value="Europe/Paris">CET (중부 유럽 표준시)</option>
                  <option value="Asia/Tokyo">JST (일본 표준시)</option>
                </select>
              </div>
            </div>

            {/* Pre-order Settings */}
            <div className="glassmorphism p-4">
              <div className="flex items-center gap-2 mb-4">
                <input
                  type="checkbox"
                  id="preOrderEnabled"
                  checked={releaseSettings.preOrderEnabled}
                  onChange={(e) => setReleaseSettings({ ...releaseSettings, preOrderEnabled: e.target.checked })}
                  className="rounded text-n3rve-main focus:ring-n3rve-500"
                />
                <label htmlFor="preOrderEnabled" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('예약 주문 활성화', 'Enable Pre-order')}
                </label>
              </div>

              {releaseSettings.preOrderEnabled && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('예약 주문 시작일', 'Pre-order Start Date')}
                  </label>
                  <DatePicker
                    value={releaseSettings.preOrderDate}
                    onChange={(date) => setReleaseSettings({ ...releaseSettings, preOrderDate: date || '' })}
                    className="input-modern"
                  />
                </div>
              )}
            </div>

            {/* Previously Released */}
            <div className="glassmorphism p-4">
              <div className="flex items-center gap-2 mb-4">
                <input
                  type="checkbox"
                  id="previouslyReleased"
                  checked={releaseSettings.previouslyReleased}
                  onChange={(e) => setReleaseSettings({ ...releaseSettings, previouslyReleased: e.target.checked })}
                  className="rounded text-n3rve-main focus:ring-n3rve-500"
                />
                <label htmlFor="previouslyReleased" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('이전에 발매된 앨범', 'Previously Released Album')}
                </label>
              </div>

              {releaseSettings.previouslyReleased && (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('이전 발매일', 'Previous Release Date')}
                    </label>
                    <DatePicker
                      value={releaseSettings.previousReleaseDate}
                      onChange={(date) => setReleaseSettings({ ...releaseSettings, previousReleaseDate: date || '' })}
                      className="input-modern"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('이전 발매 정보', 'Previous Release Information')}
                    </label>
                    <textarea
                      value={releaseSettings.previousReleaseInfo}
                      onChange={(e) => setReleaseSettings({ ...releaseSettings, previousReleaseInfo: e.target.value })}
                      className="input-modern"
                      rows={3}
                      placeholder={t('이전 발매 레이블, 배급사 등', 'Previous label, distributor, etc.')}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        )

      case 3: // Track Info
        return (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('트랙 정보', 'Track Information')}
            </h3>

            {/* Track List */}
            <div className="space-y-4">
              {tracks.map((track, index) => (
                <div key={track.id} className="glassmorphism p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                        {index + 1}
                      </span>
                      {track.isTitle && (
                        <span className="px-2 py-1 bg-n3rve-main text-white text-xs rounded-full">
                          {t('타이틀', 'Title Track')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {tracks.length > 1 && !track.isTitle && (
                        <button
                          onClick={() => setTracks(tracks.map(t => ({ ...t, isTitle: t.id === track.id })))}
                          className="btn-ghost text-sm"
                        >
                          <Star className="w-4 h-4 mr-1" />
                          {t('타이틀로 설정', 'Set as Title')}
                        </button>
                      )}
                      {tracks.length > 1 && (
                        <button
                          onClick={() => setTracks(tracks.filter(t => t.id !== track.id))}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Track Title with Translations */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('트랙명', 'Track Title')} *
                    </label>
                    <input
                      type="text"
                      value={track.title}
                      onChange={(e) => {
                        const updated = [...tracks]
                        updated[index] = { ...track, title: e.target.value }
                        setTracks(updated)
                      }}
                      className="input-modern"
                      placeholder={t('트랙명을 입력하세요', 'Enter track title')}
                    />
                    
                    <button
                      onClick={() => addTranslation('trackTitle', track.id)}
                      className="mt-2 btn-ghost text-sm"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      {t('다른 언어로 표기 추가', 'Add translation')}
                    </button>

                    {track.translations.map((translation) => (
                      <div key={translation.id} className="flex gap-2 mt-2">
                        <select
                          value={translation.language}
                          onChange={(e) => updateTranslation('trackTitle', translation.id, 'language', e.target.value, track.id)}
                          className="input-modern w-48"
                        >
                          <option value="">{t('언어 선택', 'Select language')}</option>
                          {languageOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={translation.title}
                          onChange={(e) => updateTranslation('trackTitle', translation.id, 'text', e.target.value, track.id)}
                          className="input-modern flex-1"
                          placeholder={t('번역된 트랙명', 'Translated track title')}
                        />
                        <button
                          onClick={() => removeTranslation('trackTitle', translation.id, track.id)}
                          className="text-red-500 hover:text-red-600 p-2"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Track Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('ISRC 코드', 'ISRC Code')}
                      </label>
                      <input
                        type="text"
                        value={track.isrc || ''}
                        onChange={(e) => {
                          const updated = [...tracks]
                          updated[index] = { ...track, isrc: e.target.value }
                          setTracks(updated)
                        }}
                        className="input-modern"
                        placeholder="KR-XXX-XX-XXXXX"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('트랙 타입', 'Track Type')}
                      </label>
                      <select
                        value={track.trackType || 'audio'}
                        onChange={(e) => {
                          const updated = [...tracks]
                          updated[index] = { ...track, trackType: e.target.value as 'audio' | 'music_video' }
                          setTracks(updated)
                        }}
                        className="input-modern"
                      >
                        <option value="audio">{t('오디오', 'Audio')}</option>
                        <option value="music_video">{t('뮤직비디오', 'Music Video')}</option>
                      </select>
                    </div>
                  </div>

                  {/* Audio Format Options */}
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={track.dolbyAtmos || false}
                        onChange={(e) => {
                          const updated = [...tracks]
                          updated[index] = { ...track, dolbyAtmos: e.target.checked }
                          setTracks(updated)
                        }}
                        className="rounded text-n3rve-main focus:ring-n3rve-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Dolby Atmos</span>
                    </label>

                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={track.stereo !== false}
                        onChange={(e) => {
                          const updated = [...tracks]
                          updated[index] = { ...track, stereo: e.target.checked }
                          setTracks(updated)
                        }}
                        className="rounded text-n3rve-main focus:ring-n3rve-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Stereo</span>
                    </label>
                  </div>

                  {/* Artists */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('아티스트', 'Artists')}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {track.artists.map((artist) => (
                        <span key={artist.id} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-sm">
                          {artist.primaryName}
                          <button
                            onClick={() => {
                              const updated = [...tracks]
                              updated[index] = {
                                ...track,
                                artists: track.artists.filter(a => a.id !== artist.id)
                              }
                              setTracks(updated)
                            }}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                      <button
                        onClick={() => {
                          // Add artist logic here
                        }}
                        className="btn-ghost text-sm"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        {t('아티스트 추가', 'Add Artist')}
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <button
                onClick={() => {
                  const newTrack: Track = {
                    id: uuidv4(),
                    title: '',
                    translations: [],
                    artists: [],
                    featuringArtists: [],
                    contributors: [],
                    isTitle: false
                  }
                  setTracks([...tracks, newTrack])
                }}
                className="btn-primary w-full"
              >
                <Plus className="w-5 h-5 mr-2" />
                {t('트랙 추가', 'Add Track')}
              </button>
            </div>
          </div>
        )

      case 4: // Contributors & Credits
        return (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('기여자 및 크레딧', 'Contributors & Credits')}
            </h3>

            <div className="glassmorphism p-4">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-md font-medium text-gray-900 dark:text-white">
                  {t('전체 기여자', 'All Contributors')}
                </h4>
                <button
                  onClick={() => {
                    // Open contributor modal
                  }}
                  className="btn-primary"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  {t('기여자 추가', 'Add Contributor')}
                </button>
              </div>

              {globalContributors.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  {t('기여자가 없습니다', 'No contributors added')}
                </p>
              ) : (
                <div className="space-y-2">
                  {globalContributors.map((contributor) => (
                    <div key={contributor.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div>
                        <h5 className="font-medium text-gray-900 dark:text-white">
                          {contributor.name}
                        </h5>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {contributor.roles.map(role => {
                            const roleInfo = contributorRoles.find(r => r.value === role)
                            return (
                              <span key={role} className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 rounded-full">
                                {language === 'ko' ? roleInfo?.label : roleInfo?.labelEn}
                              </span>
                            )
                          })}
                          {contributor.instruments.map(instrument => (
                            <span key={instrument} className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-full">
                              {instrument}
                            </span>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setGlobalContributors(globalContributors.filter(c => c.id !== contributor.id))
                        }}
                        className="text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Required Contributors Notice */}
            <div className="mt-6 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-blue-800 dark:text-blue-200">
                  <p className="font-medium mb-1">
                    {t('필수 기여자', 'Required Contributors')}
                  </p>
                  <ul className="space-y-0.5">
                    <li>• {t('작곡가 (Composer) 1명 이상', 'At least 1 Composer')}</li>
                    <li>• {t('작사가 (Lyricist) 1명 이상', 'At least 1 Lyricist')}</li>
                    <li>• {t('연주자 (Performing Artist) 1명 이상', 'At least 1 Performing Artist')}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )

      case 5: // File Upload
        return (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('파일 업로드', 'File Upload')}
            </h3>

            {/* Cover Art */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('앨범 커버 이미지', 'Album Cover Image')} *
              </label>
              <div className="glassmorphism p-6 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      setFiles({ ...files, coverImage: e.target.files[0] })
                    }
                  }}
                  className="hidden"
                  id="coverImageUpload"
                />
                <label htmlFor="coverImageUpload" className="cursor-pointer">
                  <Image className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {t('클릭하여 이미지 업로드', 'Click to upload image')}
                  </p>
                  <p className="text-xs text-gray-500">
                    {t('최소 3000x3000px, JPG/PNG', 'Min 3000x3000px, JPG/PNG')}
                  </p>
                </label>
                {files.coverImage && (
                  <p className="mt-4 text-sm text-green-600 dark:text-green-400">
                    ✓ {files.coverImage.name}
                  </p>
                )}
              </div>
            </div>

            {/* Audio Files */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('오디오 파일', 'Audio Files')} *
              </label>
              <div className="space-y-2">
                {tracks.map((track) => (
                  <div key={track.id} className="glassmorphism p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-900 dark:text-white">
                          {track.title || t('제목 없음', 'Untitled')}
                        </h5>
                        {files.audioFiles.find(f => f.trackId === track.id) ? (
                          <p className="text-sm text-green-600 dark:text-green-400">
                            ✓ {files.audioFiles.find(f => f.trackId === track.id)?.file.name}
                          </p>
                        ) : (
                          <p className="text-sm text-gray-500">
                            {t('파일 없음', 'No file')}
                          </p>
                        )}
                      </div>
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            const newFiles = files.audioFiles.filter(f => f.trackId !== track.id)
                            newFiles.push({ trackId: track.id, file: e.target.files[0] })
                            setFiles({ ...files, audioFiles: newFiles })
                          }
                        }}
                        className="hidden"
                        id={`audio-${track.id}`}
                      />
                      <label htmlFor={`audio-${track.id}`} className="btn-secondary cursor-pointer">
                        <Upload className="w-4 h-4 mr-1" />
                        {t('업로드', 'Upload')}
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Files */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('추가 파일', 'Additional Files')}
              </label>
              <div className="glassmorphism p-6 text-center">
                <input
                  type="file"
                  multiple
                  onChange={(e) => {
                    if (e.target.files) {
                      setFiles({ ...files, additionalFiles: Array.from(e.target.files) })
                    }
                  }}
                  className="hidden"
                  id="additionalFiles"
                />
                <label htmlFor="additionalFiles" className="cursor-pointer">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('라이너노트, 가사 등', 'Liner notes, lyrics, etc.')}
                  </p>
                </label>
                {files.additionalFiles.length > 0 && (
                  <p className="mt-4 text-sm text-green-600 dark:text-green-400">
                    ✓ {files.additionalFiles.length} {t('개 파일', 'files')}
                  </p>
                )}
              </div>
            </div>
          </div>
        )

      case 6: // Region & Distribution
        return (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('지역 및 배급', 'Region & Distribution')}
            </h3>

            {/* Territory Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('배급 지역', 'Distribution Territory')}
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="worldwide"
                    checked={distribution.territoryType === 'worldwide'}
                    onChange={(e) => setDistribution({ ...distribution, territoryType: 'worldwide' })}
                    className="text-n3rve-main focus:ring-n3rve-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {t('전 세계', 'Worldwide')}
                  </span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="selected"
                    checked={distribution.territoryType === 'selected'}
                    onChange={(e) => setDistribution({ ...distribution, territoryType: 'selected' })}
                    className="text-n3rve-main focus:ring-n3rve-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {t('선택한 지역만', 'Selected territories only')}
                  </span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="excluded"
                    checked={distribution.territoryType === 'excluded'}
                    onChange={(e) => setDistribution({ ...distribution, territoryType: 'excluded' })}
                    className="text-n3rve-main focus:ring-n3rve-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {t('선택한 지역 제외', 'Exclude selected territories')}
                  </span>
                </label>
              </div>
            </div>

            {/* Territory Selection */}
            {distribution.territoryType !== 'worldwide' && (
              <div className="glassmorphism p-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                  {distribution.territoryType === 'selected' 
                    ? t('포함할 지역 선택', 'Select territories to include')
                    : t('제외할 지역 선택', 'Select territories to exclude')
                  }
                </h4>
                {/* Territory selection UI would go here */}
              </div>
            )}

            {/* DSP Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('배급 플랫폼', 'Distribution Platforms')}
              </label>
              <div className="glassmorphism p-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {['Spotify', 'Apple Music', 'YouTube Music', 'Amazon Music', 'Deezer', 'Tidal'].map(dsp => (
                    <label key={dsp} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={distribution.distributors.includes(dsp)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setDistribution({
                              ...distribution,
                              distributors: [...distribution.distributors, dsp]
                            })
                          } else {
                            setDistribution({
                              ...distribution,
                              distributors: distribution.distributors.filter(d => d !== dsp)
                            })
                          }
                        }}
                        className="rounded text-n3rve-main focus:ring-n3rve-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{dsp}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )

      case 7: // Korean DSP Settings
        return (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('한국 DSP 설정', 'Korean DSP Settings')}
            </h3>

            {/* New Artist */}
            <div className="glassmorphism p-4">
              <div className="flex items-center gap-2 mb-4">
                <input
                  type="checkbox"
                  id="newArtist"
                  checked={koreanDSP.newArtist}
                  onChange={(e) => setKoreanDSP({ ...koreanDSP, newArtist: e.target.checked })}
                  className="rounded text-n3rve-main focus:ring-n3rve-500"
                />
                <label htmlFor="newArtist" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('신인 아티스트', 'New Artist')}
                </label>
              </div>
            </div>

            {/* Lyrics Attached */}
            <div className="glassmorphism p-4">
              <div className="flex items-center gap-2 mb-4">
                <input
                  type="checkbox"
                  id="lyricsAttached"
                  checked={koreanDSP.lyricsAttached}
                  onChange={(e) => setKoreanDSP({ ...koreanDSP, lyricsAttached: e.target.checked })}
                  className="rounded text-n3rve-main focus:ring-n3rve-500"
                />
                <label htmlFor="lyricsAttached" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('가사 첨부', 'Lyrics Attached')}
                </label>
              </div>
            </div>

            {/* Korean DSP Links */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('한국 음원 사이트 링크', 'Korean Music Site Links')}
              </h4>
              
              {['Melon', 'Genie', 'Bugs', 'Vibe'].map(platform => (
                <div key={platform}>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                    {platform}
                  </label>
                  <input
                    type="url"
                    value={koreanDSP[`${platform.toLowerCase()}Link` as keyof KoreanDSPInfo] || ''}
                    onChange={(e) => setKoreanDSP({ ...koreanDSP, [`${platform.toLowerCase()}Link`]: e.target.value })}
                    className="input-modern"
                    placeholder={`https://${platform.toLowerCase()}.com/...`}
                  />
                </div>
              ))}
            </div>

            {/* Album Credits */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('앨범 크레딧', 'Album Credits')}
              </label>
              <textarea
                value={koreanDSP.albumCredits}
                onChange={(e) => setKoreanDSP({ ...koreanDSP, albumCredits: e.target.value })}
                className="input-modern"
                rows={4}
                placeholder={t('앨범 제작에 참여한 모든 인원의 크레딧', 'Credits for all personnel involved in album production')}
              />
              
              {/* Translation button */}
              <button
                onClick={() => {
                  const newTranslation: Translation = {
                    id: uuidv4(),
                    language: '',
                    text: ''
                  }
                  setKoreanDSP({
                    ...koreanDSP,
                    translations: [...koreanDSP.translations, newTranslation]
                  })
                }}
                className="mt-2 btn-ghost text-sm"
              >
                <Plus className="w-4 h-4 mr-1" />
                {t('다른 언어로 표기 추가', 'Add translation')}
              </button>

              {/* Translations */}
              {koreanDSP.translations.map((translation) => (
                <div key={translation.id} className="flex gap-2 mt-2">
                  <select
                    value={translation.language}
                    onChange={(e) => {
                      const updated = koreanDSP.translations.map(t =>
                        t.id === translation.id ? { ...t, language: e.target.value } : t
                      )
                      setKoreanDSP({ ...koreanDSP, translations: updated })
                    }}
                    className="input-modern w-48"
                  >
                    <option value="">{t('언어 선택', 'Select language')}</option>
                    {languageOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <textarea
                    value={translation.text}
                    onChange={(e) => {
                      const updated = koreanDSP.translations.map(t =>
                        t.id === translation.id ? { ...t, text: e.target.value } : t
                      )
                      setKoreanDSP({ ...koreanDSP, translations: updated })
                    }}
                    className="input-modern flex-1"
                    rows={2}
                    placeholder={t('번역된 크레딧', 'Translated credits')}
                  />
                  <button
                    onClick={() => {
                      setKoreanDSP({
                        ...koreanDSP,
                        translations: koreanDSP.translations.filter(t => t.id !== translation.id)
                      })
                    }}
                    className="text-red-500 hover:text-red-600 p-2"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )

      case 8: // Marketing Info (28 fields as requested by user)
        return (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('마케팅 정보', 'Marketing Information')}
            </h3>

            {/* Basic Marketing Info (2 fields) */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('앨범 소개', 'Album Introduction')}
                </label>
                <textarea
                  value={marketing.albumIntroduction}
                  onChange={(e) => setMarketing({ ...marketing, albumIntroduction: e.target.value })}
                  className="input-modern"
                  rows={3}
                  placeholder={t('앨범에 대한 간단한 소개', 'Brief introduction about the album')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('앨범 설명', 'Album Description')}
                </label>
                <textarea
                  value={marketing.albumDescription}
                  onChange={(e) => setMarketing({ ...marketing, albumDescription: e.target.value })}
                  className="input-modern"
                  rows={5}
                  placeholder={t('앨범에 대한 상세 설명', 'Detailed description about the album')}
                />
              </div>
            </div>

            {/* Artist Profile (8 fields) */}
            <div className="glassmorphism p-4">
              <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                {t('아티스트 프로필', 'Artist Profile')}
              </h4>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('Toundates URL', 'Toundates URL')}
                    </label>
                    <input
                      type="url"
                      value={marketing.toundatesUrl}
                      onChange={(e) => setMarketing({ ...marketing, toundatesUrl: e.target.value })}
                      className="input-modern"
                      placeholder="https://..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('아티스트 성별', 'Artist Gender')}
                    </label>
                    <select
                      value={marketing.artistGender}
                      onChange={(e) => setMarketing({ ...marketing, artistGender: e.target.value })}
                      className="input-modern"
                    >
                      <option value="">{t('선택', 'Select')}</option>
                      <option value="male">{t('남성', 'Male')}</option>
                      <option value="female">{t('여성', 'Female')}</option>
                      <option value="group">{t('그룹', 'Group')}</option>
                      <option value="other">{t('기타', 'Other')}</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('사회 운동 참여', 'Social Movements')}
                  </label>
                  <textarea
                    value={marketing.socialMovements}
                    onChange={(e) => setMarketing({ ...marketing, socialMovements: e.target.value })}
                    className="input-modern"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('아티스트 바이오', 'Artist Bio')}
                  </label>
                  <textarea
                    value={marketing.artistBio}
                    onChange={(e) => setMarketing({ ...marketing, artistBio: e.target.value })}
                    className="input-modern"
                    rows={4}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('유사 아티스트', 'Similar Artists')}
                  </label>
                  <input
                    type="text"
                    value={marketing.similarArtists}
                    onChange={(e) => setMarketing({ ...marketing, similarArtists: e.target.value })}
                    className="input-modern"
                    placeholder={t('쉼표로 구분', 'Separate with commas')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('싱크 사용 이력', 'Sync History')}
                  </label>
                  <select
                    value={marketing.hasSyncHistory}
                    onChange={(e) => setMarketing({ ...marketing, hasSyncHistory: e.target.value })}
                    className="input-modern"
                  >
                    <option value="no">{t('없음', 'No')}</option>
                    <option value="yes">{t('있음', 'Yes')}</option>
                  </select>
                  
                  {marketing.hasSyncHistory === 'yes' && (
                    <textarea
                      value={marketing.syncHistory}
                      onChange={(e) => setMarketing({ ...marketing, syncHistory: e.target.value })}
                      className="input-modern mt-2"
                      rows={2}
                      placeholder={t('싱크 사용 상세 내역', 'Sync usage details')}
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('UGC 우선순위', 'UGC Priorities')}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['TikTok', 'Instagram Reels', 'YouTube Shorts', 'Twitter'].map(platform => (
                      <label key={platform} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={marketing.artistUgcPriorities.includes(platform)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setMarketing({
                                ...marketing,
                                artistUgcPriorities: [...marketing.artistUgcPriorities, platform]
                              })
                            } else {
                              setMarketing({
                                ...marketing,
                                artistUgcPriorities: marketing.artistUgcPriorities.filter(p => p !== platform)
                              })
                            }
                          }}
                          className="rounded text-n3rve-main focus:ring-n3rve-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{platform}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* DSP Profile IDs (4 fields) */}
            <div className="glassmorphism p-4">
              <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                {t('DSP 프로필 ID', 'DSP Profile IDs')}
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Spotify Artist ID
                  </label>
                  <input
                    type="text"
                    value={marketing.spotifyArtistId}
                    onChange={(e) => setMarketing({ ...marketing, spotifyArtistId: e.target.value })}
                    className="input-modern"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Apple Music Artist ID
                  </label>
                  <input
                    type="text"
                    value={marketing.appleMusicArtistId}
                    onChange={(e) => setMarketing({ ...marketing, appleMusicArtistId: e.target.value })}
                    className="input-modern"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    SoundCloud Artist ID
                  </label>
                  <input
                    type="text"
                    value={marketing.soundcloudArtistId}
                    onChange={(e) => setMarketing({ ...marketing, soundcloudArtistId: e.target.value })}
                    className="input-modern"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    YouTube Channel ID
                  </label>
                  <input
                    type="text"
                    value={marketing.youtubeChannelId}
                    onChange={(e) => setMarketing({ ...marketing, youtubeChannelId: e.target.value })}
                    className="input-modern"
                  />
                </div>
              </div>
            </div>

            {/* Continue with remaining fields... */}
          </div>
        )

      case 9: // Social Media
        return (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('소셜 미디어', 'Social Media')}
            </h3>

            {/* Social Media URLs (11 fields) */}
            <div className="space-y-4">
              {[
                { key: 'youtubeUrl', label: 'YouTube', icon: '🎥' },
                { key: 'tiktokUrl', label: 'TikTok', icon: '🎵' },
                { key: 'facebookUrl', label: 'Facebook', icon: '👥' },
                { key: 'instagramUrl', label: 'Instagram', icon: '📷' },
                { key: 'xUrl', label: 'X (Twitter)', icon: '🐦' },
                { key: 'trillerUrl', label: 'Triller', icon: '🎬' },
                { key: 'snapchatUrl', label: 'Snapchat', icon: '👻' },
                { key: 'twitchUrl', label: 'Twitch', icon: '🎮' },
                { key: 'pinterestUrl', label: 'Pinterest', icon: '📌' },
                { key: 'tumblrUrl', label: 'Tumblr', icon: '📝' },
                { key: 'websiteUrl', label: t('웹사이트', 'Website'), icon: '🌐' }
              ].map(({ key, label, icon }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <span className="mr-2">{icon}</span>
                    {label}
                  </label>
                  <input
                    type="url"
                    value={marketing[key as keyof MarketingData] as string}
                    onChange={(e) => setMarketing({ ...marketing, [key]: e.target.value })}
                    className="input-modern"
                    placeholder="https://..."
                  />
                </div>
              ))}
            </div>
          </div>
        )

      case 10: // Promotion Plans
        return (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('프로모션 계획', 'Promotion Plans')}
            </h3>

            {/* Music Metadata (6 fields) */}
            <div className="glassmorphism p-4">
              <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                {t('음악 메타데이터', 'Music Metadata')}
              </h4>

              {/* Moods */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('분위기', 'Moods')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {['Happy', 'Sad', 'Energetic', 'Calm', 'Romantic', 'Dark', 'Uplifting', 'Melancholic'].map(mood => (
                    <label key={mood} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={marketing.moods.includes(mood)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setMarketing({
                              ...marketing,
                              moods: [...marketing.moods, mood]
                            })
                          } else {
                            setMarketing({
                              ...marketing,
                              moods: marketing.moods.filter(m => m !== mood)
                            })
                          }
                        }}
                        className="rounded text-n3rve-main focus:ring-n3rve-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{mood}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Instruments */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('주요 악기', 'Main Instruments')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {instrumentList.slice(0, 10).map(instrument => (
                    <label key={instrument} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={marketing.instruments.includes(instrument)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setMarketing({
                              ...marketing,
                              instruments: [...marketing.instruments, instrument]
                            })
                          } else {
                            setMarketing({
                              ...marketing,
                              instruments: marketing.instruments.filter(i => i !== instrument)
                            })
                          }
                        }}
                        className="rounded text-n3rve-main focus:ring-n3rve-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{instrument}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Elevator Pitch */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('훅 (Hook)', 'Hook')}
                  </label>
                  <input
                    type="text"
                    value={marketing.hook}
                    onChange={(e) => setMarketing({ ...marketing, hook: e.target.value })}
                    className="input-modern"
                    placeholder={t('한 문장으로 표현하는 앨범의 매력', 'Album appeal in one sentence')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('메인 피치', 'Main Pitch')}
                  </label>
                  <textarea
                    value={marketing.mainPitch}
                    onChange={(e) => setMarketing({ ...marketing, mainPitch: e.target.value })}
                    className="input-modern"
                    rows={3}
                    placeholder={t('앨범의 주요 셀링 포인트', 'Main selling points of the album')}
                  />
                </div>
              </div>

              {/* Marketing Drivers */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('마케팅 드라이버', 'Marketing Drivers')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {['Tour', 'Festival', 'TV Show', 'Movie', 'Brand Partnership', 'Social Media Campaign'].map(driver => (
                    <label key={driver} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={marketing.marketingDrivers.includes(driver)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setMarketing({
                              ...marketing,
                              marketingDrivers: [...marketing.marketingDrivers, driver]
                            })
                          } else {
                            setMarketing({
                              ...marketing,
                              marketingDrivers: marketing.marketingDrivers.filter(d => d !== driver)
                            })
                          }
                        }}
                        className="rounded text-n3rve-main focus:ring-n3rve-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{driver}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Social Media Plan */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('소셜 미디어 계획', 'Social Media Plan')}
                </label>
                <textarea
                  value={marketing.socialMediaPlan}
                  onChange={(e) => setMarketing({ ...marketing, socialMediaPlan: e.target.value })}
                  className="input-modern"
                  rows={4}
                  placeholder={t('소셜 미디어 활용 전략', 'Social media utilization strategy')}
                />
              </div>
            </div>

            {/* Visual Assets (4 fields) */}
            <div className="glassmorphism p-4">
              <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                {t('비주얼 에셋', 'Visual Assets')}
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('아티스트 국가', 'Artist Country')}
                  </label>
                  <input
                    type="text"
                    value={marketing.artistCountry}
                    onChange={(e) => setMarketing({ ...marketing, artistCountry: e.target.value })}
                    className="input-modern"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('현재 거주 도시', 'Current City')}
                  </label>
                  <input
                    type="text"
                    value={marketing.artistCurrentCity}
                    onChange={(e) => setMarketing({ ...marketing, artistCurrentCity: e.target.value })}
                    className="input-modern"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('고향', 'Hometown')}
                  </label>
                  <input
                    type="text"
                    value={marketing.artistHometown}
                    onChange={(e) => setMarketing({ ...marketing, artistHometown: e.target.value })}
                    className="input-modern"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('프레스 사진 크레딧', 'Press Photo Credits')}
                  </label>
                  <input
                    type="text"
                    value={marketing.pressShotCredits}
                    onChange={(e) => setMarketing({ ...marketing, pressShotCredits: e.target.value })}
                    className="input-modern"
                  />
                </div>
              </div>
            </div>
          </div>
        )

      case 11: // Review & Submit
        return (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('검토 및 제출', 'Review & Submit')}
            </h3>

            <div className="glassmorphism p-6">
              <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                {t('제출 전 최종 확인', 'Final Review Before Submission')}
              </h4>

              {/* Summary sections would go here */}
              
              <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      {t('제출 전 모든 정보를 다시 한 번 확인해주세요.', 'Please review all information before submission.')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="termsAccepted"
                  className="rounded text-n3rve-main focus:ring-n3rve-500"
                />
                <label htmlFor="termsAccepted" className="text-sm text-gray-700 dark:text-gray-300">
                  {t('모든 정보가 정확함을 확인하며, 이용약관에 동의합니다.', 'I confirm all information is accurate and agree to the terms of service.')}
                </label>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      // Prepare submission data
      const submissionData = {
        artistInfo,
        albumInfo,
        releaseSettings,
        tracks,
        globalContributors,
        files,
        distribution,
        koreanDSP,
        marketing,
        socialMedia,
        promotionPlans
      }

      // Submit data
      await submissionService.createSubmission(submissionData)
      
      toast.success(t('음원 발매 신청이 완료되었습니다!', 'Music release submission completed!'))
      navigate('/submissions')
    } catch (error) {
      console.error('Submission error:', error)
      toast.error(t('제출 중 오류가 발생했습니다', 'Error occurred during submission'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isActive = activeStep === index
              const isCompleted = activeStep > index
              
              return (
                <div key={step.id} className="flex-1 relative">
                  <div className="flex items-center">
                    <div
                      className={`
                        w-10 h-10 rounded-full flex items-center justify-center transition-colors
                        ${isActive ? 'bg-n3rve-main text-white' : ''}
                        ${isCompleted ? 'bg-green-500 text-white' : ''}
                        ${!isActive && !isCompleted ? 'bg-gray-200 dark:bg-gray-700 text-gray-500' : ''}
                      `}
                    >
                      {isCompleted ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                    </div>
                    
                    {index < steps.length - 1 && (
                      <div className="flex-1 h-0.5 mx-2">
                        <div
                          className={`h-full transition-colors ${
                            activeStep > index ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                          }`}
                        />
                      </div>
                    )}
                  </div>
                  
                  <p className="text-xs mt-2 text-center text-gray-600 dark:text-gray-400">
                    {step.label}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="glassmorphism p-6 mb-6">
          {renderStep()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
            disabled={activeStep === 0}
            className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5 mr-2" />
            {t('이전', 'Previous')}
          </button>

          {activeStep === steps.length - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                  {t('제출 중...', 'Submitting...')}
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  {t('제출', 'Submit')}
                </>
              )}
            </button>
          ) : (
            <button
              onClick={() => setActiveStep(Math.min(steps.length - 1, activeStep + 1))}
              className="btn-primary"
            >
              {t('다음', 'Next')}
              <ChevronRight className="w-5 h-5 ml-2" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}