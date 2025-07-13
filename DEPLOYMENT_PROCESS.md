# N3RVE Platform - Deployment Process

## 🚀 배포 프로세스 (ALWAYS USE THIS)

### Overview
```
Local Development → GitHub → Docker Hub → AWS EC2
```

### Prerequisites
- Git CLI
- Docker with buildx
- AWS CLI
- SSH access to EC2

## 📋 Step-by-Step Deployment

### 1. Commit and Push to GitHub
```bash
# Check status
git status

# Add all changes
git add -A

# Commit with descriptive message
git commit -m "feat/fix/chore: Description of changes"

# Push to main branch
git push origin main
```

### 2. Create Version Tag
```bash
# Create tag (follow semantic versioning)
git tag v1.3.5 -m "Release v1.3.5: Description"

# Push tag
git push --tags
```

### 3. Build and Push Docker Image
```bash
# Build for linux/amd64 (EC2 architecture)
docker buildx build --platform linux/amd64 \
  -t ddalgiwuu/n3rve-platform:v1.3.5 \
  -t ddalgiwuu/n3rve-platform:latest \
  --push .

# Note: Always use --platform linux/amd64 for EC2 compatibility
```

### 4. Deploy to EC2
```bash
# SSH to EC2
ssh -i /Users/ryansong/AWS_KEY/N3RVE_AWS.pem ubuntu@52.78.81.116

# On EC2: Update local git (IMPORTANT!)
cd /home/ubuntu/n3rve-onboarding-platform
git pull origin main

# Stop and remove old container
docker stop n3rve-platform
docker rm n3rve-platform

# Pull new image
docker pull ddalgiwuu/n3rve-platform:v1.3.5

# Run new container
docker run -d --name n3rve-platform \
  -p 80:80 \
  -p 443:443 \
  -p 3001:3001 \
  -v /etc/letsencrypt:/etc/letsencrypt:ro \
  --env-file .env \
  ddalgiwuu/n3rve-platform:v1.3.5

# Check logs
docker logs n3rve-platform --tail 50
```

### 5. Verify Deployment
```bash
# Check container status
docker ps

# Test site
curl https://n3rve-onboarding.com

# Exit EC2
exit
```

## 🔧 AWS CLI Commands

### Check EC2 Instance
```bash
# Get instance status
aws ec2 describe-instances --instance-ids i-0fd6de9be4fa199a9 \
  --query 'Reservations[0].Instances[0].[State.Name,PublicIpAddress]'

# Start instance (if stopped)
aws ec2 start-instances --instance-ids i-0fd6de9be4fa199a9

# Stop instance (save costs)
aws ec2 stop-instances --instance-ids i-0fd6de9be4fa199a9
```

## 🐳 Docker Commands

### Local Testing
```bash
# Build locally
docker build -t n3rve-platform:local .

# Run locally
docker run -p 3000:80 -p 3001:3001 n3rve-platform:local

# Clean up
docker system prune -a
```

### Docker Hub Management
```bash
# Login to Docker Hub
docker login -u ddalgiwuu

# List remote tags
docker search ddalgiwuu/n3rve-platform

# Pull specific version
docker pull ddalgiwuu/n3rve-platform:v1.3.5
```

## 🚨 Important Notes

1. **ALWAYS** use `--platform linux/amd64` when building for EC2
2. **ALWAYS** update git on EC2 before deploying
3. **ALWAYS** use version tags (vX.X.X format)
4. **NEVER** commit sensitive data (.env files)
5. **ALWAYS** check logs after deployment

## 📝 Troubleshooting

### Container won't start
```bash
# Check port conflicts
docker ps -a
lsof -i :80
lsof -i :443
lsof -i :3001
```

### MongoDB connection issues
```bash
# Check environment variables
docker exec n3rve-platform env | grep MONGO
```

### SSL Certificate issues
```bash
# Verify certificates are mounted
docker exec n3rve-platform ls -la /etc/letsencrypt/live/
```

## 🔄 Rollback Process
```bash
# On EC2
docker stop n3rve-platform
docker rm n3rve-platform
docker run -d --name n3rve-platform \
  -p 80:80 -p 443:443 -p 3001:3001 \
  -v /etc/letsencrypt:/etc/letsencrypt:ro \
  --env-file .env \
  ddalgiwuu/n3rve-platform:v1.3.4  # Previous version
```