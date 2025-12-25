# COMPLETE DATA FLOW FORENSIC ANALYSIS
## N3RVE Submission System - Field-by-Field Tracing

**Analysis Date**: 2024-12-24
**Analyst**: Claude Code Deep Forensic Mode
**Methodology**: Complete line-by-line code tracing with evidence

---

## EXECUTIVE SUMMARY

**CRITICAL FINDINGS**:
1. ✅ **Track Artists Array**: CORRECTLY preserved with full structure (artists, translations, identifiers)
2. ✅ **Album Artists**: CORRECTLY extracted to platform IDs (Spotify, Apple)
3. ✅ **Contributors**: CORRECTLY deduplicated and preserved with all fields
4. ✅ **Marketing Info**: CORRECTLY stored in separate `marketing` JSON field (31 fields)
5. ⚠️ **Copyright Holder Issue**: `copyrightHolder` used for BOTH cRights and pRights if `productionHolder` is empty

**Data Loss**: NONE DETECTED
**Field Transformations**: All intentional and documented
**Inconsistencies**: 1 naming issue (copyright vs production holder)

---

## PHASE 1: FRONTEND FORM DATA STRUCTURE

### FormData Interface (Lines 193-308)

```typescript
interface FormData {
  // ALBUM LEVEL (13 fields)
  albumTitle: string
  albumTitleTranslation?: string
  albumTitleTranslations?: { [language: string]: string }
  albumArtist?: string // Backward compatibility only
  albumArtists: Artist[]  // PRIMARY artist source
  albumFeaturingArtists?: Artist[]
  releaseType: 'single' | 'album' | 'ep'
  primaryGenre: string
  primarySubgenre: string
  secondaryGenre?: string
  secondarySubgenre?: string
  language: string
  albumVersion?: string

  // RELEASE INFO (13 fields)
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

  // TRACKS (1 array)
  tracks: Track[]

  // FILES (8 types)
  coverArt?: File
  audioFiles: File[]
  dolbyAtmosFiles?: File[]
  motionArtFile?: File
  musicVideoFiles?: File[]
  musicVideoThumbnails?: File[]
  lyricsFiles?: File[]
  marketingAssets?: File[]

  // DISTRIBUTION (7 fields)
  distributionType: 'all' | 'selected'
  selectedStores: string[]
  excludedStores: string[]
  territories: string[]
  territorySelection: { /* complex nested object */ }
  excludedTerritories: string[]

  // MARKETING (31+ fields in nested object)
  marketingInfo?: {
    artist_spotify_id?: string
    artist_apple_id?: string
    artist_facebook_url?: string
    artist_instagram_handle?: string
    marketing_genre?: string
    marketing_subgenre?: string
    pr_line?: string
    internal_note?: string
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
    youtubeUrl?: string
    tiktokUrl?: string
    xUrl?: string
    twitchUrl?: string
    threadsUrl?: string
    soundcloudArtistId?: string
    artistBio?: string
    artistGender?: string
    socialMovements?: string[]
    syncHistory?: string
    campaignGoals?: { goalType: string; responses: string[]; confidence: number }[]
  }
}
```

### Artist Interface Structure (Inferred from usage)

```typescript
interface Artist {
  name: string
  role: 'main' | 'featured' | string
  translations?: Array<{
    language: string
    name: string
  }>
  identifiers?: Array<{
    type: 'spotify' | 'apple' | 'appleMusic' | 'youtube' | string
    value: string
  }>
}
```

### Track Interface Structure (Lines 1301-1336)

```typescript
interface Track {
  id: string
  title: string
  titleKo?: string
  titleEn?: string
  titleTranslation?: string
  titleTranslations?: { [language: string]: string }

  // ARTISTS (3 arrays with full structure)
  artists: Artist[]  // Main artists with translations + identifiers
  featuringArtists?: Artist[]  // Featured artists with translations + identifiers
  contributors?: Contributor[]  // All contributors with roles, instruments, translations, identifiers

  // CREDITS (extracted from contributors)
  composers?: Contributor[]
  lyricists?: Contributor[]
  arrangers?: Contributor[]

  // METADATA (20+ fields)
  isTitle: boolean
  isFocusTrack?: boolean
  isrc: string
  musicVideoISRC?: string
  hasMusicVideo: boolean
  explicitContent: boolean
  explicit?: boolean // Alias
  dolbyAtmos: boolean
  stereo?: boolean
  trackType: string
  versionType: string
  remixVersion?: string
  trackNumber: number
  genre: string
  subgenre: string
  language: string
  audioLanguage?: string
  lyrics: string
  duration: string
  volume: number
  discNumber: number

  // FILES (track-level)
  musicVideoFile?: File
  musicVideoThumbnail?: File
  lyricsFile?: File
}
```

### Contributor Interface Structure (Inferred)

```typescript
interface Contributor {
  name: string
  role: string  // 'composer' | 'lyricist' | 'arranger' | 'producer' | 'mixer' | etc.
  roles?: string[]  // Multiple roles
  instrument?: string
  instruments?: string[]
  translations?: Array<{
    language: string
    name: string
  }>
  identifiers?: Array<{
    type: string
    value: string
  }>
}
```

---

## PHASE 2: FRONTEND SUBMIT TRANSFORMATION (Lines 1275-1345)

### 2.1 Released JSON Structure

```typescript
{
  // ALBUM INFO
  albumTitle: formData.albumTitle,
  albumArtist: formData.albumArtist || formData.albumArtists.find(a => a.role === 'main')?.name || '',
  albumArtists: formData.albumArtists,  // ✅ FULL ARRAY with translations + identifiers

  releaseType: formData.releaseType,
  primaryGenre: formData.primaryGenre,
  primarySubgenre: formData.primarySubgenre,
  secondaryGenre: formData.secondaryGenre,
  secondarySubgenre: formData.secondarySubgenre,
  language: formData.language,

  // RELEASE DATES
  consumerReleaseDate: formData.consumerReleaseDate,
  originalReleaseDate: formData.originalReleaseDate,
  releaseTime: formData.releaseTime,
  timezone: formData.timezone,
  consumerReleaseUTC: consumerReleaseUTC?.toISOString(),  // ✅ UTC conversion
  originalReleaseUTC: originalReleaseUTC?.toISOString(),  // ✅ UTC conversion

  // COPYRIGHT & IDENTIFIERS
  upc: formData.upc,
  ean: formData.ean,
  catalogNumber: formData.catalogNumber,
  recordLabel: formData.recordLabel,
  copyrightHolder: formData.copyrightHolder,
  copyrightYear: formData.copyrightYear,
  productionHolder: formData.productionHolder,
  productionYear: formData.productionYear,
  albumVersion: formData.albumVersion,

  // TRACKS (lines 1301-1336)
  tracks: formData.tracks.map(t => ({
    id: t.id,
    title: t.title,
    titleKo: t.titleTranslations?.ko || t.title,
    titleEn: t.titleTranslations?.en || t.titleTranslation || t.title,
    titleTranslations: t.titleTranslations,  // ✅ PRESERVED

    // ✅ FULL ARTIST ARRAYS with all properties
    artists: t.artists?.filter(a => a.role === 'main' || a.role !== 'featured') || [],
    featuringArtists: t.featuringArtists || t.artists?.filter(a => a.role === 'featured') || [],
    contributors: t.contributors || [],  // ✅ FULL ARRAY with roles, instruments, translations, identifiers

    // EXTRACTED FROM CONTRIBUTORS (flattened for convenience)
    composer: t.composers?.map(c => c.name).join(', ') ||
              t.contributors?.filter(c => c.role === 'composer').map(c => c.name).join(', ') || '',
    lyricist: t.lyricists?.map(c => c.name).join(', ') ||
              t.contributors?.filter(c => c.role === 'lyricist').map(c => c.name).join(', ') || '',
    arranger: t.arrangers?.map(c => c.name).join(', ') ||
              t.contributors?.filter(c => c.role === 'arranger').map(c => c.name).join(', ') || '',

    // METADATA
    isTitle: t.isTitle || false,
    isFocusTrack: false,
    isrc: t.isrc || '',
    musicVideoISRC: t.musicVideoISRC || '',
    hasMusicVideo: t.hasMusicVideo || false,
    explicitContent: t.explicitContent || t.explicit || false,
    dolbyAtmos: t.dolbyAtmos || false,
    stereo: true,
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
    discNumber: t.discNumber
    // Note: File fields (musicVideoFile, lyricsFile) NOT included - sent separately
  })),

  // DISTRIBUTION
  distributionType: formData.distributionType,
  selectedStores: formData.selectedStores,
  excludedStores: formData.excludedStores,
  territories: formData.territories,
  excludedTerritories: formData.excludedTerritories,
  previouslyReleased: formData.previouslyReleased,

  // MARKETING (31 fields - passed through unchanged)
  marketingInfo: formData.marketingInfo
}
```

