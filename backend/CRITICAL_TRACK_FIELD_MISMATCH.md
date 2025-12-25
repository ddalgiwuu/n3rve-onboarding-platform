# 🚨 CRITICAL: Track Field Schema Mismatch

## Issue Discovery

**Date**: 2024-12-24
**Severity**: 🔴 **CRITICAL**
**Impact**: Track data loss on submission

---

## The Problem

**Controller TRIES to save** (lines 394-430):
```typescript
{
  id, titleKo, titleEn, composer, lyricist, arranger,
  featuring, isTitle, explicitContent, isrc,
  genre, subgenre, alternateGenre, alternateSubgenre,
  lyrics, lyricsLanguage, audioLanguage, metadataLanguage,
  dolbyAtmos, producer, mixer, masterer,
  previewStart, previewEnd, trackVersion, trackType,
  translations
}
// 28 fields!
```

**Prisma Schema ONLY accepts** (SubmissionTracks type):
```typescript
{
  id, titleKo, titleEn, composer, lyricist, arranger,
  isTitle, explicitContent, isrc,
  genre, subgenre,
  dolbyAtmos, stereo,
  trackType, versionType,
  artists, featuringArtists, contributors,
  isFocusTrack
}
// 19 fields!
```

---

## Missing Track Fields in Schema

### Fields Controller Sends But Schema Rejects

| Field | Controller Line | Type | Impact | Severity |
|-------|----------------|------|--------|----------|
| **featuring** | 407 | String | Lost featuring artist string | 🟡 Medium |
| **alternateGenre** | 414 | String | Lost alternate genre | 🟢 Low |
| **alternateSubgenre** | 415 | String | Lost alternate subgenre | 🟢 Low |
| **lyrics** | 416 | String | Lost lyrics text! | 🔴 **HIGH** |
| **lyricsLanguage** | 417 | String | Lost lyrics language | 🟡 Medium |
| **audioLanguage** | 418 | String | Lost audio language! | 🔴 **HIGH** |
| **metadataLanguage** | 419 | String | Lost metadata language | 🟡 Medium |
| **producer** | 421 | String | Lost producer credit | 🔴 **HIGH** |
| **mixer** | 422 | String | Lost mixer credit | 🟡 Medium |
| **masterer** | 423 | String | Lost mastering credit | 🟡 Medium |
| **previewStart** | 424 | Number | Lost preview timestamp | 🟡 Medium |
| **previewEnd** | 425 | Number | Lost preview end | 🟡 Medium |
| **trackVersion** | 426 | String | Lost version info | 🟡 Medium |
| **translations[]** | 428 | Array | Lost track translations! | 🔴 **HIGH** |

**Critical Data Loss**: 14 fields attempted but NOT stored!

---

## Frontend Sends These Fields

**From handleSubmit** (lines 1301-1336):

✅ **WORKING** (in schema):
- id, titleKo, titleEn, titleTranslations
- artists[], featuringArtists[], contributors[]
- composer, lyricist, arranger
- isTitle, isFocusTrack, isrc, musicVideoISRC, hasMusicVideo
- explicitContent, dolbyAtmos, stereo
- trackType, versionType
- genre, subgenre

❌ **SENT BUT LOST** (not in schema):
- language (sent as line 1331)
- audioLanguage (sent as line 1332)
- lyrics (sent as line 1333)
- duration (sent as line 1334)
- volume (sent as line 1335)
- discNumber (sent as line 1336)

---

## Schema Gaps

### SubmissionTracks Type Needs These Fields:

```prisma
type SubmissionTracks {
  // ✅ Already in schema
  artists          Json?
  composer         String
  contributors     Json?
  dolbyAtmos       Boolean
  explicitContent  Boolean
  featuringArtists Json?
  id               String
  isFocusTrack     Boolean
  isTitle          Boolean
  isrc             String
  lyricist         String
  arranger         String?
  stereo           Boolean
  titleEn          String
  titleKo          String
  trackType        String
  versionType      String
  genre            String?
  subgenre         String?

  // 🔴 ADD THESE CRITICAL FIELDS:
  lyrics           String?         // Track lyrics text
  audioLanguage    String?         // Audio language (critical for FUGA)
  language         String?         // Metadata language
  duration         String?         // Track duration
  volume           Int?            // Volume/disc number
  discNumber       Int?            // Disc number for multi-disc
  trackNumber      Int?            // Track order number
  musicVideoISRC   String?         // Music video ISRC
  hasMusicVideo    Boolean?        // Has music video flag
  titleTranslations Json?          // Multi-language titles

  // 🟡 ADD THESE OPTIONAL FIELDS:
  lyricsLanguage   String?         // Lyrics language
  metadataLanguage String?         // Metadata language
  producer         String?         // Producer credit
  mixer            String?         // Mixing engineer
  masterer         String?         // Mastering engineer
  previewStart     Int?            // Preview start time
  previewEnd       Int?            // Preview end time
  trackVersion     String?         // Version/remix info
  translations     Json?           // Track translations array
  alternateGenre   String?         // Secondary genre
  alternateSubgenre String?        // Secondary subgenre
  featuring        String?         // Featuring artist string
}
```

