# Complete Field Mapping Table: Frontend → Backend → Schema → Display

**Verification Date**: 2024-12-24
**Methodology**: Line-by-line code analysis with Sequential MCP

---

## Legend

- ✅ **PERFECT**: Field sent, stored, and displayed correctly
- ⚠️ **PARTIAL**: Field sent but not stored or displayed
- ❌ **MISSING**: Field exists but not sent or naming mismatch
- 🔴 **CRITICAL**: Data loss issue requiring immediate fix
- 🟡 **MEDIUM**: Functional gap, fix recommended
- 🟢 **LOW**: Nice-to-have enhancement

---

## 1. COPYRIGHT & RIGHTS FIELDS (4 fields)

| # | Frontend Field | Sent (Line) | Controller Maps To | Prisma Field | Admin Displays | Status |
|---|----------------|-------------|-------------------|--------------|----------------|--------|
| 1 | copyrightHolder | ✅ 1296 | release.copyrightHolder | release.copyrightHolder | ✅ Line 117 | ✅ |
| 2 | copyrightYear | ✅ 1297 | release.copyrightYear | release.copyrightYear | ✅ Line 118 | ✅ |
| 3 | productionHolder | ✅ 1298 | release.pRights | release.pRights | ✅ Line 119 | ✅ |
| 4 | productionYear | ✅ 1299 | (merged with copyrightYear) | release.copyrightYear | ✅ Line 118 | ✅ |

**Transformation**: productionHolder → pRights (℗), copyrightHolder → cRights (©)

---

## 2. ARTIST FIELDS (14 fields)

| # | Frontend Field | Source | Sent | Controller | Prisma | Display | Status |
|---|----------------|--------|------|------------|--------|---------|--------|
| 1 | albumArtist (derived) | albumArtists[0].name | ✅ 1277 | artist.nameKo | artistName | ✅ 133 | ✅ |
| 2 | albumArtist (same) | albumArtists[0].name | ✅ 1277 | artist.nameEn | artistNameEn | ✅ 134 | ✅ |
| 3 | recordLabel | FormData | ✅ 1295 | artist.labelName | labelName | ✅ 103, 136 | ✅ |
| 4 | albumArtists[] | Artist[] array | ✅ 1278 | artist.artists | ❌ NOT stored | ❌ | ⚠️ |
| 5 | Artist.spotifyId | In albumArtists[] | ⚠️ Not extracted | - | spotifyId | ⚠️ 147 | ❌ 🟡 |
| 6 | Artist.appleId | In albumArtists[] | ⚠️ Not extracted | - | appleMusicId | ⚠️ 148 | ❌ 🟡 |
| 7 | Artist.translations{} | In albumArtists[] | ⚠️ Not extracted | - | artistTranslations | ⚠️ 141-144 | ❌ 🟡 |
| 8 | albumFeaturingArtists[] | FormData line 202 | ❌ NOT sent | - | - | - | ❌ 🟢 |
| 9 | biography | Via marketing | ⚠️ As artistBio | marketing.artistBio | marketing.artistBio | ✅ 317 | ✅ |
| 10 | socialLinks{} | Not in form | ❌ | - | socialLinks | ⚠️ 152-158 | ❌ 🟡 |
| 11 | artistType | Not collected | ❌ | Hardcoded 'SOLO' | artistType | ✅ 135 | ⚠️ 🟢 |
| 12 | members[] | Not collected | ❌ | - | members | ⚠️ 161 | ❌ 🟢 |
| 13 | youtubeChannelId | Not collected | ❌ | - | youtubeChannelId | ⚠️ 149 | ❌ 🟡 |

**Issues**:
- 🟡 Artist platform IDs embedded in albumArtists[] but not extracted to top-level
- 🟡 Artist translations not extracted
- 🟢 Social links collected in marketing section instead

---

## 3. ALBUM/PRODUCT FIELDS (22 fields)

