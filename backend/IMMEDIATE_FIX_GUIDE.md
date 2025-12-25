# Immediate Fix Guide: Field Mapping Issues

**Target**: Fix critical data loss issues in 1-2 hours
**Impact**: Recover 52 lost fields (33% → 99% functional)

---

## Fix #1: Update Prisma Track Schema (15 min)

**File**: `/Users/ryansong/Desktop/n3rve-onbaording/backend/prisma/schema.prisma`
**Location**: Find `type SubmissionTracks` (around line 135)

### Current Schema (19 fields):
```prisma
type SubmissionTracks {
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
}
```

### Add These Fields:
```prisma
type SubmissionTracks {
  // ✅ Keep all existing 19 fields above...

  // 🔴 ADD CRITICAL FIELDS (required by FUGA):
  lyrics            String?         // Track lyrics text
  audioLanguage     String?         // Audio language (FUGA requirement)
  language          String?         // Metadata language
  duration          String?         // Track duration (3:45 format)
  musicVideoISRC    String?         // Music video ISRC code
  hasMusicVideo     Boolean?        // Has music video flag
  trackNumber       Int?            // Track order number
  titleTranslations Json?           // Multi-language track titles

  // 🟡 ADD OPTIONAL FIELDS (nice to have):
  volume            Int?            // Volume/disc number
  discNumber        Int?            // Disc number for multi-disc albums
  lyricsLanguage    String?         // Lyrics language
  metadataLanguage  String?         // Metadata language
  producer          String?         // Producer credit
  mixer             String?         // Mixing engineer
  masterer          String?         // Mastering engineer
  previewStart      Int?            // Preview clip start (seconds)
  previewEnd        Int?            // Preview clip end (seconds)
  trackVersion      String?         // Version/remix information
  translations      Json?           // Full track translation array
  alternateGenre    String?         // Secondary genre
  alternateSubgenre String?         // Secondary subgenre
  featuring         String?         // Featuring artist string
}
```

### After editing, run:
```bash
cd /Users/ryansong/Desktop/n3rve-onbaording/backend
npx prisma generate
npx prisma db push
```

**Recovers**: 11-23 track fields (depending on optional inclusion)

---

## Fix #2: Add Marketing Fallbacks (10 min)

**File**: `/Users/ryansong/Desktop/n3rve-onbaording/backend/src/submissions/submissions.controller.ts`
**Location**: Lines 499-536 (marketing section)

### Find This:
```typescript
marketing: {
  spotifyArtistId: submissionData.marketingInfo?.spotifyArtistId,
  appleMusicArtistId: submissionData.marketingInfo?.appleMusicArtistId,
  facebookUrl: submissionData.marketingInfo?.facebookUrl,
  instagramUrl: submissionData.marketingInfo?.instagramUrl,
```

### Replace With:
```typescript
marketing: {
  // 🔴 FIX: Add fallbacks for snake_case → camelCase
  spotifyArtistId:
    submissionData.marketingInfo?.spotifyArtistId ||
    submissionData.marketingInfo?.artist_spotify_id,
  appleMusicArtistId:
    submissionData.marketingInfo?.appleMusicArtistId ||
    submissionData.marketingInfo?.artist_apple_id,
  facebookUrl:
    submissionData.marketingInfo?.facebookUrl ||
    submissionData.marketingInfo?.artist_facebook_url,
  instagramUrl:
    submissionData.marketingInfo?.instagramUrl ||
    submissionData.marketingInfo?.artist_instagram_handle,
```

### Add After Line 536 (before closing brace):
```typescript
  // 🔴 ADD: Missing marketing fields
  priorityLevel: submissionData.marketingInfo?.priorityLevel,
  projectType: submissionData.marketingInfo?.projectType,
  campaignGoals: submissionData.marketingInfo?.campaignGoals,
  prLine: submissionData.marketingInfo?.pr_line,
  internalNote: submissionData.marketingInfo?.internal_note,
  marketingGenre: submissionData.marketingInfo?.marketing_genre,
  marketingSubgenre: submissionData.marketingInfo?.marketing_subgenre,
}
```

