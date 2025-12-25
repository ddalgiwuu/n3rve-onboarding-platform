# 🚨 CRITICAL: Marketing Field Naming Mismatch

## Issue Discovery

**Date**: 2024-12-24
**Severity**: 🔴 **CRITICAL**
**Impact**: Marketing data loss due to field name mismatch

---

## The Problem

**Frontend uses SNAKE_CASE** for some marketing fields:
```typescript
marketingInfo?: {
  artist_spotify_id?: string      // snake_case
  artist_apple_id?: string        // snake_case
  artist_facebook_url?: string    // snake_case
  artist_instagram_handle?: string // snake_case
  marketing_genre?: string        // snake_case
  marketing_subgenre?: string     // snake_case
  pr_line?: string                // snake_case
  internal_note?: string          // snake_case

  // But also uses camelCase:
  priorityLevel?: number          // camelCase
  projectType?: string            // camelCase
  albumIntroduction?: string      // camelCase
  // ... etc
}
```

**Backend Controller expects CAMELCASE** everywhere:
```typescript
marketing: {
  spotifyArtistId: submissionData.marketingInfo?.spotifyArtistId,  // camelCase
  appleMusicArtistId: submissionData.marketingInfo?.appleMusicArtistId,  // camelCase
  // etc...
}
```

**Result**: Fields with snake_case names are NOT saved because controller looks for camelCase!

---

## Field Name Mapping Issues

### Fields with Naming Mismatch

| Frontend (snake_case) | Controller Expects (camelCase) | Status | Impact |
|----------------------|-------------------------------|--------|--------|
| `artist_spotify_id` | `spotifyArtistId` | ❌ MISMATCH | Lost Spotify ID! |
| `artist_apple_id` | `appleMusicArtistId` | ❌ MISMATCH | Lost Apple Music ID! |
| `artist_facebook_url` | `facebookUrl` | ❌ MISMATCH | Lost Facebook URL! |
| `artist_instagram_handle` | `instagramUrl` | ❌ MISMATCH | Lost Instagram! |
| `marketing_genre` | ??? | ❌ NOT MAPPED | Lost marketing genre! |
| `marketing_subgenre` | ??? | ❌ NOT MAPPED | Lost marketing subgenre! |
| `pr_line` | ??? | ❌ NOT MAPPED | Lost PR line! |
| `internal_note` | ??? | ❌ NOT MAPPED | Lost internal notes! |

### Fields Not in Controller At All

| Frontend Field | Type | Controller Has? | Impact |
|----------------|------|----------------|--------|
| priorityLevel | number | ❌ NO | Lost priority! |
| projectType | 'FRONTLINE' \| 'CATALOG' | ❌ NO | Lost project type! |
| campaignGoals[] | Array | ❌ NO | Lost campaign goals! |

---

## Complete Marketing Field Audit

### Frontend marketingInfo Fields (lines 261-307): 41 fields

**Group 1: Legacy snake_case (8 fields)** ❌ NOT MAPPED:
1. artist_spotify_id → Should be spotifyArtistId ✅ (controller has it)
2. artist_apple_id → Should be appleMusicArtistId ✅ (controller has it)
3. artist_facebook_url → Should be facebookUrl ✅ (controller has it)
4. artist_instagram_handle → Should be instagramUrl ✅ (controller has it)
5. marketing_genre → ❌ Controller doesn't save
6. marketing_subgenre → ❌ Controller doesn't save
7. pr_line → ❌ Controller doesn't save
8. internal_note → ❌ Controller doesn't save

**Group 2: New Marketing Fields (11 fields)** ⚠️ PARTIAL:
1. priorityLevel → ❌ Controller doesn't save
2. projectType → ❌ Controller doesn't save
3. moods[] → ✅ Saved (line 523)
4. instruments[] → ✅ Saved (line 524)
5. hook → ✅ Saved (line 525)
6. mainPitch → ✅ Saved (line 526)
7. marketingDrivers[] → ✅ Saved (line 527)
8. socialMediaPlan → ✅ Saved (line 528)
9. targetAudience → ✅ Saved (line 503)
10. similarArtists[] → ✅ Saved (line 509)
11. campaignGoals[] → ❌ Controller doesn't save

**Group 3: Album Marketing (3 fields)** ✅ ALL SAVED:
1. albumIntroduction → ✅ Saved (line 500)
2. albumDescription → ✅ Saved (line 501)
3. marketingKeywords → ✅ Saved (line 502)
4. promotionPlans → ✅ Saved (line 504)

**Group 4: Social Media URLs (7 fields)** ✅ ALL SAVED:
1. youtubeUrl → ✅ Saved (line 516)
2. tiktokUrl → ✅ Saved (line 517)
3. xUrl → ✅ Saved (line 520)
4. twitchUrl → ✅ Saved (line 521)
5. threadsUrl → ✅ Saved (line 522)
6. facebookUrl → ✅ Saved (line 518) - Maps from artist_facebook_url
7. instagramUrl → ✅ Saved (line 519) - Maps from artist_instagram_handle
8. soundcloudArtistId → ✅ Saved (line 514)

**Group 5: Artist Info (4 fields)** ✅ ALL SAVED:
1. artistBio → ✅ Saved (line 508)
2. artistGender → ✅ Saved (line 506)
3. socialMovements[] → ✅ Saved (line 507)
4. syncHistory → ✅ Saved (line 511)

