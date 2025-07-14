Claude Code Configuration
Commands

npm run lint: Check code style
npm run type-check: Verify types

## 📊 Current Platform Status

### 🚀 Production Deployment (Latest)
- **EC2 Server**: ec2-52-78-81-116.ap-northeast-2.compute.amazonaws.com
- **Latest Commit**: 86db752 (Add additional safety checks for undefined errors)
- **Deployment Date**: 2025-07-14
- **Status**: ✅ LIVE and Running
- **GitHub Actions**: ✅ Auto-deployment enabled

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
- **App Key (Client ID)**: `slffi4mfztfohqd`
- **Production Domain**: `https://n3rve-onboarding.com`
- **Development URL**: `http://localhost:5173`
- **Redirect URIs**: 
  - Development: `http://localhost:5173/dropbox-callback`
  - Production: `https://n3rve-onboarding.com/dropbox-callback`

### File Storage Architecture
- **Method**: Company Dropbox account (users don't need personal Dropbox)
- **Structure**: `/n3rve-submissions/[year-month]/[submissionID]_[artist]_[album]/[filetype]/`
- **Configuration**: Requires `VITE_DROPBOX_ACCESS_TOKEN` in environment variables
- **Important**: Never commit Access Token to version control

### Platform Features
- Dolby Atmos tracking for each track
- 31 marketing fields synchronized with consumer forms
- Direct file preview and audio playback from Dropbox in admin dashboard
- Korean/English bilingual support

### AWS EC2 Instance Connection Details
- **Instance ID**: `i-0fd6de9be4fa199a9` (N3RVE)
- **SSH Client Steps**:
  - Find private key file: `N3RVE_AWS.pem`
  - Set key permissions: `chmod 400 "N3RVE_AWS.pem"`
  - Public DNS: `ec2-52-78-81-116.ap-northeast-2.compute.amazonaws.com`
  - Connection Command: `ssh -i "N3RVE_AWS.pem" ubuntu@ec2-52-78-81-116.ap-northeast-2.compute.amazonaws.com`

### 🚀 Automated Deployment Process (GitHub Actions)
#### 자동 배포 (권장)
1. **Local Development**: 코드 수정 및 테스트
2. **Git Commit**: `git add .` → `git commit -m "commit message"`
3. **GitHub Push**: `git push origin main`
4. **자동 실행**: GitHub Actions가 자동으로:
   - Docker 이미지 빌드 (linux/amd64)
   - Docker Hub 푸시 (ddalgiwuu/n3rve-platform)
   - EC2 자동 배포 (컨테이너 재시작)
   - 상태: Actions 탭에서 확인 가능

#### 수동 배포 (필요시)
1. **Docker Desktop 실행 필요**
2. **배포 스크립트**: `./scripts/deploy.sh`
3. **버전 입력**: v1.3.x 형식으로 입력
4. **자동 처리**: 빌드, 푸시, 배포 전체 과정

### 📋 Key Management Tasks
- **QC Rules**: Update JSON files in `/fuga-qc-config/`
- **Deployment**: Use deployment script for consistency
- **Monitoring**: Check EC2 instance health regularly
- **Backup**: Dropbox provides automatic file backup