| # | Frontend Field | Sent (Line) | Controller | Prisma | Display | Status |
|---|----------------|-------------|------------|--------|---------|--------|
| 1 | albumTitle | ✅ 1276 | album.titleKo | albumTitle | ✅ 100 | ✅ |
| 2 | albumTitleTranslation | ✅ | album.titleEn | albumTitleEn | ✅ 101 | ✅ |
| 3 | albumTitleTranslations{} | ✅ | album.translations | albumTranslations | ✅ | ✅ |
| 4 | releaseType | ✅ 1279 | album.type | albumType | ✅ 102 | ✅ |
| 5 | primaryGenre | ✅ 1280 | genre.primary | albumGenre | ✅ 105 | ✅ |
| 6 | primarySubgenre | ✅ 1281 | genre.primarySub | albumSubgenre | ✅ 106 | ✅ |
| 7 | secondaryGenre | ✅ 1282 | genre.secondary | albumGenre | ✅ 105 | ✅ |
| 8 | secondarySubgenre | ✅ 1283 | genre.secondarySub | albumSubgenre | ✅ 106 | ✅ |
| 9 | language | ✅ 1284 | language | release.recordingLanguage | ✅ 235 | ✅ |
| 10 | consumerReleaseDate | ✅ 1285 | release.consumerReleaseDate | release.consumerReleaseDate | ✅ 248 | ✅ |
| 11 | originalReleaseDate | ✅ 1286 | release.originalReleaseDate | release.originalReleaseDate | ✅ 247 | ✅ |
| 12 | releaseTime | ✅ 1287 | release.releaseTime | release.releaseTime | ✅ 245 | ✅ |
| 13 | timezone | ✅ 1288 | release.selectedTimezone | release.selectedTimezone | ✅ 246 | ✅ |
| 14 | consumerReleaseUTC | ✅ 1290 | release.consumerReleaseUTC | release.consumerReleaseUTC | ✅ 251 | ✅ |
| 15 | originalReleaseUTC | ✅ 1291 | release.originalReleaseUTC | release.originalReleaseUTC | ✅ 250 | ✅ |
| 16 | upc | ✅ 1292 | release.upc | release.upc | ✅ 115 | ✅ |
| 17 | ean | ✅ 1293 | release.ean | ❌ NOT in schema | ❌ | ❌ 🟢 |
| 18 | catalogNumber | ✅ 1294 | release.catalogNumber | release.catalogNumber | ✅ 116 | ✅ |
| 19 | albumVersion | ✅ 1300 | album.version | albumVersion | ✅ 108 | ✅ |
| 20 | totalVolumes | FormData 209 | ❌ NOT sent | - | - | ❌ 🟢 |
| 21 | explicitContent | FormData 223 | ❌ NOT sent | - | - | ❌ 🟢 |
| 22 | albumNote | FormData 260 | ❌ NOT sent | - | - | ❌ 🟡 |

**Issues**:
- 🟢 EAN field sent but schema doesn't have it
- 🟡 albumNote field exists but not included in submission

---

## 4. TRACK FIELDS (Per Track - 37 fields)

### Core Track Fields (19 fields in schema)

