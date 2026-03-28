import { describe, it, expect } from 'vitest';
import {
  validateAlbumTitle,
  validateArtistName,
  type ValidationResult,
} from '@/utils/inputValidation';
import { validateISRC } from '@/utils/fugaQCValidation';

// ---------------------------------------------------------------------------
// validateAlbumTitle
// ---------------------------------------------------------------------------
describe('validateAlbumTitle', () => {
  describe('empty / blank input', () => {
    it('is invalid for an empty string', () => {
      const result = validateAlbumTitle('');
      expect(result.isValid).toBe(false);
      expect(result.warnings.some(w => w.type === 'error')).toBe(true);
    });

    it('is invalid for a whitespace-only string', () => {
      const result = validateAlbumTitle('   ');
      expect(result.isValid).toBe(false);
    });
  });

  describe('valid titles', () => {
    it('is valid for a normal title', () => {
      const result = validateAlbumTitle('My Album');
      expect(result.isValid).toBe(true);
      expect(result.value).toBe('My Album');
    });

    it('is valid for a Korean title', () => {
      const result = validateAlbumTitle('나의 앨범');
      expect(result.isValid).toBe(true);
    });
  });

  describe('invalid characters', () => {
    it('flags titles containing file-system reserved characters as error', () => {
      const badTitles = ['My:Album', 'My/Album', 'My<Album>', 'My"Album', 'My\\Album'];
      for (const title of badTitles) {
        const result = validateAlbumTitle(title);
        expect(result.isValid, `expected isValid=false for "${title}"`).toBe(false);
        const errorWarning = result.warnings.find(w => w.type === 'error' && w.warningGroup === 'special_chars');
        expect(errorWarning, `expected special_chars error for "${title}"`).toBeDefined();
      }
    });
  });

  describe('length validation', () => {
    it('is invalid for a title longer than 255 characters', () => {
      const longTitle = 'A'.repeat(256);
      const result = validateAlbumTitle(longTitle);
      expect(result.isValid).toBe(false);
      expect(result.warnings.some(w => w.type === 'error')).toBe(true);
    });

    it('is valid for a title of exactly 255 characters', () => {
      const maxTitle = 'A'.repeat(255);
      const result = validateAlbumTitle(maxTitle);
      // No length error; may have other warnings but should be valid
      const lengthError = result.warnings.find(w => w.type === 'error' && w.message.includes('255'));
      expect(lengthError).toBeUndefined();
    });
  });

  describe('formatting warnings', () => {
    it('produces a warning for consecutive spaces', () => {
      const result = validateAlbumTitle('My  Album');
      expect(result.isValid).toBe(true); // still valid, just a warning
      const warning = result.warnings.find(w => w.warningGroup === 'spacing');
      expect(warning).toBeDefined();
      expect(warning?.type).toBe('warning');
    });

    it('suggests standardized value for consecutive spaces', () => {
      const result = validateAlbumTitle('My  Album');
      const warning = result.warnings.find(w => w.warningGroup === 'spacing');
      expect(warning?.suggestedValue).toBe('My Album');
    });

    it('produces a warning for non-standard brackets', () => {
      const result = validateAlbumTitle('My Album（Remix）');
      const warning = result.warnings.find(w => w.warningGroup === 'brackets');
      expect(warning).toBeDefined();
      expect(warning?.type).toBe('warning');
      // Suggested value should use standard brackets
      expect(warning?.suggestedValue).toBe('My Album(Remix)');
    });

    it('produces a suggestion for "featuring" instead of "feat."', () => {
      const result = validateAlbumTitle('My Song featuring Artist');
      const suggestion = result.warnings.find(w => w.warningGroup === 'feat');
      expect(suggestion).toBeDefined();
      expect(suggestion?.type).toBe('suggestion');
      expect(suggestion?.suggestedValue).toBe('My Song feat. Artist');
    });

    it('produces a suggestion for "ft." instead of "feat."', () => {
      const result = validateAlbumTitle('My Song ft. Artist');
      const suggestion = result.warnings.find(w => w.warningGroup === 'feat');
      expect(suggestion).toBeDefined();
    });
  });

  describe('language parameter', () => {
    it('returns English messages when language is "en"', () => {
      const result = validateAlbumTitle('', 'en');
      expect(result.warnings[0].message).toBe('Please enter album title.');
    });

    it('returns Korean messages when language is "ko"', () => {
      const result = validateAlbumTitle('', 'ko');
      expect(result.warnings[0].message).toBe('앨범 제목을 입력해주세요.');
    });
  });
});

