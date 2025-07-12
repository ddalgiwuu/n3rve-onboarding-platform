export interface Instrument {
  value: string
  label: string
  labelEn: string
  category: string
}

export const instrumentList: Instrument[] = [
  // String Instruments
  { value: 'acoustic-guitar', label: '어쿠스틱 기타', labelEn: 'Acoustic Guitar', category: '현악기' },
  { value: 'electric-guitar', label: '일렉트릭 기타', labelEn: 'Electric Guitar', category: '현악기' },
  { value: 'bass-guitar', label: '베이스 기타', labelEn: 'Bass Guitar', category: '현악기' },
  { value: 'classical-guitar', label: '클래식 기타', labelEn: 'Classical Guitar', category: '현악기' },
  { value: 'ukulele', label: '우쿨렐레', labelEn: 'Ukulele', category: '현악기' },
  { value: 'banjo', label: '밴조', labelEn: 'Banjo', category: '현악기' },
  { value: 'mandolin', label: '만돌린', labelEn: 'Mandolin', category: '현악기' },
  { value: 'harp', label: '하프', labelEn: 'Harp', category: '현악기' },
  { value: 'violin', label: '바이올린', labelEn: 'Violin', category: '현악기' },
  { value: 'viola', label: '비올라', labelEn: 'Viola', category: '현악기' },
  { value: 'cello', label: '첼로', labelEn: 'Cello', category: '현악기' },
  { value: 'double-bass', label: '더블 베이스', labelEn: 'Double Bass', category: '현악기' },
  { value: 'gayageum', label: '가야금', labelEn: 'Gayageum', category: '현악기' },
  { value: 'geomungo', label: '거문고', labelEn: 'Geomungo', category: '현악기' },
  { value: 'haegeum', label: '해금', labelEn: 'Haegeum', category: '현악기' },
  
  // Keyboard Instruments
  { value: 'piano', label: '피아노', labelEn: 'Piano', category: '건반악기' },
  { value: 'grand-piano', label: '그랜드 피아노', labelEn: 'Grand Piano', category: '건반악기' },
  { value: 'upright-piano', label: '업라이트 피아노', labelEn: 'Upright Piano', category: '건반악기' },
  { value: 'electric-piano', label: '일렉트릭 피아노', labelEn: 'Electric Piano', category: '건반악기' },
  { value: 'keyboard', label: '키보드', labelEn: 'Keyboard', category: '건반악기' },
  { value: 'synthesizer', label: '신시사이저', labelEn: 'Synthesizer', category: '건반악기' },
  { value: 'organ', label: '오르간', labelEn: 'Organ', category: '건반악기' },
  { value: 'accordion', label: '아코디언', labelEn: 'Accordion', category: '건반악기' },
  { value: 'harpsichord', label: '하프시코드', labelEn: 'Harpsichord', category: '건반악기' },
  
  // Wind Instruments
  { value: 'flute', label: '플루트', labelEn: 'Flute', category: '관악기' },
  { value: 'piccolo', label: '피콜로', labelEn: 'Piccolo', category: '관악기' },
  { value: 'oboe', label: '오보에', labelEn: 'Oboe', category: '관악기' },
  { value: 'clarinet', label: '클라리넷', labelEn: 'Clarinet', category: '관악기' },
  { value: 'saxophone', label: '색소폰', labelEn: 'Saxophone', category: '관악기' },
  { value: 'trumpet', label: '트럼펫', labelEn: 'Trumpet', category: '관악기' },
  { value: 'trombone', label: '트롬본', labelEn: 'Trombone', category: '관악기' },
  { value: 'french-horn', label: '프렌치 호른', labelEn: 'French Horn', category: '관악기' },
  { value: 'tuba', label: '튜바', labelEn: 'Tuba', category: '관악기' },
  { value: 'harmonica', label: '하모니카', labelEn: 'Harmonica', category: '관악기' },
  { value: 'daegeum', label: '대금', labelEn: 'Daegeum', category: '관악기' },
  { value: 'piri', label: '피리', labelEn: 'Piri', category: '관악기' },
  { value: 'taepyeongso', label: '태평소', labelEn: 'Taepyeongso', category: '관악기' },
  
  // Percussion
  { value: 'drums', label: '드럼', labelEn: 'Drums', category: '타악기' },
  { value: 'drum-set', label: '드럼 세트', labelEn: 'Drum Set', category: '타악기' },
  { value: 'snare-drum', label: '스네어 드럼', labelEn: 'Snare Drum', category: '타악기' },
  { value: 'bass-drum', label: '베이스 드럼', labelEn: 'Bass Drum', category: '타악기' },
  { value: 'cymbals', label: '심벌즈', labelEn: 'Cymbals', category: '타악기' },
  { value: 'hi-hat', label: '하이햇', labelEn: 'Hi-Hat', category: '타악기' },
  { value: 'tambourine', label: '탬버린', labelEn: 'Tambourine', category: '타악기' },
  { value: 'maracas', label: '마라카스', labelEn: 'Maracas', category: '타악기' },
  { value: 'bongos', label: '봉고', labelEn: 'Bongos', category: '타악기' },
  { value: 'congas', label: '콩가', labelEn: 'Congas', category: '타악기' },
  { value: 'timpani', label: '팀파니', labelEn: 'Timpani', category: '타악기' },
  { value: 'xylophone', label: '실로폰', labelEn: 'Xylophone', category: '타악기' },
  { value: 'marimba', label: '마림바', labelEn: 'Marimba', category: '타악기' },
  { value: 'vibraphone', label: '비브라폰', labelEn: 'Vibraphone', category: '타악기' },
  { value: 'triangle', label: '트라이앵글', labelEn: 'Triangle', category: '타악기' },
  { value: 'janggu', label: '장구', labelEn: 'Janggu', category: '타악기' },
  { value: 'buk', label: '북', labelEn: 'Buk', category: '타악기' },
  { value: 'kkwaenggwari', label: '꽹과리', labelEn: 'Kkwaenggwari', category: '타악기' },
  { value: 'jing', label: '징', labelEn: 'Jing', category: '타악기' },
  
  // Electronic
  { value: 'drum-machine', label: '드럼 머신', labelEn: 'Drum Machine', category: '전자악기' },
  { value: 'sampler', label: '샘플러', labelEn: 'Sampler', category: '전자악기' },
  { value: 'sequencer', label: '시퀀서', labelEn: 'Sequencer', category: '전자악기' },
  { value: 'midi-controller', label: 'MIDI 컨트롤러', labelEn: 'MIDI Controller', category: '전자악기' },
  { value: 'turntable', label: '턴테이블', labelEn: 'Turntable', category: '전자악기' },
  { value: 'launchpad', label: '런치패드', labelEn: 'Launchpad', category: '전자악기' },
  
  // Voice
  { value: 'vocals', label: '보컬', labelEn: 'Vocals', category: '보컬' },
  { value: 'lead-vocals', label: '리드 보컬', labelEn: 'Lead Vocals', category: '보컬' },
  { value: 'backing-vocals', label: '백킹 보컬', labelEn: 'Backing Vocals', category: '보컬' },
  { value: 'rap', label: '랩', labelEn: 'Rap', category: '보컬' },
  { value: 'beatbox', label: '비트박스', labelEn: 'Beatbox', category: '보컬' }
]

export function getInstrumentsByCategory(category: string): Instrument[] {
  return instrumentList.filter(instrument => instrument.category === category)
}

export function searchInstruments(query: string): Instrument[] {
  const lowercaseQuery = query.toLowerCase()
  return instrumentList.filter(instrument => 
    instrument.label.toLowerCase().includes(lowercaseQuery) ||
    instrument.labelEn.toLowerCase().includes(lowercaseQuery) ||
    instrument.value.toLowerCase().includes(lowercaseQuery)
  )
}

export function getInstrumentLabel(value: string, language: 'ko' | 'en' = 'ko'): string {
  const instrument = instrumentList.find(i => i.value === value)
  return instrument ? (language === 'ko' ? instrument.label : instrument.labelEn) : value
}

export function getInstrumentCategory(value: string): string {
  const instrument = instrumentList.find(i => i.value === value)
  return instrument?.category || ''
}