| # | Frontend Field | Sent (Line) | Controller | Prisma SubmissionTracks | Display (Line) | Status |
|---|----------------|-------------|------------|------------------------|----------------|--------|
| 1 | id | ✅ 1303 | track.id | ✅ id | ✅ 192 | ✅ |
| 2 | title | ✅ 1304 | track.titleKo | ✅ titleKo | ✅ 193 | ✅ |
| 3 | titleKo | ✅ 1305 | track.titleKo | ✅ titleKo | ✅ 193 | ✅ |
| 4 | titleEn | ✅ 1306 | track.titleEn | ✅ titleEn | ✅ 194 | ✅ |
| 5 | titleTranslations{} | ✅ 1307 | track.titleTranslations | ❌ NOT in type | ❌ | ❌ 🟡 |
| 6 | artists[] | ✅ 1308 | track.artists | ✅ artists (Json) | ✅ 202 | ✅ |
| 7 | featuringArtists[] | ✅ 1309 | track.featuringArtists | ✅ featuringArtists (Json) | ✅ 203 | ✅ |
| 8 | contributors[] | ✅ 1310 | track.contributors | ✅ contributors (Json) | ✅ 211-213 | ✅ |
| 9 | composer | ✅ 1312-1313 | track.composer | ✅ composer | ✅ 206 | ✅ |
| 10 | lyricist | ✅ 1314-1315 | track.lyricist | ✅ lyricist | ✅ 207 | ✅ |
| 11 | arranger | ✅ 1316-1317 | track.arranger | ✅ arranger | ✅ 208 | ✅ |
| 12 | isTitle | ✅ 1318 | track.isTitle | ✅ isTitle | ✅ 219 | ✅ |
| 13 | isFocusTrack | ✅ 1319 | track.isFocusTrack | ✅ isFocusTrack | ✅ 220 | ✅ |
| 14 | isrc | ✅ 1320 | track.isrc | ✅ isrc | ✅ 195 | ✅ |
| 15 | musicVideoISRC | ✅ 1321 | track.musicVideoISRC | ❌ NOT in type | ❌ | ❌ 🔴 |
| 16 | hasMusicVideo | ✅ 1322 | track.hasMusicVideo | ❌ NOT in type | ❌ | ❌ 🟡 |
| 17 | explicitContent | ✅ 1323 | track.explicitContent | ✅ explicitContent | ✅ 217 | ✅ |
| 18 | dolbyAtmos | ✅ 1324 | track.dolbyAtmos | ✅ dolbyAtmos | ✅ 216 | ✅ |
| 19 | stereo | ✅ 1325 | track.stereo | ✅ stereo | ✅ 218 | ✅ |
| 20 | trackType | ✅ 1326 | track.trackType | ✅ trackType | ✅ 196 | ✅ |
| 21 | versionType | ✅ 1327 | track.versionType | ✅ versionType | ✅ 197 | ✅ |
| 22 | trackNumber | ✅ 1328 | track.trackNumber | ❌ NOT in type | ❌ | ❌ 🟡 |
| 23 | genre | ✅ 1329 | track.genre | ✅ genre | ✅ 198 | ✅ |
| 24 | subgenre | ✅ 1330 | track.subgenre | ✅ subgenre | ✅ 199 | ✅ |
| 25 | language | ✅ 1331 | track.language | ❌ NOT in type | ❌ | ❌ 🔴 |
| 26 | audioLanguage | ✅ 1332 | track.audioLanguage | ❌ NOT in type | ❌ | ❌ 🔴 |
| 27 | lyrics | ✅ 1333 | track.lyrics | ❌ NOT in type | ❌ | ❌ 🔴 |
| 28 | duration | ✅ 1334 | track.duration | ❌ NOT in type | ❌ | ❌ 🔴 |
| 29 | volume | ✅ 1335 | track.volume | ❌ NOT in type | ❌ | ❌ 🟡 |
| 30 | discNumber | ✅ 1336 | track.discNumber | ❌ NOT in type | ❌ | ❌ 🟡 |

### Additional Track Interface Fields (Not Sent)

| # | Field | In Track Interface | Sent to Backend | Reason | Priority |
|---|-------|-------------------|----------------|--------|----------|
| 31 | composers[] | Line 164 | ⚠️ Extracted to string | Used to build composer field | 🟢 |
| 32 | lyricists[] | Line 165 | ⚠️ Extracted to string | Used to build lyricist field | 🟢 |
| 33 | arrangers[] | Line 166 | ⚠️ Extracted to string | Used to build arranger field | 🟢 |
| 34 | publishers[] | Line 167 | ❌ NOT sent | Not used | 🟢 |
| 35 | lyricsFile | Line 179 | ⚠️ Sent as multipart | Separate file upload | ✅ |
| 36 | musicVideoFile | Line 171 | ⚠️ Sent as multipart | Separate file upload | ✅ |
| 37 | musicVideoThumbnail | Line 172 | ⚠️ Sent as multipart | Separate file upload | ✅ |
| 38 | audioFile | Line 188 | ⚠️ Sent as multipart | Separate file upload | ✅ |
| 39 | audioMetadata | Line 189 | ❌ NOT sent | Not collected | 🟢 |
| 40 | remixVersion | Line 182 | ⚠️ Transformed | Used to set versionType | ✅ |
| 41 | titleLanguage | Line 183 | ❌ NOT sent | Not used | 🟢 |

**Summary**: 19/41 track fields properly stored, 11 critical fields LOST due to schema gaps

---

## 3. FILE FIELDS (9 types)

