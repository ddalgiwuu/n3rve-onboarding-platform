import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguageStore } from '@/store/language.store'
import { Upload, Music, FileText, Image, CheckCircle, AlertCircle, X, Plus, Trash2, Globe, Target, Sparkles, Users, MapPin, Calendar, Shield, Languages, Disc, Building2, Radio, ListMusic } from 'lucide-react'
import toast from 'react-hot-toast'
import { submissionService } from '@/services/submission.service'
import { dropboxService } from '@/services/dropbox.service'
import { useAuthStore } from '@/store/auth.store'

interface Contributor {
  name: string
  role: string
  spotifyUrl?: string
  appleMusicUrl?: string
}

interface Track {
  id: string
  titleKo: string
  titleEn: string
  artists: string[]
  featuringArtists: string[]
  contributors: Contributor[]
  composer: string
  lyricist: string
  arranger: string
  producer?: string
  mixer?: string
  masterer?: string
  isTitle: boolean
  isrc: string
  explicitContent: boolean
  dolbyAtmos: boolean
  stereo: boolean
  genre: string
  subgenre: string
  alternateGenre?: string
  alternateSubgenre?: string
  trackVersion?: string
  lyricsLanguage?: string
  audioLanguage?: string
  metadataLanguage?: string
  hasCustomReleaseDate?: boolean
  consumerReleaseDate?: string
  releaseTime?: string
  previewStart?: number
  previewEnd?: number
  audioFile?: File
  lyrics?: string
}

interface MarketingData {
  // 31 마케팅 필드
  albumIntroduction: string
  albumDescription: string
  marketingKeywords: string
  targetAudience: string
  promotionPlans: string
  toundatesUrl: string
  artistGender: string
  socialMovements: string
  artistBio: string
  similarArtists: string
  hasSyncHistory: boolean
  syncHistory: string
  spotifyArtistId: string
  appleMusicArtistId: string
  soundcloudArtistId: string
  artistUgcPriorities: string
  youtubeUrl: string
  tiktokUrl: string
  facebookUrl: string
  instagramUrl: string
  xUrl: string
  twitchUrl: string
  threadsUrl: string
  moods: string[]
  instruments: string[]
  hook: string
  mainPitch: string
  marketingDrivers: string
  socialMediaPlan: string
  artistCountry: string
  artistCurrentCity: string
  artistHometown: string
  pressShotCredits?: string
}

interface Translation {
  language: string
  title: string
}

interface Member {
  name: string
  role: string
  spotifyUrl?: string
  appleMusicUrl?: string
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
}

