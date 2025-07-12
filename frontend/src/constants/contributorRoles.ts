export interface ContributorRole {
  value: string
  label: string
  labelEn: string
  category: string
}

export const contributorRoles: ContributorRole[] = [
  // Production
  { value: 'producer', label: '프로듀서', labelEn: 'Producer', category: '프로덕션' },
  { value: 'executive-producer', label: '총괄 프로듀서', labelEn: 'Executive Producer', category: '프로덕션' },
  { value: 'co-producer', label: '공동 프로듀서', labelEn: 'Co-Producer', category: '프로덕션' },
  { value: 'mixing-engineer', label: '믹싱 엔지니어', labelEn: 'Mixing Engineer', category: '프로덕션' },
  { value: 'mastering-engineer', label: '마스터링 엔지니어', labelEn: 'Mastering Engineer', category: '프로덕션' },
  { value: 'recording-engineer', label: '레코딩 엔지니어', labelEn: 'Recording Engineer', category: '프로덕션' },
  { value: 'assistant-engineer', label: '어시스턴트 엔지니어', labelEn: 'Assistant Engineer', category: '프로덕션' },
  
  // Composition
  { value: 'composer', label: '작곡가', labelEn: 'Composer', category: '작곡' },
  { value: 'lyricist', label: '작사가', labelEn: 'Lyricist', category: '작곡' },
  { value: 'arranger', label: '편곡자', labelEn: 'Arranger', category: '작곡' },
  { value: 'songwriter', label: '송라이터', labelEn: 'Songwriter', category: '작곡' },
  { value: 'co-writer', label: '공동 작곡가', labelEn: 'Co-Writer', category: '작곡' },
  
  // Performance
  { value: 'vocalist', label: '보컬리스트', labelEn: 'Vocalist', category: '연주' },
  { value: 'lead-vocalist', label: '리드 보컬', labelEn: 'Lead Vocalist', category: '연주' },
  { value: 'background-vocalist', label: '백그라운드 보컬', labelEn: 'Background Vocalist', category: '연주' },
  { value: 'choir', label: '합창단', labelEn: 'Choir', category: '연주' },
  { value: 'instrumentalist', label: '연주자', labelEn: 'Instrumentalist', category: '연주' },
  { value: 'featured-artist', label: '피처링 아티스트', labelEn: 'Featured Artist', category: '연주' },
  
  // Technical
  { value: 'programmer', label: '프로그래머', labelEn: 'Programmer', category: '기술' },
  { value: 'sound-designer', label: '사운드 디자이너', labelEn: 'Sound Designer', category: '기술' },
  { value: 'vocal-engineer', label: '보컬 엔지니어', labelEn: 'Vocal Engineer', category: '기술' },
  { value: 'vocal-producer', label: '보컬 프로듀서', labelEn: 'Vocal Producer', category: '기술' },
  
  // Visual
  { value: 'art-director', label: '아트 디렉터', labelEn: 'Art Director', category: '비주얼' },
  { value: 'photographer', label: '포토그래퍼', labelEn: 'Photographer', category: '비주얼' },
  { value: 'graphic-designer', label: '그래픽 디자이너', labelEn: 'Graphic Designer', category: '비주얼' },
  { value: 'video-director', label: '비디오 디렉터', labelEn: 'Video Director', category: '비주얼' },
  
  // Business
  { value: 'a&r', label: 'A&R', labelEn: 'A&R', category: '비즈니스' },
  { value: 'manager', label: '매니저', labelEn: 'Manager', category: '비즈니스' },
  { value: 'publisher', label: '퍼블리셔', labelEn: 'Publisher', category: '비즈니스' },
  { value: 'label-executive', label: '레이블 담당자', labelEn: 'Label Executive', category: '비즈니스' }
]

export function getRolesByCategory(category: string): ContributorRole[] {
  return contributorRoles.filter(role => role.category === category)
}

export function searchRoles(query: string): ContributorRole[] {
  const lowercaseQuery = query.toLowerCase()
  return contributorRoles.filter(role => 
    role.label.toLowerCase().includes(lowercaseQuery) ||
    role.labelEn.toLowerCase().includes(lowercaseQuery) ||
    role.value.toLowerCase().includes(lowercaseQuery)
  )
}

export function getRoleLabel(value: string, language: 'ko' | 'en' = 'ko'): string {
  const role = contributorRoles.find(r => r.value === value)
  return role ? (language === 'ko' ? role.label : role.labelEn) : value
}