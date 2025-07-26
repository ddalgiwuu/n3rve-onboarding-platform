#!/bin/bash

echo "🔧 N3RVE 플랫폼 - 캐시 초기화 배포 스크립트"
echo "=============================================="

# Change to frontend directory
cd frontend

echo "📦 Node modules 완전 초기화..."
rm -rf node_modules
rm -f package-lock.json

echo "🧹 빌드 캐시 초기화..."
rm -rf dist
rm -rf .vite

echo "📥 의존성 재설치..."
npm install

echo "🔨 프로덕션 빌드 (캐시 무효화)..."
npm run build

echo "✅ 캐시 초기화 배포 완료!"
echo ""
echo "🚀 다음 단계:"
echo "1. git add . && git commit -m 'Force cache invalidation' && git push"
echo "2. CDN 캐시 초기화 (CloudFlare/AWS CloudFront)"
echo "3. 사용자에게 https://n3rve-onboarding.com/clear-cache.html 안내"
echo ""
echo "📋 확인사항:"
echo "- 새로운 vendor 파일명에 타임스탬프 포함됨"
echo "- 이전 vendor-y1crrPLV.js 파일은 더 이상 사용되지 않음"
echo "- 모든 JS/CSS 파일에 no-cache 헤더 적용됨"