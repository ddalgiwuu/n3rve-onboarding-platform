import { IsString, IsOptional, IsArray, IsBoolean, IsObject, IsNumber } from 'class-validator';

export class ExternalSubmissionDto {
  // ===== Required =====
  @IsString() upc: string;
  @IsString() albumTitle: string;
  @IsString() artistName: string;
  @IsString() labelName: string;
  @IsString() albumType: string; // SINGLE | EP | ALBUM
  @IsString() releaseDate: string; // ISO date string

  // ===== Album-level Metadata =====
  @IsOptional() @IsString() albumTitleEn?: string;
  @IsOptional() @IsString() artistNameEn?: string;
  @IsOptional() @IsString() catalogNumber?: string;
  @IsOptional() @IsString() albumDescription?: string;
  @IsOptional() @IsString() albumVersion?: string;
  @IsOptional() @IsString() displayArtist?: string;
  @IsOptional() @IsString() primaryTitle?: string;
  @IsOptional() @IsBoolean() explicitContent?: boolean;
  @IsOptional() @IsBoolean() hasTranslation?: boolean;
  @IsOptional() @IsString() translationLanguage?: string;
  @IsOptional() @IsString() translatedTitle?: string;
  @IsOptional() @IsNumber() totalVolumes?: number;
  @IsOptional() @IsString() albumNote?: string;

  // Album genre
  @IsOptional() @IsString() genre?: string;
  @IsOptional() @IsString() subgenre?: string;
  @IsOptional() @IsArray() albumGenre?: string[];
  @IsOptional() @IsArray() albumSubgenre?: string[];

  // Album translations
  @IsOptional() @IsArray() albumTranslations?: Array<{ language: string; title: string }>;

  // Album-level contributors (e.g., executive producer)
  @IsOptional() @IsArray() albumContributors?: Array<{
    name: string;
    roles: string[];
    instruments?: string[];
    translations?: Array<{ language: string; name: string }>;
    spotifyUrl?: string;
    appleMusicUrl?: string;
  }>;

  // Album featuring artists
  @IsOptional() @IsArray() albumFeaturingArtists?: Array<{ name: string; nameEn?: string }>;

  // Artist extended info
  @IsOptional() @IsString() artistType?: string; // SOLO | GROUP | DUO | BAND
  @IsOptional() @IsString() biography?: string;
  @IsOptional() @IsString() spotifyId?: string;
  @IsOptional() @IsString() appleMusicId?: string;
  @IsOptional() @IsString() youtubeChannelId?: string;
  @IsOptional() @IsArray() artistTranslations?: Array<{ language: string; title: string }>;
  @IsOptional() @IsObject() socialLinks?: {
    instagram?: string;
    youtube?: string;
    spotify?: string;
    appleMusic?: string;
    twitter?: string;
    facebook?: string;
    tiktok?: string;
    website?: string;
    soundcloud?: string;
    threads?: string;
    twitch?: string;
  };
  @IsOptional() @IsArray() members?: Array<{
    name: string;
    role: string;
    spotifyUrl?: string;
    appleMusicUrl?: string;
  }>;

  // ===== Files (Dropbox URLs) =====
  @IsOptional() @IsObject() files?: {
    coverImageUrl?: string;
    artistPhotoUrl?: string;
    motionArtUrl?: string;
    musicVideoUrl?: string;
    audioFiles?: Array<{
      trackId?: string;
      fileName: string;
      dropboxUrl: string;
      fileSize?: number;
    }>;
    musicVideoFiles?: Array<{
      trackId?: string;
      fileName: string;
      dropboxUrl: string;
    }>;
    musicVideoThumbnails?: Array<{
      trackId?: string;
      fileName: string;
      dropboxUrl: string;
    }>;
    additionalFiles?: Array<{
      fileName: string;
      fileType?: string;
      dropboxUrl: string;
      fileSize?: number;
    }>;
  };

  // ===== Tracks (per-track metadata) =====
  @IsOptional() @IsArray() tracks?: Array<{
    // Basic
    trackNumber: number;
    titleKo: string;
    titleEn?: string;
    titleTranslations?: Record<string, string>;
    isrc?: string;
    duration?: string;
    volume?: number;
    discNumber?: number;

    // Genre
    genre?: string;
    subgenre?: string;
    alternateGenre?: string;
    alternateSubgenre?: string;

    // Content
    explicitContent?: boolean;
    lyrics?: string;
    lyricsLanguage?: string;
    language?: string;
    audioLanguage?: string;
    metadataLanguage?: string;
    titleLanguage?: string;

    // Version
    trackType?: string; // ORIGINAL | COVER | REMIX | LIVE | etc.
    versionType?: string;
    trackVersion?: string;

    // Focus/Title
    isTitle?: boolean;
    isFocusTrack?: boolean;

    // Audio
    dolbyAtmos?: boolean;
    stereo?: boolean;
    previewStart?: string;
    previewEnd?: string;
    previewLength?: number;

    // Video
    hasMusicVideo?: boolean;
    musicVideoISRC?: string;

    // Custom release
    hasCustomReleaseDate?: boolean;
    customConsumerReleaseDate?: string;
    customReleaseTime?: string;

    // ===== Track Artists =====
    artists?: Array<{
      name: string;
      nameEn?: string;
      type?: string; // PRIMARY | FEATURED | etc.
      spotifyUrl?: string;
      appleMusicUrl?: string;
    }>;
    featuringArtists?: Array<{
      name: string;
      nameEn?: string;
    }>;
    featuring?: string;

    // ===== Track Contributors (per-person metadata) =====
    contributors?: Array<{
      name: string;
      nameEn?: string;
      roles: string[]; // Composer, Lyricist, Arranger, Producer, Mixer, Masterer, etc.
      instruments?: string[];
      translations?: Array<{ language: string; name: string }>;
      spotifyUrl?: string;
      appleMusicUrl?: string;
      appleId?: string;
      spotifyId?: string;
    }>;

    // Legacy individual fields (also accepted)
    composers?: string;
    lyricists?: string;
    arrangers?: string;
    producer?: string;
    mixer?: string;
    masterer?: string;

    // Publishers
    publishers?: Array<{
      name: string;
      role?: string;
    }>;
  }>;

  // ===== Release Info =====
  @IsOptional() @IsObject() release?: {
    territories?: string[];
    territoryType?: string; // WORLDWIDE | CUSTOM
    copyrightHolder?: string;
    copyrightYear?: string;
    cRights?: string;
    pRights?: string;
    productionHolder?: string;
    productionYear?: string;
    recordingCountry?: string;
    recordingLanguage?: string;
    parentalAdvisory?: string; // NONE | EXPLICIT | CLEAN
    priceType?: string;
    releaseFormat?: string;
    isCompilation?: boolean;
    previouslyReleased?: boolean;
    previousReleaseDate?: string;
    preOrderEnabled?: boolean;
    preOrderDate?: string;
    originalReleaseDate?: string;
    consumerReleaseDate?: string;
    releaseTime?: string;
    selectedTimezone?: string;
  };

  // ===== Marketing (optional) =====
  @IsOptional() @IsObject() marketing?: Record<string, any>;

  // Dropbox path override
  @IsOptional() @IsString() dropboxPath?: string;
}
