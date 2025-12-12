// FUGA SCORE Artist Registration - Complete Type Definitions

export type ArtistGender =
  | 'male'
  | 'female'
  | 'non-binary'
  | 'mixed-band'
  | 'trans'
  | 'prefer-not-to-say'
  | 'other';

export type SocialMovement =
  | 'Asian American and Pacific Islander Heritage Month'
  | 'AAPI'
  | 'Black History Month / Juneteenth / BLM'
  | 'Climate Action and Sustainability'
  | 'Democracy, Peace, and Security'
  | '(Drug) Addictions Awareness'
  | 'Gender Equality'
  | "Women's Rights"
  | 'Humanitarian Aid'
  | 'Indigenous Cultural Heritage'
  | 'LGBTQ+ Rights'
  | 'PRIDE'
  | 'Mental Health Awareness Month'
  | 'Neurodiversity'
  | 'Racial Justice'
  | 'Religious Freedom'
  | 'Veterans and Military Families';

export interface FugaArtistImage {
  type: 'avatar' | 'banner' | 'logo' | 'pressShot';
  url?: string;
  file?: File;
  credits?: string;
  uploadedUrl?: string; // Dropbox URL after upload
}

export interface FugaSocialMedia {
  spotify?: string;
  appleMusic?: string;
  youtube?: string;
  soundcloud?: string;
  tiktok?: string;
  facebook?: string;
  instagram?: string;
  twitter?: string;
  triller?: string;
  snapchat?: string;
  twitch?: string;
  pinterest?: string;
  tumblr?: string;
  website?: string;
  tourdatesUrl?: string;
}

export interface FugaDSPIdentifier {
  platform: 'SPOTIFY' | 'APPLE_MUSIC' | 'SOUNDCLOUD' | 'YOUTUBE';
  value: string;
}

export interface ArtistTranslation {
  language: string;
  name: string;
}

export interface CompleteFugaArtist {
  // Internal ID
  id: string;

  // Basic Information
  name: string;
  country: string; // ISO country code
  currentCity: string;
  hometown: string;
  gender?: ArtistGender;

  // Biography & Description
  bio: string;
  similarArtists: string;

  // Images
  avatar?: FugaArtistImage;
  banner?: FugaArtistImage;
  logo?: FugaArtistImage;
  pressShot?: FugaArtistImage;

  // Social Media & Web
  socialMedia: FugaSocialMedia;

  // DSP Identifiers
  dspIdentifiers: FugaDSPIdentifier[];

  // Additional Metadata
  hasSyncHistory: boolean;
  syncHistoryDetails?: string;
  socialMovements: SocialMovement[];

  // Translations (multilingual support)
  translations: ArtistTranslation[];

  // Timestamps
  createdAt?: string;
  updatedAt?: string;
  lastUsed?: string;
  usageCount?: number;
}

// Form data type (before save)
export interface FugaArtistFormData {
  name: string;
  country: string;
  currentCity: string;
  hometown: string;
  gender?: ArtistGender;
  bio: string;
  similarArtists: string;

  // Images
  avatarFile?: File;
  avatarUrl?: string;
  bannerFile?: File;
  bannerUrl?: string;
  logoFile?: File;
  logoUrl?: string;
  pressShotFile?: File;
  pressShotUrl?: string;
  pressShotCredits?: string;

  // Social Media URLs
  spotifyUrl?: string;
  appleMusicUrl?: string;
  youtubeUrl?: string;
  soundcloudUrl?: string;
  tiktokUrl?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  twitterUrl?: string;
  trillerUrl?: string;
  snapchatUrl?: string;
  twitchUrl?: string;
  pinterestUrl?: string;
  tumblrUrl?: string;
  websiteUrl?: string;
  tourdatesUrl?: string;

  // Metadata
  hasSyncHistory: boolean;
  syncHistoryDetails?: string;
  socialMovements: SocialMovement[];

  // Translations
  translations: ArtistTranslation[];
}

// Validation error type
export interface FugaArtistValidationErrors {
  [key: string]: string;
}
