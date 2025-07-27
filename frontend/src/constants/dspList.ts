// Digital Service Provider (DSP) list for distribution
export interface DSP {
  id: string
  name: string
  category: 'streaming' | 'download' | 'social' | 'fitness' | 'gaming' | 'other'
  logo?: string
  regions?: string[]
  requiresISRC: boolean
  requiresUPC: boolean
  supportsExplicit: boolean
  supportsInstrumental: boolean
  profileUrlPattern?: string // Pattern for artist profile URLs
}

export const dspList: DSP[] = [
  // Major Streaming Platforms
  {
    id: 'spotify',
    name: 'Spotify',
    category: 'streaming',
    logo: '/dsp-logos/spotify.svg',
    requiresISRC: true,
    requiresUPC: true,
    supportsExplicit: true,
    supportsInstrumental: true,
    profileUrlPattern: 'https://open.spotify.com/artist/{artistId}'
  },
  {
    id: 'apple_music',
    name: 'Apple Music',
    category: 'streaming',
    logo: '/dsp-logos/apple-music.svg',
    requiresISRC: true,
    requiresUPC: true,
    supportsExplicit: true,
    supportsInstrumental: true,
    profileUrlPattern: 'https://music.apple.com/artist/{artistId}'
  },
  {
    id: 'youtube_music',
    name: 'YouTube Music',
    category: 'streaming',
    logo: '/dsp-logos/youtube-music.svg',
    requiresISRC: true,
    requiresUPC: true,
    supportsExplicit: true,
    supportsInstrumental: true,
    profileUrlPattern: 'https://music.youtube.com/channel/{channelId}'
  },
  {
    id: 'amazon_music',
    name: 'Amazon Music',
    category: 'streaming',
    logo: '/dsp-logos/amazon-music.svg',
    requiresISRC: true,
    requiresUPC: true,
    supportsExplicit: true,
    supportsInstrumental: true
  },
  {
    id: 'deezer',
    name: 'Deezer',
    category: 'streaming',
    logo: '/dsp-logos/deezer.svg',
    requiresISRC: true,
    requiresUPC: true,
    supportsExplicit: true,
    supportsInstrumental: true,
    profileUrlPattern: 'https://www.deezer.com/artist/{artistId}'
  },
  {
    id: 'tidal',
    name: 'TIDAL',
    category: 'streaming',
    logo: '/dsp-logos/tidal.svg',
    requiresISRC: true,
    requiresUPC: true,
    supportsExplicit: true,
    supportsInstrumental: true,
    profileUrlPattern: 'https://tidal.com/browse/artist/{artistId}'
  },

  // Korean Platforms
  {
    id: 'melon',
    name: 'Melon',
    category: 'streaming',
    logo: '/dsp-logos/melon.svg',
    regions: ['KR'],
    requiresISRC: true,
    requiresUPC: true,
    supportsExplicit: true,
    supportsInstrumental: true
  },
  {
    id: 'genie',
    name: 'Genie Music',
    category: 'streaming',
    logo: '/dsp-logos/genie.svg',
    regions: ['KR'],
    requiresISRC: true,
    requiresUPC: true,
    supportsExplicit: true,
    supportsInstrumental: true
  },
  {
    id: 'bugs',
    name: 'Bugs!',
    category: 'streaming',
    logo: '/dsp-logos/bugs.svg',
    regions: ['KR'],
    requiresISRC: true,
    requiresUPC: true,
    supportsExplicit: true,
    supportsInstrumental: true
  },
  {
    id: 'flo',
    name: 'FLO',
    category: 'streaming',
    logo: '/dsp-logos/flo.svg',
    regions: ['KR'],
    requiresISRC: true,
    requiresUPC: true,
    supportsExplicit: true,
    supportsInstrumental: true
  },
  {
    id: 'vibe',
    name: 'VIBE',
    category: 'streaming',
    logo: '/dsp-logos/vibe.svg',
    regions: ['KR'],
    requiresISRC: true,
    requiresUPC: true,
    supportsExplicit: true,
    supportsInstrumental: true
  },

  // Japanese Platforms
  {
    id: 'line_music',
    name: 'LINE MUSIC',
    category: 'streaming',
    logo: '/dsp-logos/line-music.svg',
    regions: ['JP'],
    requiresISRC: true,
    requiresUPC: true,
    supportsExplicit: true,
    supportsInstrumental: true
  },
  {
    id: 'awa',
    name: 'AWA',
    category: 'streaming',
    logo: '/dsp-logos/awa.svg',
    regions: ['JP'],
    requiresISRC: true,
    requiresUPC: true,
    supportsExplicit: true,
    supportsInstrumental: true
  },

  // Chinese Platforms
  {
    id: 'qq_music',
    name: 'QQ Music',
    category: 'streaming',
    logo: '/dsp-logos/qq-music.svg',
    regions: ['CN'],
    requiresISRC: true,
    requiresUPC: true,
    supportsExplicit: false,
    supportsInstrumental: true
  },
  {
    id: 'netease',
    name: 'NetEase Cloud Music',
    category: 'streaming',
    logo: '/dsp-logos/netease.svg',
    regions: ['CN'],
    requiresISRC: true,
    requiresUPC: true,
    supportsExplicit: false,
    supportsInstrumental: true
  },
  {
    id: 'kuwo',
    name: 'Kuwo Music',
    category: 'streaming',
    logo: '/dsp-logos/kuwo.svg',
    regions: ['CN'],
    requiresISRC: true,
    requiresUPC: true,
    supportsExplicit: false,
    supportsInstrumental: true
  },

  // Download Stores
  {
    id: 'itunes',
    name: 'iTunes Store',
    category: 'download',
    logo: '/dsp-logos/itunes.svg',
    requiresISRC: true,
    requiresUPC: true,
    supportsExplicit: true,
    supportsInstrumental: true
  },
  {
    id: 'amazon_mp3',
    name: 'Amazon MP3',
    category: 'download',
    logo: '/dsp-logos/amazon.svg',
    requiresISRC: true,
    requiresUPC: true,
    supportsExplicit: true,
    supportsInstrumental: true
  },
  {
    id: 'beatport',
    name: 'Beatport',
    category: 'download',
    logo: '/dsp-logos/beatport.svg',
    requiresISRC: true,
    requiresUPC: true,
    supportsExplicit: true,
    supportsInstrumental: true
  },

  // Social Media Platforms
  {
    id: 'tiktok',
    name: 'TikTok',
    category: 'social',
    logo: '/dsp-logos/tiktok.svg',
    requiresISRC: true,
    requiresUPC: false,
    supportsExplicit: true,
    supportsInstrumental: true
  },
  {
    id: 'instagram',
    name: 'Instagram/Facebook',
    category: 'social',
    logo: '/dsp-logos/instagram.svg',
    requiresISRC: true,
    requiresUPC: false,
    supportsExplicit: true,
    supportsInstrumental: true
  },
  {
    id: 'snapchat',
    name: 'Snapchat',
    category: 'social',
    logo: '/dsp-logos/snapchat.svg',
    requiresISRC: true,
    requiresUPC: false,
    supportsExplicit: true,
    supportsInstrumental: true
  },

  // Fitness Platforms
  {
    id: 'peloton',
    name: 'Peloton',
    category: 'fitness',
    logo: '/dsp-logos/peloton.svg',
    requiresISRC: true,
    requiresUPC: false,
    supportsExplicit: false,
    supportsInstrumental: true
  },

  // Other Platforms
  {
    id: 'soundcloud',
    name: 'SoundCloud',
    category: 'streaming',
    logo: '/dsp-logos/soundcloud.svg',
    requiresISRC: true,
    requiresUPC: false,
    supportsExplicit: true,
    supportsInstrumental: true,
    profileUrlPattern: 'https://soundcloud.com/{username}'
  },
  {
    id: 'pandora',
    name: 'Pandora',
    category: 'streaming',
    logo: '/dsp-logos/pandora.svg',
    regions: ['US'],
    requiresISRC: true,
    requiresUPC: true,
    supportsExplicit: true,
    supportsInstrumental: true
  },
  {
    id: 'anghami',
    name: 'Anghami',
    category: 'streaming',
    logo: '/dsp-logos/anghami.svg',
    regions: ['AE', 'SA', 'EG', 'LB', 'JO', 'MA', 'TN', 'DZ', 'IQ'],
    requiresISRC: true,
    requiresUPC: true,
    supportsExplicit: true,
    supportsInstrumental: true
  },
  {
    id: 'kkbox',
    name: 'KKBOX',
    category: 'streaming',
    logo: '/dsp-logos/kkbox.svg',
    regions: ['TW', 'HK', 'SG', 'MY', 'JP'],
    requiresISRC: true,
    requiresUPC: true,
    supportsExplicit: true,
    supportsInstrumental: true
  }
];

// DSP categories for better organization
export const dspCategories = {
  'Global Streaming': ['spotify', 'apple_music', 'youtube_music', 'amazon_music', 'deezer', 'tidal'],
  'Korean Platforms': ['melon', 'genie', 'bugs', 'flo', 'vibe'],
  'Asian Platforms': ['line_music', 'awa', 'qq_music', 'netease', 'kuwo', 'kkbox'],
  'Download Stores': ['itunes', 'amazon_mp3', 'beatport'],
  'Social Media': ['tiktok', 'instagram', 'snapchat'],
  'Other': ['soundcloud', 'pandora', 'anghami', 'peloton']
};

// Helper function to get DSP by ID
export function getDSPById(id: string): DSP | undefined {
  return dspList.find(dsp => dsp.id === id);
}

// Helper function to get DSPs by category
export function getDSPsByCategory(category: DSP['category']): DSP[] {
  return dspList.filter(dsp => dsp.category === category);
}

// Helper function to get DSPs by region
export function getDSPsByRegion(region: string): DSP[] {
  return dspList.filter(dsp => !dsp.regions || dsp.regions.includes(region));
}
