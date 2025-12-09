import React, { useState } from 'react'
import {
  Disc, Music, Globe, CheckCircle, FileAudio, FileText, FileVideo,
  Calendar, Clock, MapPin, Shield, Hash, Languages, Volume2
} from 'lucide-react'
import {
  AccordionSection,
  InfoGrid,
  InfoItem,
  SubSection,
  FileCheckItem,
  ArtistBadges,
  ContributorsList,
  TerritoryBadges
} from './index'

interface Artist {
  id: string
  name: string
  spotifyId?: string
  appleMusicId?: string
}

interface Contributor {
  id: string
  name: string
  role: string
  instrument?: string
  description?: string
}

interface Track {
  id: string
  title: string
  titleTranslations?: { [key: string]: string }
  artists: Artist[]
  featuringArtists: Artist[]
  composers?: Artist[]
  lyricists?: Artist[]
  arrangers?: Artist[]
  publishers?: Artist[]
  contributors: Contributor[]
  isrc?: string
  duration?: string
  genre?: string
  subgenre?: string
  language?: string
  lyricsFile?: File
  musicVideoFile?: File
  dolbyAtmos?: boolean
  explicit?: boolean
  trackNumber?: number
}

interface FormData {
  albumTitle: string
  albumTitleTranslations?: { [key: string]: string }
  albumArtists: Artist[]
  albumFeaturingArtists?: Artist[]
  releaseType: 'single' | 'album' | 'ep'
  primaryGenre: string
  primarySubgenre: string
  language: string
  totalVolumes: number
  consumerReleaseDate: string
  originalReleaseDate: string
  releaseTime: string
  timezone: string
  recordLabel: string
  copyrightHolder: string
  copyrightYear: string
  productionHolder: string
  productionYear: string
  upc?: string
  ean?: string
  catalogNumber?: string
  albumVersion?: string
  explicitContent?: boolean
  tracks: Track[]
  coverArt?: File
  audioFiles: File[]
  dolbyAtmosFiles?: File[]
  musicVideoFiles?: File[]
  lyricsFiles?: File[]
  motionArtFile?: File
  marketingAssets?: File[]
  distributionType: 'all' | 'selected'
  selectedStores: string[]
  territorySelection: {
    base: 'worldwide' | 'include' | 'exclude'
    includeTerritories?: string[]
    excludeTerritories?: string[]
    dspOverrides?: Array<{
      dspId: string
      base: 'worldwide' | 'include' | 'exclude'
      includeTerritories?: string[]
      excludeTerritories?: string[]
    }>
  }
}

interface FinalReviewContentProps {
  formData: FormData
  onEdit: (stepNumber: number) => void
  t: (ko: string, en: string) => string
}

