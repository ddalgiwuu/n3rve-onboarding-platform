// 도움말 및 설명 텍스트 모음
export const helpTexts = {
  // Spotify/Apple Music ID 획득 방법
  spotifyId: {
    title: 'Spotify 아티스트 ID 획득 방법',
    content: `
1. Spotify 웹 플레이어 또는 앱에서 아티스트 페이지로 이동
2. 공유 버튼 클릭 → '아티스트 링크 복사' 선택
3. 복사된 링크에서 ID 추출:
   예시: https://open.spotify.com/artist/3Nrfpe0tUJi4K4DXYWgMUX
   ID: 3Nrfpe0tUJi4K4DXYWgMUX (artist/ 뒤의 문자열)
4. 아직 Spotify에 아티스트 프로필이 없다면 첫 릴리즈 후 자동 생성됩니다`,
    tips: [
      'Spotify for Artists에서도 ID를 확인할 수 있습니다',
      '정확한 ID를 입력하면 스트리밍 데이터가 자동으로 연동됩니다',
      '잘못된 ID 입력 시 다른 아티스트와 연결될 수 있으니 주의하세요'
    ]
  },

  appleMusicId: {
    title: 'Apple Music 아티스트 ID 획득 방법',
    content: `
1. Apple Music 웹사이트 또는 iTunes에서 아티스트 페이지 접속
2. URL에서 ID 확인:
   예시: https://music.apple.com/artist/beyonce/1419227
   ID: 1419227 (마지막 숫자)
3. Apple Music for Artists에서도 확인 가능
4. 첫 릴리즈인 경우 ID는 릴리즈 후 생성됩니다`,
    tips: [
      'Apple Music Connect 계정이 있다면 더 쉽게 확인 가능합니다',
      'ID는 항상 숫자로만 구성되어 있습니다',
      'Artist ID와 Album ID를 혼동하지 마세요'
    ]
  },

  // 앨범 타입 설명
  albumType: {
    single: {
      title: '싱글 (Single)',
      description: '1~3곡, 총 재생시간 30분 미만',
      requirements: [
        '모든 트랙이 동일한 제목이어야 함 (리믹스, 버전 제외)',
        '타이틀곡은 반드시 첫 번째 트랙',
        '리믹스나 다른 버전은 괄호 안에 표시'
      ]
    },
    ep: {
      title: 'EP (Extended Play)',
      description: '4~6곡 또는 총 재생시간 30분 미만',
      requirements: [
        '앨범 전체 컨셉이 통일되어야 함',
        '트랙 순서가 음악적 흐름을 고려해야 함',
        '보너스 트랙은 마지막에 배치'
      ]
    },
    album: {
      title: '정규 앨범 (Album)',
      description: '7곡 이상 또는 총 재생시간 30분 이상',
      requirements: [
        '전체적인 음악적 완성도 필요',
        '트랙리스트 구성이 중요',
        '인트로/아웃트로 포함 가능'
      ]
    }
  },

  // 저작권 설명
  copyright: {
    cRights: {
      title: '저작권 (Copyright) ©',
      description: '작곡/작사에 대한 권리',
      example: 'YG Entertainment',
      tips: [
        '작곡가, 작사가의 권리를 보호합니다',
        '© 기호는 자동으로 추가되므로 입력하지 마세요',
        '보통 소속사나 퍼블리셔 이름을 입력합니다'
      ]
    },
    pRights: {
      title: '저작인접권 (Publishing Rights) ℗',
      description: '음원 녹음에 대한 권리',
      example: 'YG Entertainment',
      tips: [
        '실연자와 음반제작자의 권리를 보호합니다',
        '℗ 기호는 자동으로 추가되므로 입력하지 마세요',
        '음원을 제작한 레이블/회사명을 입력합니다'
      ]
    }
  },

  // 기여자 역할 설명
  contributorRoles: {
    producer: {
      description: '트랙의 전반적인 사운드와 방향성을 책임지는 프로듀서',
      importance: '현대 음악에서 가장 중요한 역할 중 하나'
    },
    composer: {
      description: '멜로디와 화성을 만드는 작곡가',
      importance: '음악의 기본 구조를 만듭니다'
    },
    lyricist: {
      description: '가사를 쓰는 작사가',
      importance: '메시지와 감정을 전달합니다'
    },
    arranger: {
      description: '편곡을 담당하는 편곡자',
      importance: '원곡을 다양한 스타일로 재해석합니다'
    }
  },

  // 마케팅 필드 설명
  marketing: {
    genre: {
      title: '장르 선택',
      description: '음악의 주요 스타일을 선택하세요',
      tips: [
        'DSP별로 장르 분류가 다를 수 있습니다',
        '최대한 구체적인 장르를 선택하세요',
        '크로스오버 장르는 서브장르에서 선택'
      ]
    },
    targetAudience: {
      title: '타겟 청중',
      description: '주요 리스너층을 구체적으로 설명하세요',
      example: '20-30대 여성, K-pop 팬, 감성적인 음악을 좋아하는 리스너',
      tips: [
        '연령대, 성별, 관심사를 포함하세요',
        '지역이나 문화적 배경도 중요합니다',
        '기존 팬베이스 특성을 고려하세요'
      ]
    },
    marketingKeywords: {
      title: '마케팅 키워드',
      description: '검색과 추천에 사용될 핵심 키워드',
      example: '여름, 청량, 사랑, 이별, 힐링, 드라이브',
      tips: [
        '계절, 분위기, 상황을 나타내는 키워드',
        '5-10개 정도가 적당합니다',
        '트렌디한 키워드도 포함하세요'
      ]
    }
  },

  // 일반 팁
  generalTips: {
    fileNaming: {
      title: '파일명 규칙',
      content: '영문, 숫자, 언더스코어(_), 하이픈(-)만 사용하세요',
      avoid: '특수문자, 한글, 공백은 피하세요'
    },
    audioQuality: {
      title: '음원 품질',
      content: 'WAV 24bit/48kHz 이상 권장',
      minimum: '최소 16bit/44.1kHz (CD 품질)'
    }
  }
};

