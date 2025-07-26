import { toast } from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

// Export the ValidationWarning interface here so it can be used by other files
export interface ValidationWarning {
  id: string;
  type: 'error' | 'warning' | 'suggestion';
  field: string;
  message: string;
  details?: string;
  suggestedValue?: string;
  currentValue?: string;
  dspExamples?: {
    platform: string;
    rejectionMessage: string;
    rejectionMessageKo?: string;
  }[];
  canIgnore: boolean;
  warningGroup?: string;
  rejectionProbability?: number;
}

export interface ValidationResult {
  isValid: boolean;
  warnings: ValidationWarning[];
  value: string; // Original value, not formatted
}

export interface ValidationRule {
  pattern?: RegExp;
  message: string;
  severity: 'error' | 'warning' | 'suggestion';
  suggestedTransform?: (value: string) => string;
  dspExamples?: {
    platform: string;
    rejectionMessage: string;
  }[];
}

// 기본 포맷팅 함수들
const formatUtils = {
  // 불필요한 공백 제거
  trimSpaces: (value: string) => value.replace(/\s+/g, ' ').trim(),
  
  // 괄호 표준화
  standardizeBrackets: (value: string) => {
    return value
      .replace(/［/g, '[')
      .replace(/］/g, ']')
      .replace(/（/g, '(')
      .replace(/）/g, ')');
  },
  
  // feat. 표준화
  standardizeFeat: (value: string) => {
    return value.replace(/\b(featuring|ft\.|ft)\b/gi, 'feat.');
  },
  
  // OST 표준화
  standardizeOST: (value: string) => {
    return value.replace(/\b(O\.S\.T|ost)\b/gi, 'OST');
  },
  
  // 버전 표기 표준화
  standardizeVersion: (value: string) => {
    return value
      .replace(/\b(version|ver\.|ver)\b/gi, 'Ver.')
      .replace(/\b(remix|rmx)\b/gi, 'Remix')
      .replace(/\b(inst|instrumental)\b/gi, 'Inst.')
      .replace(/\b(acoustic|accoustic)\b/gi, 'Acoustic');
  }
};

// DSP 거절 사례 데이터
const dspRejectionExamples = {
  feat: [
    { 
      platform: 'Apple Music', 
      rejectionMessage: 'Featured artist format must use "feat." not "ft." or "featuring"',
      rejectionMessageKo: '피처링 아티스트는 "feat." 형식을 사용해야 합니다. "ft."나 "featuring"은 사용할 수 없습니다.'
    },
    { 
      platform: 'Spotify', 
      rejectionMessage: 'Inconsistent featuring artist format detected',
      rejectionMessageKo: '일관되지 않은 피처링 아티스트 형식이 감지되었습니다.'
    }
  ],
  brackets: [
    { 
      platform: 'Apple Music', 
      rejectionMessage: 'Mixed bracket styles not allowed. Use either () or [] consistently',
      rejectionMessageKo: '혼합된 괄호 스타일은 허용되지 않습니다. ()나 [] 중 하나를 일관되게 사용하세요.'
    },
    { 
      platform: 'Spotify', 
      rejectionMessage: 'Release title contains incompatible bracket characters',
      rejectionMessageKo: '릴리스 제목에 호환되지 않는 괄호 문자가 포함되어 있습니다.'
    }
  ],
  version: [
    { 
      platform: 'Apple Music', 
      rejectionMessage: 'Version information should be in parentheses (e.g., "Song Title (Remix)")',
      rejectionMessageKo: '버전 정보는 괄호 안에 표기해야 합니다. (예: "Song Title (Remix)")'
    },
    { 
      platform: 'Spotify', 
      rejectionMessage: 'Version tags must follow standard format',
      rejectionMessageKo: '버전 태그는 표준 형식을 따라야 합니다.'
    }
  ],
  specialChars: [
    { 
      platform: 'Apple Music', 
      rejectionMessage: 'Release contains invalid characters that cannot be processed',
      rejectionMessageKo: '릴리스에 처리할 수 없는 유효하지 않은 문자가 포함되어 있습니다.'
    },
    { 
      platform: 'Spotify', 
      rejectionMessage: 'Title contains prohibited special characters',
      rejectionMessageKo: '제목에 금지된 특수 문자가 포함되어 있습니다.'
    }
  ],
  spaces: [
    { 
      platform: 'Apple Music', 
      rejectionMessage: 'Excessive spacing detected in release title',
      rejectionMessageKo: '릴리스 제목에 과도한 공백이 감지되었습니다.'
    },
    { 
      platform: 'Spotify', 
      rejectionMessage: 'Multiple consecutive spaces are not allowed',
      rejectionMessageKo: '연속된 여러 개의 공백은 허용되지 않습니다.'
    }
  ]
};

