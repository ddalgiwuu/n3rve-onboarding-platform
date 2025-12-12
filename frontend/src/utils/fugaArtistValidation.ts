// FUGA Artist Form Validation Utilities

import { FugaArtistFormData, FugaArtistValidationErrors } from '@/types/fugaArtist';

// URL pattern validators
export const urlPatterns = {
  spotify: /^https?:\/\/(open\.)?spotify\.com\/artist\/[a-zA-Z0-9]{22}$/,
  spotifyUri: /^spotify:artist:[a-zA-Z0-9]{22}$/,
  appleMusic: /^https?:\/\/music\.apple\.com\/.+\/artist\/.+\/(\d+)$/,
  youtube: /^https?:\/\/(www\.)?(youtube\.com\/channel\/|youtube\.com\/@)[a-zA-Z0-9_-]+$/,
  soundcloud: /^https?:\/\/(www\.)?soundcloud\.com\/[a-zA-Z0-9_-]+$/,
  instagram: /^https?:\/\/(www\.)?instagram\.com\/[a-zA-Z0-9._]+\/?$/,
  tiktok: /^https?:\/\/(www\.)?tiktok\.com\/@[a-zA-Z0-9._]+$/,
  facebook: /^https?:\/\/(www\.)?facebook\.com\/[a-zA-Z0-9.]+$/,
  twitter: /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/[a-zA-Z0-9_]+$/,
  generic: /^https?:\/\/.+\..+$/,
};

// Extract Spotify Artist ID from URL or URI
export const extractSpotifyId = (input: string): string | null => {
  // Handle URI format: spotify:artist:XXXXX
  const uriMatch = input.match(/spotify:artist:([a-zA-Z0-9]{22})/);
  if (uriMatch) return uriMatch[1];

  // Handle URL format: https://open.spotify.com/artist/XXXXX
  const urlMatch = input.match(/spotify\.com\/artist\/([a-zA-Z0-9]{22})/);
  if (urlMatch) return urlMatch[1];

  // Handle direct ID
  if (/^[a-zA-Z0-9]{22}$/.test(input)) return input;

  return null;
};

// Extract Apple Music Artist ID from URL
export const extractAppleMusicId = (input: string): string | null => {
  // Handle URL format: https://music.apple.com/us/artist/name/123456789
  const match = input.match(/music\.apple\.com\/.+\/artist\/.+\/(\d+)/);
  if (match) return match[1];

  // Handle direct ID
  if (/^\d{8,12}$/.test(input)) return input;

  return null;
};

// Validate image file
export const validateImageFile = (
  file: File,
  type: 'avatar' | 'banner' | 'logo' | 'pressShot'
): { valid: boolean; error?: string } => {
  const constraints = {
    avatar: { maxSize: 3, formats: ['jpg', 'jpeg', 'png', 'webp'], aspectRatio: 1 },
    banner: { maxSize: 5, formats: ['jpg', 'jpeg', 'png'], dimensions: { width: 1500, height: 1000 } },
    logo: { maxSize: 2, formats: ['png', 'svg', 'webp'] },
    pressShot: { maxSize: 5, formats: ['jpg', 'jpeg', 'png', 'webp'] },
  };

  const constraint = constraints[type];

  // Size check
  if (file.size > constraint.maxSize * 1024 * 1024) {
    return {
      valid: false,
      error: `File size must be under ${constraint.maxSize}MB`,
    };
  }

  // Format check
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (!ext || !constraint.formats.includes(ext)) {
    return {
      valid: false,
      error: `Invalid format. Use ${constraint.formats.join(', ')}`,
    };
  }

  return { valid: true };
};

// Validate URL format
export const validateUrl = (url: string, platform?: keyof typeof urlPatterns): boolean => {
  if (!url) return true; // Optional field

  try {
    new URL(url);
    if (platform && urlPatterns[platform]) {
      return urlPatterns[platform].test(url);
    }
    return urlPatterns.generic.test(url);
  } catch {
    return false;
  }
};

// Validate complete form
export const validateFugaArtistForm = (
  formData: Partial<FugaArtistFormData>
): FugaArtistValidationErrors => {
  const errors: FugaArtistValidationErrors = {};

  // Required fields
  if (!formData.name?.trim()) {
    errors.name = 'Artist name is required';
  }

  if (!formData.country?.trim()) {
    errors.country = 'Country is required';
  }

  if (!formData.currentCity?.trim()) {
    errors.currentCity = 'Current city is required';
  }

  if (!formData.hometown?.trim()) {
    errors.hometown = 'Hometown is required';
  }

  // Bio length validation
  if (formData.bio && formData.bio.length > 2000) {
    errors.bio = 'Bio must be 2000 characters or less';
  }

  // URL validations
  const urlFields: Array<{ field: keyof FugaArtistFormData; platform?: keyof typeof urlPatterns }> = [
    { field: 'spotifyUrl', platform: 'spotify' },
    { field: 'appleMusicUrl', platform: 'appleMusic' },
    { field: 'youtubeUrl', platform: 'youtube' },
    { field: 'soundcloudUrl', platform: 'soundcloud' },
    { field: 'instagramUrl', platform: 'instagram' },
    { field: 'tiktokUrl', platform: 'tiktok' },
    { field: 'facebookUrl', platform: 'facebook' },
    { field: 'twitterUrl', platform: 'twitter' },
    { field: 'trillerUrl', platform: 'generic' },
    { field: 'snapchatUrl', platform: 'generic' },
    { field: 'twitchUrl', platform: 'generic' },
    { field: 'pinterestUrl', platform: 'generic' },
    { field: 'tumblrUrl', platform: 'generic' },
    { field: 'websiteUrl', platform: 'generic' },
    { field: 'tourdatesUrl', platform: 'generic' },
    { field: 'pressShotUrl', platform: 'generic' },
  ];

  urlFields.forEach(({ field, platform }) => {
    const value = formData[field] as string | undefined;
    if (value && !validateUrl(value, platform)) {
      errors[field] = 'Invalid URL format';
    }
  });

  return errors;
};

// Check if form has any errors
export const hasValidationErrors = (errors: FugaArtistValidationErrors): boolean => {
  return Object.keys(errors).length > 0;
};

// Get field label for error messages
export const getFieldLabel = (field: string): string => {
  const labels: Record<string, string> = {
    name: 'Artist Name',
    country: 'Country',
    currentCity: 'Current City',
    hometown: 'Hometown',
    gender: 'Gender',
    bio: 'Biography',
    similarArtists: 'Similar Artists',
    spotifyUrl: 'Spotify URL',
    appleMusicUrl: 'Apple Music URL',
    youtubeUrl: 'YouTube URL',
    // ... add more as needed
  };

  return labels[field] || field;
};
