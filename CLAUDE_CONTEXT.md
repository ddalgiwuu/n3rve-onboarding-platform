# Claude Code Context - MUST READ

## 🤖 CRITICAL INFORMATION FOR CLAUDE CODE

### Project Identity
- **Project**: N3RVE Onboarding Platform
- **Purpose**: Music distribution platform for FUGA
- **Primary User**: Ryan Song
- **Language Preference**: Korean for communication, English for code

### Always Remember
1. **DEPLOYMENT PROCESS IS CRITICAL**
   - ALWAYS follow the process in DEPLOYMENT_PROCESS.md
   - NEVER skip git commits before Docker build
   - ALWAYS use `--platform linux/amd64` for EC2
   - ALWAYS update EC2 git before deploying

2. **Use CLI Tools**
   - Git CLI for version control
   - AWS CLI for EC2 management
   - Docker CLI for container management
   - SSH for EC2 access

3. **Current Production Status**
   - URL: https://n3rve-onboarding.com
   - Latest Version: Check git tags
   - EC2 IP: 52.78.81.116
   - SSL: Active (Let's Encrypt)

### Common Issues & Solutions

#### 1. Sidebar Not Working
- Check Layout.tsx and Sidebar.tsx event handlers
- Ensure no console.log in production code
- Check for proper event listener cleanup

#### 2. Map Undefined Errors
- Always use defensive programming: `(array || []).map()`
- Check initial state in components
- Validate API responses

#### 3. Mobile View Issues
- Minimum touch target: 44x44px
- Use responsive Tailwind classes
- Test on actual mobile devices

#### 4. Deployment Failures
- Check Docker platform (must be linux/amd64)
- Verify EC2 has latest git code
- Check environment variables on EC2
- Monitor Docker logs after deployment

### File Locations
- **Main Submission Form**: `/frontend/src/pages/ReleaseSubmissionNew.tsx`
- **Auth Logic**: `/frontend/src/store/auth.store.ts`
- **API Services**: `/frontend/src/services/`
- **Backend Controllers**: `/backend/src/[module]/[module].controller.ts`

### Key Features to Maintain
1. **Dolby Atmos** tracking per track
2. **31 Marketing Fields** (all must work)
3. **Bilingual Support** (Korean/English)
4. **Dropbox Integration** (file uploads)
5. **Google OAuth** (authentication)

### Testing Checklist Before Deploy
- [ ] Login works (Google OAuth)
- [ ] Sidebar opens/closes properly
- [ ] Forms submit without errors
- [ ] File upload to Dropbox works
- [ ] Admin dashboard loads
- [ ] Mobile view is responsive

### Environment Management
- **Local**: Use `.env` files (never commit)
- **Production**: Set on EC2 directly
- **Secrets**: See API_KEYS.md (never commit)

### Current Active Issues
- Monitor for any map() errors
- Check mobile responsiveness
- Ensure all form validations work

### Deployment Reminder
```bash
# Quick Deploy Commands
git add -A && git commit -m "fix: description"
git push origin main
git tag v1.X.X && git push --tags
docker buildx build --platform linux/amd64 -t ddalgiwuu/n3rve-platform:v1.X.X -t ddalgiwuu/n3rve-platform:latest --push .
ssh -i /Users/ryansong/AWS_KEY/N3RVE_AWS.pem ubuntu@52.78.81.116
# Then follow EC2 deployment steps in DEPLOYMENT_PROCESS.md
```

### Support Contacts
- **Developer**: Ryan Song
- **Platform**: FUGA N3RVE
- **Repository**: https://github.com/ddalgiwuu/n3rve-onboarding-platform

## 🚨 NEVER FORGET
1. Always use the deployment process
2. Test before deploying
3. Keep API keys secure
4. Monitor logs after deployment
5. Maintain backward compatibility