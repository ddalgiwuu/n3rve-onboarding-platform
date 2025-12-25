# Field Flow Diagram: Complete Data Journey

**Visual representation of data flow from consumer form to admin display**

---

## Data Flow Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                    CONSUMER FORM (Frontend)                     │
│  ImprovedReleaseSubmissionWithDnD.tsx                          │
│  Lines 193-308: FormData Interface                             │
├────────────────────────────────────────────────────────────────┤
│  📋 FormData Interface: 158 total fields                       │
│  ├─ Album: 22 fields                                           │
│  ├─ Artist: 14 fields (albumArtists[] with nested data)        │
│  ├─ Tracks: 41 fields × N tracks                               │
│  ├─ Files: 9 file types                                        │
│  ├─ Distribution: 7 fields                                     │
│  ├─ Marketing: 41 fields                                       │
│  └─ Release: 20+ fields                                        │
└─────────────────────────┬──────────────────────────────────────┘
                          │
                          │ handleSubmit() - Lines 1275-1399
                          │ Creates FormData with:
                          │ - releaseData: JSON string
                          │ - files: Multipart uploads
                          │
                          ↓
┌────────────────────────────────────────────────────────────────┐
│                 BACKEND CONTROLLER (Transform)                  │
│  submissions.controller.ts                                     │
│  Lines 78-540: Parse & Transform                               │
├────────────────────────────────────────────────────────────────┤
│  🔄 Phase 1: Parse releaseData JSON (lines 78-124)            │
│  ├─ Extract: albumArtist → artist.nameKo/nameEn               │
│  ├─ Extract: recordLabel → artist.labelName                   │
│  ├─ Extract: albumArtists[] → artist.artists                  │
│  ├─ Extract: albumTitle → album.titleKo/titleEn               │
│  ├─ Extract: primaryGenre/Subgenre → genre object             │
│  └─ Extract: marketingInfo → marketingInfo object             │
│                                                                │
│  🔄 Phase 2: Process Files (lines 153-358)                    │
│  ├─ Upload to Dropbox via FilesService                        │
│  ├─ Generate Dropbox URLs                                     │
│  └─ Map track-file associations via trackId                   │
│                                                                │
│  🔄 Phase 3: Build Prisma Data (lines 360-540)                │
│  ├─ Artist: nameKo → artistName (line 372)                    │
│  ├─ Album: titleKo → albumTitle (line 380)                    │
│  ├─ Tracks: map 28 fields (lines 394-428) ⚠️ Schema has 19   │
│  ├─ Files: map all Dropbox URLs (lines 432-459)               │
│  ├─ Release: map all date/territory fields (lines 461-497)    │
│  └─ Marketing: map 30/41 fields (lines 499-536) ⚠️ Missing 11│
└─────────────────────────┬──────────────────────────────────────┘
                          │
                          │ Prisma Client
                          │ submission.create()
                          │
                          ↓
┌────────────────────────────────────────────────────────────────┐
│                    PRISMA DATABASE (MongoDB)                    │
│  schema.prisma                                                 │
│  Lines 213-262: Submission Model                               │
├────────────────────────────────────────────────────────────────┤
│  💾 Submission Model (main fields):                            │
│  ├─ artistName, artistNameEn, labelName                       │
│  ├─ albumTitle, albumTitleEn, albumType                       │
│  ├─ genre, albumGenre, albumSubgenre                          │
│  ├─ releaseDate, albumVersion, releaseVersion                 │
│  ├─ files: SubmissionFiles (composite type)                   │
│  ├─ tracks: SubmissionTracks[] (composite type)               │
│  ├─ release: SubmissionRelease (composite type)               │
│  ├─ marketing: Json (all 30 fields that work)                 │
│  └─ Extended: artistTranslations, biography, socialLinks,     │
│               spotifyId, appleMusicId, etc.                   │
│                                                                │
│  💾 SubmissionTracks Type (19 fields):                        │
│  ├─ ✅ id, titleKo, titleEn                                   │
│  ├─ ✅ artists, featuringArtists, contributors (Json)         │
│  ├─ ✅ composer, lyricist, arranger                           │
│  ├─ ✅ isTitle, isFocusTrack, isrc                            │
│  ├─ ✅ dolbyAtmos, stereo, explicitContent                    │
│  ├─ ✅ trackType, versionType                                 │
│  ├─ ✅ genre, subgenre                                        │
│  └─ ❌ MISSING: lyrics, audioLanguage, language, duration,    │
│                 musicVideoISRC, trackNumber, titleTranslations│
│                                                                │
│  💾 SubmissionRelease Type (27 fields):                       │
│  ├─ ✅ All date/time fields with UTC conversion               │
│  ├─ ✅ copyrightHolder, copyrightYear, cRights, pRights       │
│  ├─ ✅ territories, recordingCountry, recordingLanguage       │
│  ├─ ✅ upc, catalogNumber                                     │
│  ├─ ✅ moods[], instruments[]                                 │
│  └─ ❌ MISSING: distributionType, selectedStores,             │
│                 excludedStores, territorySelection            │
│                                                                │
│  💾 SubmissionFiles Type (complete):                          │
│  └─ ✅ All file types with Dropbox URLs                       │
└─────────────────────────┬──────────────────────────────────────┘
                          │
                          │ API Response
                          │ GET /submissions/:id
                          │
                          ↓
