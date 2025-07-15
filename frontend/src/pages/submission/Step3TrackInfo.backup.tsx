import React, { useState, useMemo, useEffect, useRef } from 'react'
import { Plus, X, Music, Star, User, Edit3, Users, ChevronRight, List, AlertTriangle, Info, Languages, Clock, AlertCircle, Volume2, BookOpen, Megaphone, CheckCircle, FileText, Tag, Target, Disc, Music2, Mic, UserCheck, Calendar, Search, GripVertical } from 'lucide-react'
import { t, useLanguageStore } from '@/store/language.store'
import useSafeStore from '@/hooks/useSafeStore'
import { v4 as uuidv4 } from 'uuid'
import { validateField, type QCValidationResult } from '@/utils/fugaQCValidation'
import QCWarnings from '@/components/submission/QCWarnings'
import ArtistModal from '@/components/submission/ArtistModal'

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

interface Contributor {
  id: string
  name: string
  role: ContributorRole
  instrument?: string
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
  { value: 'en', label: 'English' },
  { value: 'ko', label: '한국어' },
  { value: 'ja', label: '日本語' },
  { value: 'zh', label: '中文' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'it', label: 'Italiano' },
  { value: 'pt', label: 'Português' },
  { value: 'ru', label: 'Русский' }
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
  const [contributor, setContributor] = useState<Contributor>({
    id: uuidv4(),
    name: '',
    role: 'composer'
  })
  const [instrumentSearch, setInstrumentSearch] = useState('')
  const [showInstrumentSuggestions, setShowInstrumentSuggestions] = useState(false)
  const instrumentInputRef = useRef<HTMLInputElement>(null)

  // Check if the role requires instrument information
  const instrumentRoles: ContributorRole[] = [
    'performer', 'studio_musician', 'soloist', 'orchestra', 'ensemble', 
    'band', 'guest_vocals', 'contributing_artist'
  ]
  
  const showInstrumentField = instrumentRoles.includes(contributor.role)
  
