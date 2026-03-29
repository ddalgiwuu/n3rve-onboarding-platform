Claude Code Configuration
Commands

npm run lint: Check code style
npm run type-check: Verify types

## 📊 Current Platform Status

### Production Deployment
- **Deployment**: fly.io (n3rve-backend)
- **Docker Hub**: ddalgiwuu/n3rve-platform:latest
- **GitHub Actions**: Auto-deployment enabled
- **Database**: MongoDB Atlas (Cloud)

### 🏗️ Major Features Deployed
1. **JSON-based FUGA QC Management System** 
   - Location: `/fuga-qc-config/`
   - Version controlled QC rules and help content
   - No-code updates for N3RVE team
   
2. **Multi-step Release Submission Form**
3. **Dropbox Integration for File Storage**
4. **Admin Dashboard with File Preview**
5. **Korean/English Bilingual Support**
6. **Mobile-responsive Design**

### 🐛 Recent Fixes (2025-07-14)
1. **Map Undefined Error Fix (v1.3.18)**
   - Added comprehensive defensive programming in ReleaseSubmissionNew
   - Used `useMemo` for sections initialization with proper fallbacks
   - Added null checks for all array operations (31 locations)
   - Fixed language store initialization to always have valid state
   - **Browser Cache Issue Fixed**: Added nginx cache-control headers to prevent aggressive caching
   - Added loading state when sections is not ready
   - **User Action Required**: Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R) to get latest fixes

2. **React Error #321 Fix (v1.3.19)**
   - Fixed `useSyncExternalStore` error caused by improper zustand store usage
   - Updated store hooks to use selector functions: `useLanguageStore(state => state.language)`
   - This prevents React 18 hydration issues with zustand v5
   - Fixed TypeScript import errors in ErrorBoundary component

3. **Zustand Hydration Fix (v1.3.20)**
   - Added `skipHydration: true` to both language and auth stores
   - Implemented manual hydration in App.tsx to prevent SSR-like issues
   - Fixed useTranslation hook usage in QCWarnings component
   - This completely resolves React error #321 and hydration mismatches

4. **Complete Hydration Solution (v1.3.21)**
   - Created `useHydration` hook to check store hydration status
   - Updated ReleaseSubmissionNew to wait for hydration before rendering
   - Added LoadingSpinner during hydration phase
   - **Root Cause**: Components were trying to render before store data loaded from localStorage
   - **Solution**: Prevent rendering until all stores are fully hydrated

5. **React Error #310 Fix (v1.3.22)**
   - Fixed "Rendered more hooks than during the previous render" error
   - Simplified useHydration hook to use timeout-based approach
   - Removed complex useSyncExternalStore logic that was causing hook order issues
   - **Solution**: Simple 100ms delay to allow hydration without React hook violations

6. **Complete Hook Order Fix (v1.3.23)**
   - Created HydratedReleaseSubmission wrapper component
   - Removed all conditional hook calls from ReleaseSubmissionNew
   - Moved hydration logic to wrapper component to prevent hook order violations
   - **Root Cause**: Conditional rendering before hook calls violated React hook rules
   - **Solution**: Component separation with wrapper handling hydration timing

7. **Comprehensive Map Error Prevention (v1.3.24)**
   - Added defensive programming to ALL .map() calls in ReleaseSubmissionNew
   - Enhanced sections object initialization with try-catch protection
   - Added comprehensive error boundaries for render-time failures
   - Strengthened type checking and null safety throughout component
   - **Target**: Complete elimination of "Cannot read properties of undefined (reading 'map')" errors

8. **React StrictMode Removal Fix (v1.3.25)**
   - Removed React.StrictMode from main.tsx to prevent double mounting issues
   - Added source maps to vite.config.ts for better error debugging
   - **Root Cause**: StrictMode caused components to mount twice in development, creating race conditions
   - **Solution**: Removed StrictMode wrapper while maintaining all hydration protections
   - **Benefit**: Eliminates double rendering without compromising error detection

9. **Select Component Map Error Fix (v1.3.26)**
   - Fixed "Cannot read properties of undefined (reading 'map')" in Select.tsx:46
   - Made options prop optional with default empty array value
   - Added defensive programming to prevent undefined options being passed
   - **Root Cause**: Select component was receiving undefined options prop causing map() to fail
   - **Solution**: Default parameter options = [] and optional interface type
   - **Location**: /components/ui/Select.tsx line 46