// 툴팁 텍스트 (짧은 설명)
export const tooltips = {
  spotifyId: 'Spotify 아티스트 페이지 URL에서 찾을 수 있습니다',
  appleMusicId: 'Apple Music 아티스트 페이지 URL의 마지막 숫자입니다',
  isrc: '국제 표준 녹음 코드 (없으면 자동 생성됩니다)',
  upc: '범용 상품 코드 (없으면 자동 생성됩니다)',
  dolbyAtmos: '공간 음향 지원 여부',
  stereo: '스테레오 마스터 포함 여부',
  titleTrack: '앨범의 대표곡/타이틀곡',
  featuringArtist: '피처링 참여 아티스트',
  contributor: '작곡, 편곡, 연주 등에 참여한 사람',
  releaseDate: '음원이 공개되는 날짜 (최소 2주 전 설정 권장)',
  copyrightYear: '저작권 연도 (보통 녹음 연도)',
  parentalAdvisory: '19금 내용 포함 여부',
  previouslyReleased: '이미 다른 플랫폼에 공개된 경우',
  recordLabel: '음반 제작사/레이블명'
};

// 에러 메시지 설명
export const errorExplanations = {
  doubleSpaces: '연속된 공백은 사용할 수 없습니다. 한 칸만 사용하세요.',
  specialCharacters: '특수문자는 제목에 사용할 수 없습니다. 기본 문장부호만 허용됩니다.',
  titleCase: '영어 제목은 Title Case를 사용하세요 (주요 단어 첫 글자 대문자)',
  versionFormat: '버전 정보는 괄호 안에 표시하세요. 예: (Acoustic Version)',
  futureCopyright: '미래 연도는 저작권 연도로 사용할 수 없습니다.',
  genericArtistName: '너무 일반적인 아티스트명은 사용할 수 없습니다.'
};