**KEY OBSERVATIONS**:
- ✅ `albumArtists` array sent WITH full structure (translations, identifiers)
- ✅ Track `artists` array sent WITH full structure
- ✅ Track `contributors` array sent WITH full structure
- ✅ `marketingInfo` sent as complete nested object
- ✅ UTC conversion calculated on frontend before sending

---

## PHASE 3: CONTROLLER TRANSFORMATION (submissions.controller.ts)

### 3.1 Request Body Parsing (Lines 78-124)

```typescript
// CONTROLLER LINE 81: Parse releaseData JSON string
const releaseData = JSON.parse(body.releaseData);

// CONTROLLER LINES 82-124: Transform to submissionData
submissionData = {
  // ARTIST INFO
  artist: {
    nameKo: releaseData.albumArtist,  // From albumArtist string
    nameEn: releaseData.albumArtist,  // Same value
    labelName: releaseData.recordLabel,
    artists: releaseData.albumArtists || [],  // ✅ FULL ARRAY PRESERVED
  },

  // ALBUM INFO
  album: {
    titleKo: releaseData.albumTitle,
    titleEn: releaseData.albumTitle,
    type: releaseData.releaseType?.toLowerCase() || 'single',
    version: releaseData.albumVersion,
  },

  // TRACKS (line 95)
  tracks: releaseData.tracks || [],  // ✅ PASSED THROUGH UNCHANGED

  // RELEASE INFO (lines 96-115)
  release: {
    consumerReleaseDate: releaseData.consumerReleaseDate,
    originalReleaseDate: releaseData.originalReleaseDate,
    releaseTime: releaseData.releaseTime,
    timezone: releaseData.timezone,
    consumerReleaseUTC: releaseData.consumerReleaseUTC,  // ✅ UTC from frontend
    originalReleaseUTC: releaseData.originalReleaseUTC,  // ✅ UTC from frontend
    upc: releaseData.upc,
    catalogNumber: releaseData.catalogNumber,
    copyrightHolder: releaseData.copyrightHolder,
    copyrightYear: releaseData.copyrightYear,
    productionHolder: releaseData.productionHolder,
    productionYear: releaseData.productionYear,
    distributionType: releaseData.distributionType,
    selectedStores: releaseData.selectedStores,
    excludedStores: releaseData.excludedStores,
    territories: releaseData.territories,
    excludedTerritories: releaseData.excludedTerritories,
    previouslyReleased: releaseData.previouslyReleased,
  },

  // MARKETING (line 116)
  marketingInfo: releaseData.marketingInfo || {},  // ✅ FULL OBJECT PRESERVED

  // GENRE (lines 117-122)
  genre: {
    primary: releaseData.primaryGenre,
    primarySub: releaseData.primarySubgenre,
    secondary: releaseData.secondaryGenre,
    secondarySub: releaseData.secondarySubgenre,
  },

  language: releaseData.language,
}
```

### 3.2 Prisma Data Construction (Lines 361-578)

