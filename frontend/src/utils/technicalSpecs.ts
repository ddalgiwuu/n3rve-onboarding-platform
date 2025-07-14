export interface AudioSpec {
  formats: string[];
  sampleRates: number[];
  bitDepths: number[];
  maxFileSize: string;
  channels: string[];
  requirements: string[];
}

export interface ArtworkSpec {
  formats: string[];
  minResolution: string;
  recommendedResolution: string;
  maxFileSize: string;
  colorMode: string;
  requirements: string[];
}

export interface MotionArtSpec {
  formats: string[];
  aspectRatio: string;
  duration: string;
  maxFileSize: string;
  codec: string;
  resolution: string;
  fps: number[];
  requirements: string[];
}

export interface DolbyAtmosSpec {
  format: string;
  sampleRate: string;
  bitDepth: string;
  deliverables: string[];
  requirements: string[];
}

export interface VideoSpec {
  formats: string[];
  minResolution: string;
  recommendedResolution: string;
  codec: string;
  aspectRatio: string;
  maxFileSize: string;
  fps: number[];
  bitrate: string;
  requirements: string[];
}

export const AUDIO_SPECIFICATIONS: AudioSpec = {
  formats: ['WAV', 'FLAC', 'AIFF'],
  sampleRates: [44100, 48000, 88200, 96000, 176400, 192000],
  bitDepths: [16, 24, 32],
  maxFileSize: '2GB',
  channels: ['Stereo (2 channels)', 'Mono (1 channel)'],
  requirements: [
    'No clipping or distortion',
    'No DC offset',
    'Peak level between -3dB and 0dB',
    'No lossy compression (MP3, AAC, etc.)',
    'Consistent sample rate throughout the file',
    'No DRM or encryption'
  ]
};

export const ARTWORK_SPECIFICATIONS: ArtworkSpec = {
  formats: ['JPG/JPEG', 'PNG'],
  minResolution: '1400x1400px',
  recommendedResolution: '3000x3000px',
  maxFileSize: '10MB',
  colorMode: 'RGB',
  requirements: [
    'Square aspect ratio (1:1)',
    'RGB color mode only (no CMYK)',
    'No transparency/alpha channel',
    'High quality (minimal compression artifacts)',
    'No watermarks or promotional text',
    'No borders or frames',
    'Cover art must be relevant to the release'
  ]
};

export const MOTION_ART_SPECIFICATIONS: MotionArtSpec = {
  formats: ['MP4'],
  aspectRatio: '1:1',
  duration: '15-30 seconds',
  maxFileSize: '100MB',
  codec: 'H.264',
  resolution: '1080x1080px minimum',
  fps: [24, 25, 30],
  requirements: [
    'Square aspect ratio (1:1) required',
    'H.264 codec only',
    'No audio track',
    'Seamless loop preferred',
    'No strobing or flashing effects',
    'Appropriate for all audiences',
    'Related to the release artwork/theme'
  ]
};

export const DOLBY_ATMOS_SPECIFICATIONS: DolbyAtmosSpec = {
  format: 'ADM BWF',
  sampleRate: '48kHz',
  bitDepth: '24-bit',
  deliverables: [
    'ADM BWF master file',
    'Binaural stereo render (required)',
    'Dolby Atmos metadata file'
  ],
  requirements: [
    'Mixed and mastered in Dolby Atmos Production Suite',
    'Loudness compliant with Dolby specifications',
    'Binaural render must be included',
    'No clipping in any object or bed',
    'Proper metadata with all required fields',
    'Tested on Dolby Atmos renderer'
  ]
};

export const VIDEO_SPECIFICATIONS: VideoSpec = {
  formats: ['MP4', 'MOV'],
  minResolution: '1920x1080px',
  recommendedResolution: '3840x2160px (4K)',
  codec: 'H.264',
  aspectRatio: '16:9',
  maxFileSize: '4GB',
  fps: [24, 25, 30, 50, 60],
  bitrate: '10-50 Mbps',
  requirements: [
    'H.264 codec (H.265/HEVC also accepted)',
    '16:9 aspect ratio required',
    'Progressive scan (no interlacing)',
    'Constant frame rate',
    'High quality encoding',
    'Synced audio track (if applicable)',
    'No watermarks or logos',
    'Appropriate for all platforms'
  ]
};

// Validation functions
export const validateAudioFile = (file: File): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  const extension = file.name.split('.').pop()?.toUpperCase();
  
  if (!extension || !AUDIO_SPECIFICATIONS.formats.includes(extension)) {
    errors.push(`Invalid format. Accepted formats: ${AUDIO_SPECIFICATIONS.formats.join(', ')}`);
  }
  
  if (file.size > 2 * 1024 * 1024 * 1024) { // 2GB in bytes
    errors.push('File size exceeds 2GB limit');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

export const validateArtworkFile = (file: File): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  const extension = file.name.split('.').pop()?.toUpperCase();
  
  if (!extension || !['JPG', 'JPEG', 'PNG'].includes(extension)) {
    errors.push('Invalid format. Accepted formats: JPG/JPEG, PNG');
  }
  
  if (file.size > 10 * 1024 * 1024) { // 10MB in bytes
    errors.push('File size exceeds 10MB limit');
  }
  
  // Additional validation would require reading image metadata
  
  return {
    valid: errors.length === 0,
    errors
  };
};

export const validateMotionArtFile = (file: File): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  const extension = file.name.split('.').pop()?.toUpperCase();
  
  if (!extension || extension !== 'MP4') {
    errors.push('Invalid format. Only MP4 is accepted');
  }
  
  if (file.size > 100 * 1024 * 1024) { // 100MB in bytes
    errors.push('File size exceeds 100MB limit');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

export const validateVideoFile = (file: File): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  const extension = file.name.split('.').pop()?.toUpperCase();
  
  if (!extension || !VIDEO_SPECIFICATIONS.formats.includes(extension)) {
    errors.push(`Invalid format. Accepted formats: ${VIDEO_SPECIFICATIONS.formats.join(', ')}`);
  }
  
  if (file.size > 4 * 1024 * 1024 * 1024) { // 4GB in bytes
    errors.push('File size exceeds 4GB limit');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

// Format file size for display
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Get specification by file type
export const getSpecificationByFileType = (fileType: string) => {
  switch (fileType.toLowerCase()) {
    case 'audio':
      return AUDIO_SPECIFICATIONS;
    case 'artwork':
      return ARTWORK_SPECIFICATIONS;
    case 'motionart':
      return MOTION_ART_SPECIFICATIONS;
    case 'dolbyatmos':
      return DOLBY_ATMOS_SPECIFICATIONS;
    case 'video':
      return VIDEO_SPECIFICATIONS;
    default:
      return null;
  }
};