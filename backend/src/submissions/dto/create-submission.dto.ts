export class CreateSubmissionDto {
  // Artist info
  artistName: string;
  artistNameEn?: string;
  artistTranslations?: Array<{
    language: string;
    title: string;
  }>;
  labelName?: string;
  genre: string[];
  biography?: string;
  socialLinks?: {
    instagram?: string;
    youtube?: string;
    spotify?: string;
    appleMusic?: string;
    twitter?: string;
    facebook?: string;
    tiktok?: string;
    website?: string;
  };
  artistType?: string;
  members?: Array<{
    name: string;
    role: string;
    spotifyUrl?: string;
    appleMusicUrl?: string;
  }>;
  spotifyId?: string;
  appleMusicId?: string;
  youtubeChannelId?: string;

  // Album info
  albumTitle: string;
  albumTitleEn?: string;
  albumTranslations?: Array<{
    language: string;
    title: string;
  }>;
  albumType: string;
  releaseDate: Date;
  albumDescription?: string;
  albumVersion?: string;
  releaseVersion?: string;
  albumGenre: string[];
  albumSubgenre?: string[];
  primaryTitle?: string;
  hasTranslation?: boolean;
  translationLanguage?: string;
  translatedTitle?: string;
  albumContributors?: Array<{
    id: string;
    name: string;
    translations: Array<{
      language: string;
      name: string;
    }>;
    roles: string[];
    instruments: string[];
    spotifyUrl?: string;
    appleMusicUrl?: string;
  }>;

  // Tracks
  tracks: Array<{
    id: string;
    titleKo: string;
    titleEn: string;
    artists?: string[];
    featuringArtists?: string[];
    contributors?: Array<{
      name: string;
      translations: Array<{
        language: string;
        name: string;
      }>;
      roles: string[];
      instruments: string[];
      spotifyUrl?: string;
      appleMusicUrl?: string;
    }>;
    composer: string;
    lyricist: string;
    arranger?: string;
    featuring?: string;
    isTitle: boolean;
    isrc?: string;
    explicitContent: boolean;
    trackVersion?: string;
    lyricsLanguage?: string;
    dolbyAtmos: boolean;
    stereo: boolean;
    hasCustomReleaseDate?: boolean;
    consumerReleaseDate?: Date;
    releaseTime?: string;
    genre?: string;
    subgenre?: string;
    alternateGenre?: string;
    alternateSubgenre?: string;
    lyrics?: string;
    audioLanguage?: string;
    metadataLanguage?: string;
    playtimeStartShortClip?: number;
    previewLength?: number;
    translations?: Array<{
      id: string;
      language: string;
      title: string;
    }>;
  }>;

  // Files
  files: {
    coverImage?: string;
    artistPhoto?: string;
    audioFiles?: Array<{
      trackId: string;
      filename?: string;
      fileSize?: number;
      duration?: number;
      dropboxUrl?: string;
    }>;
    additionalFiles?: Array<{
      filename?: string;
      fileType?: string;
      fileSize?: number;
      dropboxUrl?: string;
    }>;
    motionArt?: string;
    musicVideo?: string;
    coverImageUrl?: string;
    artistPhotoUrl?: string;
    motionArtUrl?: string;
    musicVideoUrl?: string;
  };

  // Release info
  release: {
    distributors: string[];
    priceType: string;
    price?: number;
    copyrightHolder?: string;
    copyrightYear: string;
    recordingCountry: string;
    recordingLanguage: string;
    upc?: string;
    catalogNumber?: string;
    territories: string[];
    notes?: string;
    originalReleaseDate: string;
    consumerReleaseDate: string;
    releaseTime?: string;
    selectedTimezone?: string;
    consumerReleaseTime?: string;
    originalReleaseTime?: string;
    timezone?: string;
    isRerelease?: boolean;
    cRights: string;
    pRights: string;
    previewStart?: number;
    territoryType?: string;
    albumNotes?: string;
    parentalAdvisory?: string;
    preOrderEnabled?: boolean;
    preOrderDate?: string;
    releaseFormat?: string;
    isCompilation?: boolean;
    previouslyReleased?: boolean;
    previousReleaseDate?: string;
    previousReleaseInfo?: string;
  };

  // Marketing info
  marketing?: {
    genre: string;
    subgenre?: string;
    tags?: string[];
    similarArtists?: string[];
    marketingAngle?: string;
    pressRelease?: string;
    marketingBudget?: string;
    socialMediaCampaign?: string;
    spotifyPitching?: string;
    appleMusicPitching?: string;
    tiktokStrategy?: string;
    youtubeStrategy?: string;
    instagramStrategy?: string;
    facebookStrategy?: string;
    twitterStrategy?: string;
    influencerOutreach?: string;
    playlistTargets?: string[];
    radioTargets?: string[];
    pressTargets?: string[];
    tourDates?: Array<{
      date: Date;
      venue: string;
      city: string;
    }>;
    merchandising?: string;
    specialEditions?: string;
    musicVideoPlans?: string;
    behindTheScenes?: string;
    documentaryPlans?: string;
    nftStrategy?: string;
    metaverseActivations?: string;
    brandPartnerships?: string;
    syncOpportunities?: string;
    distributionPlatforms?: {
      spotify: boolean;
      appleMusic: boolean;
      youtube: boolean;
      amazonMusic: boolean;
      tidal: boolean;
      deezer: boolean;
      soundcloud: boolean;
      bandcamp: boolean;
      audiomack: boolean;
      kkbox: boolean;
      lineMusic: boolean;
      qq: boolean;
      netease: boolean;
      joox: boolean;
      boomplay: boolean;
      anghami: boolean;
      yandex: boolean;
      vk: boolean;
      custom: string[];
    };
    pricing?: {
      defaultPrice: string;
      currency: string;
      territoryPricing?: any;
    };
  };

  // User info
  submitterEmail: string;
  submitterName: string;
}