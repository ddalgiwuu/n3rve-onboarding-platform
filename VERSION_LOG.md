# N3RVE Platform Version Log

## Version History

### v1.3.67 (2025-07-20)
- **Type**: Bug Fix & UI Enhancement
- **Changes**:
  - Fixed translation input fields losing focus by implementing local state management
  - Created TranslationTitleInput component with blur-based updates
  - Enhanced track title translation UI to match album title translation design
  - Added toggle button for showing/hiding track translations
  - Applied gradient background and modern styling to translation sections
  - Improved overall UX consistency across the form
- **Files Modified**: 
  - `/frontend/src/components/TranslationInput.tsx`
  - `/frontend/src/pages/ImprovedReleaseSubmissionWithDnD.tsx`
  - `/VERSION_LOG.md`
  - `/package.json`
- **Commit**: pending

### v1.3.66 (2025-07-20)
- **Type**: Bug Fix (Critical)
- **Changes**:
  - Fixed track title input losing focus after each character by implementing local state management
  - Created TrackTitleInput component with local state that updates on blur instead of onChange
  - Moved drag event handlers from container to drag handle only to prevent interference
  - Removed console.log statements for better performance
  - This resolves the issue where users couldn't type continuously in track title fields
- **Files Modified**: 
  - `/frontend/src/pages/ImprovedReleaseSubmissionWithDnD.tsx`
  - `/VERSION_LOG.md`
  - `/package.json`
- **Commit**: pending

### v1.3.65 (2025-07-20)
- **Type**: Bug Fix
- **Changes**:
  - Fixed track title input focus issue where only one character could be typed at a time
  - Added useCallback to memoize updateTrack function to prevent unnecessary re-renders
  - Wrapped TrackItem component with React.memo to optimize rendering performance
  - Users can now type continuously in track title fields without losing focus
- **Files Modified**: 
  - `/frontend/src/pages/ImprovedReleaseSubmissionWithDnD.tsx`
  - `/VERSION_LOG.md`
- **Commit**: pending

### v1.3.64 (2025-07-19)
- **Type**: Major Feature Addition
- **Changes**:
  - Completely redesigned Submissions page with modern UI/UX
  - Added edit functionality for PENDING submissions
  - Added delete functionality with confirmation modal
  - Added resubmit functionality for REJECTED submissions
  - Implemented grid/list view toggle
  - Added rejection reason display for REJECTED submissions
  - Improved search and filter functionality
  - Better mobile responsiveness with card-based layout
  - Added action buttons with hover effects
  - Updated submission form to handle edit/resubmit modes
  - Dynamic submit button text based on mode
- **Files Modified**: 
  - `/frontend/src/pages/Submissions.tsx` (complete rewrite)
  - `/frontend/src/pages/ImprovedReleaseSubmissionWithDnD.tsx`
  - `/package.json`
- **Commit**: pending

### v1.3.63 (2025-07-19)
- **Type**: Bug Fix
- **Changes**:
  - Fixed "a.filter is not a function" error in Submissions page
  - Added safe handling for API response data structure
  - Handles various API response formats (array, {submissions: []}, {data: []})
  - Added Array.isArray check before filtering submissions
  - Prevents runtime errors when API returns unexpected data format
- **Files Modified**: 
  - `/frontend/src/pages/Submissions.tsx`
  - `/package.json`
- **Commit**: 924cd4e

### v1.3.62 (2025-07-19)
- **Type**: UI Enhancement
- **Changes**:
  - Fixed layout consistency between Album Artists and Featuring Artists sections
  - Both sections now have identical spacing and styling
  - Added consistent space-y-3 class to both container divs
  - Unified button padding (py-3) for both "Manage Artists" and "Manage Featuring" buttons
  - Added font-medium class to button text for consistent weight
  - Ensured both sections occupy equal width in the grid layout
- **Files Modified**: 
  - `/frontend/src/pages/ImprovedReleaseSubmissionWithDnD.tsx`
  - `/package.json`
- **Commit**: 93cd5bc

### v1.3.61 (2025-07-19)
- **Type**: Major UI Redesign
- **Changes**:
  - Completely redesigned translation UI with modern, trendy design
  - Added gradient background with purple-pink theme
  - Implemented card-based layout for each translation
  - Added language code badges with gradient backgrounds
  - Quick language selection with pill buttons
  - Empty state with helpful illustration
  - Progress indicator showing languages added
  - Smooth animations and transitions
  - Hover effects and improved interactivity
  - More intuitive and visually appealing interface