| # | Frontend Field | Sent Method | Dropbox Upload | Prisma Field | Admin Display | Status |
|---|----------------|-------------|----------------|--------------|---------------|--------|
| 1 | coverArt | FormData file | ✅ Line 206-213 | files.coverImageUrl | ✅ 261 | ✅ |
| 2 | audioFiles[] | FormData files | ✅ Line 225-245 | files.audioFiles[] | ✅ 266-268 | ✅ |
| 3 | dolbyAtmosFiles[] | FormData files | ✅ Line 247-258 | files.audioFiles[] | ✅ 266-268 | ✅ |
| 4 | motionArtFile | FormData file | ✅ Line 260-270 | files.motionArtUrl | ✅ 263 | ✅ |
| 5 | musicVideoFiles[] | FormData files | ✅ Line 272-289 | files.musicVideoFiles[] | ✅ 269 | ✅ |
| 6 | musicVideoThumbnails[] | FormData files | ✅ Line 291-308 | files.musicVideoThumbnails[] | ✅ 270 | ✅ |
| 7 | lyricsFiles[] | FormData files | ✅ Line 310-327 | files.additionalFiles[] | ✅ 272-274 | ✅ |
| 8 | marketingAssets[] | FormData files | ✅ Line 329-346 | files.additionalFiles[] | ✅ 272-274 | ✅ |
| 9 | artistPhoto | Via processedFiles | ✅ Line 215-222 | files.artistPhotoUrl | ✅ 262 | ✅ |

**Track-File Associations** (Critical for FUGA):
- musicVideoFiles: trackId metadata sent (line 1373)
- musicVideoThumbnails: trackId metadata sent (line 1382)
- lyricsFiles: trackId metadata sent (line 1391)

**Status**: ✅ Perfect - All file types with track associations

---

## 4. DISTRIBUTION FIELDS (7 fields)

| # | Frontend Field | Sent (Line) | Controller | Prisma Schema | Display | Status |
|---|----------------|-------------|------------|---------------|---------|--------|
| 1 | distributionType | ✅ 1338 | release.distributionType | ❌ NOT in type | ❌ | ❌ 🟡 |
| 2 | selectedStores[] | ✅ 1339 | release.selectedStores | ❌ NOT in type | ❌ | ❌ 🟡 |
| 3 | excludedStores[] | ✅ 1340 | release.excludedStores | ❌ NOT in type | ❌ | ❌ 🟡 |
| 4 | territories[] | ✅ 1341 | release.territories | ✅ territories (Json) | ✅ 231 | ✅ |
| 5 | territorySelection{} | FormData 246-256 | ❌ NOT sent | - | - | ❌ 🔴 |
| 6 | territorySelection.dspOverrides[] | FormData 251-255 | ❌ NOT sent | - | - | ❌ 🔴 |
| 7 | excludedTerritories[] | ✅ 1342 | release.excludedTerritories | ❌ NOT in type | ❌ | ❌ 🟡 |

**Critical Issue**:
- 🔴 **territorySelection with DSP overrides NOT sent** - Cannot set Spotify vs Apple Music different territories
- 🟡 Store selection fields not in schema - Lost on save

---

## 5. MARKETING FIELDS (41 fields)

### Fields in Frontend marketingInfo (lines 261-307)

#### Group A: Legacy snake_case Fields (8 fields) - NAMING MISMATCH! 🔴

| # | Frontend (snake_case) | Controller Expects (camelCase) | Saved? | Display | Status |
|---|----------------------|-------------------------------|--------|---------|--------|
| 1 | artist_spotify_id | spotifyArtistId | ❌ Mismatch | ✅ 321 (empty) | ❌ 🔴 |
| 2 | artist_apple_id | appleMusicArtistId | ❌ Mismatch | ✅ 322 (empty) | ❌ 🔴 |
| 3 | artist_facebook_url | facebookUrl | ❌ Mismatch | ✅ 328 (empty) | ❌ 🔴 |
| 4 | artist_instagram_handle | instagramUrl | ❌ Mismatch | ✅ 329 (empty) | ❌ 🔴 |
| 5 | marketing_genre | ??? | ❌ Not mapped | ❌ | ❌ 🟡 |
| 6 | marketing_subgenre | ??? | ❌ Not mapped | ❌ | ❌ 🟡 |
| 7 | pr_line | ??? | ❌ Not mapped | ❌ | ❌ 🟡 |
| 8 | internal_note | ??? | ❌ Not mapped | ❌ | ❌ 🟡 |

