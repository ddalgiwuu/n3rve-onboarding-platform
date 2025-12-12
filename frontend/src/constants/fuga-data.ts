// FUGA SCORE 마케팅 데이터 - 완전한 목록
// 수집일: 2024-12-11

// ==========================================
// Main Genres (22개)
// ==========================================
export const FUGA_GENRES = [
  'African Music',
  'Alternative',
  'Asian Music',
  'Blues',
  'Classical',
  'Country',
  'Dance',
  'Electronic',
  'Folk',
  'Hip Hop/Rap',
  'Inspirational',
  'Jazz',
  'Kids Music',
  'Latin',
  'New Age',
  'Pop',
  'R&B/Soul',
  'Reggae',
  'Rock',
  'Singer/Songwriter',
  'Soundtrack',
  'Spoken Word',
] as const;

// ==========================================
// Genre별 Subgenres (569개 총합)
// ==========================================
export const GENRE_SUBGENRES: Record<string, string[]> = {
  'African Music': [
    'Afrikaans', 'Afrobeat', 'Afropop', 'Amapiano', 'Bikutsi',
    'Bongo Flava', 'Coupé Décalé', 'Digital Maskandi', 'Genge',
    'Gengetone', 'Highlife', 'Kizomba', 'Kuduro', 'Mahraganat',
    'Maloya', 'Maskandi', "M'balax", "N'dombolo", 'Raï',
    'Rumba (Congolese)', 'Shaaby', 'Sharqi', 'Soukouss',
  ],

  'Alternative': [
    'Alt-Country', 'Alt-Pop', 'Alternative', 'Alternative Hip Hop',
    'Alternative R&B', 'Ambient Folk', 'Americana', 'Bluegrass',
    'Blues Rock', 'Celtic Punk', 'Emo', 'Folk Pop', 'Folk Punk',
    'Folk Rock', 'Garage Rock', 'Hardcore', 'Honky Tonk Revival',
    'Horror Punk', 'Indie Dance', 'Indie Folk', 'Indie Pop',
    'Indie Punk', 'Indie Rock', 'Lofi Pop', 'Lofi Rock',
    'Maskandi', 'New Acoustic', 'Pop Punk', 'Post-Punk',
    'Psychedelic', 'Psychobilly', 'Retro Rock', 'Rockabilly',
    'Roots Rock', 'Singer-Songwriter', 'Ska', 'Skate Punk',
    'Traditional Folk',
  ],

  'Asian Music': [
    'Anime', 'Bhangra', 'Bolero (Vietnamese)', 'Bollywood',
    'Carnatic Classical', 'Chutney', 'Dabke', 'Devotional',
    'Enka', 'Filmi', 'Ghazal', 'Hindustani Classical',
    'Indian Fusion', 'Indian Indie', 'J-Tracks', 'Mediterranean',
    'Mizrahit', 'Mor Lum', 'OPM', 'Qawwali', 'Sharqi',
    'Songs for Life', 'Thai Country',
  ],

  'Blues': [
    'Blues Rock', 'Blues Roots', 'Blues Singer-Songwriter',
    'Boogie Woogie', 'Delta Blues', 'Folk Blues', 'Gospel Blues',
    'Hill Country Blues', 'Jazz Blues', 'Jump Blues',
    'Louisiana Blues', 'Singer-Songwriter', 'Texas Blues',
  ],

  'Classical': [
    'Baroque', 'Carnatic Classical', 'Choral', 'Classical',
    'Classical Piano', 'Contemporary', 'Crossover',
    'Hindustani Classical', 'Medieval', 'Neoclassical', 'Opera',
    'Renaissance', 'Romantic', 'String Orchestra', 'Symphony',
    'Symphony Orchestra', 'minimalism',
  ],

  'Country': [
    'Acoustic Country', 'Americana', 'Bluesgrass', 'Country',
    'Country Pop', 'Country Québécois', 'Country Rap',
    'Country Singer-Songwriter', 'Honky Tonk', 'Rockabilly',
    'Singer-Songwriter', 'Traditional Country',
  ],

  'Dance': [
    'Afro House', 'Amapiano', 'Ambient Drone', 'Ambient House',
    'Ambient Noise', 'Ballroom/Vogue', 'Baltimore Club', 'Bass',
    'Bass House', 'Bassline', 'Big Room', 'Breakbeat', 'Chillstep',
    'Chillwave', 'Club Music', 'Dance House', 'Dance Pop',
    'Dancehall', 'Deep House', 'Disco', 'Disco House', 'Downtempo',
    'Drone', 'Drum & Bass', 'Dubstep', 'EDM', 'Electro',
    'Electro R&B', 'Electro Shaabi', 'Electro house', 'Electronic',
    'Electronic Gospel', 'Electronica', 'Electropop', 'Footwork',
    'Future Bass', 'Future Funk', 'Future House', 'G House',
    'Gqom', 'Happy Hardcore', 'Hardcore Techno', 'Hardcore/Raw',
    'Hardstyle', 'House', 'Hyperpop', 'IDM', 'Indie Dance',
    'Indie Electronic', 'Industrial', 'J-Dance/Electronic',
    'Jersey Club', 'Juke', 'Jungle', 'Kwaito', 'Latin House',
    'Lo-Fi House', 'Lowercase', 'Mahraganat', 'Melodic House',
    'Melodic/Future Bass', 'Miami Jook', 'Minimal', 'Minimal Techno',
    'Moombahton', 'Nature Noise', 'New Orleans Bounce', 'Nu Disco',
    'Philly Club', 'Progressive House', 'Psy-Trance',
    'Psychedelic Electronic', 'Reggaeton', 'Rominimal', 'Shamstep',
    'Shuffle', 'Slap House', 'Stutter House', 'Soul House',
    'Synthwave/Retrowave', 'Tech House', 'Techno', 'Trance', 'Trap',
    'Tribal House', 'Trip Hop', 'Tropical House', 'UK Funky',
    'UK Garage', 'Vaporwave', 'Vocal Downtempo',
  ],

  'Electronic': [
    // Dance와 거의 동일 (Stutter House 제외)
    'Afro House', 'Amapiano', 'Ambient Drone', 'Ambient House',
    'Ambient Noise', 'Ballroom/Vogue', 'Baltimore Club', 'Bass',
    'Bass House', 'Bassline', 'Big Room', 'Breakbeat', 'Chillstep',
    'Chillwave', 'Club Music', 'Dance House', 'Dance Pop',
    'Dancehall', 'Deep House', 'Disco', 'Disco House', 'Downtempo',
    'Drone', 'Drum & Bass', 'Dubstep', 'EDM', 'Electro',
    'Electro R&B', 'Electro Shaabi', 'Electro house', 'Electronic',
    'Electronic Gospel', 'Electronica', 'Electropop', 'Footwork',
    'Future Bass', 'Future Funk', 'Future House', 'G House',
    'Gqom', 'Happy Hardcore', 'Hardcore Techno', 'Hardcore/Raw',
    'Hardstyle', 'House', 'Hyperpop', 'IDM', 'Indie Dance',
    'Indie Electronic', 'Industrial', 'J-Dance/Electronic',
    'Jersey Club', 'Juke', 'Jungle', 'Kwaito', 'Latin House',
    'Lo-Fi House', 'Lowercase', 'Mahraganat', 'Melodic House',
    'Melodic/Future Bass', 'Miami Jook', 'Minimal', 'Minimal Techno',
    'Moombahton', 'Nature Noise', 'New Orleans Bounce', 'Nu Disco',
    'Philly Club', 'Progressive House', 'Psy-Trance',
    'Psychedelic Electronic', 'Reggaeton', 'Rominimal', 'Shamstep',
    'Shuffle', 'Slap House', 'Soul House', 'Synthwave/Retrowave',
    'Tech House', 'Techno', 'Trance', 'Trap', 'Tribal House',
    'Trip Hop', 'Tropical House', 'UK Funky', 'UK Garage',
    'Vaporwave', 'Vocal Downtempo',
  ],

  'Folk': [
    'Acoustic Folk', 'Acoustic Singer-Songwriter', 'Adult Contemporary',
    'Afro-folk', 'Alt-Country', 'Ambient Folk', 'Americana',
    'Basque Folk (Folk Vasco)', 'Blues Roots', 'Blues Singer-Songwriter',
    'Castilian Folk (Folk Castellano)', 'Catalan Folk (Folk Catalán)',
    'Chanson Alternative', 'Chanson Française', 'Chill Pop',
    'Country Singer Songwriter', 'Folclor Andino', 'Folclor Llanero',
    'Folclor Pacifico', 'Folk', 'Folk & Roots', 'Folk Blues',
    'Folk Pop', 'Folk Punk', 'Folk Québécois', 'Folk Rock',
    'Folk Singer-Songwriter', 'Folklore Argentino', 'Folklore Québécois',
    'Honky Tonk', 'Indie Bluegrass', 'Indie Folk', 'Indie Singer-Songwriter',
    'Irish Traditional', 'Jamgrass', 'New Classic', 'Pop Singer-Songwriter',
    'Retro Rock', 'Rock Singer-Songwriter', 'Roots', 'Roots Rock',
    'Schlager', 'Schweizer Mundart', 'Singer-Songwriter', 'Songs for Life',
    'Soul Singer-Songwriter', 'Southern Rock', 'Traditional Folk',
    'Volksmusik', 'Zydeco',
  ],

  'Hip Hop/Rap': [
    'Alternative Hip-Hop', 'Cloud Rap', 'Conscious Hip Hop',
    'Digital Maskandi', 'Drill', 'Emo Rap', 'Freestyle', 'Genge',
    'Grime', 'Lo-Fi Beats', 'Meme Rap', 'Motswako', 'Pop Rap',
    'Pop Urbaine', 'Southern Rap', 'Spoken Word', 'Trap',
  ],

  'Inspirational': [
    'Contemporary Christian', 'Faith', 'Gospel', 'Hymns',
    'Liturgical', 'Positive Country', 'Southern Gospel',
    'Traditional Gospel', 'Worship',
  ],

  'Jazz': [
    'Acid Jazz', 'Afro-Cuban Jazz', 'Arabic Jazz', 'Bebop',
    'Big Band', 'Contemporary Jazz', 'Cool Jazz', 'Experimental Jazz',
    'Free Jazz', 'Hard Bop', 'Jazz', 'Jazz Beats', 'Jazz Blues',
    'Jazz Funk', 'Jazz Fusion', 'Lounge', 'Post Bop',
    'Smooth Jazz', 'Swing',
  ],

  'Kids Music': [],  // No subgenres

  'Latin': [
    'Arrocha', 'Axé', 'Bachata', 'Banda', 'Bolero (Latin)',
    'Bossa Nova', 'Brazilian Funk', 'Brega', 'Bregafunk', 'Carimbó',
    'Champeta', 'Chicha', 'Corrido', 'Cuarteto', 'Cumbia',
    'Dancehall', 'Dembow', 'Dub', 'Flamenco', 'Folclor Andino',
    'Folclor Llanero', 'Folclor Pacifico', 'Folklore Argentino',
    'Forró', 'Funk Carioca', 'Huayno', 'Latin', 'Mariachi',
    'Merengue', 'Música Cristã', 'Música Nativista',
    'Música Popular Brasileira', 'Norteño', 'Outros (Brasil)',
    'Pagode', 'Pagode Baiano', 'Pentecostal', 'Pisadinha',
    'Pop Leve', 'Reggaeton', 'Roots Reggae', 'Salsa', 'Salsa Choke',
    'Samba', 'Sertanejo', 'Sierreño', 'Soca', 'Sones', 'Tango',
    'Tecnobrega', 'Tejano', 'Trap (Latin)', 'Trap Latino',
    'Vallenato', 'Zouk',
  ],

  'New Age': [
    'Environmental', 'Healing', 'Meditation', 'Nature',
    'Relaxation', 'Travel', 'Yoga',
  ],

  'Pop': [
    'Afrikaans', 'Afrobeat', 'Alt-Pop', 'Contemporary Pop',
    'Country Pop', 'Dance Pop', 'Folk Pop', 'J-Pop', 'Highlife',
    'K-Pop', 'Lofi Pop', 'Mandopop', 'Maskandi', 'Mediterranean',
    'Pop Rock', 'Reggaeton', 'Singer-Songwriter',
  ],

  'R&B/Soul': [
    'Afro Soul', 'Alternative R&B', 'Blues Roots', 'Disco',
    'Electro R&B', 'Funk', 'Funk Beats', 'Funk Rock', 'Future Funk',
    'Gospel', 'Gospel Blues', 'J-R&B/Soul', 'Jazz Funk', 'Neo Soul',
    'New Classic', 'New Jack Swing', 'Pop Funk', 'Pop R&B', 'R&B',
    'R&B Québécois', 'Retro Soul', 'Soul', 'Soul Funk', 'Soul House',
    'Soul Pop', 'Soul Singer-Songwriter', 'Southern Gospel',
    'Traditional Gospel', 'UK Funky', 'Vaporwave',
  ],

  'Reggae': [
    'Dancehall', 'Dub', 'Roots Reggae', 'Soca',
  ],

  'Rock': [
    'Alt-Pop', 'Alternative', 'Alternative Metal', 'Alternative R&B',
    'Alternative Rock', 'Black Metal', 'Blues Rock', 'Celtic Punk',
    'Country Rock', 'Death Metal', 'Deathcore', 'Djent', 'Emo',
    'Folk Metal', 'Folk Punk', 'Folk Rock', 'Garage Rock',
    'Hard Rock', 'Hardcore', 'Heavy Metal', 'Horror Punk',
    'Indie Dance', 'Indie Folk', 'Indie Pop', 'Indie Punk',
    'Indie Rock', 'Jam Band', 'Lofi Pop', 'Lofi Rock', 'Metalcore',
    'Modern Rock', 'Nu-Metal', 'Pop Punk', 'Pop Rock', 'Post-Punk',
    'Progressive Metal', 'Psychedelic', 'Psychobilly', 'Rockabilly',
    'Roots Rock', 'Singer-Songwriter', 'Ska', 'Skate Punk',
    'Southern Rock', 'Stoner Metal', 'Stoner Rock', 'Symphonic Metal',
    'Trash Metal',
  ],

  'Singer/Songwriter': [
    // Folk & Singer/Songwriter와 동일
    'Acoustic Folk', 'Acoustic Singer-Songwriter', 'Adult Contemporary',
    'Afro-folk', 'Alt-Country', 'Ambient Folk', 'Americana',
    'Basque Folk (Folk Vasco)', 'Blues Roots', 'Blues Singer-Songwriter',
    'Castilian Folk (Folk Castellano)', 'Catalan Folk (Folk Catalán)',
    'Chanson Alternative', 'Chanson Française', 'Chill Pop',
    'Country Singer Songwriter', 'Folclor Andino', 'Folclor Llanero',
    'Folclor Pacifico', 'Folk', 'Folk & Roots', 'Folk Blues',
    'Folk Pop', 'Folk Punk', 'Folk Québécois', 'Folk Rock',
    'Folk Singer-Songwriter', 'Folklore Argentino', 'Folklore Québécois',
    'Honky Tonk', 'Indie Bluegrass', 'Indie Folk', 'Indie Singer-Songwriter',
    'Irish Traditional', 'Jamgrass', 'New Classic', 'Pop Singer-Songwriter',
    'Retro Rock', 'Rock Singer-Songwriter', 'Roots', 'Roots Rock',
    'Schlager', 'Schweizer Mundart', 'Singer-Songwriter', 'Songs for Life',
    'Soul Singer-Songwriter', 'Southern Rock', 'Traditional Folk',
    'Volksmusik', 'Zydeco',
  ],

  'Soundtrack': [],  // No subgenres

  'Spoken Word': [
    'Audi Plays', 'Comedy', 'Fiction', 'Nonfiction', 'Poetry',
    'Spoken Word',
  ],
};