┌────────────────────────────────────────────────────────────────┐
│                   ADMIN DISPLAY (Frontend)                      │
│  SubmissionDetailView.tsx                                      │
│  Lines 91-359: getSections()                                   │
├────────────────────────────────────────────────────────────────┤
│  📊 8 Sections Display ALL Stored Data:                        │
│                                                                │
│  1️⃣ Product Section (lines 95-122)                            │
│     ✅ Album title, type, genre, subgenre                      │
│     ✅ UPC, catalog number                                     │
│     ✅ Copyright holder, year, ℗/© rights                      │
│                                                                │
│  2️⃣ Artist Section (lines 124-163)                            │
│     ✅ Artist name (Ko/En), label, biography                   │
│     ✅ Translations (ja, zh, es)                               │
│     ✅ Platform IDs (Spotify, Apple, YouTube)                  │
│     ✅ Social links (all platforms)                            │
│     ⚠️  Shows fields even if empty (spotifyId not extracted)  │
│                                                                │
│  3️⃣ Tracks Summary (lines 165-178)                            │
│     ✅ Total tracks, Dolby Atmos count                         │
│     ✅ Title tracks, focus tracks, explicit count              │
│                                                                │
│  4️⃣ Individual Track Sections × N (lines 180-223)             │
│     ✅ Track number, titles (Ko/En), ISRC                      │
│     ✅ Track type, version, genre, subgenre                    │
│     ✅ Artists, featuring, contributors                        │
│     ✅ Composer, lyricist, arranger                            │
│     ✅ Dolby Atmos, explicit, stereo flags                     │
│     ✅ Title track, focus track flags                          │
│     ❌ Missing: lyrics, audioLanguage, duration (not in DB)   │
│                                                                │
│  5️⃣ Distribution Section (lines 225-253)                      │
│     ✅ Territories, territory type                             │
│     ✅ Recording country, language                             │
│     ✅ Release format, price type                              │
│     ✅ All date/time/UTC fields                                │
│     ✅ All boolean flags                                       │
│                                                                │
│  6️⃣ Files Section (lines 255-276)                             │
│     ✅ All file URLs with Dropbox links                        │
│     ✅ File counts, names, sizes                               │
│     ✅ Audio file preview player                               │
│                                                                │
│  7️⃣ Review Status (lines 278-293)                             │
│     ✅ Status, submitter info                                  │
│     ✅ Timestamps, reviewer, admin notes                       │
│                                                                │
│  8️⃣ Marketing Section (lines 295-357) - 33 fields             │
│     ✅ Album intro, description, keywords                      │
│     ✅ Artist bio, gender, location                            │
│     ✅ Platform IDs (Spotify, Apple, SoundCloud)               │
│     ✅ Social URLs (7 platforms)                               │
│     ✅ Music characteristics (moods, instruments)              │
│     ✅ Marketing strategy (hook, pitch, drivers)               │
│     ✅ Visual assets (avatar, logo, press shots)               │
│     ⚠️  Shows empty for fields with naming mismatch           │
└────────────────────────────────────────────────────────────────┘
```

---

## Critical Path Analysis

### ✅ WORKING PATH (Copyright Example)

```
Frontend FormData
├─ copyrightHolder: "N3RVE Music"
├─ copyrightYear: "2024"
├─ productionHolder: "N3RVE Studios"
└─ productionYear: "2024"
        ↓
handleSubmit (line 1296-1299)
├─ releaseData.copyrightHolder
├─ releaseData.copyrightYear
├─ releaseData.productionHolder
└─ releaseData.productionYear
        ↓
Controller (line 461-479)
├─ release.copyrightHolder ← data.copyrightHolder
├─ release.copyrightYear ← data.copyrightYear
├─ release.cRights ← data.copyrightHolder
└─ release.pRights ← data.productionHolder
        ↓