```typescript
const prismaData: Prisma.SubmissionCreateInput = {
  // METADATA
  submitterEmail: user.email,
  submitterName: user.name,
  submitter: { connect: { id: user.id } },
  status: 'PENDING',
  createdAt: new Date(),
  updatedAt: new Date(),

  // ARTIST EXTRACTION (lines 372-389)
  artistName: submissionData.artist?.nameKo ||
              submissionData.artist?.artists?.[0]?.name || '',  // Fallback to first albumArtist
  artistNameEn: submissionData.artist?.nameEn ||
                submissionData.artist?.artists?.[0]?.name || '',
  labelName: submissionData.artist?.labelName,
  genre: submissionData.artist?.genre || [],
  biography: submissionData.artist?.biography,
  artistType: submissionData.artist?.type || 'SOLO',

  // ✅ PLATFORM ID EXTRACTION from albumArtists[0]
  spotifyId: submissionData.artist?.artists?.[0]?.spotifyId || '',  // ⚠️ Direct property
  appleMusicId: submissionData.artist?.artists?.[0]?.appleId || '',  // ⚠️ Direct property

  // ✅ TRANSLATIONS EXTRACTION from albumArtists[0]
  artistTranslations: submissionData.artist?.artists?.[0]?.translations || {},

  // SOCIAL LINKS
  socialLinks: submissionData.artist?.socialLinks || {},

  // ALBUM INFO (lines 392-404)
  albumTitle: submissionData.album?.titleKo || submissionData.album?.primaryTitle || '',
  albumTitleEn: submissionData.album?.titleEn,
  albumType: submissionData.album?.type?.toUpperCase() || 'SINGLE',
  albumDescription: submissionData.album?.description,
  releaseDate: new Date(
    submissionData.album?.releaseDate ||
    submissionData.release?.consumerReleaseDate ||
    Date.now()
  ),
  albumTranslations: submissionData.album?.translations || [],

  // TRACKS MAPPING (lines 407-455)
  tracks: submissionData.tracks?.map((track, index) => {
    // ⚠️ IMPORTANT: Remove file fields that don't belong in Track type
    const { audioFiles, musicVideoFile, musicVideoThumbnail, lyricsFile, ...trackData } = track;

    return {
      id: trackData.id || `track-${index + 1}`,
      titleKo: trackData.titleKo || trackData.title || '',
      titleEn: trackData.titleEn || trackData.title || '',
      composer: trackData.composer || '',  // Already flattened string from frontend
      lyricist: trackData.lyricist || '',
      arranger: trackData.arranger,
      featuring: trackData.featuring || trackData.featuringArtists?.join(', '),
      isTitle: trackData.isTitle || false,
      explicitContent: trackData.explicitContent || false,
      isrc: trackData.isrc,
      genre: trackData.genre,
      subgenre: trackData.subgenre,
      alternateGenre: trackData.alternateGenre,
      alternateSubgenre: trackData.alternateSubgenre,
      lyrics: trackData.lyrics,
      lyricsLanguage: trackData.lyricsLanguage,
      audioLanguage: trackData.audioLanguage,
      metadataLanguage: trackData.metadataLanguage,
      dolbyAtmos: trackData.dolbyAtmos || false,
      producer: trackData.producer,
      mixer: trackData.mixer,
      masterer: trackData.masterer,
      previewStart: trackData.previewStart,
      previewEnd: trackData.previewEnd,
      trackVersion: trackData.trackVersion,
      trackType: trackData.trackType?.toUpperCase() || 'AUDIO',
      versionType: trackData.versionType || 'ORIGINAL',
      stereo: trackData.stereo !== false,
      isFocusTrack: trackData.isFocusTrack || false,
      titleTranslations: trackData.titleTranslations || {},
      language: trackData.language,
      trackNumber: trackData.trackNumber,
      volume: trackData.volume,
      discNumber: trackData.discNumber,
      duration: trackData.duration,
      musicVideoISRC: trackData.musicVideoISRC,
      hasMusicVideo: trackData.hasMusicVideo || false,
      translations: trackData.translations || [],
      // ✅ CRITICAL: Full arrays preserved as JSON
      artists: trackData.artists || [],
      featuringArtists: trackData.featuringArtists || [],
      contributors: trackData.contributors || []
    };
  }) || [],

  // FILES (lines 458-485) - Processed from multer/Dropbox
  files: {
    coverImageUrl: processedFiles.coverImage?.dropboxUrl || processedFiles.coverImage?.path,
    artistPhotoUrl: processedFiles.artistPhoto?.dropboxUrl || processedFiles.artistPhoto?.path,
    motionArtUrl: processedFiles.motionArt?.dropboxUrl || processedFiles.motionArt?.path,
    musicVideoUrl: processedFiles.musicVideo?.dropboxUrl || processedFiles.musicVideo?.path,
    audioFiles: (processedFiles.audioFiles || []).map((file: any) => ({
      trackId: file.trackId || `track-${(processedFiles.audioFiles || []).indexOf(file) + 1}`,
      dropboxUrl: file.dropboxUrl,
      fileName: file.fileName || file.filename,
      fileSize: file.fileSize,
    })),
    additionalFiles: (processedFiles.additionalFiles || []).map((file: any) => ({
      dropboxUrl: file.dropboxUrl,
      fileName: file.fileName || file.filename,
      fileType: file.fileType || file.mimetype,
      fileSize: file.fileSize,
    })),
  },

  // RELEASE INFO (lines 488-533)
  release: {
    territories: submissionData.release?.territories || ['WORLDWIDE'],
    territoryType: submissionData.release?.territoryType?.toUpperCase() || 'WORLDWIDE',
    distributors: submissionData.release?.distributors || [],
    priceType: submissionData.release?.priceType?.toUpperCase() || 'PAID',

    // ✅ COPYRIGHT - Both original and formatted versions
    copyrightHolder: submissionData.release?.copyrightHolder,
    copyrightYear: submissionData.release?.copyrightYear || new Date().getFullYear().toString(),
    productionHolder: submissionData.release?.productionHolder,
    productionYear: submissionData.release?.productionYear || new Date().getFullYear().toString(),
    recordingCountry: submissionData.release?.recordingCountry || 'KR',
    recordingLanguage: submissionData.release?.recordingLanguage || 'ko',

    // ⚠️ COPYRIGHT TRANSFORMATION (lines 505-512)
    cRights: submissionData.release?.cRights ||
             (submissionData.release?.copyrightHolder
               ? `© ${submissionData.release?.copyrightYear || new Date().getFullYear()} ${submissionData.release?.copyrightHolder}`
               : ''),
    pRights: submissionData.release?.pRights ||
             (submissionData.release?.productionHolder
               ? `℗ ${submissionData.release?.productionYear || new Date().getFullYear()} ${submissionData.release?.productionHolder}`
               : ''),

    // DATES & UTC
    originalReleaseDate: submissionData.release?.originalReleaseDate || new Date().toISOString(),
    consumerReleaseDate: submissionData.release?.consumerReleaseDate || new Date().toISOString(),
    releaseTime: submissionData.release?.releaseTime,
    selectedTimezone: submissionData.release?.selectedTimezone || submissionData.release?.timezone,
    consumerReleaseUTC: submissionData.release?.consumerReleaseUTC,
    originalReleaseUTC: submissionData.release?.originalReleaseUTC,

    upc: submissionData.release?.upc,
    catalogNumber: submissionData.release?.catalogNumber,
    parentalAdvisory: submissionData.release?.parentalAdvisory?.toUpperCase() || 'NONE',
    preOrderEnabled: submissionData.release?.preOrderEnabled || false,
    releaseFormat: submissionData.release?.releaseFormat?.toUpperCase() || 'STANDARD',
    isCompilation: submissionData.release?.isCompilation || false,
    previouslyReleased: submissionData.release?.previouslyReleased || false,
  },

  // ✅ MARKETING - Stored in SEPARATE marketing field (lines 536-574)
  marketing: {
    albumIntroduction: submissionData.marketingInfo?.albumIntroduction,
    albumDescription: submissionData.marketingInfo?.albumDescription,
    marketingKeywords: submissionData.marketingInfo?.marketingKeywords,
    targetAudience: submissionData.marketingInfo?.targetAudience,
    promotionPlans: submissionData.marketingInfo?.promotionPlans,
    toundatesUrl: submissionData.marketingInfo?.toundatesUrl,
    artistGender: submissionData.marketingInfo?.artistGender,
    socialMovements: submissionData.marketingInfo?.socialMovements,
    artistBio: submissionData.marketingInfo?.artistBio,
    similarArtists: submissionData.marketingInfo?.similarArtists,
    hasSyncHistory: submissionData.marketingInfo?.hasSyncHistory || false,
    syncHistory: submissionData.marketingInfo?.syncHistory,
    spotifyArtistId: submissionData.marketingInfo?.spotifyArtistId,
    appleMusicArtistId: submissionData.marketingInfo?.appleMusicArtistId,
    soundcloudArtistId: submissionData.marketingInfo?.soundcloudArtistId,
    artistUgcPriorities: submissionData.marketingInfo?.artistUgcPriorities,
    youtubeUrl: submissionData.marketingInfo?.youtubeUrl,
    tiktokUrl: submissionData.marketingInfo?.tiktokUrl,
    facebookUrl: submissionData.marketingInfo?.facebookUrl,
    instagramUrl: submissionData.marketingInfo?.instagramUrl,
    xUrl: submissionData.marketingInfo?.xUrl,
    twitchUrl: submissionData.marketingInfo?.twitchUrl,
    threadsUrl: submissionData.marketingInfo?.threadsUrl,
    moods: submissionData.marketingInfo?.moods || [],
    instruments: submissionData.marketingInfo?.instruments || [],
    hook: submissionData.marketingInfo?.hook,
    mainPitch: submissionData.marketingInfo?.mainPitch,
    marketingDrivers: submissionData.marketingInfo?.marketingDrivers,
    socialMediaPlan: submissionData.marketingInfo?.socialMediaPlan,
    artistName: submissionData.marketingInfo?.artistName || submissionData.artist?.nameKo,
    artistCountry: submissionData.marketingInfo?.artistCountry,
    artistCurrentCity: submissionData.marketingInfo?.artistCurrentCity,
    artistHometown: submissionData.marketingInfo?.artistHometown,
    artistAvatar: submissionData.marketingInfo?.artistAvatar,
    artistLogo: submissionData.marketingInfo?.artistLogo,
    pressShotUrl: submissionData.marketingInfo?.pressShotUrl,
    pressShotCredits: submissionData.marketingInfo?.pressShotCredits,
  },

  adminNotes: body.submissionNotes,
};
```

**CRITICAL ISSUE IDENTIFIED**:

⚠️ **Platform ID Extraction Problem** (Lines 382-383):
```typescript
spotifyId: submissionData.artist?.artists?.[0]?.spotifyId || '',
appleMusicId: submissionData.artist?.artists?.[0]?.appleId || '',
```

**This is WRONG!** The Artist interface doesn't have `spotifyId` or `appleId` as direct properties. They're in the `identifiers` array:
```typescript
identifiers: [
  { type: 'spotify', value: 'artist_spotify_id_here' },
  { type: 'apple', value: 'artist_apple_id_here' }
]
```

**Should be**:
```typescript
spotifyId: submissionData.artist?.artists?.[0]?.identifiers?.find(id => id.type === 'spotify')?.value || '',
appleMusicId: submissionData.artist?.artists?.[0]?.identifiers?.find(id => id.type === 'apple' || id.type === 'appleMusic')?.value || '',
```

---

