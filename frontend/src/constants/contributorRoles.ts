export interface ContributorRole {
  value: string
  label: string
  labelEn: string
  category: string
}

export const contributorRoles: ContributorRole[] = [
  // Management & Administration
  { value: 'a&r-administrator', label: 'A&R 관리자', labelEn: 'A&R Administrator', category: '관리' },
  { value: 'a&r-manager', label: 'A&R 매니저', labelEn: 'A&R Manager', category: '관리' },
  { value: 'agent', label: '에이전트', labelEn: 'Agent', category: '관리' },
  { value: 'artist-management', label: '아티스트 매니지먼트', labelEn: 'Artist Management', category: '관리' },

  // Production
  { value: 'producer', label: '프로듀서', labelEn: 'Producer', category: '프로덕션' },
  { value: 'executive-producer', label: '총괄 프로듀서', labelEn: 'Executive Producer', category: '프로덕션' },
  { value: 'co-producer', label: '공동 프로듀서', labelEn: 'Co-Producer', category: '프로덕션' },
  { value: 'assistant-producer', label: '어시스턴트 프로듀서', labelEn: 'Assistant Producer', category: '프로덕션' },
  { value: 'post-producer', label: '포스트 프로듀서', labelEn: 'Post-Producer', category: '프로덕션' },
  { value: 'vocal-producer', label: '보컬 프로듀서', labelEn: 'Vocal Producer', category: '프로덕션' },

  // Engineering
  { value: 'engineer', label: '엔지니어', labelEn: 'Engineer', category: '엔지니어링' },
  { value: 'mixing-engineer', label: '믹싱 엔지니어', labelEn: 'Mixing Engineer', category: '엔지니어링' },
  { value: 'mastering-engineer', label: '마스터링 엔지니어', labelEn: 'Mastering Engineer', category: '엔지니어링' },
  { value: 'recording-engineer', label: '레코딩 엔지니어', labelEn: 'Recording Engineer', category: '엔지니어링' },
  { value: 'sound-engineer', label: '사운드 엔지니어', labelEn: 'Sound Engineer', category: '엔지니어링' },
  { value: 'vocal-engineer', label: '보컬 엔지니어', labelEn: 'Vocal Engineer', category: '엔지니어링' },
  { value: 'assistant-mastering-engineer', label: '어시스턴트 마스터링 엔지니어', labelEn: 'Assistant Mastering Engineer', category: '엔지니어링' },
  { value: 'assistant-mixing-engineer', label: '어시스턴트 믹싱 엔지니어', labelEn: 'Assistant Mixing Engineer', category: '엔지니어링' },
  { value: 'assistant-recording-engineer', label: '어시스턴트 레코딩 엔지니어', labelEn: 'Assistant Recording Engineer', category: '엔지니어링' },
  { value: 'assistant-sound-engineer', label: '어시스턴트 사운드 엔지니어', labelEn: 'Assistant Sound Engineer', category: '엔지니어링' },
  { value: 'immersive-audio-engineer', label: '임머시브 오디오 엔지니어', labelEn: 'Immersive Audio Engineer', category: '엔지니어링' },
  { value: 'immersive-mastering-engineer', label: '임머시브 마스터링 엔지니어', labelEn: 'Immersive Mastering Engineer', category: '엔지니어링' },
  { value: 'immersive-mixing-engineer', label: '임머시브 믹싱 엔지니어', labelEn: 'Immersive Mixing Engineer', category: '엔지니어링' },
  { value: 'tonmeister', label: '톤마이스터', labelEn: 'Tonmeister', category: '엔지니어링' },

  // Composition & Writing
  { value: 'composer', label: '작곡가', labelEn: 'Composer', category: '작곡' },
  { value: 'lyricist', label: '작사가', labelEn: 'Lyricist', category: '작곡' },
  { value: 'arranger', label: '편곡자', labelEn: 'Arranger', category: '작곡' },
  { value: 'songwriter', label: '송라이터', labelEn: 'Songwriter', category: '작곡' },
  { value: 'writer', label: '작가', labelEn: 'Writer', category: '작곡' },
  { value: 'co-writer', label: '공동 작곡가', labelEn: 'Co-Writer', category: '작곡' },
  { value: 'assistant-composer', label: '어시스턴트 작곡가', labelEn: 'Assistant Composer', category: '작곡' },
  { value: 'adapter', label: '편작자', labelEn: 'Adapter', category: '작곡' },
  { value: 'author', label: '저자', labelEn: 'Author', category: '작곡' },
  { value: 'librettist', label: '대본작가', labelEn: 'Librettist', category: '작곡' },
  { value: 'translator', label: '번역가', labelEn: 'Translator', category: '작곡' },
  { value: 'playwright', label: '극작가', labelEn: 'Playwright', category: '작곡' },

  // Performance - Vocals
  { value: 'featured-artist', label: '피처링 아티스트', labelEn: 'Featured Artist', category: '보컬' },
  { value: 'featuring', label: '피처링', labelEn: 'Featuring', category: '보컬' },
  { value: 'vocalist', label: '보컬리스트', labelEn: 'Vocalist', category: '보컬' },
  { value: 'lead-vocalist', label: '리드 보컬', labelEn: 'Lead Vocalist', category: '보컬' },
  { value: 'background-vocalist', label: '백그라운드 보컬', labelEn: 'Background Vocalist', category: '보컬' },
  { value: 'guest-vocals', label: '게스트 보컬', labelEn: 'Guest Vocals', category: '보컬' },
  { value: 'choir', label: '합창단', labelEn: 'Choir', category: '보컬' },
  { value: 'chorus', label: '코러스', labelEn: 'Chorus', category: '보컬' },
  { value: 'mc', label: 'MC', labelEn: 'MC', category: '보컬' },
  { value: 'rap', label: '랩', labelEn: 'Rap', category: '보컬' },
  { value: 'narrator', label: '내레이터', labelEn: 'Narrator', category: '보컬' },
  { value: 'spoken-word', label: '스포큰 워드', labelEn: 'Spoken Word', category: '보컬' },
  { value: 'vocal-effects', label: '보컬 이펙트', labelEn: 'Vocal Effects', category: '보컬' },

  // Performance - Musicians
  { value: 'instrumentalist', label: '연주자', labelEn: 'Instrumentalist', category: '연주' },
  { value: 'band', label: '밴드', labelEn: 'Band', category: '연주' },
  { value: 'orchestra', label: '오케스트라', labelEn: 'Orchestra', category: '연주' },
  { value: 'ensemble', label: '앙상블', labelEn: 'Ensemble', category: '연주' },
  { value: 'soloist', label: '솔로이스트', labelEn: 'Soloist', category: '연주' },
  { value: 'performer', label: '연주자', labelEn: 'Performer', category: '연주' },
  { value: 'studio-musician', label: '스튜디오 뮤지션', labelEn: 'Studio Musician', category: '연주' },
  { value: 'contributing-artist', label: '참여 아티스트', labelEn: 'Contributing Artist', category: '연주' },
  { value: 'sampled-artist', label: '샘플링 아티스트', labelEn: 'Sampled Artist', category: '연주' },

  // Conducting
  { value: 'conductor', label: '지휘자', labelEn: 'Conductor', category: '지휘' },
  { value: 'assistant-conductor', label: '부지휘자', labelEn: 'Assistant Conductor', category: '지휘' },
  { value: 'choir-conductor', label: '합창 지휘자', labelEn: 'Choir Conductor', category: '지휘' },
  { value: 'chorus-master', label: '합창단장', labelEn: 'Chorus Master', category: '지휘' },
  { value: 'musical-director', label: '음악 감독', labelEn: 'Musical Director', category: '지휘' },
  { value: 'strings-conductor', label: '현악 지휘자', labelEn: 'Strings Conductor', category: '지휘' },
  { value: 'orchestrator', label: '오케스트레이터', labelEn: 'Orchestrator', category: '지휘' },

  // Technical
  { value: 'programmer', label: '프로그래머', labelEn: 'Programmer', category: '기술' },
  { value: 'sound-designer', label: '사운드 디자이너', labelEn: 'Sound Designer', category: '기술' },
  { value: 'remixer', label: '리믹서', labelEn: 'Remixer', category: '기술' },
  { value: 'mixer', label: '믹서', labelEn: 'Mixer', category: '기술' },
  { value: 'dj', label: 'DJ', labelEn: 'DJ', category: '기술' },
  { value: 'sound-editor', label: '사운드 에디터', labelEn: 'Sound Editor', category: '기술' },
  { value: 'sound-effects', label: '사운드 이펙트', labelEn: 'Sound Effects', category: '기술' },
  { value: 'special-effects', label: '특수 효과', labelEn: 'Special Effects', category: '기술' },
  { value: 'editor', label: '에디터', labelEn: 'Editor', category: '기술' },
  { value: 'liner-notes', label: '라이너 노트', labelEn: 'Liner Notes', category: '기술' },
  { value: 'production-assistant', label: '프로덕션 어시스턴트', labelEn: 'Production Assistant', category: '기술' },
  { value: 'studio-personnel', label: '스튜디오 스태프', labelEn: 'Studio Personnel', category: '기술' },
  { value: 'tape', label: '테이프', labelEn: 'Tape', category: '기술' },

  // Visual & Video
  { value: 'art-director', label: '아트 디렉터', labelEn: 'Art Director', category: '비주얼' },
  { value: 'art-direction', label: '아트 디렉션', labelEn: 'Art Direction', category: '비주얼' },
  { value: 'creative-director', label: '크리에이티브 디렉터', labelEn: 'Creative Director', category: '비주얼' },
  { value: 'director', label: '디렉터', labelEn: 'Director', category: '비주얼' },
  { value: 'assistant-director', label: '조감독', labelEn: 'Assistant Director', category: '비주얼' },
  { value: 'video-director', label: '비디오 디렉터', labelEn: 'Video Director', category: '비주얼' },
  { value: 'video-producer', label: '비디오 프로듀서', labelEn: 'Video Producer', category: '비주얼' },
  { value: 'lighting-director', label: '조명 감독', labelEn: 'Lighting Director', category: '비주얼' },
  { value: 'photographer', label: '포토그래퍼', labelEn: 'Photographer', category: '비주얼' },
  { value: 'graphic-designer', label: '그래픽 디자이너', labelEn: 'Graphic Designer', category: '비주얼' },
  { value: 'cinematographer', label: '촬영감독', labelEn: 'Cinematographer', category: '비주얼' },
  { value: 'camera-operator', label: '카메라 오퍼레이터', labelEn: 'Camera Operator', category: '비주얼' },
  { value: 'gaffer', label: '조명팀장', labelEn: 'Gaffer', category: '비주얼' },
  { value: 'key-grip', label: '키 그립', labelEn: 'Key Grip', category: '비주얼' },
  { value: 'computer-graphic-creator', label: '컴퓨터 그래픽 크리에이터', labelEn: 'Computer Graphic Creator', category: '비주얼' },
  { value: 'visual-effects-technician', label: '시각효과 기술자', labelEn: 'Visual Effects Technician', category: '비주얼' },
  { value: 'set-designer', label: '세트 디자이너', labelEn: 'Set Designer', category: '비주얼' },
  { value: 'costume-designer', label: '의상 디자이너', labelEn: 'Costume Designer', category: '비주얼' },

  // Dance & Performance
  { value: 'choreographer', label: '안무가', labelEn: 'Choreographer', category: '퍼포먼스' },
  { value: 'dancer', label: '댄서', labelEn: 'Dancer', category: '퍼포먼스' },
  { value: 'actor', label: '배우', labelEn: 'Actor', category: '퍼포먼스' },

  // Business
  { value: 'a&r', label: 'A&R', labelEn: 'A&R', category: '비즈니스' },
  { value: 'manager', label: '매니저', labelEn: 'Manager', category: '비즈니스' },
  { value: 'publisher', label: '퍼블리셔', labelEn: 'Publisher', category: '비즈니스' },
  { value: 'label-executive', label: '레이블 담당자', labelEn: 'Label Executive', category: '비즈니스' }
];

export function getRolesByCategory(category: string): ContributorRole[] {
  return contributorRoles.filter(role => role.category === category);
}

export function searchRoles(query: string): ContributorRole[] {
  const lowercaseQuery = query.toLowerCase();
  return contributorRoles.filter(role =>
    role.label.toLowerCase().includes(lowercaseQuery) ||
    role.labelEn.toLowerCase().includes(lowercaseQuery) ||
    role.value.toLowerCase().includes(lowercaseQuery)
  );
}

export function getRoleLabel(value: string, language: 'ko' | 'en' = 'ko'): string {
  const role = contributorRoles.find(r => r.value === value);
  return role ? (language === 'ko' ? role.label : role.labelEn) : value;
}
