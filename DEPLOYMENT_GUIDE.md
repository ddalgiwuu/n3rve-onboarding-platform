# GitHub Actions Deployment Troubleshooting Guide

## 🚨 Current Issue
GitHub Actions deployment is failing. The most common cause is missing or incorrect GitHub Secrets.

## ✅ Quick Fix Steps

### 1. Test Docker Hub Credentials Locally
```bash
# Run the test script
./test-docker-auth.sh
```

### 2. Create Docker Hub Personal Access Token
1. Go to: https://hub.docker.com/settings/security
2. Click "New Access Token"
3. Description: `GitHub Actions`
4. Access permissions: Select ALL (Read, Write, Delete)
5. Click "Generate"
6. **COPY THE TOKEN IMMEDIATELY** (you won't see it again!)

### 3. Add GitHub Secrets
Go to: https://github.com/ddalgiwuu/n3rve-onboarding-platform/settings/secrets/actions

Add these 3 secrets:

#### DOCKER_USERNAME
- Click "New repository secret"
- Name: `DOCKER_USERNAME`
- Value: `ddalgiwuu`

#### DOCKER_PASSWORD
- Click "New repository secret"
- Name: `DOCKER_PASSWORD`
- Value: [Paste your Docker Hub Access Token]
- ⚠️ NOT your Docker Hub password!

#### EC2_SSH_KEY
- Click "New repository secret"
- Name: `EC2_SSH_KEY`
- Value: Copy entire content of `/Users/ryansong/AWS_KEY/N3RVE_AWS.pem`
```bash
cat /Users/ryansong/AWS_KEY/N3RVE_AWS.pem
```

### 4. Run Debug Workflow
1. Go to: https://github.com/ddalgiwuu/n3rve-onboarding-platform/actions
2. Click "Debug Deployment Issues" workflow
3. Click "Run workflow"
4. Check the output for any ❌ marks

### 5. Manual Deployment (If GitHub Actions Still Fails)
```bash
# SSH into EC2
ssh -i "/Users/ryansong/AWS_KEY/N3RVE_AWS.pem" ubuntu@52.78.81.116

# On EC2 server
cd /home/ubuntu/n3rve-onboarding-platform
git pull origin main
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d
```

## 🔍 Common Issues

### Issue 1: "unauthorized: incorrect username or password"
**Cause**: Using Docker Hub password instead of Personal Access Token
**Fix**: Create a new Personal Access Token and update DOCKER_PASSWORD secret

### Issue 2: "denied: requested access to the resource is denied"
**Cause**: Token doesn't have push permissions
**Fix**: Create new token with Read, Write, Delete permissions

### Issue 3: EC2 connection fails
**Cause**: EC2_SSH_KEY format is incorrect
**Fix**: Make sure to copy the ENTIRE pem file content, including:
```
-----BEGIN RSA PRIVATE KEY-----
[content]
-----END RSA PRIVATE KEY-----
```

### Issue 4: Secrets appear empty in workflow
**Cause**: Secrets were added to wrong repository or have trailing spaces
**Fix**: Delete and re-add secrets, ensuring no extra spaces

## 📞 Support
If deployment still fails after following all steps:
1. Run the debug workflow and share the output
2. Check Docker Hub: https://hub.docker.com/r/ddalgiwuu/n3rve-platform/tags
3. Verify the last push date/time