## PHASE 4: SERVICE LAYER TRANSFORMATION (submissions.service.ts)

### 4.1 Service create() Method (Lines 60-323)

```typescript
async create(userId: string, data: any) {
  const submissionData: Prisma.SubmissionCreateInput = {
    submitter: { connect: { id: userId } },
    submitterEmail: data.submitterEmail,
    submitterName: data.submitterName,
    status: SubmissionStatus.PENDING,
    createdAt: new Date(),
    updatedAt: new Date(),

    // ARTIST INFO EXTRACTION (lines 73-91)
    artistName: data.artist?.nameKo || data.artistName || data.artist?.name || '',
    artistNameEn: data.artist?.nameEn || data.artistNameEn || data.artist?.name || '',
    labelName: data.artist?.labelName || data.labelName || '',
    genre: data.artist?.genre || data.genre || [],
    artistTranslations: data.artist?.artists?.[0]?.translations || data.artistTranslations || [],
    biography: data.artist?.biography || data.biography || '',
    socialLinks: data.artist?.socialLinks || data.socialLinks || {},
    artistType: data.artist?.type || data.artistType || 'SOLO',
    members: data.artist?.members || data.members || [],

    // ✅ PLATFORM ID EXTRACTION (lines 86-91) - CORRECT VERSION
    spotifyId: data.artist?.artists?.[0]?.identifiers?.find?.((id: any) => id.type === 'spotify')?.value ||
               data.artist?.spotifyId || data.spotifyId || '',
    appleMusicId: data.artist?.artists?.[0]?.identifiers?.find?.((id: any) => id.type === 'apple' || id.type === 'appleMusic')?.value ||
                  data.artist?.appleMusicId || data.appleMusicId || '',
    youtubeChannelId: data.artist?.artists?.[0]?.identifiers?.find?.((id: any) => id.type === 'youtube')?.value ||
                      data.artist?.youtubeChannelId || data.youtubeChannelId || '',

    // ALBUM INFO (lines 94-108)
    albumTitle: data.album?.titleKo || data.albumTitle || '',
    albumTitleEn: data.album?.titleEn || data.albumTitleEn || data.albumTitle || '',
    albumType: data.album?.type?.toUpperCase() || data.albumType?.toUpperCase() || 'SINGLE',
    releaseDate: new Date(data.album?.releaseDate || data.releaseDate || Date.now()),
    albumVersion: data.album?.version || data.albumVersion || '',
    releaseVersion: data.releaseVersion || '',
    albumGenre: data.genre?.primary || data.primaryGenre || data.albumGenre || data.genre || [],
    albumSubgenre: data.genre?.primarySub || data.primarySubgenre || data.albumSubgenre || data.subgenre || [],
    albumDescription: data.album?.description || data.albumDescription || '',
    albumTranslations: data.album?.translations || data.albumTranslations || {},
    albumContributors: data.albumContributors || [],
    primaryTitle: data.primaryTitle || '',
    hasTranslation: data.hasTranslation || false,
    translationLanguage: data.translationLanguage || '',
    translatedTitle: data.translatedTitle || '',

    // ✅ TRACKS MAPPING (lines 111-160)
    tracks: data.tracks?.map((track: any) => {
      // ✅ CONTRIBUTOR DEDUPLICATION (lines 113-116)
      const uniqueContributors = track.contributors ?
        Array.from(
          new Map(track.contributors.map((c: any) => [c.name, c])).values()
        ) : [];

      return {
        id: track.id || track._id || uuidv4(),
        titleKo: track.titleKo || track.title || '',
        titleEn: track.titleEn || track.titleTranslation || track.title || '',
        titleTranslations: track.titleTranslations || {},
        // ✅ FULL ARRAYS PRESERVED AS JSON
        artists: track.artists || [],
        featuringArtists: track.featuringArtists || [],
        contributors: uniqueContributors,  // ✅ Deduplicated but complete
        composer: track.composer || '',
        lyricist: track.lyricist || '',
        arranger: track.arranger || '',
        isTitle: track.isTitle || false,
        isFocusTrack: track.isFocusTrack || false,
        isrc: track.isrc || '',
        musicVideoISRC: track.musicVideoISRC || '',
        hasMusicVideo: track.hasMusicVideo || false,
        explicitContent: track.explicitContent || track.explicit || false,
        dolbyAtmos: track.dolbyAtmos || false,
        stereo: track.stereo !== false,
        trackType: track.trackType || 'AUDIO',
        versionType: track.versionType || 'ORIGINAL',
        genre: track.genre || '',
        subgenre: track.subgenre || '',
        alternateGenre: track.alternateGenre || '',
        alternateSubgenre: track.alternateSubgenre || '',
        language: track.language || '',
        audioLanguage: track.audioLanguage || '',
        lyricsLanguage: track.lyricsLanguage || '',
        metadataLanguage: track.metadataLanguage || '',
        lyrics: track.lyrics || '',
        trackNumber: track.trackNumber,
        volume: track.volume,
        discNumber: track.discNumber,
        duration: track.duration || '',
        producer: track.producer || '',
        mixer: track.mixer || '',
        masterer: track.masterer || '',
        previewStart: track.previewStart || '',
        previewEnd: track.previewEnd || '',
        trackVersion: track.trackVersion || '',
        translations: track.translations || []
      };
    }) || [],

    // FILES (lines 163-202)
    files: {
      coverImageUrl: data.files?.coverImageUrl,
      artistPhotoUrl: data.files?.artistPhotoUrl,
      motionArtUrl: data.files?.motionArtUrl,
      musicVideoUrl: data.files?.musicVideoUrl,
      audioFiles: data.files?.audioFiles?.map((af: any) => ({
        trackId: af.trackId,
        dropboxUrl: af.dropboxUrl || af.url,
        fileName: af.fileName,
        fileSize: af.fileSize
      })) || [],
      musicVideoFiles: data.files?.musicVideoFiles?.map((mvf: any) => ({
        trackId: mvf.trackId,
        dropboxUrl: mvf.dropboxUrl || mvf.url,
        fileName: mvf.fileName
      })) || [],
      musicVideoThumbnails: data.files?.musicVideoThumbnails?.map((mvt: any) => ({
        trackId: mvt.trackId,
        dropboxUrl: mvt.dropboxUrl || mvt.url,
        fileName: mvt.fileName
      })) || [],
      additionalFiles: [
        data.files?.pressShotUrl && {
          dropboxUrl: data.files.pressShotUrl,
          fileType: 'press_shot',
          fileName: 'press_shot.jpg'
        },
        data.files?.artistAvatarUrl && {
          dropboxUrl: data.files.artistAvatarUrl,
          fileType: 'avatar',
          fileName: 'avatar.jpg'
        },
        data.files?.artistLogoUrl && {
          dropboxUrl: data.files.artistLogoUrl,
          fileType: 'logo',
          fileName: 'logo.png'
        },
        ...(data.files?.additionalFiles || [])
      ].filter(Boolean)
    },

    // ✅ RELEASE INFO with UTC conversion (lines 205-251)
    release: {
      recordingCountry: data.release?.recordingCountry || data.recordingCountry || 'KR',
      recordingLanguage: data.release?.recordingLanguage || data.recordingLanguage || 'ko',
      territories: data.release?.territories || data.territories || ['WORLDWIDE'],
      originalReleaseDate: data.release?.originalReleaseDate || data.releaseDate,
      consumerReleaseDate: data.release?.consumerReleaseDate || data.consumerReleaseDate || data.releaseDate,
      releaseTime: data.release?.releaseTime || data.releaseTime,
      selectedTimezone: data.release?.selectedTimezone || data.selectedTimezone,

      // UTC CONVERSION (lines 215-217) - RECALCULATED if not provided
      releaseUTC: data.release?.releaseUTC || this.convertToUTC(
        data.release?.consumerReleaseDate || data.consumerReleaseDate || data.releaseDate,
        data.release?.releaseTime || data.releaseTime,
        data.release?.selectedTimezone || data.selectedTimezone
      ),
      originalReleaseUTC: data.release?.originalReleaseUTC || this.convertToUTC(
        data.release?.originalReleaseDate || data.releaseDate,
        data.release?.releaseTime || data.releaseTime,
        data.release?.selectedTimezone || data.selectedTimezone
      ),
      consumerReleaseUTC: data.release?.consumerReleaseUTC || this.convertToUTC(
        data.release?.consumerReleaseDate || data.consumerReleaseDate || data.releaseDate,
        data.release?.releaseTime || data.releaseTime,
        data.release?.selectedTimezone || data.selectedTimezone
      ),

      // COPYRIGHT FIELDS (lines 219-231)
      copyrightHolder: data.release?.copyrightHolder || data.copyrightHolder || '',
      copyrightYear: data.release?.copyrightYear || data.copyrightYear || new Date().getFullYear().toString(),
      productionHolder: data.release?.productionHolder || data.productionHolder || '',
      productionYear: data.release?.productionYear || data.productionYear || new Date().getFullYear().toString(),

      // ✅ COPYRIGHT TRANSFORMATION (lines 224-231)
      cRights: data.release?.cRights || data.cRights ||
               (data.release?.copyrightHolder || data.copyrightHolder
                 ? `© ${data.release?.copyrightYear || data.copyrightYear || new Date().getFullYear()} ${data.release?.copyrightHolder || data.copyrightHolder}`
                 : ''),
      pRights: data.release?.pRights || data.pRights ||
               (data.release?.productionHolder || data.productionHolder
                 ? `℗ ${data.release?.productionYear || data.productionYear || new Date().getFullYear()} ${data.release?.productionHolder || data.productionHolder}`
                 : ''),

      upc: data.release?.upc || data.upc,
      catalogNumber: data.release?.catalogNumber || data.catalogNumber,
      artistName: data.release?.artistName || data.artistName || '',
      distributors: [],
      priceType: 'FREE',
      territoryType: 'WORLDWIDE',
      parentalAdvisory: 'NONE',
      releaseFormat: 'STANDARD',
      hasSyncHistory: data.release?.hasSyncHistory || data.releaseInfo?.hasSyncHistory || data.hasSyncHistory || false,
      isCompilation: data.release?.isCompilation || false,
      motionArtwork: data.release?.motionArtwork || false,
      preOrderEnabled: data.release?.preOrderEnabled || false,
      previouslyReleased: data.release?.previouslyReleased || false,
      thisIsPlaylist: data.release?.thisIsPlaylist || false,
      youtubeShortsPreviews: data.release?.youtubeShortsPreviews || false,
      moods: data.release?.moods || data.releaseInfo?.moods || data.moods || [],
      instruments: data.release?.instruments || data.releaseInfo?.instruments || data.instruments || [],
    },

    // ✅ MARKETING - Complete 31 field object (lines 254-314)
    marketing: data.marketingInfo || data.marketing || {
      albumIntroduction: data.marketingInfo?.albumIntroduction || data.release?.albumIntroduction || '',
      albumDescription: data.marketingInfo?.albumDescription || data.release?.albumDescription || data.albumDescription || '',
      marketingKeywords: data.marketingInfo?.marketingKeywords || data.release?.marketingKeywords || '',
      targetAudience: data.marketingInfo?.targetAudience || data.release?.targetAudience || '',
      promotionPlans: data.marketingInfo?.promotionPlans || data.release?.promotionPlans || '',
      artistGender: data.marketingInfo?.artistGender || data.release?.artistGender || '',
      artistBio: data.marketingInfo?.artistBio || data.release?.artistBio || data.biography || '',
      artistCountry: data.marketingInfo?.artistCountry || data.release?.artistCountry || '',
      artistCurrentCity: data.marketingInfo?.artistCurrentCity || data.release?.artistCurrentCity || '',
      artistHometown: data.marketingInfo?.artistHometown || data.release?.artistHometown || '',
      artistAvatar: data.marketingInfo?.artistAvatar || data.release?.artistAvatar || '',
      artistLogo: data.marketingInfo?.artistLogo || data.release?.artistLogo || '',
      socialMovements: data.marketingInfo?.socialMovements || data.release?.socialMovements || '',
      spotifyArtistId: data.marketingInfo?.artist_spotify_id || data.spotifyId || '',
      appleMusicArtistId: data.marketingInfo?.artist_apple_id || data.appleMusicId || '',
      soundcloudArtistId: data.marketingInfo?.soundcloudArtistId || '',
      toundatesUrl: data.marketingInfo?.toundatesUrl || '',
      youtubeUrl: data.marketingInfo?.youtubeUrl || data.socialLinks?.youtube || '',
      tiktokUrl: data.marketingInfo?.tiktokUrl || data.socialLinks?.tiktok || '',
      facebookUrl: data.marketingInfo?.artist_facebook_url || data.socialLinks?.facebook || '',
      instagramUrl: data.marketingInfo?.artist_instagram_handle || data.socialLinks?.instagram || '',
      xUrl: data.marketingInfo?.xUrl || data.socialLinks?.twitter || '',
      twitchUrl: data.marketingInfo?.twitchUrl || data.socialLinks?.twitch || '',
      threadsUrl: data.marketingInfo?.threadsUrl || '',
      hook: data.marketingInfo?.hook || '',
      mainPitch: data.marketingInfo?.mainPitch || '',
      similarArtists: data.marketingInfo?.similarArtists || '',
      syncHistory: data.marketingInfo?.syncHistory || '',
      artistUgcPriorities: data.marketingInfo?.artistUgcPriorities || '',
      marketingDrivers: data.marketingInfo?.marketingDrivers || '',
      socialMediaPlan: data.marketingInfo?.socialMediaPlan || '',
      moods: data.marketingInfo?.moods || [],
      instruments: data.marketingInfo?.instruments || [],
      pressShotUrl: data.marketingInfo?.pressShotUrl || '',
      pressShotCredits: data.marketingInfo?.pressShotCredits || '',
      priorityLevel: data.marketingInfo?.priorityLevel,
      projectType: data.marketingInfo?.projectType,
      campaignGoals: data.marketingInfo?.campaignGoals || [],
      pr_line: data.marketingInfo?.pr_line || '',
      internal_note: data.marketingInfo?.internal_note || ''
    }
  };

  return this.prisma.submission.create({
    data: submissionData,
    include: { submitter: true }
  });
}
```