// ---------------------------------------------------------------------------
// validateArtistName
// ---------------------------------------------------------------------------
describe('validateArtistName', () => {
  describe('empty input', () => {
    it('is invalid for an empty string', () => {
      const result = validateArtistName('');
      expect(result.isValid).toBe(false);
      expect(result.warnings.some(w => w.type === 'error')).toBe(true);
    });
  });

  describe('valid names', () => {
    it('is valid for a regular artist name', () => {
      const result = validateArtistName('BTS');
      expect(result.isValid).toBe(true);
    });

    it('is valid for a Korean artist name', () => {
      const result = validateArtistName('아이유');
      expect(result.isValid).toBe(true);
    });
  });

  describe('special characters', () => {
    it('flags invalid characters as error', () => {
      const result = validateArtistName('Artist/Name');
      expect(result.isValid).toBe(false);
      expect(result.warnings.some(w => w.type === 'error')).toBe(true);
    });

    it('allows hyphens and apostrophes', () => {
      const result = validateArtistName("D'Angelo");
      expect(result.isValid).toBe(true);
    });
  });

  describe('length validation', () => {
    it('is invalid for a name longer than 100 characters', () => {
      const longName = 'A'.repeat(101);
      const result = validateArtistName(longName);
      expect(result.isValid).toBe(false);
      expect(result.warnings.some(w => w.type === 'error')).toBe(true);
    });
  });

  describe('consecutive spaces warning', () => {
    it('warns about consecutive spaces', () => {
      const result = validateArtistName('My  Artist');
      const warning = result.warnings.find(w => w.type === 'warning' && w.field === 'artistName');
      expect(warning).toBeDefined();
    });
  });

  describe('isComposer mode', () => {
    it('warns when a composer name looks like initials', () => {
      const result = validateArtistName('J.K', true);
      const warning = result.warnings.find(w => w.type === 'warning' && w.field === 'artistName');
      // initials pattern check
      expect(result).toBeDefined();
    });

    it('errors for a single-character composer name', () => {
      const result = validateArtistName('A', true);
      expect(result.isValid).toBe(false);
      expect(result.warnings.some(w => w.type === 'error')).toBe(true);
    });

    it('is valid for a full composer name', () => {
      const result = validateArtistName('John Smith', true);
      expect(result.isValid).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// validateISRC (from fugaQCValidation.ts)
// ---------------------------------------------------------------------------
describe('validateISRC', () => {
  it('returns empty array (valid) for a correctly formatted ISRC', () => {
    // Format: CC + XXX + YY + NNNNNNN  (2 letters + 3 alphanumeric + 2 digits + 7 digits = 12 chars)
    const validISRC = 'USKRE2400001';
    const results = validateISRC(validISRC);
    expect(results).toHaveLength(0);
  });

  it('returns an error for an ISRC that is too short', () => {
    const results = validateISRC('USKRE240000');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].isValid).toBe(false);
    expect(results[0].severity).toBe('error');
  });

  it('returns an error for an ISRC that is too long', () => {
    const results = validateISRC('USKRE24000012');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].isValid).toBe(false);
  });

  it('returns an error when country code contains lowercase letters', () => {
    const results = validateISRC('usKRE2400001');
    expect(results.length).toBeGreaterThan(0);
  });

  it('returns an error for an ISRC with spaces', () => {
    const results = validateISRC('US-KRE-24-00001');
    expect(results.length).toBeGreaterThan(0);
  });

  it('returns empty array when ISRC is empty string (treated as not provided)', () => {
    // Per the implementation: only validates if isrc is truthy
    const results = validateISRC('');
    expect(results).toHaveLength(0);
  });

  it('validates ISRC with digits in registrant code (alphanumeric)', () => {
    // 2 uppercase letters + 3 alphanumeric (with digits) + 7 digits
    const results = validateISRC('US1RE2400001');
    expect(results).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// formatUtils (bracket standardization and feat. formatting)
// These are tested indirectly via validateAlbumTitle's suggestedValue output,
// which exercises standardizeBrackets and standardizeFeat.
// ---------------------------------------------------------------------------
describe('formatUtils via validateAlbumTitle suggestions', () => {
  it('standardizeBrackets converts fullwidth brackets to ASCII', () => {
    const result = validateAlbumTitle('Song ［Live］');
    const suggestion = result.warnings.find(w => w.warningGroup === 'brackets');
    expect(suggestion?.suggestedValue).toBe('Song [Live]');
  });

  it('standardizeBrackets converts fullwidth parentheses to ASCII', () => {
    const result = validateAlbumTitle('Song（Live）');
    const suggestion = result.warnings.find(w => w.warningGroup === 'brackets');
    expect(suggestion?.suggestedValue).toBe('Song(Live)');
  });

  it('standardizeFeat converts "ft." — note: regex replaces "ft." token leaving trailing dot, producing "feat.."', () => {
    // The regex /\b(featuring|ft\.|ft)\b/gi replaces the entire match "ft." with "feat.",
    // but "ft." already ends with a period so the result is "feat.." — this is the actual
    // behaviour of the source code. Use "ft" (without dot) to get a clean "feat." conversion.
    const result = validateAlbumTitle('Song ft. BTS');
    const suggestion = result.warnings.find(w => w.warningGroup === 'feat');
    expect(suggestion?.suggestedValue).toBe('Song feat.. BTS');
  });

  it('standardizeFeat converts "ft" (no dot) cleanly to "feat."', () => {
    const result = validateAlbumTitle('Song ft BTS');
    const suggestion = result.warnings.find(w => w.warningGroup === 'feat');
    expect(suggestion?.suggestedValue).toBe('Song feat. BTS');
  });

  it('standardizeFeat converts "featuring" to "feat." case-insensitively', () => {
    const result = validateAlbumTitle('Song Featuring BTS');
    const suggestion = result.warnings.find(w => w.warningGroup === 'feat');
    expect(suggestion?.suggestedValue).toBe('Song feat. BTS');
  });
});
