# N3RVE Platform Version Log

## Version History

### v1.3.76 (2025-07-21)
- **Type**: Bug Fix - Modal Scrolling Issue
- **Changes**:
  - Fixed modal scrolling issue where content was cut off at the bottom
  - Changed modal structure to use flexbox layout for proper height distribution
  - Removed fixed height calculation, using flex-grow for content area
  - Made header and footer flex-shrink-0 to maintain fixed sizes
  - Adjusted internal scroll containers max-heights for better content visibility
  - Modal now properly shows all content with smooth scrolling
- **Files Modified**: 
  - `/frontend/src/components/TerritorySelector.tsx`
  - `/VERSION_LOG.md`
  - `/package.json`
- **Commit**: pending

### v1.3.75 (2025-07-21)
- **Type**: Major UX Enhancement - Territory Selection Modal
- **Changes**:
  - Completely redesigned territory selection UX with modal-based interface
  - Simplified main display to show summary with "Configure" button
  - Created intuitive modal with two tabs:
    - Base Settings: Quick mode selection (Worldwide/Include/Exclude) with visual country selection
    - DSP Overrides: Easy DSP-specific territory customization
  - Enhanced features:
    - Visual mode selection with large icon buttons
    - Quick selection presets (Major Countries, Asia, Europe, Americas)
    - Live search for countries with instant filtering
    - Expandable continent groups with select all/deselect functionality
    - Selected countries summary with easy removal
    - DSP list with popular/other categorization
    - Detailed DSP override configuration with back navigation
    - Real-time territory count updates
  - Improved mobile responsiveness with adaptive grid layouts
  - Better visual hierarchy and modern design patterns
- **Files Modified**: 
  - `/frontend/src/components/TerritorySelector.tsx`
  - `/VERSION_LOG.md`
  - `/package.json`
- **Commit**: pending

### v1.3.74 (2025-07-21)
- **Type**: Major Feature Addition - Territory & DSP Selection
- **Changes**:
  - Added comprehensive territory selection component for release distribution
  - Created territories.json with 249 countries organized by continents
  - Added complete list of 61 DSPs used by N3RVE (replacing initial 10 sample DSPs)
    - Most DSPs are via IIP-DDS integration
    - Some are direct integrations marked with (A)
  - Implemented three distribution modes:
    - Worldwide: Release in all countries (default)
    - Include Only: Release only in selected countries
    - Exclude: Release worldwide except selected countries
  - Added DSP-specific territory override functionality
  - Features include:
    - Continent-based country grouping with expand/collapse
    - Real-time search for countries
    - Quick selection buttons for major countries per DSP
    - Visual summary of release territories
    - Select all/deselect all per continent
    - Popular DSPs section showing 8 major platforms
    - Scrollable Other DSPs section for remaining 53 platforms
    - Compact UI design for efficient DSP display
  - Modern UI with gradient backgrounds and smooth animations
  - Integrated into Step 1 (Album Info) after copyright information
- **Files Modified**: 
  - `/frontend/src/pages/ImprovedReleaseSubmissionWithDnD.tsx`
  - `/frontend/src/components/TerritorySelector.tsx` (new)
  - `/frontend/src/data/territories.json` (new)
  - `/VERSION_LOG.md`
  - `/package.json`
- **Commit**: e2fbe34

### v1.3.73 (2025-07-21)
- **Type**: Major UI/UX Enhancement - Contributor Form Platform Integration
- **Changes**:
  - Improved new artist checkbox UI with prominent border, color coding, and clear warnings
  - Added default fields for Spotify and Apple Music platform integration (always visible)
  - Updated Spotify link instructions with platform-specific key combinations:
    - Mac: Hold Option key when clicking "Copy Spotify URI"
    - Windows: Hold Ctrl key when clicking "Copy Spotify URI"
  - Added "Page Check" functionality:
    - Opens artist page if identifier is filled
    - Opens search page if field is empty
  - Removed IPI, YouTube, and ISNI identifier options (only Spotify and Apple Music remain)
  - Apple Music integration now accepts only numeric artist ID (not full URL)
  - Enhanced help text with better formatting and clearer instructions
  - Made platform fields required with visual indicators
- **Files Modified**: 
  - `/frontend/src/components/ContributorForm.tsx`
  - `/VERSION_LOG.md`
  - `/package.json`
- **Commit**: pending

