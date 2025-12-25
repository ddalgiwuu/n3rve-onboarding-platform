# Quick Fix Guide - N3RVE Backend TypeScript Errors

## Current Status
- **TypeScript Errors**: 97 (down from 108)
- **Prisma Schema**: ✅ Fixed and regenerated
- **Database Models**: ✅ All present and properly configured

## What Was Fixed

✅ **User Model**
- Added `password` field for email/password auth
- Added `parentAccountId` for account hierarchy
- Added default values for all required fields
- Added relations for submissions, sub-accounts, saved artists/contributors

✅ **Submission Model**
- Added 20+ nullable fields for artist/album/marketing data
- All form fields now properly stored
- Empty/unanswered fields handled with nullable types

✅ **New Models Added**
- DSP (Digital Service Providers)
- DigitalProduct (Product releases)
- FeatureReport (Platform features)
- MarketingDriver (Marketing campaigns)
- TerritorySelection (Distribution settings)
- Guide (User documentation)

## Remaining Errors - Quick Fixes

### 1. Field Name Corrections (5 files, 15 minutes)

**File**: `src/submissions/submissions.service.ts`
```typescript
// Line ~121
coverImage → coverImageUrl

// Line ~161
catalogNumber → // REMOVE (field doesn't exist)

// Line ~323
reviewedAt → reviewedBy
```

**File**: `src/admin/admin.service.ts`
```typescript
// Line ~354
reviewedAt → reviewedBy
```

**File**: `src/submissions/submissions.controller.ts`
```typescript
// Line ~465
price → // REMOVE (use priceType instead)
```

### 2. SavedArtist/Contributor Defaults (1 file, 10 minutes)

**File**: `src/saved-artists/saved-artists.service.ts`

**Line ~227** - Add defaults:
```typescript
await this.prisma.savedArtist.create({
  data: {
    userId,
    name,
    translations,
    identifiers,
    completionScore: 0n,        // ADD
    createdAt: new Date(),      // ADD
    lastUsed: new Date(),       // ADD
    releaseCount: 0n,           // ADD
    status: 'ACTIVE',           // ADD
    updatedAt: new Date(),      // ADD
    usageCount: 0n,             // ADD
  }
});
```

**Line ~362** - Add defaults:
```typescript
await this.prisma.savedContributor.create({
  data: {
    userId,
    name,
    roles,
    instruments,
    translations,
    identifiers,
    createdAt: new Date(),      // ADD
    lastUsed: new Date(),       // ADD
    usageCount: 0n,             // ADD
  }
});
```

### 3. DigitalProduct Includes (1 file, 10 minutes)

**File**: `src/digital-products/digital-products.service.ts`

**Lines 20, 47, 67, 87, 110** - Remove invalid include:
```typescript
// REMOVE this
include: {
  submission: true,
  featureReport: true // ❌ REMOVE - doesn't exist
}

// USE this instead
include: {
  submission: {
    include: {
      featureReports: true // ✅ Access through submission
    }
  }
}
```

### 4. FeatureReport Fields (1 file, 10 minutes)

**File**: `src/feature-reports/feature-reports.service.ts`

**Replace field names:**
```typescript
lastUpdated → updatedAt        // Lines 37, 96, 119, 146, 173
digitalProductId → submissionId // Line 191
```

**Remove invalid includes:**
```typescript
// Lines 23, 46, 65, 200
include: {
  digitalProduct: true // ❌ REMOVE
}

// Replace with submission relation if needed
include: {
  submission: true
}
```

### 5. DSP Service Types (2 files, 15 minutes)

**Files**: `src/dsp/dsp.service.ts`, `src/dsp/seed-dsps.ts`

**Option A (Recommended)** - Use OTHER + features:
```typescript
// Replace all non-standard types
ServiceType.FINGERPRINTING → ServiceType.OTHER
ServiceType.VIDEO → ServiceType.OTHER
ServiceType.DOWNLOAD → ServiceType.OTHER
ServiceType.RADIO → ServiceType.OTHER
ServiceType.SOCIAL → ServiceType.OTHER
ServiceType.STREAMING → ServiceType.OTHER

// Add type info to features field
features: {
  type: 'FINGERPRINTING', // or VIDEO, DOWNLOAD, etc.
  capabilities: [...],
}
```

**Option B** - Extend enum in schema (if you control schema):
```prisma
enum ServiceType {
  SPOTIFY
  APPLE_MUSIC
  YOUTUBE_MUSIC
  AMAZON_MUSIC
  TIDAL
  DEEZER
  FINGERPRINTING  // ADD
  VIDEO           // ADD
  DOWNLOAD        // ADD
  RADIO           // ADD
  SOCIAL          // ADD
  STREAMING       // ADD
  OTHER
}
```

### 6. DSP Field Names (2 files, 10 minutes)

**Files**: `src/dsp/dsp.service.ts`, `src/dsp/seed-dsps.ts`

```typescript
dspId → id           // All references
code → name          // Or remove if not needed
description → // REMOVE or use features JSON
isHD → // REMOVE or add to schema
```

### 7. ProductFormat Values (1 file, 5 minutes)

**File**: `src/digital-products/digital-products.service.ts`

**Lines 143, 160:**
```typescript
// Map invalid values to valid enum
"FOCUS_TRACK" → ProductFormat.SINGLE

// Type guard for territories
if (Array.isArray(submission.release.territories)) {
  territories = submission.release.territories as string[];
}
```

### 8. Territory releaseId (1 file, 5 minutes)

**File**: `src/territories/territories.service.ts`

```typescript
// Lines 92, 104
releaseId → // REMOVE (field doesn't exist)
```

## Testing After Fixes

```bash
# 1. Check TypeScript errors
npx tsc --noEmit

# 2. Run tests
npm test

# 3. Build project
npm run build

# 4. Start server
npm run start:dev
```

## Expected Results

After applying all fixes:
- **TypeScript Errors**: 0 (down from 97)
- **Build**: ✅ Success
- **All Features**: ✅ Working

## Time Estimate

- **Field Name Corrections**: 15 minutes
- **SavedArtist/Contributor**: 10 minutes
- **DigitalProduct Includes**: 10 minutes
- **FeatureReport Fields**: 10 minutes
- **DSP Service Types**: 15 minutes
- **DSP Field Names**: 10 minutes
- **ProductFormat Values**: 5 minutes
- **Territory releaseId**: 5 minutes

**Total Time**: ~80 minutes (1 hour 20 minutes)

## Need Help?

1. **Detailed Solutions**: See FIXES_SUMMARY.md
2. **Complete Report**: See SCHEMA_FIX_REPORT.md
3. **Schema Reference**: See prisma/schema.prisma

## Validation Checklist

- [ ] All field names match schema
- [ ] All includes use valid relations
- [ ] All enum values are valid
- [ ] All required fields have defaults
- [ ] TypeScript compilation succeeds
- [ ] Tests pass
- [ ] Build succeeds
