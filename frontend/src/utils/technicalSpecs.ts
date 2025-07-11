export const audioFormats = {
  supported: ['WAV', 'FLAC', 'AIFF'],
  bitDepth: ['16-bit', '24-bit'],
  sampleRate: ['44.1 kHz', '48 kHz', '96 kHz', '192 kHz'],
  channels: ['Stereo', 'Mono'],
  maxFileSize: '1GB per file'
}

export const imageFormats = {
  coverArt: {
    formats: ['JPG', 'PNG'],
    dimensions: '3000x3000px minimum',
    aspectRatio: '1:1 (square)',
    colorMode: 'RGB',
    maxFileSize: '10MB'
  }
}

export const metadata = {
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