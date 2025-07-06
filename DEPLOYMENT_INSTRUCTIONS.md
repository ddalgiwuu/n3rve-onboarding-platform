# N3RVE Onboarding Platform - Deployment Instructions

## 🚀 Quick Deployment Update

The ReleaseSubmission form has been updated with all 12 comprehensive sections. To deploy these changes:

### Option 1: Using the deployment script (Recommended)

1. SSH into your EC2 instance:
```bash
ssh -i "/Users/ryansong/AWS_KEY/N3RVE_AWS.pem" ubuntu@[YOUR-EC2-IP]
```

2. Navigate to the project directory:
```bash
cd ~/n3rve-onboarding-platform
```

3. Run the deployment update script:
```bash
./deploy-update.sh
```

### Option 2: Manual deployment

1. SSH into your EC2 instance:
```bash
ssh -i "/Users/ryansong/AWS_KEY/N3RVE_AWS.pem" ubuntu@[YOUR-EC2-IP]
```

2. Navigate to the project directory:
```bash
cd ~/n3rve-onboarding-platform
```

3. Pull the latest changes:
```bash
git pull origin main
```

4. Rebuild and restart Docker containers:
```bash
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

5. Check the status:
```bash
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs --tail=50
```

## 📋 What's been updated

### ReleaseSubmission Form - 12 Comprehensive Sections:

1. **Artist Info** - Enhanced with artist type, member management, translations
2. **Album Basic Info** - Complete album metadata with translations
3. **Release Settings** - Release dates, copyright, pre-order options
4. **Track Info** - Detailed track metadata, languages, preview settings
5. **Contributors & Credits** - Full credit management per track
6. **File Upload** - All required files with preview functionality
7. **Region & Distribution** - Territory and DSP-specific settings
8. **Korean DSP Settings** - Platform-specific configurations
9. **Marketing Info** - All 31 marketing fields implemented
10. **Social Media** - Complete social platform integration
11. **Promotion Plans** - Detailed promotion strategy fields
12. **Review & Submit** - Enhanced summary with progress tracking

### UI/UX Improvements:
- Better visual organization with glassmorphism cards
- Dynamic form fields based on selections
- Proper validation indicators
- Bilingual support (Korean/English)
- Progress tracking with visual steps
- Better accessibility

## 🔍 Verification

After deployment, verify the updates:

1. Visit https://n3rve-onboarding.com
2. Log in and navigate to Release Submission
3. Check that all 12 steps are visible in the progress bar
4. Test each section to ensure functionality

## 📞 Troubleshooting

If you encounter issues:

1. Check Docker logs:
```bash
docker-compose -f docker-compose.prod.yml logs -f frontend
docker-compose -f docker-compose.prod.yml logs -f backend
```

2. Restart specific services:
```bash
docker-compose -f docker-compose.prod.yml restart frontend
docker-compose -f docker-compose.prod.yml restart backend
```

3. Check disk space:
```bash
df -h
```

4. Clean up Docker resources if needed:
```bash
docker system prune -a
```

## 🔐 EC2 Access Issues

If you can't access the EC2 instance:

1. Check the instance status in AWS Console
2. Verify the security group allows SSH (port 22) from your IP
3. Ensure the instance is running
4. Get the current public IP from AWS Console

Current instance ID: `i-09fbb092824c73cc5`