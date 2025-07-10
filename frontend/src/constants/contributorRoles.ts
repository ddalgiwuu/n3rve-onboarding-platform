// Comprehensive contributor roles based on FUGA/music industry standards
// 60+ roles as requested

export interface ContributorRole {
  value: string
  label: string // Korean
  labelEn: string // English
  category: 'production' | 'engineering' | 'performance' | 'vocal' | 'direction' | 'composition' | 'technical' | 'video' | 'creative' | 'management'
}

export const contributorRoles: ContributorRole[] = [
  // Production Roles (9)
  { value: 'composer', label: '작곡가', labelEn: 'Composer', category: 'production' },
  { value: 'lyricist', label: '작사가', labelEn: 'Lyricist', category: 'production' },
  { value: 'arranger', label: '편곡자', labelEn: 'Arranger', category: 'production' },
  { value: 'producer', label: '프로듀서', labelEn: 'Producer', category: 'production' },
  { value: 'co_producer', label: '공동 프로듀서', labelEn: 'Co-Producer', category: 'production' },
  { value: 'executive_producer', label: '총괄 프로듀서', labelEn: 'Executive Producer', category: 'production' },
  { value: 'assistant_producer', label: '어시스턴트 프로듀서', labelEn: 'Assistant Producer', category: 'production' },
  { value: 'post_producer', label: '포스트 프로듀서', labelEn: 'Post-Producer', category: 'production' },
  { value: 'vocal_producer', label: '보컬 프로듀서', labelEn: 'Vocal Producer', category: 'production' },
  
  // Engineering Roles (14)
  { value: 'recording_engineer', label: '레코딩 엔지니어', labelEn: 'Recording Engineer', category: 'engineering' },
  { value: 'mixing_engineer', label: '믹싱 엔지니어', labelEn: 'Mixing Engineer', category: 'engineering' },
  { value: 'mastering_engineer', label: '마스터링 엔지니어', labelEn: 'Mastering Engineer', category: 'engineering' },
  { value: 'sound_engineer', label: '사운드 엔지니어', labelEn: 'Sound Engineer', category: 'engineering' },
  { value: 'engineer', label: '엔지니어', labelEn: 'Engineer', category: 'engineering' },
  { value: 'assistant_recording_engineer', label: '어시스턴트 레코딩 엔지니어', labelEn: 'Assistant Recording Engineer', category: 'engineering' },
  { value: 'assistant_mixing_engineer', label: '어시스턴트 믹싱 엔지니어', labelEn: 'Assistant Mixing Engineer', category: 'engineering' },
  { value: 'assistant_mastering_engineer', label: '어시스턴트 마스터링 엔지니어', labelEn: 'Assistant Mastering Engineer', category: 'engineering' },
  { value: 'assistant_sound_engineer', label: '어시스턴트 사운드 엔지니어', labelEn: 'Assistant Sound Engineer', category: 'engineering' },
  { value: 'vocal_engineer', label: '보컬 엔지니어', labelEn: 'Vocal Engineer', category: 'engineering' },
  { value: 'immersive_audio_engineer', label: '입체음향 엔지니어', labelEn: 'Immersive Audio Engineer', category: 'engineering' },
  { value: 'immersive_mixing_engineer', label: '입체음향 믹싱 엔지니어', labelEn: 'Immersive Mixing Engineer', category: 'engineering' },
  { value: 'immersive_mastering_engineer', label: '입체음향 마스터링 엔지니어', labelEn: 'Immersive Mastering Engineer', category: 'engineering' },
  { value: 'tonmeister', label: '톤마이스터', labelEn: 'Tonmeister', category: 'engineering' },
  
  // Performance Roles (12)
  { value: 'performer', label: '연주자', labelEn: 'Performer', category: 'performance' },
  { value: 'studio_musician', label: '스튜디오 뮤지션', labelEn: 'Studio Musician', category: 'performance' },
  { value: 'soloist', label: '솔로이스트', labelEn: 'Soloist', category: 'performance' },
  { value: 'conductor', label: '지휘자', labelEn: 'Conductor', category: 'performance' },
  { value: 'orchestra', label: '오케스트라', labelEn: 'Orchestra', category: 'performance' },
  { value: 'choir', label: '합창단', labelEn: 'Choir', category: 'performance' },
  { value: 'chorus', label: '코러스', labelEn: 'Chorus', category: 'performance' },
  { value: 'ensemble', label: '앙상블', labelEn: 'Ensemble', category: 'performance' },
  { value: 'band', label: '밴드', labelEn: 'Band', category: 'performance' },
  { value: 'featuring', label: '피처링', labelEn: 'Featuring', category: 'performance' },
  { value: 'guest_vocals', label: '객원 보컬', labelEn: 'Guest Vocals', category: 'performance' },
  { value: 'contributing_artist', label: '참여 아티스트', labelEn: 'Contributing Artist', category: 'performance' },
  
  // Vocal/Rap Roles (5)
  { value: 'rap', label: '랩', labelEn: 'Rap', category: 'vocal' },
  { value: 'mc', label: 'MC', labelEn: 'MC', category: 'vocal' },
  { value: 'narrator', label: '내레이터', labelEn: 'Narrator', category: 'vocal' },
  { value: 'spoken_word', label: '스포큰 워드', labelEn: 'Spoken Word', category: 'vocal' },
  { value: 'vocal_effects', label: '보컬 이펙트', labelEn: 'Vocal Effects', category: 'vocal' },
  
  // Direction Roles (9)
  { value: 'director', label: '디렉터', labelEn: 'Director', category: 'direction' },
  { value: 'assistant_director', label: '어시스턴트 디렉터', labelEn: 'Assistant Director', category: 'direction' },
  { value: 'musical_director', label: '음악 감독', labelEn: 'Musical Director', category: 'direction' },
  { value: 'creative_director', label: '크리에이티브 디렉터', labelEn: 'Creative Director', category: 'direction' },
  { value: 'art_direction', label: '아트 디렉션', labelEn: 'Art Direction', category: 'direction' },
  { value: 'choir_conductor', label: '합창단 지휘자', labelEn: 'Choir Conductor', category: 'direction' },
  { value: 'chorus_master', label: '합창 지휘자', labelEn: 'Chorus Master', category: 'direction' },
  { value: 'strings_conductor', label: '현악 지휘자', labelEn: 'Strings Conductor', category: 'direction' },
  { value: 'assistant_conductor', label: '어시스턴트 지휘자', labelEn: 'Assistant Conductor', category: 'direction' },
  
  // Composition/Arrangement Roles (9)
  { value: 'assistant_composer', label: '어시스턴트 작곡가', labelEn: 'Assistant Composer', category: 'composition' },
  { value: 'orchestrator', label: '오케스트레이터', labelEn: 'Orchestrator', category: 'composition' },
  { value: 'adapter', label: '편곡자', labelEn: 'Adapter', category: 'composition' },
  { value: 'writer', label: '작가', labelEn: 'Writer', category: 'composition' },
  { value: 'author', label: '저자', labelEn: 'Author', category: 'composition' },
  { value: 'playwright', label: '극작가', labelEn: 'Playwright', category: 'composition' },
  { value: 'librettist', label: '대본 작가', labelEn: 'Librettist', category: 'composition' },
  { value: 'translator', label: '번역가', labelEn: 'Translator', category: 'composition' },
  { value: 'liner_notes', label: '라이너 노트', labelEn: 'Liner Notes', category: 'composition' },
  
  // Technical Roles (12)
  { value: 'programmer', label: '프로그래머', labelEn: 'Programmer', category: 'technical' },
  { value: 'dj', label: 'DJ', labelEn: 'DJ', category: 'technical' },
  { value: 'remixer', label: '리믹서', labelEn: 'Remixer', category: 'technical' },
  { value: 'sampled_artist', label: '샘플링 아티스트', labelEn: 'Sampled Artist', category: 'technical' },
  { value: 'mixer', label: '믹서', labelEn: 'Mixer', category: 'technical' },
  { value: 'editor', label: '에디터', labelEn: 'Editor', category: 'technical' },
  { value: 'sound_editor', label: '사운드 에디터', labelEn: 'Sound Editor', category: 'technical' },
  { value: 'sound_effects', label: '음향 효과', labelEn: 'Sound Effects', category: 'technical' },
  { value: 'special_effects', label: '특수 효과', labelEn: 'Special Effects', category: 'technical' },
  { value: 'computer_graphic_creator', label: '컴퓨터 그래픽 크리에이터', labelEn: 'Computer Graphic Creator', category: 'technical' },
  { value: 'visual_effects_technician', label: '시각 효과 기술자', labelEn: 'Visual Effects Technician', category: 'technical' },
  { value: 'tape', label: '테이프', labelEn: 'Tape', category: 'technical' },
  
  // Video/Film Roles (7)
  { value: 'video_director', label: '비디오 디렉터', labelEn: 'Video Director', category: 'video' },
  { value: 'video_producer', label: '비디오 프로듀서', labelEn: 'Video Producer', category: 'video' },
  { value: 'cinematographer', label: '촬영 감독', labelEn: 'Cinematographer', category: 'video' },
  { value: 'camera_operator', label: '카메라 오퍼레이터', labelEn: 'Camera Operator', category: 'video' },
  { value: 'lighting_director', label: '조명 감독', labelEn: 'Lighting Director', category: 'video' },
  { value: 'gaffer', label: '조명 기사', labelEn: 'Gaffer', category: 'video' },
  { value: 'key_grip', label: '키 그립', labelEn: 'Key Grip', category: 'video' },
  
  // Other Creative Roles (5)
  { value: 'choreographer', label: '안무가', labelEn: 'Choreographer', category: 'creative' },
  { value: 'dancer', label: '댄서', labelEn: 'Dancer', category: 'creative' },
  { value: 'actor', label: '배우', labelEn: 'Actor', category: 'creative' },
  { value: 'costume_designer', label: '의상 디자이너', labelEn: 'Costume Designer', category: 'creative' },
  { value: 'set_designer', label: '세트 디자이너', labelEn: 'Set Designer', category: 'creative' },
  
  // Management/Admin Roles (6)
  { value: 'a&r_administrator', label: 'A&R 관리자', labelEn: 'A&R Administrator', category: 'management' },
  { value: 'a&r_manager', label: 'A&R 매니저', labelEn: 'A&R Manager', category: 'management' },
  { value: 'artist_management', label: '아티스트 매니지먼트', labelEn: 'Artist Management', category: 'management' },
  { value: 'agent', label: '에이전트', labelEn: 'Agent', category: 'management' },
  { value: 'production_assistant', label: '프로덕션 어시스턴트', labelEn: 'Production Assistant', category: 'management' },
  { value: 'studio_personnel', label: '스튜디오 스태프', labelEn: 'Studio Personnel', category: 'management' }
]