export const FinalReviewContent: React.FC<FinalReviewContentProps> = ({
  formData,
  onEdit,
  t
}) => {
  const [coverArtPreview, setCoverArtPreview] = useState<string>()

  // Generate cover art preview
  React.useEffect(() => {
    if (formData.coverArt) {
      const url = URL.createObjectURL(formData.coverArt)
      setCoverArtPreview(url)
      return () => URL.revokeObjectURL(url)
    }
  }, [formData.coverArt])

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  // Calculate total files
  const totalFiles = [
    formData.coverArt ? 1 : 0,
    formData.audioFiles?.length || 0,
    formData.dolbyAtmosFiles?.length || 0,
    formData.musicVideoFiles?.length || 0,
    formData.lyricsFiles?.length || 0,
    formData.motionArtFile ? 1 : 0,
    formData.marketingAssets?.length || 0
  ].reduce((a, b) => a + b, 0)

  // Get territories based on selection
  const getTerritories = (): string[] => {
    const { base, includeTerritories = [], excludeTerritories = [] } = formData.territorySelection

    if (base === 'worldwide') return ['Worldwide']
    if (base === 'include') return includeTerritories
    if (base === 'exclude') return [`Worldwide except ${excludeTerritories.length} territories`]

    return []
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t('최종 검토', 'Final Review')}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {t('제출하기 전에 모든 정보를 확인하세요', 'Please review all information before submitting')}
        </p>
      </div>

      {/* Overview Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600/20 to-pink-600/20 dark:from-purple-600/10 dark:to-pink-600/10 backdrop-blur-sm border border-purple-500/30 p-6">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* Album Art */}
          {coverArtPreview && (
            <div className="shrink-0">
              <img
                src={coverArtPreview}
                alt={formData.albumTitle}
                className="w-32 h-32 rounded-xl object-cover shadow-2xl border-2 border-white/20"
              />
            </div>
          )}

          {/* Album Info */}
          <div className="flex-1 space-y-3">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {formData.albumTitle}
              </h3>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                {formData.albumArtists?.map(a => a.name).join(', ')}
              </p>
            </div>

            {/* Progress Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-300 rounded-full border border-green-500/30">
              <CheckCircle className="w-5 h-5" />
              <span className="font-semibold">100% {t('완료', 'Complete')}</span>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">{formData.releaseType.toUpperCase()}</div>
              <div className="text-gray-500 dark:text-gray-400">{t('타입', 'Type')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">{formData.tracks.length}</div>
              <div className="text-gray-500 dark:text-gray-400">{t('트랙', 'Tracks')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">{totalFiles}</div>
              <div className="text-gray-500 dark:text-gray-400">{t('파일', 'Files')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">
                {formData.territorySelection.base === 'worldwide' ? 'Global' : getTerritories().length}
              </div>
              <div className="text-gray-500 dark:text-gray-400">{t('지역', 'Territories')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Album Information Section */}
      <AccordionSection
        icon={Disc}
        title={t('앨범 정보', 'Album Information')}
        onEdit={() => onEdit(1)}
        defaultOpen={true}
      >
        <div className="space-y-6">
          {/* Basic Details */}
          <SubSection title={t('기본 정보', 'Basic Details')}>
            <InfoGrid columns={2}>
              <InfoItem
                label={t('앨범 제목', 'Album Title')}
                value={formData.albumTitle}
              />
              {formData.albumTitleTranslations && Object.keys(formData.albumTitleTranslations).length > 0 && (
                <InfoItem
                  label={t('제목 번역', 'Title Translations')}
                  value={
                    <div className="space-y-1">
                      {Object.entries(formData.albumTitleTranslations).map(([lang, title]) => (
                        <div key={lang} className="text-sm">
                          <span className="text-gray-500">{lang}:</span> {title}
                        </div>
                      ))}
                    </div>
                  }
                />
              )}
              <InfoItem
                label={t('릴리즈 타입', 'Release Type')}
                value={formData.releaseType.toUpperCase()}
              />
              <InfoItem
                label={t('장르', 'Genre')}
                value={`${formData.primaryGenre} - ${formData.primarySubgenre}`}
              />
              <InfoItem
                label={t('언어', 'Language')}
                value={formData.language}
              />
              <InfoItem
                label={t('볼륨 수', 'Total Volumes')}
                value={formData.totalVolumes}
              />
              {formData.albumVersion && (
                <InfoItem
                  label={t('버전', 'Version')}
                  value={formData.albumVersion}
                />
              )}
              <InfoItem
                label={t('노골적 콘텐츠', 'Explicit Content')}
                value={formData.explicitContent ? t('예', 'Yes') : t('아니오', 'No')}
              />
            </InfoGrid>
          </SubSection>

          {/* Release Schedule */}
          <SubSection title={t('발매 일정', 'Release Schedule')}>
            <InfoGrid columns={2}>
              <InfoItem
                label={t('소비자 발매일', 'Consumer Release Date')}
                value={formData.consumerReleaseDate}
              />
              <InfoItem
                label={t('오리지널 발매일', 'Original Release Date')}
                value={formData.originalReleaseDate}
              />
              <InfoItem
                label={t('발매 시간', 'Release Time')}
                value={formData.releaseTime}
              />
              <InfoItem
                label={t('시간대', 'Timezone')}
                value={formData.timezone}
              />
            </InfoGrid>
          </SubSection>

          {/* Artists */}
          <SubSection title={t('아티스트', 'Artists')}>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  {t('앨범 아티스트', 'Album Artists')}
                </div>
                <ArtistBadges artists={formData.albumArtists || []} color="purple" />
              </div>
              {formData.albumFeaturingArtists && formData.albumFeaturingArtists.length > 0 && (
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    {t('피처링 아티스트', 'Featuring Artists')}
                  </div>
                  <ArtistBadges artists={formData.albumFeaturingArtists} color="pink" />
                </div>
              )}
            </div>
          </SubSection>

          {/* Copyright */}
          <SubSection title={t('저작권 정보', 'Copyright Information')}>
            <InfoGrid columns={2}>
              <InfoItem
                label={t('레코드 레이블', 'Record Label')}
                value={formData.recordLabel}
              />
              <InfoItem
                label={t('저작권 보유자', 'Copyright Holder')}
                value={`© ${formData.copyrightYear} ${formData.copyrightHolder}`}
              />
              <InfoItem
                label={t('제작 보유자', 'Production Holder')}
                value={`℗ ${formData.productionYear} ${formData.productionHolder}`}
              />
            </InfoGrid>
          </SubSection>

          {/* Identifiers */}
          <SubSection title={t('식별자', 'Identifiers')}>
            <InfoGrid columns={3}>
              {formData.upc && (
                <InfoItem label="UPC" value={formData.upc} />
              )}
              {formData.ean && (
                <InfoItem label="EAN" value={formData.ean} />
              )}
              {formData.catalogNumber && (
                <InfoItem
                  label={t('카탈로그 번호', 'Catalog Number')}
                  value={formData.catalogNumber}
                />
              )}
            </InfoGrid>
          </SubSection>
        </div>
      </AccordionSection>

      {/* Track Details Section */}
      <AccordionSection
        icon={Music}
        title={`${t('트랙 상세', 'Track Details')} (${formData.tracks.length})`}
        onEdit={() => onEdit(2)}
        defaultOpen={false}
      >
        <div className="space-y-4">
          {formData.tracks.map((track, index) => (
            <div
              key={track.id}
              className="p-4 rounded-xl bg-white/5 dark:bg-gray-800/30 border border-purple-500/10"
            >
              <div className="flex items-start gap-4">
                {/* Track Number */}
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <span className="text-lg font-bold text-purple-400">
                    {track.trackNumber || index + 1}
                  </span>
                </div>

                {/* Track Info */}
                <div className="flex-1 space-y-3">
                  {/* Title */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {track.title}
                    </h4>
                    {track.titleTranslations && Object.keys(track.titleTranslations).length > 0 && (
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {Object.entries(track.titleTranslations).map(([lang, title]) => (
                          <div key={lang}>
                            {lang}: {title}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Artists */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        {t('주 아티스트', 'Primary Artists')}
                      </div>
                      <ArtistBadges artists={track.artists || []} color="blue" />
                    </div>
                    {track.featuringArtists && track.featuringArtists.length > 0 && (
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          {t('피처링', 'Featuring')}
                        </div>
                        <ArtistBadges artists={track.featuringArtists} color="pink" />
                      </div>
                    )}
                  </div>

                  {/* Credits */}
                  {((track.composers && track.composers.length > 0) ||
                    (track.lyricists && track.lyricists.length > 0) ||
                    (track.arrangers && track.arrangers.length > 0) ||
                    (track.publishers && track.publishers.length > 0)) && (
                    <div className="space-y-2">
                      {track.composers && track.composers.length > 0 && (
                        <div className="flex gap-2 text-sm">
                          <span className="text-gray-500 dark:text-gray-400 min-w-[100px]">
                            {t('작곡가', 'Composers')}:
                          </span>
                          <ArtistBadges artists={track.composers} color="green" />
                        </div>
                      )}
                      {track.lyricists && track.lyricists.length > 0 && (
                        <div className="flex gap-2 text-sm">
                          <span className="text-gray-500 dark:text-gray-400 min-w-[100px]">
                            {t('작사가', 'Lyricists')}:
                          </span>
                          <ArtistBadges artists={track.lyricists} color="green" />
                        </div>
                      )}
                      {track.arrangers && track.arrangers.length > 0 && (
                        <div className="flex gap-2 text-sm">
                          <span className="text-gray-500 dark:text-gray-400 min-w-[100px]">
                            {t('편곡자', 'Arrangers')}:
                          </span>
                          <ArtistBadges artists={track.arrangers} color="green" />
                        </div>
                      )}
                      {track.publishers && track.publishers.length > 0 && (
                        <div className="flex gap-2 text-sm">
                          <span className="text-gray-500 dark:text-gray-400 min-w-[100px]">
                            {t('출판사', 'Publishers')}:
                          </span>
                          <ArtistBadges artists={track.publishers} color="green" />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Contributors */}
                  {track.contributors && track.contributors.length > 0 && (
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        {t('기여자', 'Contributors')}
                      </div>
                      <ContributorsList contributors={track.contributors} />
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                    {track.isrc && (
                      <div className="flex items-center gap-1">
                        <Hash className="w-4 h-4" />
                        ISRC: {track.isrc}
                      </div>
                    )}
                    {track.duration && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {track.duration}
                      </div>
                    )}
                    {track.genre && (
                      <div className="flex items-center gap-1">
                        <Music className="w-4 h-4" />
                        {track.genre}
                      </div>
                    )}
                    {track.language && (
                      <div className="flex items-center gap-1">
                        <Languages className="w-4 h-4" />
                        {track.language}
                      </div>
                    )}
                    {track.dolbyAtmos && (
                      <div className="flex items-center gap-1 text-purple-400">
                        <Volume2 className="w-4 h-4" />
                        Dolby Atmos
                      </div>
                    )}
                    {track.explicit && (
                      <div className="flex items-center gap-1 text-red-400">
                        <AlertCircle className="w-4 h-4" />
                        Explicit
                      </div>
                    )}
                  </div>

                  {/* Files */}
                  <div className="flex flex-wrap gap-2">
                    {track.lyricsFile && (
                      <div className="px-2 py-1 text-xs bg-blue-500/20 text-blue-300 rounded">
                        <FileText className="w-3 h-3 inline mr-1" />
                        {t('가사', 'Lyrics')}
                      </div>
                    )}
                    {track.musicVideoFile && (
                      <div className="px-2 py-1 text-xs bg-pink-500/20 text-pink-300 rounded">
                        <FileVideo className="w-3 h-3 inline mr-1" />
                        {t('뮤직비디오', 'Music Video')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </AccordionSection>

      {/* Files Checklist Section */}
      <AccordionSection
        icon={FileAudio}
        title={t('파일 체크리스트', 'Files Checklist')}
        onEdit={() => onEdit(1)}
        defaultOpen={true}
      >
        <div className="space-y-3">
          {/* Cover Art */}
          <FileCheckItem
            label={t('커버 아트', 'Cover Art')}
            file={formData.coverArt}
            status={formData.coverArt ? 'complete' : 'missing'}
            type="image"
            preview={coverArtPreview}
          />

          {/* Audio Files */}
          <FileCheckItem
            label={t('오디오 파일', 'Audio Files')}
            file={formData.audioFiles}
            status={formData.audioFiles?.length > 0 ? 'complete' : 'missing'}
            type="audio"
          />

          {/* Dolby Atmos */}
          {formData.dolbyAtmosFiles && formData.dolbyAtmosFiles.length > 0 && (
            <FileCheckItem
              label={t('Dolby Atmos 파일', 'Dolby Atmos Files')}
              file={formData.dolbyAtmosFiles}
              status="complete"
              type="audio"
            />
          )}

          {/* Music Videos */}
          {formData.musicVideoFiles && formData.musicVideoFiles.length > 0 && (
            <FileCheckItem
              label={t('뮤직비디오', 'Music Videos')}
              file={formData.musicVideoFiles}
              status="complete"
              type="video"
            />
          )}

          {/* Lyrics */}
          {formData.lyricsFiles && formData.lyricsFiles.length > 0 && (
            <FileCheckItem
              label={t('가사 파일', 'Lyrics Files')}
              file={formData.lyricsFiles}
              status="complete"
              type="text"
            />
          )}

          {/* Motion Art */}
          {formData.motionArtFile && (
            <FileCheckItem
              label={t('모션 아트', 'Motion Art')}
              file={formData.motionArtFile}
              status="optional"
              type="video"
            />
          )}

          {/* Marketing Assets */}
          {formData.marketingAssets && formData.marketingAssets.length > 0 && (
            <FileCheckItem
              label={t('마케팅 자료', 'Marketing Assets')}
              file={formData.marketingAssets}
              status="optional"
              type="image"
            />
          )}
        </div>
      </AccordionSection>

      {/* Distribution & Territories Section */}
      <AccordionSection
        icon={Globe}
        title={t('배포 및 지역', 'Distribution & Territories')}
        onEdit={() => onEdit(6)}
        defaultOpen={true}
      >
        <div className="space-y-6">
          {/* Distribution Type */}
          <SubSection title={t('배포 타입', 'Distribution Type')}>
            <InfoItem
              label={t('스토어 선택', 'Store Selection')}
              value={
                formData.distributionType === 'all'
                  ? t('모든 스토어', 'All Stores')
                  : `${formData.selectedStores?.length || 0} ${t('개 스토어 선택됨', 'stores selected')}`
              }
            />
            {formData.distributionType === 'selected' && formData.selectedStores && (
              <div className="mt-3 flex flex-wrap gap-2">
                {formData.selectedStores.map(storeId => (
                  <span
                    key={storeId}
                    className="px-3 py-1 text-sm bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full"
                  >
                    {storeId}
                  </span>
                ))}
              </div>
            )}
          </SubSection>

          {/* Territories */}
          <SubSection title={t('지역 설정', 'Territory Settings')}>
            <div className="space-y-3">
              <InfoItem
                label={t('지역 모드', 'Territory Mode')}
                value={
                  formData.territorySelection.base === 'worldwide'
                    ? t('전 세계', 'Worldwide')
                    : formData.territorySelection.base === 'include'
                    ? t('포함 지역', 'Include Territories')
                    : t('제외 지역', 'Exclude Territories')
                }
              />
              {formData.territorySelection.base !== 'worldwide' && (
                <div className="mt-3">
                  <TerritoryBadges territories={getTerritories()} maxVisible={15} />
                </div>
              )}
            </div>
          </SubSection>

          {/* DSP Overrides */}
          {formData.territorySelection.dspOverrides &&
            formData.territorySelection.dspOverrides.length > 0 && (
              <SubSection title={t('DSP별 지역 설정', 'DSP-Specific Territory Settings')}>
                <div className="space-y-3">
                  {formData.territorySelection.dspOverrides.map((override, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-lg bg-white/5 dark:bg-gray-800/30"
                    >
                      <div className="font-medium text-gray-900 dark:text-white mb-2">
                        {override.dspId}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {override.base === 'worldwide'
                          ? t('전 세계', 'Worldwide')
                          : override.base === 'include'
                          ? `${override.includeTerritories?.length || 0} ${t('개 지역 포함', 'territories included')}`
                          : `${override.excludeTerritories?.length || 0} ${t('개 지역 제외', 'territories excluded')}`}
                      </div>
                    </div>
                  ))}
                </div>
              </SubSection>
            )}
        </div>
      </AccordionSection>
    </div>
  )
}
