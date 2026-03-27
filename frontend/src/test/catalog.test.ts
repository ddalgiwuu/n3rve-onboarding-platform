import { describe, it, expect } from 'vitest';

// ─── Unit: URL Conversion ───────────────────────────────

function toRawUrl(url: string) {
  if (!url) return url;
  if (url.includes('dropbox.com') && !url.includes('raw=1')) {
    return url.includes('dl=0')
      ? url.replace('dl=0', 'raw=1')
      : url + (url.includes('?') ? '&' : '?') + 'raw=1';
  }
  return url;
}

describe('toRawUrl', () => {
  it('converts dl=0 to raw=1', () => {
    const url = 'https://www.dropbox.com/scl/fi/abc/cover.png?rlkey=xyz&dl=0';
    expect(toRawUrl(url)).toBe('https://www.dropbox.com/scl/fi/abc/cover.png?rlkey=xyz&raw=1');
  });

  it('appends raw=1 if no dl param', () => {
    const url = 'https://www.dropbox.com/scl/fi/abc/cover.png?rlkey=xyz';
    expect(toRawUrl(url)).toBe('https://www.dropbox.com/scl/fi/abc/cover.png?rlkey=xyz&raw=1');
  });

  it('does not modify if already has raw=1', () => {
    const url = 'https://www.dropbox.com/scl/fi/abc/cover.png?rlkey=xyz&raw=1';
    expect(toRawUrl(url)).toBe(url);
  });

  it('does not modify non-dropbox URLs', () => {
    const url = 'https://example.com/image.png';
    expect(toRawUrl(url)).toBe(url);
  });

  it('handles empty string', () => {
    expect(toRawUrl('')).toBe('');
  });
});

// ─── Unit: Format Duration ──────────────────────────────

function formatDuration(seconds?: number): string {
  if (!seconds) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

describe('formatDuration', () => {
  it('formats 0 seconds', () => {
    expect(formatDuration(0)).toBe('0:00');
  });

  it('formats 60 seconds as 1:00', () => {
    expect(formatDuration(60)).toBe('1:00');
  });

  it('formats 125 seconds as 2:05', () => {
    expect(formatDuration(125)).toBe('2:05');
  });

  it('formats 3661 seconds as 61:01', () => {
    expect(formatDuration(3661)).toBe('61:01');
  });

  it('handles undefined', () => {
    expect(formatDuration(undefined)).toBe('0:00');
  });
});

// ─── Unit: Date Formatting ──────────────────────────────

function formatDate(dateStr: string): string {
  if (!dateStr) return 'unknown';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'unknown';
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  } catch {
    return 'unknown';
  }
}

describe('formatDate', () => {
  it('formats ISO date', () => {
    expect(formatDate('2026-03-27')).toBe('2026-03-27');
  });

  it('handles empty string', () => {
    expect(formatDate('')).toBe('unknown');
  });

  it('handles invalid date', () => {
    expect(formatDate('not-a-date')).toBe('unknown');
  });
});

// ─── Unit: Album Name Extraction ────────────────────────

function extractAlbumName(folderName: string): string {
  const datePattern = /^(.+?)_(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[._]\d{1,2}[._]\d{4}$/i;
  const m = folderName.match(datePattern);
  if (m) return m[1].trim();
  const isoPattern = /^(.+?)_\d{4}[-]?\d{2}[-]?\d{2}$/;
  const m2 = folderName.match(isoPattern);
  if (m2) return m2[1].trim();
  return folderName.trim();
}

describe('extractAlbumName', () => {
  it('extracts from date pattern (Month_Day_Year)', () => {
    expect(extractAlbumName('Yin and Yang_Jan_30_2026')).toBe('Yin and Yang');
  });

  it('extracts from ISO date pattern', () => {
    expect(extractAlbumName('Spiritia_20251129')).toBe('Spiritia');
  });

  it('returns full name if no date pattern', () => {
    expect(extractAlbumName('BLACK CHRISTMAS')).toBe('BLACK CHRISTMAS');
  });

  it('handles dots in date', () => {
    expect(extractAlbumName('유난히_Apr.13.2023')).toBe('유난히');
  });
});

// ─── Unit: File Classification ──────────────────────────

function classifyFile(fileName: string): string {
  const ext = fileName.toLowerCase().split('.').pop() || '';
  if (['wav', 'mp3', 'flac', 'aiff', 'aif', 'm4a', 'ogg'].includes(ext)) return 'Music';
  if (['jpg', 'jpeg', 'png', 'tiff', 'tif', 'bmp', 'psd'].includes(ext)) return 'Cover Art';
  if (['mp4', 'mov', 'avi', 'mkv'].includes(ext)) return 'Marketing';
  if (['txt', 'pdf', 'doc', 'docx', 'lrc'].includes(ext)) return 'Lyrics';
  return 'Marketing';
}

describe('classifyFile', () => {
  it('classifies WAV as Music', () => {
    expect(classifyFile('track.wav')).toBe('Music');
  });

  it('classifies PNG as Cover Art', () => {
    expect(classifyFile('cover.png')).toBe('Cover Art');
  });

  it('classifies MP4 as Marketing', () => {
    expect(classifyFile('video.mp4')).toBe('Marketing');
  });

  it('classifies TXT as Lyrics', () => {
    expect(classifyFile('lyrics.txt')).toBe('Lyrics');
  });

  it('defaults to Marketing for unknown', () => {
    expect(classifyFile('readme.xyz')).toBe('Marketing');
  });
});