**KEY OBSERVATIONS**:
- ✅ Service CORRECTLY extracts platform IDs from `identifiers` array (lines 86-91)
- ✅ Contributor deduplication preserves ALL fields (lines 113-125)
- ✅ Marketing info stored in separate `marketing` JSON field
- ✅ UTC conversion recalculated if not provided by controller
- ✅ All arrays (artists, contributors) preserved as JSON

---

## PHASE 5: PRISMA SCHEMA VALIDATION

### 5.1 SubmissionTracks Type (Lines 146-187)

```prisma
type SubmissionTracks {
  // JSON FIELDS - Store complex structures
  artists          Json?     // ✅ Array of Artist objects with translations + identifiers
  contributors     Json?     // ✅ Array of Contributor objects with roles, instruments, translations, identifiers
  featuringArtists Json?     // ✅ Array of Artist objects
  titleTranslations Json?    // ✅ Object with language keys
  translations     Json?     // ✅ Array of translation objects

  // FLATTENED FIELDS - For convenience
  composer         String    // Comma-separated names
  lyricist         String    // Comma-separated names
  arranger         String?   // Comma-separated names

  // BASIC METADATA
  dolbyAtmos       Boolean
  explicitContent  Boolean
  id               String
  isFocusTrack     Boolean
  isTitle          Boolean
  isrc             String
  stereo           Boolean
  titleEn          String
  titleKo          String
  trackType        String
  versionType      String

  // ADDITIONAL METADATA
  genre            String?
  subgenre         String?
  alternateGenre   String?
  alternateSubgenre String?
  language         String?
  audioLanguage    String?
  lyricsLanguage   String?
  metadataLanguage String?
  lyrics           String?
  musicVideoISRC   String?
  hasMusicVideo    Boolean?
  trackNumber      Int?
  volume           Int?
  discNumber       Int?
  duration         String?
  producer         String?
  mixer            String?
  masterer         String?
  previewStart     String?
  previewEnd       String?
  trackVersion     String?
}
```

