// Common timezones for music release
export const timezones = [
  { value: 'UTC', label: 'UTC (협정 세계시)', offset: 0 },
  { value: 'Asia/Seoul', label: '서울 (KST)', offset: 9 },
  { value: 'Asia/Tokyo', label: '도쿄 (JST)', offset: 9 },
  { value: 'Asia/Shanghai', label: '상하이/베이징 (CST)', offset: 8 },
  { value: 'Asia/Singapore', label: '싱가포르 (SGT)', offset: 8 },
  { value: 'Asia/Bangkok', label: '방콕 (ICT)', offset: 7 },
  { value: 'Asia/Mumbai', label: '뭄바이 (IST)', offset: 5.5 },
  { value: 'Europe/London', label: '런던 (GMT/BST)', offset: 0 }, // Changes with DST
  { value: 'Europe/Paris', label: '파리 (CET/CEST)', offset: 1 }, // Changes with DST
  { value: 'Europe/Berlin', label: '베를린 (CET/CEST)', offset: 1 }, // Changes with DST
  { value: 'Europe/Moscow', label: '모스크바 (MSK)', offset: 3 },
  { value: 'America/New_York', label: '뉴욕 (EST/EDT)', offset: -5 }, // Changes with DST
  { value: 'America/Chicago', label: '시카고 (CST/CDT)', offset: -6 }, // Changes with DST
  { value: 'America/Denver', label: '덴버 (MST/MDT)', offset: -7 }, // Changes with DST
  { value: 'America/Los_Angeles', label: '로스앤젤레스 (PST/PDT)', offset: -8 }, // Changes with DST
  { value: 'America/Sao_Paulo', label: '상파울루 (BRT)', offset: -3 },
  { value: 'Australia/Sydney', label: '시드니 (AEDT/AEST)', offset: 11 }, // Changes with DST
  { value: 'Pacific/Auckland', label: '오클랜드 (NZDT/NZST)', offset: 13 }, // Changes with DST
]

// Convert local time to UTC
export function convertToUTC(localDate: string, localTime: string, timezone: string): Date {
  const dateTimeString = `${localDate}T${localTime}:00`
  const date = new Date(dateTimeString)
  
  // Get timezone offset
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    timeZoneName: 'short'
  })
  
  const parts = formatter.formatToParts(date)
  const timeZoneName = parts.find(part => part.type === 'timeZoneName')?.value || ''
  
  // Create date in the specified timezone and convert to UTC
  const localDateTime = new Date(date.toLocaleString('en-US', { timeZone: timezone }))
  const utcDateTime = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }))
  
  const offsetMs = localDateTime.getTime() - utcDateTime.getTime()
  const utcDate = new Date(date.getTime() - offsetMs)
  
  return utcDate
}

// Format UTC time for display in different timezones
export function formatUTCInTimezone(utcDate: Date, timezone: string): string {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }
  
  return new Intl.DateTimeFormat('ko-KR', options).format(utcDate)
}

// Get current timezone
export function getCurrentTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return 'UTC'
  }
}

// Release time help text
export const releaseTimeHelp = {
  consumerRelease: {
    title: '일반 발매일 (Consumer Release Date)',
    description: '음원이 스트리밍 플랫폼에 공개되는 날짜와 시간입니다.',
    tips: [
      '금요일 0시 발매가 차트 집계에 유리합니다',
      '선택한 시간대 기준으로 입력하세요',
      '최소 2주 전에 설정하는 것을 권장합니다'
    ]
  },
  originalRelease: {
    title: '원곡 발매일 (Original Release Date)',
    description: '리믹스, 리마스터, 재발매의 경우 원곡이 처음 발매된 날짜입니다.',
    tips: [
      '신규 발매는 일반 발매일과 동일하게 자동 설정됩니다',
      '리믹스나 커버곡의 경우 원곡 발매일을 정확히 입력하세요',
      '원곡 발매일은 저작권 관리에 중요합니다'
    ]
  },
  timezone: {
    title: '시간대 설정',
    description: '발매 시간을 입력할 시간대를 선택하세요.',
    tips: [
      '현재 위치의 시간대가 자동으로 선택됩니다',
      'UTC 기준 시간도 함께 표시됩니다',
      '글로벌 발매는 각 지역 시간을 고려하세요'
    ]
  }
}