// ==========================================
// Moods (18개, 최대 3개 선택)
// ==========================================
export const FUGA_MOODS = [
  'Chill',
  'Cooking',
  'Energetic',
  'Feel Good',
  'Fierce',
  'Fitness',
  'Focus',
  'Happy',
  'Meditative',
  'Motivation',
  'Party',
  'Romantic',
  'Sad',
  'Sexy',
  'Sleep',
  'Throwback',
  'Feeling Blue',
  'Heartbreak',
] as const;

// ==========================================
// Instruments (45개, 다중 선택)
// ==========================================
export const FUGA_INSTRUMENTS = [
  'Accordion',
  'Acoustic Guitar',
  'Banjo',
  'Bass Clarinet',
  'Bass Guitar',
  'Bassoon',
  'Buzuq',
  'Cello',
  'Cembalo',
  'Clarinet',
  'Classical Guitar',
  'Djembe',
  'Double Bass',
  'Drum Kit',
  'Electric Guitar',
  'Erhu',
  'Flute',
  'French Horn',
  'Harmonica',
  'Harp',
  'Harpsichord',
  'Horn',
  'Mandolin',
  'Marimba',
  'Oboe',
  'Orchestra',
  'Organ',
  'Oud',
  'Pedal Steel Guitar',
  'Piano',
  'Piccolo',
  'Recorder',
  'Samples',
  'Saxophone',
  'Sitar',
  'Steel Drum',
  'Synthesizer',
  'Trombone',
  'Trumpet',
  'Ukelele',
  'Vibraphone',
  'Viola',
  'Violin',
  'Vocals',
  'Xylophone',
] as const;

