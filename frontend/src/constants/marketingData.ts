// Moods list based on the screenshots
export const MOODS = [
  { value: 'chill', label: 'Chill' },
  { value: 'energetic', label: 'Energetic' },
  { value: 'fierce', label: 'Fierce' },
  { value: 'fitness', label: 'Fitness' },
  { value: 'focus', label: 'Focus' },
  { value: 'happy', label: 'Happy' },
  { value: 'meditative', label: 'Meditative' },
  { value: 'motivation', label: 'Motivation' },
  { value: 'party', label: 'Party' },
  { value: 'romantic', label: 'Romantic' },
  { value: 'sad', label: 'Sad' },
  { value: 'sexy', label: 'Sexy' },
  { value: 'sleep', label: 'Sleep' },
  { value: 'throwback', label: 'Throwback' },
  { value: 'feeling-blue', label: 'Feeling Blue' },
  { value: 'heartbreak', label: 'Heartbreak' },
  { value: 'cooking', label: 'Cooking' },
  { value: 'feel-good', label: 'Feel Good' }
];

// Instruments list based on the screenshots
export const INSTRUMENTS = [
  // Strings
  { value: 'acoustic-guitar', label: 'Acoustic Guitar', category: 'Strings' },
  { value: 'classical-guitar', label: 'Classical Guitar', category: 'Strings' },
  { value: 'electric-guitar', label: 'Electric Guitar', category: 'Strings' },
  { value: 'bass-guitar', label: 'Bass Guitar', category: 'Strings' },
  { value: 'pedal-steel-guitar', label: 'Pedal Steel Guitar', category: 'Strings' },
  { value: 'banjo', label: 'Banjo', category: 'Strings' },
  { value: 'mandolin', label: 'Mandolin', category: 'Strings' },
  { value: 'ukelele', label: 'Ukelele', category: 'Strings' },
  { value: 'harp', label: 'Harp', category: 'Strings' },
  { value: 'sitar', label: 'Sitar', category: 'Strings' },
  { value: 'oud', label: 'Oud', category: 'Strings' },

  // Orchestral Strings
  { value: 'violin', label: 'Violin', category: 'Orchestral' },
  { value: 'viola', label: 'Viola', category: 'Orchestral' },
  { value: 'cello', label: 'Cello', category: 'Orchestral' },
  { value: 'double-bass', label: 'Double Bass', category: 'Orchestral' },
  { value: 'orchestra', label: 'Orchestra', category: 'Orchestral' },

  // Wind
  { value: 'flute', label: 'Flute', category: 'Wind' },
  { value: 'piccolo', label: 'Piccolo', category: 'Wind' },
  { value: 'recorder', label: 'Recorder', category: 'Wind' },
  { value: 'oboe', label: 'Oboe', category: 'Wind' },
  { value: 'clarinet', label: 'Clarinet', category: 'Wind' },
  { value: 'bass-clarinet', label: 'Bass Clarinet', category: 'Wind' },
  { value: 'bassoon', label: 'Bassoon', category: 'Wind' },
  { value: 'saxophone', label: 'Saxophone', category: 'Wind' },
  { value: 'harmonica', label: 'Harmonica', category: 'Wind' },

  // Brass
  { value: 'trumpet', label: 'Trumpet', category: 'Brass' },
  { value: 'trombone', label: 'Trombone', category: 'Brass' },
  { value: 'french-horn', label: 'French Horn', category: 'Brass' },
  { value: 'horn', label: 'Horn', category: 'Brass' },

  // Percussion
  { value: 'drum-kit', label: 'Drum Kit', category: 'Percussion' },
  { value: 'djembe', label: 'Djembe', category: 'Percussion' },
  { value: 'steel-drum', label: 'Steel Drum', category: 'Percussion' },
  { value: 'marimba', label: 'Marimba', category: 'Percussion' },
  { value: 'vibraphone', label: 'Vibraphone', category: 'Percussion' },
  { value: 'xylophone', label: 'Xylophone', category: 'Percussion' },

  // Keys
  { value: 'piano', label: 'Piano', category: 'Keys' },
  { value: 'organ', label: 'Organ', category: 'Keys' },
  { value: 'harpsichord', label: 'Harpsichord', category: 'Keys' },
  { value: 'accordion', label: 'Accordion', category: 'Keys' },
  { value: 'cembalo', label: 'Cembalo', category: 'Keys' },

  // Electronic
  { value: 'synthesizer', label: 'Synthesizer', category: 'Electronic' },
  { value: 'samples', label: 'Samples', category: 'Electronic' },

  // Other
  { value: 'vocals', label: 'Vocals', category: 'Other' },
  { value: 'buzuq', label: 'Buzuq', category: 'Other' },
  { value: 'erhu', label: 'Erhu', category: 'Other' }
];

// Campaign goals
export const CAMPAIGN_GOALS = [
  {
    value: 'playlist-placement',
    label: 'Playlist Placement',
    questions: [
      'What specific playlists are you targeting?',
      'What is your playlist strategy?',
      'What makes this track playlist-worthy?',
      'Have you had previous playlist success?'
    ]
  },
  {
    value: 'radio-airplay',
    label: 'Radio Airplay',
    questions: [
      'Which radio stations/formats are you targeting?',
      'What is your radio promotion strategy?',
      'Do you have any confirmed radio support?',
      'What is your radio servicing timeline?'
    ]
  },
  {
    value: 'sync-placement',
    label: 'Sync/Licensing Placement',
    questions: [
      'What types of sync opportunities are you targeting?',
      'Do you have sync representation?',
      'What makes this track suitable for sync?',
      'Have you had previous sync placements?'
    ]
  },
  {
    value: 'chart-performance',
    label: 'Chart Performance',
    questions: [
      'Which charts are you targeting?',
      'What is your chart strategy?',
      'What promotional activities support this goal?',
      'What are your sales/streaming projections?'
    ]
  },
  {
    value: 'brand-awareness',
    label: 'Brand Awareness',
    questions: [
      'How will you increase artist visibility?',
      'What is your PR/media strategy?',
      'What partnerships or collaborations are planned?',
      'How will you measure brand growth?'
    ]
  },
  {
    value: 'touring-support',
    label: 'Touring Support',
    questions: [
      'What tours/shows are confirmed or planned?',
      'How does this release support touring?',
      'What markets are you targeting?',
      'What is your live performance strategy?'
    ]
  },
  {
    value: 'fan-engagement',
    label: 'Fan Engagement',
    questions: [
      'How will you engage existing fans?',
      'What is your strategy for new fan acquisition?',
      'What exclusive content or experiences are planned?',
      'How will you measure engagement success?'
    ]
  }
];

// Project types
export const PROJECT_TYPES = [
  { value: 'FRONTLINE', label: 'Frontline' },
  { value: 'CATALOG', label: 'Catalog' }
];

// Priority levels
export const PRIORITY_LEVELS = [
  { value: 1, label: '⭐ Priority 1' },
  { value: 2, label: '⭐⭐ Priority 2' },
  { value: 3, label: '⭐⭐⭐ Priority 3' },
  { value: 4, label: '⭐⭐⭐⭐ Priority 4' },
  { value: 5, label: '⭐⭐⭐⭐⭐ Priority 5' }
];