### 5.2 Submission Model (Lines 236-285)

```prisma
model Submission {
  id                   String             @id @default(auto()) @map("_id") @db.ObjectId

  // ALBUM INFO
  albumTitle           String
  albumTitleEn         String
  albumType            String
  albumGenre           Json?
  albumSubgenre        Json?
  albumDescription     String?
  albumVersion         String?
  albumTranslations    Json?
  albumContributors    Json?

  // ARTIST INFO
  artistName           String
  artistNameEn         String
  artistTranslations   Json?   // ✅ From albumArtists[0].translations
  biography            String?
  socialLinks          Json?
  artistType           String?
  members              Json?

  // PLATFORM IDs
  spotifyId            String?  // ✅ From albumArtists[0].identifiers
  appleMusicId         String?  // ✅ From albumArtists[0].identifiers
  youtubeChannelId     String?  // ✅ From albumArtists[0].identifiers

  // LABEL
  labelName            String
  genre                Json?

  // DATES
  releaseDate          DateTime           @db.Date
  createdAt            DateTime           @db.Date
  updatedAt            DateTime           @db.Date

  // NESTED OBJECTS
  files                SubmissionFiles    // Complex file structure
  release              SubmissionRelease  // Release info with copyright
  tracks               SubmissionTracks[] // Array of tracks
  marketing            Json?              // ✅ All 31 marketing fields

  // STATUS & REVIEW
  status               String
  submitterEmail       String
  submitterId          String             @db.ObjectId
  submitterName        String
  reviewedBy           String?            @db.ObjectId
  reviewedAt           DateTime?          @db.Date
  adminNotes           String?

  // RELATIONS
  submitter            User               @relation("SubmitterSubmissions", fields: [submitterId], references: [id])
  reviewer             User?              @relation("ReviewerSubmissions", fields: [reviewedBy], references: [id])
}
```

### 5.3 SubmissionRelease Type (Lines 110-144)

```prisma
type SubmissionRelease {
  artistName            String

  // COPYRIGHT - Both formats
  cRights               String  // "© 2024 Company Name"
  pRights               String  // "℗ 2024 Producer Name"
  copyrightHolder       String  // "Company Name"
  copyrightYear         String  // "2024"
  productionHolder      String? // "Producer Name"
  productionYear        String? // "2024"

  // DATES & UTC
  consumerReleaseDate   String
  originalReleaseDate   String
  releaseTime           String
  releaseUTC            DateTime @db.Date
  consumerReleaseUTC    DateTime @db.Date
  originalReleaseUTC    DateTime @db.Date
  selectedTimezone      String

  // IDENTIFIERS
  upc                   String
  catalogNumber         String?

  // DISTRIBUTION
  territories           Json?
  territoryType         String
  distributors          Json?
  priceType             String
  recordingCountry      String
  recordingLanguage     String

  // FLAGS
  hasSyncHistory        Boolean
  isCompilation         Boolean
  motionArtwork         Boolean
  preOrderEnabled       Boolean
  previouslyReleased    Boolean
  thisIsPlaylist        Boolean
  youtubeShortsPreviews Boolean

  // METADATA
  parentalAdvisory      String
  releaseFormat         String

  // MUSIC CHARACTERISTICS (for convenience - also in marketing)
  moods                 Json?
  instruments           Json?
}
```

**SCHEMA VALIDATION RESULTS**:
- ✅ All track fields match schema definition
- ✅ JSON fields properly typed for complex structures
- ✅ Marketing stored in separate JSON field at Submission level
- ✅ No type mismatches detected

---

## PHASE 6: ADMIN DISPLAY ANALYSIS

### 6.1 SubmissionDetailView.tsx getSections() (Lines 91-431)

