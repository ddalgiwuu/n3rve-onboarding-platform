/**
 * Comprehensive language options for translations
 * Used across the application for album titles, track titles, contributor names, etc.
 */

export interface LanguageOption {
  code: string;
  name: string;      // English name
  koName: string;    // Korean name
  flag: string;      // Flag emoji
}

export const languageOptions: LanguageOption[] = [
  // East Asian Languages
  { code: 'ko', name: 'Korean', koName: '한국어', flag: '🇰🇷' },
  { code: 'ja', name: 'Japanese', koName: '일본어', flag: '🇯🇵' },
  { code: 'zh-CN', name: 'Chinese Simplified', koName: '중국어(간체)', flag: '🇨🇳' },
  { code: 'zh-TW', name: 'Chinese Traditional', koName: '중국어(번체)', flag: '🇹🇼' },
  { code: 'zh-HK', name: 'Chinese (Hong Kong)', koName: '중국어(홍콩)', flag: '🇭🇰' },

  // Southeast Asian Languages
  { code: 'th', name: 'Thai', koName: '태국어', flag: '🇹🇭' },
  { code: 'vi', name: 'Vietnamese', koName: '베트남어', flag: '🇻🇳' },
  { code: 'id', name: 'Indonesian', koName: '인도네시아어', flag: '🇮🇩' },
  { code: 'ms', name: 'Malay', koName: '말레이어', flag: '🇲🇾' },
  { code: 'tl', name: 'Tagalog', koName: '타갈로그어', flag: '🇵🇭' },
  { code: 'my', name: 'Burmese', koName: '미얀마어', flag: '🇲🇲' },
  { code: 'km', name: 'Khmer', koName: '크메르어', flag: '🇰🇭' },
  { code: 'lo', name: 'Lao', koName: '라오어', flag: '🇱🇦' },

  // South Asian Languages
  { code: 'hi', name: 'Hindi', koName: '힌디어', flag: '🇮🇳' },
  { code: 'bn', name: 'Bengali', koName: '벵골어', flag: '🇧🇩' },
  { code: 'ta', name: 'Tamil', koName: '타밀어', flag: '🇮🇳' },
  { code: 'te', name: 'Telugu', koName: '텔루구어', flag: '🇮🇳' },
  { code: 'mr', name: 'Marathi', koName: '마라티어', flag: '🇮🇳' },
  { code: 'ur', name: 'Urdu', koName: '우르두어', flag: '🇵🇰' },
  { code: 'ne', name: 'Nepali', koName: '네팔어', flag: '🇳🇵' },
  { code: 'si', name: 'Sinhala', koName: '싱할라어', flag: '🇱🇰' },

  // Western European Languages
  { code: 'en', name: 'English', koName: '영어', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', koName: '스페인어', flag: '🇪🇸' },
  { code: 'fr', name: 'French', koName: '프랑스어', flag: '🇫🇷' },
  { code: 'de', name: 'German', koName: '독일어', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', koName: '이탈리아어', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', koName: '포르투갈어', flag: '🇵🇹' },
  { code: 'pt-BR', name: 'Portuguese (Brazil)', koName: '포르투갈어(브라질)', flag: '🇧🇷' },
  { code: 'nl', name: 'Dutch', koName: '네덜란드어', flag: '🇳🇱' },
  { code: 'ca', name: 'Catalan', koName: '카탈루냐어', flag: '🇪🇸' },
  { code: 'gl', name: 'Galician', koName: '갈리시아어', flag: '🇪🇸' },

  // Northern European Languages
  { code: 'sv', name: 'Swedish', koName: '스웨덴어', flag: '🇸🇪' },
  { code: 'no', name: 'Norwegian', koName: '노르웨이어', flag: '🇳🇴' },
  { code: 'da', name: 'Danish', koName: '덴마크어', flag: '🇩🇰' },
  { code: 'fi', name: 'Finnish', koName: '핀란드어', flag: '🇫🇮' },
  { code: 'is', name: 'Icelandic', koName: '아이슬란드어', flag: '🇮🇸' },

  // Eastern European Languages
  { code: 'ru', name: 'Russian', koName: '러시아어', flag: '🇷🇺' },
  { code: 'pl', name: 'Polish', koName: '폴란드어', flag: '🇵🇱' },
  { code: 'uk', name: 'Ukrainian', koName: '우크라이나어', flag: '🇺🇦' },
  { code: 'cs', name: 'Czech', koName: '체코어', flag: '🇨🇿' },
  { code: 'sk', name: 'Slovak', koName: '슬로바키아어', flag: '🇸🇰' },
  { code: 'bg', name: 'Bulgarian', koName: '불가리아어', flag: '🇧🇬' },
  { code: 'hr', name: 'Croatian', koName: '크로아티아어', flag: '🇭🇷' },
  { code: 'sr', name: 'Serbian', koName: '세르비아어', flag: '🇷🇸' },
  { code: 'ro', name: 'Romanian', koName: '루마니아어', flag: '🇷🇴' },
  { code: 'hu', name: 'Hungarian', koName: '헝가리어', flag: '🇭🇺' },
  { code: 'et', name: 'Estonian', koName: '에스토니아어', flag: '🇪🇪' },
  { code: 'lv', name: 'Latvian', koName: '라트비아어', flag: '🇱🇻' },
  { code: 'lt', name: 'Lithuanian', koName: '리투아니아어', flag: '🇱🇹' },

  // Middle Eastern Languages
  { code: 'ar', name: 'Arabic', koName: '아랍어', flag: '🇸🇦' },
  { code: 'he', name: 'Hebrew', koName: '히브리어', flag: '🇮🇱' },
  { code: 'tr', name: 'Turkish', koName: '터키어', flag: '🇹🇷' },
  { code: 'fa', name: 'Persian', koName: '페르시아어', flag: '🇮🇷' },

  // Other European Languages
  { code: 'el', name: 'Greek', koName: '그리스어', flag: '🇬🇷' },
  { code: 'sq', name: 'Albanian', koName: '알바니아어', flag: '🇦🇱' },
  { code: 'mk', name: 'Macedonian', koName: '마케도니아어', flag: '🇲🇰' },
  { code: 'sl', name: 'Slovenian', koName: '슬로베니아어', flag: '🇸🇮' },

  // African Languages
  { code: 'sw', name: 'Swahili', koName: '스와힐리어', flag: '🇰🇪' },
  { code: 'am', name: 'Amharic', koName: '암하라어', flag: '🇪🇹' },
  { code: 'zu', name: 'Zulu', koName: '줄루어', flag: '🇿🇦' },
  { code: 'af', name: 'Afrikaans', koName: '아프리칸스어', flag: '🇿🇦' },

  // Additional Asian Languages
  { code: 'mn', name: 'Mongolian', koName: '몽골어', flag: '🇲🇳' },
  { code: 'ka', name: 'Georgian', koName: '조지아어', flag: '🇬🇪' },
  { code: 'hy', name: 'Armenian', koName: '아르메니아어', flag: '🇦🇲' },
  { code: 'az', name: 'Azerbaijani', koName: '아제르바이잔어', flag: '🇦🇿' },
  { code: 'kk', name: 'Kazakh', koName: '카자흐어', flag: '🇰🇿' },
  { code: 'uz', name: 'Uzbek', koName: '우즈베크어', flag: '🇺🇿' }
];

/**
 * Popular languages for quick access (shown as quick-add buttons)
 */
export const popularLanguages = [
  'en',   // English
  'ja',   // Japanese
  'zh-CN', // Chinese Simplified
  'es',   // Spanish
  'fr',   // French
  'de'    // German
];