  // Filter instruments based on search
  const filteredInstruments = useMemo(() => {
    if (!instrumentSearch) return []
    const searchLower = instrumentSearch.toLowerCase()
    return instrumentList
      .filter(instrument => instrument.toLowerCase().includes(searchLower))
      .slice(0, 10) // Show max 10 suggestions
  }, [instrumentSearch])
  
  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (instrumentInputRef.current && !instrumentInputRef.current.contains(event.target as Node)) {
        setShowInstrumentSuggestions(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  // Initialize instrument search when role changes or contributor has instrument
  useEffect(() => {
    if (contributor.instrument) {
      setInstrumentSearch(contributor.instrument)
    } else {
      setInstrumentSearch('')
    }
  }, [contributor.role, contributor.instrument])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          {language === 'ko' ? '기여자 추가' : 'Add Contributor'}
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {language === 'ko' ? '이름' : 'Name'} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={contributor.name}
              onChange={(e) => setContributor({ ...contributor, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder={language === 'ko' ? '기여자 이름을 입력하세요' : 'Enter contributor name'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {language === 'ko' ? '역할' : 'Role'} <span className="text-red-500">*</span>
            </label>
            <select
              value={contributor.role}
              onChange={(e) => setContributor({ ...contributor, role: e.target.value as ContributorRole })}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <optgroup label={language === 'ko' ? '프로덕션' : 'Production'}>
                {roleOptions.filter(r => [
                  'composer', 'lyricist', 'arranger', 'producer', 'co_producer', 
                  'executive_producer', 'assistant_producer', 'post_producer', 'vocal_producer'
                ].includes(r.value)).map(role => (
                  <option key={role.value} value={role.value}>
                    {language === 'ko' ? role.label : role.labelEn}
                  </option>
                ))}
              </optgroup>
              
              <optgroup label={language === 'ko' ? '엔지니어링' : 'Engineering'}>
                {roleOptions.filter(r => r.value.includes('engineer') || r.value === 'tonmeister').map(role => (
                  <option key={role.value} value={role.value}>
                    {language === 'ko' ? role.label : role.labelEn}
                  </option>
                ))}
              </optgroup>
              
              <optgroup label={language === 'ko' ? '연주/공연' : 'Performance'}>
                {roleOptions.filter(r => [
                  'performer', 'studio_musician', 'soloist', 'conductor', 'orchestra',
                  'choir', 'chorus', 'ensemble', 'band', 'featuring', 'guest_vocals', 'contributing_artist'
                ].includes(r.value)).map(role => (
                  <option key={role.value} value={role.value}>
                    {language === 'ko' ? role.label : role.labelEn}
                  </option>
                ))}
              </optgroup>
              
              <optgroup label={language === 'ko' ? '보컬/랩' : 'Vocal/Rap'}>
                {roleOptions.filter(r => ['rap', 'mc', 'narrator', 'spoken_word', 'vocal_effects'].includes(r.value)).map(role => (
                  <option key={role.value} value={role.value}>
                    {language === 'ko' ? role.label : role.labelEn}
                  </option>
                ))}
              </optgroup>
              
              <optgroup label={language === 'ko' ? '디렉션' : 'Direction'}>
                {roleOptions.filter(r => r.value.includes('director') || r.value.includes('conductor') || r.value.includes('master')).map(role => (
                  <option key={role.value} value={role.value}>
                    {language === 'ko' ? role.label : role.labelEn}
                  </option>
                ))}
              </optgroup>
              
              <optgroup label={language === 'ko' ? '작곡/편곡' : 'Composition/Arrangement'}>
                {roleOptions.filter(r => [
                  'assistant_composer', 'orchestrator', 'adapter', 'writer', 'author',
                  'playwright', 'librettist', 'translator', 'liner_notes'
                ].includes(r.value)).map(role => (
                  <option key={role.value} value={role.value}>
                    {language === 'ko' ? role.label : role.labelEn}
                  </option>
                ))}
              </optgroup>
              
              <optgroup label={language === 'ko' ? '기술' : 'Technical'}>
                {roleOptions.filter(r => [
                  'programmer', 'dj', 'remixer', 'sampled_artist', 'mixer', 'editor',
                  'sound_editor', 'sound_effects', 'special_effects', 'computer_graphic_creator',
                  'visual_effects_technician'
                ].includes(r.value)).map(role => (
                  <option key={role.value} value={role.value}>
                    {language === 'ko' ? role.label : role.labelEn}
                  </option>
                ))}
              </optgroup>
              
              <optgroup label={language === 'ko' ? '비디오/영상' : 'Video/Film'}>
                {roleOptions.filter(r => [
                  'video_director', 'video_producer', 'cinematographer', 'camera_operator',
                  'lighting_director', 'gaffer', 'key_grip'
                ].includes(r.value)).map(role => (
                  <option key={role.value} value={role.value}>
                    {language === 'ko' ? role.label : role.labelEn}
                  </option>
                ))}
              </optgroup>
              
              <optgroup label={language === 'ko' ? '크리에이티브' : 'Creative'}>
                {roleOptions.filter(r => [
                  'choreographer', 'dancer', 'actor', 'costume_designer', 'set_designer'
                ].includes(r.value)).map(role => (
                  <option key={role.value} value={role.value}>
                    {language === 'ko' ? role.label : role.labelEn}
                  </option>
                ))}
              </optgroup>
              
              <optgroup label={language === 'ko' ? '매니지먼트' : 'Management'}>
                {roleOptions.filter(r => [
                  'a&r_administrator', 'a&r_manager', 'artist_management', 'agent',
                  'production_assistant', 'studio_personnel', 'tape'
                ].includes(r.value)).map(role => (
                  <option key={role.value} value={role.value}>
                    {language === 'ko' ? role.label : role.labelEn}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {showInstrumentField && (
            <div className="relative" ref={instrumentInputRef}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {language === 'ko' ? '악기' : 'Instrument'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={instrumentSearch}
                  onChange={(e) => {
                    setInstrumentSearch(e.target.value)
                    setContributor({ ...contributor, instrument: e.target.value })
                    setShowInstrumentSuggestions(true)
                  }}
                  onFocus={() => setShowInstrumentSuggestions(true)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder={language === 'ko' ? '악기명을 입력하세요' : 'Enter instrument name'}
                />
                <Search className="absolute right-3 top-3.5 w-5 h-5 text-gray-400" />
              </div>
              
              {/* Instrument Suggestions Dropdown */}
              {showInstrumentSuggestions && filteredInstruments.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredInstruments.map((instrument, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        setInstrumentSearch(instrument)
                        setContributor({ ...contributor, instrument })
                        setShowInstrumentSuggestions(false)
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors flex items-center gap-2"
                    >
                      <Music2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span className="text-gray-900 dark:text-gray-100">{instrument}</span>
                    </button>
                  ))}
                </div>
              )}
              
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {language === 'ko' 
                  ? '악기명을 입력하거나 목록에서 선택하세요. 목록에 없는 악기도 직접 입력 가능합니다.'
                  : 'Type to search instruments or select from the list. You can also enter custom instruments.'
                }
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={() => {
              setInstrumentSearch('')
              setShowInstrumentSuggestions(false)
              onClose()
            }}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            {language === 'ko' ? '취소' : 'Cancel'}
          </button>
          <button
            onClick={() => {
              if (contributor.name) {
                onSave(contributor)
                setInstrumentSearch('')
                setShowInstrumentSuggestions(false)
                onClose()
              }
            }}
            disabled={!contributor.name}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
  // String Instruments
  'String Bass Guitar', 'String Guitar', 'String Acoustic Guitar', 'String Electric Guitar',
  'String Fiddle', 'String Banjo', 'Acoustic Baritone Guitar', 'Acoustic Bass Guitar',
  'Acoustic Fretless Guitar', 'Acoustic Guitar', 'Banjo', 'Baritone Guitar', 'Baroque Guitar',
  'Baroque Violin', 'Bass', 'Bass Guitar', 'Cello', 'Chapman Stick', 'Charango',
  'Classical Guitar', 'Cittern', 'Contrabass', 'Cuatro', 'Diddley Bow', 'Dobro Guitar',
  'Double Bass', 'Electric Bass Guitar', 'Electric Cello', 'Electric Fretless Guitar',
  'Electric Guitar', 'Electric Sitar', 'Electric Upright Bass', 'Electric Viola',
  'Electric Violin', 'Fiddle', 'Flamenco Guitar', 'Gut-String-Guitar', 'Harp',
  'Lap Steel Guitar', 'Lute', 'Mandocello', 'Mandola', 'Mandolin', 'Nylon-String-Guitar',
  'Oud', 'Parlour Guitar', 'Pedal Steel Guitar', 'Pikasa Guitar', 'Portuguese Guitar',
  'Requinto Guitar', 'Rhythm Guitar', 'Sitar', 'Slide Guitar', 'Spanish Guitar',
  'Tenor Guitar', 'Tres', 'Ukulele', 'Viol', 'Viola', 'Viola D\'Amore', 'Viola Da Gamba',
  'Violin', 'Violoncello', 'Violone', 'Zither',
  
  // Wind Instruments
  'Accordion', 'Alto Clarinet', 'Alto Flute', 'Alto Horn', 'Alto Recorder', 'Alto Saxophone',
  'Alto Trombone', 'Bagpipes', 'Bansuri', 'Baritone Horn', 'Bass Clarinet', 'Bass Flute',
  'Bass Harmonica', 'Bass Oboe', 'Bass Recorder', 'Bass Saxophone', 'Bass Trombone',
  'Bass Trumpet', 'Basset Clarinet', 'Basset Horn', 'Bassoon', 'Bugle', 'Button Accordion',
  'C-Melody Sax', 'Chromatic Harmonica', 'Clarinet', 'Concertina', 'Contrabass Clarinet',
  'Contrabass Flute', 'Contrabass Recorder', 'Contrabass Sarrusophone', 'Contrabass Saxophone',
  'Contrabass Trombone', 'Contrabassoon', 'Contralto Clarinet', 'Cornet', 'Cornett',
  'Crumhorn', 'Cusaphone', 'Curtal', 'Didgeridoo', 'Duduk', 'Dulcian', 'English Horn',
  'Euphonium', 'Fife', 'Flugelhorn', 'Flute', 'French Horn', 'Harmonica', 'Horn Section',
  'Horns', 'Kazoo', 'Low Whistle', 'Lyricon', 'Manzello', 'Mellophone', 'Mouth Organ',
  'Musette', 'Ney', 'Oboe', 'Oboe D\'Amore', 'Ocarina', 'Pan Flute', 'Panpipes',
  'Penny Whistle', 'Piccolo', 'Piccolo Bass', 'Piccolo Oboe', 'Piccolo Trumpet',
  'Pipe Organ', 'Recorder', 'Sackbut', 'Sarrusophone', 'Saxello', 'Saxophone',
  'Serpent', 'Shakuhachi', 'Shawm', 'Shehnai', 'Sheng', 'Slide Saxophone', 'Slide Trumpet',
  'Slide Whistle', 'Sopranino Clarinet', 'Sopranino Saxophone', 'Soprano Clarinet',
  'Soprano Flute', 'Soprano Recorder', 'Soprano Saxophone', 'Sousaphone', 'Stritch',
  'Tabor Pipe', 'Tarogato', 'Tenor Horn', 'Tenor Recorder', 'Tenor Saxophone',
  'Tenor Trombone', 'Tin Whistle', 'Traverso', 'Trombone', 'Trombonium', 'Trumpet',
  'Tuba', 'Uilleann Pipes', 'Valve Trombone', 'Vuvuzela', 'Whistle', 'Wood Flute',
  
  // Keyboard Instruments
  'Celeste', 'Chamberlin', 'Chamber Organ', 'Chest Organ', 'Clavichord', 'Clavinet',
  'Electric Piano', 'Electronic Valve Instrument', 'Farfisa', 'Fender Rhodes',
  'Fortepiano', 'Hammond Organ', 'Harmonium', 'Harpsichord', 'Keyboard Bass', 'Keyboards',
  'Keytar', 'Mellotron', 'Omnichord', 'Ondes Martenot', 'Organ', 'Piano', 'Prepared Piano',
  'Reed Organ', 'Rhodes Piano', 'Spinet', 'Synclavier', 'Synthesizer', 'Tack Piano',
  'Toy Piano', 'Upright Piano', 'Wurlitzer',
  
  // Percussion Instruments
  'Balafon', 'Barrel Organ', 'Bass Drum', 'Bata Drums', 'Bells', 'Bendir', 'Berimbau',
  'Bonang', 'Bongos', 'Cajon', 'Calliope', 'Castanets', 'Caxixi', 'Chekere', 'Chimes',
  'Cimbalom', 'Claves', 'Conch Shells', 'Congas', 'Cowbell', 'Crotales', 'Cymbals',
  'Daf', 'Dhol', 'Djembe', 'Doumbek', 'Drum Machine', 'Drums', 'Finger Cymbals',
  'Finger Snaps', 'Frame Drum', 'Gamelan', 'Gender', 'Ghatam', 'Glockenspiel', 'Gong',
  'Güiro', 'Handclaps', 'Hang', 'Kalimba', 'Karkaba', 'Kendang', 'Kenong/Kethuk',
  'Maracas', 'Marimba', 'Mridangam', 'Noises', 'Peking', 'Percussion', 'Riq', 'Saron',
  'Shakers', 'Shekere', 'Sleigh Bells', 'Slenthem', 'Snare Drum', 'Spoons', 'Steel Drums',
  'Surdo', 'Tabla', 'Talking Drum', 'Tamborim', 'Tambourine', 'Temple Blocks', 'Tenor Drum',
  'Thavil', 'Timbales', 'Timpani', 'Triangle', 'Tubular Bells', 'Turntable', 'Udu',
  'Vibraphone', 'Vibraslap', 'Washboard', 'Wood Block', 'Xylophone', 'Xylorimba', 'Zarb',
  
  // Traditional/World Instruments
  'Appalachian Dulcimer', 'Archlute', 'Autoharp', 'Baglama', 'Balalaika', 'Bandoneon',
  'Bandurria', 'Barbat', 'Biwa', 'Bouzouki', 'Cavaquinho', 'Concert Harp', 'Dulcimer',
  'Gitern', 'Hag\'houge', 'Hammered Dulcimer', 'Hardingfele', 'Hurdy Gurdy', 'Kora',
  'Koto', 'Lyre', 'Psaltery', 'Rebab', 'Rebec', 'Santoor', 'Santur', 'Sarangi', 'Sarod',
  'Saz', 'Shamisen', 'Tamboura', 'Tanpura', 'Theorbo', 'Vielle',
  
  // Electronic/Modern Instruments
  'E-Bow', 'Electronic Wind Instrument', 'Modular Synth', 'Sampler', 'Talkbox',
  'Theremin', 'Vocoder',
  
  // Vocal Types
  'Alto Vocals', 'Alto Violin', 'Background Vocals', 'Baritone Vocals', 'Bass Vocals',
  'Beat Boxing', 'Chant Vocals', 'Contralto Vocals', 'Counter Tenor', 'Guest Vocals',
  'Harmony Vocals', 'Lead Vocals', 'Mezzo-soprano Vocals', 'Soprano Vocals', 'Tenor Vocals',
  'Vocals',
  
  // String Section
  'Strings', 'String Section', 'String Quartet', 'String Orchestra',
  
  // Others
  'EWI', 'Found Sounds', 'Human Beatbox', 'Loop Station', 'MIDI Controller',
  'Sound Effects', 'Tape Machine'
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

export default function Step3TrackInfo({ data, onNext }: Props) {
  const language = useSafeStore(useLanguageStore, (state) => state.language)
  
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
    recordingYear: data?.tracks?.productMetadata?.recordingYear || data?.productMetadata?.recordingYear || new Date().getFullYear().toString(),
    countryOfRecording: data?.tracks?.productMetadata?.countryOfRecording || data?.productMetadata?.countryOfRecording || '',
    countryOfCommissioning: data?.tracks?.productMetadata?.countryOfCommissioning || data?.productMetadata?.countryOfCommissioning || '',
    exclusiveRights: data?.tracks?.productMetadata?.exclusiveRights ?? data?.productMetadata?.exclusiveRights ?? false,
    copyrightYear: data?.tracks?.productMetadata?.copyrightYear || data?.productMetadata?.copyrightYear || new Date().getFullYear().toString(),
    copyrightText: data?.tracks?.productMetadata?.copyrightText || data?.productMetadata?.copyrightText || '',
    phonogramCopyrightYear: data?.tracks?.productMetadata?.phonogramCopyrightYear || data?.productMetadata?.phonogramCopyrightYear || new Date().getFullYear().toString(),
    phonogramCopyrightText: data?.tracks?.productMetadata?.phonogramCopyrightText || data?.productMetadata?.phonogramCopyrightText || '',
    albumNotes: data?.tracks?.productMetadata?.albumNotes || data?.productMetadata?.albumNotes || '',
    metadataLanguage: data?.tracks?.productMetadata?.metadataLanguage || data?.productMetadata?.metadataLanguage || 'ko',
    territories: data?.tracks?.productMetadata?.territories || data?.productMetadata?.territories || [],
    territoryType: data?.tracks?.productMetadata?.territoryType || data?.productMetadata?.territoryType || 'world',
    dspTerritories: data?.tracks?.productMetadata?.dspTerritories || data?.productMetadata?.dspTerritories || {},
    displayArtists: data?.tracks?.productMetadata?.displayArtists || data?.productMetadata?.displayArtists || '',
    explicitContent: data?.tracks?.productMetadata?.explicitContent ?? data?.productMetadata?.explicitContent ?? false
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
    promotionPlans: data?.tracks?.marketing?.promotionPlans || data?.marketing?.promotionPlans || ''
  })

  // Drag and drop state
  const [draggedTrackId, setDraggedTrackId] = useState<string | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

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
      // If removing title track, set first track as title
      if (tracks.find(t => t.id === trackId)?.isTitle) {
        updatedTracks[0].isTitle = true
      }
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
    }} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('onboarding.step3')}</h2>
        <p className="text-gray-600 dark:text-gray-400">{t('onboarding.step3.description')}</p>
      </div>

      {/* Track List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <List className="w-5 h-5" />
              트랙 목록
            </h3>
            <div className="space-y-1 mt-1">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {language === 'ko' 
                  ? '⭐ 아이콘을 클릭하여 타이틀곡을 설정하세요' 
                  : '⭐ Click the star icon to set the title track'
                }
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {language === 'ko' 
                  ? '≡ 아이콘을 드래그하여 순서를 변경하세요' 
                  : '≡ Drag icon to reorder tracks'
                }
              </p>
            </div>
          </div>
          <button
            onClick={addTrack}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t('track.addTrack')}
          </button>
        </div>

        <div className="space-y-2">
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
              onClick={() => setSelectedTrackId(track.id)}
              className={`flex items-center gap-4 p-4 rounded-lg cursor-pointer transition-all ${
                selectedTrackId === track.id
                  ? 'bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-500'
                  : 'bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
              } ${
                draggedTrackId === track.id
                  ? 'opacity-50'
                  : ''
              } ${
                dragOverIndex === index
                  ? 'border-t-4 border-t-purple-500'
                  : ''
              }`}
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="cursor-move text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <GripVertical className="w-5 h-5" />
                </div>
                <span className="text-gray-500 dark:text-gray-400 font-medium">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    // Update all tracks to set only this one as title
                    const updatedTracks = tracks.map(t => ({
                      ...t,
                      isTitle: t.id === track.id
                    }))
                    setTracks(updatedTracks)
                  }}
                  className={`p-1 rounded-lg transition-all ${
                    track.isTitle 
                      ? 'text-yellow-500 hover:text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20' 
                      : 'text-gray-400 hover:text-yellow-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  title={language === 'ko' ? '타이틀곡으로 설정' : 'Set as title track'}
                >
                  <Star className={`w-4 h-4 ${track.isTitle ? 'fill-current' : ''}`} />
                </button>
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {track.titleKo || track.titleEn || '(제목 없음)'}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
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
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('metadata')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'metadata'
                ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              {t('track.metadata')}
            </div>
          </button>
          <button
            onClick={() => setActiveTab('marketing')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'marketing'
                ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Megaphone className="w-4 h-4" />
              {t('track.marketing')}
            </div>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'metadata' && (
        <>
          {/* Sub-tab Navigation */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-1">
            <div className="flex gap-2">
              <button
                onClick={() => setMetadataSubTab('product')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all ${
                  metadataSubTab === 'product'
                    ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  {t('track.productLevel')}
                </div>
              </button>
              <button
                onClick={() => setMetadataSubTab('asset')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all ${
                  metadataSubTab === 'asset'
                    ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Music2 className="w-4 h-4" />
                  {t('track.assetLevel')}
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
                    <p className="font-medium mb-1">{t('track.productLevel.description')}</p>
                  </div>
                </div>
              </div>

              {/* Release Information */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  {t('track.releaseInfo')}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Consumer Release Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      id="consumer-release-date"
                      value={productMetadata.consumerReleaseDate}
                      onChange={(e) => {
                        const newDate = e.target.value
                        setProductMetadata({ 
                          ...productMetadata, 
                          consumerReleaseDate: newDate,
                          // Auto-sync original release date for new releases
                          originalReleaseDate: productMetadata.originalReleaseDate || newDate
                        })
                      }}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
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
                      {t('track.originalReleaseDate')}
                    </label>
                    <input
                      type="date"
                      value={productMetadata.originalReleaseDate}
                      onChange={(e) => setProductMetadata({ ...productMetadata, originalReleaseDate: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
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
                      Release Time (KST)
                    </label>
                    <div className="space-y-3">
                      {!productMetadata.releaseTime ? (
                        <div 
                          onClick={() => setProductMetadata({ ...productMetadata, releaseTime: '12:00 AM' })}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-pointer hover:border-purple-400 dark:hover:border-purple-500 transition-colors"
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
                            className="flex-1 px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
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
                            className="flex-1 px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
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
                            className="px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
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
                        <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-700 rounded-xl p-4">
                          <div className="text-center space-y-3">
                            <div className="text-sm font-semibold text-purple-800 dark:text-purple-200 mb-3">
                              {language === 'ko' ? '🚀 발매 예정 시간' : '🚀 Scheduled Release Time'}
                            </div>
                            
                            {/* KST Display */}
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">
                                {language === 'ko' ? '한국 시간 (KST)' : 'Korea Standard Time (KST)'}
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
                              <div className="text-purple-500 dark:text-purple-400">
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
                                    
                                    const kstDate = new Date(`${productMetadata.consumerReleaseDate}T${hour24.toString().padStart(2, '0')}:${minute.split(' ')[0]}:00+09:00`)
                                    const utcDate = new Date(kstDate.getTime())
                                    
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

                            <div className="text-xs text-purple-600 dark:text-purple-300 mt-2">
                              {language === 'ko' 
                                ? '💡 전 세계 음원 플랫폼에서 동시 발매됩니다'
                                : '💡 Will be released simultaneously on all global platforms'
                              }
                            </div>
                            
                            {/* Timed Release Warning */}
                            <div className="mt-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-3">
                              <div className="flex items-start gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                                <div className="text-xs text-amber-800 dark:text-amber-200">
                                  <div className="font-semibold mb-1">
                                    {language === 'ko' 
                                      ? '⚠️ Timed Release 미지원 플랫폼 안내'
                                      : '⚠️ Timed Release Limitations'
                                    }
                                  </div>
                                  <div className="space-y-1">
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
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      placeholder={language === 'ko' ? "표시될 아티스트명" : "Display artist names"}
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {language === 'ko' 
                        ? '음원 플랫폼에서 표시될 아티스트명'
                        : 'Artist name to be displayed on streaming platforms'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Explicit Content */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-purple-600" />
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
                      className="w-4 h-4 text-purple-600 focus:ring-purple-500"
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
                      className="w-4 h-4 text-purple-600 focus:ring-purple-500"
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
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">저작권 (Copyrights)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      ⓒ copyright Year <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={productMetadata.copyrightYear}
                      onChange={(e) => setProductMetadata({ ...productMetadata, copyrightYear: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      placeholder="예: 2024"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      ⓒ copyright Text <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={productMetadata.copyrightText}
                      onChange={(e) => setProductMetadata({ ...productMetadata, copyrightText: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      placeholder="예: Label Name"
                    />
                  </div>
                  <div id="phonogram-section">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      ℗ copyright Year <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={productMetadata.phonogramCopyrightYear}
                      onChange={(e) => setProductMetadata({ ...productMetadata, phonogramCopyrightYear: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      placeholder="예: 2024"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      ℗ copyright Text <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={productMetadata.phonogramCopyrightText}
                      onChange={(e) => setProductMetadata({ ...productMetadata, phonogramCopyrightText: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      placeholder="예: Label Name"
                    />
                  </div>
                </div>
              </div>

              {/* Album Notes */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-600" />
                  {t('track.albumNotes')}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {t('track.albumNotes.description')}
                </p>
                <textarea
                  value={productMetadata.albumNotes || ''}
                  onChange={(e) => setProductMetadata({ ...productMetadata, albumNotes: e.target.value })}
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder={t('track.albumNotes.placeholder')}
                />
              </div>

              {/* Metadata Language */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Languages className="w-5 h-5 text-purple-600" />
                  {t('track.metadataLanguage')}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {t('track.metadataLanguage.description')}
                </p>
                <select
                  value={productMetadata.metadataLanguage || ''}
                  onChange={(e) => setProductMetadata({ ...productMetadata, metadataLanguage: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="">{t('common.selectLanguage')}</option>
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
                  <Target className="w-5 h-5 text-purple-600" />
                  {t('track.territory')}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {t('track.territory.description')}
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
                        className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-gray-700 dark:text-gray-300">{t('track.territory.world')}</span>
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
                        className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-gray-700 dark:text-gray-300">{t('track.territory.selected')}</span>
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
                            <div key={continentKey} className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border-2 border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 transition-colors">
                              <div className="mb-3">
                                <div className="flex items-center justify-between mb-2">
                                  <h5 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {t(`track.territory.${continentKey}`)}
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
                                        ? 'bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900 dark:text-purple-300' 
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
                                        selectedCount === 0 ? 'bg-gray-300 dark:bg-gray-600' : 'bg-purple-600'
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
                                <summary className="cursor-pointer text-sm text-purple-600 hover:text-purple-700 font-medium list-none flex items-center gap-1">
                                  <ChevronRight className="w-4 h-4 transition-transform group-open:rotate-90" />
                                  {language === 'ko' ? '국가 목록' : 'Countries'}
                                </summary>
                                <div className="mt-3 space-y-1 max-h-48 overflow-y-auto">
                                  {continent.countries.map(countryCode => (
                                    <label 
                                      key={countryCode} 
                                      className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors text-sm
                                        ${productMetadata.territories?.includes(countryCode)
                                          ? 'bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30' 
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
                                        className="rounded text-purple-600 focus:ring-purple-500"
                                      />
                                      <span className={`flex-1 ${
                                        productMetadata.territories?.includes(countryCode)
                                          ? 'text-purple-900 dark:text-purple-100 font-medium'
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
                      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                        <h5 className="font-medium text-purple-900 dark:text-purple-100 mb-2">
                          {language === 'ko' ? '선택된 국가' : 'Selected Countries'} 
                          ({productMetadata.territories?.length || 0})
                        </h5>
                        <div className="flex flex-wrap gap-2">
                          {(productMetadata.territories || []).map(countryCode => (
                            <span 
                              key={countryCode}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-200 rounded-full text-xs"
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
                                className="ml-1 hover:text-purple-900 dark:hover:text-purple-100"
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
                  <Disc className="w-5 h-5 text-purple-600" />
                  {t('track.dspTerritories')}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {t('track.dspTerritories.description')}
                </p>
                
                {/* Summary of DSP Settings */}
                <div className="mb-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
                        {Object.keys(productMetadata.dspTerritories || {}).filter(
                          dsp => productMetadata.dspTerritories?.[dsp]?.territoryType === 'custom'
                        ).length} {language === 'ko' ? '개 DSP 커스텀 설정' : 'DSPs with custom settings'}
                      </p>
                      <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                        {language === 'ko' 
                          ? '나머지는 기본 지역 설정을 사용합니다'
                          : 'Others use default territory settings'
                        }
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setShowDspTerritoryModal(true)
                      }}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2"
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
                            <span className="text-purple-600 dark:text-purple-400 font-medium">
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
                    <p className="font-medium mb-1">현재 선택된 트랙: {selectedTrack.titleKo || selectedTrack.titleEn || '(제목 없음)'}</p>
                    <p>각 트랙별로 개별 설정할 수 있습니다.</p>
                  </div>
                </div>
              </div>

              {/* Track Basic Info */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Music className="w-5 h-5 text-purple-600" />
                  트랙 기본 정보
                </h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        트랙 제목 (한글) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={selectedTrack.titleKo}
                        onChange={(e) => updateTrack(selectedTrack.id, { titleKo: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        placeholder="한글 제목을 입력하세요"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        트랙 제목 (영문)
                      </label>
                      <input
                        type="text"
                        value={selectedTrack.titleEn}
                        onChange={(e) => updateTrack(selectedTrack.id, { titleEn: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        placeholder="영문 제목을 입력하세요"
                      />
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
                      타이틀 트랙
                    </button>
                  </div>
                </div>
              </div>

              {/* Artists Section */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="space-y-6">
                  {/* Main Artists */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <User className="w-5 h-5 text-purple-600" />
                        {t('artist.mainArtists')}
                      </h4>
                      <button
                        onClick={() => {
                          setArtistModalType('main')
                          setEditingArtist(null)
                          setShowArtistModal(true)
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        {t('common.add')}
                      </button>
                    </div>
                    {selectedTrack.artists.length > 0 ? (
                      <div className="space-y-2">
                        {selectedTrack.artists.map((artist) => (
                          <div key={artist.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
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
                            <button
                              onClick={() => removeArtistFromTrack(artist.id, 'main')}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {t('artist.mainArtists.empty')}
                      </p>
                    )}
                  </div>

                  {/* Featuring Artists */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Mic className="w-5 h-5 text-pink-600" />
                        {t('artist.featuringArtists')}
                      </h4>
                      <button
                        onClick={() => {
                          setArtistModalType('featuring')
                          setEditingArtist(null)
                          setShowArtistModal(true)
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-pink-600 hover:bg-pink-700 text-white text-sm rounded-lg transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        {t('common.add')}
                      </button>
                    </div>
                    {selectedTrack.featuringArtists.length > 0 ? (
                      <div className="space-y-2">
                        {selectedTrack.featuringArtists.map((artist) => (
                          <div key={artist.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
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
                            <button
                              onClick={() => removeArtistFromTrack(artist.id, 'featuring')}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {t('artist.featuringArtists.empty')}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Contributors Section */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-purple-600" />
                    {t('track.contributorInfo')}
                  </h4>
                  <button
                    onClick={() => {
                      setEditingContributor(null)
                      setShowContributorModal(true)
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    추가
                  </button>
                </div>
                {selectedTrack.contributors.length > 0 ? (
                  <div className="space-y-2">
                    {selectedTrack.contributors.map((contributor) => {
                      // Find the role option to get the label
                      const roleOption = roleOptions.find(r => r.value === contributor.role)
                      const roleLabel = roleOption 
                        ? (language === 'ko' ? roleOption.label : roleOption.labelEn)
                        : contributor.role
                      
                      return (
                        <div key={contributor.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900 dark:text-white">{contributor.name}</span>
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                ({roleLabel})
                              </span>
                            </div>
                            {contributor.instrument && (
                              <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                                {language === 'ko' ? '악기' : 'Instrument'}: {contributor.instrument}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => removeContributorFromTrack(contributor.id)}
                            className="text-red-500 hover:text-red-700 ml-2"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('track.contributorInfo.empty')}
                  </p>
                )}
              </div>

              {/* Individual Track Release Date */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-purple-600" />
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
                      className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
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
                        <input
                          type="date"
                          value={selectedTrack.consumerReleaseDate || ''}
                          onChange={(e) => updateTrack(selectedTrack.id, { consumerReleaseDate: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
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
                              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-pointer hover:border-purple-400 dark:hover:border-purple-500 transition-colors"
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
                                className="flex-1 px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
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
                                className="flex-1 px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
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
                                className="px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
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
                      <div className="mt-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-700 rounded-xl p-4">
                        <div className="text-center space-y-3">
                          <div className="text-sm font-semibold text-purple-800 dark:text-purple-200">
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
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Volume2 className="w-5 h-5 text-purple-600" />
                  오디오 사양
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id={`dolbyAtmos-${selectedTrack.id}`}
                      checked={selectedTrack.dolbyAtmos || false}
                      onChange={(e) => updateTrack(selectedTrack.id, { dolbyAtmos: e.target.checked })}
                      className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
                    />
                    <label htmlFor={`dolbyAtmos-${selectedTrack.id}`} className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Dolby Atmos
                    </label>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id={`stereo-${selectedTrack.id}`}
                      checked={selectedTrack.stereo !== false}
                      onChange={(e) => updateTrack(selectedTrack.id, { stereo: e.target.checked })}
                      className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
                    />
                    <label htmlFor={`stereo-${selectedTrack.id}`} className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Stereo
                    </label>
                  </div>
                </div>
              </div>

              {/* Genre */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Tag className="w-5 h-5 text-purple-600" />
                  장르
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Genre
                    </label>
                    <input
                      type="text"
                      value={selectedTrack.genre || ''}
                      onChange={(e) => updateTrack(selectedTrack.id, { genre: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      placeholder="예: K-Pop"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Subgenre
                    </label>
                    <input
                      type="text"
                      value={selectedTrack.subgenre || ''}
                      onChange={(e) => updateTrack(selectedTrack.id, { subgenre: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      placeholder="예: Dance Pop"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Alternate Genre
                    </label>
                    <input
                      type="text"
                      value={selectedTrack.alternateGenre || ''}
                      onChange={(e) => updateTrack(selectedTrack.id, { alternateGenre: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      placeholder="대체 장르"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Alternate Subgenre
                    </label>
                    <input
                      type="text"
                      value={selectedTrack.alternateSubgenre || ''}
                      onChange={(e) => updateTrack(selectedTrack.id, { alternateSubgenre: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      placeholder="대체 서브장르"
                    />
                  </div>
                </div>
              </div>

              {/* Language & Content */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Languages className="w-5 h-5 text-purple-600" />
                  언어 (Language)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('track.metadataLanguage')}
                    </label>
                    <select
                      value={selectedTrack.metadataLanguage || 'en'}
                      onChange={(e) => updateTrack(selectedTrack.id, { metadataLanguage: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      {languageOptions.map(lang => (
                        <option key={lang.value} value={lang.value}>{lang.label}</option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {t('track.metadataLanguage.description')}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('track.explicitContent')}
                    </label>
                    <select
                      value={selectedTrack.explicitContent ? 'explicit' : 'not-explicit'}
                      onChange={(e) => updateTrack(selectedTrack.id, { explicitContent: e.target.value === 'explicit' })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="not-explicit">{t('track.explicitContent.notExplicit')}</option>
                      <option value="explicit">{t('track.explicitContent.explicit')}</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {t('track.explicitContent.description')}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('track.audioLanguage')} <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedTrack.audioLanguage || ''}
                      onChange={(e) => updateTrack(selectedTrack.id, { audioLanguage: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="">{t('common.selectLanguage')}</option>
                      {languageOptions.map(lang => (
                        <option key={lang.value} value={lang.value}>{lang.label}</option>
                      ))}
                      <option value="instrumental">{t('track.audioLanguage.instrumental')}</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {t('track.audioLanguage.description')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Translations */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Languages className="w-5 h-5 text-purple-600" />
                    {t('track.translations')}
                  </h4>
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
                    className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    {t('track.addTranslation')}
                  </button>
                </div>
                {selectedTrack.translations && selectedTrack.translations.length > 0 ? (
                  <div className="space-y-3">
                    {selectedTrack.translations.map((translation, index) => (
                      <div key={translation.id} className="flex gap-3 items-start">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              {t('common.language')}
                            </label>
                            <select
                              value={translation.language}
                              onChange={(e) => {
                                const updatedTranslations = [...selectedTrack.translations!]
                                updatedTranslations[index] = { ...translation, language: e.target.value }
                                updateTrack(selectedTrack.id, { translations: updatedTranslations })
                              }}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                            >
                              <option value="">언어 선택</option>
                              {languageOptions.map(lang => (
                                <option key={lang.value} value={lang.value}>{lang.label}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              {t('track.translatedTitle')}
                            </label>
                            <input
                              type="text"
                              value={translation.title}
                              onChange={(e) => {
                                const updatedTranslations = [...selectedTrack.translations!]
                                updatedTranslations[index] = { ...translation, title: e.target.value }
                                updateTrack(selectedTrack.id, { translations: updatedTranslations })
                              }}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                              placeholder="번역된 트랙 제목"
                            />
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            const updatedTranslations = selectedTrack.translations!.filter((_, i) => i !== index)
                            updateTrack(selectedTrack.id, { translations: updatedTranslations })
                          }}
                          className="mt-6 text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('common.noItemsAdded')}</p>
                  </div>
                )}
              </div>

              {/* Preview */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">미리듣기 설정</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Playtime Start (Short Clip)
                    </label>
                    <input
                      type="number"
                      value={selectedTrack.playtimeStartShortClip || ''}
                      onChange={(e) => updateTrack(selectedTrack.id, { playtimeStartShortClip: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      placeholder="시작 시간 (초)"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Preview Length
                    </label>
                    <input
                      type="number"
                      value={selectedTrack.previewLength || '30'}
                      onChange={(e) => updateTrack(selectedTrack.id, { previewLength: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      placeholder="미리듣기 길이 (초)"
                      min="15"
                      max="90"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Marketing Tab Content */}
      {activeTab === 'marketing' && (
        <div className="space-y-6">
          {/* Album Description */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('track.albumDescription')}</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('track.albumIntroduction')}
                </label>
                <textarea
                  value={marketing.albumIntroduction}
                  onChange={(e) => setMarketing(prev => ({ ...prev, albumIntroduction: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder={t('track.albumIntroduction.placeholder')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('track.detailedDescription')}
                </label>
                <textarea
                  value={marketing.albumDescription}
                  onChange={(e) => setMarketing(prev => ({ ...prev, albumDescription: e.target.value }))}
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder={t('track.detailedDescription.placeholder')}
                />
              </div>
            </div>
          </div>

          {/* Marketing Strategy */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-600" />
              {t('track.marketingStrategy')}
            </h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('track.targetAudience')}
                </label>
                <input
                  type="text"
                  value={marketing.targetAudience}
                  onChange={(e) => setMarketing(prev => ({ ...prev, targetAudience: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder={t('track.targetAudience.placeholder')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('track.marketingKeywords')}
                </label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && keywordInput.trim()) {
                          e.preventDefault()
                          setMarketing(prev => ({
                            ...prev,
                            marketingKeywords: [...prev.marketingKeywords, keywordInput.trim()]
                          }))
                          setKeywordInput('')
                        }
                      }}
                      className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      placeholder={t('track.marketingKeywords.placeholder')}
                    />
                    <button
                      onClick={() => {
                        if (keywordInput.trim()) {
                          setMarketing(prev => ({
                            ...prev,
                            marketingKeywords: [...prev.marketingKeywords, keywordInput.trim()]
                          }))
                          setKeywordInput('')
                        }
                      }}
                      className="px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                    >
                      {t('common.add')}
                    </button>
                  </div>
                  {marketing.marketingKeywords.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {marketing.marketingKeywords.map((keyword: string, index: number) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 rounded-full text-sm"
                        >
                          {keyword}
                          <button
                            onClick={() => {
                              setMarketing(prev => ({
                                ...prev,
                                marketingKeywords: prev.marketingKeywords.filter((_: string, i: number) => i !== index)
                              }))
                            }}
                            className="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-200"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('track.promotionPlans')}
                </label>
                <textarea
                  value={marketing.promotionPlans}
                  onChange={(e) => setMarketing(prev => ({ ...prev, promotionPlans: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder={t('track.promotionPlans.placeholder')}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QC Warnings */}
      {qcValidationResults.length > 0 && (
        <QCWarnings results={qcValidationResults} />
      )}


      {/* Modals */}
      <ArtistModal
        isOpen={showArtistModal}
        onClose={() => setShowArtistModal(false)}
        onSave={addArtistToTrack}
        artistType={artistModalType}
        existingArtists={[]}
      />

      <ContributorModal
        isOpen={showContributorModal}
        onClose={() => setShowContributorModal(false)}
        onSave={addContributorToTrack}
      />

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
                      placeholder={t('common.search')}
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
                      {t('track.selectAll')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedDsps([])}
                      className="text-xs px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                      {t('track.deselectAll')}
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
                              {t('track.selectWorld')}
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
                              {t('track.deselectAll')}
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
                                    {t('track.selectAll')}
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
                                    {t('track.deselectAll')}
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
                  {t('common.cancel')}
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
                {editingDSP} - {t('track.territory')}
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
                      className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-gray-700 dark:text-gray-300">{t('track.dspTerritories.useDefault')}</span>
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
                      className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-gray-700 dark:text-gray-300">{t('track.dspTerritories.useCustom')}</span>
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
                          <div key={continentKey} className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border-2 border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 transition-colors">
                            <div className="mb-3">
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="text-lg font-semibold text-gray-900 dark:text-white">
                                  {t(`track.territory.${continentKey}`)}
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
                                      ? 'bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900 dark:text-purple-300' 
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
                                      selectedCount === 0 ? 'bg-gray-300 dark:bg-gray-600' : 'bg-purple-600'
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
                              <summary className="cursor-pointer text-sm text-purple-600 hover:text-purple-700 font-medium list-none flex items-center gap-1">
                                <ChevronRight className="w-4 h-4 transition-transform group-open:rotate-90" />
                                {language === 'ko' ? '국가 목록' : 'Countries'}
                              </summary>
                              <div className="mt-3 space-y-1 max-h-48 overflow-y-auto">
                                {continent.countries.map(countryCode => (
                                  <label 
                                    key={countryCode} 
                                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors text-sm
                                      ${dspTerritories.includes(countryCode) 
                                        ? 'bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30' 
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
                                      className="rounded text-purple-600 focus:ring-purple-500"
                                    />
                                    <span className={`flex-1 ${
                                      dspTerritories.includes(countryCode)
                                        ? 'text-purple-900 dark:text-purple-100 font-medium'
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
                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                      <h5 className="font-medium text-purple-900 dark:text-purple-100 mb-2">
                        {language === 'ko' ? '선택된 국가' : 'Selected Countries'} 
                        ({productMetadata.dspTerritories?.[editingDSP!]?.territories?.length || 0})
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        {(productMetadata.dspTerritories?.[editingDSP!]?.territories || []).map((countryCode: string) => (
                          <span 
                            key={countryCode}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-200 rounded-full text-xs"
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
                              className="ml-1 hover:text-purple-900 dark:hover:text-purple-100"
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
                {t('common.cancel')}
              </button>
              <button
                onClick={() => {
                  setShowDSPModal(false)
                  setEditingDSP(null)
                }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                {t('common.save')}
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
    </form>
  )
}