// Total: 75 roles

// Get roles by category
export function getRolesByCategory(category: string): ContributorRole[] {
  return contributorRoles.filter(role => role.category === category)
}

// Search roles
export function searchRoles(query: string, language: 'ko' | 'en' = 'ko'): ContributorRole[] {
  const lowerQuery = query.toLowerCase()
  return contributorRoles.filter(role => {
    const searchField = language === 'ko' ? role.label : role.labelEn
    return searchField.toLowerCase().includes(lowerQuery)
  })
}

// Get role by value
export function getRoleByValue(value: string): ContributorRole | undefined {
  return contributorRoles.find(role => role.value === value)
}

// Role categories for grouping in UI
export const roleCategories = {
  production: { label: '프로덕션', labelEn: 'Production' },
  engineering: { label: '엔지니어링', labelEn: 'Engineering' },
  performance: { label: '공연/연주', labelEn: 'Performance' },
  vocal: { label: '보컬/랩', labelEn: 'Vocal/Rap' },
  direction: { label: '디렉션', labelEn: 'Direction' },
  composition: { label: '작곡/편곡', labelEn: 'Composition' },
  technical: { label: '기술', labelEn: 'Technical' },
  video: { label: '비디오/영상', labelEn: 'Video/Film' },
  creative: { label: '크리에이티브', labelEn: 'Creative' },
  management: { label: '매니지먼트', labelEn: 'Management' }
}