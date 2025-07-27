// Common timezones for music release with bilingual labels
export const timezones = [
  { value: 'UTC', label: 'UTC', offset: '+00:00' },
  { value: 'Asia/Seoul', label: '서울 (KST)', offset: '+09:00' },
  { value: 'Asia/Tokyo', label: '도쿄 (JST)', offset: '+09:00' },
  { value: 'Asia/Shanghai', label: '상하이/베이징 (CST)', offset: '+08:00' },
  { value: 'Asia/Hong_Kong', label: '홍콩 (HKT)', offset: '+08:00' },
  { value: 'Asia/Singapore', label: '싱가포르 (SGT)', offset: '+08:00' },
  { value: 'Asia/Bangkok', label: '방콕 (ICT)', offset: '+07:00' },
  { value: 'Asia/Jakarta', label: '자카르타 (WIB)', offset: '+07:00' },
  { value: 'Asia/Mumbai', label: '뭄바이 (IST)', offset: '+05:30' },
  { value: 'Asia/Dubai', label: '두바이 (GST)', offset: '+04:00' },
  { value: 'Europe/London', label: '런던 (GMT/BST)', offset: '+00:00' },
  { value: 'Europe/Paris', label: '파리 (CET/CEST)', offset: '+01:00' },
  { value: 'Europe/Berlin', label: '베를린 (CET/CEST)', offset: '+01:00' },
  { value: 'Europe/Madrid', label: '마드리드 (CET/CEST)', offset: '+01:00' },
  { value: 'Europe/Rome', label: '로마 (CET/CEST)', offset: '+01:00' },
  { value: 'Europe/Moscow', label: '모스크바 (MSK)', offset: '+03:00' },
  { value: 'America/New_York', label: '뉴욕 (EST/EDT)', offset: '-05:00' },
  { value: 'America/Chicago', label: '시카고 (CST/CDT)', offset: '-06:00' },
  { value: 'America/Denver', label: '덴버 (MST/MDT)', offset: '-07:00' },
  { value: 'America/Los_Angeles', label: '로스앤젤레스 (PST/PDT)', offset: '-08:00' },
  { value: 'America/Toronto', label: '토론토 (EST/EDT)', offset: '-05:00' },
  { value: 'America/Vancouver', label: '밴쿠버 (PST/PDT)', offset: '-08:00' },
  { value: 'America/Mexico_City', label: '멕시코시티 (CST)', offset: '-06:00' },
  { value: 'America/Sao_Paulo', label: '상파울루 (BRT)', offset: '-03:00' },
  { value: 'America/Buenos_Aires', label: '부에노스아이레스 (ART)', offset: '-03:00' },
  { value: 'Australia/Sydney', label: '시드니 (AEDT/AEST)', offset: '+11:00' },
  { value: 'Australia/Melbourne', label: '멜버른 (AEDT/AEST)', offset: '+11:00' },
  { value: 'Australia/Perth', label: '퍼스 (AWST)', offset: '+08:00' },
  { value: 'Pacific/Auckland', label: '오클랜드 (NZDT/NZST)', offset: '+13:00' },
  { value: 'Pacific/Honolulu', label: '호놀룰루 (HST)', offset: '-10:00' }
];

// Convert local time to UTC
export function convertToUTC(localDate: string, localTime: string, timezone: string): Date {
  // Parse the input date and time
  const [year, month, day] = localDate.split('-').map(Number);
  const [hour, minute] = localTime.split(':').map(Number);

  // Create date in UTC first (this will interpret the input as UTC)
  const utcDate = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));

  // Format this UTC date in the target timezone to see what local time it represents
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  // Format the date and parse the result
  const formatted = formatter.format(utcDate);
  const match = formatted.match(/(\d{2})\/(\d{2})\/(\d{4}),?\s*(\d{2}):(\d{2})/);

  if (!match) {
    throw new Error('Failed to parse formatted date');
  }

  const [, formattedMonth, formattedDay, formattedYear, formattedHour, formattedMinute] = match;

  // Calculate the difference between what we wanted and what we got
  const wantedTime = new Date(year, month - 1, day, hour, minute, 0).getTime();
  const gotTime = new Date(
    parseInt(formattedYear),
    parseInt(formattedMonth) - 1,
    parseInt(formattedDay),
    parseInt(formattedHour),
    parseInt(formattedMinute),
    0
  ).getTime();

  const offset = gotTime - wantedTime;

  // Adjust the UTC date by the offset
  return new Date(utcDate.getTime() - offset);
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
  };

  return new Intl.DateTimeFormat('ko-KR', options).format(utcDate);
}

// Get current timezone
export function getCurrentTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
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
};
