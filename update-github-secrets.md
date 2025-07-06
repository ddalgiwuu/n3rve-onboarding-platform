# GitHub Secrets 업데이트 가이드

## Google OAuth 자격 증명 업데이트

GitHub 저장소의 Settings → Secrets and variables → Actions에서 다음 시크릿을 업데이트하세요:

### 1. GOOGLE_CLIENT_ID
```
845573085403-drel56srcdvhhqut0suf4i0pul28lkdl.apps.googleusercontent.com
```

### 2. GOOGLE_CLIENT_SECRET
```
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
```

### 업데이트 단계:
1. https://github.com/ddalgiwuu/n3rve-onboarding-platform/settings/secrets/actions 접속
2. `GOOGLE_CLIENT_ID` 클릭 → Update secret
3. 새 값 붙여넣기 → Update secret 클릭
4. `GOOGLE_CLIENT_SECRET` 클릭 → Update secret  
5. 새 값 붙여넣기 → Update secret 클릭

### 배포 트리거:
GitHub Secrets 업데이트 후:
1. Actions 탭으로 이동
2. "Deploy to AWS EC2" 워크플로우 선택
3. "Run workflow" → "Run workflow" 클릭

또는 코드 변경 후 push:
```bash
git add .
git commit -m "Update Google OAuth credentials"
git push origin main
```