- **Files Modified**: 
  - `/frontend/src/pages/ImprovedReleaseSubmissionWithDnD.tsx`
- **Commit**: pending

### v1.3.60 (2025-07-19)
- **Type**: Bug Fix
- **Changes**:
  - Fixed album title translation layout issue
  - Changed from horizontal to vertical layout for translation fields
  - Language labels now appear above input fields instead of beside
  - Improved mobile responsiveness with better stacking
  - Fixed X button positioning outside of input field
- **Files Modified**: 
  - `/frontend/src/pages/ImprovedReleaseSubmissionWithDnD.tsx`
- **Commit**: pending

### v1.3.59 (2025-07-19)
- **Type**: UI Enhancement
- **Changes**:
  - Redesigned album title translation UI for cleaner, modern look
  - Changed "Add Translation" button to rounded pill style
  - Simplified translation section with lighter background
  - Reduced input field sizes and improved spacing
  - Removed excessive padding and borders for cleaner appearance
  - Made delete buttons smaller and more subtle
  - Improved overall visual hierarchy
- **Files Modified**: 
  - `/frontend/src/pages/ImprovedReleaseSubmissionWithDnD.tsx`
- **Commit**: pending

### v1.3.58 (2025-07-19)
- **Type**: UI Enhancement
- **Changes**:
  - Unified UI design for Album Artists and Featuring Artists sections
  - Modernized "Add translations" button with toggle state
  - Improved button styling with rounded corners and hover effects
  - Added consistent list display for both artist types
  - Enhanced visual hierarchy with better spacing and colors
  - Featuring artists now use same card layout as album artists
- **Files Modified**: 
  - `/frontend/src/pages/ImprovedReleaseSubmissionWithDnD.tsx`
- **Commit**: pending

### v1.3.57 (2025-07-19)
- **Type**: UI Enhancement
- **Changes**:
  - Modernized album title translation UI with cleaner design
  - Added gradient header with purple/blue theme
  - Improved input field styling with hover effects
  - Added floating delete button that appears on hover
  - Enhanced select dropdown with dashed border style
  - Consistent rounded corners and shadow effects
  - Better contrast and accessibility in dark mode
- **Files Modified**: 
  - `/frontend/src/pages/ImprovedReleaseSubmissionWithDnD.tsx`
- **Commit**: pending

### v1.3.56 (2025-07-19)
- **Type**: Bug Fix
- **Changes**:
  - Fixed track title input field text entry issue
  - Separated drag functionality to only drag handle (GripVertical icon)
  - Added event propagation stops to prevent drag interference with input
  - Added debug logging for updateTrack function
  - Improved touch interaction handling for mobile devices
- **Files Modified**: 
  - `/frontend/src/pages/ImprovedReleaseSubmissionWithDnD.tsx`
- **Commit**: pending

### v1.3.55 (2025-07-19)
- **Type**: UI Enhancement
- **Changes**:
  - Fixed TranslationInput component visibility in track section
  - Made TranslationInput more compact for better fit in track cards
  - Improved "Add Translation" button visibility with proper styling
  - Reduced component sizes for better mobile responsiveness
  - Fixed color scheme from n3rve-main to standard purple colors
- **Files Modified**: 
  - `/frontend/src/components/TranslationInput.tsx`
  - `/frontend/src/pages/ImprovedReleaseSubmissionWithDnD.tsx`
- **Commit**: pending

### v1.3.54 (2025-07-19)
- **Type**: Feature Enhancement
- **Changes**:
  - Enhanced contributor search with auto-open dropdown functionality
  - Added real-time search result count display
  - Implemented click-outside to close dropdowns
  - Improved UX for searching 90 roles and 339 instruments
- **Files Modified**: 
  - `/frontend/src/components/ContributorForm.tsx`
- **Commit**: e038657

### v1.3.53 (Previous versions)
- Initial multi-select implementation for roles and instruments
- Comprehensive contributor roles and instruments lists integration
- Track title input fixes
- Translation UI improvements
- Album featuring artists reflection at track level

## Deployment Information
- **Auto-deployment**: Enabled via GitHub Actions
- **Docker Image**: ddalgiwuu/n3rve-platform:latest
- **EC2 Instance**: i-0fd6de9be4fa199a9
- **Production URL**: https://n3rve-onboarding.com