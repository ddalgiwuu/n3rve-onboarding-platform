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
export function validateAlbumTitle(title: string, language: 'ko' | 'en' | 'ja' = 'ko'): ValidationResult {
  const warnings: ValidationWarning[] = [];
  const t = (ko: string, en: string, ja: string) => {
    switch(language) {
      case 'ko': return ko;
      case 'en': return en;
      case 'ja': return ja;
      default: return ko;
    }
  };

  if (!title || title.trim().length === 0) {
    warnings.push({
      id: uuidv4(),
      type: 'error',
      field: 'albumTitle',
      message: t('앨범 제목을 입력해주세요.', 'Please enter album title.', 'アルバムタイトルを入力してください。'),
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
      message: t('파일명에 사용할 수 없는 특수문자가 포함되어 있습니다', 'Title contains invalid characters for filenames', 'ファイル名に使用できない特殊文字が含まれています'),
      details: t('< > : " / \\ | ? * 문자는 파일 시스템에서 사용할 수 없어 반드시 제거해야 합니다.', 'Characters < > : " / \\ | ? * cannot be used in file systems and must be removed.', '< > : " / \\ | ? * の文字はファイルシステムで使用できないため、必ず削除してください。'),
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
      message: t('앨범 제목은 255자를 초과할 수 없습니다', 'Album title cannot exceed 255 characters', 'アルバムタイトルは255文字を超えることはできません'),
      details: t(`현재 ${title.length}자입니다. ${title.length - 255}자를 줄여주세요.`, `Currently ${title.length} characters. Please reduce by ${title.length - 255} characters.`, `現在${title.length}文字です。${title.length - 255}文字減らしてください。`),
      canIgnore: false
    });
  }

  // 연속된 공백 체크 (경고)
  if (/\s{2,}/.test(title)) {
    warnings.push({
      id: uuidv4(),
      type: 'warning',
      field: 'albumTitle',
      message: t('연속된 공백이 발견되었습니다', 'Consecutive spaces detected', '連続したスペースが見つかりました'),
      details: t('DSP에서 자동으로 단일 공백으로 변환될 수 있습니다.', 'DSPs may automatically convert to single spaces.', 'DSPでは自動的に単一スペースに変換される可能性があります。'),
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
      message: t('비표준 괄호 문자가 사용되었습니다', 'Non-standard bracket characters used', '非標準の括弧文字が使用されています'),
      details: t('일부 DSP에서 표준 괄호 () []로 변환을 요구할 수 있습니다.', 'Some DSPs may require conversion to standard brackets () [].', '一部のDSPでは標準括弧 () [] への変換を要求する場合があります。'),
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
      message: t('feat. 형식 표준화를 권장합니다', 'Recommend standardizing feat. format', 'feat. 形式の標準化をお勧めします'),
      details: t('대부분의 DSP에서 "feat." 형식을 선호합니다.', 'Most DSPs prefer "feat." format.', 'ほとんどのDSPでは"feat."形式を推奨しています。'),
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
      message: t('OST 표기를 대문자로 통일하는 것을 권장합니다', 'Recommend using uppercase for OST notation', 'OST表記は大文字で統一することをお勧めします'),
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
      message: t('버전 표기 표준화를 권장합니다', 'Recommend standardizing version notation', 'バージョン表記の標準化をお勧めします'),
      details: t('Ver., Remix, Inst., Acoustic 등의 표준 표기를 사용하면 DSP 처리가 원활합니다.', 'Using standard notations like Ver., Remix, Inst., Acoustic helps DSP processing.', 'Ver.、Remix、Inst.、Acousticなどの標準表記を使用するとDSP処理がスムーズになります。'),
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
export function validateTrackTitle(title: string, trackNumber?: number, language: 'ko' | 'en' | 'ja' = 'ko'): ValidationResult {
  const warnings: ValidationWarning[] = [];
  const t = (ko: string, en: string, ja: string) => {
    switch(language) {
      case 'ko': return ko;
      case 'en': return en;
      case 'ja': return ja;
      default: return ko;
    }
  };

  if (!title || title.trim().length === 0) {
    warnings.push({
      id: uuidv4(),
      type: 'error',
      field: 'trackTitle',
      message: t(
        `트랙${trackNumber ? ` ${trackNumber}` : ''}의 제목을 입력해주세요.`,
        `Please enter title for track${trackNumber ? ` ${trackNumber}` : ''}.`,
        `トラック${trackNumber ? ` ${trackNumber}` : ''}のタイトルを入力してください。`
      ),
      canIgnore: false
    });
    return {
      isValid: false,
      warnings,
      value: title
    };
  }

  // 트랙 번호 체크 (경고)
  const trackNumberPattern = /^\d+[.\-\s]+/;
  if (trackNumberPattern.test(title)) {
    const cleanTitle = title.replace(trackNumberPattern, '');
    warnings.push({
      id: uuidv4(),
      type: 'warning',
      field: 'trackTitle',
      message: t('트랙 번호가 제목에 포함되어 있습니다', 'Track number is included in the title', 'タイトルにトラック番号が含まれています'),
      details: t('트랙 번호는 시스템에서 자동으로 추가됩니다. 제목에 포함하면 중복될 수 있습니다.', 'Track numbers are automatically added by the system. Including them in the title may cause duplication.', 'トラック番号はシステムが自動的に追加します。タイトルに含めると重複する可能性があります。'),
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
      message: t('파일명에 사용할 수 없는 특수문자가 포함되어 있습니다', 'Title contains invalid characters for filenames', 'ファイル名に使用できない特殊文字が含まれています'),
      details: t('< > : " / \\ | ? * 문자는 파일 시스템에서 사용할 수 없어 반드시 제거해야 합니다.', 'Characters < > : " / \\ | ? * cannot be used in file systems and must be removed.', '< > : " / \\ | ? * の文字はファイルシステムで使用できないため、必ず削除してください。'),
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
      message: t('트랙 제목은 255자를 초과할 수 없습니다', 'Track title cannot exceed 255 characters', 'トラックタイトルは255文字を超えることはできません'),
      details: t(`현재 ${title.length}자입니다. ${title.length - 255}자를 줄여주세요.`, `Currently ${title.length} characters. Please reduce by ${title.length - 255} characters.`, `現在${title.length}文字です。${title.length - 255}文字減らしてください。`),
      canIgnore: false
    });
  }

  // 연속된 공백 체크 (경고)
  if (/\s{2,}/.test(title)) {
    warnings.push({
      id: uuidv4(),
      type: 'warning',
      field: 'trackTitle',
      message: t('연속된 공백이 발견되었습니다', 'Consecutive spaces detected', '連続したスペースが見つかりました'),
      details: t('DSP에서 자동으로 단일 공백으로 변환될 수 있습니다.', 'DSPs may automatically convert to single spaces.', 'DSPでは自動的に単一スペースに変換される可能性があります。'),
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
      message: t('비표준 괄호 문자가 사용되었습니다', 'Non-standard bracket characters used', '非標準の括弧文字が使用されています'),
      details: t('일부 DSP에서 표준 괄호 () []로 변환을 요구할 수 있습니다.', 'Some DSPs may require conversion to standard brackets () [].', '一部のDSPでは標準括弧 () [] への変換を要求する場合があります。'),
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
      message: t('feat. 형식 표준화를 권장합니다', 'Recommend standardizing feat. format', 'feat. 形式の標準化をお勧めします'),
      details: t('대부분의 DSP에서 "feat." 형식을 선호합니다.', 'Most DSPs prefer "feat." format.', 'ほとんどのDSPでは"feat."形式を推奨しています。'),
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
      message: t('버전 표기 표준화를 권장합니다', 'Recommend standardizing version notation', 'バージョン表記の標準化をお勧めします'),
      details: t('Ver., Remix, Inst., Acoustic 등의 표준 표기를 사용하면 DSP 처리가 원활합니다.', 'Using standard notations like Ver., Remix, Inst., Acoustic helps DSP processing.', 'Ver.、Remix、Inst.、Acousticなどの標準表記を使用するとDSP処理がスムーズになります。'),
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
export function validateArtistName(name: string, isComposer: boolean = false, language: 'ko' | 'en' | 'ja' = 'ko'): ValidationResult {
  const warnings: ValidationWarning[] = [];
  const t = (ko: string, en: string, ja: string) => {
    switch(language) {
      case 'ko': return ko;
      case 'en': return en;
      case 'ja': return ja;
      default: return ko;
    }
  };

  if (!name || name.trim().length === 0) {
    warnings.push({
      id: uuidv4(),
      type: 'error',
      field: 'artistName',
      message: t(
        `${isComposer ? '작곡가/작사가' : '아티스트'} 이름을 입력해주세요.`,
        `Please enter ${isComposer ? 'composer/lyricist' : 'artist'} name.`,
        `${isComposer ? '作曲家/作詞家' : 'アーティスト'}名を入力してください。`
      ),
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
        message: t('작곡가/작사가는 풀네임 사용을 권장합니다', 'Full name recommended for composers/lyricists', '作曲家/作詞家はフルネームの使用をお勧めします'),
        details: t('이니셜보다는 전체 이름을 사용하면 저작권 관리가 명확해집니다.', 'Using full names instead of initials makes copyright management clearer.', 'イニシャルより完全な名前を使用すると著作権管理が明確になります。'),
        currentValue: name,
        dspExamples: [
          { platform: 'Apple Music', rejectionMessage: 'Composer/Lyricist must use full legal name', rejectionMessageKo: '작곡가/작사가는 법적 성명을 사용해야 합니다' },
          { platform: 'Spotify', rejectionMessage: 'Copyright holder name must be complete', rejectionMessageKo: '저작권 소유자 이름은 완전해야 합니다' }
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
        message: t('작곡가/작사가는 풀네임으로 입력해주세요', 'Please enter full name for composer/lyricist', '作曲家/作詞家はフルネームで入力してください'),
        details: t('예: 김동욱, John Smith', 'e.g., Kim Dongwook, John Smith', '例: 김동욱, John Smith'),
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
      message: t('사용할 수 없는 특수문자가 포함되어 있습니다', 'Contains invalid special characters', '使用できない特殊文字が含まれています'),
      details: t('< > : " / \\ | ? * 문자는 사용할 수 없습니다.', 'Characters < > : " / \\ | ? * cannot be used.', '< > : " / \\ | ? * の文字は使用できません。'),
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
      message: t('아티스트 이름은 100자를 초과할 수 없습니다', 'Artist name cannot exceed 100 characters', 'アーティスト名は100文字を超えることはできません'),
      details: t(`현재 ${name.length}자입니다. ${name.length - 100}자를 줄여주세요.`, `Currently ${name.length} characters. Please reduce by ${name.length - 100} characters.`, `現在${name.length}文字です。${name.length - 100}文字減らしてください。`),
      canIgnore: false
    });
  }

  // 연속된 공백 체크 (경고)
  if (/\s{2,}/.test(name)) {
    warnings.push({
      id: uuidv4(),
      type: 'warning',
      field: 'artistName',
      message: t('연속된 공백이 발견되었습니다', 'Consecutive spaces detected', '連続したスペースが見つかりました'),
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
      message: t('💡 팁: 아티스트 이름 일치 확인', '💡 Tip: Check artist name match', '💡 ヒント: アーティスト名の一致を確認'),
      details: t('Spotify나 Apple Music에 등록된 이름과 동일하게 입력하면 아티스트 프로필이 자동으로 연결됩니다.', 'Enter the same name as registered on Spotify or Apple Music to automatically link artist profiles.', 'SpotifyやApple Musicに登録されている名前と同じように入力すると、アーティストプロフィールが自動的にリンクされます。'),
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
export function validateWithFugaRules(value: string, fieldType: 'album' | 'track' | 'artist', language: 'ko' | 'en' | 'ja' = 'ko'): ValidationResult {
  // 필드별 기본 검증 먼저 수행
  let baseResult: ValidationResult;
  switch (fieldType) {
    case 'album':
      baseResult = validateAlbumTitle(value, language);
      break;
    case 'track':
      baseResult = validateTrackTitle(value, undefined, language);
      break;
    case 'artist':
      baseResult = validateArtistName(value, false, language);
      break;
  }

  // FUGA 특화 추가 경고
  const additionalWarnings: ValidationWarning[] = [];
  const t = (ko: string, en: string, ja: string) => {
    switch(language) {
      case 'ko': return ko;
      case 'en': return en;
      case 'ja': return ja;
      default: return ko;
    }
  };

  // 괄호 내 공백 체크
  if (/\(\s+|\s+\)/.test(value)) {
    additionalWarnings.push({
      id: uuidv4(),
      type: 'warning',
      field: fieldType,
      message: t('괄호 안 불필요한 공백이 있습니다', 'Unnecessary spaces inside parentheses', '括弧内に不要なスペースがあります'),
      details: t('괄호 바로 안쪽의 공백은 제거하는 것이 좋습니다.', 'It\'s better to remove spaces immediately inside parentheses.', '括弧のすぐ内側のスペースは削除することをお勧めします。'),
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
      message: t('대시 주변 공백 표준화를 권장합니다', 'Recommend standardizing spaces around dashes', 'ダッシュ周辺のスペースの標準化をお勧めします'),
      details: t('대시 앞뒤에 공백을 하나씩 넣는 것이 표준입니다.', 'Standard is to have one space before and after dashes.', 'ダッシュの前後にスペースを1つずつ入れることが標準です。'),
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

// Contributor validation
export interface Contributor {
  id: string;
  name: string;
  nameEn?: string;
  role: string;
  isPrimary?: boolean;
}

export function validateContributors(contributors: Contributor[], language: 'ko' | 'en' | 'ja' = 'ko'): ValidationResult {
  const warnings: ValidationWarning[] = [];
  const t = (ko: string, en: string, ja: string) => {
    switch(language) {
      case 'ko': return ko;
      case 'en': return en;
      case 'ja': return ja;
      default: return ko;
    }
  };

  // Required contributor roles
  const hasLyricist = contributors.some(c => c.role === 'lyricist');
  const hasComposer = contributors.some(c => c.role === 'composer');
  const hasPerformingArtist = contributors.some(c =>
    ['featured-artist', 'featuring', 'vocalist', 'lead-vocalist', 'performer', 'instrumentalist', 'band', 'orchestra'].includes(c.role)
  );

  if (!hasLyricist) {
    warnings.push({
      id: uuidv4(),
      type: 'error',
      field: 'contributors',
      message: t(
        '작사가는 필수 입력 항목입니다. 최소 한 명의 작사가를 추가해주세요.',
        'Lyricist is required. Please add at least one lyricist.',
        '作詞家は必須入力項目です。少なくとも1人の作詞家を追加してください。'
      ),
      details: t(
        'FUGA QC 규정에 따라 모든 음원은 작사가 정보가 필요합니다.',
        'According to FUGA QC requirements, all tracks must have lyricist information.',
        'FUGA QC規定により、すべての音源には作詞家情報が必要です。'
      ),
      canIgnore: false
    });
  }

  if (!hasComposer) {
    warnings.push({
      id: uuidv4(),
      type: 'error',
      field: 'contributors',
      message: t(
        '작곡가는 필수 입력 항목입니다. 최소 한 명의 작곡가를 추가해주세요.',
        'Composer is required. Please add at least one composer.',
        '作曲家は必須入力項目です。少なくとも1人の作曲家を追加してください。'
      ),
      details: t(
        'FUGA QC 규정에 따라 모든 음원은 작곡가 정보가 필요합니다.',
        'According to FUGA QC requirements, all tracks must have composer information.',
        'FUGA QC規定により、すべての音源には作曲家情報が必要です。'
      ),
      canIgnore: false
    });
  }

  if (!hasPerformingArtist) {
    warnings.push({
      id: uuidv4(),
      type: 'error',
      field: 'contributors',
      message: t(
        'Performing Artist는 필수 입력 항목입니다. 최소 한 명의 연주자/보컬리스트를 추가해주세요.',
        'Performing Artist is required. Please add at least one performer/vocalist.',
        'Performing Artistは必須入力項目です。少なくとも1人の演奏者/ボーカリストを追加してください。'
      ),
      details: t(
        'FUGA QC 규정에 따라 모든 음원은 실연자 정보가 필요합니다.',
        'According to FUGA QC requirements, all tracks must have performing artist information.',
        'FUGA QC規定により、すべての音源には実演者情報が必要です。'
      ),
      canIgnore: false
    });
  }

  // Validate individual contributors
  contributors.forEach((contributor, index) => {
    const nameValidation = validateArtistName(contributor.name, true, language);
    nameValidation.warnings.forEach(warning => {
      warning.field = `contributor[${index}].name`;
    });
    warnings.push(...nameValidation.warnings);
  });

  const hasErrors = warnings.some(w => w.type === 'error');

  return {
    isValid: !hasErrors,
    warnings,
    value: JSON.stringify(contributors)
  };
}

// File upload guidelines
export interface FileUploadGuideline {
  fileType: 'audio' | 'albumArt' | 'lyrics' | 'additional';
  formats: string[];
  maxSize: string;
  minRequirements?: Record<string, string>;
  maxRequirements?: Record<string, string>;
  recommendations: string[];
  restrictions: string[];
  namingConvention: string;
  googleDriveSupported?: boolean;
}

export function getFileUploadGuidelines(language: 'ko' | 'en' | 'ja' = 'ko'): Record<string, FileUploadGuideline> {
  const t = (ko: string, en: string, ja: string) => {
    switch(language) {
      case 'ko': return ko;
      case 'en': return en;
      case 'ja': return ja;
      default: return ko;
    }
  };

  return {
    audio: {
      fileType: 'audio',
      formats: ['WAV', 'FLAC', 'AIFF'],
      maxSize: '1GB',
      minRequirements: {
        bitDepth: t('16-bit', '16-bit', '16-bit'),
        sampleRate: t('44.1kHz', '44.1kHz', '44.1kHz'),
        channels: t('스테레오', 'Stereo', 'ステレオ')
      },
      maxRequirements: {
        bitDepth: t('24-bit', '24-bit', '24-bit'),
        sampleRate: t('192kHz', '192kHz', '192kHz')
      },
      recommendations: [
        t('무손실 포맷(WAV, FLAC) 사용을 권장합니다', 'Use lossless formats (WAV, FLAC) recommended', 'ロスレスフォーマット（WAV、FLAC）の使用をお勧めします'),
        t('24-bit/48kHz 이상의 고품질 오디오 권장', 'High quality audio 24-bit/48kHz or higher recommended', '24-bit/48kHz以上の高品質オーディオを推奨'),
        t('마스터링이 완료된 최종 버전을 업로드하세요', 'Upload the final mastered version', 'マスタリングが完了した最終バージョンをアップロードしてください'),
        t('피크 레벨은 -1dB ~ 0dB 사이를 유지하세요', 'Maintain peak levels between -1dB and 0dB', 'ピークレベルは-1dB〜0dBの間を維持してください')
      ],
      restrictions: [
        t('MP3, M4A 등 손실 압축 포맷은 지원하지 않습니다', 'Lossy formats like MP3, M4A are not supported', 'MP3、M4Aなどの損失圧縮フォーマットはサポートされていません'),
        t('DRM이 적용된 파일은 업로드할 수 없습니다', 'DRM protected files cannot be uploaded', 'DRM保護されたファイルはアップロードできません')
      ],
      namingConvention: t('[트랙번호]_[아티스트명]_[곡제목].wav', '[TrackNumber]_[ArtistName]_[TrackTitle].wav', '[トラック番号]_[アーティスト名]_[曲タイトル].wav'),
      googleDriveSupported: true
    },
    albumArt: {
      fileType: 'albumArt',
      formats: ['JPG', 'JPEG', 'PNG'],
      maxSize: '10MB',
      minRequirements: {
        resolution: '3000x3000px',
        colorMode: 'RGB',
        dpi: '300'
      },
      maxRequirements: {
        resolution: '5000x5000px'
      },
      recommendations: [
        t('정사각형 이미지(1:1 비율)를 사용하세요', 'Use square images (1:1 ratio)', '正方形の画像（1:1比率）を使用してください'),
        t('고해상도 이미지(3000x3000px 이상) 권장', 'High resolution images (3000x3000px or higher) recommended', '高解像度画像（3000x3000px以上）推奨'),
        t('텍스트가 선명하게 보이도록 해주세요', 'Ensure text is clearly visible', 'テキストがはっきり見えるようにしてください'),
        t('앨범 아트에 URL, 가격정보, 프로모션 문구를 포함하지 마세요', 'Do not include URLs, pricing, or promotional text in album art', 'アルバムアートにURL、価格情報、プロモーション文言を含めないでください')
      ],
      restrictions: [
        t('GIF, BMP, TIFF 형식은 지원하지 않습니다', 'GIF, BMP, TIFF formats are not supported', 'GIF、BMP、TIFF形式はサポートされていません'),
        t('투명 배경(알파 채널)은 사용할 수 없습니다', 'Transparent backgrounds (alpha channel) cannot be used', '透明背景（アルファチャンネル）は使用できません'),
        t('저작권이 있는 이미지는 사용할 수 없습니다', 'Copyrighted images cannot be used', '著作権のある画像は使用できません'),
        t('폭력적이거나 성적인 콘텐츠는 금지됩니다', 'Violent or sexual content is prohibited', '暴力的または性的なコンテンツは禁止されています')
      ],
      namingConvention: t('[아티스트명]_[앨범명]_cover.jpg', '[ArtistName]_[AlbumTitle]_cover.jpg', '[アーティスト名]_[アルバム名]_cover.jpg'),
      googleDriveSupported: false
    },
    lyrics: {
      fileType: 'lyrics',
      formats: ['TXT', 'LRC', 'PDF'],
      maxSize: '1MB',
      recommendations: [
        t('UTF-8 인코딩을 사용하세요', 'Use UTF-8 encoding', 'UTF-8エンコーディングを使用してください'),
        t('각 언어별로 별도 파일로 제공하세요', 'Provide separate files for each language', '各言語ごとに別のファイルで提供してください'),
        t('시간 정보가 포함된 LRC 포맷 권장', 'LRC format with timing information recommended', 'タイミング情報を含むLRCフォーマット推奨'),
        t('정확한 맞춤법과 문법을 확인하세요', 'Check for accurate spelling and grammar', '正確なスペルと文法を確認してください')
      ],
      restrictions: [
        t('이미지 파일로 된 가사는 허용되지 않습니다', 'Lyrics as image files are not allowed', '画像ファイルとしての歌詞は許可されていません'),
        t('저작권 표시를 반드시 포함하세요', 'Copyright notice must be included', '著作権表示を必ず含めてください')
      ],
      namingConvention: t('[트랙번호]_[곡제목]_lyrics_[언어코드].txt', '[TrackNumber]_[TrackTitle]_lyrics_[LanguageCode].txt', '[トラック番号]_[曲タイトル]_lyrics_[言語コード].txt'),
      googleDriveSupported: true
    },
    additional: {
      fileType: 'additional',
      formats: ['PDF', 'JPG', 'PNG', 'ZIP'],
      maxSize: '50MB',
      recommendations: [
        t('라이너 노트, 부클릿, 추가 아트워크 등을 포함할 수 있습니다', 'Can include liner notes, booklets, additional artwork', 'ライナーノート、ブックレット、追加アートワークなどを含めることができます'),
        t('여러 파일은 ZIP으로 압축하여 업로드하세요', 'Compress multiple files into ZIP for upload', '複数のファイルはZIPに圧縮してアップロードしてください'),
        t('파일명에 내용을 명확히 표시하세요', 'Clearly indicate content in filename', 'ファイル名に内容を明確に表示してください')
      ],
      restrictions: [
        t('실행 파일(.exe, .app 등)은 업로드할 수 없습니다', 'Executable files (.exe, .app, etc.) cannot be uploaded', '実行ファイル（.exe、.appなど）はアップロードできません'),
        t('음원 파일은 별도 오디오 섹션에 업로드하세요', 'Audio files should be uploaded in the audio section', '音源ファイルは別のオーディオセクションにアップロードしてください')
      ],
      namingConvention: t('[아티스트명]_[앨범명]_[내용설명].[확장자]', '[ArtistName]_[AlbumTitle]_[Description].[extension]', '[アーティスト名]_[アルバム名]_[内容説明].[拡張子]'),
      googleDriveSupported: true
    }
  };
}

// Label field validation (for translation support)
export function validateLabel(label: string, language: 'ko' | 'en' | 'ja' = 'ko'): ValidationResult {
  const warnings: ValidationWarning[] = [];
  const t = (ko: string, en: string, ja: string) => {
    switch(language) {
      case 'ko': return ko;
      case 'en': return en;
      case 'ja': return ja;
      default: return ko;
    }
  };

  if (!label || label.trim().length === 0) {
    // Label is optional, so no error for empty
    return {
      isValid: true,
      warnings,
      value: label
    };
  }

  // Apply standard validation rules
  const baseValidation = validateArtistName(label, false, language);

  // Add label-specific warnings
  baseValidation.warnings.forEach(w => {
    w.field = 'label';
  });

  // Check for common label formatting issues
  if (/\b(records|Records|RECORDS|ent\.|Ent\.|ENT\.|entertainment|Entertainment|ENTERTAINMENT)\b/.test(label)) {
    warnings.push({
      id: uuidv4(),
      type: 'suggestion',
      field: 'label',
      message: t(
        '레이블명 형식을 확인해주세요',
        'Please check label name format',
        'レーベル名の形式を確認してください'
      ),
      details: t(
        'Records, Entertainment 등의 약어 사용이 일관되는지 확인하세요',
        'Check if abbreviations like Records, Entertainment are used consistently',
        'Records、Entertainmentなどの略語の使用が一貫しているか確認してください'
      ),
      currentValue: label,
      canIgnore: true
    });
  }

  return {
    isValid: baseValidation.isValid,
    warnings: [...baseValidation.warnings, ...warnings],
    value: label
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