**Recovers**: 11 marketing fields

---

## Fix #3: Update Distribution Schema (5 min)

**File**: `/Users/ryansong/Desktop/n3rve-onbaording/backend/prisma/schema.prisma`
**Location**: Find `type SubmissionRelease` (around line 97)

### Add After Line 133:
```prisma
type SubmissionRelease {
  // ✅ Keep all existing 27 fields...

  // 🟡 ADD DISTRIBUTION FIELDS:
  distributionType   String?         // 'all' | 'selected'
  selectedStores     Json?           // Array of selected store IDs
  excludedStores     Json?           // Array of excluded store IDs
  territorySelection Json?           // Complex territory object with DSP overrides
  excludedTerritories Json?          // Array of excluded territory codes
}
```

### Run:
```bash
npx prisma generate
npx prisma db push
```

**Recovers**: 5 distribution fields

---

## Fix #4: Send Territory Selection (2 min)

**File**: `/Users/ryansong/Desktop/n3rve-onbaording/frontend/src/pages/ImprovedReleaseSubmissionWithDnD.tsx`
**Location**: Line 1341 (in handleSubmit)

### Find This:
```javascript
territories: formData.territories,
excludedTerritories: formData.excludedTerritories,
previouslyReleased: formData.previouslyReleased,
```

### Change To:
```javascript
territories: formData.territories,
territorySelection: formData.territorySelection,  // 🔴 ADD THIS LINE
excludedTerritories: formData.excludedTerritories,
previouslyReleased: formData.previouslyReleased,
```

**Recovers**: Territory DSP override functionality

---

## Fix #5: Send Album Note (2 min)

**File**: `/Users/ryansong/Desktop/n3rve-onbaording/frontend/src/pages/ImprovedReleaseSubmissionWithDnD.tsx`
**Location**: Line 1300 (in handleSubmit)

### Find This:
```javascript
albumVersion: formData.albumVersion,
tracks: formData.tracks.map(t => ({
```

### Change To:
```javascript
albumVersion: formData.albumVersion,
albumNote: formData.albumNote,  // 🟡 ADD THIS LINE
tracks: formData.tracks.map(t => ({
```

**Recovers**: Album notes field

---

## Fix #6: Extract Artist Platform IDs (Optional - 15 min)

**File**: `/Users/ryansong/Desktop/n3rve-onbaording/backend/src/submissions/submissions.controller.ts`
**Location**: Lines 372-378

### Find This:
```typescript
// Artist Information
artistName: submissionData.artist?.nameKo || '',
artistNameEn: submissionData.artist?.nameEn,
labelName: submissionData.artist?.labelName,
genre: submissionData.artist?.genre || [],
biography: submissionData.artist?.biography,
artistType: 'SOLO', // Default, can be enhanced based on artist data
```

### Change To:
```typescript
// Artist Information
artistName: submissionData.artist?.nameKo || '',
artistNameEn: submissionData.artist?.nameEn,
labelName: submissionData.artist?.labelName,
genre: submissionData.artist?.genre || [],
biography: submissionData.artist?.biography,
artistType: 'SOLO', // Default, can be enhanced based on artist data

// 🟡 ADD: Extract platform IDs from main artist
(() => {
  const mainArtist = submissionData.artist?.artists?.find(a => a.role === 'main');
  return {
    spotifyId: mainArtist?.spotifyId,
    appleMusicId: mainArtist?.appleId,
    artistTranslations: mainArtist?.translations,
  };
})(),
```

**Note**: This requires spreading the returned object into prismaData. Cleaner approach:

```typescript
const mainArtist = submissionData.artist?.artists?.find(a => a.role === 'main');

// Artist Information
artistName: submissionData.artist?.nameKo || '',
artistNameEn: submissionData.artist?.nameEn,
labelName: submissionData.artist?.labelName,
genre: submissionData.artist?.genre || [],
biography: submissionData.artist?.biography,
artistType: 'SOLO',
spotifyId: mainArtist?.spotifyId,              // 🟡 ADD
appleMusicId: mainArtist?.appleId,             // 🟡 ADD
artistTranslations: mainArtist?.translations,   // 🟡 ADD
```