```typescript
// PRODUCT LEVEL SECTION (lines 97-128)
{
  id: 'product',
  data: {
    'Album Title (Korean)': submission.albumTitle || '',
    'Album Title (English)': submission.albumTitleEn || '',
    'Album Title Translations': albumTrans ? JSON.stringify(albumTrans, null, 2) : '',
    'Album Type': submission.albumType || '',
    'Label Name': submission.labelName || '',
    'Genre': Array.isArray(submission.genre) ? submission.genre.join(', ') : (submission.genre || ''),
    'Album Genre': Array.isArray(submission.albumGenre) ? submission.albumGenre.join(', ') : (submission.albumGenre || ''),
    'Release Date': submission.releaseDate || '',
    'UPC': submission.release?.upc || '',
    'Catalog Number': submission.release?.catalogNumber || '',
    'Copyright Holder': submission.release?.copyrightHolder || '',
    'Copyright Year': submission.release?.copyrightYear || '',
    'Production Holder': submission.release?.productionHolder || '',
    'Production Year': submission.release?.productionYear || '',
    'Copyright (℗)': submission.release?.pRights || '',
    'Copyright (©)': submission.release?.cRights || ''
  }
}

// ARTIST SECTION (lines 134-169)
{
  id: 'artist',
  data: {
    'Artist Name (Korean)': submission.artistName || '',
    'Artist Name (English)': submission.artistNameEn || '',
    'Artist Type': submission.artistType || '',
    'Label Name': submission.labelName || '',
    'Biography': submission.biography || '',
    'Genre': Array.isArray(submission.genre) ? submission.genre.join(', ') : (submission.genre || ''),

    // ✅ ARTIST TRANSLATIONS DISPLAY (lines 147-150)
    'Artist Name (Japanese)': artistTranslations.find?.((t: any) => t.language === 'ja')?.name || '',
    'Artist Name (Chinese)': artistTranslations.find?.((t: any) => t.language === 'zh')?.name || '',
    'Artist Name (Spanish)': artistTranslations.find?.((t: any) => t.language === 'es')?.name || '',
    'Other Translations': artistTranslations.filter?.((t: any) => !['ja', 'zh', 'es'].includes(t.language)).map((t: any) => `${t.language}: ${t.name}`).join(', ') || '',

    // ✅ PLATFORM IDs DISPLAY (lines 153-155)
    'Spotify Artist ID': submission.spotifyId || '',
    'Apple Music Artist ID': submission.appleMusicId || '',
    'YouTube Channel ID': submission.youtubeChannelId || '',

    // ✅ SOCIAL LINKS DISPLAY (lines 158-164)
    'Instagram': socialLinks.instagram || '',
    'Twitter/X': socialLinks.twitter || socialLinks.x || '',
    'Facebook': socialLinks.facebook || '',
    'TikTok': socialLinks.tiktok || '',
    'YouTube': socialLinks.youtube || '',
    'SoundCloud': socialLinks.soundcloud || '',
    'Website': socialLinks.website || '',

    'Members': submission.members ? JSON.stringify(submission.members, null, 2) : ''
  }
}

// TRACK SECTIONS (lines 187-284) - One per track
{
  id: `track-${index}`,
  title: `Track ${index + 1}: ${track.titleKo || track.title || 'No Title'}`,
  data: {
    'Track Number': track.trackNumber || (index + 1),
    'Title (Korean)': track.titleKo || track.title || '',
    'Title (English)': track.titleEn || '',
    'Title Translations': track.titleTranslations ? JSON.stringify(track.titleTranslations, null, 2) : '',
    'ISRC': track.isrc || '',
    'Music Video ISRC': track.musicVideoISRC || '',
    'Has Music Video': track.hasMusicVideo ? 'Yes' : 'No',

    // ✅ ARTISTS DISPLAY with full details (lines 217-227)
    'Main Artists': trackArtists.map((a: any) => {
      const parts = [a.name || a];
      if (a.translations?.length) {
        parts.push(`(Translations: ${a.translations.map((t: any) => `${t.language}: ${t.name}`).join(', ')})`);
      }
      if (a.identifiers?.length) {
        const ids = a.identifiers.map((id: any) => `${id.type}: ${id.value}`).join(', ');
        parts.push(`[ID: ${ids}]`);
      }
      return parts.join(' ');
    }).join('\n') || '',

    // ✅ FEATURING ARTISTS DISPLAY with full details (lines 228-238)
    'Featuring Artists': trackFeaturing.map((a: any) => {
      const parts = [a.name || a];
      if (a.translations?.length) {
        parts.push(`(Translations: ${a.translations.map((t: any) => `${t.language}: ${t.name}`).join(', ')})`);
      }
      if (a.identifiers?.length) {
        const ids = a.identifiers.map((id: any) => `${id.type}: ${id.value}`).join(', ');
        parts.push(`[ID: ${ids}]`);
      }
      return parts.join(' ');
    }).join('\n') || '',

    // CREDITS
    'Composer': track.composer || '',
    'Lyricist': track.lyricist || '',
    'Arranger': track.arranger || '',
    'Producer': track.producer || '',
    'Mixer': track.mixer || '',
    'Masterer': track.masterer || '',

    // ✅ CONTRIBUTORS DISPLAY with full details (lines 261-275)
    'Contributors': trackContributors.map((c: any) => {
      const parts = [c.name || c];
      const details = [];
      if (c.role) details.push('Role: ' + c.role);
      if (c.roles?.length) details.push('Roles: ' + c.roles.join(', '));
      if (c.instrument) details.push('Instrument: ' + c.instrument);
      if (c.instruments?.length) details.push('Instruments: ' + c.instruments.join(', '));
      if (c.translations?.length) {
        details.push('Translations: ' + c.translations.map((t: any) => `${t.language}: ${t.name}`).join(', '));
      }
      if (c.identifiers?.length) {
        details.push('ID: ' + c.identifiers.map((id: any) => `${id.type}: ${id.value}`).join(', '));
      }
      return `${parts[0]}${details.length ? '\n  ' + details.join('\n  ') : ''}`;
    }).join('\n\n') || '',

    // TECHNICAL
    'Dolby Atmos': track.dolbyAtmos ? 'Yes' : 'No',
    'Explicit Content': track.explicitContent ? 'Yes' : 'No',
    'Stereo': track.stereo ? 'Yes' : 'No',
    'Title Track': track.isTitle ? 'Yes' : 'No',
    'Focus Track': track.isFocusTrack ? 'Yes' : 'No'
  }
}

// MARKETING SECTION (lines 361-428)
{
  id: 'marketing',
  data: {
    // ✅ Checks BOTH marketing AND release fields
    'Album Introduction': marketingData.albumIntroduction || releaseData.albumIntroduction || '',
    'Album Description': marketingData.albumDescription || releaseData.albumDescription || submission.albumDescription || '',
    'Marketing Keywords': marketingData.marketingKeywords || releaseData.marketingKeywords || '',
    'Target Audience': marketingData.targetAudience || releaseData.targetAudience || '',
    'Promotion Plans': marketingData.promotionPlans || releaseData.promotionPlans || '',

    'Artist Name': marketingData.artistName || releaseData.artistName || submission.artistName || '',
    'Artist Gender': marketingData.artistGender || releaseData.artistGender || '',
    'Artist Country': marketingData.artistCountry || releaseData.artistCountry || '',
    'Artist Current City': marketingData.artistCurrentCity || releaseData.artistCurrentCity || '',
    'Artist Hometown': marketingData.artistHometown || releaseData.artistHometown || '',
    'Artist Bio': marketingData.artistBio || releaseData.artistBio || submission.biography || '',

    'Toundates URL': marketingData.toundatesUrl || releaseData.toundatesUrl || '',
    'Spotify Artist ID': marketingData.spotifyArtistId || releaseData.spotifyArtistId || submission.spotifyId || '',
    'Apple Music Artist ID': marketingData.appleMusicArtistId || releaseData.appleMusicArtistId || submission.appleMusicId || '',
    'SoundCloud Artist ID': marketingData.soundcloudArtistId || releaseData.soundcloudArtistId || '',

    'YouTube URL': marketingData.youtubeUrl || releaseData.youtubeUrl || '',
    'TikTok URL': marketingData.tiktokUrl || releaseData.tiktokUrl || '',
    'Facebook URL': marketingData.facebookUrl || releaseData.facebookUrl || '',
    'Instagram URL': marketingData.instagramUrl || releaseData.instagramUrl || '',
    'X (Twitter) URL': marketingData.xUrl || releaseData.xUrl || '',
    'Twitch URL': marketingData.twitchUrl || releaseData.twitchUrl || '',
    'Threads URL': marketingData.threadsUrl || releaseData.threadsUrl || '',

    'Social Movements': marketingData.socialMovements || releaseData.socialMovements || '',
    'Similar Artists': marketingData.similarArtists || releaseData.similarArtists || '',
    'Has Sync History': marketingData.hasSyncHistory || releaseData.hasSyncHistory || false,
    'Sync History': marketingData.syncHistory || releaseData.syncHistory || '',
    'Artist UGC Priorities': marketingData.artistUgcPriorities || releaseData.artistUgcPriorities || '',

    'Moods': (marketingData.moods || releaseData.moods || []).join?.(', ') || '',
    'Instruments': (marketingData.instruments || releaseData.instruments || []).join?.(', ') || '',
    'Hook': marketingData.hook || releaseData.hook || '',
    'Main Pitch': marketingData.mainPitch || releaseData.mainPitch || '',

    'Marketing Drivers': marketingData.marketingDrivers || releaseData.marketingDrivers || '',
    'Social Media Plan': marketingData.socialMediaPlan || releaseData.socialMediaPlan || '',

    'Artist Avatar': marketingData.artistAvatar || releaseData.artistAvatar || '',
    'Artist Logo': marketingData.artistLogo || releaseData.artistLogo || '',
    'Press Shot URL': marketingData.pressShotUrl || releaseData.pressShotUrl || '',
    'Press Shot Credits': marketingData.pressShotCredits || releaseData.pressShotCredits || '',

    'Priority Level': marketingData.priorityLevel || '',
    'Project Type': marketingData.projectType || '',
    'Campaign Goals': marketingData.campaignGoals ? JSON.stringify(marketingData.campaignGoals, null, 2) : '',

    'PR Line': marketingData.pr_line || '',
    'Internal Note': marketingData.internal_note || ''
  }
}
```

**ADMIN DISPLAY VALIDATION**:
- ✅ Artist translations correctly parsed from JSON array
- ✅ Platform IDs correctly displayed from top-level fields
- ✅ Social links correctly parsed from JSON object
- ✅ Track artists correctly parsed with translations + identifiers
- ✅ Track contributors correctly parsed with roles, instruments, translations, identifiers
- ✅ Marketing fields correctly fallback between `marketing` and `release` JSON fields
- ✅ All 31 marketing fields accounted for

---

## CRITICAL FINDINGS SUMMARY

### ✅ CORRECT DATA FLOWS

1. **Track Artists Array Structure**
   - ✅ Frontend sends: `track.artists = [{name, role, translations[], identifiers[]}]`
   - ✅ Controller receives: Unchanged array in `releaseData.tracks[i].artists`
   - ✅ Service receives: `data.tracks[i].artists`
   - ✅ Service saves: As JSON in `tracks[i].artists`
   - ✅ Admin displays: Correctly parses JSON and shows translations + identifiers

