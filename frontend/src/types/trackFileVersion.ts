/**
 * Audio format types supported by the platform
 */
export type AudioFormatType =
  | 'stereo'          // Standard 2-channel audio (required)
  | 'dolby-atmos'     // Dolby Atmos immersive audio
  | 'spatial-audio'   // Apple Spatial Audio
  | '360ra'           // Sony 360 Reality Audio
  | 'dts-x';          // DTS:X

/**
 * File processing status
 */
export type FileProcessingStatus =
  | 'pending'      // Waiting to be processed
  | 'processing'   // Currently processing
  | 'validated'    // Successfully validated
  | 'error';       // Processing/validation failed

/**
 * Represents a specific audio format version of a track
 * Each track can have multiple versions (stereo, Dolby Atmos, etc.)
 */
export interface TrackFileVersion {
  // Identification
  id: string;  // UUID for this file version
  formatType: AudioFormatType;
  file: File;
  fileName: string;

  // Technical specifications
  duration?: number;       // seconds
  sampleRate?: number;     // Hz (e.g., 44100, 48000, 96000)
  bitDepth?: number;       // bits (e.g., 16, 24)
  channels?: number;       // 2 for stereo, 10+ for Dolby Atmos (e.g., 7.1.4)
  format?: string;         // File extension (WAV, FLAC, etc.)
  fileSize: number;        // bytes

  // Extracted metadata (from ID3/metadata tags)
  extractedMetadata?: {
    title?: string;
    artist?: string;
    album?: string;
    genre?: string;
  };

  // Quality assessment
  qualityScore?: number;   // 0-100 score based on technical specs
  waveformData?: number[]; // Simplified waveform for visualization

  // Processing status
  status?: FileProcessingStatus;
  errorMessage?: string;

  // Upload timestamp
  uploadedAt?: Date;
}

/**
 * Helper functions for TrackFileVersion
 */
export const TrackFileVersionHelpers = {
  /**
   * Get display name for audio format type
   */
  getFormatDisplayName: (formatType: AudioFormatType, language: 'ko' | 'en' | 'ja' = 'ko'): string => {
    const names = {
      'stereo': { ko: '스테레오', en: 'Stereo', ja: 'ステレオ' },
      'dolby-atmos': { ko: 'Dolby Atmos', en: 'Dolby Atmos', ja: 'Dolby Atmos' },
      'spatial-audio': { ko: 'Spatial Audio', en: 'Spatial Audio', ja: 'Spatial Audio' },
      '360ra': { ko: '360 Reality Audio', en: '360 Reality Audio', ja: '360 Reality Audio' },
      'dts-x': { ko: 'DTS:X', en: 'DTS:X', ja: 'DTS:X' }
    };
    return names[formatType][language];
  },

  /**
   * Check if format type is required (only stereo is required)
   */
  isRequired: (formatType: AudioFormatType): boolean => {
    return formatType === 'stereo';
  },

  /**
   * Get format priority for display order (lower = higher priority)
   */
  getFormatPriority: (formatType: AudioFormatType): number => {
    const priorities: Record<AudioFormatType, number> = {
      'stereo': 1,
      'dolby-atmos': 2,
      'spatial-audio': 3,
      '360ra': 4,
      'dts-x': 5
    };
    return priorities[formatType];
  },

  /**
   * Format file size for display
   */
  formatFileSize: (bytes: number): string => {
    if (bytes >= 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    } else if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    } else if (bytes >= 1024) {
      return `${(bytes / 1024).toFixed(0)} KB`;
    }
    return `${bytes} B`;
  },

  /**
   * Format duration for display
   */
  formatDuration: (seconds?: number): string => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
};
