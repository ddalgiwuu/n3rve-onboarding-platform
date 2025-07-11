export const AUDIO_SPECIFICATIONS = {
  formats: ['WAV', 'FLAC', 'AIFF'],
  bitDepth: ['16-bit', '24-bit'],
  sampleRate: ['44.1 kHz', '48 kHz', '96 kHz', '192 kHz'],
  channels: ['Stereo', 'Mono'],
  maxFileSize: '1GB per file'
}

export const ARTWORK_SPECIFICATIONS = {
  formats: ['JPG', 'PNG'],
  dimensions: '3000x3000px minimum',
  aspectRatio: '1:1 (square)',
  colorMode: 'RGB',
  maxFileSize: '10MB'
}

export const MOTION_ART_SPECIFICATIONS = {
  formats: ['MP4', 'MOV'],
  duration: '3-15 seconds',
  aspectRatio: '1:1 (square)',
  resolution: '3000x3000px minimum',
  maxFileSize: '50MB'
}

export const METADATA_SPECIFICATIONS = {
  required: [
    'Artist Name',
    'Album Title', 
    'Track Titles',
    'Release Date',
    'Genre',
    'Copyright Information',
    'ISRC codes (for each track)'
  ],
  optional: [
    'Composer/Writer credits',
    'Producer credits',
    'Featured artists',
    'Album description',
    'Track descriptions',
    'Lyrics'
  ]
}

export const TECHNICAL_REQUIREMENTS = {
  audioQuality: {
    minimumBitDepth: '16-bit',
    recommendedBitDepth: '24-bit',
    minimumSampleRate: '44.1 kHz',
    recommendedSampleRate: '48 kHz or higher'
  },
  loudness: {
    target: '-14 LUFS',
    peak: '-1 dBTP maximum'
  }
}

export const DOLBY_ATMOS_SPECIFICATIONS = {
  formats: ['ADM BWF', 'IAB MXF'],
  channels: '7.1.4 bed + up to 118 objects',
  bitDepth: '24-bit',
  sampleRate: '48 kHz',
  requirements: [
    'Dolby Atmos Renderer session',
    'Master file in ADM BWF format',
    'Binaural render for streaming'
  ]
}

export const VIDEO_SPECIFICATIONS = {
  formats: ['MP4', 'MOV'],
  codec: 'H.264',
  resolution: '1920x1080 minimum',
  frameRate: '24, 25, or 30 fps',
  bitRate: '10 Mbps minimum',
  audioCodec: 'AAC',
  audioBitRate: '256 kbps minimum'
}

// Backwards compatibility
export const audioFormats = AUDIO_SPECIFICATIONS
export const imageFormats = { coverArt: ARTWORK_SPECIFICATIONS }
export const metadata = METADATA_SPECIFICATIONS
export const deliveryFormats = {
  streaming: {
    format: 'FLAC or WAV',
    bitDepth: '16-bit or 24-bit',
    sampleRate: '44.1 kHz or higher'
  },
  download: {
    format: 'FLAC',
    bitDepth: '24-bit',
    sampleRate: 'Original master quality'
  }
}