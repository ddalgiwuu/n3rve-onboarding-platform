import React, { useState, useMemo, useEffect, useRef } from 'react'
import { Plus, X, Music, Star, User, Edit3, Users, ChevronRight, List, AlertTriangle, Info, Languages, AlertCircle, Volume2, BookOpen, Megaphone, CheckCircle, FileText, Tag, Target, Disc, Music2, Mic, UserCheck, Calendar, Search, GripVertical, Database, Share2, Heart, Link as LinkIcon, MapPin, Upload, Video } from 'lucide-react'
import { useLanguageStore } from '@/store/language.store'
import useSafeStore from '@/hooks/useSafeStore'
import { v4 as uuidv4 } from 'uuid'
import { validateField, type QCValidationResult } from '@/utils/fugaQCValidation'
import QCWarnings from '@/components/submission/QCWarnings'
import ArtistModal from '@/components/submission/ArtistModal'
import { DatePicker } from '@/components/DatePicker'

interface ArtistIdentifier {
  type: string
  value: string
}

interface Artist {
  id: string
  primaryName: string
  hasTranslation: boolean
  translationLanguage?: string
  translatedName?: string
  isNewArtist: boolean
  countryOfOrigin?: string
  bookingAgent?: string
  customIdentifiers: ArtistIdentifier[]
  role: 'main' | 'featuring'
  youtubeChannelId?: string
}

type ContributorRole = 
  | 'a&r_administrator' | 'a&r_manager' | 'actor' | 'adapter' | 'agent' | 'arranger' | 'art_direction' 
  | 'artist_management' | 'assistant_composer' | 'assistant_conductor' | 'assistant_director' 
  | 'assistant_mastering_engineer' | 'assistant_mixing_engineer' | 'assistant_producer' 
  | 'assistant_recording_engineer' | 'assistant_sound_engineer' | 'author' | 'band' 
  | 'camera_operator' | 'choir' | 'choir_conductor' | 'choreographer' | 'chorus' | 'chorus_master' 
  | 'cinematographer' | 'co_producer' | 'composer' | 'computer_graphic_creator' | 'conductor' 
  | 'contributing_artist' | 'costume_designer' | 'creative_director' | 'dancer' | 'director' 
  | 'dj' | 'editor' | 'engineer' | 'ensemble' | 'executive_producer' | 'featuring' | 'gaffer' 
  | 'guest_vocals' | 'immersive_audio_engineer' | 'immersive_mastering_engineer' 
  | 'immersive_mixing_engineer' | 'key_grip' | 'librettist' | 'lighting_director' | 'liner_notes' 
  | 'lyricist' | 'mastering_engineer' | 'mc' | 'mixer' | 'mixing_engineer' | 'musical_director' 
  | 'narrator' | 'orchestra' | 'orchestrator' | 'performer' | 'playwright' | 'post_producer' 
  | 'producer' | 'production_assistant' | 'programmer' | 'rap' | 'recording_engineer' | 'remixer' 
  | 'sampled_artist' | 'set_designer' | 'soloist' | 'sound_editor' | 'sound_effects' 
  | 'sound_engineer' | 'special_effects' | 'spoken_word' | 'strings_conductor' | 'studio_musician' 
  | 'studio_personnel' | 'tape' | 'tonmeister' | 'translator' | 'video_director' | 'video_producer' 
  | 'visual_effects_technician' | 'vocal_effects' | 'vocal_engineer' | 'vocal_producer' | 'writer'

interface ContributorTranslation {
  language: string
  name: string
}

interface Contributor {
  id: string
  name: string
  translations?: ContributorTranslation[]
  roles: ContributorRole[]
  instruments?: string[]
  appleMusicUrl?: string
  spotifyUrl?: string
}

interface TrackTranslation {
  id: string
  language: string
  title: string
}

interface Track {
  id: string
  titleKo: string
  titleEn: string
  artists: Artist[]
  featuringArtists: Artist[]
  contributors: Contributor[]
  isTitle: boolean
  // Individual track release dates
  hasCustomReleaseDate?: boolean
  consumerReleaseDate?: string
  releaseTime?: string
  // Asset Level fields from FUGA
  dolbyAtmos?: boolean
  stereo?: boolean
  audioFiles?: string[]
  genre?: string
  subgenre?: string
  alternateGenre?: string
  alternateSubgenre?: string
  lyrics?: string
  audioLanguage?: string
  metadataLanguage?: string
  explicitContent?: boolean
  playtimeStartShortClip?: number
  previewLength?: number
  translations?: TrackTranslation[]
  // ISRC and track type
  isrc?: string
  trackType?: 'audio' | 'music_video'
}

interface TrackData {
  tracks: Track[]
  productMetadata?: {
    // Product Level fields from FUGA
    originalReleaseDate?: string
    consumerReleaseDate?: string
    releaseTime?: string
    recordingYear?: string
    countryOfRecording?: string
    countryOfCommissioning?: string
    exclusiveRights?: boolean
    // Copyright fields
    copyrightYear?: string
    copyrightText?: string
    phonogramCopyrightYear?: string
    phonogramCopyrightText?: string
    // New fields
    albumNotes?: string
    metadataLanguage?: string
    territories?: string[]
    territoryType?: 'world' | 'selected'
    dspTerritories?: {
      [dspName: string]: {
        territoryType: 'default' | 'custom'
        territories?: string[]
      }
    }
    displayArtists?: string
    explicitContent?: boolean
  }
  marketing?: {
    albumDescription?: string
    albumIntroduction?: string
    marketingKeywords?: string[]
    targetAudience?: string
    promotionPlans?: string
  }
}

interface Props {
  data: any
  onNext: (data: TrackData) => void
}

const languageOptions = [
  // Major Languages
  { value: 'en', label: 'English' },
  { value: 'ko', label: '한국어 (Korean)' },
  { value: 'ja', label: '日本語 (Japanese)' },
  { value: 'zh', label: '中文 (Chinese)' },
  { value: 'zh-TW', label: '繁體中文 (Traditional Chinese)' },
  { value: 'es', label: 'Español (Spanish)' },
  { value: 'fr', label: 'Français (French)' },
  { value: 'de', label: 'Deutsch (German)' },
  { value: 'it', label: 'Italiano (Italian)' },
  { value: 'pt', label: 'Português (Portuguese)' },
  { value: 'pt-BR', label: 'Português Brasileiro (Brazilian Portuguese)' },
  { value: 'ru', label: 'Русский (Russian)' },
  
  // Asian Languages
  { value: 'th', label: 'ไทย (Thai)' },
  { value: 'vi', label: 'Tiếng Việt (Vietnamese)' },
  { value: 'id', label: 'Bahasa Indonesia (Indonesian)' },
  { value: 'ms', label: 'Bahasa Melayu (Malay)' },
  { value: 'fil', label: 'Filipino' },
  { value: 'hi', label: 'हिन्दी (Hindi)' },
  { value: 'bn', label: 'বাংলা (Bengali)' },
  { value: 'ta', label: 'தமிழ் (Tamil)' },
  { value: 'te', label: 'తెలుగు (Telugu)' },
  { value: 'ur', label: 'اردو (Urdu)' },
  { value: 'ar', label: 'العربية (Arabic)' },
  { value: 'he', label: 'עברית (Hebrew)' },
  { value: 'fa', label: 'فارسی (Persian)' },
  { value: 'tr', label: 'Türkçe (Turkish)' },
  
  // European Languages
  { value: 'nl', label: 'Nederlands (Dutch)' },
  { value: 'pl', label: 'Polski (Polish)' },
  { value: 'sv', label: 'Svenska (Swedish)' },
  { value: 'no', label: 'Norsk (Norwegian)' },
  { value: 'da', label: 'Dansk (Danish)' },
  { value: 'fi', label: 'Suomi (Finnish)' },
  { value: 'el', label: 'Ελληνικά (Greek)' },
  { value: 'cs', label: 'Čeština (Czech)' },
  { value: 'hu', label: 'Magyar (Hungarian)' },
  { value: 'ro', label: 'Română (Romanian)' },
  { value: 'bg', label: 'Български (Bulgarian)' },
  { value: 'uk', label: 'Українська (Ukrainian)' },
  { value: 'hr', label: 'Hrvatski (Croatian)' },
  { value: 'sr', label: 'Српски (Serbian)' },
  { value: 'sk', label: 'Slovenčina (Slovak)' },
  { value: 'sl', label: 'Slovenščina (Slovenian)' },
  { value: 'et', label: 'Eesti (Estonian)' },
  { value: 'lv', label: 'Latviešu (Latvian)' },
  { value: 'lt', label: 'Lietuvių (Lithuanian)' },
  
  // Other Languages
  { value: 'ca', label: 'Català (Catalan)' },
  { value: 'eu', label: 'Euskera (Basque)' },
  { value: 'gl', label: 'Galego (Galician)' },
  { value: 'is', label: 'Íslenska (Icelandic)' },
  { value: 'ga', label: 'Gaeilge (Irish)' },
  { value: 'cy', label: 'Cymraeg (Welsh)' },
  { value: 'af', label: 'Afrikaans' },
  { value: 'sw', label: 'Kiswahili (Swahili)' },
  { value: 'zu', label: 'isiZulu (Zulu)' },
  { value: 'xh', label: 'isiXhosa (Xhosa)' },
  { value: 'yo', label: 'Yorùbá (Yoruba)' },
  { value: 'ig', label: 'Igbo' },
  { value: 'ha', label: 'Hausa' },
  { value: 'am', label: 'አማርኛ (Amharic)' },
  { value: 'so', label: 'Soomaali (Somali)' },
  { value: 'mn', label: 'Монгол (Mongolian)' },
  { value: 'kk', label: 'Қазақ (Kazakh)' },
  { value: 'uz', label: 'Oʻzbek (Uzbek)' },
  { value: 'ky', label: 'Кыргызча (Kyrgyz)' },
  { value: 'tg', label: 'Тоҷикӣ (Tajik)' },
  { value: 'tk', label: 'Türkmen (Turkmen)' },
  { value: 'az', label: 'Azərbaycan (Azerbaijani)' },
  { value: 'ka', label: 'ქართული (Georgian)' },
  { value: 'hy', label: 'Հայերեն (Armenian)' },
  { value: 'sq', label: 'Shqip (Albanian)' },
  { value: 'mk', label: 'Македонски (Macedonian)' },
  { value: 'mt', label: 'Malti (Maltese)' },
  { value: 'lb', label: 'Lëtzebuergesch (Luxembourgish)' }
]

const dspList = [
  '7Digital (via IIP-DDS)',
  'Amazon (via IIP-DDS)',
  'Ami Entertainment (via IIP-DDS)',
  'Anghami (via IIP-DDS)',
  'Apple Music (via IIP-DDS)',
  'AWA (via IIP-DDS)',
  'Beatport (via IIP-DDS)',
  'Bmat (via IIP-DDS)',
  'Bugs! (via IIP-DDS)',
  'Deezer (via IIP-DDS)',
  'Dreamus Company (FLO) (via IIP-DDS)',
  'Facebook Audio Library (via IIP-DDS)',
  'Facebook Fingerprinting (via IIP-DDS)',
  'Facebook Video (via IIP-DDS)',
  'Facebook Video Fingerprinting (via IIP-DDS)',
  'fizy (via IIP-DDS)',
  'Genie Music (via IIP-DDS)',
  'Gracenote (via IIP-DDS)',
  'HighResAudio (via IIP-DDS)',
  'Hungama (via IIP-DDS)',
  'iHeartRadio (via IIP-DDS)',
  'iMusica / Claro SA (via IIP-DDS)',
  'JioSaavn (via IIP-DDS)',
  'Joox (via IIP-DDS)',
  'Kakao / MelOn (via IIP-DDS)',
  'KkBox (via IIP-DDS)',
  'Kuack Media (via IIP-DDS)',
  'LINE Music (via IIP-DDS)',
  'LyricFind (via IIP-DDS)',
  'MePlaylist (via IIP-DDS)',
  'Mixcloud (via IIP-DDS)',
  'mora [HD] (A)',
  'mora [SD] (A)',
  'Muska (via IIP-DDS)',
  'NAVER VIBE (via IIP-DDS)',
  'NetEase Cloud Music (via IIP-DDS)',
  'Nuuday A/S (via IIP-DDS)',
  'orimyustore (A)',
  'Pandora (via IIP-DDS)',
  'Peloton (via IIP-DDS)',
  'Pretzel Rocks (via IIP-DDS)',
  'Qobuz (via IIP-DDS)',
  'Simbals (via IIP-DDS)',
  'SoundCloud (via IIP-DDS)',
  'Spotify (via IIP-DDS)',
  'Spotify Video (via IIP-DDS)',
  'Taobao (via IIP-DDS)',
  'Tencent (via IIP-DDS)',
  'TIDAL (via IIP-DDS)',
  'TikTok (via IIP-DDS)',
  'TouchTunes (via IIP-DDS)',
  'Trebel Music (via IIP-DDS)',
  'U-NEXT (A)',
  'YouTube Music & Content ID (via IIP-DDS)',
  'エムティーアイ [HD] (MTI) (A)',
  'エムティーアイ [SD/MV] (MTI) (A)',
  'オトトイ [HD] (OTOTOY) (A)',
  'オトトイ [SD] (OTOTOY) (A)',
  'ドワンゴ (Dwango) (A)',
  'フェイス (Faith) (A)',
  'モンスターラボ (Monstar Lab) (A)',
  'ヤマハ (YAMAHA) (A)',
  'レコチョク [HD] (Recochoku) (A)',
  'レコチョク [SD/MV] (Recochoku) (A)',
  '楽天 (Rakuten) (A)'
]

const countryOptions = [
  { value: 'KR', label: '한국' },
  { value: 'US', label: '미국' },
  { value: 'JP', label: '일본' },
  { value: 'CN', label: '중국' },
  { value: 'GB', label: '영국' },
  { value: 'FR', label: '프랑스' },
  { value: 'DE', label: '독일' },
  { value: 'IT', label: '이탈리아' },
  { value: 'ES', label: '스페인' },
  { value: 'CA', label: '캐나다' },
  { value: 'AU', label: '호주' },
  { value: 'other', label: '기타' }
]

const territoryData = {
  africa: {
    name: 'Africa',
    countries: [
      'DZ', 'AO', 'BJ', 'BW', 'BF', 'BI', 'CM', 'CV', 'CF', 'TD', 'KM', 'CG', 'CD', 'CI', 'DJ', 'EG', 'GQ', 'ER', 'ET', 'GA', 'GM', 'GH', 'GN', 'GW', 'KE', 'LS', 'LR', 'LY', 'MG', 'MW', 'ML', 'MR', 'MU', 'YT', 'MA', 'MZ', 'NA', 'NE', 'NG', 'RE', 'RW', 'SH', 'ST', 'SN', 'SC', 'SL', 'SO', 'ZA', 'SS', 'SD', 'SZ', 'TG', 'TN', 'UG', 'TZ', 'EH', 'ZM', 'ZW'
    ]
  },
  americas: {
    name: 'Americas',
    countries: [
      'AI', 'AG', 'AR', 'AW', 'BS', 'BB', 'BZ', 'BM', 'BO', 'BQ', 'BR', 'VG', 'CA', 'KY', 'CL', 'CO', 'CR', 'CU', 'CW', 'DM', 'DO', 'EC', 'SV', 'FK', 'GF', 'GL', 'GD', 'GP', 'GT', 'GY', 'HT', 'HN', 'JM', 'MQ', 'MX', 'MS', 'NI', 'PA', 'PY', 'PE', 'PR', 'BL', 'KN', 'LC', 'MF', 'PM', 'VC', 'SX', 'SR', 'TT', 'TC', 'US', 'VI', 'UY', 'VE'
    ]
  },
  asia: {
    name: 'Asia',
    countries: [
      'AF', 'AM', 'AZ', 'BH', 'BD', 'BT', 'BN', 'KH', 'CN', 'GE', 'HK', 'IN', 'ID', 'IR', 'IQ', 'IL', 'JP', 'JO', 'KZ', 'KP', 'KW', 'KG', 'LA', 'LB', 'MO', 'MY', 'MV', 'MN', 'MM', 'NP', 'PS', 'OM', 'PK', 'PH', 'QA', 'KR', 'SA', 'SG', 'LK', 'SY', 'TW', 'TJ', 'TH', 'TL', 'TR', 'TM', 'AE', 'UZ', 'VN', 'YE'
    ]
  },
  europe: {
    name: 'Europe',
    countries: [
      'AX', 'AL', 'AD', 'AT', 'BY', 'BE', 'BA', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FO', 'FI', 'FR', 'DE', 'GI', 'GR', 'GG', 'VA', 'HU', 'IS', 'IE', 'IM', 'IT', 'JE', 'LV', 'LI', 'LT', 'LU', 'MK', 'MT', 'MC', 'ME', 'NL', 'NO', 'PL', 'PT', 'MD', 'RO', 'RU', 'SM', 'RS', 'SK', 'SI', 'ES', 'SJ', 'SE', 'CH', 'UA', 'GB'
    ]
  },
  oceania: {
    name: 'Oceania',
    countries: [
      'AS', 'AQ', 'AU', 'BV', 'IO', 'CX', 'CC', 'CK', 'FJ', 'PF', 'TF', 'GU', 'HM', 'KI', 'MH', 'FM', 'NR', 'NC', 'NZ', 'NU', 'NF', 'MP', 'PW', 'PG', 'PN', 'WS', 'SB', 'GS', 'TK', 'TO', 'TV', 'UM', 'VU', 'WF'
    ]
  }
}

const countryNames: { [key: string]: { en: string; ko: string } } = {
  // Africa
  'DZ': { en: 'Algeria', ko: '알제리' },
  'AO': { en: 'Angola', ko: '앙골라' },
  'BJ': { en: 'Benin', ko: '베냉' },
  'BW': { en: 'Botswana', ko: '보츠와나' },
  'BF': { en: 'Burkina Faso', ko: '부르키나파소' },
  'BI': { en: 'Burundi', ko: '부룬디' },
  'CM': { en: 'Cameroon', ko: '카메룬' },
  'CV': { en: 'Cape Verde', ko: '카보베르데' },
  'CF': { en: 'Central African Republic', ko: '중앙아프리카공화국' },
  'TD': { en: 'Chad', ko: '차드' },
  'KM': { en: 'Comoros', ko: '코모로' },
  'CG': { en: 'Congo', ko: '콩고' },
  'CD': { en: 'Congo (DR)', ko: '콩고민주공화국' },
  'CI': { en: "Cote d'Ivoire", ko: '코트디부아르' },
  'DJ': { en: 'Djibouti', ko: '지부티' },
  'EG': { en: 'Egypt', ko: '이집트' },
  'GQ': { en: 'Equatorial Guinea', ko: '적도기니' },
  'ER': { en: 'Eritrea', ko: '에리트레아' },
  'ET': { en: 'Ethiopia', ko: '에티오피아' },
  'GA': { en: 'Gabon', ko: '가봉' },
  'GM': { en: 'Gambia', ko: '감비아' },
  'GH': { en: 'Ghana', ko: '가나' },
  'GN': { en: 'Guinea', ko: '기니' },
  'GW': { en: 'Guinea-Bissau', ko: '기니비사우' },
  'KE': { en: 'Kenya', ko: '케냐' },
  'LS': { en: 'Lesotho', ko: '레소토' },
  'LR': { en: 'Liberia', ko: '라이베리아' },
  'LY': { en: 'Libya', ko: '리비아' },
  'MG': { en: 'Madagascar', ko: '마다가스카르' },
  'MW': { en: 'Malawi', ko: '말라위' },
  'ML': { en: 'Mali', ko: '말리' },
  'MR': { en: 'Mauritania', ko: '모리타니' },
  'MU': { en: 'Mauritius', ko: '모리셔스' },
  'YT': { en: 'Mayotte', ko: '마요트' },
  'MA': { en: 'Morocco', ko: '모로코' },
  'MZ': { en: 'Mozambique', ko: '모잠비크' },
  'NA': { en: 'Namibia', ko: '나미비아' },
  'NE': { en: 'Niger', ko: '니제르' },
  'NG': { en: 'Nigeria', ko: '나이지리아' },
  'RE': { en: 'Reunion', ko: '레위니옹' },
  'RW': { en: 'Rwanda', ko: '르완다' },
  'SH': { en: 'Saint Helena', ko: '세인트헬레나' },
  'ST': { en: 'Sao Tome and Principe', ko: '상투메프린시페' },
  'SN': { en: 'Senegal', ko: '세네갈' },
  'SC': { en: 'Seychelles', ko: '세이셸' },
  'SL': { en: 'Sierra Leone', ko: '시에라리온' },
  'SO': { en: 'Somalia', ko: '소말리아' },
  'ZA': { en: 'South Africa', ko: '남아프리카공화국' },
  'SS': { en: 'South Sudan', ko: '남수단' },
  'SD': { en: 'Sudan', ko: '수단' },
  'SZ': { en: 'Swaziland', ko: '스와질란드' },
  'TG': { en: 'Togo', ko: '토고' },
  'TN': { en: 'Tunisia', ko: '튀니지' },
  'UG': { en: 'Uganda', ko: '우간다' },
  'TZ': { en: 'Tanzania', ko: '탄자니아' },
  'EH': { en: 'Western Sahara', ko: '서사하라' },
  'ZM': { en: 'Zambia', ko: '잠비아' },
  'ZW': { en: 'Zimbabwe', ko: '짐바브웨' },
  // Americas
  'AI': { en: 'Anguilla', ko: '앵귈라' },
  'AG': { en: 'Antigua and Barbuda', ko: '앤티가바부다' },
  'AR': { en: 'Argentina', ko: '아르헨티나' },
  'AW': { en: 'Aruba', ko: '아루바' },
  'BS': { en: 'Bahamas', ko: '바하마' },
  'BB': { en: 'Barbados', ko: '바베이도스' },
  'BZ': { en: 'Belize', ko: '벨리즈' },
  'BM': { en: 'Bermuda', ko: '버뮤다' },
  'BO': { en: 'Bolivia', ko: '볼리비아' },
  'BQ': { en: 'Bonaire', ko: '보네르' },
  'BR': { en: 'Brazil', ko: '브라질' },
  'VG': { en: 'British Virgin Islands', ko: '영국령 버진아일랜드' },
  'CA': { en: 'Canada', ko: '캐나다' },
  'KY': { en: 'Cayman Islands', ko: '케이맨 제도' },
  'CL': { en: 'Chile', ko: '칠레' },
  'CO': { en: 'Colombia', ko: '콜롬비아' },
  'CR': { en: 'Costa Rica', ko: '코스타리카' },
  'CU': { en: 'Cuba', ko: '쿠바' },
  'CW': { en: 'Curacao', ko: '퀴라소' },
  'DM': { en: 'Dominica', ko: '도미니카' },
  'DO': { en: 'Dominican Republic', ko: '도미니카공화국' },
  'EC': { en: 'Ecuador', ko: '에콰도르' },
  'SV': { en: 'El Salvador', ko: '엘살바도르' },
  'FK': { en: 'Falkland Islands', ko: '포클랜드 제도' },
  'GF': { en: 'French Guiana', ko: '프랑스령 기아나' },
  'GL': { en: 'Greenland', ko: '그린란드' },
  'GD': { en: 'Grenada', ko: '그레나다' },
  'GP': { en: 'Guadeloupe', ko: '과들루프' },
  'GT': { en: 'Guatemala', ko: '과테말라' },
  'GY': { en: 'Guyana', ko: '가이아나' },
  'HT': { en: 'Haiti', ko: '아이티' },
  'HN': { en: 'Honduras', ko: '온두라스' },
  'JM': { en: 'Jamaica', ko: '자메이카' },
  'MQ': { en: 'Martinique', ko: '마르티니크' },
  'MX': { en: 'Mexico', ko: '멕시코' },
  'MS': { en: 'Montserrat', ko: '몬트세랫' },
  'NI': { en: 'Nicaragua', ko: '니카라과' },
  'PA': { en: 'Panama', ko: '파나마' },
  'PY': { en: 'Paraguay', ko: '파라과이' },
  'PE': { en: 'Peru', ko: '페루' },
  'PR': { en: 'Puerto Rico', ko: '푸에르토리코' },
  'BL': { en: 'Saint Barthelemy', ko: '생바르텔레미' },
  'KN': { en: 'Saint Kitts and Nevis', ko: '세인트키츠네비스' },
  'LC': { en: 'Saint Lucia', ko: '세인트루시아' },
  'MF': { en: 'Saint Martin', ko: '세인트마틴' },
  'PM': { en: 'Saint Pierre and Miquelon', ko: '생피에르미클롱' },
  'VC': { en: 'Saint Vincent and the Grenadines', ko: '세인트빈센트그레나딘' },
  'SX': { en: 'Sint Maarten', ko: '신트마르턴' },
  'SR': { en: 'Suriname', ko: '수리남' },
  'TT': { en: 'Trinidad and Tobago', ko: '트리니다드토바고' },
  'TC': { en: 'Turks and Caicos Islands', ko: '터크스케이커스 제도' },
  'US': { en: 'United States', ko: '미국' },
  'VI': { en: 'U.S. Virgin Islands', ko: '미국령 버진아일랜드' },
  'UY': { en: 'Uruguay', ko: '우루과이' },
  'VE': { en: 'Venezuela', ko: '베네수엘라' },
  // Asia
  'AF': { en: 'Afghanistan', ko: '아프가니스탄' },
  'AM': { en: 'Armenia', ko: '아르메니아' },
  'AZ': { en: 'Azerbaijan', ko: '아제르바이잔' },
  'BH': { en: 'Bahrain', ko: '바레인' },
  'BD': { en: 'Bangladesh', ko: '방글라데시' },
  'BT': { en: 'Bhutan', ko: '부탄' },
  'BN': { en: 'Brunei', ko: '브루나이' },
  'KH': { en: 'Cambodia', ko: '캄보디아' },
  'CN': { en: 'China', ko: '중국' },
  'GE': { en: 'Georgia', ko: '조지아' },
  'HK': { en: 'Hong Kong', ko: '홍콩' },
  'IN': { en: 'India', ko: '인도' },
  'ID': { en: 'Indonesia', ko: '인도네시아' },
  'IR': { en: 'Iran', ko: '이란' },
  'IQ': { en: 'Iraq', ko: '이라크' },
  'IL': { en: 'Israel', ko: '이스라엘' },
  'JP': { en: 'Japan', ko: '일본' },
  'JO': { en: 'Jordan', ko: '요르단' },
  'KZ': { en: 'Kazakhstan', ko: '카자흐스탄' },
  'KP': { en: 'North Korea', ko: '북한' },
  'KW': { en: 'Kuwait', ko: '쿠웨이트' },
  'KG': { en: 'Kyrgyzstan', ko: '키르기스스탄' },
  'LA': { en: 'Laos', ko: '라오스' },
  'LB': { en: 'Lebanon', ko: '레바논' },
  'MO': { en: 'Macao', ko: '마카오' },
  'MY': { en: 'Malaysia', ko: '말레이시아' },
  'MV': { en: 'Maldives', ko: '몰디브' },
  'MN': { en: 'Mongolia', ko: '몽골' },
  'MM': { en: 'Myanmar', ko: '미얀마' },
  'NP': { en: 'Nepal', ko: '네팔' },
  'PS': { en: 'Palestine', ko: '팔레스타인' },
  'OM': { en: 'Oman', ko: '오만' },
  'PK': { en: 'Pakistan', ko: '파키스탄' },
  'PH': { en: 'Philippines', ko: '필리핀' },
  'QA': { en: 'Qatar', ko: '카타르' },
  'KR': { en: 'South Korea', ko: '대한민국' },
  'SA': { en: 'Saudi Arabia', ko: '사우디아라비아' },
  'SG': { en: 'Singapore', ko: '싱가포르' },
  'LK': { en: 'Sri Lanka', ko: '스리랑카' },
  'SY': { en: 'Syria', ko: '시리아' },
  'TW': { en: 'Taiwan', ko: '대만' },
  'TJ': { en: 'Tajikistan', ko: '타지키스탄' },
  'TH': { en: 'Thailand', ko: '태국' },
  'TL': { en: 'Timor-Leste', ko: '동티모르' },
  'TR': { en: 'Turkey', ko: '터키' },
  'TM': { en: 'Turkmenistan', ko: '투르크메니스탄' },
  'AE': { en: 'United Arab Emirates', ko: '아랍에미리트' },
  'UZ': { en: 'Uzbekistan', ko: '우즈베키스탄' },
  'VN': { en: 'Vietnam', ko: '베트남' },
  'YE': { en: 'Yemen', ko: '예멘' },
  // Europe  
  'AX': { en: 'Aland Islands', ko: '올란드 제도' },
  'AL': { en: 'Albania', ko: '알바니아' },
  'AD': { en: 'Andorra', ko: '안도라' },
  'AT': { en: 'Austria', ko: '오스트리아' },
  'BY': { en: 'Belarus', ko: '벨라루스' },
  'BE': { en: 'Belgium', ko: '벨기에' },
  'BA': { en: 'Bosnia and Herzegovina', ko: '보스니아 헤르체고비나' },
  'BG': { en: 'Bulgaria', ko: '불가리아' },
  'HR': { en: 'Croatia', ko: '크로아티아' },
  'CY': { en: 'Cyprus', ko: '키프로스' },
  'CZ': { en: 'Czech Republic', ko: '체코' },
  'DK': { en: 'Denmark', ko: '덴마크' },
  'EE': { en: 'Estonia', ko: '에스토니아' },
  'FO': { en: 'Faroe Islands', ko: '페로 제도' },
  'FI': { en: 'Finland', ko: '핀란드' },
  'FR': { en: 'France', ko: '프랑스' },
  'DE': { en: 'Germany', ko: '독일' },
  'GI': { en: 'Gibraltar', ko: '지브롤터' },
  'GR': { en: 'Greece', ko: '그리스' },
  'GG': { en: 'Guernsey', ko: '건지' },
  'VA': { en: 'Vatican City', ko: '바티칸' },
  'HU': { en: 'Hungary', ko: '헝가리' },
  'IS': { en: 'Iceland', ko: '아이슬란드' },
  'IE': { en: 'Ireland', ko: '아일랜드' },
  'IM': { en: 'Isle of Man', ko: '맨 섬' },
  'IT': { en: 'Italy', ko: '이탈리아' },
  'JE': { en: 'Jersey', ko: '저지' },
  'LV': { en: 'Latvia', ko: '라트비아' },
  'LI': { en: 'Liechtenstein', ko: '리히텐슈타인' },
  'LT': { en: 'Lithuania', ko: '리투아니아' },
  'LU': { en: 'Luxembourg', ko: '룩셈부르크' },
  'MK': { en: 'Macedonia', ko: '마케도니아' },
  'MT': { en: 'Malta', ko: '몰타' },
  'MC': { en: 'Monaco', ko: '모나코' },
  'ME': { en: 'Montenegro', ko: '몬테네그로' },
  'NL': { en: 'Netherlands', ko: '네덜란드' },
  'NO': { en: 'Norway', ko: '노르웨이' },
  'PL': { en: 'Poland', ko: '폴란드' },
  'PT': { en: 'Portugal', ko: '포르투갈' },
  'MD': { en: 'Moldova', ko: '몰도바' },
  'RO': { en: 'Romania', ko: '루마니아' },
  'RU': { en: 'Russia', ko: '러시아' },
  'SM': { en: 'San Marino', ko: '산마리노' },
  'RS': { en: 'Serbia', ko: '세르비아' },
  'SK': { en: 'Slovakia', ko: '슬로바키아' },
  'SI': { en: 'Slovenia', ko: '슬로베니아' },
  'ES': { en: 'Spain', ko: '스페인' },
  'SJ': { en: 'Svalbard', ko: '스발바르' },
  'SE': { en: 'Sweden', ko: '스웨덴' },
  'CH': { en: 'Switzerland', ko: '스위스' },
  'UA': { en: 'Ukraine', ko: '우크라이나' },
  'GB': { en: 'United Kingdom', ko: '영국' },
  // Oceania
  'AS': { en: 'American Samoa', ko: '아메리칸사모아' },
  'AQ': { en: 'Antarctica', ko: '남극' },
  'AU': { en: 'Australia', ko: '호주' },
  'BV': { en: 'Bouvet Island', ko: '부베 섬' },
  'IO': { en: 'British Indian Ocean Territory', ko: '영국령 인도양 지역' },
  'CX': { en: 'Christmas Island', ko: '크리스마스 섬' },
  'CC': { en: 'Cocos Islands', ko: '코코스 제도' },
  'CK': { en: 'Cook Islands', ko: '쿡 제도' },
  'FJ': { en: 'Fiji', ko: '피지' },
  'PF': { en: 'French Polynesia', ko: '프랑스령 폴리네시아' },
  'TF': { en: 'French Southern Territories', ko: '프랑스령 남방 및 남극' },
  'GU': { en: 'Guam', ko: '괌' },
  'HM': { en: 'Heard and McDonald Islands', ko: '허드 맥도널드 제도' },
  'KI': { en: 'Kiribati', ko: '키리바시' },
  'MH': { en: 'Marshall Islands', ko: '마샬 제도' },
  'FM': { en: 'Micronesia', ko: '미크로네시아' },
  'NR': { en: 'Nauru', ko: '나우루' },
  'NC': { en: 'New Caledonia', ko: '뉴칼레도니아' },
  'NZ': { en: 'New Zealand', ko: '뉴질랜드' },
  'NU': { en: 'Niue', ko: '니우에' },
  'NF': { en: 'Norfolk Island', ko: '노퍽 섬' },
  'MP': { en: 'Northern Mariana Islands', ko: '북마리아나 제도' },
  'PW': { en: 'Palau', ko: '팔라우' },
  'PG': { en: 'Papua New Guinea', ko: '파푸아뉴기니' },
  'PN': { en: 'Pitcairn', ko: '핏케언' },
  'WS': { en: 'Samoa', ko: '사모아' },
  'SB': { en: 'Solomon Islands', ko: '솔로몬 제도' },
  'GS': { en: 'South Georgia', ko: '사우스조지아' },
  'TK': { en: 'Tokelau', ko: '토켈라우' },
  'TO': { en: 'Tonga', ko: '통가' },
  'TV': { en: 'Tuvalu', ko: '투발루' },
  'UM': { en: 'U.S. Minor Outlying Islands', ko: '미국령 군소 제도' },
  'VU': { en: 'Vanuatu', ko: '바누아투' },
  'WF': { en: 'Wallis and Futuna', ko: '왈리스 푸투나' }
}

