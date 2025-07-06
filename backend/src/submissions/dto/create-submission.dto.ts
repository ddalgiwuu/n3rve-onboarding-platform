export class CreateSubmissionDto {
  // Artist info
  artistName: string;
  artistNameEn?: string;
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

  // Album info
  albumTitle: string;
  albumTitleEn?: string;
  albumType: string;
  releaseDate: Date;
  albumDescription?: string;
  albumVersion?: string;
  releaseVersion?: string;
  albumGenre: string[];
  albumSubgenre?: string[];

  // Tracks
  tracks: Array<{
    id: string;
    titleKo: string;
    titleEn: string;
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
    }>;
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
    cRights: string;
    pRights: string;
  };

  // User info
  submitterEmail: string;
  submitterName: string;
}