export default function ReleaseSubmission() {
  const navigate = useNavigate()
  const { t } = useLanguageStore()
  const { user } = useAuthStore()
  const [activeStep, setActiveStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  // 기본 정보
  const [basicInfo, setBasicInfo] = useState({
    // Artist Info
    artistName: '',
    artistNameEn: '',
    artistType: 'SOLO',
    artistMembers: [] as Member[],
    artistTranslations: [] as Translation[],
    
    // Album Info
    labelName: '',
    albumTitle: '',
    albumTitleEn: '',
    albumType: 'SINGLE',
    albumVersion: '',
    releaseVersion: '',
    releaseFormat: 'STANDARD',
    primaryTitle: '',
    hasTranslation: false,
    translationLanguage: '',
    translatedTitle: '',
    albumTranslations: [] as Translation[],
    
    // Release Dates
    releaseDate: '',
    consumerReleaseDate: '',
    releaseTime: '00:00',
    selectedTimezone: 'KST',
    preOrderEnabled: false,
    preOrderDate: '',
    previouslyReleased: false,
    previousReleaseDate: '',
    previousReleaseInfo: '',
    
    // Genre & Classification
    genre: [] as string[],
    subgenre: [] as string[],
    parentalAdvisory: 'NONE',
    isCompilation: false,
    
    // Rights & Recording
    recordingCountry: 'KR',
    recordingLanguage: 'ko',
    copyrightHolder: '',
    copyrightYear: new Date().getFullYear().toString(),
    cRights: '',
    pRights: '',
    upc: '',
    catalogNumber: '',
    
    // Distribution
    territoryType: 'WORLDWIDE',
    territories: [] as string[],
    excludedTerritories: [] as string[],
    dspTerritories: {} as Record<string, string[]>,
    distributors: [] as string[],
    priceType: 'FREE',
    price: 0,
    
    // Korean DSP
    koreanDSPInfo: {
      lyricsAttached: false,
      artistPageLink: '',
      melonLink: '',
      genieLink: '',
      bugsLink: '',
      vibeLink: '',
      newArtist: false,
      albumCredits: '',
    } as KoreanDSPInfo,
  })

  // 트랙 정보
  const [tracks, setTracks] = useState<Track[]>([
    {
      id: '1',
      titleKo: '',
      titleEn: '',
      artists: [''],
      featuringArtists: [],
      contributors: [],
      composer: '',
      lyricist: '',
      arranger: '',
      producer: '',
      mixer: '',
      masterer: '',
      isTitle: true,
      isrc: '',
      explicitContent: false,
      dolbyAtmos: false,
      stereo: true,
      genre: '',
      subgenre: '',
      alternateGenre: '',
      alternateSubgenre: '',
      trackVersion: '',
      lyricsLanguage: 'ko',
      audioLanguage: 'ko',
      metadataLanguage: 'ko',
      hasCustomReleaseDate: false,
      consumerReleaseDate: '',
      releaseTime: '00:00',
      previewStart: 0,
      previewEnd: 30,
      lyrics: '',
    }
  ])

  // 파일 업로드
  const [files, setFiles] = useState({
    coverArt: null as File | null,
    artistPhoto: null as File | null,
    pressShotImage: null as File | null,
    artistAvatar: null as File | null,
    artistLogo: null as File | null,
  })
  const [filePreviews, setFilePreviews] = useState({
    coverArt: '',
    artistPhoto: '',
    pressShotImage: '',
    artistAvatar: '',
    artistLogo: '',
  })

  // 마케팅 정보
  const [marketingData, setMarketingData] = useState<MarketingData>({
    albumIntroduction: '',
    albumDescription: '',
    marketingKeywords: '',
    targetAudience: '',
    promotionPlans: '',
    toundatesUrl: '',
    artistGender: '',
    socialMovements: '',
    artistBio: '',
    similarArtists: '',
    hasSyncHistory: false,
    syncHistory: '',
    spotifyArtistId: '',
    appleMusicArtistId: '',
    soundcloudArtistId: '',
    artistUgcPriorities: '',
    youtubeUrl: '',
    tiktokUrl: '',
    facebookUrl: '',
    instagramUrl: '',
    xUrl: '',
    twitchUrl: '',
    threadsUrl: '',
    moods: [],
    instruments: [],
    hook: '',
    mainPitch: '',
    marketingDrivers: '',
    socialMediaPlan: '',
    artistCountry: '',
    artistCurrentCity: '',
    artistHometown: '',
  })

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
    { id: 11, label: t('검토 및 제출', 'Review & Submit'), icon: CheckCircle },
  ]

  const addTrack = () => {
    setTracks([...tracks, {
      id: Date.now().toString(),
      titleKo: '',
      titleEn: '',
      artists: [''],
      featuringArtists: [],
      contributors: [],
      composer: '',
      lyricist: '',
      arranger: '',
      producer: '',
      mixer: '',
      masterer: '',
      isTitle: false,
      isrc: '',
      explicitContent: false,
      dolbyAtmos: false,
      stereo: true,
      genre: '',
      subgenre: '',
      alternateGenre: '',
      alternateSubgenre: '',
      trackVersion: '',
      lyricsLanguage: 'ko',
      audioLanguage: 'ko',
      metadataLanguage: 'ko',
      hasCustomReleaseDate: false,
      consumerReleaseDate: '',
      releaseTime: '00:00',
      previewStart: 0,
      previewEnd: 30,
      lyrics: '',
    }])
  }

  const removeTrack = (id: string) => {
    if (tracks.length > 1) {
      setTracks(tracks.filter(track => track.id !== id))
    }
  }

  const updateTrack = (id: string, field: keyof Track, value: any) => {
    setTracks(tracks.map(track =>
      track.id === id ? { ...track, [field]: value } : track
    ))
  }

  const handleFileUpload = (fileType: keyof typeof files) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFiles({ ...files, [fileType]: file })
      
      // 이미지 미리보기
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          setFilePreviews({
            ...filePreviews,
            [fileType]: e.target?.result as string
          })
        }
        reader.readAsDataURL(file)
      }
    }
  }

  const handleTrackFileUpload = (trackId: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      updateTrack(trackId, 'audioFile', file)
    }
  }

  const uploadFilesToDropbox = async (submissionId: string) => {
    const filesToUpload: { file: File; fileType: string }[] = []
    
    // 이미지 파일들
    if (files.coverArt) filesToUpload.push({ file: files.coverArt, fileType: 'cover' })
    if (files.artistPhoto) filesToUpload.push({ file: files.artistPhoto, fileType: 'artist' })
    if (files.pressShotImage) filesToUpload.push({ file: files.pressShotImage, fileType: 'press' })
    if (files.artistAvatar) filesToUpload.push({ file: files.artistAvatar, fileType: 'avatar' })
    if (files.artistLogo) filesToUpload.push({ file: files.artistLogo, fileType: 'logo' })
    
    // 오디오 파일들
    tracks.forEach((track, index) => {
      if (track.audioFile) {
        filesToUpload.push({ 
          file: track.audioFile, 
          fileType: `audio_track_${index + 1}` 
        })
      }
    })

    const uploadResults = await dropboxService.uploadMultipleFiles(
      filesToUpload,
      submissionId,
      basicInfo.artistName,
      basicInfo.albumTitle,
      (progress) => setUploadProgress(progress)
    )

    return uploadResults
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    
    try {
      // 제출 ID 생성
      const submissionId = `SUB_${Date.now()}`
      
      // Dropbox에 파일 업로드
      const uploadedFiles = await uploadFilesToDropbox(submissionId)
      
      // 제출 데이터 준비
      const submissionData = {
        submissionId,
        submitterEmail: user?.email || '',
        submitterName: user?.name || '',
        company: user?.company || '',
        phone: user?.phone || '',
        
        // 기본 정보
        ...basicInfo,
        
        // 트랙 정보
        tracks: tracks.map((track, index) => ({
          ...track,
          audioFileUrl: uploadedFiles[`audio_track_${index + 1}`]?.url || null,
        })),
        
        // 파일 URL들
        files: {
          coverImageUrl: uploadedFiles.cover?.url || null,
          artistPhotoUrl: uploadedFiles.artist?.url || null,
          pressShotUrl: uploadedFiles.press?.url || null,
          artistAvatarUrl: uploadedFiles.avatar?.url || null,
          artistLogoUrl: uploadedFiles.logo?.url || null,
        },
        
        // 마케팅 정보 (31개 필드)
        releaseInfo: {
          ...marketingData,
          pressShotUrl: uploadedFiles.press?.url || null,
          pressShotCredits: marketingData.artistBio,
          artistAvatar: uploadedFiles.avatar?.url || null,
          artistLogo: uploadedFiles.logo?.url || null,
        }
      }
      
      // 백엔드로 제출
      await submissionService.createSubmission(submissionData)
      
      toast.success(t('제출이 완료되었습니다!', 'Submission completed!'))
      navigate('/submission-success')
    } catch (error) {
      console.error('Submission error:', error)
      toast.error(t('제출 중 오류가 발생했습니다.', 'Error during submission.'))
    } finally {
      setIsSubmitting(false)
      setUploadProgress(0)
    }
  }

  // 번역 추가 함수
  const addTranslation = (type: 'artist' | 'album') => {
    if (type === 'artist') {
      setBasicInfo({
        ...basicInfo,
        artistTranslations: [...basicInfo.artistTranslations, { language: '', title: '' }]
      })
    } else {
      setBasicInfo({
        ...basicInfo,
        albumTranslations: [...basicInfo.albumTranslations, { language: '', title: '' }]
      })
    }
  }

  const removeTranslation = (type: 'artist' | 'album', index: number) => {
    if (type === 'artist') {
      setBasicInfo({
        ...basicInfo,
        artistTranslations: basicInfo.artistTranslations.filter((_, i) => i !== index)
      })
    } else {
      setBasicInfo({
        ...basicInfo,
        albumTranslations: basicInfo.albumTranslations.filter((_, i) => i !== index)
      })
    }
  }

  const updateTranslation = (type: 'artist' | 'album', index: number, field: keyof Translation, value: string) => {
    if (type === 'artist') {
      setBasicInfo({
        ...basicInfo,
        artistTranslations: basicInfo.artistTranslations.map((trans, i) =>
          i === index ? { ...trans, [field]: value } : trans
        )
      })
    } else {
      setBasicInfo({
        ...basicInfo,
        albumTranslations: basicInfo.albumTranslations.map((trans, i) =>
          i === index ? { ...trans, [field]: value } : trans
        )
      })
    }
  }

  // 멤버 관리 함수
  const addMember = () => {
    setBasicInfo({
      ...basicInfo,
      artistMembers: [...basicInfo.artistMembers, { name: '', role: '', spotifyUrl: '', appleMusicUrl: '' }]
    })
  }

  const removeMember = (index: number) => {
    setBasicInfo({
      ...basicInfo,
      artistMembers: basicInfo.artistMembers.filter((_, i) => i !== index)
    })
  }

  const updateMember = (index: number, field: keyof Member, value: string) => {
    setBasicInfo({
      ...basicInfo,
      artistMembers: basicInfo.artistMembers.map((member, i) =>
        i === index ? { ...member, [field]: value } : member
      )
    })
  }

  // 트랙 기여자 관리 함수
  const addContributor = (trackId: string) => {
    setTracks(tracks.map(track =>
      track.id === trackId
        ? { ...track, contributors: [...track.contributors, { name: '', role: '', spotifyUrl: '', appleMusicUrl: '' }] }
        : track
    ))
  }

  const removeContributor = (trackId: string, index: number) => {
    setTracks(tracks.map(track =>
      track.id === trackId
        ? { ...track, contributors: track.contributors.filter((_, i) => i !== index) }
        : track
    ))
  }

  const updateContributor = (trackId: string, index: number, field: keyof Contributor, value: string) => {
    setTracks(tracks.map(track =>
      track.id === trackId
        ? {
            ...track,
            contributors: track.contributors.map((contributor, i) =>
              i === index ? { ...contributor, [field]: value } : contributor
            )
          }
        : track
    ))
  }

  const renderStep = () => {
    switch (activeStep) {
      case 0: // 아티스트 정보
        return (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('아티스트 정보', 'Artist Information')}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('아티스트명 (한글)', 'Artist Name (Korean)')} *
                </label>
                <input
                  type="text"
                  value={basicInfo.artistName}
                  onChange={(e) => setBasicInfo({ ...basicInfo, artistName: e.target.value })}
                  className="input-modern"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('아티스트명 (영문)', 'Artist Name (English)')}
                </label>
                <input
                  type="text"
                  value={basicInfo.artistNameEn}
                  onChange={(e) => setBasicInfo({ ...basicInfo, artistNameEn: e.target.value })}
                  className="input-modern"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('아티스트 유형', 'Artist Type')} *
                </label>
                <select
                  value={basicInfo.artistType}
                  onChange={(e) => setBasicInfo({ ...basicInfo, artistType: e.target.value })}
                  className="input-modern"
                >
                  <option value="SOLO">{t('솔로', 'Solo')}</option>
                  <option value="GROUP">{t('그룹', 'Group')}</option>
                  <option value="BAND">{t('밴드', 'Band')}</option>
                  <option value="DUO">{t('듀오', 'Duo')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('레이블명', 'Label Name')}
                </label>
                <input
                  type="text"
                  value={basicInfo.labelName}
                  onChange={(e) => setBasicInfo({ ...basicInfo, labelName: e.target.value })}
                  className="input-modern"
                />
              </div>
            </div>

            {/* 아티스트 번역 */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('아티스트명 번역', 'Artist Name Translations')}
                </label>
                <button
                  onClick={() => addTranslation('artist')}
                  className="btn-ghost text-sm"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  {t('번역 추가', 'Add Translation')}
                </button>
              </div>
              {basicInfo.artistTranslations.map((translation, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={translation.language}
                    onChange={(e) => updateTranslation('artist', index, 'language', e.target.value)}
                    className="input-modern w-32"
                    placeholder={t('언어 코드', 'Language code')}
                  />
                  <input
                    type="text"
                    value={translation.title}
                    onChange={(e) => updateTranslation('artist', index, 'title', e.target.value)}
                    className="input-modern flex-1"
                    placeholder={t('번역된 이름', 'Translated name')}
                  />
                  <button
                    onClick={() => removeTranslation('artist', index)}
                    className="text-red-500 hover:text-red-600 p-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* 그룹/밴드인 경우 멤버 정보 */}
            {['GROUP', 'BAND', 'DUO'].includes(basicInfo.artistType) && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('멤버 정보', 'Member Information')}
                  </label>
                  <button
                    onClick={addMember}
                    className="btn-ghost text-sm"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    {t('멤버 추가', 'Add Member')}
                  </button>
                </div>
                {basicInfo.artistMembers.map((member, index) => (
                  <div key={index} className="glassmorphism p-4 mb-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={member.name}
                        onChange={(e) => updateMember(index, 'name', e.target.value)}
                        className="input-modern"
                        placeholder={t('멤버 이름', 'Member name')}
                      />
                      <input
                        type="text"
                        value={member.role}
                        onChange={(e) => updateMember(index, 'role', e.target.value)}
                        className="input-modern"
                        placeholder={t('역할 (예: 보컬, 기타)', 'Role (e.g., Vocal, Guitar)')}
                      />
                      <input
                        type="url"
                        value={member.spotifyUrl || ''}
                        onChange={(e) => updateMember(index, 'spotifyUrl', e.target.value)}
                        className="input-modern"
                        placeholder="Spotify URL"
                      />
                      <input
                        type="url"
                        value={member.appleMusicUrl || ''}
                        onChange={(e) => updateMember(index, 'appleMusicUrl', e.target.value)}
                        className="input-modern"
                        placeholder="Apple Music URL"
                      />
                    </div>
                    <button
                      onClick={() => removeMember(index)}
                      className="text-red-500 hover:text-red-600 mt-2"
                    >
                      <Trash2 className="w-4 h-4 inline mr-1" />
                      {t('멤버 삭제', 'Remove Member')}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )

      case 1: // 앨범 기본 정보
        return (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('앨범 기본 정보', 'Album Basic Information')}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('앨범명 (한글)', 'Album Title (Korean)')} *
                </label>
                <input
                  type="text"
                  value={basicInfo.albumTitle}
                  onChange={(e) => setBasicInfo({ ...basicInfo, albumTitle: e.target.value })}
                  className="input-modern"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('앨범명 (영문)', 'Album Title (English)')}
                </label>
                <input
                  type="text"
                  value={basicInfo.albumTitleEn}
                  onChange={(e) => setBasicInfo({ ...basicInfo, albumTitleEn: e.target.value })}
                  className="input-modern"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('앨범 타입', 'Album Type')} *
                </label>
                <select
                  value={basicInfo.albumType}
                  onChange={(e) => setBasicInfo({ ...basicInfo, albumType: e.target.value })}
                  className="input-modern"
                >
                  <option value="SINGLE">Single</option>
                  <option value="EP">EP</option>
                  <option value="ALBUM">Album</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('앨범 버전', 'Album Version')}
                </label>
                <input
                  type="text"
                  value={basicInfo.albumVersion}
                  onChange={(e) => setBasicInfo({ ...basicInfo, albumVersion: e.target.value })}
                  className="input-modern"
                  placeholder={t('예: Deluxe, Remastered', 'e.g., Deluxe, Remastered')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('발매 포맷', 'Release Format')}
                </label>
                <select
                  value={basicInfo.releaseFormat}
                  onChange={(e) => setBasicInfo({ ...basicInfo, releaseFormat: e.target.value })}
                  className="input-modern"
                >
                  <option value="STANDARD">{t('표준', 'Standard')}</option>
                  <option value="DELUXE">{t('디럭스', 'Deluxe')}</option>
                  <option value="REMASTERED">{t('리마스터', 'Remastered')}</option>
                  <option value="SPECIAL">{t('스페셜', 'Special')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('장르', 'Genre')}
                </label>
                <input
                  type="text"
                  value={basicInfo.genre.join(', ')}
                  onChange={(e) => setBasicInfo({ 
                    ...basicInfo, 
                    genre: e.target.value.split(',').map(g => g.trim()).filter(g => g) 
                  })}
                  className="input-modern"
                  placeholder={t('쉼표로 구분 (예: Pop, K-Pop)', 'Comma separated (e.g., Pop, K-Pop)')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('서브 장르', 'Sub Genre')}
                </label>
                <input
                  type="text"
                  value={basicInfo.subgenre.join(', ')}
                  onChange={(e) => setBasicInfo({ 
                    ...basicInfo, 
                    subgenre: e.target.value.split(',').map(g => g.trim()).filter(g => g) 
                  })}
                  className="input-modern"
                  placeholder={t('쉼표로 구분', 'Comma separated')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('녹음 언어', 'Recording Language')}
                </label>
                <input
                  type="text"
                  value={basicInfo.recordingLanguage}
                  onChange={(e) => setBasicInfo({ ...basicInfo, recordingLanguage: e.target.value })}
                  className="input-modern"
                  placeholder="ko"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('보호자 경고', 'Parental Advisory')}
                </label>
                <select
                  value={basicInfo.parentalAdvisory}
                  onChange={(e) => setBasicInfo({ ...basicInfo, parentalAdvisory: e.target.value })}
                  className="input-modern"
                >
                  <option value="NONE">{t('없음', 'None')}</option>
                  <option value="EXPLICIT">{t('명시적 콘텐츠', 'Explicit Content')}</option>
                  <option value="CLEAN">{t('클린 버전', 'Clean Version')}</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={basicInfo.isCompilation}
                    onChange={(e) => setBasicInfo({ ...basicInfo, isCompilation: e.target.checked })}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    {t('컴필레이션 앨범입니다', 'This is a compilation album')}
                  </span>
                </label>
              </div>
            </div>

            {/* 앨범 번역 */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('앨범명 번역', 'Album Title Translations')}
                </label>
                <button
                  onClick={() => addTranslation('album')}
                  className="btn-ghost text-sm"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  {t('번역 추가', 'Add Translation')}
                </button>
              </div>
              {basicInfo.albumTranslations.map((translation, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={translation.language}
                    onChange={(e) => updateTranslation('album', index, 'language', e.target.value)}
                    className="input-modern w-32"
                    placeholder={t('언어 코드', 'Language code')}
                  />
                  <input
                    type="text"
                    value={translation.title}
                    onChange={(e) => updateTranslation('album', index, 'title', e.target.value)}
                    className="input-modern flex-1"
                    placeholder={t('번역된 제목', 'Translated title')}
                  />
                  <button
                    onClick={() => removeTranslation('album', index)}
                    className="text-red-500 hover:text-red-600 p-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )

      case 2: // 발매 설정
        return (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('발매 설정', 'Release Settings')}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('발매일', 'Release Date')} *
                </label>
                <input
                  type="date"
                  value={basicInfo.releaseDate}
                  onChange={(e) => setBasicInfo({ ...basicInfo, releaseDate: e.target.value })}
                  className="input-modern"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('발매 시간', 'Release Time')}
                </label>
                <div className="flex gap-2">
                  <input
                    type="time"
                    value={basicInfo.releaseTime}
                    onChange={(e) => setBasicInfo({ ...basicInfo, releaseTime: e.target.value })}
                    className="input-modern flex-1"
                  />
                  <select
                    value={basicInfo.selectedTimezone}
                    onChange={(e) => setBasicInfo({ ...basicInfo, selectedTimezone: e.target.value })}
                    className="input-modern w-32"
                  >
                    <option value="KST">KST</option>
                    <option value="UTC">UTC</option>
                    <option value="EST">EST</option>
                    <option value="PST">PST</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('소비자 발매일', 'Consumer Release Date')}
                </label>
                <input
                  type="date"
                  value={basicInfo.consumerReleaseDate}
                  onChange={(e) => setBasicInfo({ ...basicInfo, consumerReleaseDate: e.target.value })}
                  className="input-modern"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('녹음 국가', 'Recording Country')} *
                </label>
                <input
                  type="text"
                  value={basicInfo.recordingCountry}
                  onChange={(e) => setBasicInfo({ ...basicInfo, recordingCountry: e.target.value })}
                  className="input-modern"
                  placeholder="KR"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('저작권자', 'Copyright Holder')} *
                </label>
                <input
                  type="text"
                  value={basicInfo.copyrightHolder}
                  onChange={(e) => setBasicInfo({ ...basicInfo, copyrightHolder: e.target.value })}
                  className="input-modern"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('저작권 연도', 'Copyright Year')}
                </label>
                <input
                  type="text"
                  value={basicInfo.copyrightYear}
                  onChange={(e) => setBasicInfo({ ...basicInfo, copyrightYear: e.target.value })}
                  className="input-modern"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('C Rights', 'C Rights')} *
                </label>
                <input
                  type="text"
                  value={basicInfo.cRights}
                  onChange={(e) => setBasicInfo({ ...basicInfo, cRights: e.target.value })}
                  className="input-modern"
                  placeholder="© 2024 Artist Name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('P Rights', 'P Rights')} *
                </label>
                <input
                  type="text"
                  value={basicInfo.pRights}
                  onChange={(e) => setBasicInfo({ ...basicInfo, pRights: e.target.value })}
                  className="input-modern"
                  placeholder="℗ 2024 Label Name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  UPC
                </label>
                <input
                  type="text"
                  value={basicInfo.upc}
                  onChange={(e) => setBasicInfo({ ...basicInfo, upc: e.target.value })}
                  className="input-modern"
                  placeholder={t('12자리 숫자', '12-digit number')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('카탈로그 번호', 'Catalog Number')}
                </label>
                <input
                  type="text"
                  value={basicInfo.catalogNumber}
                  onChange={(e) => setBasicInfo({ ...basicInfo, catalogNumber: e.target.value })}
                  className="input-modern"
                />
              </div>
            </div>

            {/* 예약 주문 설정 */}
            <div className="space-y-4">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={basicInfo.preOrderEnabled}
                  onChange={(e) => setBasicInfo({ ...basicInfo, preOrderEnabled: e.target.checked })}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  {t('예약 주문 활성화', 'Enable pre-order')}
                </span>
              </label>

              {basicInfo.preOrderEnabled && (
                <div className="ml-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('예약 주문 시작일', 'Pre-order Start Date')}
                  </label>
                  <input
                    type="date"
                    value={basicInfo.preOrderDate}
                    onChange={(e) => setBasicInfo({ ...basicInfo, preOrderDate: e.target.value })}
                    className="input-modern"
                  />
                </div>
              )}
            </div>

            {/* 이전 발매 정보 */}
            <div className="space-y-4">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={basicInfo.previouslyReleased}
                  onChange={(e) => setBasicInfo({ ...basicInfo, previouslyReleased: e.target.checked })}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  {t('이전에 발매된 적이 있습니다', 'Previously released')}
                </span>
              </label>

              {basicInfo.previouslyReleased && (
                <div className="ml-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('이전 발매일', 'Previous Release Date')}
                    </label>
                    <input
                      type="date"
                      value={basicInfo.previousReleaseDate}
                      onChange={(e) => setBasicInfo({ ...basicInfo, previousReleaseDate: e.target.value })}
                      className="input-modern"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('이전 발매 정보', 'Previous Release Information')}
                    </label>
                    <textarea
                      value={basicInfo.previousReleaseInfo}
                      onChange={(e) => setBasicInfo({ ...basicInfo, previousReleaseInfo: e.target.value })}
                      className="input-modern"
                      rows={2}
                      placeholder={t('이전 발매 레이블, 배급사 등', 'Previous label, distributor, etc.')}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )

      case 3: // 트랙 정보
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('트랙 정보', 'Track Information')}
              </h3>
              <button
                onClick={addTrack}
                className="btn-ghost text-sm"
              >
                <Plus className="w-4 h-4 mr-1" />
                {t('트랙 추가', 'Add Track')}
              </button>
            </div>

            {tracks.map((track, index) => (
              <div key={track.id} className="glassmorphism p-6 space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {t('트랙', 'Track')} {index + 1}
                  </h4>
                  {tracks.length > 1 && (
                    <button
                      onClick={() => removeTrack(track.id)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('트랙명 (한글)', 'Track Title (Korean)')} *
                    </label>
                    <input
                      type="text"
                      value={track.titleKo}
                      onChange={(e) => updateTrack(track.id, 'titleKo', e.target.value)}
                      className="input-modern"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('트랙명 (영문)', 'Track Title (English)')} *
                    </label>
                    <input
                      type="text"
                      value={track.titleEn}
                      onChange={(e) => updateTrack(track.id, 'titleEn', e.target.value)}
                      className="input-modern"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('트랙 버전', 'Track Version')}
                    </label>
                    <input
                      type="text"
                      value={track.trackVersion}
                      onChange={(e) => updateTrack(track.id, 'trackVersion', e.target.value)}
                      className="input-modern"
                      placeholder={t('예: Acoustic, Remix', 'e.g., Acoustic, Remix')}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      ISRC
                    </label>
                    <input
                      type="text"
                      value={track.isrc}
                      onChange={(e) => updateTrack(track.id, 'isrc', e.target.value)}
                      className="input-modern"
                      placeholder="KR-XXX-XX-XXXXX"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('장르', 'Genre')} *
                    </label>
                    <input
                      type="text"
                      value={track.genre}
                      onChange={(e) => updateTrack(track.id, 'genre', e.target.value)}
                      className="input-modern"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('서브 장르', 'Sub Genre')}
                    </label>
                    <input
                      type="text"
                      value={track.subgenre}
                      onChange={(e) => updateTrack(track.id, 'subgenre', e.target.value)}
                      className="input-modern"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('가사 언어', 'Lyrics Language')}
                    </label>
                    <input
                      type="text"
                      value={track.lyricsLanguage}
                      onChange={(e) => updateTrack(track.id, 'lyricsLanguage', e.target.value)}
                      className="input-modern"
                      placeholder="ko"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('오디오 언어', 'Audio Language')}
                    </label>
                    <input
                      type="text"
                      value={track.audioLanguage}
                      onChange={(e) => updateTrack(track.id, 'audioLanguage', e.target.value)}
                      className="input-modern"
                      placeholder="ko"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('미리듣기 구간 (초)', 'Preview Range (seconds)')}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={track.previewStart}
                        onChange={(e) => updateTrack(track.id, 'previewStart', parseInt(e.target.value) || 0)}
                        className="input-modern"
                        placeholder={t('시작', 'Start')}
                        min="0"
                      />
                      <span className="self-center">~</span>
                      <input
                        type="number"
                        value={track.previewEnd}
                        onChange={(e) => updateTrack(track.id, 'previewEnd', parseInt(e.target.value) || 30)}
                        className="input-modern"
                        placeholder={t('종료', 'End')}
                        min="0"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 mt-4">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={track.isTitle}
                      onChange={(e) => updateTrack(track.id, 'isTitle', e.target.checked)}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      {t('타이틀 트랙', 'Title Track')}
                    </span>
                  </label>

                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={track.explicitContent}
                      onChange={(e) => updateTrack(track.id, 'explicitContent', e.target.checked)}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      {t('19금 콘텐츠', 'Explicit Content')}
                    </span>
                  </label>

                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={track.dolbyAtmos}
                      onChange={(e) => updateTrack(track.id, 'dolbyAtmos', e.target.checked)}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Dolby Atmos
                    </span>
                  </label>

                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={track.stereo}
                      onChange={(e) => updateTrack(track.id, 'stereo', e.target.checked)}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Stereo
                    </span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('오디오 파일', 'Audio File')} *
                  </label>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleTrackFileUpload(track.id)}
                    className="input-modern"
                    required
                  />
                  {track.audioFile && (
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      {track.audioFile.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('가사', 'Lyrics')}
                  </label>
                  <textarea
                    value={track.lyrics}
                    onChange={(e) => updateTrack(track.id, 'lyrics', e.target.value)}
                    className="input-modern"
                    rows={4}
                    placeholder={t('가사를 입력하세요', 'Enter lyrics')}
                  />
                </div>
              </div>
            ))}
          </div>
        )

      case 4: // 기여자 및 크레딧
        return (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('기여자 및 크레딧', 'Contributors & Credits')}
            </h3>

            {tracks.map((track, index) => (
              <div key={track.id} className="glassmorphism p-6 space-y-4">
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  {t('트랙', 'Track')} {index + 1}: {track.titleKo || t('제목 없음', 'Untitled')}
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('작곡가', 'Composer')} *
                    </label>
                    <input
                      type="text"
                      value={track.composer}
                      onChange={(e) => updateTrack(track.id, 'composer', e.target.value)}
                      className="input-modern"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('작사가', 'Lyricist')} *
                    </label>
                    <input
                      type="text"
                      value={track.lyricist}
                      onChange={(e) => updateTrack(track.id, 'lyricist', e.target.value)}
                      className="input-modern"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('편곡자', 'Arranger')}
                    </label>
                    <input
                      type="text"
                      value={track.arranger}
                      onChange={(e) => updateTrack(track.id, 'arranger', e.target.value)}
                      className="input-modern"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('프로듀서', 'Producer')}
                    </label>
                    <input
                      type="text"
                      value={track.producer || ''}
                      onChange={(e) => updateTrack(track.id, 'producer', e.target.value)}
                      className="input-modern"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('믹싱 엔지니어', 'Mixing Engineer')}
                    </label>
                    <input
                      type="text"
                      value={track.mixer || ''}
                      onChange={(e) => updateTrack(track.id, 'mixer', e.target.value)}
                      className="input-modern"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('마스터링 엔지니어', 'Mastering Engineer')}
                    </label>
                    <input
                      type="text"
                      value={track.masterer || ''}
                      onChange={(e) => updateTrack(track.id, 'masterer', e.target.value)}
                      className="input-modern"
                    />
                  </div>
                </div>

                {/* 아티스트 관리 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('참여 아티스트', 'Participating Artists')}
                  </label>
                  <div className="space-y-2">
                    {track.artists.map((artist, artistIndex) => (
                      <div key={artistIndex} className="flex gap-2">
                        <input
                          type="text"
                          value={artist}
                          onChange={(e) => {
                            const newArtists = [...track.artists]
                            newArtists[artistIndex] = e.target.value
                            updateTrack(track.id, 'artists', newArtists)
                          }}
                          className="input-modern flex-1"
                          placeholder={t('아티스트 이름', 'Artist name')}
                        />
                        <button
                          onClick={() => {
                            const newArtists = track.artists.filter((_, i) => i !== artistIndex)
                            updateTrack(track.id, 'artists', newArtists.length > 0 ? newArtists : [''])
                          }}
                          className="text-red-500 hover:text-red-600 p-2"
                          disabled={track.artists.length === 1}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => updateTrack(track.id, 'artists', [...track.artists, ''])}
                      className="btn-ghost text-sm"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      {t('아티스트 추가', 'Add Artist')}
                    </button>
                  </div>
                </div>

                {/* 피처링 아티스트 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('피처링 아티스트', 'Featuring Artists')}
                  </label>
                  <div className="space-y-2">
                    {track.featuringArtists.map((artist, featIndex) => (
                      <div key={featIndex} className="flex gap-2">
                        <input
                          type="text"
                          value={artist}
                          onChange={(e) => {
                            const newFeats = [...track.featuringArtists]
                            newFeats[featIndex] = e.target.value
                            updateTrack(track.id, 'featuringArtists', newFeats)
                          }}
                          className="input-modern flex-1"
                          placeholder={t('피처링 아티스트 이름', 'Featuring artist name')}
                        />
                        <button
                          onClick={() => {
                            const newFeats = track.featuringArtists.filter((_, i) => i !== featIndex)
                            updateTrack(track.id, 'featuringArtists', newFeats)
                          }}
                          className="text-red-500 hover:text-red-600 p-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => updateTrack(track.id, 'featuringArtists', [...track.featuringArtists, ''])}
                      className="btn-ghost text-sm"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      {t('피처링 추가', 'Add Featuring')}
                    </button>
                  </div>
                </div>

                {/* 기타 기여자 */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('기타 기여자', 'Other Contributors')}
                    </label>
                    <button
                      onClick={() => addContributor(track.id)}
                      className="btn-ghost text-sm"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      {t('기여자 추가', 'Add Contributor')}
                    </button>
                  </div>
                  {track.contributors.map((contributor, contribIndex) => (
                    <div key={contribIndex} className="glassmorphism p-4 mb-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={contributor.name}
                          onChange={(e) => updateContributor(track.id, contribIndex, 'name', e.target.value)}
                          className="input-modern"
                          placeholder={t('이름', 'Name')}
                        />
                        <input
                          type="text"
                          value={contributor.role}
                          onChange={(e) => updateContributor(track.id, contribIndex, 'role', e.target.value)}
                          className="input-modern"
                          placeholder={t('역할 (예: 기타, 드럼)', 'Role (e.g., Guitar, Drums)')}
                        />
                        <input
                          type="url"
                          value={contributor.spotifyUrl || ''}
                          onChange={(e) => updateContributor(track.id, contribIndex, 'spotifyUrl', e.target.value)}
                          className="input-modern"
                          placeholder="Spotify URL"
                        />
                        <input
                          type="url"
                          value={contributor.appleMusicUrl || ''}
                          onChange={(e) => updateContributor(track.id, contribIndex, 'appleMusicUrl', e.target.value)}
                          className="input-modern"
                          placeholder="Apple Music URL"
                        />
                      </div>
                      <button
                        onClick={() => removeContributor(track.id, contribIndex)}
                        className="text-red-500 hover:text-red-600 mt-2"
                      >
                        <Trash2 className="w-4 h-4 inline mr-1" />
                        {t('기여자 삭제', 'Remove Contributor')}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )

      case 5: // 파일 업로드
        return (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('파일 업로드', 'File Upload')}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('앨범 커버', 'Album Cover')} * (3000x3000px)
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload('coverArt')}
                    className="input-modern"
                    required
                  />
                  {filePreviews.coverArt && (
                    <img
                      src={filePreviews.coverArt}
                      alt="Cover preview"
                      className="mt-2 w-32 h-32 object-cover rounded-lg"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('아티스트 사진', 'Artist Photo')}
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload('artistPhoto')}
                    className="input-modern"
                  />
                  {filePreviews.artistPhoto && (
                    <img
                      src={filePreviews.artistPhoto}
                      alt="Artist preview"
                      className="mt-2 w-32 h-32 object-cover rounded-lg"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('프레스 샷', 'Press Shot')}
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload('pressShotImage')}
                    className="input-modern"
                  />
                  {filePreviews.pressShotImage && (
                    <img
                      src={filePreviews.pressShotImage}
                      alt="Press shot preview"
                      className="mt-2 w-32 h-32 object-cover rounded-lg"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('아티스트 아바타', 'Artist Avatar')}
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload('artistAvatar')}
                    className="input-modern"
                  />
                  {filePreviews.artistAvatar && (
                    <img
                      src={filePreviews.artistAvatar}
                      alt="Avatar preview"
                      className="mt-2 w-32 h-32 object-cover rounded-lg"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('아티스트 로고', 'Artist Logo')}
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload('artistLogo')}
                    className="input-modern"
                  />
                  {filePreviews.artistLogo && (
                    <img
                      src={filePreviews.artistLogo}
                      alt="Logo preview"
                      className="mt-2 w-32 h-32 object-cover rounded-lg"
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-blue-800">
                    {t('파일 요구사항', 'File Requirements')}
                  </h4>
                  <ul className="mt-2 text-sm text-blue-700 space-y-1">
                    <li>• {t('앨범 커버: 3000x3000px, JPG/PNG', 'Album Cover: 3000x3000px, JPG/PNG')}</li>
                    <li>• {t('오디오 파일: WAV 또는 FLAC 권장', 'Audio Files: WAV or FLAC recommended')}</li>
                    <li>• {t('이미지 파일: 고해상도 권장', 'Image Files: High resolution recommended')}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )

      case 6: // 지역 및 배급
        return (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('지역 및 배급', 'Region & Distribution')}
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('배포 지역', 'Distribution Territory')}
              </label>
              <select
                value={basicInfo.territoryType}
                onChange={(e) => setBasicInfo({ ...basicInfo, territoryType: e.target.value })}
                className="input-modern"
              >
                <option value="WORLDWIDE">{t('전세계', 'Worldwide')}</option>
                <option value="SELECTED">{t('선택 지역', 'Selected Territories')}</option>
                <option value="EXCLUDED">{t('제외 지역', 'Excluded Territories')}</option>
              </select>
            </div>

            {basicInfo.territoryType === 'SELECTED' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('포함 지역', 'Included Territories')}
                </label>
                <textarea
                  value={basicInfo.territories.join(', ')}
                  onChange={(e) => setBasicInfo({ 
                    ...basicInfo, 
                    territories: e.target.value.split(',').map(t => t.trim()).filter(t => t) 
                  })}
                  className="input-modern"
                  rows={3}
                  placeholder={t('국가 코드를 쉼표로 구분 (예: KR, US, JP)', 'Comma-separated country codes (e.g., KR, US, JP)')}
                />
              </div>
            )}

            {basicInfo.territoryType === 'EXCLUDED' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('제외 지역', 'Excluded Territories')}
                </label>
                <textarea
                  value={basicInfo.excludedTerritories.join(', ')}
                  onChange={(e) => setBasicInfo({ 
                    ...basicInfo, 
                    excludedTerritories: e.target.value.split(',').map(t => t.trim()).filter(t => t) 
                  })}
                  className="input-modern"
                  rows={3}
                  placeholder={t('국가 코드를 쉼표로 구분', 'Comma-separated country codes')}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('가격 설정', 'Pricing')}
              </label>
              <select
                value={basicInfo.priceType}
                onChange={(e) => setBasicInfo({ ...basicInfo, priceType: e.target.value })}
                className="input-modern"
              >
                <option value="FREE">{t('무료', 'Free')}</option>
                <option value="PAID">{t('유료', 'Paid')}</option>
                <option value="PREMIUM">{t('프리미엄', 'Premium')}</option>
              </select>
            </div>

            {basicInfo.priceType !== 'FREE' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('가격 (USD)', 'Price (USD)')}
                </label>
                <input
                  type="number"
                  value={basicInfo.price}
                  onChange={(e) => setBasicInfo({ ...basicInfo, price: parseFloat(e.target.value) || 0 })}
                  className="input-modern"
                  min="0"
                  step="0.01"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('배급사', 'Distributors')}
              </label>
              <textarea
                value={basicInfo.distributors.join(', ')}
                onChange={(e) => setBasicInfo({ 
                  ...basicInfo, 
                  distributors: e.target.value.split(',').map(d => d.trim()).filter(d => d) 
                })}
                className="input-modern"
                rows={2}
                placeholder={t('배급사 이름을 쉼표로 구분', 'Comma-separated distributor names')}
              />
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('DSP별 지역 설정', 'DSP-specific Territories')}
              </h4>
              <div className="space-y-4">
                {['Spotify', 'Apple Music', 'YouTube Music', 'Amazon Music'].map(dsp => (
                  <div key={dsp}>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                      {dsp}
                    </label>
                    <input
                      type="text"
                      value={basicInfo.dspTerritories[dsp]?.join(', ') || ''}
                      onChange={(e) => setBasicInfo({ 
                        ...basicInfo, 
                        dspTerritories: {
                          ...basicInfo.dspTerritories,
                          [dsp]: e.target.value.split(',').map(t => t.trim()).filter(t => t)
                        }
                      })}
                      className="input-modern"
                      placeholder={t('기본값: 전세계', 'Default: Worldwide')}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      case 7: // 한국 DSP 설정
        return (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('한국 DSP 설정', 'Korean DSP Settings')}
            </h3>

            <div className="space-y-4">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={basicInfo.koreanDSPInfo.lyricsAttached}
                  onChange={(e) => setBasicInfo({ 
                    ...basicInfo, 
                    koreanDSPInfo: { ...basicInfo.koreanDSPInfo, lyricsAttached: e.target.checked }
                  })}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  {t('가사 첨부됨', 'Lyrics Attached')}
                </span>
              </label>

              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={basicInfo.koreanDSPInfo.newArtist}
                  onChange={(e) => setBasicInfo({ 
                    ...basicInfo, 
                    koreanDSPInfo: { ...basicInfo.koreanDSPInfo, newArtist: e.target.checked }
                  })}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  {t('신인 아티스트', 'New Artist')}
                </span>
              </label>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('아티스트 페이지 링크', 'Artist Page Link')}
                </label>
                <input
                  type="url"
                  value={basicInfo.koreanDSPInfo.artistPageLink || ''}
                  onChange={(e) => setBasicInfo({ 
                    ...basicInfo, 
                    koreanDSPInfo: { ...basicInfo.koreanDSPInfo, artistPageLink: e.target.value }
                  })}
                  className="input-modern"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('멜론 링크', 'Melon Link')}
                </label>
                <input
                  type="url"
                  value={basicInfo.koreanDSPInfo.melonLink || ''}
                  onChange={(e) => setBasicInfo({ 
                    ...basicInfo, 
                    koreanDSPInfo: { ...basicInfo.koreanDSPInfo, melonLink: e.target.value }
                  })}
                  className="input-modern"
                  placeholder="https://www.melon.com/..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('지니 링크', 'Genie Link')}
                </label>
                <input
                  type="url"
                  value={basicInfo.koreanDSPInfo.genieLink || ''}
                  onChange={(e) => setBasicInfo({ 
                    ...basicInfo, 
                    koreanDSPInfo: { ...basicInfo.koreanDSPInfo, genieLink: e.target.value }
                  })}
                  className="input-modern"
                  placeholder="https://www.genie.co.kr/..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('벅스 링크', 'Bugs Link')}
                </label>
                <input
                  type="url"
                  value={basicInfo.koreanDSPInfo.bugsLink || ''}
                  onChange={(e) => setBasicInfo({ 
                    ...basicInfo, 
                    koreanDSPInfo: { ...basicInfo.koreanDSPInfo, bugsLink: e.target.value }
                  })}
                  className="input-modern"
                  placeholder="https://music.bugs.co.kr/..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('바이브 링크', 'Vibe Link')}
                </label>
                <input
                  type="url"
                  value={basicInfo.koreanDSPInfo.vibeLink || ''}
                  onChange={(e) => setBasicInfo({ 
                    ...basicInfo, 
                    koreanDSPInfo: { ...basicInfo.koreanDSPInfo, vibeLink: e.target.value }
                  })}
                  className="input-modern"
                  placeholder="https://vibe.naver.com/..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('앨범 크레딧', 'Album Credits')}
                </label>
                <textarea
                  value={basicInfo.koreanDSPInfo.albumCredits || ''}
                  onChange={(e) => setBasicInfo({ 
                    ...basicInfo, 
                    koreanDSPInfo: { ...basicInfo.koreanDSPInfo, albumCredits: e.target.value }
                  })}
                  className="input-modern"
                  rows={4}
                  placeholder={t('한국 DSP용 앨범 크레딧 정보', 'Album credits for Korean DSPs')}
                />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-blue-800">
                    {t('한국 DSP 참고사항', 'Korean DSP Notes')}
                  </h4>
                  <ul className="mt-2 text-sm text-blue-700 space-y-1">
                    <li>• {t('멜론, 지니, 벅스, 바이브는 한국 주요 음원 사이트입니다', 'Melon, Genie, Bugs, and Vibe are major Korean music platforms')}</li>
                    <li>• {t('기존 아티스트의 경우 기존 페이지 링크를 제공해주세요', 'For existing artists, please provide existing page links')}</li>
                    <li>• {t('신인 아티스트는 "신인 아티스트" 옵션을 체크해주세요', 'For new artists, please check the "New Artist" option')}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )

      case 8: // 마케팅 정보
        return (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('마케팅 정보', 'Marketing Information')}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('앨범 소개', 'Album Introduction')}
                </label>
                <textarea
                  value={marketingData.albumIntroduction}
                  onChange={(e) => setMarketingData({ ...marketingData, albumIntroduction: e.target.value })}
                  className="input-modern"
                  rows={3}
                  placeholder={t('앨범에 대한 간단한 소개를 작성해주세요', 'Write a brief introduction about the album')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('앨범 설명', 'Album Description')}
                </label>
                <textarea
                  value={marketingData.albumDescription}
                  onChange={(e) => setMarketingData({ ...marketingData, albumDescription: e.target.value })}
                  className="input-modern"
                  rows={4}
                  placeholder={t('앨범에 대한 상세한 설명을 작성해주세요', 'Write a detailed description about the album')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('마케팅 키워드', 'Marketing Keywords')}
                </label>
                <input
                  type="text"
                  value={marketingData.marketingKeywords}
                  onChange={(e) => setMarketingData({ ...marketingData, marketingKeywords: e.target.value })}
                  className="input-modern"
                  placeholder={t('키워드를 쉼표로 구분하여 입력', 'Enter keywords separated by commas')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('타겟 청중', 'Target Audience')}
                </label>
                <input
                  type="text"
                  value={marketingData.targetAudience}
                  onChange={(e) => setMarketingData({ ...marketingData, targetAudience: e.target.value })}
                  className="input-modern"
                  placeholder={t('예: 20-30대 여성, K-POP 팬', 'e.g., Women in their 20s-30s, K-POP fans')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('프로모션 계획', 'Promotion Plans')}
                </label>
                <textarea
                  value={marketingData.promotionPlans}
                  onChange={(e) => setMarketingData({ ...marketingData, promotionPlans: e.target.value })}
                  className="input-modern"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('아티스트 소개', 'Artist Biography')}
                </label>
                <textarea
                  value={marketingData.artistBio}
                  onChange={(e) => setMarketingData({ ...marketingData, artistBio: e.target.value })}
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
                  value={marketingData.similarArtists}
                  onChange={(e) => setMarketingData({ ...marketingData, similarArtists: e.target.value })}
                  className="input-modern"
                  placeholder={t('비슷한 스타일의 아티스트들을 입력', 'Enter artists with similar style')}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('아티스트 성별', 'Artist Gender')}
                  </label>
                  <select
                    value={marketingData.artistGender}
                    onChange={(e) => setMarketingData({ ...marketingData, artistGender: e.target.value })}
                    className="input-modern"
                  >
                    <option value="">{t('선택', 'Select')}</option>
                    <option value="male">{t('남성', 'Male')}</option>
                    <option value="female">{t('여성', 'Female')}</option>
                    <option value="group">{t('그룹', 'Group')}</option>
                    <option value="other">{t('기타', 'Other')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('아티스트 국가', 'Artist Country')}
                  </label>
                  <input
                    type="text"
                    value={marketingData.artistCountry}
                    onChange={(e) => setMarketingData({ ...marketingData, artistCountry: e.target.value })}
                    className="input-modern"
                    placeholder="KR"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('현재 거주 도시', 'Current City')}
                  </label>
                  <input
                    type="text"
                    value={marketingData.artistCurrentCity}
                    onChange={(e) => setMarketingData({ ...marketingData, artistCurrentCity: e.target.value })}
                    className="input-modern"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('무드', 'Moods')}
                </label>
                <input
                  type="text"
                  value={marketingData.moods.join(', ')}
                  onChange={(e) => setMarketingData({ 
                    ...marketingData, 
                    moods: e.target.value.split(',').map(m => m.trim()).filter(m => m) 
                  })}
                  className="input-modern"
                  placeholder={t('예: 밝은, 신나는, 감성적인', 'e.g., Bright, Exciting, Emotional')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('사용 악기', 'Instruments')}
                </label>
                <input
                  type="text"
                  value={marketingData.instruments.join(', ')}
                  onChange={(e) => setMarketingData({ 
                    ...marketingData, 
                    instruments: e.target.value.split(',').map(i => i.trim()).filter(i => i) 
                  })}
                  className="input-modern"
                  placeholder={t('예: 기타, 피아노, 드럼', 'e.g., Guitar, Piano, Drums')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('훅/캐치프레이즈', 'Hook/Catchphrase')}
                </label>
                <input
                  type="text"
                  value={marketingData.hook}
                  onChange={(e) => setMarketingData({ ...marketingData, hook: e.target.value })}
                  className="input-modern"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('메인 피치', 'Main Pitch')}
                </label>
                <textarea
                  value={marketingData.mainPitch}
                  onChange={(e) => setMarketingData({ ...marketingData, mainPitch: e.target.value })}
                  className="input-modern"
                  rows={3}
                />
              </div>

              <div>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={marketingData.hasSyncHistory}
                    onChange={(e) => setMarketingData({ ...marketingData, hasSyncHistory: e.target.checked })}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    {t('싱크 사용 이력이 있습니다', 'Has sync history')}
                  </span>
                </label>

                {marketingData.hasSyncHistory && (
                  <div className="mt-2 ml-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('싱크 사용 이력', 'Sync History')}
                    </label>
                    <textarea
                      value={marketingData.syncHistory}
                      onChange={(e) => setMarketingData({ ...marketingData, syncHistory: e.target.value })}
                      className="input-modern"
                      rows={2}
                      placeholder={t('광고, 드라마, 영화 등 사용 이력', 'Usage in commercials, dramas, movies, etc.')}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )

      case 9: // 소셜 미디어
        return (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('소셜 미디어 & 스트리밍 플랫폼', 'Social Media & Streaming Platforms')}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Spotify Artist ID
                </label>
                <input
                  type="text"
                  value={marketingData.spotifyArtistId}
                  onChange={(e) => setMarketingData({ ...marketingData, spotifyArtistId: e.target.value })}
                  className="input-modern"
                  placeholder="spotify:artist:XXXXXX"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Apple Music Artist ID
                </label>
                <input
                  type="text"
                  value={marketingData.appleMusicArtistId}
                  onChange={(e) => setMarketingData({ ...marketingData, appleMusicArtistId: e.target.value })}
                  className="input-modern"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  YouTube URL
                </label>
                <input
                  type="url"
                  value={marketingData.youtubeUrl}
                  onChange={(e) => setMarketingData({ ...marketingData, youtubeUrl: e.target.value })}
                  className="input-modern"
                  placeholder="https://youtube.com/@artist"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Instagram URL
                </label>
                <input
                  type="url"
                  value={marketingData.instagramUrl}
                  onChange={(e) => setMarketingData({ ...marketingData, instagramUrl: e.target.value })}
                  className="input-modern"
                  placeholder="https://instagram.com/artist"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  TikTok URL
                </label>
                <input
                  type="url"
                  value={marketingData.tiktokUrl}
                  onChange={(e) => setMarketingData({ ...marketingData, tiktokUrl: e.target.value })}
                  className="input-modern"
                  placeholder="https://tiktok.com/@artist"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Facebook URL
                </label>
                <input
                  type="url"
                  value={marketingData.facebookUrl}
                  onChange={(e) => setMarketingData({ ...marketingData, facebookUrl: e.target.value })}
                  className="input-modern"
                  placeholder="https://facebook.com/artist"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  X (Twitter) URL
                </label>
                <input
                  type="url"
                  value={marketingData.xUrl}
                  onChange={(e) => setMarketingData({ ...marketingData, xUrl: e.target.value })}
                  className="input-modern"
                  placeholder="https://x.com/artist"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Twitch URL
                </label>
                <input
                  type="url"
                  value={marketingData.twitchUrl}
                  onChange={(e) => setMarketingData({ ...marketingData, twitchUrl: e.target.value })}
                  className="input-modern"
                  placeholder="https://twitch.tv/artist"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Threads URL
                </label>
                <input
                  type="url"
                  value={marketingData.threadsUrl}
                  onChange={(e) => setMarketingData({ ...marketingData, threadsUrl: e.target.value })}
                  className="input-modern"
                  placeholder="https://threads.net/@artist"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  SoundCloud Artist ID
                </label>
                <input
                  type="text"
                  value={marketingData.soundcloudArtistId}
                  onChange={(e) => setMarketingData({ ...marketingData, soundcloudArtistId: e.target.value })}
                  className="input-modern"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('톤데이츠 URL', 'Toundates URL')}
                </label>
                <input
                  type="url"
                  value={marketingData.toundatesUrl}
                  onChange={(e) => setMarketingData({ ...marketingData, toundatesUrl: e.target.value })}
                  className="input-modern"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('아티스트 UGC 우선순위', 'Artist UGC Priorities')}
              </label>
              <textarea
                value={marketingData.artistUgcPriorities}
                onChange={(e) => setMarketingData({ ...marketingData, artistUgcPriorities: e.target.value })}
                className="input-modern"
                rows={3}
                placeholder={t('사용자 생성 콘텐츠에 대한 우선순위 설명', 'Describe priorities for user-generated content')}
              />
            </div>
          </div>
        )

      case 10: // 프로모션 계획
        return (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('프로모션 계획', 'Promotion Plans')}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('소셜 미디어 계획', 'Social Media Plan')}
                </label>
                <textarea
                  value={marketingData.socialMediaPlan}
                  onChange={(e) => setMarketingData({ ...marketingData, socialMediaPlan: e.target.value })}
                  className="input-modern"
                  rows={4}
                  placeholder={t('소셜 미디어 프로모션 전략을 설명해주세요', 'Describe your social media promotion strategy')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('마케팅 드라이버', 'Marketing Drivers')}
                </label>
                <textarea
                  value={marketingData.marketingDrivers}
                  onChange={(e) => setMarketingData({ ...marketingData, marketingDrivers: e.target.value })}
                  className="input-modern"
                  rows={3}
                  placeholder={t('주요 마케팅 전략과 판매 포인트', 'Key marketing strategies and selling points')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('사회적 운동/메시지', 'Social Movements/Message')}
                </label>
                <textarea
                  value={marketingData.socialMovements}
                  onChange={(e) => setMarketingData({ ...marketingData, socialMovements: e.target.value })}
                  className="input-modern"
                  rows={3}
                  placeholder={t('연관된 사회적 운동이나 메시지가 있다면 설명해주세요', 'Describe any associated social movements or messages')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('고향', 'Hometown')}
                </label>
                <input
                  type="text"
                  value={marketingData.artistHometown}
                  onChange={(e) => setMarketingData({ ...marketingData, artistHometown: e.target.value })}
                  className="input-modern"
                  placeholder={t('아티스트의 고향', "Artist's hometown")}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('프레스 샷 크레딧', 'Press Shot Credits')}
                </label>
                <input
                  type="text"
                  value={marketingData.pressShotCredits || ''}
                  onChange={(e) => setMarketingData({ ...marketingData, pressShotCredits: e.target.value })}
                  className="input-modern"
                  placeholder={t('사진작가 이름 등', 'Photographer name, etc.')}
                />
              </div>
            </div>
          </div>
        )

      case 11: // 검토 및 제출
        return (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('검토 및 제출', 'Review & Submit')}
            </h3>

            <div className="glassmorphism p-6 space-y-4">
              <h4 className="font-semibold text-gray-900 dark:text-white">
                {t('제출 정보 요약', 'Submission Summary')}
              </h4>

              <div className="space-y-2 text-sm">
                <p><strong>{t('아티스트', 'Artist')}:</strong> {basicInfo.artistName}</p>
                <p><strong>{t('앨범', 'Album')}:</strong> {basicInfo.albumTitle}</p>
                <p><strong>{t('발매일', 'Release Date')}:</strong> {basicInfo.releaseDate}</p>
                <p><strong>{t('트랙 수', 'Number of Tracks')}:</strong> {tracks.length}</p>
                <p><strong>{t('레이블', 'Label')}:</strong> {basicInfo.labelName || 'N/A'}</p>
              </div>

              <div className="mt-4">
                <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                  {t('업로드된 파일', 'Uploaded Files')}
                </h5>
                <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  {files.coverArt && <li>✓ {t('앨범 커버', 'Album Cover')}</li>}
                  {files.artistPhoto && <li>✓ {t('아티스트 사진', 'Artist Photo')}</li>}
                  {files.pressShotImage && <li>✓ {t('프레스 샷', 'Press Shot')}</li>}
                  {tracks.filter(t => t.audioFile).map((t, i) => (
                    <li key={i}>✓ {t('트랙', 'Track')} {i + 1} - {t.titleKo}</li>
                  ))}
                </ul>
              </div>

              <div className="mt-4">
                <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                  {t('마케팅 정보', 'Marketing Information')}
                </h5>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {Object.values(marketingData).filter(v => v && (typeof v !== 'object' || v.length > 0)).length} / 31 {t('필드 작성됨', 'fields completed')}
                </p>
              </div>

              {isSubmitting && (
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>{t('업로드 진행률', 'Upload Progress')}</span>
                    <span>{Math.round(uploadProgress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-yellow-800">
                    {t('제출 전 확인사항', 'Pre-submission Checklist')}
                  </h4>
                  <ul className="mt-2 text-sm text-yellow-700 space-y-1">
                    <li>• {t('모든 필수 정보가 정확하게 입력되었는지 확인하세요', 'Ensure all required information is accurately entered')}</li>
                    <li>• {t('오디오 파일이 고품질(WAV 또는 FLAC)인지 확인하세요', 'Ensure audio files are high quality (WAV or FLAC)')}</li>
                    <li>• {t('앨범 커버가 3000x3000 픽셀인지 확인하세요', 'Ensure album cover is 3000x3000 pixels')}</li>
                    <li>• {t('저작권 정보가 정확한지 확인하세요', 'Ensure copyright information is accurate')}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glassmorphism p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            {t('릴리즈 제출', 'Release Submission')}
          </h1>

          {/* Progress Steps */}
          <div className="mb-8 overflow-x-auto">
            <div className="flex items-center justify-between min-w-max">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className={`flex-1 ${index < steps.length - 1 ? 'relative' : ''}`}
                >
                  <div
                    className={`flex items-center justify-center w-12 h-12 rounded-full ${
                      activeStep >= step.id
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                    } mx-auto transition-colors cursor-pointer`}
                    onClick={() => setActiveStep(step.id)}
                  >
                    <step.icon className="w-6 h-6" />
                  </div>
                  <p className={`text-xs text-center mt-2 ${
                    activeStep >= step.id
                      ? 'text-purple-600 dark:text-purple-400 font-medium'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {step.label}
                  </p>
                  {index < steps.length - 1 && (
                    <div className={`absolute top-6 left-1/2 w-full h-0.5 ${
                      activeStep > step.id
                        ? 'bg-purple-600'
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step Content */}
          {renderStep()}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <button
              onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
              disabled={activeStep === 0 || isSubmitting}
              className="btn-ghost disabled:opacity-50"
            >
              {t('이전', 'Previous')}
            </button>

            {activeStep < steps.length - 1 ? (
              <button
                onClick={() => setActiveStep(activeStep + 1)}
                className="btn-primary"
                disabled={isSubmitting}
              >
                {t('다음', 'Next')}
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="btn-primary min-w-[120px]"
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    {t('제출 중...', 'Submitting...')}
                  </div>
                ) : (
                  t('제출하기', 'Submit')
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}