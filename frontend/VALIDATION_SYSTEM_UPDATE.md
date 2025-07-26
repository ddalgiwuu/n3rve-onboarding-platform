# Input Validation System Redesign

## Overview
The input validation system has been redesigned to provide warnings and suggestions instead of automatic conversion. This respects artist creative choices while warning about potential DSP rejections.

## Key Changes

### 1. New ValidationWarning Component (`/src/components/ValidationWarning.tsx`)
- Modern, visually appealing warning component with Framer Motion animations
- Three severity levels:
  - **Error** (red): Blocking issues that must be fixed
  - **Warning** (amber): May cause DSP rejection but can be ignored
  - **Suggestion** (blue): Best practices and recommendations
- Features:
  - Expandable DSP rejection examples
  - Accept/Ignore buttons for actionable warnings
  - Smooth slide-in animations
  - Dark mode support
  - Bilingual support (Korean/English)

### 2. Updated Validation Logic (`/src/utils/inputValidation.ts`)
- Changed from auto-formatting to warning-based approach
- Returns warnings array instead of formatted values
- Includes DSP rejection examples for common issues:
  - Apple Music: "Featured artist format must use 'feat.' not 'ft.' or 'featuring'"
  - Spotify: "Track number should not be included in track title"
- Validation categories:
  - Special characters (file system restrictions)
  - Length limits
  - Formatting suggestions (feat., OST, version tags)
  - Track numbering
  - Bracket standardization
  - Whitespace issues

### 3. Integration in ReleaseFormV2
- Added validation state management
- Real-time validation on blur events
- Warning display below input fields
- Accept suggestion functionality updates form values
- Dismiss warning functionality with persistence

## Usage Example

```typescript
// In your component
import ValidationWarning from '@/components/ValidationWarning'
import { validateAlbumTitle, createValidationState } from '@/utils/inputValidation'

// State setup
const [validationWarnings, setValidationWarnings] = useState<Record<string, ValidationWarningType[]>>({})
const validationState = createValidationState()

// Validation handler
const handleFieldValidation = (field: string, value: string) => {
  const result = validateAlbumTitle(value)
  const activeWarnings = validationState.filterActiveWarnings(result.warnings)
  setValidationWarnings(prev => ({
    ...prev,
    [field]: activeWarnings
  }))
}

// In your JSX
<input
  value={albumTitle}
  onChange={(e) => setAlbumTitle(e.target.value)}
  onBlur={(e) => handleFieldValidation('albumTitle', e.target.value)}
/>
{validationWarnings.albumTitle && (
  <ValidationWarning
    warnings={validationWarnings.albumTitle}
    onAcceptSuggestion={handleAcceptSuggestion}
    onDismissWarning={handleDismissWarning}
    language={language}
  />
)}
```

## Demo Page
A demo page has been created at `/src/pages/ValidationDemo.tsx` to showcase the new validation system with various test cases.

## Benefits
1. **Respects Artist Intent**: No automatic changes to user input
2. **Educational**: Shows why certain formats may cause issues
3. **Flexible**: Users can accept or ignore suggestions
4. **Transparent**: Shows actual DSP rejection messages
5. **Non-intrusive**: Warnings appear smoothly below inputs
6. **Persistent**: Dismissed warnings stay dismissed

## Next Steps
1. Integrate the new validation system into ContributorForm
2. Add validation to TrackList component
3. Create validation presets for common scenarios
4. Add batch accept/ignore functionality for multiple warnings
5. Implement validation history/analytics

## Testing
Test cases included in demo:
- Multiple spaces and featuring formats
- Non-standard brackets
- Track numbers in titles
- Invalid special characters
- OST formatting variations
- Version tag formatting