10. **FUGA QC Regular Expression Unicode Fix (v1.3.27)**
   - Fixed "Invalid regular expression" error in fugaQCLoader.ts:269
   - Added support for Unicode patterns with \u{...} syntax requiring 'u' flag
   - Enhanced regex creation logic to handle emoji and Unicode character classes
   - **Root Cause**: Unicode escape sequences like \u{1F600} need 'u' flag to work properly
   - **Solution**: Added \u{ pattern detection alongside existing \p{ detection
   - **Location**: /utils/fugaQCLoader.ts line 265

11. **Complete Release Submission Form Implementation (v1.3.28)**
   - Replaced problematic ReleaseSubmissionNew with complete ReleaseSubmission from reference
   - Copied all functionality including 12-step submission process
   - Added all required components: AudioPlayer, DatePicker, RegionSelector
   - Integrated Excel export, technical specs, and territories data
   - **Features**: Drag-drop reordering, QC validation, multi-language support, Dolby Atmos
   - **Solution**: Complete form replacement with proven working implementation
   - **Result**: Professional-grade release submission system with all advanced features

12. **Translation Function Fix (v1.3.29)**
   - Fixed "TypeError: e is not a function" error in ReleaseSubmission.tsx:276
   - Added inline translation function since t function missing from useLanguageStore
   - Replaced destructuring from store with direct language access and local t function
   - **Root Cause**: useLanguageStore doesn't export t function, only language state
   - **Solution**: const t = (ko: string, en: string) => language === 'ko' ? ko : en
   - **Location**: /pages/ReleaseSubmission.tsx line 152

8. **Infrastructure Fixes**
   - Nginx proxy port correction: 5001 -> 3001
   - MongoDB Atlas migration (no local MongoDB)
   - Migrated from EC2 to fly.io

### 📁 Reference Implementation
- **Complete Form**: `/Users/ryansong/Downloads/n3rve-onboarding-platform`
- **Purpose**: Feature reference and functionality comparison
- **Key Components**:
  - Multi-step form with validation
  - File upload with preview
  - Dashboard with analytics
  - Mobile-responsive design
  - Complete UI/UX patterns

## 🔧 FUGA QC Configuration Management

### Location & Structure
```
/fuga-qc-config/
├── version.json          # Version tracking
├── validation-rules.json # All validation patterns & rules  
├── help-content.json     # User help content & guides
├── changelog.md          # Change history
└── README.md            # Management guide
```

### ✅ How to Update QC Rules (No Code Changes Needed)
1. **Edit Rules**: Modify `/fuga-qc-config/validation-rules.json`
2. **Update Help**: Edit `/fuga-qc-config/help-content.json`  
3. **Version Bump**: Update `/fuga-qc-config/version.json`
4. **Document**: Add entry to `/fuga-qc-config/changelog.md`
5. **Deploy**: `git commit && git push` → Auto-deploy to EC2

### 🎯 Key Benefits
- ✅ N3RVE team can update QC rules independently
- ✅ Version controlled changes with full history
- ✅ No developer intervention needed for content updates
- ✅ Instant deployment after Git commit
- ✅ TypeScript type safety maintained

## 1. 📊 Data Analysis Guidelines

Language: Use Python exclusively (no R or other languages)
Code Quality: Always write optimized, memory-efficient code
Data Integrity:

CRITICAL: Only use actual provided data
🔒 NEVER use simulated, dummy, or test data unless explicitly approved
Continuously verify that statistics and metrics remain consistent throughout dataframes
Missing Data Handling:

When encountering missing data, systematically compare multiple imputation methods (mean, median, mode, KNN, regression, MICE, etc.)
Evaluate each method's impact on distribution, variance, and relationships between variables
Document comparative performance of different imputation techniques
Implement validation techniques (cross-validation, sensitivity analysis) to verify imputation quality
Provide clear rationale for the chosen imputation method with supporting evidence
Create visualizations comparing data distributions before and after imputation


When columns/data are entirely missing, prioritize finding actual sources before considering imputation


Definition Consistency:

CRITICAL: Maintain consistent definitions throughout the entire analysis
Never redefine variables or metrics differently at different stages of analysis
Document all variable definitions in detail at the beginning and reference these consistently
Use sequential-thinking MCP to continuously verify definition consistency


Preprocessing Workflow:

Create a dedicated preprocessed CSV file after initial preprocessing
For all subsequent analyses, use this preprocessed file rather than repeating preprocessing steps on the original data
Document all preprocessing steps comprehensively for reproducibility


Domain Knowledge Application:

Implement specialized analysis techniques appropriate for each domain
Thoroughly consider domain-specific terminology, problem definitions, and analytical metrics


Analysis Structure:

Maintain the "Problem → Root Cause Exploration → Solution Proposal" structure
Always consider "How can this analysis be improved?" and provide suggestions
Continuously check accuracy, reliability, and comparability of all metrics used in analysis


Analytical Mentor Role:

Suggest learning directions to strengthen domain knowledge
Provide ongoing feedback on how to improve analytical techniques and methodologies



## 2. 💻 Application Development Guidelines

Languages/Frameworks: Provide production-level code based on the current technology stack
Code Writing Priorities:

Optimization (execution speed and resource usage)
Memory efficiency (prevent unnecessary object creation, consider garbage collection)
Security (prevent SQL injection, implement proper authentication/authorization, protect sensitive information)


Database and System Design:

Design based on ERD, normalize relational structures
Provide production-level DB design including transaction processing and indexing strategies


Frontend Design:

Reflect latest UI/UX trends
Create visually appealing structures, not just functional code



## 🔁 Consistency and Reusability

Documentation:

Clearly document all variables, metrics, and definitions
Provide detailed explanations for each variable, including its purpose, calculation method, and units


Change Management: Only implement changes in figures or conditions after explicit user verification and approval
Exception Handling: Always clearly communicate any exceptions or assumptions

## Critical Verification Protocols

Sequential Verification: Implement sequential-thinking MCP to periodically verify that:

All calculations logically match the source data
Numerical values are consistent throughout the analysis
Analytical conclusions follow logically from the data
Variable definitions remain consistent throughout the entire analysis


Report Verification: For all interim summaries and final reports, thoroughly check:

Consistency of metrics with original data
Logical coherence of content
Uniformity of analytical approach
Consistent application of all variable definitions


Final Validation: After completing reports, conduct a final meticulous comparison with original data to ensure:

Logical soundness of conclusions
Consistency of all metrics
Precision and accuracy of all numerical values
Complete adherence to originally defined variable definitions



When simulation is absolutely necessary, I will always ask for permission first and proceed only with explicit approval. I will notify you immediately if I detect any inconsistencies between analysis results and the original data.

## N3RVE Platform Critical Configuration

### Dropbox Integration Settings
- **App Key**: Configured in `.env` (DO NOT commit)
- **Production Domain**: `https://n3rve-onboarding.com`
- **Development URL**: `http://localhost:5173`

### File Storage Architecture
- **Method**: Company Dropbox account (users don't need personal Dropbox)
- **Structure**: `/n3rve-submissions/[year-month]/[submissionID]_[artist]_[album]/[filetype]/`
- **Configuration**: Requires `DROPBOX_ACCESS_TOKEN` in backend `.env` (never commit)

### Platform Features
- Dolby Atmos tracking for each track
- 31 marketing fields synchronized with consumer forms
- Direct file preview and audio playback from Dropbox in admin dashboard
- Korean/English bilingual support

### Automated Deployment Process (GitHub Actions)
1. `git push origin main` triggers GitHub Actions
2. Docker image built and pushed to Docker Hub
3. Deployed to fly.io automatically

### 📋 Key Management Tasks
- **QC Rules**: Update JSON files in `/fuga-qc-config/`
- **Deployment**: Use GitHub Actions (자동) or `./scripts/deploy.sh` (수동)
- **Monitoring**: Check fly.io dashboard
- **Backup**: Dropbox provides automatic file backup
- **Troubleshooting**:
  - MongoDB connection: Ensure MONGODB_URI points to Atlas, not local

### 📝 Recent Updates

#### v1.3.54 (2025-07-19) - Contributor Search Enhancement
- **Features Added**:
  - Auto-open dropdown when typing in role/instrument search fields
  - Real-time search result count display (e.g., "15 개 결과")
  - Click-outside to close dropdowns for better UX
  - Enhanced search for comprehensive lists:
    - 90 contributor roles across 6 categories
    - 339 instruments across 7 categories
- **Improvements**: Multi-select support, category grouping, instant search feedback
- **Files Updated**: `/frontend/src/components/ContributorForm.tsx`

### 🔥 Common Issues & Solutions
1. **"Cannot read properties of undefined (reading 'map')" Error**
   - **Cause**: Browser cached old JavaScript bundle OR improper zustand store usage
   - **Solution**: 
     - Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R) 
     - Use incognito/private window
     - Ensure store hooks use selector functions
   - **Prevention**: 
     - Nginx cache headers added in v1.3.18
     - Store hooks fixed in v1.3.19 to use proper selectors

2. **502 Bad Gateway**
   - **Cause**: Backend port mismatch
   - **Solution**: Ensure nginx proxy_pass uses port 3001

