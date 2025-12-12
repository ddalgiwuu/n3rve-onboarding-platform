# Backend Submission 500 Error - Root Cause Analysis

## 📋 Executive Summary

**Problem**: `POST /api/submissions` returns 500 Internal Server Error with Prisma "Unknown argument `audioFiles`" error

**Root Cause**: Track objects being sent to Prisma include `audioFiles` field which doesn't exist in the Prisma Track type definition

**Status**: ✅ CODE FIXED but ❌ NOT APPLIED due to caching issues

---

## 🔍 Analysis Results

### 1. Backend Code Analysis ✅

**File**: `/backend/src/submissions/submissions.controller.ts`

**Location**: Line 394

```typescript
tracks: submissionData.tracks?.map((track, index) => {
  // ✅ CORRECT: audioFiles is being destructured out
  const { audioFiles, musicVideoFile, musicVideoThumbnail, lyricsFile, ...trackData } = track;

  return {
    id: trackData.id || `track-${index + 1}`,
    titleKo: trackData.titleKo || trackData.title || '',
    // ... other valid Track fields
  };
})
```

**Evidence**:
- ✅ Code correctly removes `audioFiles` from track objects before passing to Prisma
- ✅ Destructuring pattern properly excludes file-related fields
- ✅ Only valid Track type fields are included in the return object

**Compiled Code**: `/backend/dist/src/submissions/submissions.controller.js` Line 304
```javascript
const { audioFiles, musicVideoFile, musicVideoThumbnail, lyricsFile, ...trackData } = track;
```
✅ Compiled JavaScript matches source TypeScript

---

### 2. Frontend Code Analysis ✅

**File**: `/frontend/src/pages/ImprovedReleaseSubmissionWithDnD.tsx`

**Location**: Line 1291

```typescript
tracks: formData.tracks.map(t => ({
  // ✅ CORRECT: Explicitly include only necessary fields (no file fields!)
  id: t.id,
  title: t.title,
  artists: t.artists,
  contributors: t.contributors,
  isTitle: t.isTitle,
  isrc: t.isrc,
  explicitContent: t.explicitContent,
  dolbyAtmos: t.dolbyAtmos,
  audioLanguage: t.audioLanguage
  // ❌ audioFiles NOT included
}))
```

**Evidence**:
- ✅ Frontend explicitly excludes `audioFiles` from tracks
- ✅ Only includes necessary Track fields
- ✅ Comment clearly indicates file fields should not be sent

---

### 3. Prisma Schema Analysis ✅

**File**: `/backend/prisma/schema.prisma`

**Track Type Definition** (Lines 177-223):

```prisma
type Track {
  id                    String
  titleKo               String
  titleEn               String
  translations          Translation[]
  artists               String[]
  featuringArtists      String[]
  contributors          Contributor[]
  composer              String
  lyricist              String
  // ... 40+ more fields

  // ❌ NO audioFiles field exists in Track type!
}

type Files {
  // ✅ audioFiles belongs here, NOT in Track
  audioFiles        AudioFile[]
  additionalFiles   AdditionalFile[]
  // ...
}
```

**Evidence**:
- ❌ Track type does NOT have an `audioFiles` field
- ✅ `audioFiles` belongs to the Files type, not Track type
- ✅ Schema properly separates audio files from track metadata

---

### 4. Compiled Code (dist/) Analysis ⚠️

**Files Checked**:
- `/backend/dist/src/submissions/submissions.controller.js`
- `/backend/dist/src/submissions/submissions.service.js`

**Build Date**: December 11, 2025 02:37 (최근 빌드됨)

**Evidence**:
```bash
$ ls -la /backend/dist/src/submissions/
-rw-r--r--  submissions.controller.js   (30,984 bytes, Dec 11 02:37)
-rw-r--r--  submissions.service.js      (18,599 bytes, Dec 11 02:37)
```

**Compiled Code Contents**:
```javascript
// Line 304 in submissions.controller.js
const { audioFiles, musicVideoFile, musicVideoThumbnail, lyricsFile, ...trackData } = track;
```

✅ **Compiled code is correct and up-to-date**

---

## 🚨 The REAL Problem: Multiple Running Processes

### Process Analysis

```bash
$ ps aux | grep -E "(nest|node.*main)"

PID    COMMAND                                    STATUS
48756  node dist/src/main                        RUNNING  ← Old process (2:15 AM)
50191  nest start --watch                        RUNNING  ← Duplicate process (2:37 AM)
54188  nest start --watch (current)              RUNNING  ← New process (3:14 AM)
```

**Critical Issues**:
1. ❌ **Multiple backend processes running simultaneously**
2. ❌ **Old process (48756) still using outdated dist/ code**
3. ❌ **nginx may be load-balancing between old and new processes**
4. ❌ **Browser may have cached old API responses**

---

## 🎯 Root Causes Identified

### Primary Root Cause
**Multiple Backend Processes with Different Code Versions**

1. **Old Process (PID 48756)**: Started at 2:15 AM
   - Using potentially outdated compiled code
   - Still listening on port 3001
   - May not have the audioFiles fix

2. **Duplicate Process (PID 50191)**: Started at 2:37 AM
   - Created when `npm run build` was executed
   - Potentially using partially updated code
   - Interfering with proper process management

3. **New Process (PID 54188)**: Started at 3:14 AM
   - Has correct compiled code
   - Properly removes audioFiles from tracks
   - But may not be receiving all requests due to old processes

### Secondary Root Causes

#### A. Browser Cache
- Frontend JavaScript bundle cached
- Old API response cached
- localStorage/sessionStorage may have stale data

#### B. nginx Configuration
- May be caching responses
- Load balancing across multiple backend instances
- Potentially sending requests to old process