### v1.3.72 (2025-07-20)
- **Type**: Major Update - Contributor Management System
- **Changes**:
  - Completely rewrote ContributorManagementModal to use ContributorForm component
  - Now supports all 90 contributor roles from contributorRoles.json
  - Now supports all 457 instruments from instruments.json
  - Added category-based grouping (Composition, Performance, Production, Business, Technical, Visual)
  - Integrated full contributor data structure with translations, identifiers, and multi-select
  - Shows total available roles and instruments in footer
  - Fixed issue where only 6 hardcoded roles were available
- **Files Modified**: 
  - `/frontend/src/components/ContributorManagementModal.tsx`
  - `/VERSION_LOG.md`
  - `/package.json`
- **Commit**: pending

### v1.3.71 (2025-07-20)
- **Type**: Bug Fix - Event Bubbling in Track Translation
- **Changes**:
  - Fixed track translation section closing when clicking language selection or add buttons
  - Added e.stopPropagation() to all interactive elements in TrackTranslationUI
  - Prevented event bubbling from translation container to parent components
  - Added click event handler to translation section container to stop propagation
  - Resolved issue where any interaction within translation UI would close the entire section
- **Files Modified**: 
  - `/frontend/src/components/TrackTranslationUI.tsx`
  - `/frontend/src/pages/ImprovedReleaseSubmissionWithDnD.tsx`
  - `/VERSION_LOG.md`
  - `/package.json`
- **Commit**: pending

### v1.3.70 (2025-07-20)
- **Type**: Bug Fix - Track Translation Toggle
- **Changes**:
  - Fixed track translation toggle requiring multiple clicks by properly memoizing toggle handler
  - Added JSON.stringify for deep comparison of objects in React.memo
  - Ensured handleToggleTrackTranslation doesn't have dependencies to prevent re-creation
  - Fixed React.memo comparison function to properly detect state changes
  - TrackTranslationUI component now maintains state properly when selecting languages
- **Files Modified**: 
  - `/frontend/src/pages/ImprovedReleaseSubmissionWithDnD.tsx`
  - `/VERSION_LOG.md`
  - `/package.json`
- **Commit**: pending

### v1.3.69 (2025-07-20)
- **Type**: UI/UX Enhancement & Bug Fix
- **Changes**:
  - Fixed track translation toggle requiring multiple clicks by passing state as props to memoized component
  - Resolved React.memo optimization issue preventing proper re-renders
  - Created new TrackTranslationUI component with modern, user-friendly interface
  - Added quick language selection buttons (EN, JA, CN, ES, FR) for faster input
  - Implemented inline editing with better visual hierarchy
  - Added language badges with short codes for cleaner display
  - Improved empty state with helpful visual cues
  - Enhanced overall track translation workflow with smoother interactions
  - Fixed issue where translation window would close when selecting language
- **Files Modified**: 
  - `/frontend/src/pages/ImprovedReleaseSubmissionWithDnD.tsx`
  - `/frontend/src/components/TrackTranslationUI.tsx` (new)
  - `/VERSION_LOG.md`
  - `/package.json`
- **Commit**: pending

### v1.3.68 (2025-07-20)
- **Type**: Data Update
- **Changes**:
  - Updated instruments.json with comprehensive list of 339 instruments (previously 339, same count)
  - Updated contributorRoles.json with complete list of 90 roles (previously 88)
  - Added missing roles: "Main Artist" and "Songwriter" 
  - Reorganized instrument categories to match user specifications
  - Categories now include: Brass, Electronic, Ensemble, Keyboard, Other, Percussion, Strings, Vocals, Woodwinds
  - Ensured multi-select functionality works properly for both roles and instruments
- **Files Modified**: 
  - `/frontend/src/data/instruments.json`
  - `/frontend/src/data/contributorRoles.json`
  - `/VERSION_LOG.md`
  - `/package.json`
- **Commit**: pending

### v1.3.67 (2025-07-20)
- **Type**: Bug Fix & UI Enhancement
- **Changes**:
  - Fixed translation input fields losing focus by implementing local state management
  - Created TranslationTitleInput component with blur-based updates
  - Enhanced track title translation UI to match album title translation design
  - Added toggle button for showing/hiding track translations
  - Applied gradient background and modern styling to translation sections
  - Improved overall UX consistency across the form
  - Fixed translation toggle state persistence by lifting state to parent component
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