**Recovers**: Artist platform IDs and translations

---

## Deployment Steps

### Step 1: Backend Schema Updates (20 min)
```bash
cd /Users/ryansong/Desktop/n3rve-onbaording/backend

# 1. Edit prisma/schema.prisma
# - Add track fields (Fix #1)
# - Add distribution fields (Fix #3)

# 2. Generate Prisma client
npx prisma generate

# 3. Push to MongoDB
npx prisma db push

# 4. Verify schema updated
npx prisma format
```

### Step 2: Backend Controller Updates (10 min)
```bash
# Edit src/submissions/submissions.controller.ts
# - Add marketing fallbacks (Fix #2)
# - Extract artist IDs (Fix #6 - optional)

# Verify TypeScript compiles
npm run build
```

### Step 3: Frontend Updates (5 min)
```bash
cd /Users/ryansong/Desktop/n3rve-onbaording/frontend

# Edit src/pages/ImprovedReleaseSubmissionWithDnD.tsx
# - Add territorySelection (Fix #4)
# - Add albumNote (Fix #5)

# Verify TypeScript compiles
npm run build
```

### Step 4: Testing (30 min)
```bash
# 1. Start local backend
cd backend
npm run start:dev

# 2. Start local frontend
cd ../frontend
npm run dev

# 3. Submit test release with ALL fields populated
# 4. Check MongoDB: use Compass or mongo shell
# 5. Verify admin display shows all fields
```

### Step 5: Deploy (15 min)
```bash
# Backend
cd backend
git add prisma/schema.prisma src/submissions/submissions.controller.ts
git commit -m "Fix field mapping: track schema + marketing fallbacks"
git push origin main

# Frontend
cd ../frontend
git add src/pages/ImprovedReleaseSubmissionWithDnD.tsx
git commit -m "Fix field submission: territory selection + album note"
git push origin main

# Wait for GitHub Actions auto-deployment
```

---

## Validation Tests

### Test Case #1: Track Fields
```javascript
// Submit track with:
{
  lyrics: "여기 한국어 가사\nSecond line",
  audioLanguage: "Korean",
  language: "ko",
  duration: "3:45",
  musicVideoISRC: "USKR12345678",
  trackNumber: 1,
  volume: 1,
  discNumber: 1
}

// Verify MongoDB has all fields
// Verify admin displays all fields
```

### Test Case #2: Marketing Snake_case
```javascript
// Submit with:
{
  marketingInfo: {
    artist_spotify_id: "spotify:artist:abc123",
    artist_apple_id: "apple:artist:xyz789",
    priorityLevel: 5,
    projectType: "FRONTLINE"
  }
}

// Verify:
// - marketing.spotifyArtistId = "spotify:artist:abc123" ✅
// - marketing.appleMusicArtistId = "apple:artist:xyz789" ✅
// - marketing.priorityLevel = 5 ✅
// - marketing.projectType = "FRONTLINE" ✅
```

### Test Case #3: Territory Selection
```javascript
// Submit with:
{
  territorySelection: {
    base: { mode: 'worldwide', territories: [] },
    dspOverrides: [
      { dspId: 'spotify', mode: 'include', territories: ['US', 'CA'] },
      { dspId: 'apple', mode: 'exclude', territories: ['CN'] }
    ]
  }
}

// Verify:
// - release.territorySelection exists ✅
// - Can retrieve DSP overrides ✅
```

---

## Rollback Plan

If issues occur:

### Schema Rollback
```bash
cd backend
git revert HEAD  # Revert last commit
npx prisma generate
npx prisma db push
```

### Controller Rollback
```bash
cd backend
git checkout HEAD~1 src/submissions/submissions.controller.ts
npm run build
```

### Frontend Rollback
```bash
cd frontend
git checkout HEAD~1 src/pages/ImprovedReleaseSubmissionWithDnD.tsx
npm run build
```

**Note**: Schema changes are additive (adding optional fields), so rollback is safe

---

## Expected Results

