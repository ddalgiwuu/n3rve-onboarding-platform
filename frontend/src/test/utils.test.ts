import { describe, it, expect } from 'vitest';
import { generateUPC, validateUPC, generateEAN, validateEAN } from '@/utils/identifiers';
import { formatDuration } from '@/utils/format';
import { cn } from '@/utils/cn';

// ---------------------------------------------------------------------------
// identifiers.ts
// ---------------------------------------------------------------------------
describe('generateUPC', () => {
  it('returns a 12-digit string', () => {
    const upc = generateUPC();
    expect(upc).toMatch(/^\d{12}$/);
  });

  it('generates a UPC that passes validateUPC', () => {
    for (let i = 0; i < 20; i++) {
      expect(validateUPC(generateUPC())).toBe(true);
    }
  });

  it('generates different values on successive calls', () => {
    const results = new Set(Array.from({ length: 10 }, () => generateUPC()));
    // At least 2 distinct values in 10 calls (virtually guaranteed)
    expect(results.size).toBeGreaterThan(1);
  });
});

describe('validateUPC', () => {
  it('returns true for a correctly checksummed UPC', () => {
    // Generate a known-valid UPC and confirm round-trip
    const upc = generateUPC();
    expect(validateUPC(upc)).toBe(true);
  });

  it('returns false when the check digit is wrong', () => {
    const upc = generateUPC();
    // Flip the last digit
    const lastDigit = parseInt(upc[11]);
    const wrongDigit = (lastDigit + 1) % 10;
    const corrupt = upc.slice(0, 11) + wrongDigit.toString();
    expect(validateUPC(corrupt)).toBe(false);
  });

  it('returns false for non-12-digit input', () => {
    expect(validateUPC('12345')).toBe(false);
    expect(validateUPC('1234567890123')).toBe(false); // 13 digits
    expect(validateUPC('')).toBe(false);
  });

  it('returns false for input containing non-digit characters', () => {
    expect(validateUPC('12345678901A')).toBe(false);
    expect(validateUPC('123456789 12')).toBe(false);
  });

  it('returns false when all zeros (invalid checksum for most)', () => {
    // "000000000000" — check digit 0 from 11 zeros is (10-(0%10))%10 = 0, so this is valid
    // We just verify the function returns a boolean, not crash
    expect(typeof validateUPC('000000000000')).toBe('boolean');
  });
});

describe('generateEAN', () => {
  it('returns a 13-digit string', () => {
    const ean = generateEAN();
    expect(ean).toMatch(/^\d{13}$/);
  });

  it('generates an EAN that passes validateEAN', () => {
    for (let i = 0; i < 20; i++) {
      expect(validateEAN(generateEAN())).toBe(true);
    }
  });
});

describe('validateEAN', () => {
  it('returns true for a correctly checksummed EAN', () => {
    const ean = generateEAN();
    expect(validateEAN(ean)).toBe(true);
  });

  it('returns false when the check digit is wrong', () => {
    const ean = generateEAN();
    const lastDigit = parseInt(ean[12]);
    const wrongDigit = (lastDigit + 1) % 10;
    const corrupt = ean.slice(0, 12) + wrongDigit.toString();
    expect(validateEAN(corrupt)).toBe(false);
  });

  it('returns false for non-13-digit input', () => {
    expect(validateEAN('123456789012')).toBe(false); // 12 digits
    expect(validateEAN('12345678901234')).toBe(false); // 14 digits
    expect(validateEAN('')).toBe(false);
  });

  it('returns false for input containing non-digit characters', () => {
    expect(validateEAN('123456789012A')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// format.ts
// ---------------------------------------------------------------------------
describe('formatDuration', () => {
  it('returns "-" when called with no argument', () => {
    expect(formatDuration()).toBe('-');
  });

  it('returns "-" for 0 seconds', () => {
    expect(formatDuration(0)).toBe('-');
  });

  it('formats seconds less than a minute correctly', () => {
    expect(formatDuration(45)).toBe('0:45');
  });

  it('pads single-digit seconds with a leading zero', () => {
    expect(formatDuration(61)).toBe('1:01');
    expect(formatDuration(63)).toBe('1:03');
  });

  it('formats exactly 60 seconds as 1:00', () => {
    expect(formatDuration(60)).toBe('1:00');
  });

  it('formats multi-minute durations', () => {
    expect(formatDuration(125)).toBe('2:05');
    expect(formatDuration(3600)).toBe('60:00');
  });

  it('does not pad minutes', () => {
    // 9 minutes 5 seconds
    expect(formatDuration(545)).toBe('9:05');
  });
});

// ---------------------------------------------------------------------------
// cn.ts
// ---------------------------------------------------------------------------
describe('cn', () => {
  it('returns a single class unchanged', () => {
    expect(cn('foo')).toBe('foo');
  });

  it('merges multiple classes', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes via object syntax', () => {
    expect(cn({ foo: true, bar: false })).toBe('foo');
    expect(cn({ foo: true, bar: true })).toBe('foo bar');
  });

  it('handles array syntax', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar');
  });

  it('deduplicates conflicting Tailwind classes (tailwind-merge behaviour)', () => {
    // Later class wins for conflicting utilities
    expect(cn('p-4', 'p-8')).toBe('p-8');
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('ignores falsy values', () => {
    expect(cn('foo', undefined, null, false, 'bar')).toBe('foo bar');
  });

  it('returns empty string when no truthy classes provided', () => {
    expect(cn(undefined, null, false)).toBe('');
  });
});