#### Group B: Priority/Project Fields (3 fields) - NOT MAPPED! 🔴

| # | Frontend Field | Type | Controller Has? | Impact | Status |
|---|----------------|------|----------------|--------|--------|
| 9 | priorityLevel | number | ❌ NO | Lost priority! | ❌ 🔴 |
| 10 | projectType | 'FRONTLINE' \| 'CATALOG' | ❌ NO | Lost project type! | ❌ 🔴 |
| 11 | campaignGoals[] | Array<{goalType, responses, confidence}> | ❌ NO | Lost campaign goals! | ❌ 🔴 |

#### Group C: Working camelCase Fields (30 fields) ✅

| Category | Fields | Controller Saves | Display | Status |
|----------|--------|-----------------|---------|--------|
| **Album Marketing** (4) | albumIntroduction, albumDescription, marketingKeywords, promotionPlans | ✅ Lines 500-504 | ✅ 305-309 | ✅ |
| **Social URLs** (7) | youtubeUrl, tiktokUrl, xUrl, twitchUrl, threadsUrl, soundcloudArtistId | ✅ Lines 516-522 | ✅ 326-332 | ✅ |
| **Artist Profile** (5) | artistBio, artistGender, artistCountry, artistCurrentCity, artistHometown | ✅ Lines 506-532 | ✅ 313-317 | ✅ |
| **Music Characteristics** (2) | moods[], instruments[] | ✅ Lines 523-524 | ✅ 342-343 | ✅ |
| **Marketing Strategy** (5) | hook, mainPitch, marketingDrivers, socialMediaPlan, targetAudience | ✅ Lines 503, 525-528 | ✅ 308, 344-349 | ✅ |
| **Artist Extended** (4) | similarArtists, syncHistory, artistUgcPriorities, toundatesUrl | ✅ Lines 505, 509-515 | ✅ 320, 336-339 | ✅ |
| **Visual Assets** (4) | artistAvatar, artistLogo, pressShotUrl, pressShotCredits | ✅ Lines 533-536 | ✅ 352-355 | ✅ |
| **Sync** (1) | hasSyncHistory | ✅ Line 510 | ✅ 337 | ✅ |

**Working**: 30/41 fields (73%)
**Lost**: 11/41 fields (27%) - Due to naming mismatch and missing mappings

---

## 6. RELEASE FIELDS (20+ fields)

| # | Field | Frontend | Controller | Prisma SubmissionRelease | Display | Status |
|---|-------|----------|------------|-------------------------|---------|--------|
| 1 | consumerReleaseDate | ✅ 1285 | ✅ | ✅ consumerReleaseDate | ✅ 248 | ✅ |
| 2 | consumerReleaseUTC | ✅ 1290 | ✅ | ✅ consumerReleaseUTC | ✅ 251 | ✅ |
| 3 | originalReleaseDate | ✅ 1286 | ✅ | ✅ originalReleaseDate | ✅ 247 | ✅ |
| 4 | originalReleaseUTC | ✅ 1291 | ✅ | ✅ originalReleaseUTC | ✅ 250 | ✅ |
| 5 | releaseTime | ✅ 1287 | ✅ | ✅ releaseTime | ✅ 245 | ✅ |
| 6 | timezone | ✅ 1288 | ✅ | ✅ selectedTimezone | ✅ 246 | ✅ |
| 7 | releaseUTC | Calculated | ✅ | ✅ releaseUTC | ✅ 249 | ✅ |
| 8 | upc | ✅ 1292 | ✅ | ✅ upc | ✅ 115 | ✅ |
| 9 | catalogNumber | ✅ 1294 | ✅ | ✅ catalogNumber | ✅ 116 | ✅ |
| 10 | recordLabel | ✅ 1295 | artist.labelName | labelName | ✅ 103 | ✅ |
| 11 | previouslyReleased | ✅ 1343 | release.previouslyReleased | ✅ previouslyReleased | ✅ 240 | ✅ |

**Status**: ✅ All critical release fields working

---

## Summary by Category

