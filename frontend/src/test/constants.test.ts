import { describe, it, expect } from 'vitest';
import {
  FUGA_MOODS,
  FUGA_INSTRUMENTS,
  FUGA_GENRES,
} from '@/constants/fuga-data';
import { contributorRoles } from '@/constants/contributorRoles';
import { instrumentList } from '@/constants/instruments';

// ---------------------------------------------------------------------------
// fuga-data.ts
// ---------------------------------------------------------------------------
describe('FUGA_GENRES', () => {
  it('has exactly 22 items', () => {
    expect(FUGA_GENRES.length).toBe(22);
  });

  it('has no duplicate entries', () => {
    const unique = new Set(FUGA_GENRES);
    expect(unique.size).toBe(FUGA_GENRES.length);
  });

  it('contains only non-empty strings', () => {
    for (const genre of FUGA_GENRES) {
      expect(typeof genre).toBe('string');
      expect(genre.trim().length).toBeGreaterThan(0);
    }
  });
});

describe('FUGA_MOODS', () => {
  it('has exactly 18 items', () => {
    expect(FUGA_MOODS.length).toBe(18);
  });

  it('has no duplicate entries', () => {
    const unique = new Set(FUGA_MOODS);
    expect(unique.size).toBe(FUGA_MOODS.length);
  });

  it('contains only non-empty strings', () => {
    for (const mood of FUGA_MOODS) {
      expect(typeof mood).toBe('string');
      expect(mood.trim().length).toBeGreaterThan(0);
    }
  });

  it('includes known mood values', () => {
    const moodSet = new Set(FUGA_MOODS);
    expect(moodSet.has('Chill')).toBe(true);
    expect(moodSet.has('Happy')).toBe(true);
    expect(moodSet.has('Sad')).toBe(true);
    expect(moodSet.has('Energetic')).toBe(true);
  });
});

describe('FUGA_INSTRUMENTS', () => {
  it('has exactly 45 items', () => {
    expect(FUGA_INSTRUMENTS.length).toBe(45);
  });

  it('has no duplicate entries', () => {
    const unique = new Set(FUGA_INSTRUMENTS);
    expect(unique.size).toBe(FUGA_INSTRUMENTS.length);
  });

  it('contains only non-empty strings', () => {
    for (const instrument of FUGA_INSTRUMENTS) {
      expect(typeof instrument).toBe('string');
      expect(instrument.trim().length).toBeGreaterThan(0);
    }
  });

  it('includes common instruments', () => {
    const instrumentSet = new Set(FUGA_INSTRUMENTS);
    expect(instrumentSet.has('Piano')).toBe(true);
    expect(instrumentSet.has('Guitar')).not.toBe(true); // Not present as bare "Guitar"
    expect(instrumentSet.has('Acoustic Guitar')).toBe(true);
    expect(instrumentSet.has('Violin')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// contributorRoles.ts
// ---------------------------------------------------------------------------
describe('contributorRoles', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(contributorRoles)).toBe(true);
    expect(contributorRoles.length).toBeGreaterThan(0);
  });

  it('all roles have unique value IDs', () => {
    const values = contributorRoles.map(r => r.value);
    const unique = new Set(values);
    expect(unique.size).toBe(values.length);
  });

  it('all roles have a non-empty Korean label', () => {
    for (const role of contributorRoles) {
      expect(typeof role.label, `role ${role.value} missing label`).toBe('string');
      expect(role.label.trim().length, `role ${role.value} has empty label`).toBeGreaterThan(0);
    }
  });

  it('all roles have a non-empty English label', () => {
    for (const role of contributorRoles) {
      expect(typeof role.labelEn, `role ${role.value} missing labelEn`).toBe('string');
      expect(role.labelEn.trim().length, `role ${role.value} has empty labelEn`).toBeGreaterThan(0);
    }
  });

  it('all roles have a non-empty category', () => {
    for (const role of contributorRoles) {
      expect(typeof role.category, `role ${role.value} missing category`).toBe('string');
      expect(role.category.trim().length, `role ${role.value} has empty category`).toBeGreaterThan(0);
    }
  });

  it('all value IDs are kebab-case (lowercase letters, digits, hyphens only)', () => {
    const kebabPattern = /^[a-z0-9&]+(-[a-z0-9&]+)*$/;
    for (const role of contributorRoles) {
      expect(kebabPattern.test(role.value), `role value "${role.value}" is not kebab-case`).toBe(true);
    }
  });

  it('contains essential music roles', () => {
    const values = new Set(contributorRoles.map(r => r.value));
    expect(values.has('composer')).toBe(true);
    expect(values.has('lyricist')).toBe(true);
    expect(values.has('producer')).toBe(true);
    expect(values.has('mixing-engineer')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// instruments.ts
// ---------------------------------------------------------------------------
describe('instrumentList', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(instrumentList)).toBe(true);
    expect(instrumentList.length).toBeGreaterThan(0);
  });

  it('has no duplicate value IDs', () => {
    const values = instrumentList.map(i => i.value);
    const unique = new Set(values);
    expect(unique.size).toBe(values.length);
  });

  it('documents known duplicate English label names', () => {
    // There is exactly 1 known duplicate: "Hag'houge" appears under two different
    // value IDs ('kaghouge' in 타악기 and 'haaghouge' in 기타). This test documents
    // the actual state of the data so any new duplicates are caught immediately.
    const labels = instrumentList.map(i => i.labelEn);
    const counts: Record<string, number> = {};
    for (const l of labels) counts[l] = (counts[l] ?? 0) + 1;
    const duplicates = Object.entries(counts).filter(([, n]) => n > 1).map(([label]) => label);
    expect(duplicates).toEqual(["Hag'houge"]);
  });

  it('all instruments have non-empty value, label, and labelEn', () => {
    for (const instrument of instrumentList) {
      expect(instrument.value.trim().length, `instrument value is empty`).toBeGreaterThan(0);
      expect(instrument.label.trim().length, `instrument label is empty for ${instrument.value}`).toBeGreaterThan(0);
      expect(instrument.labelEn.trim().length, `instrument labelEn is empty for ${instrument.value}`).toBeGreaterThan(0);
    }
  });

  it('all instruments have a non-empty category', () => {
    for (const instrument of instrumentList) {
      expect(instrument.category.trim().length, `category is empty for ${instrument.value}`).toBeGreaterThan(0);
    }
  });

  it('all value IDs are lowercase kebab-case', () => {
    // Values must not contain uppercase letters
    for (const instrument of instrumentList) {
      expect(instrument.value, `"${instrument.value}" contains uppercase`).toBe(instrument.value.toLowerCase());
    }
  });
});
