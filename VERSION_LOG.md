# N3RVE Platform Version Log

## Version History

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
- **Commit**: pending

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