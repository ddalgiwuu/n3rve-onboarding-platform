// Digital Service Providers (DSPs) for music distribution
export interface DSP {
  id: string;
  name: string;
  nameKo: string;
  icon?: string;
  availableRegions: string[]; // Territory codes where this DSP is available
}

export const dsps: DSP[] = [
  {
    id: 'spotify',
    name: 'Spotify',
    nameKo: '스포티파이',
    availableRegions: ['US', 'CA', 'MX', 'BR', 'AR', 'CL', 'CO', 'PE', 'EC', 'UY', 'PY', 'BO', 'CR', 'SV', 'GT', 'HN', 'NI', 'PA', 'DO', 'GB', 'IE', 'FR', 'DE', 'ES', 'IT', 'NL', 'BE', 'CH', 'AT', 'SE', 'NO', 'DK', 'FI', 'IS', 'PL', 'CZ', 'SK', 'HU', 'RO', 'BG', 'HR', 'SI', 'RS', 'BA', 'ME', 'AL', 'MK', 'GR', 'TR', 'CY', 'MT', 'PT', 'LU', 'EE', 'LV', 'LT', 'BY', 'UA', 'MD', 'RU', 'KZ', 'JP', 'KR', 'TW', 'HK', 'MO', 'SG', 'MY', 'ID', 'PH', 'TH', 'VN', 'IN', 'PK', 'BD', 'LK', 'NP', 'BT', 'MV', 'AU', 'NZ', 'FJ', 'PG', 'NC', 'IL', 'AE', 'SA', 'QA', 'KW', 'BH', 'OM', 'JO', 'LB', 'EG', 'MA', 'TN', 'DZ', 'LY', 'ZA', 'NG', 'KE', 'GH', 'CI', 'SN', 'CM', 'UG', 'TZ', 'MZ', 'AO', 'NA', 'BW', 'ZW', 'ZM', 'MW', 'MG', 'MU', 'RE', 'SC']
  },
  {
    id: 'apple_music',
    name: 'Apple Music',
    nameKo: '애플 뮤직',
    availableRegions: ['US', 'CA', 'MX', 'BR', 'AR', 'CL', 'CO', 'PE', 'EC', 'VE', 'UY', 'PY', 'BO', 'CR', 'SV', 'GT', 'HN', 'NI', 'PA', 'DO', 'BB', 'BM', 'BS', 'BZ', 'GY', 'JM', 'TT', 'GB', 'IE', 'FR', 'DE', 'ES', 'IT', 'NL', 'BE', 'CH', 'AT', 'SE', 'NO', 'DK', 'FI', 'IS', 'PL', 'CZ', 'SK', 'HU', 'RO', 'BG', 'HR', 'SI', 'RS', 'BA', 'ME', 'AL', 'MK', 'GR', 'TR', 'CY', 'MT', 'PT', 'LU', 'EE', 'LV', 'LT', 'BY', 'UA', 'MD', 'RU', 'KZ', 'GE', 'AM', 'AZ', 'JP', 'KR', 'CN', 'TW', 'HK', 'MO', 'SG', 'MY', 'ID', 'PH', 'TH', 'VN', 'KH', 'LA', 'MM', 'BN', 'IN', 'PK', 'BD', 'LK', 'NP', 'BT', 'MV', 'AU', 'NZ', 'FJ', 'PG', 'SB', 'VU', 'NC', 'PF', 'IL', 'AE', 'SA', 'QA', 'KW', 'BH', 'OM', 'JO', 'LB', 'EG', 'MA', 'TN', 'DZ', 'LY', 'ZA', 'NG', 'KE', 'GH', 'CI', 'SN', 'CM', 'UG', 'TZ', 'MZ', 'AO', 'NA', 'BW', 'ZW', 'ZM', 'MW', 'MG', 'MU', 'RE', 'SC', 'CV', 'BF', 'ML', 'NE', 'TD', 'GM', 'GW', 'LR', 'SL', 'TG', 'BJ', 'RW', 'BI', 'SO', 'ET', 'ER', 'DJ', 'KM', 'YT', 'GA', 'CG', 'CD', 'CF', 'GQ', 'ST', 'SD', 'SS']
  },
  {
    id: 'youtube_music',
    name: 'YouTube Music',
    nameKo: '유튜브 뮤직',
    availableRegions: ['US', 'CA', 'MX', 'BR', 'AR', 'CL', 'CO', 'PE', 'EC', 'VE', 'UY', 'PY', 'BO', 'CR', 'SV', 'GT', 'HN', 'NI', 'PA', 'DO', 'JM', 'TT', 'GB', 'IE', 'FR', 'DE', 'ES', 'IT', 'NL', 'BE', 'CH', 'AT', 'SE', 'NO', 'DK', 'FI', 'IS', 'PL', 'CZ', 'SK', 'HU', 'RO', 'BG', 'HR', 'SI', 'RS', 'BA', 'ME', 'AL', 'MK', 'GR', 'TR', 'CY', 'MT', 'PT', 'LU', 'EE', 'LV', 'LT', 'BY', 'UA', 'MD', 'RU', 'KZ', 'JP', 'KR', 'TW', 'HK', 'SG', 'MY', 'ID', 'PH', 'TH', 'VN', 'IN', 'PK', 'BD', 'LK', 'NP', 'AU', 'NZ', 'IL', 'AE', 'SA', 'QA', 'KW', 'BH', 'OM', 'JO', 'LB', 'IQ', 'EG', 'MA', 'TN', 'DZ', 'LY', 'ZA', 'NG', 'KE', 'GH', 'UG', 'TZ', 'ZW', 'SN']
  },
  {
    id: 'amazon_music',
    name: 'Amazon Music',
    nameKo: '아마존 뮤직',
    availableRegions: ['US', 'CA', 'MX', 'BR', 'AR', 'CL', 'CO', 'PE', 'EC', 'VE', 'UY', 'GB', 'IE', 'FR', 'DE', 'ES', 'IT', 'NL', 'BE', 'CH', 'AT', 'SE', 'NO', 'DK', 'FI', 'PL', 'CZ', 'SK', 'HU', 'RO', 'BG', 'HR', 'SI', 'GR', 'TR', 'CY', 'MT', 'PT', 'LU', 'EE', 'LV', 'LT', 'RU', 'JP', 'KR', 'SG', 'MY', 'ID', 'PH', 'TH', 'IN', 'AU', 'NZ', 'IL', 'AE', 'SA', 'EG', 'ZA', 'NG', 'KE']
  },
  {
    id: 'deezer',
    name: 'Deezer',
    nameKo: '디저',
    availableRegions: ['FR', 'DE', 'GB', 'ES', 'IT', 'NL', 'BE', 'CH', 'AT', 'SE', 'NO', 'DK', 'FI', 'IS', 'PL', 'CZ', 'SK', 'HU', 'RO', 'BG', 'HR', 'SI', 'RS', 'BA', 'ME', 'AL', 'MK', 'GR', 'TR', 'CY', 'MT', 'PT', 'LU', 'EE', 'LV', 'LT', 'BY', 'UA', 'MD', 'RU', 'KZ', 'GE', 'AM', 'AZ', 'IL', 'AE', 'SA', 'QA', 'KW', 'BH', 'OM', 'JO', 'LB', 'IQ', 'EG', 'MA', 'TN', 'DZ', 'LY', 'ZA', 'NG', 'KE', 'GH', 'CI', 'SN', 'CM', 'UG', 'TZ', 'MZ', 'AO', 'NA', 'BW', 'ZW', 'ZM', 'MW', 'MG', 'MU', 'RE', 'SC', 'CV', 'BF', 'ML', 'NE', 'TD', 'GM', 'GW', 'LR', 'SL', 'TG', 'BJ', 'RW', 'BI', 'SO', 'ET', 'ER', 'DJ', 'KM', 'YT', 'GA', 'CG', 'CD', 'CF', 'GQ', 'ST', 'SD', 'SS', 'US', 'CA', 'MX', 'BR', 'AR', 'CL', 'CO', 'PE', 'EC', 'VE', 'UY', 'PY', 'BO', 'CR', 'SV', 'GT', 'HN', 'NI', 'PA', 'DO', 'JM', 'TT', 'JP', 'KR', 'TW', 'HK', 'MO', 'SG', 'MY', 'ID', 'PH', 'TH', 'VN', 'KH', 'LA', 'MM', 'BN', 'IN', 'PK', 'BD', 'LK', 'NP', 'BT', 'MV', 'AU', 'NZ', 'FJ', 'PG', 'SB', 'VU', 'NC', 'PF']
  },
  {
    id: 'tidal',
    name: 'TIDAL',
    nameKo: '타이달',
    availableRegions: ['US', 'CA', 'MX', 'BR', 'AR', 'CL', 'CO', 'PE', 'GB', 'IE', 'FR', 'DE', 'ES', 'IT', 'NL', 'BE', 'CH', 'AT', 'SE', 'NO', 'DK', 'FI', 'IS', 'PL', 'CZ', 'SK', 'HU', 'RO', 'BG', 'HR', 'SI', 'GR', 'TR', 'CY', 'MT', 'PT', 'LU', 'EE', 'LV', 'LT', 'RU', 'JP', 'KR', 'SG', 'MY', 'ID', 'PH', 'TH', 'IN', 'AU', 'NZ', 'IL', 'AE', 'SA', 'ZA', 'NG', 'KE']
  },
  {
    id: 'soundcloud',
    name: 'SoundCloud',
    nameKo: '사운드클라우드',
    availableRegions: territories.map(t => t.code) // Available worldwide
  },
  {
    id: 'melon',
    name: 'Melon',
    nameKo: '멜론',
    availableRegions: ['KR']
  },
  {
    id: 'genie',
    name: 'Genie',
    nameKo: '지니',
    availableRegions: ['KR']
  },
  {
    id: 'bugs',
    name: 'Bugs',
    nameKo: '벅스',
    availableRegions: ['KR']
  },
  {
    id: 'flo',
    name: 'FLO',
    nameKo: '플로',
    availableRegions: ['KR']
  },
  {
    id: 'vibe',
    name: 'VIBE',
    nameKo: '바이브',
    availableRegions: ['KR']
  },
  {
    id: 'qqmusic',
    name: 'QQ Music',
    nameKo: 'QQ뮤직',
    availableRegions: ['CN', 'HK', 'MO', 'TW']
  },
  {
    id: 'netease',
    name: 'NetEase Cloud Music',
    nameKo: '넷이즈 클라우드 뮤직',
    availableRegions: ['CN']
  },
  {
    id: 'kuwo',
    name: 'Kuwo Music',
    nameKo: '쿠워 뮤직',
    availableRegions: ['CN']
  },
  {
    id: 'kugou',
    name: 'Kugou Music',
    nameKo: '쿠고우 뮤직',
    availableRegions: ['CN']
  },
  {
    id: 'line_music',
    name: 'LINE MUSIC',
    nameKo: '라인 뮤직',
    availableRegions: ['JP', 'TH', 'TW']
  },
  {
    id: 'awa',
    name: 'AWA',
    nameKo: 'AWA',
    availableRegions: ['JP']
  },
  {
    id: 'kkbox',
    name: 'KKBOX',
    nameKo: 'KKBOX',
    availableRegions: ['TW', 'HK', 'SG', 'MY', 'JP']
  },
  {
    id: 'joox',
    name: 'JOOX',
    nameKo: 'JOOX',
    availableRegions: ['HK', 'MY', 'ID', 'TH', 'MM']
  },
  {
    id: 'anghami',
    name: 'Anghami',
    nameKo: '앙하미',
    availableRegions: ['AE', 'SA', 'QA', 'KW', 'BH', 'OM', 'JO', 'LB', 'IQ', 'EG', 'MA', 'TN', 'DZ', 'LY', 'PS', 'SY', 'YE', 'SD']
  },
  {
    id: 'yandex_music',
    name: 'Yandex Music',
    nameKo: '얀덱스 뮤직',
    availableRegions: ['RU', 'BY', 'KZ', 'UA', 'MD', 'AM', 'AZ', 'GE', 'KG', 'TJ', 'TM', 'UZ']
  },
  {
    id: 'gaana',
    name: 'Gaana',
    nameKo: '가나',
    availableRegions: ['IN']
  },
  {
    id: 'jiosaavn',
    name: 'JioSaavn',
    nameKo: '지오사븐',
    availableRegions: ['IN']
  },
  {
    id: 'wynk',
    name: 'Wynk Music',
    nameKo: '윙크 뮤직',
    availableRegions: ['IN']
  },
  {
    id: 'hungama',
    name: 'Hungama Music',
    nameKo: '헝가마 뮤직',
    availableRegions: ['IN']
  },
  {
    id: 'boomplay',
    name: 'Boomplay',
    nameKo: '붐플레이',
    availableRegions: ['NG', 'GH', 'KE', 'TZ', 'UG', 'ZA', 'CM', 'CI', 'SN', 'BF', 'ML', 'NE', 'TD', 'GM', 'GW', 'LR', 'SL', 'TG', 'BJ', 'RW', 'BI', 'MZ', 'ZW', 'ZM', 'MW', 'MG', 'GA', 'CG', 'CD', 'CF', 'GQ']
  },
  {
    id: 'audiomack',
    name: 'Audiomack',
    nameKo: '오디오맥',
    availableRegions: territories.map(t => t.code) // Available worldwide
  },
  {
    id: 'pandora',
    name: 'Pandora',
    nameKo: '판도라',
    availableRegions: ['US']
  },
  {
    id: 'iheartradio',
    name: 'iHeartRadio',
    nameKo: '아이하트라디오',
    availableRegions: ['US', 'CA', 'AU', 'NZ', 'MX']
  },
  {
    id: 'shazam',
    name: 'Shazam',
    nameKo: '샤잠',
    availableRegions: territories.map(t => t.code) // Available worldwide
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    nameKo: '틱톡',
    availableRegions: territories.filter(t => !['CN', 'IR', 'KP', 'CU', 'SY'].includes(t.code)).map(t => t.code) // Available worldwide except some countries
  },
  {
    id: 'instagram_music',
    name: 'Instagram Music',
    nameKo: '인스타그램 뮤직',
    availableRegions: territories.map(t => t.code) // Available worldwide
  },
  {
    id: 'facebook',
    name: 'Facebook',
    nameKo: '페이스북',
    availableRegions: territories.map(t => t.code) // Available worldwide
  }
];

export const getDSPsByTerritory = (territoryCode: string): DSP[] => {
  return dsps.filter(dsp => dsp.availableRegions.includes(territoryCode));
};

export const isDSPAvailableInTerritory = (dspId: string, territoryCode: string): boolean => {
  const dsp = dsps.find(d => d.id === dspId);
  return dsp ? dsp.availableRegions.includes(territoryCode) : false;
};