Prisma Save
├─ release.copyrightHolder: "N3RVE Music"
├─ release.copyrightYear: "2024"
├─ release.cRights: "N3RVE Music"
└─ release.pRights: "N3RVE Studios"
        ↓
Admin Display (lines 117-120)
├─ "Copyright Holder": "N3RVE Music"
├─ "Copyright Year": "2024"
├─ "Copyright (©)": "N3RVE Music"
└─ "Copyright (℗)": "N3RVE Studios"
```

**Result**: ✅ Perfect - All 4 fields correctly mapped and displayed

---

### ❌ BROKEN PATH (Track Lyrics Example)

```
Frontend FormData
└─ tracks[0].lyrics: "여기 가사 내용..."
        ↓
handleSubmit (line 1333)
└─ tracks[0].lyrics: "여기 가사 내용..."
        ↓
Controller (line 416)
└─ track.lyrics: "여기 가사 내용..."
        ↓
Prisma Schema SubmissionTracks Type
└─ ❌ NO 'lyrics' FIELD!
        ↓
MongoDB
└─ ❌ Field REJECTED by Prisma
        ↓
Admin Display
└─ ❌ Cannot display non-existent data
```

**Result**: ❌ **DATA LOST** - Lyrics never saved to database!

---

### ❌ BROKEN PATH (Marketing Spotify ID Example)

```
Frontend FormData
└─ marketingInfo.artist_spotify_id: "spotify:artist:abc123"
        ↓
handleSubmit (line 1344)
└─ marketingInfo: { artist_spotify_id: "spotify:artist:abc123" }
        ↓
Controller (line 512)
└─ Looks for: marketingInfo.spotifyArtistId  ← WRONG NAME!
        ↓
Result
└─ undefined (field name mismatch)
        ↓
Prisma Save
└─ marketing.spotifyArtistId: null
        ↓
Admin Display (line 321)
└─ "Spotify Artist ID": "" (empty)
```

**Result**: ❌ **DATA LOST** - Field name mismatch causes null save!

---

## Field Loss Points

### Loss Point #1: Frontend Doesn't Send
- territorySelection{} - Not included in handleSubmit
- albumNote - Not included in releaseData JSON
- albumFeaturingArtists[] - Not sent to backend

**Impact**: 🔴 Immediate data loss at submission

---

### Loss Point #2: Schema Doesn't Accept
- Track fields: lyrics, audioLanguage, language, duration, musicVideoISRC, trackNumber, etc.
- Distribution: distributionType, selectedStores[], excludedStores[]
- Album: EAN field

**Impact**: 🔴 Prisma rejects fields, data lost at database save

---

### Loss Point #3: Field Name Mismatch
- artist_spotify_id vs spotifyArtistId
- artist_apple_id vs appleMusicArtistId
- artist_facebook_url vs facebookUrl
- artist_instagram_handle vs instagramUrl

**Impact**: 🔴 Controller can't find fields due to naming convention difference

---

### Loss Point #4: Controller Doesn't Map
- priorityLevel, projectType, campaignGoals[]
- marketing_genre, marketing_subgenre
- pr_line, internal_note

**Impact**: 🔴 Controller doesn't check for these fields, lost even if sent

---

## Success Paths (What Works)

### ✅ Success Path #1: File Uploads

```
Consumer uploads file → Multer intercepts → Dropbox upload →
URL stored in Prisma → Admin fetches from Dropbox → Preview displayed
```

**Works for**: All 9 file types with perfect track associations

---

### ✅ Success Path #2: UTC Conversion

```
Frontend: date + time + timezone → convertToUTC() →
Backend: receives UTC DateTime → Prisma stores →
Admin: displays both local and UTC times
```

**Works for**: All 3 release date fields (consumer, original, release)

---

### ✅ Success Path #3: Copyright Transformation

```
Frontend: copyrightHolder + productionHolder →
Controller: maps to cRights + pRights →
Prisma: stores all 4 fields →
Admin: displays with ℗ and © symbols
```

**Works for**: All copyright/rights fields

---

## Fix Strategy Visualization

### Current State (67% Functional)

```
158 Total Fields
├─ 106 Working ✅ (67%)
│  ├─ Copyright/Rights: 4/4 ✅
│  ├─ Files: 9/9 ✅
│  ├─ Release Dates: 11/11 ✅
│  ├─ Basic Tracks: 19/41 ⚠️
│  ├─ Marketing: 30/41 ⚠️
│  └─ Basic Album: 19/22 ⚠️
│
└─ 52 Lost/Broken ❌ (33%)
   ├─ Track Schema Gaps: 11 fields 🔴
   ├─ Marketing Naming: 4 fields 🔴
   ├─ Marketing Not Mapped: 7 fields 🔴
   ├─ Territory DSP: 1 complex object 🔴
   ├─ Distribution: 3 fields 🟡
   └─ Artist Extended: 26 fields 🟡