### Before Fix:
```
✅ Working: 106/158 fields (67%)
❌ Lost: 52/158 fields (33%)

Critical Issues:
- Track lyrics, audioLanguage, duration LOST
- Marketing platform IDs, priority, project type LOST
- Territory DSP overrides NOT SENT
- Distribution store selection LOST
```

### After Fix:
```
✅ Working: 156/158 fields (99%)
❌ Lost: 2/158 fields (1%)

Remaining (optional):
- EAN field (UPC covers it)
- Artist social links (in marketing section)
```

---

## Fix Summary Table

| Fix | File | Lines | Time | Fields Recovered | Priority |
|-----|------|-------|------|------------------|----------|
| #1 Track Schema | schema.prisma | ~135 | 15m | 11-23 fields | 🔴 CRITICAL |
| #2 Marketing Fallbacks | controller.ts | 499-536 | 10m | 4 fields | 🔴 CRITICAL |
| #3 Marketing New Fields | controller.ts | 536+ | 5m | 7 fields | 🔴 CRITICAL |
| #4 Territory Selection | frontend tsx | 1342 | 2m | 1 object | 🔴 CRITICAL |
| #5 Album Note | frontend tsx | 1300 | 2m | 1 field | 🟡 MEDIUM |
| #6 Artist IDs | controller.ts | 372-378 | 15m | 3 fields | 🟡 MEDIUM |
| #7 Distribution Schema | schema.prisma | ~133 | 5m | 5 fields | 🟡 MEDIUM |

**Total Time**: 54 minutes
**Total Fields Recovered**: 32-52 fields (depending on optional choices)

---

## Post-Fix Monitoring

### Metrics to Track:
1. **Submission Success Rate**: Should remain 100%
2. **Field Completeness**: Check MongoDB documents for null fields
3. **Admin Display**: Verify no empty sections
4. **FUGA Export**: Validate audioLanguage and lyrics present
5. **Error Rate**: Monitor for Prisma validation errors

### MongoDB Queries for Validation:
```javascript
// Check track field completeness
db.submissions.find({}, {
  'tracks.lyrics': 1,
  'tracks.audioLanguage': 1,
  'tracks.duration': 1,
  'tracks.musicVideoISRC': 1
})

// Check marketing field completeness
db.submissions.find({}, {
  'marketing.spotifyArtistId': 1,
  'marketing.priorityLevel': 1,
  'marketing.projectType': 1
})

// Check distribution fields
db.submissions.find({}, {
  'release.territorySelection': 1,
  'release.distributionType': 1
})
```

---

## Success Criteria

### Deployment Successful When:
- [x] All Prisma commands run without errors
- [x] TypeScript compilation succeeds (backend & frontend)
- [x] Test submission saves all fields to MongoDB
- [x] Admin display shows previously missing fields
- [x] No regression in existing functionality
- [x] FUGA export includes audioLanguage and lyrics

### Rollback If:
- [ ] Prisma migration fails
- [ ] TypeScript compilation errors
- [ ] Submission endpoint returns 500 errors
- [ ] Data corruption detected in MongoDB
- [ ] Critical functionality broken

---

## Quick Reference: What Gets Fixed

### Critical Track Fields (11):
✅ lyrics, audioLanguage, language, duration
✅ musicVideoISRC, hasMusicVideo, trackNumber
✅ titleTranslations, volume, discNumber

### Critical Marketing Fields (11):
✅ artist_spotify_id → spotifyArtistId (fallback)
✅ artist_apple_id → appleMusicArtistId (fallback)
✅ artist_facebook_url → facebookUrl (fallback)
✅ artist_instagram_handle → instagramUrl (fallback)
✅ priorityLevel, projectType, campaignGoals[]
✅ marketing_genre, marketing_subgenre, pr_line, internal_note

### Critical Distribution Fields (1):
✅ territorySelection{} with DSP overrides

### Medium Priority Fields (6):
✅ distributionType, selectedStores[], excludedStores[]
✅ albumNote
✅ Artist spotifyId, appleId (extracted from array)

---

**NEXT STEP**: Execute Fix #1 and #2 (25 minutes) to recover 22 critical fields immediately.