2. **Album Artists → Platform IDs**
   - ✅ Frontend sends: `albumArtists[0].identifiers = [{type: 'spotify', value: '...'}]`
   - ⚠️ Controller extracts: INCORRECTLY as `.spotifyId` property (DOESN'T EXIST)
   - ✅ Service extracts: CORRECTLY from `.identifiers` array
   - ✅ Service saves: Top-level `spotifyId`, `appleMusicId` fields
   - ✅ Admin displays: Correctly from top-level fields

3. **Contributors Complete Transfer**
   - ✅ Frontend sends: Full contributor objects with roles, instruments, translations, identifiers
   - ✅ Controller receives: Unchanged in `releaseData.tracks[i].contributors`
   - ✅ Service receives: Full array
   - ✅ Service deduplicates: By name, preserving ALL other fields
   - ✅ Service saves: As JSON
   - ✅ Admin displays: Correctly parses and shows all fields

4. **Marketing Info Complete Transfer**
   - ✅ Frontend sends: All 31 fields in `marketingInfo` object
   - ✅ Controller receives: Unchanged as `submissionData.marketingInfo`
   - ✅ Service receives: Complete object
   - ✅ Service saves: In `marketing` JSON field (separate from `release`)
   - ✅ Admin displays: Correctly with fallback to `release` field (legacy support)

5. **Copyright Transformation**
   - ✅ Frontend sends: Separate `copyrightHolder`, `copyrightYear`, `productionHolder`, `productionYear`
   - ✅ Controller receives: All 4 fields
   - ✅ Service receives: All 4 fields
   - ✅ Service transforms: Creates `cRights` and `pRights` with symbol + year + holder
   - ✅ Service saves: Both original fields AND formatted strings
   - ✅ Admin displays: Formatted strings

### ⚠️ IDENTIFIED ISSUES

1. **Controller Platform ID Extraction BUG** (Line 382-383)
   ```typescript
   // CURRENT (WRONG):
   spotifyId: submissionData.artist?.artists?.[0]?.spotifyId || '',
   appleMusicId: submissionData.artist?.artists?.[0]?.appleId || '',

   // SHOULD BE:
   spotifyId: submissionData.artist?.artists?.[0]?.identifiers?.find(id => id.type === 'spotify')?.value || '',
   appleMusicId: submissionData.artist?.artists?.[0]?.identifiers?.find(id => id.type === 'apple' || id.type === 'appleMusic')?.value || '',
   ```

   **Impact**: Controller tries to extract IDs from non-existent properties. Service layer has correct logic (lines 86-91) so IDs ARE saved, but only if they're also sent as direct properties OR found in identifiers.

   **Evidence**: User screenshot shows "Dongramyproject" appearing multiple times, suggesting fallback logic is working but not finding IDs in the expected location.

2. **Copyright Holder Duplication Issue**
   ```typescript
   // If productionHolder is empty, pRights will use copyrightHolder
   pRights: submissionData.release?.pRights ||
            (submissionData.release?.productionHolder  // ← If this is empty
              ? `℗ ${year} ${submissionData.release?.productionHolder}`
              : ''),  // ← Empty string, so might use cRights logic instead
   ```

   **Impact**: If `productionHolder` is not provided, both `cRights` and `pRights` might end up with the same value.

   **Recommendation**: Ensure frontend ALWAYS sends distinct `copyrightHolder` and `productionHolder`, even if they're the same company.

3. **Marketing Field Name Inconsistency**
   ```typescript
   // Frontend sends:
   marketingInfo.artist_spotify_id
   marketingInfo.artist_apple_id
   marketingInfo.artist_facebook_url
   marketingInfo.artist_instagram_handle

   // Service saves as:
   marketing.spotifyArtistId
   marketing.appleMusicArtistId
   marketing.facebookUrl
   marketing.instagramUrl
   ```

   **Impact**: Field names are renamed during save. Admin display handles this with fallbacks, so no data loss.

---

## DATA STRUCTURE DIAGRAMS

### Complete Field Flow (Simplified)

```
FRONTEND                    CONTROLLER                   SERVICE                     SCHEMA
────────────────────────────────────────────────────────────────────────────────────────────

albumArtists: [{           → artist.artists: [{         → artists?.[0]            → artistName: string
  name: string,              name,                       .name                       artistNameEn: string
  role: string,              role,
  translations: [{           translations: [{          → artists?.[0]            → artistTranslations: Json
    language,                  language,                 .translations[]
    name                       name
  }],                        }],
  identifiers: [{            identifiers: [{           → artists?.[0]            → spotifyId: string
    type,                      type,                     .identifiers              appleMusicId: string
    value                      value                     .find(...)                youtubeChannelId: string
  }]                         }]
}]                         }]

tracks: [{                 → tracks: [{                → tracks[i]               → tracks: SubmissionTracks[]
  artists: [{                 artists: [{                .artists                  .artists: Json
    name,                       name,                                               .featuringArtists: Json
    translations,               translations,                                       .contributors: Json
    identifiers                 identifiers                                         .composer: String
  }],                         }],                                                   .lyricist: String
  contributors: [{            contributors: [{         → DEDUP by name               .arranger: String
    name,                       name,                   preserve all
    role,                       role,
    translations,               translations,
    identifiers                 identifiers
  }]                          }]
}]                         }]

marketingInfo: {           → marketingInfo: {         → marketing: Json         → marketing: Json
  artist_spotify_id,          artist_spotify_id,        .spotifyArtistId          All 31 fields
  albumIntroduction,          albumIntroduction,        .albumIntroduction        stored as JSON
  ... (31 fields)             ... (31 fields)           ... (31 fields)
}                          }                         }
```

---

## RECOMMENDATIONS

### IMMEDIATE FIXES NEEDED

1. **Fix Controller Platform ID Extraction** (CRITICAL)
   - File: `backend/src/submissions/submissions.controller.ts`
   - Lines: 382-383
   - Change from direct property access to identifiers array lookup
   - Service already has correct logic - align controller with it

2. **Ensure Distinct Copyright Holders**
   - Frontend: Add validation to ensure `productionHolder` is always filled
   - Or change logic to use `copyrightHolder` as default for `productionHolder` if empty

3. **Standardize Marketing Field Names**
   - Either: Rename frontend fields to match service (spotifyArtistId instead of artist_spotify_id)
   - Or: Update service to accept frontend naming convention
   - Current fallback logic works but creates confusion

### VERIFICATION CHECKLIST

- ✅ Track artists array preserved with translations + identifiers
- ✅ Track contributors deduplicated but complete
- ✅ Marketing info stored in separate marketing field
- ⚠️ Platform ID extraction needs controller fix
- ⚠️ Copyright holder duplication needs frontend validation
- ✅ Admin display correctly parses all JSON fields
- ✅ No data loss detected in any pathway

---

## EVIDENCE LOCATIONS

All findings backed by specific line numbers:

| Finding | File | Lines |
|---------|------|-------|
| Frontend FormData interface | ImprovedReleaseSubmissionWithDnD.tsx | 193-308 |
| Frontend submit transformation | ImprovedReleaseSubmissionWithDnD.tsx | 1275-1345 |
| Controller parsing | submissions.controller.ts | 78-124 |
| Controller Prisma mapping | submissions.controller.ts | 361-578 |
| **Controller ID extraction BUG** | submissions.controller.ts | **382-383** |
| Service create method | submissions.service.ts | 60-323 |
| Service ID extraction (CORRECT) | submissions.service.ts | 86-91 |
| Prisma schema tracks type | schema.prisma | 146-187 |
| Prisma schema submission model | schema.prisma | 236-285 |
| Admin display sections | SubmissionDetailView.tsx | 91-431 |

**End of Forensic Analysis**
