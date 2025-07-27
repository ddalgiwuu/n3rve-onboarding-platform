// Marketing form dropdown options

export const moodOptions = [
  'Chill',
  'Cooking',
  'Energetic',
  'Fierce',
  'Fitness',
  'Happy',
  'Meditative',
  'Party',
  'Romantic',
  'Sad',
  'Sexy',
  'Sleep',
  'Throwback',
  'Feeling Blue',
  'Heartbreak',
  'Feel Good',
  'Focus',
  'Motivation'
] as const;

export const genderOptions = [
  'Female',
  'Male',
  'Mixed (band)',
  'Non-Binary',
  'Trans',
  'Prefer Not To Say',
  'Other'
] as const;

export const socialMovementOptions = [
  'Asian American and Pacific Islander Heritage Month',
  'AAPI',
  'Black History Month / Juneteenth / BLM',
  'Climate Action and Sustainability',
  'Democracy, Peace, and Security',
  '(Drug) Addictions Awareness',
  'Gender Equality',
  "Women's Rights",
  'Humanitarian Aid',
  'Indigenous Cultural Heritage',
  'LGBTQ+ Rights',
  'PRIDE',
  'Mental Health Awareness Month'
] as const;

export const ugcPriorityOptions = [
  'Meta (Facebook/Instagram)',
  'TikTok',
  'YouTube',
  'Snapchat',
  'X (fka Twitter)',
  'Twitch',
  'Pinterest',
  'Triller',
  'Tumblr'
] as const;

export const instrumentOptions = [
  'Accordion',
  'Acoustic Guitar',
  'Banjo',
  'Bass',
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
  'Xylophone'
] as const;

export const subgenreOptions = [
  'Acid Jazz',
  'Acoustic Country',
  'Acoustic Folk',
  'Acoustic Pop',
  'Acoustic Rock',
  'Acoustic Singer-Songwriter',
  'Acoustic Soul',
  'Adult Contemporary',
  'African Reggae',
  'Afrikaans',
  'Afro House',
  'Afro Soul',
  'Afro-Beat',
  'Afro-Cuban Jazz',
  'Afro-folk',
  'Afro-fusion',
  'Afrobeat',
  'Afropop',
  'Album Rock',
  'Algerian Hip-Hop',
  'Alt-Country',
  'Alt-Pop',
  'Alté',
  'Alternative',
  'Alternative Hip Hop',
  'Alternative Hip-Hop',
  'Alternative Metal',
  'Alternative R&B',
  'Alternative Rock',
  'Amapiano',
  'Ambient',
  'Ambient Drone',
  'Ambient Folk',
  'Ambient House',
  'Ambient Noise',
  'Americana'
  // Add more as needed - this is a partial list
] as const;

// Type exports
export type Mood = typeof moodOptions[number];
export type Gender = typeof genderOptions[number];
export type SocialMovement = typeof socialMovementOptions[number];
export type UGCPriority = typeof ugcPriorityOptions[number];
export type Instrument = typeof instrumentOptions[number];
export type Subgenre = typeof subgenreOptions[number];
