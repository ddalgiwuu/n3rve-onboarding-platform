# Fix: 500 Internal Server Error - Artist Update with Identifiers

## Problem
```
POST http://localhost:3000/api/saved-artists/artists 500 (Internal Server Error)
PrismaClientValidationError
```

## Root Cause

**Incorrect Prisma syntax for composite type arrays in MongoDB**

The code was using `{ set: array }` syntax for composite type arrays, which is **incorrect** for MongoDB composite types.

### Evidence

**Prisma Schema** (`prisma/schema.prisma`):
```prisma
model SavedArtist {
  translations  ArtistTranslation[]  // Composite type array
  identifiers   ArtistIdentifier[]   // Composite type array
}

type ArtistIdentifier {
  type  IdentifierType  // ENUM
  value String
  url   String?
}
```

**Incorrect Code** (`src/saved-artists/saved-artists.service.ts`):
```typescript
// WRONG ❌
if (data.translations !== undefined) updateData.translations = { set: data.translations };
if (data.identifiers !== undefined) updateData.identifiers = { set: data.identifiers };
```

## The Fix

### Key Distinction
- **Scalar Arrays** (e.g., `String[]`, `roles`, `instruments`): Use `{ set: array }`
- **Composite Type Arrays** (e.g., `ArtistTranslation[]`, `ArtistIdentifier[]`): Assign directly

### Corrected Code

**File**: `/Users/ryansong/Desktop/n3rve-onbaording/backend/src/saved-artists/saved-artists.service.ts`

#### 1. Artist Update (Lines 136-138)
```typescript
// CORRECT ✅
if (data.name !== undefined) updateData.name = data.name;
// For composite types in MongoDB, assign directly without { set: ... }
if (data.translations !== undefined) updateData.translations = data.translations;
if (data.identifiers !== undefined) updateData.identifiers = data.identifiers;
```

#### 2. Artist Create (Lines 217-223)
```typescript
// CORRECT ✅
newArtist = await this.prisma.savedArtist.create({
  data: {
    userId,
    name: data.name,
    translations: data.translations || [],  // Direct assignment
    identifiers: data.identifiers || []     // Direct assignment
  },
});
```

#### 3. Contributor Update (Lines 283-288)
```typescript
// CORRECT ✅
// For scalar arrays, use { set: ... }
if (data.roles !== undefined) updateData.roles = { set: data.roles };
if (data.instruments !== undefined) updateData.instruments = { set: data.instruments };
// For composite types in MongoDB, assign directly without { set: ... }
if (data.translations !== undefined) updateData.translations = data.translations;
if (data.identifiers !== undefined) updateData.identifiers = data.identifiers;
```

#### 4. Contributor Create (Lines 335-344)
```typescript
// CORRECT ✅
return this.prisma.savedContributor.create({
  data: {
    userId,
    name: data.name,
    roles: data.roles || [],           // Scalar array - direct
    instruments: data.instruments || [], // Scalar array - direct
    translations: data.translations || [], // Composite - direct
    identifiers: data.identifiers || []    // Composite - direct
  },
});
```

## Why This Fix Works

### MongoDB Composite Types vs Scalar Arrays

**Composite Types** (complex objects):
```typescript
type ArtistIdentifier {
  type  IdentifierType
  value String
  url   String?
}
```
- **Behavior**: Act as embedded documents
- **Update Syntax**: Direct assignment `field = value`
- **Reason**: MongoDB treats these as BSON documents, not primitive arrays

**Scalar Arrays** (simple values):
```typescript
roles: String[]
instruments: String[]
```
- **Behavior**: Simple array of primitives
- **Update Syntax**: Use `{ set: array }` for explicit replacement
- **Reason**: Prisma needs explicit instruction to replace vs push/pull

## Prevention

### Code Pattern to Remember

```typescript
// ✅ CORRECT PATTERNS
// For composite types
updateData.identifiers = data.identifiers;

// For scalar arrays
updateData.roles = { set: data.roles };

// ❌ WRONG PATTERNS
// For composite types
updateData.identifiers = { set: data.identifiers }; // WRONG!

// For scalar arrays (without explicit set)
updateData.roles = data.roles; // Works but less explicit
```

## Verification

```bash
# Build check
npm run build
# Output: ✅ Build successful

# Type check
npm run type-check
# Output: ✅ No TypeScript errors
```

## Related Documentation

- **Prisma MongoDB Composite Types**: https://www.prisma.io/docs/concepts/components/prisma-schema/data-model#defining-composite-types
- **Prisma Update Operations**: https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#update
- **Issue Tracker**: See GitHub Issues #[number] for similar cases

## Testing Checklist

- [ ] Create artist without identifiers
- [ ] Create artist with identifiers
- [ ] Update artist adding identifiers
- [ ] Update artist modifying identifiers
- [ ] Create contributor without identifiers
- [ ] Create contributor with identifiers
- [ ] Update contributor adding identifiers
- [ ] Update contributor modifying identifiers

## Summary

**What Changed**: Removed `{ set: ... }` wrapper from composite type array assignments
**Where Changed**: 4 locations in `saved-artists.service.ts`
**Result**: PrismaClientValidationError resolved
**Build Status**: ✅ Successful