// 앨범 제목 검증
export function validateAlbumTitle(title: string): ValidationResult {
  const warnings: ValidationWarning[] = [];
  
  if (!title || title.trim().length === 0) {
    warnings.push({
      id: uuidv4(),
      type: 'error',
      field: 'albumTitle',
      message: '앨범 제목을 입력해주세요.',
      canIgnore: false
    });
    return {
      isValid: false,
      warnings,
      value: title
    };
  }

  // 특수문자 체크 (에러 - 파일 시스템 제한)
  const specialChars = /[<>:"/\\|?*]/g;
  if (specialChars.test(title)) {
    warnings.push({
      id: uuidv4(),
      type: 'error',
      field: 'albumTitle',
      message: '파일명에 사용할 수 없는 특수문자가 포함되어 있습니다',
      details: '< > : " / \\ | ? * 문자는 파일 시스템에서 사용할 수 없어 반드시 제거해야 합니다.',
      dspExamples: dspRejectionExamples.specialChars,
      canIgnore: false,
      warningGroup: 'special_chars',
      rejectionProbability: 100
    });
  }

  // 앨범 제목 길이 체크
  if (title.length > 255) {
    warnings.push({
      id: uuidv4(),
      type: 'error',
      field: 'albumTitle',
      message: '앨범 제목은 255자를 초과할 수 없습니다',
      details: `현재 ${title.length}자입니다. ${title.length - 255}자를 줄여주세요.`,
      canIgnore: false
    });
  }

  // 연속된 공백 체크 (경고)
  if (/\s{2,}/.test(title)) {
    warnings.push({
      id: uuidv4(),
      type: 'warning',
      field: 'albumTitle',
      message: '연속된 공백이 발견되었습니다',
      details: 'DSP에서 자동으로 단일 공백으로 변환될 수 있습니다.',
      currentValue: title,
      suggestedValue: formatUtils.trimSpaces(title),
      dspExamples: dspRejectionExamples.spaces,
      canIgnore: true,
      warningGroup: 'spacing',
      rejectionProbability: 60
    });
  }

  // 괄호 스타일 체크 (경고)
  if (/［|］|（|）/.test(title)) {
    warnings.push({
      id: uuidv4(),
      type: 'warning',
      field: 'albumTitle',
      message: '비표준 괄호 문자가 사용되었습니다',
      details: '일부 DSP에서 표준 괄호 () []로 변환을 요구할 수 있습니다.',
      currentValue: title,
      suggestedValue: formatUtils.standardizeBrackets(title),
      dspExamples: dspRejectionExamples.brackets,
      canIgnore: true,
      warningGroup: 'brackets',
      rejectionProbability: 70
    });
  }

  // feat. 표준화 체크 (제안)
  if (/\b(featuring|ft\.|ft)\b/i.test(title)) {
    warnings.push({
      id: uuidv4(),
      type: 'suggestion',
      field: 'albumTitle',
      message: 'feat. 형식 표준화를 권장합니다',
      details: '대부분의 DSP에서 "feat." 형식을 선호합니다.',
      currentValue: title,
      suggestedValue: formatUtils.standardizeFeat(title),
      dspExamples: dspRejectionExamples.feat,
      canIgnore: true,
      warningGroup: 'feat',
      rejectionProbability: 80
    });
  }

  // OST 표준화 체크 (제안)
  if (/\b(O\.S\.T|ost)\b/g.test(title)) {
    warnings.push({
      id: uuidv4(),
      type: 'suggestion',
      field: 'albumTitle',
      message: 'OST 표기를 대문자로 통일하는 것을 권장합니다',
      currentValue: title,
      suggestedValue: formatUtils.standardizeOST(title),
      canIgnore: true
    });
  }

  // 버전 표기 체크 (제안)
  if (/\b(version|ver\.|ver|remix|rmx|inst|instrumental|acoustic|accoustic)\b/gi.test(title)) {
    warnings.push({
      id: uuidv4(),
      type: 'suggestion',
      field: 'albumTitle',
      message: '버전 표기 표준화를 권장합니다',
      details: 'Ver., Remix, Inst., Acoustic 등의 표준 표기를 사용하면 DSP 처리가 원활합니다.',
      currentValue: title,
      suggestedValue: formatUtils.standardizeVersion(title),
      dspExamples: dspRejectionExamples.version,
      canIgnore: true,
      warningGroup: 'version',
      rejectionProbability: 50
    });
  }

  const hasErrors = warnings.some(w => w.type === 'error');
  
  return {
    isValid: !hasErrors,
    warnings,
    value: title
  };
}

// 트랙 제목 검증
export function validateTrackTitle(title: string, trackNumber?: number): ValidationResult {
  const warnings: ValidationWarning[] = [];
  
  if (!title || title.trim().length === 0) {
    warnings.push({
      id: uuidv4(),
      type: 'error',
      field: 'trackTitle',
      message: `트랙${trackNumber ? ` ${trackNumber}` : ''}의 제목을 입력해주세요.`,
      canIgnore: false
    });
    return {
      isValid: false,
      warnings,
      value: title
    };
  }

  // 트랙 번호 체크 (경고)
  const trackNumberPattern = /^\d+[\.\-\s]+/;
  if (trackNumberPattern.test(title)) {
    const cleanTitle = title.replace(trackNumberPattern, '');
    warnings.push({
      id: uuidv4(),
      type: 'warning',
      field: 'trackTitle',
      message: '트랙 번호가 제목에 포함되어 있습니다',
      details: '트랙 번호는 시스템에서 자동으로 추가됩니다. 제목에 포함하면 중복될 수 있습니다.',
      currentValue: title,
      suggestedValue: cleanTitle,
      dspExamples: [
        { 
          platform: 'Apple Music', 
          rejectionMessage: 'Track number should not be included in track title',
          rejectionMessageKo: '트랙 번호는 트랙 제목에 포함되면 안 됩니다.'
        },
        { 
          platform: 'Spotify', 
          rejectionMessage: 'Duplicate track numbering detected',
          rejectionMessageKo: '중복된 트랙 번호가 감지되었습니다.'
        }
      ],
      canIgnore: true,
      warningGroup: 'track_number',
      rejectionProbability: 90
    });
  }

  // 특수문자 체크 (에러)
  const specialChars = /[<>:"/\\|?*]/g;
  if (specialChars.test(title)) {
    warnings.push({
      id: uuidv4(),
      type: 'error',
      field: 'trackTitle',
      message: '파일명에 사용할 수 없는 특수문자가 포함되어 있습니다',
      details: '< > : " / \\ | ? * 문자는 파일 시스템에서 사용할 수 없어 반드시 제거해야 합니다.',
      dspExamples: dspRejectionExamples.specialChars,
      canIgnore: false
    });
  }

  // 트랙 제목 길이 체크
  if (title.length > 255) {
    warnings.push({
      id: uuidv4(),
      type: 'error',
      field: 'trackTitle',
      message: '트랙 제목은 255자를 초과할 수 없습니다',
      details: `현재 ${title.length}자입니다. ${title.length - 255}자를 줄여주세요.`,
      canIgnore: false
    });
  }

  // 연속된 공백 체크 (경고)
  if (/\s{2,}/.test(title)) {
    warnings.push({
      id: uuidv4(),
      type: 'warning',
      field: 'trackTitle',
      message: '연속된 공백이 발견되었습니다',
      details: 'DSP에서 자동으로 단일 공백으로 변환될 수 있습니다.',
      currentValue: title,
      suggestedValue: formatUtils.trimSpaces(title),
      dspExamples: dspRejectionExamples.spaces,
      canIgnore: true
    });
  }

  // 괄호 스타일 체크 (경고)
  if (/［|］|（|）/.test(title)) {
    warnings.push({
      id: uuidv4(),
      type: 'warning',
      field: 'trackTitle',
      message: '비표준 괄호 문자가 사용되었습니다',
      details: '일부 DSP에서 표준 괄호 () []로 변환을 요구할 수 있습니다.',
      currentValue: title,
      suggestedValue: formatUtils.standardizeBrackets(title),
      dspExamples: dspRejectionExamples.brackets,
      canIgnore: true
    });
  }

  // feat. 표준화 체크 (제안)
  if (/\b(featuring|ft\.|ft)\b/i.test(title)) {
    warnings.push({
      id: uuidv4(),
      type: 'suggestion',
      field: 'trackTitle',
      message: 'feat. 형식 표준화를 권장합니다',
      details: '대부분의 DSP에서 "feat." 형식을 선호합니다.',
      currentValue: title,
      suggestedValue: formatUtils.standardizeFeat(title),
      dspExamples: dspRejectionExamples.feat,
      canIgnore: true
    });
  }

  // 버전 표기 체크 (제안)
  if (/\b(version|ver\.|ver|remix|rmx|inst|instrumental|acoustic|accoustic)\b/gi.test(title)) {
    warnings.push({
      id: uuidv4(),
      type: 'suggestion',
      field: 'trackTitle',
      message: '버전 표기 표준화를 권장합니다',
      details: 'Ver., Remix, Inst., Acoustic 등의 표준 표기를 사용하면 DSP 처리가 원활합니다.',
      currentValue: title,
      suggestedValue: formatUtils.standardizeVersion(title),
      dspExamples: dspRejectionExamples.version,
      canIgnore: true
    });
  }

  const hasErrors = warnings.some(w => w.type === 'error');
  
  return {
    isValid: !hasErrors,
    warnings,
    value: title
  };
}

// 아티스트 이름 검증
export function validateArtistName(name: string, isComposer: boolean = false): ValidationResult {
  const warnings: ValidationWarning[] = [];
  
  if (!name || name.trim().length === 0) {
    warnings.push({
      id: uuidv4(),
      type: 'error',
      field: 'artistName',
      message: `${isComposer ? '작곡가/작사가' : '아티스트'} 이름을 입력해주세요.`,
      canIgnore: false
    });
    return {
      isValid: false,
      warnings,
      value: name
    };
  }

  // 작곡가/작사가는 풀네임 체크
  if (isComposer) {
    // 이니셜 체크 (예: J.K., K.D.)
    const initialPattern = /^[A-Z]\.[A-Z]\.?$/;
    if (initialPattern.test(name)) {
      warnings.push({
        id: uuidv4(),
        type: 'warning',
        field: 'artistName',
        message: '작곡가/작사가는 풀네임 사용을 권장합니다',
        details: '이니셜보다는 전체 이름을 사용하면 저작권 관리가 명확해집니다.',
        currentValue: name,
        dspExamples: [
          { platform: 'Apple Music', rejectionMessage: 'Composer/Lyricist must use full legal name' },
          { platform: 'Spotify', rejectionMessage: 'Copyright holder name must be complete' }
        ],
        canIgnore: true
      });
    }
    
    // 한 글자 이름 체크
    if (name.trim().length === 1) {
      warnings.push({
        id: uuidv4(),
        type: 'error',
        field: 'artistName',
        message: '작곡가/작사가는 풀네임으로 입력해주세요',
        details: '예: 김동욱, John Smith',
        canIgnore: false
      });
    }
  }

  // 특수문자 체크 (일부 허용)
  const invalidChars = /[<>:"/\\|?*]/g;
  if (invalidChars.test(name)) {
    warnings.push({
      id: uuidv4(),
      type: 'error',
      field: 'artistName',
      message: '사용할 수 없는 특수문자가 포함되어 있습니다',
      details: '< > : " / \\ | ? * 문자는 사용할 수 없습니다.',
      dspExamples: dspRejectionExamples.specialChars,
      canIgnore: false
    });
  }

  // 아티스트 이름 길이 체크
  if (name.length > 100) {
    warnings.push({
      id: uuidv4(),
      type: 'error',
      field: 'artistName',
      message: '아티스트 이름은 100자를 초과할 수 없습니다',
      details: `현재 ${name.length}자입니다. ${name.length - 100}자를 줄여주세요.`,
      canIgnore: false
    });
  }

  // 연속된 공백 체크 (경고)
  if (/\s{2,}/.test(name)) {
    warnings.push({
      id: uuidv4(),
      type: 'warning',
      field: 'artistName',
      message: '연속된 공백이 발견되었습니다',
      currentValue: name,
      suggestedValue: formatUtils.trimSpaces(name),
      canIgnore: true
    });
  }

  // 스포티파이/애플뮤직 등록 안내 (정보성)
  if (!isComposer && warnings.filter(w => w.type === 'error').length === 0) {
    warnings.push({
      id: uuidv4(),
      type: 'suggestion',
      field: 'artistName',
      message: '💡 팁: 아티스트 이름 일치 확인',
      details: 'Spotify나 Apple Music에 등록된 이름과 동일하게 입력하면 아티스트 프로필이 자동으로 연결됩니다.',
      canIgnore: true
    });
  }

  const hasErrors = warnings.some(w => w.type === 'error');
  
  return {
    isValid: !hasErrors,
    warnings,
    value: name
  };
}

// 대시 표준화 체크용 DSP 예제
const dashRejectionExamples = [
  { platform: 'Apple Music', rejectionMessage: 'Inconsistent dash formatting detected' },
  { platform: 'Spotify', rejectionMessage: 'Use standard hyphen-minus character for dashes' }
];

// FUGA QC 추가 검증 규칙
export function validateWithFugaRules(value: string, fieldType: 'album' | 'track' | 'artist'): ValidationResult {
  // 필드별 기본 검증 먼저 수행
  let baseResult: ValidationResult;
  switch (fieldType) {
    case 'album':
      baseResult = validateAlbumTitle(value);
      break;
    case 'track':
      baseResult = validateTrackTitle(value);
      break;
    case 'artist':
      baseResult = validateArtistName(value);
      break;
  }

  // FUGA 특화 추가 경고
  const additionalWarnings: ValidationWarning[] = [];

  // 괄호 내 공백 체크
  if (/\(\s+|\s+\)/.test(value)) {
    additionalWarnings.push({
      id: uuidv4(),
      type: 'warning',
      field: fieldType,
      message: '괄호 안 불필요한 공백이 있습니다',
      details: '괄호 바로 안쪽의 공백은 제거하는 것이 좋습니다.',
      currentValue: value,
      suggestedValue: value.replace(/\(\s+/g, '(').replace(/\s+\)/g, ')'),
      canIgnore: true
    });
  }

  // 대시 주변 공백 체크
  if (/\s*[-–—]\s*/.test(value) && !/\s[-–—]\s/.test(value)) {
    additionalWarnings.push({
      id: uuidv4(),
      type: 'suggestion',
      field: fieldType,
      message: '대시 주변 공백 표준화를 권장합니다',
      details: '대시 앞뒤에 공백을 하나씩 넣는 것이 표준입니다.',
      currentValue: value,
      suggestedValue: value.replace(/\s*[-–—]\s*/g, ' - '),
      dspExamples: dashRejectionExamples,
      canIgnore: true
    });
  }

  return {
    isValid: baseResult.isValid,
    warnings: [...baseResult.warnings, ...additionalWarnings],
    value: value
  };
}

// 실시간 검증을 위한 유틸리티 함수
export function createValidationState() {
  const dismissedWarnings = new Set<string>();
  
  return {
    dismissWarning: (warningId: string) => {
      dismissedWarnings.add(warningId);
    },
    isWarningDismissed: (warningId: string) => {
      return dismissedWarnings.has(warningId);
    },
    filterActiveWarnings: (warnings: ValidationWarning[]) => {
      return warnings.filter(w => !dismissedWarnings.has(w.id));
    },
    clearDismissed: () => {
      dismissedWarnings.clear();
    }
  };
}