// Contributor Modal Component
function ContributorModal({ 
  isOpen, 
  onClose, 
  onSave 
}: { 
  isOpen: boolean
  onClose: () => void
  onSave: (contributor: Contributor) => void
}) {
  const language = useSafeStore(useLanguageStore, (state) => state.language)
  const [name, setName] = useState('')
  const [translations, setTranslations] = useState<ContributorTranslation[]>([])
  const [selectedRoles, setSelectedRoles] = useState<ContributorRole[]>([])
  const [selectedInstruments, setSelectedInstruments] = useState<string[]>([])
  const [instrumentSearch, setInstrumentSearch] = useState('')
  const [roleSearch, setRoleSearch] = useState('')
  const [appleMusicUrl, setAppleMusicUrl] = useState('')
  const [spotifyUrl, setSpotifyUrl] = useState('')
  const [showRoleSelector, setShowRoleSelector] = useState(false)
  const [showInstrumentSelector, setShowInstrumentSelector] = useState(false)
  const roleButtonRef = useRef<HTMLButtonElement>(null)
  const instrumentButtonRef = useRef<HTMLButtonElement>(null)

  // Check if the role requires instrument information
  const instrumentRoles: ContributorRole[] = [
    'performer', 'studio_musician', 'soloist', 'orchestra', 'ensemble', 
    'band', 'guest_vocals', 'contributing_artist'
  ]
  
  const showInstrumentField = selectedRoles.some(role => instrumentRoles.includes(role))
  
  // Filter instruments based on search
  const filteredInstruments = useMemo(() => {
    if (!instrumentSearch) return instrumentList
    const searchLower = instrumentSearch.toLowerCase()
    return instrumentList.filter(instrument => 
      instrument.toLowerCase().includes(searchLower)
    )
  }, [instrumentSearch])
  
  // Filter roles based on search
  const filteredRoles = useMemo(() => {
    if (!roleSearch) return roleOptions
    const searchLower = roleSearch.toLowerCase()
    return roleOptions.filter(role => 
      role.label.toLowerCase().includes(searchLower) || 
      role.labelEn.toLowerCase().includes(searchLower) ||
      role.value.toLowerCase().includes(searchLower)
    )
  }, [roleSearch])
  
  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (roleButtonRef.current && !roleButtonRef.current.contains(event.target as Node)) {
        setShowRoleSelector(false)
      }
      if (instrumentButtonRef.current && !instrumentButtonRef.current.contains(event.target as Node)) {
        setShowInstrumentSelector(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleRoleToggle = (role: ContributorRole) => {
    if (selectedRoles.includes(role)) {
      setSelectedRoles(selectedRoles.filter(r => r !== role))
    } else {
      setSelectedRoles([...selectedRoles, role])
    }
  }

  const handleInstrumentToggle = (instrument: string) => {
    if (selectedInstruments.includes(instrument)) {
      setSelectedInstruments(selectedInstruments.filter(i => i !== instrument))
    } else {
      setSelectedInstruments([...selectedInstruments, instrument])
    }
  }

  const handleSave = () => {
    if (!name.trim() || selectedRoles.length === 0) return
    
    const contributor: Contributor = {
      id: uuidv4(),
      name: name.trim(),
      translations: translations.filter(t => t.language && t.name),
      roles: selectedRoles,
      instruments: selectedInstruments.length > 0 ? selectedInstruments : undefined,
      appleMusicUrl: appleMusicUrl.trim() || undefined,
      spotifyUrl: spotifyUrl.trim() || undefined
    }
    
    onSave(contributor)
    setName('')
    setTranslations([])
    setSelectedRoles([])
    setSelectedInstruments([])
    setAppleMusicUrl('')
    setSpotifyUrl('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          {language === 'ko' ? '기여자 추가' : 'Add Contributor'}
        </h3>

        {/* Spotify Policy Notice */}
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                {language === 'ko' ? 'Spotify 정책 안내' : 'Spotify Policy Notice'}
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-300">
                {language === 'ko' 
                  ? '작곡가와 작사가는 반드시 "이름 성" 형식으로 작성해야 합니다. (예: John Smith, 홍 길동)'
                  : 'Composers and Lyricists must be written in "First Last" format (e.g., John Smith)'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Required Contributor Notice */}
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                {language === 'ko' ? '필수 기여자' : 'Required Contributors'}
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                {language === 'ko' 
                  ? '작곡가(Composer), 작사가(Lyricist), 실연자(Performing Artist)는 반드시 등록해야 합니다.'
                  : 'Composer, Lyricist, and Performing Artist must be registered.'
                }
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Name Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {language === 'ko' ? '이름' : 'Name'} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-n3rve-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder={language === 'ko' 
                ? 'John Smith 또는 길동 홍' 
                : 'John Smith or Gildong Hong'
              }
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {language === 'ko' 
                ? '* 작곡가/작사가는 "이름 성" 형식을 지켜주세요'
                : '* Composers/Lyricists must use "First Last" format'
              }
            </p>
          </div>

          {/* Name Translations */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {language === 'ko' ? '이름 번역' : 'Name Translations'}
              </label>
              <button
                type="button"
                onClick={() => {
                  setTranslations([...translations, { language: '', name: '' }])
                }}
                className="text-sm text-n3rve-main hover:text-n3rve-700 dark:text-n3rve-accent2 dark:hover:text-n3rve-300"
              >
                <Plus className="w-4 h-4 inline mr-1" />
                {language === 'ko' ? '번역 추가' : 'Add Translation'}
              </button>
            </div>
            {translations.length > 0 ? (
              <div className="space-y-2">
                {translations.map((translation, index) => (
                  <div key={index} className="flex gap-2">
                    <select
                      value={translation.language}
                      onChange={(e) => {
                        const newTranslations = [...translations]
                        newTranslations[index] = { ...translation, language: e.target.value }
                        setTranslations(newTranslations)
                      }}
                      className="w-1/3 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-n3rve-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                    >
                      <option value="">{language === 'ko' ? '언어 선택' : 'Select Language'}</option>
                      <optgroup label={language === 'ko' ? '주요 언어' : 'Major Languages'}>
                        {languageOptions.slice(0, 12).map(lang => (
                          <option key={lang.value} value={lang.value}>{lang.label}</option>
                        ))}
                      </optgroup>
                      <optgroup label={language === 'ko' ? '아시아 언어' : 'Asian Languages'}>
                        {languageOptions.slice(12, 26).map(lang => (
                          <option key={lang.value} value={lang.value}>{lang.label}</option>
                        ))}
                      </optgroup>
                      <optgroup label={language === 'ko' ? '유럽 언어' : 'European Languages'}>
                        {languageOptions.slice(26, 45).map(lang => (
                          <option key={lang.value} value={lang.value}>{lang.label}</option>
                        ))}
                      </optgroup>
                      <optgroup label={language === 'ko' ? '기타 언어' : 'Other Languages'}>
                        {languageOptions.slice(45).map(lang => (
                          <option key={lang.value} value={lang.value}>{lang.label}</option>
                        ))}
                      </optgroup>
                    </select>
                    <input
                      type="text"
                      value={translation.name}
                      onChange={(e) => {
                        const newTranslations = [...translations]
                        newTranslations[index] = { ...translation, name: e.target.value }
                        setTranslations(newTranslations)
                      }}
                      placeholder={language === 'ko' ? '번역된 이름' : 'Translated Name'}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-n3rve-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                      disabled={!translation.language}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setTranslations(translations.filter((_, i) => i !== index))
                      }}
                      className="p-2 text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {language === 'ko' 
                  ? '다양한 언어로 기여자 이름을 번역할 수 있습니다'
                  : 'You can translate contributor names into multiple languages'
                }
              </p>
            )}
          </div>

          {/* Roles Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {language === 'ko' ? '역할' : 'Roles'} <span className="text-red-500">*</span>
            </label>
            <div className="relative" ref={roleButtonRef}>
              <button
                type="button"
                onClick={() => setShowRoleSelector(!showRoleSelector)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-n3rve-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-left flex items-center justify-between"
              >
                <span>
                  {selectedRoles.length === 0 
                    ? (language === 'ko' ? '역할을 선택하세요' : 'Select roles')
                    : `${selectedRoles.length}개 선택됨`
                  }
                </span>
                <ChevronRight className={`w-5 h-5 transition-transform ${showRoleSelector ? 'rotate-90' : ''}`} />
              </button>
              
              {showRoleSelector && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-96 overflow-hidden">
                  {/* Search Input */}
                  <div className="sticky top-0 p-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={roleSearch}
                        onChange={(e) => setRoleSearch(e.target.value)}
                        placeholder={language === 'ko' ? '역할 검색...' : 'Search roles...'}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-n3rve-accent focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        onClick={(e) => e.stopPropagation()}
                      />
                      {roleSearch && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setRoleSearch('')
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      {filteredRoles.length} {language === 'ko' ? '개 역할' : 'roles'} 
                      {roleSearch && (language === 'ko' ? ' 검색됨' : ' found')}
                    </div>
                  </div>
                  
                  <div className="p-4 space-y-4 overflow-y-auto max-h-80">
                    {filteredRoles.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                        {language === 'ko' ? '검색 결과가 없습니다' : 'No roles found'}
                      </p>
                    ) : roleSearch ? (
                      /* Show all filtered results without categories when searching */
                      <div className="grid grid-cols-2 gap-2">
                        {filteredRoles.map(role => (
                          <label key={role.value} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded">
                            <input
                              type="checkbox"
                              checked={selectedRoles.includes(role.value)}
                              onChange={() => handleRoleToggle(role.value)}
                              className="w-4 h-4 text-n3rve-main bg-gray-100 border-gray-300 rounded focus:ring-n3rve-500"
                            />
                            <span className="text-sm">{language === 'ko' ? role.label : role.labelEn}</span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <>
                        {/* Production Roles */}
                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                            {language === 'ko' ? '프로덕션' : 'Production'}
                          </h4>
                          <div className="grid grid-cols-2 gap-2">
                            {roleOptions.filter(r => [
                          'composer', 'lyricist', 'arranger', 'producer', 'co_producer', 
                          'executive_producer', 'assistant_producer', 'post_producer', 'vocal_producer'
                        ].includes(r.value)).map(role => (
                          <label key={role.value} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded">
                            <input
                              type="checkbox"
                              checked={selectedRoles.includes(role.value)}
                              onChange={() => handleRoleToggle(role.value)}
                              className="w-4 h-4 text-n3rve-main bg-gray-100 border-gray-300 rounded focus:ring-n3rve-500"
                            />
                            <span className="text-sm">{language === 'ko' ? role.label : role.labelEn}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Engineering Roles */}
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                        {language === 'ko' ? '엔지니어링' : 'Engineering'}
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {roleOptions.filter(r => r.value.includes('engineer') || r.value === 'tonmeister').map(role => (
                          <label key={role.value} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded">
                            <input
                              type="checkbox"
                              checked={selectedRoles.includes(role.value)}
                              onChange={() => handleRoleToggle(role.value)}
                              className="w-4 h-4 text-n3rve-main bg-gray-100 border-gray-300 rounded focus:ring-n3rve-500"
                            />
                            <span className="text-sm">{language === 'ko' ? role.label : role.labelEn}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Performance Roles */}
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                        {language === 'ko' ? '연주/공연' : 'Performance'}
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {roleOptions.filter(r => [
                          'performer', 'studio_musician', 'soloist', 'conductor', 'orchestra',
                          'choir', 'chorus', 'ensemble', 'band', 'featuring', 'guest_vocals', 
                          'contributing_artist', 'assistant_conductor', 'strings_conductor',
                          'choir_conductor', 'chorus_master', 'musical_director'
                        ].includes(r.value)).map(role => (
                          <label key={role.value} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded">
                            <input
                              type="checkbox"
                              checked={selectedRoles.includes(role.value)}
                              onChange={() => handleRoleToggle(role.value)}
                              className="w-4 h-4 text-n3rve-main bg-gray-100 border-gray-300 rounded focus:ring-n3rve-500"
                            />
                            <span className="text-sm">{language === 'ko' ? role.label : role.labelEn}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    
                    {/* Vocal Roles */}
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                        {language === 'ko' ? '보컬' : 'Vocals'}
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {roleOptions.filter(r => [
                          'rap', 'mc', 'spoken_word', 'narrator', 'vocal_effects'
                        ].includes(r.value)).map(role => (
                          <label key={role.value} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded">
                            <input
                              type="checkbox"
                              checked={selectedRoles.includes(role.value)}
                              onChange={() => handleRoleToggle(role.value)}
                              className="w-4 h-4 text-n3rve-main bg-gray-100 border-gray-300 rounded focus:ring-n3rve-500"
                            />
                            <span className="text-sm">{language === 'ko' ? role.label : role.labelEn}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    
                    {/* Writing Roles */}
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                        {language === 'ko' ? '작가/저자' : 'Writing'}
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {roleOptions.filter(r => [
                          'orchestrator', 'adapter', 'writer', 'author', 'playwright', 
                          'librettist', 'translator', 'liner_notes'
                        ].includes(r.value)).map(role => (
                          <label key={role.value} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded">
                            <input
                              type="checkbox"
                              checked={selectedRoles.includes(role.value)}
                              onChange={() => handleRoleToggle(role.value)}
                              className="w-4 h-4 text-n3rve-main bg-gray-100 border-gray-300 rounded focus:ring-n3rve-500"
                            />
                            <span className="text-sm">{language === 'ko' ? role.label : role.labelEn}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    
                    {/* Technical Roles */}
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                        {language === 'ko' ? '기술' : 'Technical'}
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {roleOptions.filter(r => [
                          'programmer', 'dj', 'remixer', 'sampled_artist', 'mixer', 'editor',
                          'sound_editor', 'sound_effects', 'special_effects', 'computer_graphic_creator',
                          'visual_effects_technician'
                        ].includes(r.value)).map(role => (
                          <label key={role.value} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded">
                            <input
                              type="checkbox"
                              checked={selectedRoles.includes(role.value)}
                              onChange={() => handleRoleToggle(role.value)}
                              className="w-4 h-4 text-n3rve-main bg-gray-100 border-gray-300 rounded focus:ring-n3rve-500"
                            />
                            <span className="text-sm">{language === 'ko' ? role.label : role.labelEn}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    
                    {/* Video/Film Roles */}
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                        {language === 'ko' ? '비디오/영화' : 'Video/Film'}
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {roleOptions.filter(r => [
                          'director', 'assistant_director', 'creative_director', 'art_direction',
                          'video_director', 'video_producer', 'cinematographer', 'camera_operator',
                          'lighting_director', 'gaffer', 'key_grip'
                        ].includes(r.value)).map(role => (
                          <label key={role.value} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded">
                            <input
                              type="checkbox"
                              checked={selectedRoles.includes(role.value)}
                              onChange={() => handleRoleToggle(role.value)}
                              className="w-4 h-4 text-n3rve-main bg-gray-100 border-gray-300 rounded focus:ring-n3rve-500"
                            />
                            <span className="text-sm">{language === 'ko' ? role.label : role.labelEn}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    
                    {/* Other Creative Roles */}
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                        {language === 'ko' ? '기타 창작' : 'Other Creative'}
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {roleOptions.filter(r => [
                          'choreographer', 'dancer', 'actor', 'costume_designer', 'set_designer'
                        ].includes(r.value)).map(role => (
                          <label key={role.value} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded">
                            <input
                              type="checkbox"
                              checked={selectedRoles.includes(role.value)}
                              onChange={() => handleRoleToggle(role.value)}
                              className="w-4 h-4 text-n3rve-main bg-gray-100 border-gray-300 rounded focus:ring-n3rve-500"
                            />
                            <span className="text-sm">{language === 'ko' ? role.label : role.labelEn}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    
                    {/* Management/Admin Roles */}
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                        {language === 'ko' ? '관리/행정' : 'Management/Admin'}
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {roleOptions.filter(r => [
                          'a&r_administrator', 'a&r_manager', 'artist_management', 'agent',
                          'production_assistant', 'studio_personnel'
                        ].includes(r.value)).map(role => (
                          <label key={role.value} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded">
                            <input
                              type="checkbox"
                              checked={selectedRoles.includes(role.value)}
                              onChange={() => handleRoleToggle(role.value)}
                              className="w-4 h-4 text-n3rve-main bg-gray-100 border-gray-300 rounded focus:ring-n3rve-500"
                            />
                            <span className="text-sm">{language === 'ko' ? role.label : role.labelEn}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Selected Roles Display */}
            {selectedRoles.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedRoles.map(role => {
                  const roleOption = roleOptions.find(r => r.value === role)
                  return (
                    <span key={role} className="inline-flex items-center gap-1 px-3 py-1 bg-n3rve-100 dark:bg-n3rve-900/30 text-n3rve-800 dark:text-n3rve-200 rounded-full text-sm">
                      {language === 'ko' ? roleOption?.label : roleOption?.labelEn}
                      <button
                        onClick={() => handleRoleToggle(role)}
                        className="text-n3rve-main hover:text-n3rve-800 dark:text-n3rve-accent2 dark:hover:text-n3rve-200"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )
                })}
              </div>
            )}
          </div>

          {/* Instruments Selection */}
          <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {language === 'ko' ? '악기' : 'Instruments'}
              </label>
              <div className="relative" ref={instrumentButtonRef}>
                <button
                  type="button"
                  onClick={() => setShowInstrumentSelector(!showInstrumentSelector)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-n3rve-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-left flex items-center justify-between"
                >
                  <span>
                    {selectedInstruments.length === 0 
                      ? (language === 'ko' ? '악기를 선택하세요' : 'Select instruments')
                      : `${selectedInstruments.length}개 선택됨`
                    }
                  </span>
                  <ChevronRight className={`w-5 h-5 transition-transform ${showInstrumentSelector ? 'rotate-90' : ''}`} />
                </button>
                
                {showInstrumentSelector && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-96 overflow-y-auto">
                    <div className="p-3">
                      {/* Search */}
                      <div className="relative mb-3">
                        <input
                          type="text"
                          value={instrumentSearch}
                          onChange={(e) => setInstrumentSearch(e.target.value)}
                          className="w-full px-3 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-n3rve-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                          placeholder={language === 'ko' ? '악기 검색...' : 'Search instruments...'}
                        />
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                      </div>
                      
                      {/* Instrument List */}
                      <div className="grid grid-cols-2 gap-1 max-h-80 overflow-y-auto">
                        {filteredInstruments.map((instrument, index) => (
                          <label key={index} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded">
                            <input
                              type="checkbox"
                              checked={selectedInstruments.includes(instrument)}
                              onChange={() => handleInstrumentToggle(instrument)}
                              className="w-4 h-4 text-n3rve-main bg-gray-100 border-gray-300 rounded focus:ring-n3rve-500"
                            />
                            <span className="text-sm">{instrument}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Selected Instruments Display */}
              {selectedInstruments.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedInstruments.map(instrument => (
                    <span key={instrument} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-sm">
                      <Music2 className="w-3 h-3" />
                      {instrument}
                      <button
                        onClick={() => handleInstrumentToggle(instrument)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

          {/* Platform Links */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {language === 'ko' ? '플랫폼 링크 (선택사항)' : 'Platform Links (Optional)'}
            </h4>
            
            {/* Apple Music Link */}
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                Apple Music
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.994 6.124a9.23 9.23 0 00-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043-1.054-.69-2.317-.905-3.614-.937-2.139-.05-4.288-.017-6.426-.017h-1.3c-1.866 0-3.739-.003-5.606.006-1.36.009-2.667.195-3.89.776C.196 1.113-.26 1.872.08 3.184c.066.257.135.515.227.763.51 1.378 1.47 2.335 2.83 2.785.912.3 1.872.423 2.832.449 1.665.045 3.33.018 4.995.018h1.662c1.962 0 3.924.006 5.886-.004 1.375-.007 2.696-.189 3.918-.772 1.558-.745 2.408-1.982 2.501-3.633.025-.44.026-.88-.009-1.32l.002.002zm-3.205 2.76c-.316.51-.788.849-1.405 1.016-.619.167-1.269.205-1.909.212-1.963.021-3.926.009-5.889.009h-1.618c-1.87 0-3.74.012-5.61-.006-.967-.009-1.925-.106-2.837-.4-.914-.295-1.59-.844-1.962-1.754-.247-.603-.166-1.226.144-1.793.324-.596.827-.976 1.508-1.19.679-.213 1.39-.27 2.095-.277 1.968-.021 3.936-.009 5.903-.009h1.584c1.952 0 3.904-.011 5.856.004.996.008 1.983.108 2.9.413.922.306 1.603.87 1.961 1.79.24.616.156 1.244-.162 1.821l.002.002zm-1.504-1.377c-.143-.357-.432-.613-.82-.713a3.104 3.104 0 00-.986-.065v5.817c0 .457-.066.892-.345 1.24-.278.35-.657.55-1.09.584-.79.061-1.407-.373-1.557-1.149a2.301 2.301 0 01-.033-.545V6.915a.664.664 0 00-.002-.05c-.225.006-.45.003-.674.012a2.552 2.552 0 00-.49.06c-.503.122-.836.5-.978.99a2.167 2.167 0 00-.065.615v3.896c0 .692.058 1.373.434 1.967.376.595.932.966 1.606 1.131.849.208 1.68.106 2.378-.437.703-.547 1.087-1.3 1.179-2.194.048-.462.037-.927.037-1.392V8.564c0-.761-.062-1.503-.62-2.07v.001z"/>
                  </svg>
                </div>
                <input
                  type="url"
                  value={appleMusicUrl}
                  onChange={(e) => setAppleMusicUrl(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-n3rve-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                  placeholder="https://music.apple.com/..."
                />
              </div>
            </div>
            
            {/* Spotify Link */}
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                Spotify
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                  </svg>
                </div>
                <input
                  type="url"
                  value={spotifyUrl}
                  onChange={(e) => setSpotifyUrl(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-n3rve-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                  placeholder="https://open.spotify.com/..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Required Fields Notice */}
        <div className="mt-6 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">
                {language === 'ko' ? '필수 기여자' : 'Required Contributors'}
              </p>
              <ul className="space-y-0.5">
                <li>• {language === 'ko' ? '작곡가 (Composer) 1명 이상' : 'At least 1 Composer'}</li>
                <li>• {language === 'ko' ? '작사가 (Lyricist) 1명 이상' : 'At least 1 Lyricist'}</li>
                <li>• {language === 'ko' ? '연주자 (Performing Artist) 1명 이상' : 'At least 1 Performing Artist'}</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={() => {
              setName('')
              setSelectedRoles([])
              setSelectedInstruments([])
              setAppleMusicUrl('')
              setSpotifyUrl('')
              onClose()
            }}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            {language === 'ko' ? '취소' : 'Cancel'}
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || selectedRoles.length === 0}
            className="px-4 py-2 bg-n3rve-main hover:bg-n3rve-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {language === 'ko' ? '추가' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Instrument list
const instrumentList = [
  'String Bass Guitar', 'String Guitar', 'String Acoustic Guitar', 'String Electric Guitar',
  'String Fiddle', 'String Banjo', 'Accordion', 'Acoustic Baritone Guitar', 'Acoustic Bass Guitar',
  'Acoustic Fretless Guitar', 'Acoustic Guitar', 'Alto Clarinet', 'Alto Flute', 'Alto Horn',
  'Alto Recorder', 'Alto Saxophone', 'Alto Trombone', 'Alto Violin', 'Alto Vocals',
  'Appalachian Dulcimer', 'Archlute', 'Autoharp', 'Background Vocals', 'Baglama', 'Bagpipes',
  'Balafon', 'Balalaika', 'Bandoneon', 'Bandurria', 'Banjo', 'Bansuri', 'Barbat',
  'Baritone Guitar', 'Baritone Horn', 'Baritone Vocals', 'Baroque Guitar', 'Baroque Violin',
  'Barrel Organ', 'Bass', 'Bass Clarinet', 'Bass Drum', 'Bass Flute', 'Bass Harmonica',
  'Bass Oboe', 'Bass Recorder', 'Bass Saxophone', 'Bass Trombone', 'Bass Trumpet',
  'Bass Vocals', 'Basset Clarinet', 'Basset Horn', 'Bassoon', 'Bata Drums', 'Beat Boxing',
  'Bells', 'Bendir', 'Berimbau', 'Biwa', 'Bonang', 'Bongos', 'Bouzouki', 'Bugle',
  'Button Accordion', 'C-Melody Sax', 'Cajon', 'Calliope', 'Castanets', 'Cavaquinho',
  'Caxixi', 'Celeste', 'Cello', 'Chamber Organ', 'Chamberlin', 'Chant Vocals',
  'Chapman Stick', 'Charango', 'Chekere', 'Chest Organ', 'Chimes', 'Chromatic Harmonica',
  'Cimbalom', 'Cittern', 'Clarinet', 'Classical Guitar', 'Claves', 'Clavichord',
  'Clavinet', 'Concert Harp', 'Concertina', 'Conch Shells', 'Congas', 'Contrabass',
  'Contrabass Clarinet', 'Contrabass Flute', 'Contrabass Recorder', 'Contrabass Sarrusophone',
  'Contrabass Saxophone', 'Contrabass Trombone', 'Contrabassoon', 'Contralto Clarinet',
  'Contralto Vocals', 'Cornet', 'Cornett', 'Counter Tenor', 'Cowbell', 'Crotales',
  'Crumhorn', 'Cuatro', 'Cuesophone', 'Curtal', 'Cymbals', 'Daf', 'Dhol', 'Diddley Bow',
  'Didgeridoo', 'Djembe', 'Dobro Guitar', 'Double Bass', 'Doumbek', 'Drum Machine',
  'Drums', 'Duduk', 'Dulcian', 'Dulcimer', 'E-Bow', 'Electric Bass Guitar',
  'Electric Cello', 'Electric Fretless Guitar', 'Electric Guitar', 'Electric Piano',
  'Electric Sitar', 'Electric Upright Bass', 'Electric Viola', 'Electric Violin',
  'Electronic Valve Instrument', 'Electronic Wind Instrument', 'English Horn', 'Euphonium',
  'Farfisa', 'Fender Rhodes', 'Fiddle', 'Fife', 'Finger Cymbals', 'Finger Snaps',
  'Flamenco Guitar', 'Flugelhorn', 'Flute', 'Fortepiano', 'Frame Drum', 'French Horn',
  'Gender', 'Ghatam', 'Gitern', 'Glockenspiel', 'Gong', 'Guro', 'Gut-String-Guitar',
  'Hag\'houge', 'Hammered Dulcimer', 'Hammond Organ', 'Handclaps', 'Hardingfele',
  'Harmonica', 'Harmonium', 'Harmony Vocals', 'Harp', 'Harpsichord', 'Horn Section',
  'Horns', 'Hurdy Gurdy', 'Kalimba', 'Karkaba', 'Kazoo', 'Kendang', 'Kenong/Kethuk',
  'Keyboard Bass', 'Keyboards', 'Keytar', 'Kora', 'Koto', 'Lap Steel Guitar', 'Low Whistle',
  'Lute', 'Lyricon', 'Mandocello', 'Mandola', 'Mandolin', 'Manzello', 'Maracas',
  'Marimba', 'Mellophone', 'Mezzo-soprano Vocals', 'Modular Synth', 'Mouth Organ',
  'Mridangam', 'Musette', 'Ney', 'Noises', 'Nylon-String-Guitar', 'Oboe', 'Oboe D\'Amore',
  'Ocarina', 'Omnichord', 'Ondes Martenot', 'Organ', 'Oud', 'Pan Flute', 'Panpipes',
  'Parlour Guitar', 'Pedal Steel Guitar', 'Peking', 'Penny Whistle', 'Percussion',
  'Piano', 'Piccolo', 'Piccolo Bass', 'Piccolo Oboe', 'Piccolo Trumpet', 'Pikasa Guitar',
  'Pipe Organ', 'Portuguese Guitar', 'Prepared Piano', 'Psaltery', 'Rebab', 'Rebec',
  'Recorder', 'Reed Organ', 'Requinto Guitar', 'Rhodes Piano', 'Rhythm Guitar',
  'Sackbut', 'Sampler', 'Santoor', 'Santur', 'Sarangi', 'Sarod', 'Saron', 'Sarrusophone',
  'Saxello', 'Saxophone', 'Saz', 'Serpent', 'Shakers', 'Shakuhachi', 'Shamisen',
  'Shawm', 'Shekere', 'Shenai', 'Sheng', 'Sitar', 'Sleigh Bells', 'Slenthem',
  'Slide Guitar', 'Slide Saxophone', 'Slide Trumpet', 'Slide Whistle', 'Snare Drum',
  'Sopranino Clarinet', 'Sopranino Saxophone', 'Soprano', 'Soprano Clarinet',
  'Soprano Flute', 'Soprano Recorder', 'Soprano Saxophone', 'Soprano Violin',
  'Soprano Vocals', 'Sousaphone', 'Spanish Guitar', 'Spinet', 'Spoons', 'Steel Drums',
  'Strings', 'Stritch', 'Surdo', 'Synclavier', 'Synthesizer', 'Tabla', 'Tabor Pipe',
  'Tack Piano', 'Talkbox', 'Talking Drum', 'Tamborim', 'Tamboura', 'Tambourine',
  'Tanpura', 'Tarogato', 'Temple Blocks', 'Tenor Banjo', 'Tenor Drum', 'Tenor Guitar',
  'Tenor Horn', 'Tenor Recorder', 'Tenor Saxophone', 'Tenor Trombone', 'Tenor Violin',
  'Tenor Vocals', 'Thavil', 'Theorbo', 'Theremin', 'Timbales', 'Timpani', 'Tin Whistle',
  'Toy Piano', 'Traverso', 'Tres', 'Triangle', 'Trombone', 'Trombonium', 'Trumpet',
  'Tuba', 'Tubular Bells', 'Turntable', 'Udu', 'Uilleann Pipes', 'Ukulele',
  'Upright Piano', 'Valve Trombone', 'Venna', 'Vibraphone', 'Vibraslap', 'Vielle',
  'Viol', 'Viola', 'Viola D\'Amore', 'Viola Da Gamba', 'Violin', 'Violoncello',
  'Violone', 'Vocals', 'Vocoder', 'Washboard', 'Whistle', 'Wood Block', 'Wood Flute',
  'Wurlitzer', 'Xylophone', 'Xyloimba', 'Zarb', 'Zither'
].sort()

// Role options definition
const roleOptions: { value: ContributorRole, label: string, labelEn: string }[] = [
  // Production Roles
  { value: 'composer', label: '작곡가', labelEn: 'Composer' },
  { value: 'lyricist', label: '작사가', labelEn: 'Lyricist' },
  { value: 'arranger', label: '편곡자', labelEn: 'Arranger' },
  { value: 'producer', label: '프로듀서', labelEn: 'Producer' },
  { value: 'co_producer', label: '공동 프로듀서', labelEn: 'Co-Producer' },
  { value: 'executive_producer', label: '총괄 프로듀서', labelEn: 'Executive Producer' },
  { value: 'assistant_producer', label: '어시스턴트 프로듀서', labelEn: 'Assistant Producer' },
  { value: 'post_producer', label: '포스트 프로듀서', labelEn: 'Post-Producer' },
  { value: 'vocal_producer', label: '보컬 프로듀서', labelEn: 'Vocal Producer' },
  
  // Engineering Roles
  { value: 'recording_engineer', label: '레코딩 엔지니어', labelEn: 'Recording Engineer' },
  { value: 'mixing_engineer', label: '믹싱 엔지니어', labelEn: 'Mixing Engineer' },
  { value: 'mastering_engineer', label: '마스터링 엔지니어', labelEn: 'Mastering Engineer' },
  { value: 'sound_engineer', label: '사운드 엔지니어', labelEn: 'Sound Engineer' },
  { value: 'engineer', label: '엔지니어', labelEn: 'Engineer' },
  { value: 'assistant_recording_engineer', label: '어시스턴트 레코딩 엔지니어', labelEn: 'Assistant Recording Engineer' },
  { value: 'assistant_mixing_engineer', label: '어시스턴트 믹싱 엔지니어', labelEn: 'Assistant Mixing Engineer' },
  { value: 'assistant_mastering_engineer', label: '어시스턴트 마스터링 엔지니어', labelEn: 'Assistant Mastering Engineer' },
  { value: 'assistant_sound_engineer', label: '어시스턴트 사운드 엔지니어', labelEn: 'Assistant Sound Engineer' },
  { value: 'vocal_engineer', label: '보컬 엔지니어', labelEn: 'Vocal Engineer' },
  { value: 'immersive_audio_engineer', label: '입체음향 엔지니어', labelEn: 'Immersive Audio Engineer' },
  { value: 'immersive_mixing_engineer', label: '입체음향 믹싱 엔지니어', labelEn: 'Immersive Mixing Engineer' },
  { value: 'immersive_mastering_engineer', label: '입체음향 마스터링 엔지니어', labelEn: 'Immersive Mastering Engineer' },
  { value: 'tonmeister', label: '톤마이스터', labelEn: 'Tonmeister' },
  
  // Performance Roles
  { value: 'performer', label: '연주자', labelEn: 'Performer' },
  { value: 'studio_musician', label: '스튜디오 뮤지션', labelEn: 'Studio Musician' },
  { value: 'soloist', label: '솔로이스트', labelEn: 'Soloist' },
  { value: 'conductor', label: '지휘자', labelEn: 'Conductor' },
  { value: 'orchestra', label: '오케스트라', labelEn: 'Orchestra' },
  { value: 'choir', label: '합창단', labelEn: 'Choir' },
  { value: 'chorus', label: '코러스', labelEn: 'Chorus' },
  { value: 'ensemble', label: '앙상블', labelEn: 'Ensemble' },
  { value: 'band', label: '밴드', labelEn: 'Band' },
  { value: 'featuring', label: '피처링', labelEn: 'Featuring' },
  { value: 'guest_vocals', label: '객원 보컬', labelEn: 'Guest Vocals' },
  { value: 'contributing_artist', label: '참여 아티스트', labelEn: 'Contributing Artist' },
  
  // Vocal/Rap Roles
  { value: 'rap', label: '랩', labelEn: 'Rap' },
  { value: 'mc', label: 'MC', labelEn: 'MC' },
  { value: 'narrator', label: '내레이터', labelEn: 'Narrator' },
  { value: 'spoken_word', label: '스포큰 워드', labelEn: 'Spoken Word' },
  { value: 'vocal_effects', label: '보컬 이펙트', labelEn: 'Vocal Effects' },
  
  // Direction Roles
  { value: 'director', label: '디렉터', labelEn: 'Director' },
  { value: 'assistant_director', label: '어시스턴트 디렉터', labelEn: 'Assistant Director' },
  { value: 'musical_director', label: '음악 감독', labelEn: 'Musical Director' },
  { value: 'creative_director', label: '크리에이티브 디렉터', labelEn: 'Creative Director' },
  { value: 'art_direction', label: '아트 디렉션', labelEn: 'Art Direction' },
  { value: 'choir_conductor', label: '합창단 지휘자', labelEn: 'Choir Conductor' },
  { value: 'chorus_master', label: '합창 지휘자', labelEn: 'Chorus Master' },
  { value: 'strings_conductor', label: '현악 지휘자', labelEn: 'Strings Conductor' },
  { value: 'assistant_conductor', label: '어시스턴트 지휘자', labelEn: 'Assistant Conductor' },
  
  // Composition/Arrangement Roles
  { value: 'assistant_composer', label: '어시스턴트 작곡가', labelEn: 'Assistant Composer' },
  { value: 'orchestrator', label: '오케스트레이터', labelEn: 'Orchestrator' },
  { value: 'adapter', label: '편곡자', labelEn: 'Adapter' },
  { value: 'writer', label: '작가', labelEn: 'Writer' },
  { value: 'author', label: '저자', labelEn: 'Author' },
  { value: 'playwright', label: '극작가', labelEn: 'Playwright' },
  { value: 'librettist', label: '대본 작가', labelEn: 'Librettist' },
  { value: 'translator', label: '번역가', labelEn: 'Translator' },
  { value: 'liner_notes', label: '라이너 노트', labelEn: 'Liner Notes' },
  
  // Technical Roles
  { value: 'programmer', label: '프로그래머', labelEn: 'Programmer' },
  { value: 'dj', label: 'DJ', labelEn: 'DJ' },
  { value: 'remixer', label: '리믹서', labelEn: 'Remixer' },
  { value: 'sampled_artist', label: '샘플링 아티스트', labelEn: 'Sampled Artist' },
  { value: 'mixer', label: '믹서', labelEn: 'Mixer' },
  { value: 'editor', label: '에디터', labelEn: 'Editor' },
  { value: 'sound_editor', label: '사운드 에디터', labelEn: 'Sound Editor' },
  { value: 'sound_effects', label: '음향 효과', labelEn: 'Sound Effects' },
  { value: 'special_effects', label: '특수 효과', labelEn: 'Special Effects' },
  { value: 'computer_graphic_creator', label: '컴퓨터 그래픽 크리에이터', labelEn: 'Computer Graphic Creator' },
  { value: 'visual_effects_technician', label: '시각 효과 기술자', labelEn: 'Visual Effects Technician' },
  
  // Video/Film Roles
  { value: 'video_director', label: '비디오 디렉터', labelEn: 'Video Director' },
  { value: 'video_producer', label: '비디오 프로듀서', labelEn: 'Video Producer' },
  { value: 'cinematographer', label: '촬영 감독', labelEn: 'Cinematographer' },
  { value: 'camera_operator', label: '카메라 오퍼레이터', labelEn: 'Camera Operator' },
  { value: 'lighting_director', label: '조명 감독', labelEn: 'Lighting Director' },
  { value: 'gaffer', label: '조명 기사', labelEn: 'Gaffer' },
  { value: 'key_grip', label: '키 그립', labelEn: 'Key Grip' },
  
  // Other Creative Roles
  { value: 'choreographer', label: '안무가', labelEn: 'Choreographer' },
  { value: 'dancer', label: '댄서', labelEn: 'Dancer' },
  { value: 'actor', label: '배우', labelEn: 'Actor' },
  { value: 'costume_designer', label: '의상 디자이너', labelEn: 'Costume Designer' },
  { value: 'set_designer', label: '세트 디자이너', labelEn: 'Set Designer' },
  
  // Management/Admin Roles
  { value: 'a&r_administrator', label: 'A&R 관리자', labelEn: 'A&R Administrator' },
  { value: 'a&r_manager', label: 'A&R 매니저', labelEn: 'A&R Manager' },
  { value: 'artist_management', label: '아티스트 매니지먼트', labelEn: 'Artist Management' },
  { value: 'agent', label: '에이전트', labelEn: 'Agent' },
  { value: 'production_assistant', label: '프로덕션 어시스턴트', labelEn: 'Production Assistant' },
  { value: 'studio_personnel', label: '스튜디오 스태프', labelEn: 'Studio Personnel' },
  
  // Legacy
  { value: 'tape', label: '테이프', labelEn: 'Tape' }
]

// Common timezones for music release
export default function Step3TrackInfo({ data, onNext }: Props) {
  const language = useSafeStore(useLanguageStore, (state) => state.language)
  const t = (ko: string, en: string) => language === 'ko' ? ko : en
  
  console.log('Step3TrackInfo mounted, data:', data)
  
  // Get initial tracks from previous data
  const getInitialTracks = (): Track[] => {
    // If Step3 data exists (returning to this step), use it
    if (data?.tracks?.tracks && data.tracks.tracks.length > 0) {
      return data.tracks.tracks
    }
    
    // Otherwise create initial track without artists
    // Always return at least one track
    return [{
      id: uuidv4(),
      titleKo: '',
      titleEn: '',
      artists: [],
      featuringArtists: [],
      contributors: [],
      isTitle: true
    }]
  }

  const [tracks, setTracks] = useState<Track[]>(getInitialTracks)
  const [selectedTrackId, setSelectedTrackId] = useState<string>(data?.tracks?.selectedTrackId || tracks[0]?.id || '')
  const [activeTab, setActiveTab] = useState<'metadata' | 'marketing'>(data?.tracks?.activeTab || 'metadata')
  const [metadataSubTab, setMetadataSubTab] = useState<'product' | 'asset'>(data?.tracks?.metadataSubTab || 'product')
  const [showArtistModal, setShowArtistModal] = useState(false)
  const [showContributorModal, setShowContributorModal] = useState(false)
  const [artistModalType, setArtistModalType] = useState<'main' | 'featuring'>('main')
  const [editingArtist, setEditingArtist] = useState<Artist | null>(null)
  const [editingContributor, setEditingContributor] = useState<Contributor | null>(null)
  const [keywordInput, setKeywordInput] = useState('')

  // Initialize product metadata
  const [productMetadata, setProductMetadata] = useState({
    originalReleaseDate: data?.tracks?.productMetadata?.originalReleaseDate || data?.productMetadata?.originalReleaseDate || '',
    consumerReleaseDate: data?.tracks?.productMetadata?.consumerReleaseDate || data?.productMetadata?.consumerReleaseDate || '',
    releaseTime: data?.tracks?.productMetadata?.releaseTime || data?.productMetadata?.releaseTime || '',
    selectedTimezone: data?.tracks?.productMetadata?.selectedTimezone || data?.productMetadata?.selectedTimezone || 'Asia/Seoul',
    recordingYear: data?.tracks?.productMetadata?.recordingYear || data?.productMetadata?.recordingYear || new Date().getFullYear().toString(),
    countryOfRecording: data?.tracks?.productMetadata?.countryOfRecording || data?.productMetadata?.countryOfRecording || '',
    countryOfCommissioning: data?.tracks?.productMetadata?.countryOfCommissioning || data?.productMetadata?.countryOfCommissioning || '',
    exclusiveRights: data?.tracks?.productMetadata?.exclusiveRights ?? data?.productMetadata?.exclusiveRights ?? false,
    copyrightYear: data?.tracks?.productMetadata?.copyrightYear || data?.productMetadata?.copyrightYear || new Date().getFullYear().toString(),
    copyrightText: data?.tracks?.productMetadata?.copyrightText || data?.productMetadata?.copyrightText || '',
    phonogramCopyrightYear: data?.tracks?.productMetadata?.phonogramCopyrightYear || data?.productMetadata?.phonogramCopyrightYear || new Date().getFullYear().toString(),
    phonogramCopyrightText: data?.tracks?.productMetadata?.phonogramCopyrightText || data?.productMetadata?.phonogramCopyrightText || '',
    metadataLanguage: data?.tracks?.productMetadata?.metadataLanguage || data?.productMetadata?.metadataLanguage || 'ko',
    territories: data?.tracks?.productMetadata?.territories || data?.productMetadata?.territories || [],
    territoryType: data?.tracks?.productMetadata?.territoryType || data?.productMetadata?.territoryType || 'world',
    dspTerritories: data?.tracks?.productMetadata?.dspTerritories || data?.productMetadata?.dspTerritories || {},
    displayArtists: data?.tracks?.productMetadata?.displayArtists || data?.productMetadata?.displayArtists || '',
    explicitContent: data?.tracks?.productMetadata?.explicitContent ?? data?.productMetadata?.explicitContent ?? false,
    // Advanced Format Options
    dolbyAtmos: data?.tracks?.productMetadata?.dolbyAtmos ?? data?.productMetadata?.dolbyAtmos ?? false,
    hasMotionArt: data?.tracks?.productMetadata?.hasMotionArt ?? data?.productMetadata?.hasMotionArt ?? false,
    motionArtSettings: data?.tracks?.productMetadata?.motionArtSettings || data?.productMetadata?.motionArtSettings || {
      autoPlay: true,
      loop: true,
      showControls: false
    },
    // Additional notes
    additionalNotes: data?.tracks?.productMetadata?.additionalNotes || data?.productMetadata?.additionalNotes || '',
    // UPC
    upc: data?.tracks?.productMetadata?.upc || data?.productMetadata?.upc || ''
  })

  const [showDSPModal, setShowDSPModal] = useState(false)
  const [editingDSP, setEditingDSP] = useState<string | null>(null)
  const [showDspTerritoryModal, setShowDspTerritoryModal] = useState(false)
  const [selectedDsps, setSelectedDsps] = useState<string[]>([])
  const [dspSearchQuery, setDspSearchQuery] = useState('')
  const [tempDspTerritories, setTempDspTerritories] = useState<Record<string, string[]>>({})

  const [marketing, setMarketing] = useState({
    albumDescription: data?.tracks?.marketing?.albumDescription || data?.marketing?.albumDescription || '',
    albumIntroduction: data?.tracks?.marketing?.albumIntroduction || data?.marketing?.albumIntroduction || '',
    marketingKeywords: data?.tracks?.marketing?.marketingKeywords || data?.marketing?.marketingKeywords || [],
    targetAudience: data?.tracks?.marketing?.targetAudience || data?.marketing?.targetAudience || '',
    promotionPlans: data?.tracks?.marketing?.promotionPlans || data?.marketing?.promotionPlans || '',
    // Artist Profile Fields
    toundatesUrl: data?.tracks?.marketing?.toundatesUrl || data?.marketing?.toundatesUrl || '',
    artistGender: data?.tracks?.marketing?.artistGender || data?.marketing?.artistGender || '',
    socialMovements: data?.tracks?.marketing?.socialMovements || data?.marketing?.socialMovements || '',
    artistBio: data?.tracks?.marketing?.artistBio || data?.marketing?.artistBio || '',
    // Similar Artists & Sync
    similarArtists: data?.tracks?.marketing?.similarArtists || data?.marketing?.similarArtists || '',
    hasSyncHistory: data?.tracks?.marketing?.hasSyncHistory || data?.marketing?.hasSyncHistory || 'no',
    syncHistory: data?.tracks?.marketing?.syncHistory || data?.marketing?.syncHistory || '',
    // DSP Profile IDs
    spotifyArtistId: data?.tracks?.marketing?.spotifyArtistId || data?.marketing?.spotifyArtistId || '',
    appleMusicArtistId: data?.tracks?.marketing?.appleMusicArtistId || data?.marketing?.appleMusicArtistId || '',
    soundcloudArtistId: data?.tracks?.marketing?.soundcloudArtistId || data?.marketing?.soundcloudArtistId || '',
    // Social Media URLs
    artistUgcPriorities: data?.tracks?.marketing?.artistUgcPriorities || data?.marketing?.artistUgcPriorities || [],
    youtubeUrl: data?.tracks?.marketing?.youtubeUrl || data?.marketing?.youtubeUrl || '',
    tiktokUrl: data?.tracks?.marketing?.tiktokUrl || data?.marketing?.tiktokUrl || '',
    facebookUrl: data?.tracks?.marketing?.facebookUrl || data?.marketing?.facebookUrl || '',
    instagramUrl: data?.tracks?.marketing?.instagramUrl || data?.marketing?.instagramUrl || '',
    xUrl: data?.tracks?.marketing?.xUrl || data?.marketing?.xUrl || '',
    trillerUrl: data?.tracks?.marketing?.trillerUrl || data?.marketing?.trillerUrl || '',
    snapchatUrl: data?.tracks?.marketing?.snapchatUrl || data?.marketing?.snapchatUrl || '',
    twitchUrl: data?.tracks?.marketing?.twitchUrl || data?.marketing?.twitchUrl || '',
    pinterestUrl: data?.tracks?.marketing?.pinterestUrl || data?.marketing?.pinterestUrl || '',
    tumblrUrl: data?.tracks?.marketing?.tumblrUrl || data?.marketing?.tumblrUrl || '',
    // Moods
    moods: data?.tracks?.marketing?.moods || data?.marketing?.moods || [],
    // Instruments
    instruments: data?.tracks?.marketing?.instruments || data?.marketing?.instruments || [],
    // Elevator Pitch
    hook: data?.tracks?.marketing?.hook || data?.marketing?.hook || '',
    mainPitch: data?.tracks?.marketing?.mainPitch || data?.marketing?.mainPitch || '',
    // Marketing Drivers
    marketingDrivers: data?.tracks?.marketing?.marketingDrivers || data?.marketing?.marketingDrivers || [],
    // Social Media Rollout Plan
    socialMediaPlan: data?.tracks?.marketing?.socialMediaPlan || data?.marketing?.socialMediaPlan || '',
    // Artist Location & Images
    artistName: data?.tracks?.marketing?.artistName || data?.marketing?.artistName || '',
    artistCountry: data?.tracks?.marketing?.artistCountry || data?.marketing?.artistCountry || '',
    artistCurrentCity: data?.tracks?.marketing?.artistCurrentCity || data?.marketing?.artistCurrentCity || '',
    artistHometown: data?.tracks?.marketing?.artistHometown || data?.marketing?.artistHometown || '',
    artistAvatar: data?.tracks?.marketing?.artistAvatar || data?.marketing?.artistAvatar || null,
    artistLogo: data?.tracks?.marketing?.artistLogo || data?.marketing?.artistLogo || null,
    pressShotUrl: data?.tracks?.marketing?.pressShotUrl || data?.marketing?.pressShotUrl || '',
    pressShotCredits: data?.tracks?.marketing?.pressShotCredits || data?.marketing?.pressShotCredits || '',
    // Additional Social Media
    twitterUrl: data?.tracks?.marketing?.twitterUrl || data?.marketing?.twitterUrl || '',
    websiteUrl: data?.tracks?.marketing?.websiteUrl || data?.marketing?.websiteUrl || '',
    youtubeChannelId: data?.tracks?.marketing?.youtubeChannelId || data?.marketing?.youtubeChannelId || ''
  })

  // Drag and drop state
  const [draggedTrackId, setDraggedTrackId] = useState<string | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  
  // Artist drag and drop state
  const [draggedArtist, setDraggedArtist] = useState<{ artist: Artist; type: 'main' | 'featuring' } | null>(null)
  const [dragOverArtistType, setDragOverArtistType] = useState<'main' | 'featuring' | null>(null)
  
  // Instrument search state
  const [instrumentSearch, setInstrumentSearch] = useState('')

  const selectedTrack = tracks.find(t => t.id === selectedTrackId)

  // Ensure selected track ID is valid
  useEffect(() => {
    if (!tracks.find(t => t.id === selectedTrackId) && tracks.length > 0) {
      setSelectedTrackId(tracks[0].id)
    }
  }, [tracks, selectedTrackId])

  // Track management functions
  const addTrack = () => {
    const newTrack: Track = {
      id: uuidv4(),
      titleKo: '',
      titleEn: '',
      artists: [],
      featuringArtists: [],
      contributors: [],
      isTitle: false
    }
    setTracks([...tracks, newTrack])
    setSelectedTrackId(newTrack.id)
  }

  const removeTrack = (trackId: string) => {
    if (tracks.length > 1) {
      const updatedTracks = tracks.filter(t => t.id !== trackId)
      // 타이틀곡을 삭제해도 자동으로 다른 트랙을 타이틀곡으로 설정하지 않음
      setTracks(updatedTracks)
      if (selectedTrackId === trackId) {
        setSelectedTrackId(updatedTracks[0].id)
      }
    }
  }

  const updateTrack = (trackId: string, updates: Partial<Track>) => {
    setTracks(tracks.map(t => t.id === trackId ? { ...t, ...updates } : t))
  }

  const setTitleTrack = (trackId: string) => {
    setTracks(tracks.map(t => ({ ...t, isTitle: t.id === trackId })))
  }

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, trackId: string) => {
    setDraggedTrackId(trackId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIndex(index)
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    
    if (!draggedTrackId) return
    
    const draggedIndex = tracks.findIndex(t => t.id === draggedTrackId)
    if (draggedIndex === -1 || draggedIndex === dropIndex) {
      setDraggedTrackId(null)
      setDragOverIndex(null)
      return
    }
    
    // Reorder tracks
    const newTracks = [...tracks]
    const [draggedTrack] = newTracks.splice(draggedIndex, 1)
    newTracks.splice(dropIndex, 0, draggedTrack)
    
    setTracks(newTracks)
    setDraggedTrackId(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedTrackId(null)
    setDragOverIndex(null)
  }

  // Artist drag and drop handlers
  const handleArtistDragStart = (e: React.DragEvent, artist: Artist, type: 'main' | 'featuring') => {
    setDraggedArtist({ artist, type })
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleArtistDragOver = (e: React.DragEvent, type: 'main' | 'featuring') => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverArtistType(type)
  }

  const handleArtistDragLeave = () => {
    setDragOverArtistType(null)
  }

  const handleArtistDrop = (e: React.DragEvent, dropType: 'main' | 'featuring') => {
    e.preventDefault()
    
    if (!draggedArtist || !selectedTrack) return
    
    const { artist, type: dragType } = draggedArtist
    
    // If dropping on the same type, do nothing
    if (dragType === dropType) {
      setDraggedArtist(null)
      setDragOverArtistType(null)
      return
    }
    
    // Remove from original location
    if (dragType === 'main') {
      updateTrack(selectedTrack.id, {
        artists: selectedTrack.artists.filter(a => a.id !== artist.id)
      })
    } else {
      updateTrack(selectedTrack.id, {
        featuringArtists: selectedTrack.featuringArtists.filter(a => a.id !== artist.id)
      })
    }
    
    // Add to new location
    if (dropType === 'main') {
      updateTrack(selectedTrack.id, {
        artists: [...selectedTrack.artists, artist]
      })
    } else {
      updateTrack(selectedTrack.id, {
        featuringArtists: [...selectedTrack.featuringArtists, artist]
      })
    }
    
    setDraggedArtist(null)
    setDragOverArtistType(null)
  }

  const handleArtistDragEnd = () => {
    setDraggedArtist(null)
    setDragOverArtistType(null)
  }

  // Artist management
  const addArtistToTrack = (artist: Artist) => {
    if (!selectedTrack) return

    if (artistModalType === 'main') {
      updateTrack(selectedTrack.id, {
        artists: [...selectedTrack.artists, artist]
      })
    } else {
      updateTrack(selectedTrack.id, {
        featuringArtists: [...selectedTrack.featuringArtists, artist]
      })
    }
  }

  const removeArtistFromTrack = (artistId: string, type: 'main' | 'featuring') => {
    if (!selectedTrack) return

    if (type === 'main') {
      updateTrack(selectedTrack.id, {
        artists: selectedTrack.artists.filter(a => a.id !== artistId)
      })
    } else {
      updateTrack(selectedTrack.id, {
        featuringArtists: selectedTrack.featuringArtists.filter(a => a.id !== artistId)
      })
    }
  }

  // Contributor management
  const addContributorToTrack = (contributor: Contributor) => {
    if (!selectedTrack) return

    updateTrack(selectedTrack.id, {
      contributors: [...selectedTrack.contributors, contributor]
    })
  }

  const removeContributorFromTrack = (contributorId: string) => {
    if (!selectedTrack) return

    updateTrack(selectedTrack.id, {
      contributors: selectedTrack.contributors.filter(c => c.id !== contributorId)
    })
  }

  // QC Validation
  const qcValidationResults = useMemo(() => {
    const results: QCValidationResult[] = []
    
    tracks.forEach(track => {
      if (track.titleKo) {
        results.push(...validateField('trackTitleKo', track.titleKo))
      }
      if (track.titleEn) {
        results.push(...validateField('trackTitleEn', track.titleEn))
      }
      
      track.artists.forEach(artist => {
        if (artist.primaryName) {
          results.push(...validateField('artistNameKo', artist.primaryName))
        }
        if (artist.translatedName) {
          results.push(...validateField('artistNameEn', artist.translatedName))
        }
      })
    })
    
    return results
  }, [tracks])

  const validateAndHandleSubmit = () => {
    console.log('validateAndHandleSubmit called')
    console.log('tracks:', tracks)
    console.log('productMetadata:', productMetadata)
    
    // Required field validation
    const errors: string[] = []
    let firstErrorElement: { ref: string; message: string } | null = null
    
    // Check each track
    tracks.forEach((track, index) => {
      if (!track.titleKo && !track.titleEn) {
        errors.push(`트랙 ${index + 1}: 제목을 입력해주세요`)
        if (!firstErrorElement) {
          // Focus on the track list
          const trackElement = document.getElementById(`track-${track.id}`)
          if (trackElement) {
            trackElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
            trackElement.classList.add('ring-2', 'ring-red-500', 'ring-offset-2')
            setTimeout(() => {
              trackElement.classList.remove('ring-2', 'ring-red-500', 'ring-offset-2')
            }, 3000)
          }
        }
      }
      
      if (track.artists.length === 0) {
        errors.push(`트랙 ${index + 1}: 메인 아티스트를 추가해주세요`)
      }
    })
    
    // Check product metadata required fields
    if (!productMetadata.consumerReleaseDate) {
      errors.push('Consumer Release Date를 입력해주세요')
      if (!firstErrorElement) {
        const element = document.getElementById('consumer-release-date')
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
          element.classList.add('ring-2', 'ring-red-500')
          setTimeout(() => {
            element.classList.remove('ring-2', 'ring-red-500')
          }, 3000)
        }
      }
    }
    
    if (!productMetadata.displayArtists) {
      errors.push('Display Artists를 입력해주세요')
      if (!firstErrorElement) {
        const element = document.getElementById('display-artists')
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
          element.classList.add('ring-2', 'ring-red-500')
          setTimeout(() => {
            element.classList.remove('ring-2', 'ring-red-500')
          }, 3000)
        }
      }
    }
    
    if (!productMetadata.copyrightYear || !productMetadata.copyrightText) {
      errors.push('ⓒ Copyright 정보를 입력해주세요')
      if (!firstErrorElement) {
        const element = document.getElementById('copyright-section')
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
          element.classList.add('ring-2', 'ring-red-500')
          setTimeout(() => {
            element.classList.remove('ring-2', 'ring-red-500')
          }, 3000)
        }
      }
    }
    
    if (!productMetadata.phonogramCopyrightYear || !productMetadata.phonogramCopyrightText) {
      errors.push('℗ Copyright 정보를 입력해주세요')
      if (!firstErrorElement) {
        const element = document.getElementById('phonogram-section')
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
          element.classList.add('ring-2', 'ring-red-500')
          setTimeout(() => {
            element.classList.remove('ring-2', 'ring-red-500')
          }, 3000)
        }
      }
    }
    
    // Show error toast if validation fails
    if (errors.length > 0) {
      console.log('Validation errors:', errors)
      const errorMessage = language === 'ko' 
        ? `필수 입력 항목을 확인해주세요:\n${errors.join('\n')}`
        : `Please fill in required fields:\n${errors.join('\n')}`
      
      // Show error in a prominent way
      const errorDiv = document.createElement('div')
      errorDiv.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-600 text-white px-6 py-4 rounded-lg shadow-lg max-w-md'
      errorDiv.innerHTML = `
        <div class="flex items-start gap-3">
          <svg class="w-6 h-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <div class="font-semibold mb-1">${language === 'ko' ? '필수 입력 항목 누락' : 'Required Fields Missing'}</div>
            <div class="text-sm">${errors[0]}</div>
          </div>
        </div>
      `
      document.body.appendChild(errorDiv)
      setTimeout(() => {
        errorDiv.remove()
      }, 5000)
      
      return
    }
    
    console.log('Validation passed, calling onNext')
    
    // If validation passes, proceed
    onNext({
      tracks,
      productMetadata,
      marketing,
      selectedTrackId,
      activeTab,
      metadataSubTab
    })
  }
  
  const handleSubmit = () => {
    validateAndHandleSubmit()
  }

  return (
    <form onSubmit={(e) => {
      e.preventDefault()
      handleSubmit()
    }} className="h-full">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {language === 'ko' ? '트랙 정보' : 'Track Information'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {language === 'ko' ? '앨범에 포함될 트랙 정보를 입력해주세요' : 'Enter information for tracks in your album'}
          </p>
        </div>
        
        <div className="space-y-6">

          {/* Track List Section */}
          <div className="relative">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-n3rve-main to-n3rve-accent rounded-lg flex items-center justify-center">
                <Music className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {language === 'ko' ? '트랙 목록' : 'Track List'}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {language === 'ko' ? '앨범에 포함될 트랙을 추가하고 관리하세요' : 'Add and manage tracks for your album'}
                </p>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span>
                      {language === 'ko' 
                        ? '클릭하여 타이틀곡 설정' 
                        : 'Click to set title track'
                      }
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <GripVertical className="w-4 h-4" />
                    <span>
                      {language === 'ko' 
                        ? '드래그하여 순서 변경' 
                        : 'Drag to reorder'
                      }
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={addTrack}
                  className="group flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-n3rve-main to-n3rve-accent hover:from-n3rve-600 hover:to-n3rve-500 text-white rounded-xl transition-all shadow-lg shadow-n3rve-500/25 hover:shadow-xl hover:scale-105"
                >
                  <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                  {language === 'ko' ? '트랙 추가' : 'Add Track'}
                </button>
              </div>

              <div className="space-y-3">
                {tracks.map((track, index) => (
                  <div
                    key={track.id}
                    id={`track-${track.id}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, track.id)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                    onClick={() => {
                      setSelectedTrackId(track.id)
                      // 트랙 클릭 시 Asset Level 탭으로 전환
                      setActiveTab('metadata')
                      setMetadataSubTab('asset')
                    }}
                    className={`group relative flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all ${
                      selectedTrackId === track.id
                        ? 'bg-gradient-to-r from-n3rve-50 to-n3rve-100 dark:from-n3rve-900/20 dark:to-n3rve-800/20 border-2 border-n3rve-main shadow-lg'
                        : 'bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-n3rve-300 dark:hover:border-n3rve-700 hover:shadow-md'
                    } ${
                      draggedTrackId === track.id
                        ? 'opacity-50 scale-95'
                        : ''
                    } ${
                      dragOverIndex === index
                        ? 'border-t-4 border-t-n3rve-main'
                        : ''
                    }`}
                  >
                    {selectedTrackId === track.id && (
                      <div className="absolute inset-0 bg-gradient-to-r from-n3rve-500/5 to-n3rve-accent/5 rounded-xl" />
                    )}
                    
                    <div className="relative flex items-center gap-3 flex-1">
                      <div className="cursor-move text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                        <GripVertical className="w-5 h-5" />
                      </div>
                      
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${
                        track.trackType === 'music_video'
                          ? 'bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 text-purple-600 dark:text-purple-400'
                          : 'bg-gradient-to-br from-n3rve-100 to-n3rve-200 dark:from-n3rve-900/30 dark:to-n3rve-800/30 text-n3rve-600 dark:text-n3rve-400'
                      }`}>
                        {track.trackType === 'music_video' ? (
                          <Video className="w-5 h-5" />
                        ) : (
                          String(index + 1).padStart(2, '0')
                        )}
                      </div>
                      
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          const updatedTracks = tracks.map(t => ({
                            ...t,
                            isTitle: t.id === track.id
                          }))
                          setTracks(updatedTracks)
                        }}
                        className={`p-2 rounded-lg transition-all ${
                          track.isTitle 
                            ? 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30 shadow-sm' 
                            : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
                        }`}
                        title={language === 'ko' ? '타이틀곡으로 설정' : 'Set as title track'}
                      >
                        <Star className={`w-5 h-5 ${track.isTitle ? 'fill-current drop-shadow-sm' : ''}`} />
                      </button>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="font-semibold text-gray-900 dark:text-white truncate">
                            {track.titleKo || track.titleEn || (language === 'ko' ? '(제목 없음)' : '(No title)')}
                          </div>
                          {track.trackType === 'music_video' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium whitespace-nowrap">
                              <Video className="w-3 h-3" />
                              {language === 'ko' ? '뮤직비디오' : 'Music Video'}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {track.artists.map(a => a.primaryName).join(', ')}
                          {track.featuringArtists.length > 0 && ` feat. ${track.featuringArtists.map(a => a.primaryName).join(', ')}`}
                        </div>
                      </div>
                    </div>
                    
                    {tracks.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          removeTrack(track.id)
                        }}
                        className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mt-8">
            <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
              <div className="grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('metadata')}
                  className={`py-3 px-4 rounded-lg font-medium text-sm transition-all ${
                    activeTab === 'metadata'
                      ? 'bg-white dark:bg-gray-700 text-n3rve-600 dark:text-n3rve-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="w-4 h-4" />
                    {language === 'ko' ? '메타데이터' : 'Metadata'}
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('marketing')}
                  className={`py-3 px-4 rounded-lg font-medium text-sm transition-all ${
                    activeTab === 'marketing'
                      ? 'bg-white dark:bg-gray-700 text-n3rve-600 dark:text-n3rve-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Megaphone className="w-4 h-4" />
                    {language === 'ko' ? '마케팅' : 'Marketing'}
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'metadata' && (
            <div className="mt-6 space-y-6">
              {/* Sub-tab Navigation */}
              <div className="bg-gray-50 dark:bg-gray-900 p-1 rounded-xl">
                <div className="grid grid-cols-2 gap-1">
                  <button
                    type="button"
                    onClick={() => setMetadataSubTab('product')}
                    className={`py-2.5 px-4 rounded-lg font-medium text-sm transition-all ${
                      metadataSubTab === 'product'
                        ? 'bg-white dark:bg-gray-800 text-n3rve-600 dark:text-n3rve-400 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      {language === 'ko' ? '프로덕트 레벨' : 'Product Level'}
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMetadataSubTab('asset')}
                    className={`py-2.5 px-4 rounded-lg font-medium text-sm transition-all ${
                      metadataSubTab === 'asset'
                        ? 'bg-white dark:bg-gray-800 text-n3rve-600 dark:text-n3rve-400 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Music2 className="w-4 h-4" />
                      {language === 'ko' ? '에셋 레벨' : 'Asset Level'}
                </div>
              </button>
            </div>
          </div>

          {/* Product Level Content */}
          {metadataSubTab === 'product' && (
            <div className="space-y-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    <p className="font-medium mb-1">{t('프로덕트 레벨 설정에 대한 설명', 'Product level configuration description')}</p>
                  </div>
                </div>
              </div>

              {/* Release Information */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-n3rve-main" />
                  {t('릴리즈 정보', 'Release Information')}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Consumer Release Date <span className="text-red-500">*</span>
                    </label>
                    <DatePicker
                      id="consumer-release-date"
                      value={productMetadata.consumerReleaseDate}
                      onChange={(newDate) => {
                        setProductMetadata({ 
                          ...productMetadata, 
                          consumerReleaseDate: newDate,
                          // Auto-sync original release date for new releases
                          originalReleaseDate: productMetadata.originalReleaseDate || newDate
                        })
                      }}
                      placeholder="Select release date"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {language === 'ko' 
                        ? '소비자에게 공개되는 발매일 (신곡의 경우 실제 발매일)'
                        : 'Release date visible to consumers (actual release date for new music)'
                      }
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('원본 발매일', 'Original Release Date')}
                    </label>
                    <DatePicker
                      value={productMetadata.originalReleaseDate}
                      onChange={(newDate) => setProductMetadata({ ...productMetadata, originalReleaseDate: newDate })}
                      placeholder="Select original release date"
                      maxDate={productMetadata.consumerReleaseDate || undefined}
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {language === 'ko' 
                        ? '최초 발매된 날짜 (재발매/리마스터의 경우 과거 발매일)'
                        : 'Original recording/release date (past date for re-releases/remasters)'
                      }
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('발매 시간대', 'Release Timezone')}
                    </label>
                    <select
                      value={productMetadata.selectedTimezone || 'Asia/Seoul'}
                      onChange={(e) => setProductMetadata({ ...productMetadata, selectedTimezone: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-n3rve-500 focus:border-n3rve-main bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-all"
                    >
                      <option value="Pacific/Auckland">{t('뉴질랜드', 'New Zealand')} (UTC+12/+13)</option>
                      <option value="Asia/Seoul">{t('서울', 'Seoul')} (UTC+9)</option>
                      <option value="Asia/Tokyo">{t('도쿄', 'Tokyo')} (UTC+9)</option>
                      <option value="Asia/Shanghai">{t('베이징', 'Beijing')} (UTC+8)</option>
                      <option value="Asia/Singapore">{t('싱가포르', 'Singapore')} (UTC+8)</option>
                      <option value="Europe/London">{t('런던', 'London')} (UTC+0/+1)</option>
                      <option value="Europe/Paris">{t('파리', 'Paris')} (UTC+1/+2)</option>
                      <option value="Europe/Berlin">{t('베를린', 'Berlin')} (UTC+1/+2)</option>
                      <option value="America/New_York">{t('뉴욕', 'New York')} (UTC-5/-4)</option>
                      <option value="America/Chicago">{t('시카고', 'Chicago')} (UTC-6/-5)</option>
                      <option value="America/Denver">{t('덴버', 'Denver')} (UTC-7/-6)</option>
                      <option value="America/Los_Angeles">{t('로스앤젤레스', 'Los Angeles')} (UTC-8/-7)</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {language === 'ko' 
                        ? '발매 시간대를 선택하세요. 선택한 시간대의 0시에 음원이 공개됩니다.'
                        : 'Select the timezone for release. Music will be available at midnight in the selected timezone.'
                      }
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('발매 시간', 'Release Time')} ({productMetadata.selectedTimezone === 'Asia/Seoul' ? 'KST' : 
                        productMetadata.selectedTimezone === 'Asia/Tokyo' ? 'JST' :
                        productMetadata.selectedTimezone === 'America/New_York' ? 'EST' :
                        productMetadata.selectedTimezone === 'America/Los_Angeles' ? 'PST' :
                        productMetadata.selectedTimezone === 'Europe/London' ? 'GMT' :
                        productMetadata.selectedTimezone === 'Europe/Paris' ? 'CET' :
                        'Local'})
                    </label>
                    <div className="space-y-3">
                      {!productMetadata.releaseTime ? (
                        <div 
                          onClick={() => setProductMetadata({ ...productMetadata, releaseTime: '12:00 AM' })}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-pointer hover:border-n3rve-accent2 dark:hover:border-n3rve-500 transition-colors"
                        >
                          {language === 'ko' ? '시간을 입력해주세요' : 'Please enter time'}
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <select
                            value={productMetadata.releaseTime.split(':')[0]}
                            onChange={(e) => {
                              const hour = e.target.value
                              const minute = productMetadata.releaseTime.split(':')[1]?.split(' ')[0] || '00'
                              const period = productMetadata.releaseTime.split(' ')[1] || 'AM'
                              const newTime = `${hour}:${minute} ${period}`
                              setProductMetadata({ ...productMetadata, releaseTime: newTime })
                            }}
                            className="flex-1 px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-n3rve-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          >
                            {[...Array(12)].map((_, i) => {
                              const hour = i + 1
                              return (
                                <option key={hour} value={hour.toString().padStart(2, '0')}>
                                  {hour}
                                </option>
                              )
                            })}
                          </select>
                          <span className="flex items-center text-gray-500 dark:text-gray-400">:</span>
                          <select
                            value={productMetadata.releaseTime.split(':')[1]?.split(' ')[0] || '00'}
                            onChange={(e) => {
                              const hour = productMetadata.releaseTime.split(':')[0]
                              const minute = e.target.value
                              const period = productMetadata.releaseTime.split(' ')[1] || 'AM'
                              const newTime = `${hour}:${minute} ${period}`
                              setProductMetadata({ ...productMetadata, releaseTime: newTime })
                            }}
                            className="flex-1 px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-n3rve-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          >
                            {[...Array(12)].map((_, i) => {
                              const minute = i * 5
                              return (
                                <option key={minute} value={minute.toString().padStart(2, '0')}>
                                  {minute.toString().padStart(2, '0')}
                                </option>
                              )
                            })}
                          </select>
                          <select
                            value={productMetadata.releaseTime.split(' ')[1] || 'AM'}
                            onChange={(e) => {
                              const hour = productMetadata.releaseTime.split(':')[0]
                              const minute = productMetadata.releaseTime.split(':')[1]?.split(' ')[0] || '00'
                              const period = e.target.value
                              const newTime = `${hour}:${minute} ${period}`
                              setProductMetadata({ ...productMetadata, releaseTime: newTime })
                            }}
                            className="px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-n3rve-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          >
                            <option value="AM">AM</option>
                            <option value="PM">PM</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => setProductMetadata({ ...productMetadata, releaseTime: '' })}
                            className="px-3 py-3 text-gray-500 hover:text-red-500 transition-colors"
                            title={language === 'ko' ? '시간 지우기' : 'Clear time'}
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                      
                      {/* Time conversion and display */}
                      {productMetadata.releaseTime && productMetadata.consumerReleaseDate && (
                        <div className="bg-gradient-to-r from-n3rve-50 to-blue-50 dark:from-n3rve-900/20 dark:to-blue-900/20 border border-n3rve-200 dark:border-n3rve-700 rounded-xl p-4">
                          <div className="text-center space-y-3">
                            <div className="text-sm font-semibold text-n3rve-800 dark:text-n3rve-200 mb-3">
                              {language === 'ko' ? '🚀 발매 예정 시간' : '🚀 Scheduled Release Time'}
                            </div>
                            
                            {/* Selected Timezone Display */}
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">
                                {(() => {
                                  const timezone = productMetadata.selectedTimezone || 'Asia/Seoul'
                                  const timezoneLabels = {
                                    'Pacific/Auckland': language === 'ko' ? '뉴질랜드 시간' : 'New Zealand Time',
                                    'Asia/Seoul': language === 'ko' ? '한국 시간 (KST)' : 'Korea Standard Time (KST)',
                                    'Asia/Tokyo': language === 'ko' ? '일본 시간 (JST)' : 'Japan Standard Time (JST)',
                                    'Asia/Shanghai': language === 'ko' ? '베이징 시간 (CST)' : 'Beijing Time (CST)',
                                    'Asia/Singapore': language === 'ko' ? '싱가포르 시간 (SGT)' : 'Singapore Time (SGT)',
                                    'Europe/London': language === 'ko' ? '런던 시간 (GMT)' : 'London Time (GMT)',
                                    'Europe/Paris': language === 'ko' ? '파리 시간 (CET)' : 'Paris Time (CET)',
                                    'Europe/Berlin': language === 'ko' ? '베를린 시간 (CET)' : 'Berlin Time (CET)',
                                    'America/New_York': language === 'ko' ? '뉴욕 시간 (EST)' : 'New York Time (EST)',
                                    'America/Chicago': language === 'ko' ? '시카고 시간 (CST)' : 'Chicago Time (CST)',
                                    'America/Denver': language === 'ko' ? '덴버 시간 (MST)' : 'Denver Time (MST)',
                                    'America/Los_Angeles': language === 'ko' ? '로스앤젤레스 시간 (PST)' : 'Los Angeles Time (PST)'
                                  }
                                  return timezoneLabels[timezone] || timezone
                                })()}
                              </div>
                              <div className="text-lg font-bold text-gray-900 dark:text-white">
                                {(() => {
                                  const date = new Date(productMetadata.consumerReleaseDate)
                                  const options: Intl.DateTimeFormatOptions = { 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric',
                                    weekday: 'long'
                                  }
                                  const dateStr = language === 'ko' 
                                    ? date.toLocaleDateString('ko-KR', options)
                                    : date.toLocaleDateString('en-US', options)
                                  
                                  // Convert AM/PM to Korean if needed
                                  const timeStr = language === 'ko' 
                                    ? productMetadata.releaseTime.replace('AM', '오전').replace('PM', '오후')
                                    : productMetadata.releaseTime
                                    
                                  return `${dateStr} ${timeStr}`
                                })()}
                              </div>
                            </div>

                            {/* Arrow */}
                            <div className="flex justify-center">
                              <div className="text-n3rve-500 dark:text-n3rve-accent2">
                                ↓
                              </div>
                            </div>

                            {/* UTC Display */}
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">
                                {language === 'ko' ? '국제 표준시 (UTC)' : 'Coordinated Universal Time (UTC)'}
                              </div>
                              <div className="text-lg font-bold text-gray-700 dark:text-gray-300">
                                {(() => {
                                  try {
                                    const [hour12, minute] = productMetadata.releaseTime.split(':')
                                    const period = productMetadata.releaseTime.split(' ')[1]
                                    let hour24 = parseInt(hour12)
                                    if (period === 'PM' && hour24 !== 12) hour24 += 12
                                    if (period === 'AM' && hour24 === 12) hour24 = 0
                                    
                                    // Get timezone offset based on selected timezone
                                    const timezone = productMetadata.selectedTimezone || 'Asia/Seoul'
                                    const timezoneOffsets: Record<string, number> = {
                                      'Pacific/Auckland': 12, // UTC+12 (standard), +13 (daylight)
                                      'Asia/Seoul': 9,        // UTC+9
                                      'Asia/Tokyo': 9,        // UTC+9
                                      'Asia/Shanghai': 8,     // UTC+8
                                      'Asia/Singapore': 8,    // UTC+8
                                      'Europe/London': 0,     // UTC+0 (standard), +1 (daylight)
                                      'Europe/Paris': 1,      // UTC+1 (standard), +2 (daylight)
                                      'Europe/Berlin': 1,     // UTC+1 (standard), +2 (daylight)
                                      'America/New_York': -5, // UTC-5 (standard), -4 (daylight)
                                      'America/Chicago': -6,  // UTC-6 (standard), -5 (daylight)
                                      'America/Denver': -7,   // UTC-7 (standard), -6 (daylight)
                                      'America/Los_Angeles': -8 // UTC-8 (standard), -7 (daylight)
                                    }
                                    
                                    const offset = timezoneOffsets[timezone] || 9 // Default to KST
                                    const localDate = new Date(`${productMetadata.consumerReleaseDate}T${hour24.toString().padStart(2, '0')}:${minute.split(' ')[0]}:00`)
                                    const utcDate = new Date(localDate.getTime() - (offset * 60 * 60 * 1000))
                                    
                                    if (language === 'ko') {
                                      const dateOptions = { 
                                        year: 'numeric', 
                                        month: 'long', 
                                        day: 'numeric',
                                        weekday: 'long',
                                        timeZone: 'UTC'
                                      }
                                      const timeOptions = {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        hour12: true,
                                        timeZone: 'UTC'
                                      }
                                      const dateStr = utcDate.toLocaleDateString('ko-KR', dateOptions)
                                      const timeStr = utcDate.toLocaleTimeString('en-US', timeOptions)
                                      const timeKor = timeStr.replace('AM', '오전').replace('PM', '오후')
                                      return `${dateStr} ${timeKor} UTC`
                                    } else {
                                      const options = { 
                                        year: 'numeric', 
                                        month: 'long', 
                                        day: 'numeric',
                                        weekday: 'long',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        hour12: true,
                                        timeZone: 'UTC'
                                      }
                                      return utcDate.toLocaleDateString('en-US', options) + ' UTC'
                                    }
                                  } catch {
                                    return 'Invalid time'
                                  }
                                })()}
                              </div>
                            </div>

                            <div className="text-xs text-n3rve-main dark:text-n3rve-300 mt-2">
                              {language === 'ko' 
                                ? '💡 전 세계 음원 플랫폼에서 동시 발매됩니다'
                                : '💡 Will be released simultaneously on all global platforms'
                              }
                            </div>
                            
                            {/* Timed Release Warning */}
                            <div className="mt-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-3">
                              <div className="flex items-start gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                                <div className="text-xs text-amber-800 dark:text-amber-200 flex-1">
                                  <div className="font-semibold mb-1 text-left">
                                    {language === 'ko' 
                                      ? '⚠️ Timed Release 미지원 플랫폼 안내'
                                      : '⚠️ Timed Release Limitations'
                                    }
                                  </div>
                                  <div className="space-y-1 text-left">
                                    <p>
                                      {language === 'ko' 
                                        ? '일부 음원 플랫폼 (예: Apple Music)은 시간 설정 기능을 지원하지 않습니다.'
                                        : 'Some DSPs (e.g., Apple Music) don\'t support timed release feature.'
                                      }
                                    </p>
                                    <p>
                                      {language === 'ko' 
                                        ? '이러한 플랫폼에서는 발매일 각 지역 시간대의 자정(00:00)에 공개됩니다.'
                                        : 'On these platforms, your release will go live at midnight (00:00) in each local timezone on the release date.'
                                      }
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      {language === 'ko' 
                        ? '한국 표준시(KST) 기준으로 발매 시간을 설정하세요 (선택사항)'
                        : 'Set release time in Korea Standard Time (KST) - optional'
                      }
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Display Artists <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="display-artists"
                      value={productMetadata.displayArtists || ''}
                      onChange={(e) => setProductMetadata({ ...productMetadata, displayArtists: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-n3rve-500 focus:border-n3rve-main bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-all"
                      placeholder={language === 'ko' ? "표시될 아티스트명" : "Display artist names"}
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {language === 'ko' 
                        ? '음원 플랫폼에서 표시될 아티스트명'
                        : 'Artist name to be displayed on streaming platforms'
                      }
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      UPC {language === 'ko' ? '(선택사항)' : '(Optional)'}
                    </label>
                    <input
                      type="text"
                      value={productMetadata.upc || ''}
                      onChange={(e) => setProductMetadata({ ...productMetadata, upc: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-n3rve-500 focus:border-n3rve-main bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-all"
                      placeholder={language === 'ko' ? "UPC 코드 (12자리 숫자)" : "UPC code (12-digit number)"}
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {language === 'ko' 
                        ? '이미 발매된 앨범의 UPC가 있는 경우 입력하세요'
                        : 'Enter if you have a UPC for an already released album'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Explicit Content */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-n3rve-main" />
                  {language === 'ko' ? '음원 내용 등급' : 'Explicit Content'}
                </h4>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="explicitContent"
                      value="false"
                      checked={!productMetadata.explicitContent}
                      onChange={() => setProductMetadata({ ...productMetadata, explicitContent: false })}
                      className="w-4 h-4 text-n3rve-main focus:ring-n3rve-500"
                    />
                    <span className="text-gray-700 dark:text-gray-300">
                      {language === 'ko' ? '전체 이용가' : 'Not Explicit'}
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="explicitContent"
                      value="true"
                      checked={productMetadata.explicitContent === true}
                      onChange={() => setProductMetadata({ ...productMetadata, explicitContent: true })}
                      className="w-4 h-4 text-n3rve-main focus:ring-n3rve-500"
                    />
                    <span className="text-gray-700 dark:text-gray-300">
                      {language === 'ko' ? '19세 이용가' : 'Explicit'}
                    </span>
                  </label>
                </div>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  {language === 'ko' 
                    ? '욕설, 성적 내용 등 19세 미만 부적절한 내용 포함 여부'
                    : 'Contains profanity, sexual content, or other inappropriate content for minors'
                  }
                </p>
              </div>

              {/* Copyrights */}
              <div id="copyright-section" className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {language === 'en' ? 'Copyrights' : '저작권 (Copyrights)'}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {language === 'en' ? 'ⓒ Copyright Year' : 'ⓒ 저작권 연도'} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={productMetadata.copyrightYear}
                      onChange={(e) => setProductMetadata({ ...productMetadata, copyrightYear: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-n3rve-500 focus:border-n3rve-main bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-all"
                      placeholder={language === 'en' ? 'e.g., 2025' : '예: 2025'}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {language === 'en' ? 'ⓒ Copyright Text' : 'ⓒ 저작권 텍스트'} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={productMetadata.copyrightText}
                      onChange={(e) => setProductMetadata({ ...productMetadata, copyrightText: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-n3rve-500 focus:border-n3rve-main bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-all"
                      placeholder={language === 'en' ? 'e.g., Label Name' : '예: Label Name'}
                    />
                  </div>
                  <div id="phonogram-section">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {language === 'en' ? '℗ Copyright Year' : '℗ 저작권 연도'} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={productMetadata.phonogramCopyrightYear}
                      onChange={(e) => setProductMetadata({ ...productMetadata, phonogramCopyrightYear: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-n3rve-500 focus:border-n3rve-main bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-all"
                      placeholder={language === 'en' ? 'e.g., 2025' : '예: 2025'}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {language === 'en' ? '℗ Copyright Text' : '℗ 저작권 텍스트'} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={productMetadata.phonogramCopyrightText}
                      onChange={(e) => setProductMetadata({ ...productMetadata, phonogramCopyrightText: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-n3rve-500 focus:border-n3rve-main bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-all"
                      placeholder={language === 'en' ? 'e.g., Label Name' : '예: Label Name'}
                    />
                  </div>
                </div>
              </div>


              {/* Metadata Language */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Languages className="w-5 h-5 text-n3rve-main" />
                  {t('메타데이터 언어', 'Metadata Language')}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {t('음원 정보를 입력할 언어를 선택하세요', 'Select the language for entering music metadata')}
                </p>
                <select
                  value={productMetadata.metadataLanguage || ''}
                  onChange={(e) => setProductMetadata({ ...productMetadata, metadataLanguage: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-n3rve-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="">{t('언어 선택', 'Select Language')}</option>
                  {languageOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Territory Settings */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-n3rve-main" />
                  {t('유통 지역', 'Territory')}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {t('음원이 유통될 지역을 선택하세요', 'Select the territories where your music will be distributed')}
                </p>
                
                {/* Territory Type Selection */}
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value="world"
                        checked={(productMetadata.territoryType || 'world') === 'world'}
                        onChange={(e) => setProductMetadata({ 
                          ...productMetadata, 
                          territoryType: 'world' as const,
                          territories: []
                        })}
                        className="w-4 h-4 text-n3rve-main focus:ring-n3rve-500"
                      />
                      <span className="text-gray-700 dark:text-gray-300">{t('전 세계', 'Worldwide')}</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value="selected"
                        checked={productMetadata.territoryType === 'selected'}
                        onChange={(e) => setProductMetadata({ 
                          ...productMetadata, 
                          territoryType: 'selected' as const
                        })}
                        className="w-4 h-4 text-n3rve-main focus:ring-n3rve-500"
                      />
                      <span className="text-gray-700 dark:text-gray-300">{t('선택한 지역', 'Selected Territories')}</span>
                    </label>
                  </div>

                  {/* Territory Selection */}
                  {productMetadata.territoryType === 'selected' && (
                    <div className="space-y-6 mt-4">
                      {/* Quick Actions */}
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const allCountries = Object.values(territoryData).flatMap(c => c.countries)
                            setProductMetadata({
                              ...productMetadata,
                              territories: allCountries
                            })
                          }}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
                        >
                          {language === 'ko' ? '전 세계 선택' : 'Select All Countries'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setProductMetadata({
                              ...productMetadata,
                              territories: []
                            })
                          }}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
                        >
                          {language === 'ko' ? '모두 해제' : 'Deselect All'}
                        </button>
                      </div>

                      {/* Continent Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(territoryData).map(([continentKey, continent]) => {
                          const selectedCount = continent.countries.filter(c => 
                            productMetadata.territories?.includes(c)
                          ).length
                          const totalCount = continent.countries.length
                          const isAllSelected = selectedCount === totalCount
                          
                          return (
                            <div key={continentKey} className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border-2 border-gray-200 dark:border-gray-700 hover:border-n3rve-300 dark:hover:border-n3rve-700 transition-colors">
                              <div className="mb-3">
                                <div className="flex items-center justify-between mb-2">
                                  <h5 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {t(`track.territory.${continentKey}`, continentKey.charAt(0).toUpperCase() + continentKey.slice(1))}
                                  </h5>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const currentTerritories = productMetadata.territories || []
                                      
                                      if (isAllSelected) {
                                        const newTerritories = currentTerritories.filter(
                                          c => !continent.countries.includes(c)
                                        )
                                        setProductMetadata({
                                          ...productMetadata,
                                          territories: newTerritories
                                        })
                                      } else {
                                        const newTerritories = [...new Set([
                                          ...currentTerritories,
                                          ...continent.countries
                                        ])]
                                        setProductMetadata({
                                          ...productMetadata,
                                          territories: newTerritories
                                        })
                                      }
                                    }}
                                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                                      isAllSelected 
                                        ? 'bg-n3rve-100 text-n3rve-700 hover:bg-n3rve-200 dark:bg-n3rve-900 dark:text-n3rve-300' 
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
                                    }`}
                                  >
                                    {isAllSelected ? '✓ ' : ''}{language === 'ko' ? '전체' : 'All'}
                                  </button>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                    <div 
                                      className={`h-2 rounded-full transition-all ${
                                        selectedCount === 0 ? 'bg-gray-300 dark:bg-gray-600' : 'bg-n3rve-main'
                                      }`}
                                      style={{ width: `${(selectedCount / totalCount) * 100}%` }}
                                    />
                                  </div>
                                  <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[60px] text-right">
                                    {selectedCount}/{totalCount}
                                  </span>
                                </div>
                              </div>
                              
                              {/* Expandable Country List */}
                              <details className="group" id={`territory-${continentKey}`}>
                                <summary className="cursor-pointer text-sm text-n3rve-main hover:text-n3rve-700 font-medium list-none flex items-center gap-1">
                                  <ChevronRight className="w-4 h-4 transition-transform group-open:rotate-90" />
                                  {language === 'ko' ? '국가 목록' : 'Countries'}
                                </summary>
                                <div className="mt-3 space-y-1 max-h-48 overflow-y-auto">
                                  {continent.countries.map(countryCode => (
                                    <label 
                                      key={countryCode} 
                                      className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors text-sm
                                        ${productMetadata.territories?.includes(countryCode)
                                          ? 'bg-n3rve-50 dark:bg-n3rve-900/20 hover:bg-n3rve-100 dark:hover:bg-n3rve-900/30' 
                                          : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                                        }`}
                                    >
                                      <input
                                        type="checkbox"
                                        value={countryCode}
                                        checked={productMetadata.territories?.includes(countryCode) || false}
                                        onChange={(e) => {
                                          const currentTerritories = productMetadata.territories || []
                                          const newTerritories = e.target.checked
                                            ? [...currentTerritories, countryCode]
                                            : currentTerritories.filter(c => c !== countryCode)
                                          setProductMetadata({
                                            ...productMetadata,
                                            territories: newTerritories
                                          })
                                        }}
                                        className="rounded text-n3rve-main focus:ring-n3rve-500"
                                      />
                                      <span className={`flex-1 ${
                                        productMetadata.territories?.includes(countryCode)
                                          ? 'text-n3rve-900 dark:text-n3rve-100 font-medium'
                                          : 'text-gray-700 dark:text-gray-300'
                                      }`}>
                                        {countryNames[countryCode]?.[language] || countryNames[countryCode]?.en || countryCode}
                                      </span>
                                      <span className="text-xs text-gray-400">
                                        {countryCode}
                                      </span>
                                    </label>
                                  ))}
                                </div>
                              </details>
                            </div>
                          )
                        })}
                      </div>

                      {/* Selected Countries Summary */}
                      <div className="bg-n3rve-50 dark:bg-n3rve-900/20 rounded-lg p-4">
                        <h5 className="font-medium text-n3rve-900 dark:text-n3rve-100 mb-2">
                          {language === 'ko' ? '선택된 국가' : 'Selected Countries'} 
                          ({productMetadata.territories?.length || 0})
                        </h5>
                        <div className="flex flex-wrap gap-2">
                          {(productMetadata.territories || []).map(countryCode => (
                            <span 
                              key={countryCode}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-n3rve-100 dark:bg-n3rve-800 text-n3rve-700 dark:text-n3rve-200 rounded-full text-xs"
                            >
                              {countryNames[countryCode]?.[language] || countryNames[countryCode]?.en || countryCode}
                              <button
                                type="button"
                                onClick={() => {
                                  const newTerritories = (productMetadata.territories || [])
                                    .filter((c: string) => c !== countryCode)
                                  setProductMetadata({
                                    ...productMetadata,
                                    territories: newTerritories
                                  })
                                }}
                                className="ml-1 hover:text-n3rve-900 dark:hover:text-n3rve-100"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* DSP Territory Settings */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Disc className="w-5 h-5 text-n3rve-main" />
                  {t('DSP별 지역 설정', 'DSP Territory Settings')}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {t('사용자 지역 설정을 사용하여 각 DSP별로 다른 지역을 설정할 수 있습니다', 'You can set different territories for each DSP using custom territory settings')}
                </p>
                
                {/* Summary of DSP Settings */}
                <div className="mb-4 p-4 bg-n3rve-50 dark:bg-n3rve-900/20 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-n3rve-900 dark:text-n3rve-100">
                        {Object.keys(productMetadata.dspTerritories || {}).filter(
                          dsp => productMetadata.dspTerritories?.[dsp]?.territoryType === 'custom'
                        ).length} {language === 'ko' ? '개 DSP 커스텀 설정' : 'DSPs with custom settings'}
                      </p>
                      <p className="text-xs text-n3rve-700 dark:text-n3rve-300 mt-1">
                        {language === 'ko' 
                          ? '나머지는 기본 지역 설정을 사용합니다'
                          : 'Others use default territory settings'
                        }
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowDspTerritoryModal(true)
                      }}
                      className="px-4 py-2 bg-n3rve-main hover:bg-n3rve-700 text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                      <Edit3 className="w-4 h-4" />
                      {language === 'ko' ? 'DSP 설정 관리' : 'Manage DSP Settings'}
                    </button>
                  </div>
                </div>

                {/* Quick Preview of Custom DSPs */}
                {Object.entries(productMetadata.dspTerritories || {})
                  .filter(([_, config]) => config.territoryType === 'custom')
                  .length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {language === 'ko' ? '커스텀 설정된 DSP' : 'DSPs with custom settings'}
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(productMetadata.dspTerritories || {})
                        .filter(([_, config]) => config.territoryType === 'custom')
                        .map(([dsp, config]) => (
                          <span 
                            key={dsp}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-xs"
                          >
                            {dsp.split(' ')[0]}
                            <span className="text-n3rve-main dark:text-n3rve-accent2 font-medium">
                              ({config.territories?.length || 0})
                            </span>
                          </span>
                        ))
                      }
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Asset Level Content */}
          {metadataSubTab === 'asset' && selectedTrack && (
            <div className="space-y-6">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800 dark:text-yellow-200">
                    <p className="font-medium mb-1">
                      {language === 'en' 
                        ? `Currently selected track: ${selectedTrack.titleKo || selectedTrack.titleEn || '(No title)'}`
                        : `현재 선택된 트랙: ${selectedTrack.titleKo || selectedTrack.titleEn || '(제목 없음)'}`
                      }
                    </p>
                    <p>
                      {language === 'en' 
                        ? 'You can configure settings individually for each track.'
                        : '각 트랙별로 개별 설정할 수 있습니다.'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Track Basic Info */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Music className="w-5 h-5 text-n3rve-main" />
                  {language === 'ko' ? '트랙 기본 정보' : 'Track Basic Info'}
                </h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {language === 'ko' ? '트랙 제목 (한글)' : 'Track Title (Korean)'} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={selectedTrack.titleKo}
                        onChange={(e) => updateTrack(selectedTrack.id, { titleKo: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-n3rve-500 focus:border-n3rve-main bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-all"
                        placeholder={language === 'ko' ? '한글 제목을 입력하세요' : 'Enter Korean title'}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {language === 'ko' ? '트랙 제목 (영문)' : 'Track Title (English)'}
                      </label>
                      <input
                        type="text"
                        value={selectedTrack.titleEn}
                        onChange={(e) => updateTrack(selectedTrack.id, { titleEn: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-n3rve-500 focus:border-n3rve-main bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-all"
                        placeholder={language === 'ko' ? '영문 제목을 입력하세요' : 'Enter English title'}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        ISRC {language === 'ko' ? '(선택사항)' : '(Optional)'}
                      </label>
                      <input
                        type="text"
                        value={selectedTrack.isrc || ''}
                        onChange={(e) => updateTrack(selectedTrack.id, { isrc: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-n3rve-500 focus:border-n3rve-main bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-all"
                        placeholder={language === 'ko' ? 'ISRC 코드 (예: KRXXX1234567)' : 'ISRC code (e.g., USXXX1234567)'}
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {language === 'ko' 
                          ? '이미 발매된 트랙의 ISRC가 있는 경우 입력하세요'
                          : 'Enter if you have an ISRC for an already released track'
                        }
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {language === 'ko' ? '트랙 유형' : 'Track Type'}
                      </label>
                      <select
                        value={selectedTrack.trackType || 'audio'}
                        onChange={(e) => updateTrack(selectedTrack.id, { trackType: e.target.value as 'audio' | 'music_video' })}
                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-n3rve-500 focus:border-n3rve-main bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-all"
                      >
                        <option value="audio">{language === 'ko' ? '오디오' : 'Audio'}</option>
                        <option value="music_video">{language === 'ko' ? '뮤직비디오' : 'Music Video'}</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setTitleTrack(selectedTrack.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                        selectedTrack.isTitle
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      <Star className={`w-4 h-4 ${selectedTrack.isTitle ? 'fill-current' : ''}`} />
                      {language === 'ko' ? '타이틀 트랙' : 'Title Track'}
                    </button>
                  </div>

                  {/* Track Translations */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h5 className="text-md font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                          <Languages className="w-4 h-4 text-n3rve-main" />
                          {t('번역', 'Translations')}
                        </h5>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {language === 'ko' 
                            ? '70개 이상의 언어로 트랙 제목을 번역할 수 있습니다'
                            : 'Translate track titles into over 70 languages'
                          }
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          const newTranslation: TrackTranslation = {
                            id: uuidv4(),
                            language: '',
                            title: ''
                          }
                          updateTrack(selectedTrack.id, {
                            translations: [...(selectedTrack.translations || []), newTranslation]
                          })
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-n3rve-main hover:bg-n3rve-700 text-white text-sm rounded-lg transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        {t('번역 추가', 'Add Translation')}
                      </button>
                    </div>
                    
                    {/* Translation info */}
                    <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-start gap-2">
                        <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                        <div className="text-xs text-blue-800 dark:text-blue-200">
                          <p className="font-medium mb-1">
                            {language === 'ko' 
                              ? '다양한 언어로 번역 추가 가능'
                              : 'Add translations in multiple languages'
                            }
                          </p>
                          <p>
                            {language === 'ko' 
                              ? '영어뿐만 아니라 일본어, 중국어, 스페인어, 프랑스어, 아랍어, 힌디어 등 70개 이상의 언어를 지원합니다.'
                              : 'Supports not only English but also Japanese, Chinese, Spanish, French, Arabic, Hindi, and over 70 other languages.'
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {selectedTrack.translations && selectedTrack.translations.length > 0 ? (
                      <div className="space-y-3">
                        {selectedTrack.translations.map((translation, index) => (
                          <div key={translation.id} className="flex gap-3 items-start bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  {t('언어', 'Language')}
                                </label>
                                <select
                                  value={translation.language}
                                  onChange={(e) => {
                                    const updatedTranslations = [...selectedTrack.translations!]
                                    updatedTranslations[index] = { ...translation, language: e.target.value }
                                    updateTrack(selectedTrack.id, { translations: updatedTranslations })
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-n3rve-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                                >
                                  <option value="">{language === 'ko' ? '언어를 선택하세요' : 'Select a language'}</option>
                                  <optgroup label={language === 'ko' ? '주요 언어' : 'Major Languages'}>
                                    {languageOptions.slice(0, 12).map(lang => (
                                      <option key={lang.value} value={lang.value}>{lang.label}</option>
                                    ))}
                                  </optgroup>
                                  <optgroup label={language === 'ko' ? '아시아 언어' : 'Asian Languages'}>
                                    {languageOptions.slice(12, 26).map(lang => (
                                      <option key={lang.value} value={lang.value}>{lang.label}</option>
                                    ))}
                                  </optgroup>
                                  <optgroup label={language === 'ko' ? '유럽 언어' : 'European Languages'}>
                                    {languageOptions.slice(26, 45).map(lang => (
                                      <option key={lang.value} value={lang.value}>{lang.label}</option>
                                    ))}
                                  </optgroup>
                                  <optgroup label={language === 'ko' ? '기타 언어' : 'Other Languages'}>
                                    {languageOptions.slice(45).map(lang => (
                                      <option key={lang.value} value={lang.value}>{lang.label}</option>
                                    ))}
                                  </optgroup>
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  {t('번역된 제목', 'Translated Title')}
                                </label>
                                <input
                                  type="text"
                                  value={translation.title}
                                  onChange={(e) => {
                                    const updatedTranslations = [...selectedTrack.translations!]
                                    updatedTranslations[index] = { ...translation, title: e.target.value }
                                    updateTrack(selectedTrack.id, { translations: updatedTranslations })
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-n3rve-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                                  placeholder={language === 'ko' ? '선택한 언어로 번역된 제목' : 'Title in selected language'}
                                  disabled={!translation.language}
                                />
                                {!translation.language && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {language === 'ko' 
                                      ? '먼저 언어를 선택해주세요'
                                      : 'Please select a language first'
                                    }
                                  </p>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                const updatedTranslations = selectedTrack.translations!.filter((_, i) => i !== index)
                                updateTrack(selectedTrack.id, { translations: updatedTranslations })
                              }}
                              className="mt-6 text-red-500 hover:text-red-700 p-2"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <Languages className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                          {language === 'ko' 
                            ? '아직 번역이 추가되지 않았습니다'
                            : 'No translations added yet'
                          }
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {language === 'ko' 
                            ? '전 세계 시장 진출을 위해 다양한 언어로 번역을 추가해보세요'
                            : 'Add translations in various languages for global market reach'
                          }
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Artists Section */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                  <p className="text-sm text-blue-800 dark:text-blue-200 flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    {language === 'ko' 
                      ? '≡ 아이콘을 드래그하여 메인 아티스트와 피처링 아티스트 간 이동할 수 있습니다' 
                      : '≡ Drag artists between Main and Featuring sections'
                    }
                  </p>
                </div>
                <div className="space-y-6">
                  {/* Main Artists */}
                  <div
                    onDragOver={(e) => handleArtistDragOver(e, 'main')}
                    onDragLeave={handleArtistDragLeave}
                    onDrop={(e) => handleArtistDrop(e, 'main')}
                    className={`transition-all ${
                      dragOverArtistType === 'main' 
                        ? 'ring-2 ring-n3rve-500 ring-offset-2 rounded-lg' 
                        : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <User className="w-5 h-5 text-n3rve-main" />
                        {t('메인 아티스트', 'Main Artists')}
                      </h4>
                      <button
                        type="button"
                        onClick={() => {
                          setArtistModalType('main')
                          setEditingArtist(null)
                          setShowArtistModal(true)
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-n3rve-main hover:bg-n3rve-700 text-white text-sm rounded-lg transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        {t('추가', 'Add')}
                      </button>
                    </div>
                    {selectedTrack.artists.length > 0 ? (
                      <div className="space-y-2">
                        {selectedTrack.artists.map((artist) => (
                          <div 
                            key={artist.id} 
                            draggable
                            onDragStart={(e) => handleArtistDragStart(e, artist, 'main')}
                            onDragEnd={handleArtistDragEnd}
                            className={`flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-move transition-all hover:shadow-md ${
                              draggedArtist?.artist.id === artist.id ? 'opacity-50' : ''
                            }`}
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <GripVertical className="w-4 h-4 text-gray-400" />
                              <div>
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {artist.primaryName}
                                  {artist.translatedName && (
                                    <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                                      ({artist.translatedName})
                                    </span>
                                  )}
                                </div>
                                {artist.customIdentifiers.length > 0 && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {artist.customIdentifiers.map(id => `${id.type}: ${id.value}`).join(' | ')}
                                  </div>
                                )}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeArtistFromTrack(artist.id, 'main')}
                              className="text-red-500 hover:text-red-700 p-1"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">
                        {t('메인 아티스트가 없습니다', 'No main artists added')}
                      </p>
                    )}
                  </div>

                  {/* Featuring Artists */}
                  <div
                    onDragOver={(e) => handleArtistDragOver(e, 'featuring')}
                    onDragLeave={handleArtistDragLeave}
                    onDrop={(e) => handleArtistDrop(e, 'featuring')}
                    className={`transition-all ${
                      dragOverArtistType === 'featuring' 
                        ? 'ring-2 ring-pink-500 ring-offset-2 rounded-lg' 
                        : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Mic className="w-5 h-5 text-pink-600" />
                        {t('피처링 아티스트', 'Featuring Artists')}
                      </h4>
                      <button
                        type="button"
                        onClick={() => {
                          setArtistModalType('featuring')
                          setEditingArtist(null)
                          setShowArtistModal(true)
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-pink-600 hover:bg-pink-700 text-white text-sm rounded-lg transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        {t('추가', 'Add')}
                      </button>
                    </div>
                    {selectedTrack.featuringArtists.length > 0 ? (
                      <div className="space-y-2">
                        {selectedTrack.featuringArtists.map((artist) => (
                          <div 
                            key={artist.id} 
                            draggable
                            onDragStart={(e) => handleArtistDragStart(e, artist, 'featuring')}
                            onDragEnd={handleArtistDragEnd}
                            className={`flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-move transition-all hover:shadow-md ${
                              draggedArtist?.artist.id === artist.id ? 'opacity-50' : ''
                            }`}
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <GripVertical className="w-4 h-4 text-gray-400" />
                              <div>
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {artist.primaryName}
                                  {artist.translatedName && (
                                    <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                                      ({artist.translatedName})
                                    </span>
                                  )}
                                </div>
                                {artist.customIdentifiers.length > 0 && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {artist.customIdentifiers.map(id => `${id.type}: ${id.value}`).join(' | ')}
                                  </div>
                                )}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeArtistFromTrack(artist.id, 'featuring')}
                              className="text-red-500 hover:text-red-700 p-1"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">
                        {t('피처링 아티스트가 없습니다', 'No featuring artists added')}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Contributors Section */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-n3rve-main" />
                    {t('기여자 정보', 'Contributor Information')}
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingContributor(null)
                      setShowContributorModal(true)
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-n3rve-main hover:bg-n3rve-700 text-white text-sm rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    추가
                  </button>
                </div>
                {selectedTrack.contributors.length > 0 ? (
                  <div className="space-y-3">
                    {selectedTrack.contributors.map((contributor) => {
                      return (
                        <div key={contributor.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="font-semibold text-gray-900 dark:text-white text-lg">
                                  {contributor.name}
                                </span>
                                {contributor.translations && contributor.translations.length > 0 && (
                                  <div className="flex items-center gap-1">
                                    <Languages className="w-3 h-3 text-gray-400" />
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      {contributor.translations.length} {language === 'ko' ? '개 언어' : 'languages'}
                                    </span>
                                  </div>
                                )}
                                {(contributor.appleMusicUrl || contributor.spotifyUrl) && (
                                  <div className="flex items-center gap-2">
                                    {contributor.appleMusicUrl && (
                                      <a
                                        href={contributor.appleMusicUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                        title="Apple Music"
                                      >
                                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                          <path d="M23.994 6.124a9.23 9.23 0 00-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043-1.054-.69-2.317-.905-3.614-.937-2.139-.05-4.288-.017-6.426-.017h-1.3c-1.866 0-3.739-.003-5.606.006-1.36.009-2.667.195-3.89.776C.196 1.113-.26 1.872.08 3.184c.066.257.135.515.227.763.51 1.378 1.47 2.335 2.83 2.785.912.3 1.872.423 2.832.449 1.665.045 3.33.018 4.995.018h1.662c1.962 0 3.924.006 5.886-.004 1.375-.007 2.696-.189 3.918-.772 1.558-.745 2.408-1.982 2.501-3.633.025-.44.026-.88-.009-1.32l.002.002zm-3.205 2.76c-.316.51-.788.849-1.405 1.016-.619.167-1.269.205-1.909.212-1.963.021-3.926.009-5.889.009h-1.618c-1.87 0-3.74.012-5.61-.006-.967-.009-1.925-.106-2.837-.4-.914-.295-1.59-.844-1.962-1.754-.247-.603-.166-1.226.144-1.793.324-.596.827-.976 1.508-1.19.679-.213 1.39-.27 2.095-.277 1.968-.021 3.936-.009 5.903-.009h1.584c1.952 0 3.904-.011 5.856.004.996.008 1.983.108 2.9.413.922.306 1.603.87 1.961 1.79.24.616.156 1.244-.162 1.821l.002.002zm-1.504-1.377c-.143-.357-.432-.613-.82-.713a3.104 3.104 0 00-.986-.065v5.817c0 .457-.066.892-.345 1.24-.278.35-.657.55-1.09.584-.79.061-1.407-.373-1.557-1.149a2.301 2.301 0 01-.033-.545V6.915a.664.664 0 00-.002-.05c-.225.006-.45.003-.674.012a2.552 2.552 0 00-.49.06c-.503.122-.836.5-.978.99a2.167 2.167 0 00-.065.615v3.896c0 .692.058 1.373.434 1.967.376.595.932.966 1.606 1.131.849.208 1.68.106 2.378-.437.703-.547 1.087-1.3 1.179-2.194.048-.462.037-.927.037-1.392V8.564c0-.761-.062-1.503-.62-2.07v.001z"/>
                                        </svg>
                                      </a>
                                    )}
                                    {contributor.spotifyUrl && (
                                      <a
                                        href={contributor.spotifyUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                        title="Spotify"
                                      >
                                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                                        </svg>
                                      </a>
                                    )}
                                  </div>
                                )}
                              </div>
                              
                              {/* Translations */}
                              {contributor.translations && contributor.translations.length > 0 && (
                                <div className="mb-2">
                                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                    {language === 'ko' ? '번역' : 'Translations'}:
                                  </span>
                                  <div className="flex flex-wrap gap-2 mt-1">
                                    {contributor.translations.map((translation, idx) => {
                                      const langOption = languageOptions.find(l => l.value === translation.language)
                                      return (
                                        <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-600 rounded text-xs">
                                          <span className="font-medium text-gray-600 dark:text-gray-300">
                                            {langOption?.label || translation.language}:
                                          </span>
                                          <span className="text-gray-800 dark:text-gray-200">
                                            {translation.name}
                                          </span>
                                        </span>
                                      )
                                    })}
                                  </div>
                                </div>
                              )}
                              
                              {/* Roles */}
                              <div className="mb-2">
                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                  {language === 'ko' ? '역할' : 'Roles'}:
                                </span>
                                <div className="flex flex-wrap gap-1.5 mt-1">
                                  {contributor.roles.map(role => {
                                    const roleOption = roleOptions.find(r => r.value === role)
                                    const roleLabel = roleOption 
                                      ? (language === 'ko' ? roleOption.label : roleOption.labelEn)
                                      : role
                                    
                                    // Determine color based on role type
                                    let colorClass = 'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-200'
                                    if (['composer', 'lyricist', 'arranger'].includes(role)) {
                                      colorClass = 'bg-n3rve-100 text-n3rve-800 dark:bg-n3rve-900/30 dark:text-n3rve-200'
                                    } else if (role.includes('producer')) {
                                      colorClass = 'bg-n3rve-100 text-purple-800 dark:bg-n3rve-900/30 dark:text-purple-200'
                                    } else if (role.includes('engineer')) {
                                      colorClass = 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200'
                                    } else if (['performer', 'studio_musician', 'soloist'].includes(role)) {
                                      colorClass = 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                                    }
                                    
                                    return (
                                      <span key={role} className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
                                        {roleLabel}
                                      </span>
                                    )
                                  })}
                                </div>
                              </div>
                              
                              {/* Instruments */}
                              {contributor.instruments && contributor.instruments.length > 0 && (
                                <div>
                                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                    {language === 'ko' ? '악기' : 'Instruments'}:
                                  </span>
                                  <div className="flex flex-wrap gap-1.5 mt-1">
                                    {contributor.instruments.map(instrument => (
                                      <span key={instrument} className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 rounded-full text-xs font-medium">
                                        <Music2 className="w-3 h-3" />
                                        {instrument}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => removeContributorFromTrack(contributor.id)}
                              className="text-red-500 hover:text-red-700 ml-2 p-1"
                              title={language === 'ko' ? '삭제' : 'Remove'}
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('기여자 정보가 없습니다', 'No contributor information added')}
                  </p>
                )}
              </div>

              {/* Individual Track Release Date */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-n3rve-main" />
                    {language === 'ko' ? '개별 트랙 발매일' : 'Individual Track Release Date'}
                  </h4>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id={`custom-release-${selectedTrack.id}`}
                      checked={selectedTrack.hasCustomReleaseDate || false}
                      onChange={(e) => {
                        updateTrack(selectedTrack.id, { 
                          hasCustomReleaseDate: e.target.checked,
                          consumerReleaseDate: e.target.checked ? selectedTrack.consumerReleaseDate || productMetadata.consumerReleaseDate : '',
                          releaseTime: e.target.checked ? selectedTrack.releaseTime || productMetadata.releaseTime : ''
                        })
                      }}
                      className="w-4 h-4 text-n3rve-main bg-gray-100 border-gray-300 rounded focus:ring-n3rve-500 focus:ring-2"
                    />
                    <label htmlFor={`custom-release-${selectedTrack.id}`} className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {language === 'ko' ? '이 트랙은 다른 발매일 사용' : 'Use different release date for this track'}
                    </label>
                  </div>
                </div>
                
                {selectedTrack.hasCustomReleaseDate && (
                  <div className="space-y-4 mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                          {language === 'ko' 
                            ? '개별 트랙 발매일은 일부 DSP에서만 지원됩니다. 지원하지 않는 DSP에서는 앨범 발매일이 적용됩니다.'
                            : 'Individual track release dates are only supported by some DSPs. Unsupported DSPs will use the album release date.'
                          }
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {language === 'ko' ? '트랙 발매일' : 'Track Release Date'} <span className="text-red-500">*</span>
                        </label>
                        <DatePicker
                          value={selectedTrack.consumerReleaseDate || ''}
                          onChange={(newDate) => updateTrack(selectedTrack.id, { consumerReleaseDate: newDate })}
                          placeholder="Select track release date"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {language === 'ko' ? '발매 시간 (KST)' : 'Release Time (KST)'}
                        </label>
                        <div className="space-y-3">
                          {!selectedTrack.releaseTime ? (
                            <div 
                              onClick={() => updateTrack(selectedTrack.id, { releaseTime: '12:00 AM' })}
                              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-pointer hover:border-n3rve-accent2 dark:hover:border-n3rve-500 transition-colors"
                            >
                              {language === 'ko' ? '시간을 입력해주세요' : 'Please enter time'}
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <select
                                value={selectedTrack.releaseTime.split(':')[0]}
                                onChange={(e) => {
                                  const hour = e.target.value
                                  const minute = selectedTrack.releaseTime!.split(':')[1]?.split(' ')[0] || '00'
                                  const period = selectedTrack.releaseTime!.split(' ')[1] || 'AM'
                                  const newTime = `${hour}:${minute} ${period}`
                                  updateTrack(selectedTrack.id, { releaseTime: newTime })
                                }}
                                className="flex-1 px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-n3rve-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                              >
                                {[...Array(12)].map((_, i) => {
                                  const hour = i + 1
                                  return (
                                    <option key={hour} value={hour.toString().padStart(2, '0')}>
                                      {hour}
                                    </option>
                                  )
                                })}
                              </select>
                              <span className="flex items-center text-gray-500 dark:text-gray-400">:</span>
                              <select
                                value={selectedTrack.releaseTime.split(':')[1]?.split(' ')[0] || '00'}
                                onChange={(e) => {
                                  const hour = selectedTrack.releaseTime!.split(':')[0]
                                  const minute = e.target.value
                                  const period = selectedTrack.releaseTime!.split(' ')[1] || 'AM'
                                  const newTime = `${hour}:${minute} ${period}`
                                  updateTrack(selectedTrack.id, { releaseTime: newTime })
                                }}
                                className="flex-1 px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-n3rve-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                              >
                                {[...Array(12)].map((_, i) => {
                                  const minute = i * 5
                                  return (
                                    <option key={minute} value={minute.toString().padStart(2, '0')}>
                                      {minute.toString().padStart(2, '0')}
                                    </option>
                                  )
                                })}
                              </select>
                              <select
                                value={selectedTrack.releaseTime.split(' ')[1] || 'AM'}
                                onChange={(e) => {
                                  const hour = selectedTrack.releaseTime!.split(':')[0]
                                  const minute = selectedTrack.releaseTime!.split(':')[1]?.split(' ')[0] || '00'
                                  const period = e.target.value
                                  const newTime = `${hour}:${minute} ${period}`
                                  updateTrack(selectedTrack.id, { releaseTime: newTime })
                                }}
                                className="px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-n3rve-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                              >
                                <option value="AM">AM</option>
                                <option value="PM">PM</option>
                              </select>
                              <button
                                type="button"
                                onClick={() => updateTrack(selectedTrack.id, { releaseTime: '' })}
                                className="px-3 py-3 text-gray-500 hover:text-red-500 transition-colors"
                                title={language === 'ko' ? '시간 지우기' : 'Clear time'}
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Time conversion display for individual track */}
                    {selectedTrack.releaseTime && selectedTrack.consumerReleaseDate && (
                      <div className="mt-4 bg-gradient-to-r from-n3rve-50 to-blue-50 dark:from-n3rve-900/20 dark:to-blue-900/20 border border-n3rve-200 dark:border-n3rve-700 rounded-xl p-4">
                        <div className="text-center space-y-3">
                          <div className="text-sm font-semibold text-n3rve-800 dark:text-n3rve-200">
                            {language === 'ko' ? '🚀 트랙 발매 예정 시간' : '🚀 Track Release Time'}
                          </div>
                          
                          {/* KST Display */}
                          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">
                              {language === 'ko' ? '한국 시간 (KST)' : 'Korea Standard Time (KST)'}
                            </div>
                            <div className="text-lg font-bold text-gray-900 dark:text-white">
                              {(() => {
                                const date = new Date(selectedTrack.consumerReleaseDate)
                                const options: Intl.DateTimeFormatOptions = { 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric',
                                  weekday: 'long'
                                }
                                const dateStr = language === 'ko' 
                                  ? date.toLocaleDateString('ko-KR', options)
                                  : date.toLocaleDateString('en-US', options)
                                
                                const timeStr = language === 'ko' 
                                  ? selectedTrack.releaseTime.replace('AM', '오전').replace('PM', '오후')
                                  : selectedTrack.releaseTime
                                
                                return `${dateStr} ${timeStr}`
                              })()}
                            </div>
                          </div>
                          
                          {/* UTC Display */}
                          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">
                              UTC (Coordinated Universal Time)
                            </div>
                            <div className="text-lg font-bold text-gray-900 dark:text-white">
                              {(() => {
                                const [time, period] = selectedTrack.releaseTime.split(' ')
                                const [hours, minutes] = time.split(':')
                                let hour = parseInt(hours)
                                
                                if (period === 'PM' && hour !== 12) hour += 12
                                if (period === 'AM' && hour === 12) hour = 0
                                
                                const kstDate = new Date(selectedTrack.consumerReleaseDate)
                                kstDate.setHours(hour, parseInt(minutes), 0, 0)
                                
                                const utcDate = new Date(kstDate.getTime() - (9 * 60 * 60 * 1000))
                                
                                const utcDateStr = utcDate.toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  weekday: 'long'
                                })
                                
                                const utcTimeStr = utcDate.toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: true
                                })
                                
                                return `${utcDateStr} ${utcTimeStr}`
                              })()}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Audio Specifications */}
              <div className="relative">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-n3rve-main to-n3rve-accent rounded-lg flex items-center justify-center">
                    <Volume2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {language === 'ko' ? '오디오 사양' : 'Audio Specifications'}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {language === 'ko' ? '오디오 포맷을 선택하세요' : 'Select audio formats'}
                    </p>
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                <div className="space-y-4">
                  {/* Dolby Atmos */}
                  <div 
                    onClick={() => updateTrack(selectedTrack.id, { dolbyAtmos: !selectedTrack.dolbyAtmos })}
                    className={`
                      relative p-4 rounded-xl border-2 cursor-pointer transition-all
                      ${selectedTrack.dolbyAtmos 
                        ? 'bg-n3rve-50 dark:bg-n3rve-900/20 border-n3rve-main' 
                        : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700'
                      }
                    `}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`
                          flex items-center justify-center w-5 h-5 rounded mt-0.5 transition-all
                          ${selectedTrack.dolbyAtmos 
                            ? 'bg-n3rve-main' 
                            : 'bg-gray-200 dark:bg-gray-700'
                          }
                        `}>
                          {selectedTrack.dolbyAtmos && (
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 dark:text-white">Dolby Atmos</span>
                            <span className="px-2 py-0.5 bg-n3rve-100 dark:bg-n3rve-900/30 text-n3rve-700 dark:text-n3rve-300 text-xs rounded-full font-medium">
                              3D Audio
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {language === 'ko' 
                              ? '공간 음향 기술로 더욱 입체적인 사운드 제공'
                              : 'Immersive spatial audio experience'
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Stereo */}
                  <div 
                    onClick={() => updateTrack(selectedTrack.id, { stereo: selectedTrack.stereo === false })}
                    className={`
                      relative p-4 rounded-xl border-2 cursor-pointer transition-all
                      ${selectedTrack.stereo !== false
                        ? 'bg-n3rve-50 dark:bg-n3rve-900/20 border-n3rve-main' 
                        : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700'
                      }
                    `}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`
                          flex items-center justify-center w-5 h-5 rounded mt-0.5 transition-all
                          ${selectedTrack.stereo !== false
                            ? 'bg-n3rve-main' 
                            : 'bg-gray-200 dark:bg-gray-700'
                          }
                        `}>
                          {selectedTrack.stereo !== false && (
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 dark:text-white">Stereo</span>
                            <span className="px-2 py-0.5 bg-n3rve-100 dark:bg-n3rve-900/30 text-n3rve-700 dark:text-n3rve-300 text-xs rounded-full font-medium">
                              Standard
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {language === 'ko' 
                              ? '표준 스테레오 오디오 (좌/우 채널)'
                              : 'Standard stereo audio (L/R channels)'
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Info Note */}
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-blue-800 dark:text-blue-200">
                        {language === 'ko' 
                          ? '최소 하나 이상의 오디오 포맷을 선택해야 합니다. 두 가지 모두 선택 가능합니다.'
                          : 'At least one audio format must be selected. You can select both formats.'
                        }
                      </p>
                    </div>
                  </div>
                </div>
                </div>
              </div>

              {/* Genre Section */}
              <div className="relative">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-n3rve-main to-n3rve-accent rounded-lg flex items-center justify-center">
                    <Tag className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {language === 'ko' ? '장르 선택' : 'Genre Selection'}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {language === 'ko' ? '트랙의 장르를 선택하세요' : 'Select genres for your track'}
                    </p>
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {language === 'ko' ? '메인 장르' : 'Main Genre'} <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedTrack.genre || ''}
                      onChange={(e) => updateTrack(selectedTrack.id, { genre: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-n3rve-500 focus:border-n3rve-main bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-all"
                    >
                      <option value="">{language === 'ko' ? '장르를 선택하세요' : 'Select a genre'}</option>
                      <option value="Alternative">Alternative</option>
                      <option value="Audiobooks">Audiobooks</option>
                      <option value="Blues">Blues</option>
                      <option value="Children's Music">Children's Music</option>
                      <option value="Classical">Classical</option>
                      <option value="Comedy">Comedy</option>
                      <option value="Country">Country</option>
                      <option value="Dance">Dance</option>
                      <option value="Electronic">Electronic</option>
                      <option value="Folk">Folk</option>
                      <option value="Hip Hop/Rap">Hip Hop/Rap</option>
                      <option value="Holiday">Holiday</option>
                      <option value="Inspirational">Inspirational</option>
                      <option value="Jazz">Jazz</option>
                      <option value="K-Pop">K-Pop</option>
                      <option value="Latin">Latin</option>
                      <option value="New Age">New Age</option>
                      <option value="Opera">Opera</option>
                      <option value="Pop">Pop</option>
                      <option value="R&B/Soul">R&B/Soul</option>
                      <option value="Reggae">Reggae</option>
                      <option value="Rock">Rock</option>
                      <option value="Soundtrack">Soundtrack</option>
                      <option value="World">World</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {language === 'ko' ? '서브장르' : 'Subgenre'}
                    </label>
                    <input
                      type="text"
                      value={selectedTrack.subgenre || ''}
                      onChange={(e) => updateTrack(selectedTrack.id, { subgenre: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-n3rve-500 focus:border-n3rve-main bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-all"
                      placeholder={language === 'ko' ? '예: Dance Pop' : 'e.g., Dance Pop'}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {language === 'ko' ? '대체 장르' : 'Alternate Genre'}
                    </label>
                    <select
                      value={selectedTrack.alternateGenre || ''}
                      onChange={(e) => updateTrack(selectedTrack.id, { alternateGenre: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-n3rve-500 focus:border-n3rve-main bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-all"
                    >
                      <option value="">{language === 'ko' ? '대체 장르를 선택하세요' : 'Select alternate genre'}</option>
                      <option value="Alternative">Alternative</option>
                      <option value="Audiobooks">Audiobooks</option>
                      <option value="Blues">Blues</option>
                      <option value="Children's Music">Children's Music</option>
                      <option value="Classical">Classical</option>
                      <option value="Comedy">Comedy</option>
                      <option value="Country">Country</option>
                      <option value="Dance">Dance</option>
                      <option value="Electronic">Electronic</option>
                      <option value="Folk">Folk</option>
                      <option value="Hip Hop/Rap">Hip Hop/Rap</option>
                      <option value="Holiday">Holiday</option>
                      <option value="Inspirational">Inspirational</option>
                      <option value="Jazz">Jazz</option>
                      <option value="K-Pop">K-Pop</option>
                      <option value="Latin">Latin</option>
                      <option value="New Age">New Age</option>
                      <option value="Opera">Opera</option>
                      <option value="Pop">Pop</option>
                      <option value="R&B/Soul">R&B/Soul</option>
                      <option value="Reggae">Reggae</option>
                      <option value="Rock">Rock</option>
                      <option value="Soundtrack">Soundtrack</option>
                      <option value="World">World</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {language === 'ko' ? '대체 서브장르' : 'Alternate Subgenre'}
                    </label>
                    <input
                      type="text"
                      value={selectedTrack.alternateSubgenre || ''}
                      onChange={(e) => updateTrack(selectedTrack.id, { alternateSubgenre: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-n3rve-500 focus:border-n3rve-main bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-all"
                      placeholder={language === 'ko' ? '대체 서브장르' : 'Alternate subgenre'}
                    />
                  </div>
                </div>
                </div>
              </div>

              {/* Language & Content Section */}
              <div className="relative">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-n3rve-main to-n3rve-accent rounded-lg flex items-center justify-center">
                    <Languages className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {language === 'ko' ? '언어 및 콘텐츠' : 'Language & Content'}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {language === 'ko' ? '트랙의 언어와 콘텐츠 설정' : 'Set language and content settings'}
                    </p>
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('메타데이터 언어', 'Metadata Language')}
                    </label>
                    <select
                      value={selectedTrack.metadataLanguage || 'en'}
                      onChange={(e) => updateTrack(selectedTrack.id, { metadataLanguage: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-n3rve-500 focus:border-n3rve-main bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-all"
                    >
                      {languageOptions.map(lang => (
                        <option key={lang.value} value={lang.value}>{lang.label}</option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {t('음원 정보를 입력할 언어를 선택하세요', 'Select the language for entering music metadata')}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('선정적 콘텐츠', 'Explicit Content')}
                    </label>
                    <select
                      value={selectedTrack.explicitContent ? 'explicit' : 'not-explicit'}
                      onChange={(e) => updateTrack(selectedTrack.id, { explicitContent: e.target.value === 'explicit' })}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-n3rve-500 focus:border-n3rve-main bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-all"
                    >
                      <option value="not-explicit">{t('비선정적', 'Not Explicit')}</option>
                      <option value="explicit">{t('선정적', 'Explicit')}</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {t('선정적 콘텐츠 여부를 설정하세요', 'Set whether the content is explicit')}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('음성 언어', 'Audio Language')} <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedTrack.audioLanguage || ''}
                      onChange={(e) => updateTrack(selectedTrack.id, { audioLanguage: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-n3rve-500 focus:border-n3rve-main bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-all"
                    >
                      <option value="">{t('언어 선택', 'Select Language')}</option>
                      {languageOptions.map(lang => (
                        <option key={lang.value} value={lang.value}>{lang.label}</option>
                      ))}
                      <option value="instrumental">{t('연주곡', 'Instrumental')}</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {t('음성에 사용된 언어를 선택하세요', 'Select the language used in the audio')}
                    </p>
                  </div>
                </div>
                </div>
              </div>

              {/* Preview Section */}
              <div className="relative">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-n3rve-main to-n3rve-accent rounded-lg flex items-center justify-center">
                    <Volume2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {language === 'ko' ? '미리듣기 설정' : 'Preview Settings'}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {language === 'ko' ? '스트리밍 서비스의 미리듣기 구간 설정' : 'Set preview section for streaming services'}
                    </p>
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {language === 'en' ? 'Playtime Start (Short Clip)' : '재생 시작 시간 (짧은 클립)'}
                    </label>
                    <input
                      type="number"
                      value={selectedTrack.playtimeStartShortClip || ''}
                      onChange={(e) => updateTrack(selectedTrack.id, { playtimeStartShortClip: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-n3rve-500 focus:border-n3rve-main bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-all"
                      placeholder={language === 'en' ? 'Start time (seconds)' : '시작 시간 (초)'}
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {language === 'en' ? 'Preview Length' : '미리듣기 길이'}
                    </label>
                    <input
                      type="number"
                      value={selectedTrack.previewLength || '30'}
                      onChange={(e) => updateTrack(selectedTrack.id, { previewLength: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-n3rve-500 focus:border-n3rve-main bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-all"
                      placeholder={language === 'en' ? 'Preview length (seconds)' : '미리듣기 길이 (초)'}
                      min="15"
                      max="90"
                    />
                  </div>
                </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Marketing Tab Content */}
      {activeTab === 'marketing' && (
        <div className="space-y-6">
          {/* Artist Information & Profile - Merged Section */}
          <div className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/10 rounded-xl p-6 border border-green-200 dark:border-green-800">
            <h4 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
              <div className="p-2 bg-gradient-to-br from-n3rve-main to-n3rve-accent rounded-lg">
                <User className="w-5 h-5 text-white" />
              </div>
              {language === 'ko' ? '아티스트 정보' : 'Artist Information'}
            </h4>
            
            <div className="space-y-6">
              {/* Artist Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {language === 'ko' ? '아티스트 이름' : 'Artist Name'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={marketing.artistName || ''}
                  onChange={(e) => setMarketing(prev => ({ ...prev, artistName: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-n3rve-500 focus:border-n3rve-main bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all"
                  placeholder={language === 'ko' ? '예: testusername' : 'e.g., testusername'}
                />
              </div>

              {/* Location Info */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {language === 'ko' ? '아티스트의 국가' : "Artist's Country"} <span className="text-red-500">*</span>
                </label>
                <select
                  value={marketing.artistCountry || ''}
                  onChange={(e) => setMarketing(prev => ({ ...prev, artistCountry: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-n3rve-500 focus:border-n3rve-main bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all"
                >
                  <option value="">{language === 'ko' ? '국가 선택' : 'Select Country'}</option>
                  <option value="KR">{language === 'ko' ? '대한민국' : 'South Korea'}</option>
                  <option value="US">{language === 'ko' ? '미국' : 'United States'}</option>
                  <option value="JP">{language === 'ko' ? '일본' : 'Japan'}</option>
                  <option value="CN">{language === 'ko' ? '중국' : 'China'}</option>
                  <option value="GB">{language === 'ko' ? '영국' : 'United Kingdom'}</option>
                  <option value="DE">{language === 'ko' ? '독일' : 'Germany'}</option>
                  <option value="FR">{language === 'ko' ? '프랑스' : 'France'}</option>
                  <option value="IT">{language === 'ko' ? '이탈리아' : 'Italy'}</option>
                  <option value="ES">{language === 'ko' ? '스페인' : 'Spain'}</option>
                  <option value="CA">{language === 'ko' ? '캐나다' : 'Canada'}</option>
                  <option value="AU">{language === 'ko' ? '호주' : 'Australia'}</option>
                  <option value="BR">{language === 'ko' ? '브라질' : 'Brazil'}</option>
                  <option value="IN">{language === 'ko' ? '인도' : 'India'}</option>
                  <option value="MX">{language === 'ko' ? '멕시코' : 'Mexico'}</option>
                  <option value="RU">{language === 'ko' ? '러시아' : 'Russia'}</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {language === 'ko' ? '아티스트의 현재 도시' : "Artist's Current City"} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={marketing.artistCurrentCity || ''}
                    onChange={(e) => setMarketing(prev => ({ ...prev, artistCurrentCity: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-n3rve-500 focus:border-n3rve-main bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all"
                    placeholder={language === 'ko' ? '예: 서울' : 'e.g., Seoul'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {language === 'ko' ? '아티스트의 고향' : "Artist's Hometown"} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={marketing.artistHometown || ''}
                    onChange={(e) => setMarketing(prev => ({ ...prev, artistHometown: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-n3rve-500 focus:border-n3rve-main bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all"
                    placeholder={language === 'ko' ? '예: 부산' : 'e.g., Busan'}
                  />
                </div>
              </div>

              {/* Artist Images */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {language === 'ko' ? '아티스트 이미지 업로드 (아바타)' : 'Upload Artist Image (Avatar)'}
                  </label>
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center hover:border-n3rve-main transition-colors bg-white dark:bg-gray-800">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file && file.size <= 3 * 1024 * 1024) {
                          setMarketing(prev => ({ ...prev, artistAvatar: file }))
                        } else {
                          alert(language === 'ko' ? '파일 크기는 3MB 이하여야 합니다.' : 'File size must be less than 3MB')
                        }
                      }}
                      className="hidden"
                      id="artist-avatar-upload"
                    />
                    <label htmlFor="artist-avatar-upload" className="cursor-pointer">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {language === 'ko' ? '파일을 드래그 앤 드롭하거나 ' : 'Drag & drop a file or '}
                        <span className="text-n3rve-main hover:text-n3rve-700 underline">browse</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {language === 'ko' ? '최대 파일 크기: 3 MB' : 'Max file size is 3 MB'}
                      </p>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {language === 'ko' ? '아티스트 로고 업로드' : 'Upload Artist Logo'}
                  </label>
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center hover:border-n3rve-main transition-colors bg-white dark:bg-gray-800">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file && file.size <= 3 * 1024 * 1024) {
                          setMarketing(prev => ({ ...prev, artistLogo: file }))
                        } else {
                          alert(language === 'ko' ? '파일 크기는 3MB 이하여야 합니다.' : 'File size must be less than 3MB')
                        }
                      }}
                      className="hidden"
                      id="artist-logo-upload"
                    />
                    <label htmlFor="artist-logo-upload" className="cursor-pointer">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {language === 'ko' ? '파일을 드래그 앤 드롭하거나 ' : 'Drag & drop a file or '}
                        <span className="text-n3rve-main hover:text-n3rve-700 underline">browse</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {language === 'ko' ? '최대 파일 크기: 3 MB' : 'Max file size is 3 MB'}
                      </p>
                    </label>
                  </div>
                </div>
              </div>

              {/* Press Shot Info */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {language === 'ko' ? '프레스 샷 / 아티스트 이미지 URL' : 'Press Shot / Artist Image URL'} <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    {language === 'ko' 
                      ? '고해상도 아티스트 프레스 사진 링크를 공유해주세요. 이 링크는 (음악) 플랫폼의 파트너와만 공유됩니다.'
                      : 'Please share a link to high resolution artist press-pictures. The link will be ONLY shared with partners at (music) platforms.'
                    }
                  </p>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                    <input
                      type="url"
                      value={marketing.pressShotUrl || ''}
                      onChange={(e) => setMarketing(prev => ({ ...prev, pressShotUrl: e.target.value }))}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-n3rve-500 focus:border-n3rve-main bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all"
                      placeholder="https://example.com/press-shot.jpg"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {language === 'ko' ? '프레스 샷 크레딧' : 'Press Shot Credits'}
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    {language === 'ko' 
                      ? '사진을 찍은 사진작가의 이름을 제공해주세요.'
                      : 'Please provide the name of the photographer who took the photo.'
                    }
                  </p>
                  <input
                    type="text"
                    value={marketing.pressShotCredits || ''}
                    onChange={(e) => setMarketing(prev => ({ ...prev, pressShotCredits: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-n3rve-500 focus:border-n3rve-main bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all"
                    placeholder={language === 'ko' ? '예: 김철수' : 'e.g., John Doe'}
                  />
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
                <h5 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  {language === 'ko' ? '아티스트 프로필' : 'Artist Profile'}
                </h5>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Toundates URL
                </label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                  <input
                    type="url"
                    value={marketing.toundatesUrl}
                    onChange={(e) => setMarketing(prev => ({ ...prev, toundatesUrl: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-n3rve-500 focus:border-n3rve-main bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-all"
                    placeholder="https://toundates.com/artist"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {language === 'ko' ? '아티스트 성별' : 'Artist Gender'}
                </label>
                <div className="mb-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-xs text-blue-800 dark:text-blue-200 italic">
                    {language === 'ko' 
                      ? "아티스트 성별: 플레이리스트와 아티스트 마케팅 캠페인의 성별 균형을 개선하기 위한 노력으로, 여러 DSP가 모든 새로운 음원의 아티스트 성별을 추적하고 있습니다. 왼쪽에 제공된 옵션에 해당하는 성별 옵션은 DSP에 음원을 제출할 때 사용됩니다. DSP에 아티스트의 성별 정체성을 알리기 위해 '기타' 필드를 사용하십시오. 이 목록에 옵션이 없는 경우."
                      : "Artist Gender: In an effort to improve gender balance in playlists and artist marketing campaigns, a number of DSPs are tracking artist gender for all new pitches. The gender options on the left correspond with the options we're given when pitching your content to the DSPs. Please use the \"Other\" field to inform us of your Artist's Gender identity, if this is not an option on this list."
                    }
                  </p>
                </div>
                <select
                  value={marketing.artistGender}
                  onChange={(e) => setMarketing(prev => ({ ...prev, artistGender: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-n3rve-500 focus:border-n3rve-main bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-all"
                >
                  <option value="">{language === 'ko' ? '선택하세요' : 'Select'}</option>
                  <option value="male">{language === 'ko' ? '남성' : 'Male'}</option>
                  <option value="female">{language === 'ko' ? '여성' : 'Female'}</option>
                  <option value="non-binary">{language === 'ko' ? '논바이너리' : 'Non-binary'}</option>
                  <option value="other">{language === 'ko' ? '기타' : 'Other'}</option>
                  <option value="prefer-not-to-say">{language === 'ko' ? '밝히고 싶지 않음' : 'Prefer not to say'}</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {language === 'ko' ? '사회 운동 / 인식 제고' : 'Social Movements / Awareness-Raising'}
                </label>
                <div className="mb-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-xs text-green-800 dark:text-green-200 italic">
                    {language === 'ko' 
                      ? "우리는 다양한 배경과 문화를 가진 아티스트들과 함께 일하는 것을 자랑스럽게 생각하며, 사회적 또는 윤리적 행동을 위해 변화를 추진하는 아티스트들과 함께 일합니다. 연중 내내 우리는 인식 제고 활동에 참여하여 아티스트들의 음악과 메시지를 대표하고 존중합니다.\n\n왼쪽에서 아티스트 신원과 강하게 연결된 사회 운동/인식 제고 활동을 선택할 수 있습니다."
                      : "We're proud to work with artists from many different backgrounds and cultures and to work with artists that push for change for good, in either social or ethical behaviour. Throughout the year, we will engage in awareness-raising activities that represent, highlight and honour the music and messages of our artists.\n\nOn the left, you'll be able to select the social movements/awareness-raising activities that your artist identifies strongly with."
                    }
                  </p>
                </div>
                <textarea
                  value={marketing.socialMovements}
                  onChange={(e) => setMarketing(prev => ({ ...prev, socialMovements: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-n3rve-500 focus:border-n3rve-main bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-all"
                  placeholder={language === 'ko' ? '아티스트가 지지하는 사회 운동이나 캠페인을 설명해주세요' : 'Describe social movements or campaigns the artist supports'}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {language === 'ko' ? '아티스트 바이오' : 'Artist Bio'}
                </label>
                <textarea
                  value={marketing.artistBio}
                  onChange={(e) => setMarketing(prev => ({ ...prev, artistBio: e.target.value }))}
                  rows={6}
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-n3rve-500 focus:border-n3rve-main bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-all"
                  placeholder={language === 'ko' ? '아티스트의 배경, 스타일, 메시지 등을 포함한 상세한 바이오그래피를 작성해주세요' : 'Write a detailed biography including background, style, and message'}
                />
              </div>
            </div>
          </div>

          {/* DSP Profile IDs */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-n3rve-main to-n3rve-accent rounded-lg">
                <Database className="w-5 h-5 text-white" />
              </div>
              {language === 'ko' ? 'DSP 프로필 ID' : 'DSP Profile IDs'}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Spotify Artist ID
                </label>
                <input
                  type="text"
                  value={marketing.spotifyArtistId || ''}
                  onChange={(e) => setMarketing(prev => ({ ...prev, spotifyArtistId: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-n3rve-500 focus:border-n3rve-main bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-all"
                  placeholder="spotify:artist:3WrFJ7ztbogyGnTHbHJFl2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Apple Music Artist ID
                </label>
                <input
                  type="text"
                  value={marketing.appleMusicArtistId || ''}
                  onChange={(e) => setMarketing(prev => ({ ...prev, appleMusicArtistId: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-n3rve-500 focus:border-n3rve-main bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-all"
                  placeholder="1234567890"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  SoundCloud Artist ID
                </label>
                <input
                  type="text"
                  value={marketing.soundcloudArtistId || ''}
                  onChange={(e) => setMarketing(prev => ({ ...prev, soundcloudArtistId: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-n3rve-500 focus:border-n3rve-main bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-all"
                  placeholder="soundcloud-artist-id"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  YouTube Channel ID
                </label>
                <input
                  type="text"
                  value={marketing.youtubeChannelId || ''}
                  onChange={(e) => setMarketing(prev => ({ ...prev, youtubeChannelId: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-n3rve-500 focus:border-n3rve-main bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-all"
                  placeholder="UCxxxxxxxxxxxxxx"
                />
              </div>
            </div>
          </div>

          {/* Social Media URLs */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-n3rve-main to-n3rve-accent rounded-lg">
                <Share2 className="w-5 h-5 text-white" />
              </div>
              {language === 'ko' ? '소셜 미디어 URL' : 'Social Media URLs'}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Instagram
                </label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                  <input
                    type="url"
                    value={marketing.instagramUrl || ''}
                    onChange={(e) => setMarketing(prev => ({ ...prev, instagramUrl: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-n3rve-500 focus:border-n3rve-main bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-all"
                    placeholder="https://instagram.com/username"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Twitter
                </label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                  <input
                    type="url"
                    value={marketing.twitterUrl || ''}
                    onChange={(e) => setMarketing(prev => ({ ...prev, twitterUrl: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-n3rve-500 focus:border-n3rve-main bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-all"
                    placeholder="https://twitter.com/username"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Facebook
                </label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                  <input
                    type="url"
                    value={marketing.facebookUrl || ''}
                    onChange={(e) => setMarketing(prev => ({ ...prev, facebookUrl: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-n3rve-500 focus:border-n3rve-main bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-all"
                    placeholder="https://facebook.com/page"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  TikTok
                </label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                  <input
                    type="url"
                    value={marketing.tiktokUrl || ''}
                    onChange={(e) => setMarketing(prev => ({ ...prev, tiktokUrl: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-n3rve-500 focus:border-n3rve-main bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-all"
                    placeholder="https://tiktok.com/@username"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  YouTube
                </label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                  <input
                    type="url"
                    value={marketing.youtubeUrl || ''}
                    onChange={(e) => setMarketing(prev => ({ ...prev, youtubeUrl: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-n3rve-500 focus:border-n3rve-main bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-all"
                    placeholder="https://youtube.com/channel"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Website
                </label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                  <input
                    type="url"
                    value={marketing.websiteUrl || ''}
                    onChange={(e) => setMarketing(prev => ({ ...prev, websiteUrl: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-n3rve-500 focus:border-n3rve-main bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-all"
                    placeholder="https://example.com"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Similar Artists & Sync History */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-n3rve-main to-n3rve-accent rounded-lg">
                <Music className="w-5 h-5 text-white" />
              </div>
              {language === 'ko' ? '유사 아티스트 & 싱크 히스토리' : 'Similar Artists & Sync History'}
            </h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {language === 'ko' ? '유사 아티스트 (Sounds Like)' : 'Similar Artists (Sounds Like)'}
                </label>
                <input
                  type="text"
                  value={marketing.similarArtists}
                  onChange={(e) => setMarketing(prev => ({ ...prev, similarArtists: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-n3rve-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder={language === 'ko' ? '비슷한 사운드를 가진 아티스트들을 입력하세요' : 'Enter artists with similar sounds'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {language === 'ko' ? '아티스트에게 싱크 히스토리가 있나요?' : 'Does the artist have a sync history?'}
                </label>
                <div className="flex gap-4 mb-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="hasSyncHistory"
                      value="yes"
                      checked={marketing.hasSyncHistory === 'yes'}
                      onChange={(e) => setMarketing(prev => ({ ...prev, hasSyncHistory: e.target.value }))}
                      className="w-4 h-4 text-n3rve-main focus:ring-n3rve-500"
                    />
                    <span className="text-gray-700 dark:text-gray-300">{language === 'ko' ? '예' : 'Yes'}</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="hasSyncHistory"
                      value="no"
                      checked={marketing.hasSyncHistory === 'no'}
                      onChange={(e) => setMarketing(prev => ({ ...prev, hasSyncHistory: e.target.value }))}
                      className="w-4 h-4 text-n3rve-main focus:ring-n3rve-500"
                    />
                    <span className="text-gray-700 dark:text-gray-300">{language === 'ko' ? '아니오' : 'No'}</span>
                  </label>
                </div>
                {marketing.hasSyncHistory === 'yes' && (
                  <textarea
                    value={marketing.syncHistory}
                    onChange={(e) => setMarketing(prev => ({ ...prev, syncHistory: e.target.value }))}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-n3rve-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder={language === 'ko' ? "아티스트의 싱크 히스토리를 나열해주세요" : "Please list the Artist's Sync History"}
                  />
                )}
              </div>
            </div>
          </div>


          {/* Moods */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-n3rve-main to-n3rve-accent rounded-lg">
                <Heart className="w-5 h-5 text-white" />
              </div>
              {language === 'ko' ? '분위기' : 'Mood(s)'} <span className="text-sm font-normal text-gray-500">*</span>
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {language === 'ko' ? '이 릴리즈를 특징짓는 분위기를 최대 3개까지 선택하세요' : 'Choose up to 3 moods that characterise this release'}
              {marketing.moods.length > 0 && (
                <span className="ml-2 text-n3rve-main font-medium">
                  ({marketing.moods.length}/3 {language === 'ko' ? '선택됨' : 'selected'})
                </span>
              )}
            </p>
            
            {/* Selected Moods */}
            {marketing.moods.length > 0 && (
              <div className="mb-4 p-3 bg-n3rve-50 dark:bg-n3rve-900/20 rounded-lg">
                <div className="flex flex-wrap gap-2">
                  {marketing.moods.map((mood: string) => (
                    <span
                      key={mood}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-n3rve-main text-white rounded-full text-sm font-medium"
                    >
                      {mood}
                      <button
                        onClick={() => {
                          setMarketing(prev => ({ ...prev, moods: prev.moods.filter((m: string) => m !== mood) }))
                        }}
                        className="ml-1 hover:bg-white/20 rounded-full p-0.5 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Mood Options Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {['Chill', 'Cooking', 'Energetic', 'Feel Good', 'Fierce', 'Fitness', 'Focus', 'Happy', 
                'Meditative', 'Motivation', 'Party', 'Romantic', 'Sad', 'Sexy', 'Sleep', 'Throwback', 
                'Feeling Blue', 'Heartbreak'].map((mood) => (
                <button
                  key={mood}
                  onClick={() => {
                    if (marketing.moods.includes(mood)) {
                      setMarketing(prev => ({ ...prev, moods: prev.moods.filter((m: string) => m !== mood) }))
                    } else if (marketing.moods.length < 3) {
                      setMarketing(prev => ({ ...prev, moods: [...prev.moods, mood] }))
                    }
                  }}
                  className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                    marketing.moods.includes(mood)
                      ? 'border-n3rve-main bg-n3rve-50 dark:bg-n3rve-900/30 text-n3rve-900 dark:text-n3rve-100'
                      : 'border-gray-200 dark:border-gray-700 hover:border-n3rve-main/50 hover:bg-gray-50 dark:hover:bg-gray-900/50 text-gray-700 dark:text-gray-300'
                  } ${marketing.moods.length >= 3 && !marketing.moods.includes(mood) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={marketing.moods.length >= 3 && !marketing.moods.includes(mood)}
                >
                  {mood}
                </button>
              ))}
            </div>
          </div>

          {/* Instruments */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-n3rve-main to-n3rve-accent rounded-lg">
                <Music2 className="w-5 h-5 text-white" />
              </div>
              {language === 'ko' ? '악기' : 'Instruments'} <span className="text-sm font-normal text-gray-500">*</span>
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {language === 'ko' ? '이 레코드에서 사용된 악기는 무엇입니까?' : 'What instruments are used on this record?'}
              {marketing.instruments.length > 0 && (
                <span className="ml-2 text-n3rve-main font-medium">
                  ({marketing.instruments.length} {language === 'ko' ? '선택됨' : 'selected'})
                </span>
              )}
            </p>
            
            {/* Selected Instruments */}
            {marketing.instruments.length > 0 && (
              <div className="mb-4 p-3 bg-n3rve-50 dark:bg-n3rve-900/20 rounded-lg">
                <div className="flex flex-wrap gap-2">
                  {marketing.instruments.map((instrument: string) => (
                    <span
                      key={instrument}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-n3rve-main text-white rounded-full text-sm font-medium"
                    >
                      {instrument}
                      <button
                        onClick={() => {
                          setMarketing(prev => ({ ...prev, instruments: prev.instruments.filter((i: string) => i !== instrument) }))
                        }}
                        className="ml-1 hover:bg-white/20 rounded-full p-0.5 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Search Box */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={language === 'ko' ? '악기 검색...' : 'Search instruments...'}
                  value={instrumentSearch}
                  onChange={(e) => setInstrumentSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-n3rve-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            
            {/* Instrument Categories */}
            <div className="space-y-4">
              {/* String Instruments */}
              <div>
                <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {language === 'ko' ? '현악기' : 'String Instruments'}
                </h5>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {['Acoustic Guitar', 'Electric Guitar', 'Classical Guitar', 'Bass Guitar', 'Violin', 'Cello', 'Double Bass']
                    .filter(inst => inst.toLowerCase().includes(instrumentSearch.toLowerCase()))
                    .map((instrument) => (
                    <button
                      key={instrument}
                      onClick={() => {
                        if (marketing.instruments.includes(instrument)) {
                          setMarketing(prev => ({ ...prev, instruments: prev.instruments.filter((i: string) => i !== instrument) }))
                        } else {
                          setMarketing(prev => ({ ...prev, instruments: [...prev.instruments, instrument] }))
                        }
                      }}
                      className={`p-2 rounded-lg border text-sm font-medium transition-all ${
                        marketing.instruments.includes(instrument)
                          ? 'border-n3rve-main bg-n3rve-50 dark:bg-n3rve-900/30 text-n3rve-900 dark:text-n3rve-100'
                          : 'border-gray-200 dark:border-gray-700 hover:border-n3rve-main/50 hover:bg-gray-50 dark:hover:bg-gray-900/50 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {instrument}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Keyboard Instruments */}
              <div>
                <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {language === 'ko' ? '건반악기' : 'Keyboard Instruments'}
                </h5>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {['Piano', 'Keyboard', 'Synthesizer', 'Organ', 'Accordion']
                    .filter(inst => inst.toLowerCase().includes(instrumentSearch.toLowerCase()))
                    .map((instrument) => (
                    <button
                      key={instrument}
                      onClick={() => {
                        if (marketing.instruments.includes(instrument)) {
                          setMarketing(prev => ({ ...prev, instruments: prev.instruments.filter((i: string) => i !== instrument) }))
                        } else {
                          setMarketing(prev => ({ ...prev, instruments: [...prev.instruments, instrument] }))
                        }
                      }}
                      className={`p-2 rounded-lg border text-sm font-medium transition-all ${
                        marketing.instruments.includes(instrument)
                          ? 'border-n3rve-main bg-n3rve-50 dark:bg-n3rve-900/30 text-n3rve-900 dark:text-n3rve-100'
                          : 'border-gray-200 dark:border-gray-700 hover:border-n3rve-main/50 hover:bg-gray-50 dark:hover:bg-gray-900/50 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {instrument}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Wind Instruments */}
              <div>
                <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {language === 'ko' ? '관악기' : 'Wind Instruments'}
                </h5>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {['Flute', 'Clarinet', 'Saxophone', 'Trumpet', 'French Horn', 'Trombone', 'Harmonica']
                    .filter(inst => inst.toLowerCase().includes(instrumentSearch.toLowerCase()))
                    .map((instrument) => (
                    <button
                      key={instrument}
                      onClick={() => {
                        if (marketing.instruments.includes(instrument)) {
                          setMarketing(prev => ({ ...prev, instruments: prev.instruments.filter((i: string) => i !== instrument) }))
                        } else {
                          setMarketing(prev => ({ ...prev, instruments: [...prev.instruments, instrument] }))
                        }
                      }}
                      className={`p-2 rounded-lg border text-sm font-medium transition-all ${
                        marketing.instruments.includes(instrument)
                          ? 'border-n3rve-main bg-n3rve-50 dark:bg-n3rve-900/30 text-n3rve-900 dark:text-n3rve-100'
                          : 'border-gray-200 dark:border-gray-700 hover:border-n3rve-main/50 hover:bg-gray-50 dark:hover:bg-gray-900/50 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {instrument}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Percussion */}
              <div>
                <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {language === 'ko' ? '타악기' : 'Percussion'}
                </h5>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {['Drums', 'Drum Kit', 'Djembe', 'Tambourine', 'Cymbals', 'Marimba', 'Xylophone']
                    .filter(inst => inst.toLowerCase().includes(instrumentSearch.toLowerCase()))
                    .map((instrument) => (
                    <button
                      key={instrument}
                      onClick={() => {
                        if (marketing.instruments.includes(instrument)) {
                          setMarketing(prev => ({ ...prev, instruments: prev.instruments.filter((i: string) => i !== instrument) }))
                        } else {
                          setMarketing(prev => ({ ...prev, instruments: [...prev.instruments, instrument] }))
                        }
                      }}
                      className={`p-2 rounded-lg border text-sm font-medium transition-all ${
                        marketing.instruments.includes(instrument)
                          ? 'border-n3rve-main bg-n3rve-50 dark:bg-n3rve-900/30 text-n3rve-900 dark:text-n3rve-100'
                          : 'border-gray-200 dark:border-gray-700 hover:border-n3rve-main/50 hover:bg-gray-50 dark:hover:bg-gray-900/50 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {instrument}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* World/Traditional */}
              <div>
                <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {language === 'ko' ? '전통악기' : 'World/Traditional'}
                </h5>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {['Erhu', 'Sitar', 'Koto', 'Didgeridoo', 'Banjo', 'Ukulele', 'Mandolin']
                    .filter(inst => inst.toLowerCase().includes(instrumentSearch.toLowerCase()))
                    .map((instrument) => (
                    <button
                      key={instrument}
                      onClick={() => {
                        if (marketing.instruments.includes(instrument)) {
                          setMarketing(prev => ({ ...prev, instruments: prev.instruments.filter((i: string) => i !== instrument) }))
                        } else {
                          setMarketing(prev => ({ ...prev, instruments: [...prev.instruments, instrument] }))
                        }
                      }}
                      className={`p-2 rounded-lg border text-sm font-medium transition-all ${
                        marketing.instruments.includes(instrument)
                          ? 'border-n3rve-main bg-n3rve-50 dark:bg-n3rve-900/30 text-n3rve-900 dark:text-n3rve-100'
                          : 'border-gray-200 dark:border-gray-700 hover:border-n3rve-main/50 hover:bg-gray-50 dark:hover:bg-gray-900/50 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {instrument}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Elevator Pitch */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <div className="p-2 bg-gradient-to-br from-n3rve-main to-n3rve-accent rounded-lg">
                  <Megaphone className="w-5 h-5 text-white" />
                </div>
                {language === 'ko' ? '엘리베이터 피치' : 'Elevator Pitch'}
              </h4>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-2 mb-3">
                  <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <h5 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                      {language === 'ko' ? '엘리베이터 피치 작성하기' : 'Crafting Your Elevator Pitch'}
                    </h5>
                    <div className="space-y-3 text-sm text-blue-800 dark:text-blue-200">
                      <div>
                        <p className="font-medium mb-1">{language === 'ko' ? '엘리베이터 피치 - 베스트 프랙티스' : 'Elevator Pitch - best practices'}</p>
                        <p className="text-xs">
                          {language === 'ko' 
                            ? '엘리베이터를 타는 시간 동안 누군가에게 프로젝트를 피칭해야 한다면 - 무엇을 말하시겠습니까?'
                            : 'If you had the duration of an elevator ride to pitch your project to someone - what would you say?'
                          }
                        </p>
                      </div>
                      <p className="text-xs">
                        {language === 'ko' 
                          ? '완벽한 엘리베이터 피치는 최대 500자의 단일 단락으로 작성됩니다. 왜 이 트랙이 중요한지 자세히 설명하는 요약이어야 합니다 - 여기서 명확하고, 설득력 있고, 흥미로운 방식으로 DSP에게 음악에 대해 이야기할 수 있습니다.'
                          : 'The perfect Elevator Pitch is written in one single paragraph of max 500 characters. It should be a summary of the track that details why it\'s so important - here\'s where you get to talk about your music to the DSPs in a way that should be clear, compelling and interesting.'
                        }
                      </p>
                      <div className="text-xs">
                        <p className="mb-1">{language === 'ko' ? '다음과 같은 사항을 생각해보면 유용할 수 있습니다:' : 'It can be useful to think about such things as:'}</p>
                        <ul className="list-disc list-inside space-y-0.5 ml-2">
                          <li>{language === 'ko' ? '노래의 스토리는 무엇인가?' : 'What\'s the story of the song?'}</li>
                          <li>{language === 'ko' ? '이 노래를 특별하게 만드는 것은 무엇인가?' : 'What makes this song so special?'}</li>
                          <li>{language === 'ko' ? '노래를 홍보하기 위해 당신과 아티스트가 하고 있는 흥미로운 일들은 무엇인가 - 마케팅, 투어, 디지털 활성화, 팬 커뮤니티, D2F 전략, 프로모?' : 'What interesting things are you and the artist doing to promote the song - marketing, touring, digital activations, fan communities, D2F strategies, promo?'}</li>
                        </ul>
                      </div>
                      <p className="text-xs font-medium text-red-600 dark:text-red-400">
                        {language === 'ko' 
                          ? '특정 DSP를 언급하지 말고 폭넓은 어필을 위해 플랫폼에 구애받지 않는 피치를 유지하세요.'
                          : 'Please avoid mentioning specific DSPs and keep your pitch platform-agnostic to ensure broad appeal.'
                        }
                      </p>
                      <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-700">
                        <p className="font-medium mb-1">{language === 'ko' ? '훅 - 베스트 프랙티스' : 'Hook - best practices'}</p>
                        <p className="text-xs">
                          {language === 'ko' 
                            ? '프로젝트를 판매하는 데 10초밖에 없다면 - 무엇을 말하시겠습니까?'
                            : 'And if you had only 10 seconds to sell your project - what would you say?'
                          }
                        </p>
                        <p className="text-xs mt-1">
                          {language === 'ko' 
                            ? '이것은 이 릴리즈를 흥미롭게 만드는 것이 무엇인지 즉시 요약하고 설명하는 최대 175자의 강렬하고 주의를 끄는 단일 문장입니다. 여기서는 가장 설득력 있는 정보만 사용하고 정말로 와닿는 것에 집중하세요.'
                            : 'This is a punchy, attention grabbing single sentence of max 175 characters that instantly summarises and explains what makes this release exciting. Use only the most compelling info here and focus on what really cuts through.'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              {/* Hook */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {language === 'ko' ? '1. 당신의 훅은 무엇입니까?' : "1. What's Your Hook?"} <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  {language === 'ko' 
                    ? '주의를 즉시 사로잡는 한두 문장으로 릴리스를 설명하세요. 이 프로젝트를 흥미롭고, 독특하거나, 뉴스거리로 만드는 것은 무엇입니까? (최대 175자)'
                    : 'Describe your release in one or two sentences that instantly capture attention. What makes this project exciting, unique, or newsworthy? (Max. 175 characters)'
                  }
                </p>
                <div className="relative">
                  <textarea
                    value={marketing.hook}
                    onChange={(e) => {
                      if (e.target.value.length <= 175) {
                        setMarketing(prev => ({ ...prev, hook: e.target.value }))
                      }
                    }}
                    rows={2}
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-n3rve-500 focus:border-n3rve-main bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-all resize-none"
                    placeholder={language === 'ko' 
                      ? '예: 글로벌 히트곡 제작자와 신예 K-pop 아티스트의 획기적인 콜라보레이션' 
                      : 'e.g., A groundbreaking collaboration between a global hitmaker and rising K-pop artist'
                    }
                  />
                  <div className="absolute bottom-2 right-2 text-xs text-gray-500">
                    {marketing.hook.length} / 175
                  </div>
                </div>
              </div>
              
              {/* Main Pitch */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {language === 'ko' ? '2. 메인 피치' : '2. The Main Pitch'} <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  {language === 'ko' 
                    ? '프로젝트의 본질—스토리, 영향력, 비전—을 500자 이내로 포착하는 간결하고 설득력 있는 요약을 전달하세요.\n\n폭넓은 어필을 위해 피치를 플랫폼에 구애받지 않게 유지하고 특정 DSP를 언급하지 마세요.'
                    : 'Deliver a concise and compelling summary that captures the essence of your project—its story, impact, and vision—all within 500 characters.\n\nBe sure to keep your pitch platform-agnostic and avoid mentioning specific DSPs to ensure broad appeal.'
                  }
                </p>
                <div className="relative">
                  <textarea
                    value={marketing.mainPitch}
                    onChange={(e) => {
                      if (e.target.value.length <= 500) {
                        setMarketing(prev => ({ ...prev, mainPitch: e.target.value }))
                      }
                    }}
                    rows={5}
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-n3rve-500 focus:border-n3rve-main bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-all resize-none"
                    placeholder={language === 'ko' 
                      ? '프로젝트의 스토리, 영향력, 비전을 설명하세요...' 
                      : 'Describe the story, impact, and vision of your project...'
                    }
                  />
                  <div className="absolute bottom-2 right-2 text-xs text-gray-500">
                    {marketing.mainPitch.length} / 500
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Marketing Drivers */}
          <div className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/10 rounded-xl p-6 border border-green-200 dark:border-green-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {language === 'ko' ? '새 마케팅 드라이버 추가' : 'Add New Marketing Driver'}
                </h4>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      {language === 'ko' ? '음악을 위한 임팩트 있는 마케팅 드라이버 만들기:' : 'Craft Impactful Marketing Drivers for Your Music:'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {language === 'ko' 
                      ? "엘리베이터 피치가 음악에 대한 매력적인 이야기를 전달하는 동안, 마케팅 드라이버는 프로젝트를 돋보이게 하는 전략적 요소를 강조하는 명확한 포인트 세트로 작용합니다. 우리는 이러한 드라이버를 불릿 포인트로 포맷하여 엘리베이터 피치의 내러티브를 정확하게 보완합니다."
                      : "While your Elevator Pitch tells a compelling story about your music, the Marketing Drivers serve as a clear set of points highlighting the strategic elements that make your project stand out. We will format these drivers into bullet points, ensuring they complement the narrative of your Elevator Pitch with precision."
                    }
                  </p>
                  <div className="mt-3">
                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      {language === 'ko' ? '새로운 제출 구조: 관련성과 정확성에 초점:' : 'New Submission Structure: Focus on Relevance and Precision:'}
                    </span>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      {language === 'ko' 
                        ? "우리의 새로운 라인별 제출 형식을 통해 글로벌하게 호소하고 타겟 지역에 특별히 맞춤화된 전략을 명확히 표현할 수 있습니다. 이 구조화된 접근법은 보다 효과적인 시장 커버리지를 보장하고 지역 참여와 지원을 향상시킵니다."
                        : "Our new line-by-line submission format allows you to articulate strategies that appeal globally and cater specifically to targeted regions. This structured approach ensures more effective market coverage, enhancing local engagement and support."
                      }
                    </p>
                  </div>
                  <div className="mt-3">
                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      {language === 'ko' ? '영향력과 비전 입증:' : 'Demonstrate Impact and Vision:'}
                    </span>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      {language === 'ko' 
                        ? "소셜 미디어 메트릭, 파트너십, 프로모션 노력에 대한 명확한 세부사항을 제출하여 음악의 도달 범위와 잠재력을 보여주세요. 이러한 포인트는 엘리베이터 피치에 소개된 역동적인 이야기를 더욱 풍부하게 하면서 과거의 성과와 미래 지향적인 계획을 모두 강조해야 합니다."
                        : "Submit clear details about your social media metrics, partnerships, and promotional efforts to illustrate your music's reach and potential. These points should highlight both your historical achievements and your forward-looking plans, further enriching the dynamic story introduced in your Elevator Pitch."
                      }
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">{language === 'ko' ? '더 많은 정보?' : 'More Info?'}</span>
              </div>
            </div>
            
            <div className="space-y-4">
              {marketing.marketingDrivers.length === 0 && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    {language === 'ko' 
                      ? '아직 마케팅 드라이버가 없습니다. 아래 버튼을 클릭하여 추가하세요.'
                      : 'No marketing drivers yet. Click the button below to add one.'}
                  </p>
                </div>
              )}
              
              {marketing.marketingDrivers.map((driver: any, index: number) => (
                <div key={index} className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {language === 'ko' ? '마케팅 드라이버' : 'Marketing Driver'}
                        </label>
                        <textarea
                          value={driver.content}
                          onChange={(e) => {
                            const newDrivers = [...marketing.marketingDrivers]
                            newDrivers[index] = { ...driver, content: e.target.value }
                            setMarketing(prev => ({ ...prev, marketingDrivers: newDrivers }))
                          }}
                          rows={3}
                          className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-n3rve-500 focus:border-n3rve-main bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-all"
                          placeholder={language === 'ko' ? '마케팅 드라이버를 입력하세요' : 'Enter marketing driver'}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {language === 'ko' ? '관련 지역' : 'Relevant Territories'}
                        </label>
                        <input
                          type="text"
                          value={driver.territories?.join(', ') || ''}
                          onChange={(e) => {
                            const newDrivers = [...marketing.marketingDrivers]
                            newDrivers[index] = { ...driver, territories: e.target.value.split(',').map(t => t.trim()).filter(t => t) }
                            setMarketing(prev => ({ ...prev, marketingDrivers: newDrivers }))
                          }}
                          className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-n3rve-500 focus:border-n3rve-main bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-all"
                          placeholder={language === 'ko' ? '예: 한국, 일본, 미국 (쉼표로 구분)' : 'e.g., Korea, Japan, USA (comma separated)'}
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const newDrivers = marketing.marketingDrivers.filter((_: any, i: number) => i !== index)
                        setMarketing(prev => ({ ...prev, marketingDrivers: newDrivers }))
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
              
              <button
                type="button"
                onClick={() => {
                  setMarketing(prev => ({
                    ...prev,
                    marketingDrivers: [...prev.marketingDrivers, { content: '', territories: [] }]
                  }))
                }}
                className="w-full px-6 py-3 bg-n3rve-main hover:bg-n3rve-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                {language === 'ko' ? '마케팅 드라이버 추가' : 'Submit'}
              </button>
            </div>
          </div>

          {/* Social Media Rollout Plan */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <div className="p-2 bg-gradient-to-br from-n3rve-main to-n3rve-accent rounded-lg">
                  <Share2 className="w-5 h-5 text-white" />
                </div>
                {language === 'ko' ? '소셜 미디어 롤아웃 계획' : 'Social Media Rollout Plan'}
              </h4>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-2">
                  <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <h5 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                      {language === 'ko' ? '소셜 미디어 롤아웃 계획 팁' : 'Social Media Rollout Plan Tips'}
                    </h5>
                    <div className="space-y-2 text-xs text-blue-800 dark:text-blue-200">
                      <p className="font-medium">
                        {language === 'ko' 
                          ? '소셜 미디어 롤아웃 계획에서 무엇을 찾고 있나요?' 
                          : 'What are we looking for in a Social Media Rollout Plan?'
                        }
                      </p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>
                          <span className="font-medium">{language === 'ko' ? '게시 일정:' : 'Posting schedule:'}</span>
                          <span className="ml-1">{language === 'ko' ? '언제, 얼마나 자주 콘텐츠를 게시할 예정인가요?' : 'When and how frequently will you post content?'}</span>
                        </li>
                        <li>
                          <span className="font-medium">{language === 'ko' ? '콘텐츠 유형:' : 'Content types:'}</span>
                          <span className="ml-1">{language === 'ko' ? '티저 비디오, 이미지, 비하인드 콘텐츠, 프로모션 그래픽을 공유할 예정인가요?' : 'Will you share teaser videos, images, behind-the-scenes content, or promotional graphics?'}</span>
                        </li>
                        <li>
                          <span className="font-medium">{language === 'ko' ? '해시태그 및 키워드:' : 'Hashtags and keywords:'}</span>
                          <span className="ml-1">{language === 'ko' ? '발견 가능성을 향상시키기 위해 관련 해시태그와 키워드를 선택하세요.' : 'Choose relevant hashtags and keywords to improve discoverability.'}</span>
                        </li>
                        <li>
                          <span className="font-medium">{language === 'ko' ? '타겟 오디언스:' : 'Target audience:'}</span>
                          <span className="ml-1">{language === 'ko' ? '오디언스의 인구 통계 및 선호도를 정의하세요.' : 'Define your audience demographics and preferences.'}</span>
                        </li>
                        <li>
                          <span className="font-medium">{language === 'ko' ? 'KPI:' : 'KPIs:'}</span>
                          <span className="ml-1">{language === 'ko' ? '좋아요, 공유, 댓글, 클릭률 또는 전환과 같이 추적할 주요 성과 지표를 지정하세요.' : 'Specify the key performance indicators you\'ll track, such as likes, shares, comments, click-through rates, or conversions.'}</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {language === 'ko' ? '소셜 미디어 롤아웃 계획' : 'Your Social Media Rollout Plan'} <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-500 mb-3">
                {language === 'ko' 
                  ? '링크(예: Google 문서 또는 Google 스프레드시트)를 통해 콘텐츠 캘린더를 공유해 주세요. 문서 시스템이 없는 경우 아래 텍스트 상자에 요청된 정보를 제공하세요.'
                  : 'Please share your content calendar with us through a link (e.g., Google Doc or Google Spreadsheet). If you don\'t have a document system, provide the requested information in the text box below.'
                }
              </p>
              <textarea
                value={marketing.socialMediaPlan}
                onChange={(e) => setMarketing(prev => ({ ...prev, socialMediaPlan: e.target.value }))}
                rows={8}
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-n3rve-500 focus:border-n3rve-main bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-all resize-none"
                placeholder={language === 'ko' 
                  ? '소셜 미디어 롤아웃 계획을 입력하거나 문서 링크를 공유하세요...'
                  : 'Enter your social media rollout plan or share a document link...'
                }
              />
            </div>
          </div>

          {/* Album Description & Marketing Strategy */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('앨범 설명', 'Album Description')}</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('앨범 소개', 'Album Introduction')}
                </label>
                <textarea
                  value={marketing.albumIntroduction}
                  onChange={(e) => setMarketing(prev => ({ ...prev, albumIntroduction: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-n3rve-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder={t('앨범에 대한 간단한 소개를 작성하세요', 'Write a brief introduction about the album')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('상세 설명', 'Detailed Description')}
                </label>
                <textarea
                  value={marketing.albumDescription}
                  onChange={(e) => setMarketing(prev => ({ ...prev, albumDescription: e.target.value }))}
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-n3rve-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder={t('앨범에 대한 상세한 설명을 작성하세요', 'Write a detailed description about the album')}
                />
              </div>
            </div>
          </div>


          {/* Album Notes */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-n3rve-main" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('앨범 노트', 'Album Notes')}</h3>
            </div>
            
            <textarea
              value={productMetadata.albumNotes}
              onChange={(e) => setProductMetadata(prev => ({ ...prev, albumNotes: e.target.value }))}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-n3rve-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder={t('앨범에 대한 추가 노트나 설명을 입력하세요', 'Enter additional notes or description about the album')}
            />
            <p className="mt-1 text-xs text-gray-500">
              {language === 'ko' ? '국내 음원사이트에서만 표시됩니다' : 'Only displayed on Korean music sites'}
            </p>
          </div>

          {/* Additional Notes */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-n3rve-main" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('추가 노트', 'Additional Notes')}</h3>
            </div>
            
            <textarea
              value={productMetadata.additionalNotes}
              onChange={(e) => setProductMetadata(prev => ({ ...prev, additionalNotes: e.target.value }))}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-n3rve-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder={language === 'ko' ? '특별한 요청사항이나 주의사항을 입력해주세요' : 'Enter any special requests or important notes'}
            />
          </div>
        </div>
      )}

      {/* QC Warnings */}
      {qcValidationResults.length > 0 && (
        <QCWarnings results={qcValidationResults} />
      )}
      </div>
    </div>

      {/* Modals */}
      {/* Artist Modal will be at the end */}

      {/* New DSP Territory Modal */}
      {showDspTerritoryModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-6xl w-full mx-4 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    {language === 'ko' ? 'DSP별 지역 설정' : 'DSP Territory Settings'}
                  </h2>
                </div>
                <button
                  onClick={() => {
                    setShowDspTerritoryModal(false)
                    setSelectedDsps([])
                    setDspSearchQuery('')
                    setTempDspTerritories({})
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-hidden flex">
              {/* Left Panel - DSP Selection */}
              <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 p-6 overflow-y-auto">
                <div className="mb-4">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                    {language === 'ko' ? 'DSP 선택' : 'Select DSPs'}
                  </h3>
                  
                  {/* Search */}
                  <div className="relative mb-4">
                    <input
                      type="text"
                      value={dspSearchQuery}
                      onChange={(e) => setDspSearchQuery(e.target.value)}
                      placeholder={t('검색', 'Search')}
                      className="w-full px-4 py-2 pl-10 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  </div>

                  {/* Quick Actions */}
                  <div className="flex gap-2 mb-4">
                    <button
                      type="button"
                      onClick={() => {
                        const filteredDsps = dspList.filter(dsp => 
                          dsp.toLowerCase().includes(dspSearchQuery.toLowerCase())
                        )
                        setSelectedDsps(filteredDsps)
                      }}
                      className="text-xs px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/70"
                    >
                      {t('전체 선택', 'Select All')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedDsps([])}
                      className="text-xs px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                      {t('전체 선택 해제', 'Deselect All')}
                    </button>
                  </div>

                  {/* DSP List */}
                  <div className="space-y-1 max-h-96 overflow-y-auto">
                    {dspList
                      .filter(dsp => dsp.toLowerCase().includes(dspSearchQuery.toLowerCase()))
                      .map(dsp => (
                        <label
                          key={dsp}
                          className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedDsps.includes(dsp)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedDsps([...selectedDsps, dsp])
                              } else {
                                setSelectedDsps(selectedDsps.filter(d => d !== dsp))
                              }
                            }}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{dsp}</span>
                        </label>
                      ))
                    }
                  </div>
                </div>

                {/* Selected Count */}
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    {selectedDsps.length} {language === 'ko' ? '개 DSP 선택됨' : 'DSPs selected'}
                  </p>
                </div>
              </div>

              {/* Right Panel - Territory Selection */}
              <div className="flex-1 p-6 overflow-y-auto">
                {selectedDsps.length > 0 ? (
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">
                      {language === 'ko' ? '지역 설정' : 'Configure Territories'}
                    </h3>

                    {/* Territory Type Selection */}
                    <div className="mb-6">
                      <div className="flex gap-4">
                        <button
                          type="button"
                          onClick={() => setTempDspTerritories({})}
                          className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                            Object.keys(tempDspTerritories).length === 0
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                          }`}
                        >
                          <FileText className="w-5 h-5 mb-2 mx-auto text-blue-600 dark:text-blue-400" />
                          <p className="font-medium">{language === 'ko' ? '기본 지역 사용' : 'Use Default Territories'}</p>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const newTerritories: Record<string, string[]> = {}
                            selectedDsps.forEach(dsp => {
                              newTerritories[dsp] = productMetadata.territories || []
                            })
                            setTempDspTerritories(newTerritories)
                          }}
                          className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                            Object.keys(tempDspTerritories).length > 0
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                          }`}
                        >
                          <Target className="w-5 h-5 mb-2 mx-auto text-blue-600 dark:text-blue-400" />
                          <p className="font-medium">{language === 'ko' ? '커스텀 지역 설정' : 'Customize Territories'}</p>
                        </button>
                      </div>
                    </div>

                    {/* Custom Territory Selection */}
                    {Object.keys(tempDspTerritories).length > 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between mb-4">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {language === 'ko' ? '모든 선택된 DSP에 적용' : 'Apply to all selected DSPs'}
                          </p>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const allTerritories = Object.keys(territoryData).flatMap(continent => 
                                  territoryData[continent as keyof typeof territoryData].countries
                                )
                                const newTerritories: Record<string, string[]> = {}
                                selectedDsps.forEach(dsp => {
                                  newTerritories[dsp] = allTerritories
                                })
                                setTempDspTerritories(newTerritories)
                              }}
                              className="text-xs px-3 py-1 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 rounded hover:bg-green-200"
                            >
                              {t('전 세계 선택', 'Select World')}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const newTerritories: Record<string, string[]> = {}
                                selectedDsps.forEach(dsp => {
                                  newTerritories[dsp] = []
                                })
                                setTempDspTerritories(newTerritories)
                              }}
                              className="text-xs px-3 py-1 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded hover:bg-red-200"
                            >
                              {t('전체 선택 해제', 'Deselect All')}
                            </button>
                          </div>
                        </div>

                        {/* Continent Selection */}
                        <div className="grid grid-cols-2 gap-4">
                          {Object.entries(territoryData).map(([continentKey, continent]) => {
                            const selectedCount = tempDspTerritories[selectedDsps[0]]?.filter(t => 
                              continent.countries.includes(t)
                            ).length || 0
                            const totalCount = continent.countries.length
                            const percentage = (selectedCount / totalCount) * 100

                            return (
                              <div key={continentKey} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="font-medium text-gray-900 dark:text-gray-100">
                                    {continent.name}
                                  </h4>
                                  <span className="text-xs text-gray-500">
                                    {selectedCount}/{totalCount}
                                  </span>
                                </div>
                                
                                <div className="mb-3">
                                  <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-blue-500 transition-all duration-300"
                                      style={{ width: `${percentage}%` }}
                                    />
                                  </div>
                                </div>

                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newTerritories = { ...tempDspTerritories }
                                      selectedDsps.forEach(dsp => {
                                        const current = newTerritories[dsp] || []
                                        const toAdd = continent.countries.filter(c => !current.includes(c))
                                        newTerritories[dsp] = [...current, ...toAdd]
                                      })
                                      setTempDspTerritories(newTerritories)
                                    }}
                                    className="flex-1 text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200"
                                  >
                                    {t('전체 선택', 'Select All')}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newTerritories = { ...tempDspTerritories }
                                      selectedDsps.forEach(dsp => {
                                        newTerritories[dsp] = (newTerritories[dsp] || []).filter(t => 
                                          !continent.countries.includes(t)
                                        )
                                      })
                                      setTempDspTerritories(newTerritories)
                                    }}
                                    className="flex-1 text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200"
                                  >
                                    {t('전체 선택 해제', 'Deselect All')}
                                  </button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <Target className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">
                        {language === 'ko' ? 'DSP를 먼저 선택해주세요' : 'Please select DSPs first'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {selectedDsps.length > 0 && (language === 'ko' 
                  ? `${selectedDsps.length}개 DSP에 적용됩니다` 
                  : `Applying to ${selectedDsps.length} DSPs`
                )}
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowDspTerritoryModal(false)
                    setSelectedDsps([])
                    setDspSearchQuery('')
                    setTempDspTerritories({})
                  }}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  {t('취소', 'Cancel')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const newDspTerritories = { ...productMetadata.dspTerritories }
                    
                    selectedDsps.forEach(dsp => {
                      if (Object.keys(tempDspTerritories).length === 0) {
                        // Use default territories
                        delete newDspTerritories[dsp]
                      } else {
                        // Use custom territories
                        newDspTerritories[dsp] = {
                          territoryType: 'custom' as const,
                          territories: tempDspTerritories[dsp] || []
                        }
                      }
                    })
                    
                    setProductMetadata({
                      ...productMetadata,
                      dspTerritories: newDspTerritories
                    })
                    
                    setShowDspTerritoryModal(false)
                    setSelectedDsps([])
                    setDspSearchQuery('')
                    setTempDspTerritories({})
                  }}
                  disabled={selectedDsps.length === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {language === 'ko' ? '적용' : 'Apply'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DSP Territory Modal */}
      {showDSPModal && editingDSP && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {editingDSP} - {t('지역 설정', 'Territory Settings')}
              </h3>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-4">
                {/* Territory Type Selection */}
                <div className="flex gap-4 mb-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="default"
                      checked={(productMetadata.dspTerritories?.[editingDSP]?.territoryType || 'default') === 'default'}
                      onChange={() => {
                        setProductMetadata({
                          ...productMetadata,
                          dspTerritories: {
                            ...productMetadata.dspTerritories,
                            [editingDSP]: { territoryType: 'default' }
                          }
                        })
                      }}
                      className="w-4 h-4 text-n3rve-main focus:ring-n3rve-500"
                    />
                    <span className="text-gray-700 dark:text-gray-300">{t('기본 설정 사용', 'Use Default Settings')}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="custom"
                      checked={productMetadata.dspTerritories?.[editingDSP]?.territoryType === 'custom'}
                      onChange={() => {
                        setProductMetadata({
                          ...productMetadata,
                          dspTerritories: {
                            ...productMetadata.dspTerritories,
                            [editingDSP]: { 
                              territoryType: 'custom',
                              territories: productMetadata.dspTerritories?.[editingDSP]?.territories || []
                            }
                          }
                        })
                      }}
                      className="w-4 h-4 text-n3rve-main focus:ring-n3rve-500"
                    />
                    <span className="text-gray-700 dark:text-gray-300">{t('사용자 지정 설정', 'Use Custom Settings')}</span>
                  </label>
                </div>

                {/* Custom Territory Selection */}
                {productMetadata.dspTerritories?.[editingDSP]?.territoryType === 'custom' && (
                  <div className="space-y-6">
                    {/* Quick Actions */}
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const allCountries = Object.values(territoryData).flatMap(c => c.countries)
                          setProductMetadata({
                            ...productMetadata,
                            dspTerritories: {
                              ...productMetadata.dspTerritories,
                              [editingDSP]: {
                                territoryType: 'custom',
                                territories: allCountries
                              }
                            }
                          })
                        }}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
                      >
                        {language === 'ko' ? '전 세계 선택' : 'Select All Countries'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setProductMetadata({
                            ...productMetadata,
                            dspTerritories: {
                              ...productMetadata.dspTerritories,
                              [editingDSP]: {
                                territoryType: 'custom',
                                territories: []
                              }
                            }
                          })
                        }}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
                      >
                        {language === 'ko' ? '모두 해제' : 'Deselect All'}
                      </button>
                    </div>

                    {/* Continent Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.entries(territoryData).map(([continentKey, continent]) => {
                        const dspTerritories = productMetadata.dspTerritories?.[editingDSP]?.territories || []
                        const selectedCount = continent.countries.filter(c => dspTerritories.includes(c)).length
                        const totalCount = continent.countries.length
                        const isAllSelected = selectedCount === totalCount
                        // const isPartiallySelected = selectedCount > 0 && selectedCount < totalCount
                        
                        return (
                          <div key={continentKey} className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border-2 border-gray-200 dark:border-gray-700 hover:border-n3rve-300 dark:hover:border-n3rve-700 transition-colors">
                            <div className="mb-3">
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="text-lg font-semibold text-gray-900 dark:text-white">
                                  {t(`track.territory.${continentKey}`, continentKey.charAt(0).toUpperCase() + continentKey.slice(1))}
                                </h5>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const currentTerritories = dspTerritories
                                    let newTerritories
                                    if (isAllSelected) {
                                      newTerritories = currentTerritories.filter((c: string) => !continent.countries.includes(c))
                                    } else {
                                      newTerritories = [...new Set([...currentTerritories, ...continent.countries])]
                                    }
                                    
                                    setProductMetadata({
                                      ...productMetadata,
                                      dspTerritories: {
                                        ...productMetadata.dspTerritories,
                                        [editingDSP!]: {
                                          territoryType: 'custom',
                                          territories: newTerritories
                                        }
                                      }
                                    })
                                  }}
                                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                                    isAllSelected 
                                      ? 'bg-n3rve-100 text-n3rve-700 hover:bg-n3rve-200 dark:bg-n3rve-900 dark:text-n3rve-300' 
                                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
                                  }`}
                                >
                                  {isAllSelected ? '✓ ' : ''}{language === 'ko' ? '전체' : 'All'}
                                </button>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                  <div 
                                    className={`h-2 rounded-full transition-all ${
                                      selectedCount === 0 ? 'bg-gray-300 dark:bg-gray-600' : 'bg-n3rve-main'
                                    }`}
                                    style={{ width: `${(selectedCount / totalCount) * 100}%` }}
                                  />
                                </div>
                                <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[60px] text-right">
                                  {selectedCount}/{totalCount}
                                </span>
                              </div>
                            </div>
                            
                            {/* Expandable Country List */}
                            <details className="group" id={`continent-${continentKey}`}>
                              <summary className="cursor-pointer text-sm text-n3rve-main hover:text-n3rve-700 font-medium list-none flex items-center gap-1">
                                <ChevronRight className="w-4 h-4 transition-transform group-open:rotate-90" />
                                {language === 'ko' ? '국가 목록' : 'Countries'}
                              </summary>
                              <div className="mt-3 space-y-1 max-h-48 overflow-y-auto">
                                {continent.countries.map(countryCode => (
                                  <label 
                                    key={countryCode} 
                                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors text-sm
                                      ${dspTerritories.includes(countryCode) 
                                        ? 'bg-n3rve-50 dark:bg-n3rve-900/20 hover:bg-n3rve-100 dark:hover:bg-n3rve-900/30' 
                                        : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                                      }`}
                                  >
                                    <input
                                      type="checkbox"
                                      value={countryCode}
                                      checked={dspTerritories.includes(countryCode)}
                                      onChange={(e) => {
                                        let newTerritories
                                        if (e.target.checked) {
                                          newTerritories = [...dspTerritories, countryCode]
                                        } else {
                                          newTerritories = dspTerritories.filter((c: string) => c !== countryCode)
                                        }
                                        
                                        setProductMetadata({
                                          ...productMetadata,
                                          dspTerritories: {
                                            ...productMetadata.dspTerritories,
                                            [editingDSP!]: {
                                              territoryType: 'custom',
                                              territories: newTerritories
                                            }
                                          }
                                        })
                                      }}
                                      className="rounded text-n3rve-main focus:ring-n3rve-500"
                                    />
                                    <span className={`flex-1 ${
                                      dspTerritories.includes(countryCode)
                                        ? 'text-n3rve-900 dark:text-n3rve-100 font-medium'
                                        : 'text-gray-700 dark:text-gray-300'
                                    }`}>
                                      {countryNames[countryCode]?.[language] || countryNames[countryCode]?.en || countryCode}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                      {countryCode}
                                    </span>
                                  </label>
                                ))}
                              </div>
                            </details>
                          </div>
                        )
                      })}
                    </div>

                    {/* Selected Countries Summary */}
                    <div className="bg-n3rve-50 dark:bg-n3rve-900/20 rounded-lg p-4">
                      <h5 className="font-medium text-n3rve-900 dark:text-n3rve-100 mb-2">
                        {language === 'ko' ? '선택된 국가' : 'Selected Countries'} 
                        ({productMetadata.dspTerritories?.[editingDSP!]?.territories?.length || 0})
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        {(productMetadata.dspTerritories?.[editingDSP!]?.territories || []).map((countryCode: string) => (
                          <span 
                            key={countryCode}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-n3rve-100 dark:bg-n3rve-800 text-n3rve-700 dark:text-n3rve-200 rounded-full text-xs"
                          >
                            {countryNames[countryCode]?.[language] || countryNames[countryCode]?.en || countryCode}
                            <button
                              type="button"
                              onClick={() => {
                                const newTerritories = (productMetadata.dspTerritories?.[editingDSP!]?.territories || [])
                                  .filter((c: string) => c !== countryCode)
                                setProductMetadata({
                                  ...productMetadata,
                                  dspTerritories: {
                                    ...productMetadata.dspTerritories,
                                    [editingDSP]: {
                                      territoryType: 'custom',
                                      territories: newTerritories
                                    }
                                  }
                                })
                              }}
                              className="ml-1 hover:text-n3rve-900 dark:hover:text-n3rve-100"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDSPModal(false)
                  setEditingDSP(null)
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                {t('취소', 'Cancel')}
              </button>
              <button
                onClick={() => {
                  setShowDSPModal(false)
                  setEditingDSP(null)
                }}
                className="px-4 py-2 bg-n3rve-main hover:bg-n3rve-700 text-white rounded-lg transition-colors"
              >
                {t('저장', 'Save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Artist Modal */}
      <ArtistModal
        isOpen={showArtistModal}
        onClose={() => {
          setShowArtistModal(false)
          setEditingArtist(null)
        }}
        onSave={addArtistToTrack}
        role={artistModalType}
        editingArtist={editingArtist}
      />

      {/* Contributor Modal */}
      <ContributorModal
        isOpen={showContributorModal}
        onClose={() => {
          setShowContributorModal(false)
          setEditingContributor(null)
        }}
        onSave={addContributorToTrack}
      />
    </form>
  )
}