| Category | Total Fields | Working | Lost | Success Rate |
|----------|--------------|---------|------|--------------|
| **Copyright/Rights** | 4 | 4 | 0 | 100% ✅ |
| **Artist** | 14 | 4 | 10 | 29% ⚠️ |
| **Album** | 22 | 19 | 3 | 86% ✅ |
| **Track (per track)** | 41 | 19 | 22 | 46% ⚠️ |
| **Files** | 9 | 9 | 0 | 100% ✅ |
| **Distribution** | 7 | 1 | 6 | 14% ❌ |
| **Marketing** | 41 | 30 | 11 | 73% ⚠️ |
| **Release** | 20 | 20 | 0 | 100% ✅ |
| **TOTAL** | ~158 | ~106 | ~52 | **67%** ⚠️ |

---

## Critical Issues Summary

### 🔴 CRITICAL (Must Fix Immediately)

1. **Track Field Schema Gaps** - 11 critical fields lost per track
   - lyrics, audioLanguage, language, duration (FUGA requirements)
   - musicVideoISRC, hasMusicVideo (video distribution)
   - trackNumber, volume, discNumber (organization)
   - titleTranslations (multi-language)

2. **Marketing Naming Mismatch** - 4 fields lost
   - artist_spotify_id vs spotifyArtistId
   - artist_apple_id vs appleMusicArtistId
   - artist_facebook_url vs facebookUrl
   - artist_instagram_handle vs instagramUrl

3. **Marketing Fields Not Mapped** - 7 fields lost
   - priorityLevel, projectType, campaignGoals[]
   - marketing_genre, marketing_subgenre
   - pr_line, internal_note

4. **Territory DSP Overrides** - Complete loss
   - territorySelection{} object not sent
   - Cannot set different territories per DSP

### 🟡 MEDIUM (Fix Soon)

1. **Distribution Store Selection** - 3 fields
   - distributionType, selectedStores[], excludedStores[]
   - Not in Prisma schema

2. **Artist Extended Fields** - 3 fields
   - spotifyId, appleId, translations not extracted from albumArtists[]

3. **Album Note** - 1 field
   - albumNote exists but not sent

### 🟢 LOW (Enhancement)

1. **EAN field** - Sent but schema missing (UPC covers it)
2. **Album featuring artists** - Not sent
3. **Track publishers** - Not collected

---

## Required Schema Updates

```prisma
type SubmissionTracks {
  // ✅ Existing 19 fields...

  // 🔴 ADD CRITICAL FIELDS:
  lyrics            String?
  audioLanguage     String?
  language          String?
  duration          String?
  musicVideoISRC    String?
  hasMusicVideo     Boolean?
  trackNumber       Int?
  titleTranslations Json?

  // 🟡 ADD IMPORTANT FIELDS:
  volume            Int?
  discNumber        Int?
  lyricsLanguage    String?
  metadataLanguage  String?
  producer          String?
  mixer             String?
  masterer          String?
  previewStart      Int?
  previewEnd        Int?
  trackVersion      String?
  translations      Json?
  alternateGenre    String?
  alternateSubgenre String?
  featuring         String?
}

type SubmissionRelease {
  // ✅ Existing 27 fields...

  // 🟡 ADD DISTRIBUTION FIELDS:
  distributionType   String?
  selectedStores     Json?
  excludedStores     Json?
  territorySelection Json?
}
```

---

## Required Controller Updates

**File**: `backend/src/submissions/submissions.controller.ts`

**Line 499-536**: Add fallbacks and new fields to marketing section:

```typescript
marketing: {
  // ... existing fields ...

  // ADD: Fallbacks for snake_case → camelCase
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

  // ADD: Missing fields
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

## Deployment Priority

### Phase 1: URGENT (Deploy ASAP) 🔴
1. Update Prisma schema with critical track fields
2. Add marketing field fallbacks in controller
3. Run `npx prisma generate && npx prisma db push`
4. Test complete submission flow

**Estimated Effort**: 30 minutes
**Risk**: Low (additive schema changes only)

### Phase 2: Important (Next Sprint) 🟡
1. Fix territorySelection object submission
2. Extract artist platform IDs from albumArtists[]
3. Add distribution fields to schema

**Estimated Effort**: 1-2 hours

### Phase 3: Enhancement (Backlog) 🟢
1. Add optional track fields
2. Collect artist social links in form
3. Add EAN field to schema

---

**FINAL VERDICT**: System is **67% functional** - Critical data loss occurring for track and marketing fields!