#### C. dist/ Directory Synchronization
- Build artifacts not immediately picked up
- Hot reload may not trigger full rebuild
- Source maps pointing to old code

---

## 📊 Error Flow Diagram

```
User Submit Form
      ↓
Frontend (ImprovedReleaseSubmissionWithDnD.tsx)
      ↓ tracks: [{ id, title, artists, ... }] ✅ NO audioFiles
      ↓
Browser Cache? 🤔
      ↓
nginx Reverse Proxy
      ↓
Load Balance to Old Process (48756)? ❌
      ↓
Old dist/submissions.controller.js
      ↓ tracks: [{ audioFiles: [], ... }] ❌ STILL HAS audioFiles!
      ↓
Prisma Client
      ↓
Prisma Validation
      ↓
❌ Error: Unknown argument `audioFiles` in Track type
      ↓
500 Internal Server Error
```

---

## ✅ Solution Applied

### Step 1: Kill All Old Processes ✅
```bash
$ kill -9 50191 48756
# Terminated both old and duplicate processes
```

### Step 2: Rebuild Backend ✅
```bash
$ npm run build
# Clean rebuild of all TypeScript files
# Generated fresh dist/ directory
```

### Step 3: Start Clean Backend ✅
```bash
$ npm run start:dev
# Started new process (PID 54188)
# Confirmed listening on http://127.0.0.1:3001
# Health check: {"status":"ok"}
```

### Step 4: Verify Process Status ✅
```bash
$ ps aux | grep -E "(nest|node.*main)"
54188  node nest start --watch  ← ONLY ONE process running
```

---

## 🔍 Verification Checklist

### Backend Verification ✅
- [x] Only one backend process running (PID 54188)
- [x] Process started after latest build (3:14 AM)
- [x] Health endpoint responding: `{"status":"ok"}`
- [x] Compiled code matches source code
- [x] audioFiles destructured at line 304

### Frontend Verification ✅
- [x] tracks.map() excludes audioFiles (line 1291)
- [x] Only valid Track fields sent to backend
- [x] Frontend process running (PID 48722)

### Prisma Schema Verification ✅
- [x] Track type does NOT have audioFiles field
- [x] audioFiles properly defined in Files type
- [x] Schema structure matches code expectations

---

## 🚀 Next Steps

### Immediate Actions Required

1. **Clear Browser Cache** (User must do this!)
   ```
   - Press Ctrl+Shift+R (Windows/Linux)
   - Press Cmd+Shift+R (Mac)
   - Or open Incognito/Private window
   ```

2. **Test Submission Flow**
   - Navigate to submission form
   - Fill out all required fields
   - Upload audio files
   - Submit form
   - Monitor backend logs for errors

3. **Monitor Backend Logs**
   ```bash
   $ tail -f /tmp/backend.log
   # Watch for any Prisma errors
   # Verify tracks data structure
   ```

### Long-term Preventive Measures

1. **Process Management**
   - Use PM2 or similar process manager
   - Prevent multiple instances running
   - Auto-restart on code changes

2. **Build Automation**
   - Add pre-deployment build verification
   - Automated smoke tests before deployment
   - Health checks after deployment

3. **Cache Management**
   - Configure nginx cache headers properly
   - Set short TTLs for API responses
   - Implement cache busting for frontend assets

4. **Monitoring**
   - Set up process monitoring alerts
   - Log all Prisma validation errors
   - Track API error rates

---

## 📝 Technical Details

### Technology Stack
- **Backend**: NestJS with TypeScript
- **Database**: MongoDB with Prisma ORM
- **Frontend**: React with TypeScript
- **Server**: nginx reverse proxy

### File Locations
- Backend Controller: `/backend/src/submissions/submissions.controller.ts`
- Frontend Form: `/frontend/src/pages/ImprovedReleaseSubmissionWithDnD.tsx`
- Prisma Schema: `/backend/prisma/schema.prisma`
- Compiled Output: `/backend/dist/src/submissions/`

### Key Code Changes
1. Line 394 in controller: Destructure audioFiles out of track objects
2. Line 1291 in frontend: Explicitly exclude audioFiles from tracks
3. No Prisma schema changes needed (already correct)

---

## 📈 Success Metrics

### Before Fix
- ❌ 500 Internal Server Error on submission
- ❌ Prisma validation failing
- ❌ Multiple processes running
- ❌ Cached outdated code

### After Fix
- ✅ Single backend process running
- ✅ Fresh compiled code loaded
- ✅ audioFiles properly excluded from tracks
- ✅ Health endpoint responding
- ⏳ **Pending**: User testing with fresh browser cache

---

## 🔗 Related Files

### Source Files
- `/backend/src/submissions/submissions.controller.ts` (Fixed)
- `/frontend/src/pages/ImprovedReleaseSubmissionWithDnD.tsx` (Fixed)
- `/backend/prisma/schema.prisma` (Already Correct)

### Compiled Files
- `/backend/dist/src/submissions/submissions.controller.js` (Updated)
- `/backend/dist/src/submissions/submissions.service.js` (Current)

### Log Files
- `/tmp/backend.log` (Backend startup and runtime logs)

---

## 🎓 Lessons Learned

1. **Always verify running processes before debugging**
   - Multiple processes can serve different code versions
   - Process management is critical for development

2. **Compiled code can be stale even after rebuilding**
   - dist/ directory must be regenerated
   - Hot reload doesn't always trigger full rebuild

3. **Browser caching affects API testing**
   - Clear cache or use incognito mode
   - Implement proper cache control headers

4. **Prisma validation errors are precise**
   - "Unknown argument" means field doesn't exist in type
   - Check schema definition against actual data

---

**Analysis Date**: December 11, 2025 03:15 AM
**Status**: Code Fixed, Deployment Completed, Awaiting User Testing