---

## Impact Assessment

### Data Currently Being Lost Per Track:

1. **lyrics** - Complete lyrics text (critical for lyric distribution)
2. **audioLanguage** - Required by FUGA API for distribution
3. **language** - Metadata language for proper categorization
4. **duration** - Track length (important for royalties)
5. **volume/discNumber** - Multi-disc organization
6. **trackNumber** - Track ordering
7. **musicVideoISRC** - Music video identifier (critical for video distribution)
8. **hasMusicVideo** - Flag for video presence
9. **titleTranslations** - Multi-language track titles
10. **producer, mixer, masterer** - Production credits (industry standard)
11. **previewStart/End** - Preview clip timestamps
12. **trackVersion** - Remix/version information

**Total Fields Lost**: 14 critical fields per track!

**Impact**:
- ❌ Incomplete submissions to FUGA API (missing audioLanguage, lyrics)
- ❌ Lost production credits (producer, mixer, masterer)
- ❌ No multi-disc support (volume, discNumber lost)
- ❌ Preview clips can't be configured (timestamps lost)
- ❌ Multi-language track titles lost

---

## Recommended Fix

### Step 1: Update Prisma Schema

```prisma
type SubmissionTracks {
  // Keep existing 19 fields...

  // Add critical fields:
  lyrics           String?
  audioLanguage    String?
  language         String?
  duration         String?
  volume           Int?
  discNumber       Int?
  trackNumber      Int?
  musicVideoISRC   String?
  hasMusicVideo    Boolean?
  titleTranslations Json?
  lyricsLanguage   String?
  metadataLanguage String?
  producer         String?
  mixer            String?
  masterer         String?
  previewStart     Int?
  previewEnd       Int?
  trackVersion     String?
  translations     Json?
  alternateGenre   String?
  alternateSubgenre String?
  featuring        String?
}
```

### Step 2: Verify Controller Saves All Fields

Controller already tries to save these (lines 394-428), so no change needed!

### Step 3: Update Admin Display

Add missing fields to track sections (after line 220):

```typescript
[t('가사', 'Lyrics')]: track.lyrics || '',
[t('오디오 언어', 'Audio Language')]: track.audioLanguage || '',
[t('언어', 'Language')]: track.language || '',
[t('재생 시간', 'Duration')]: track.duration || '',
[t('볼륨', 'Volume')]: track.volume || '',
[t('디스크 번호', 'Disc Number')]: track.discNumber || '',
[t('트랙 번호', 'Track Number')]: track.trackNumber || '',
[t('뮤직 비디오 ISRC', 'Music Video ISRC')]: track.musicVideoISRC || '',
[t('프로듀서', 'Producer')]: track.producer || '',
[t('믹서', 'Mixer')]: track.mixer || '',
[t('마스터링', 'Mastering Engineer')]: track.masterer || '',
```

### Step 4: Run Prisma Migration

```bash
cd backend
npx prisma generate
npx prisma db push
```

### Step 5: Test Complete Workflow

1. Submit form with all track fields
2. Verify database storage
3. Check admin display
4. Confirm no data loss

---

## Priority Actions

### Immediate (Before Next Deployment)
1. ✅ Add lyrics, audioLanguage, language fields (FUGA requirements)
2. ✅ Add trackNumber, volume, discNumber (organization)
3. ✅ Add musicVideoISRC, hasMusicVideo (video distribution)
4. ✅ Add duration (royalty calculations)

### Soon (Within Sprint)
1. ✅ Add producer, mixer, masterer (industry credits)
2. ✅ Add previewStart/End (preview configuration)
3. ✅ Add titleTranslations (multi-language)

### Optional (Future Enhancement)
1. Add trackVersion, translations, alternateGenre/Subgenre
2. Add featuring string field
3. Add lyricsLanguage, metadataLanguage

---

## Testing Checklist

After schema update:

- [ ] Create test submission with ALL track fields populated
- [ ] Verify all fields appear in MongoDB
- [ ] Check admin display shows all fields
- [ ] Test FUGA export includes audioLanguage and lyrics
- [ ] Verify multi-disc albums (volume/discNumber)
- [ ] Check music video ISRC handling
- [ ] Validate production credits display

---

**CRITICAL**: Deploy schema update ASAP to prevent data loss!