```

### After Quick Fix (90% Functional)

```
158 Total Fields
├─ 142 Working ✅ (90%)
│  ├─ Track fields: +11 recovered
│  ├─ Marketing: +11 recovered (fallbacks + new fields)
│  └─ Territory: +1 (territorySelection sent)
│
└─ 16 Remaining ❌ (10%)
   └─ Artist extended, distribution store selection, optional fields
```

### After Full Fix (99% Functional)

```
158 Total Fields
├─ 156 Working ✅ (99%)
│  ├─ All critical fields
│  ├─ All important fields
│  └─ Most optional fields
│
└─ 2 Remaining ❌ (1%)
   └─ True optional enhancements
```

---

## Field Mapping Matrix

### Color Code:
- 🟩 GREEN: Perfect mapping (100%)
- 🟨 YELLOW: Partial mapping (50-99%)
- 🟥 RED: Broken/Lost (<50%)

```
┌───────────────────┬──────────┬──────────┬──────────┬──────────┐
│ Category          │ Frontend │ Backend  │ Prisma   │ Display  │
├───────────────────┼──────────┼──────────┼──────────┼──────────┤
│ Copyright/Rights  │    🟩    │    🟩    │    🟩    │    🟩    │
│ Files             │    🟩    │    🟩    │    🟩    │    🟩    │
│ Release Dates     │    🟩    │    🟩    │    🟩    │    🟩    │
│ Album             │    🟩    │    🟩    │    🟨    │    🟨    │
│ Marketing         │    🟩    │    🟨    │    🟩    │    🟨    │
│ Tracks            │    🟩    │    🟩    │    🟥    │    🟥    │
│ Artist            │    🟨    │    🟥    │    🟩    │    🟥    │
│ Distribution      │    🟨    │    🟨    │    🟥    │    🟥    │
└───────────────────┴──────────┴──────────┴──────────┴──────────┘
```

---

## Testing Evidence Trail

### To Verify Fix Effectiveness:

**1. Create Test Submission**
```javascript
// Populate ALL fields with test data
marketingInfo: {
  artist_spotify_id: "test_spotify_123",
  priorityLevel: 5,
  projectType: "FRONTLINE",
  campaignGoals: [{goalType: "streams", responses: ["1M"], confidence: 0.8}]
}

tracks: [{
  lyrics: "Test lyrics content",
  audioLanguage: "Korean",
  duration: "3:45",
  musicVideoISRC: "USTEST12345"
}]
```

**2. Verify Database**
```javascript
// Check MongoDB document
db.submissions.findOne({}, {marketing: 1, tracks: 1})

// Should show:
marketing: {
  spotifyArtistId: "test_spotify_123",  // ✅ After fix
  priorityLevel: 5,                      // ✅ After fix
  projectType: "FRONTLINE"               // ✅ After fix
}

tracks: [{
  lyrics: "Test lyrics content",         // ✅ After fix
  audioLanguage: "Korean",               // ✅ After fix
  duration: "3:45"                       // ✅ After fix
}]
```

**3. Verify Admin Display**
```
Marketing Section:
- Spotify Artist ID: "test_spotify_123" ✅
- Priority Level: "5" ✅
- Project Type: "FRONTLINE" ✅

Track 1 Section:
- Lyrics: "Test lyrics content" ✅
- Audio Language: "Korean" ✅
- Duration: "3:45" ✅
```

---

## Deployment Checklist

### Pre-Deployment
- [ ] Update Prisma schema with track fields
- [ ] Add marketing fallbacks in controller
- [ ] Add new marketing fields in controller
- [ ] Run `npx prisma generate`
- [ ] Run `npx prisma db push`

### Testing
- [ ] Submit test release with ALL fields
- [ ] Verify all fields in MongoDB
- [ ] Check admin display completeness
- [ ] Test FUGA export (audioLanguage, lyrics)

### Post-Deployment
- [ ] Monitor submission success rate
- [ ] Check for field-related errors
- [ ] Validate data completeness
- [ ] Gather user feedback

---

**Conclusion**: Clear data loss occurring at multiple points. Critical fixes required before production use.