**Group 6: Artist Extended (6 fields)** ✅ ALL SAVED:
1. artistCountry → ✅ Saved (line 530)
2. artistCurrentCity → ✅ Saved (line 531)
3. artistHometown → ✅ Saved (line 532)
4. artistAvatar → ✅ Saved (line 533)
5. artistLogo → ✅ Saved (line 534)
6. toundatesUrl → ✅ Saved (line 505)

**Group 7: Other (3 fields)** ✅ ALL SAVED:
1. hasSyncHistory → ✅ Saved (line 510)
2. artistUgcPriorities → ✅ Saved (line 515)
3. pressShotUrl → ✅ Saved (line 535)
4. pressShotCredits → ✅ Saved (line 536)

---

## Actual Status After Deep Analysis

**Wait!** Let me re-check if the naming is actually a problem...

Looking at the controller code more carefully:
- Controller accesses `submissionData.marketingInfo?.spotifyArtistId` (camelCase)
- Frontend sends `marketingInfo.artist_spotify_id` (snake_case)

This means the controller is looking for the WRONG field name!

**OR** - maybe the frontend transforms snake_case to camelCase before sending?

Need to check the actual marketingInfo structure that gets stringified and sent.

---

## Key Question

Does the frontend transform field names before sending, or send them as-is?

Looking at line 1344:
```javascript
marketingInfo: formData.marketingInfo
```

It sends the ENTIRE marketingInfo object as-is without transformation!

So if the form uses `artist_spotify_id`, that's what gets sent to the backend.

But the controller looks for `spotifyArtistId` (camelCase).

**MISMATCH CONFIRMED!**

---

## Fields Lost Due to Naming Mismatch

### Confirmed Lost (8 fields):

1. **artist_spotify_id** → Controller looks for spotifyArtistId ❌
2. **artist_apple_id** → Controller looks for appleMusicArtistId ❌
3. **artist_facebook_url** → Controller looks for facebookUrl ❌
4. **artist_instagram_handle** → Controller looks for instagramUrl ❌
5. **marketing_genre** → Controller doesn't check for this ❌
6. **marketing_subgenre** → Controller doesn't check for this ❌
7. **pr_line** → Controller doesn't check for this ❌
8. **internal_note** → Controller doesn't check for this ❌

### Fields Never Checked (3 fields):

9. **priorityLevel** → Controller doesn't have this field ❌
10. **projectType** → Controller doesn't have this field ❌
11. **campaignGoals[]** → Controller doesn't have this field ❌

**Total Lost**: 11 marketing fields!

---

## Solution Options

### Option A: Fix Frontend (Change field names to camelCase)

**Pros**: Matches backend expectations
**Cons**: Requires form updates

```typescript
// Change from:
artist_spotify_id?: string

// To:
spotifyArtistId?: string
```

### Option B: Fix Backend (Map both naming conventions)

**Pros**: No frontend changes needed
**Cons**: More complex mapping logic

```typescript
marketing: {
  spotifyArtistId:
    submissionData.marketingInfo?.spotifyArtistId ||
    submissionData.marketingInfo?.artist_spotify_id,  // Fallback
  // etc...
}
```

### Option C: Hybrid (Recommended)

1. Keep existing fields working with fallbacks
2. Add new fields that controller doesn't have
3. Deprecate snake_case over time

```typescript
marketing: {
  // Existing - add fallbacks
  spotifyArtistId:
    submissionData.marketingInfo?.spotifyArtistId ||
    submissionData.marketingInfo?.artist_spotify_id,

  // New fields - add these
  priorityLevel: submissionData.marketingInfo?.priorityLevel,
  projectType: submissionData.marketingInfo?.projectType,
  campaignGoals: submissionData.marketingInfo?.campaignGoals,
  prLine: submissionData.marketingInfo?.pr_line,
  internalNote: submissionData.marketingInfo?.internal_note,
  marketingGenre: submissionData.marketingInfo?.marketing_genre,
  marketingSubgenre: submissionData.marketingInfo?.marketing_subgenre,
}
```

---

## Immediate Fix Required

**File**: `backend/src/submissions/submissions.controller.ts`
**Location**: Lines 499-536 (marketing section)

**Add these fields**:
```typescript
marketing: {
  // ... existing fields ...

  // Add fallbacks for snake_case fields
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

  // Add missing fields
  priorityLevel: submissionData.marketingInfo?.priorityLevel,
  projectType: submissionData.marketingInfo?.projectType,
  campaignGoals: submissionData.marketingInfo?.campaignGoals,
  prLine: submissionData.marketingInfo?.pr_line,
  internalNote: submissionData.marketingInfo?.internal_note,
  marketingGenre: submissionData.marketingInfo?.marketing_genre,
  marketingSubgenre: submissionData.marketingInfo?.marketing_subgenre,
}
```

---

## Priority

**CRITICAL**: Fix before next production deployment
**Effort**: 10 minutes
**Risk**: Low (additive changes only)
**Impact**: Prevents data loss for 11 marketing fields

---

**Next Steps**:
1. Apply controller fix
2. Test with actual form submission
3. Verify all 41 marketing fields stored
4. Check admin display shows all fields