// ==========================================
// 마케팅 플랫폼 (8개)
// ==========================================
export const MARKETING_PLATFORMS = [
  'Spotify',
  'TikTok',
  'Meta',
  'YouTube',
  'Apple Music',
  'Amazon Music',
  'Deezer',
  'SmartURL',
] as const;

// ==========================================
// 프로젝트 타입
// ==========================================
export const PROJECT_TYPES = {
  FRONTLINE: 'Frontline',
  CATALOG: 'Catalog',
} as const;

// ==========================================
// More Products Coming 옵션
// ==========================================
export const MORE_PRODUCTS_OPTIONS = ['Yes', 'No', 'Maybe'] as const;

// ==========================================
// TypeScript Types
// ==========================================
export type FugaGenre = typeof FUGA_GENRES[number];
export type FugaMood = typeof FUGA_MOODS[number];
export type FugaInstrument = typeof FUGA_INSTRUMENTS[number];
export type MarketingPlatform = typeof MARKETING_PLATFORMS[number];
export type ProjectType = typeof PROJECT_TYPES[keyof typeof PROJECT_TYPES];
export type MoreProductsOption = typeof MORE_PRODUCTS_OPTIONS[number];

// ==========================================
// Platform Budget Interface
// ==========================================
export interface PlatformBudget {
  platform: MarketingPlatform;
  amount: number;
  startDate: string;
  endDate: string;
  targetAudience: string;
}
