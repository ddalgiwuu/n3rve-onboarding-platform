# 브라우저 캐시 문제 해결 가이드

## 🔍 현재 상황 분석

### ✅ 확인된 사항
1. **코드 수정 완료**: ModalWrapper.tsx가 올바르게 수정됨
2. **빌드 성공**: 2025-12-12 12:52에 새로운 빌드 완료
3. **파일 위치 정확**:
   - `/src/components/common/ModalWrapper.tsx` ✅
   - `/src/components/submission/EnhancedArtistModal.tsx` ✅
4. **Import 경로 정확**: `import ModalWrapper from '@/components/common/ModalWrapper'` ✅
5. **Vite Dev Server 실행 중**: 포트 5173에서 정상 작동 중 ✅

### ❌ 문제의 원인
**브라우저가 이전 버전의 JavaScript 번들을 캐시하고 있어서 새로운 코드를 받지 못함**

## 🚀 해결 방법 (우선순위 순)

### 방법 1: 강제 새로고침 (가장 빠름) ⚡
**Windows/Linux:**
- `Ctrl + Shift + R`
- 또는 `Ctrl + F5`

**Mac:**
- `Cmd + Shift + R`
- 또는 `Cmd + Option + R`

### 방법 2: 시크릿/비공개 모드 테스트 🔒
캐시가 완전히 비활성화된 상태에서 테스트

**Chrome/Edge:**
- `Ctrl + Shift + N` (Windows)
- `Cmd + Shift + N` (Mac)

**Firefox:**
- `Ctrl + Shift + P` (Windows)
- `Cmd + Shift + P` (Mac)

**Safari:**
- `Cmd + Shift + N`

### 방법 3: 개발자 도구 활용 🛠️
1. 개발자 도구 열기: `F12` 또는 `Cmd/Ctrl + Shift + I`
2. **Network** 탭 클릭
3. **"Disable cache"** 체크박스 선택
4. 새로고침 버튼 **우클릭** → **"Empty Cache and Hard Reload"** 선택

### 방법 4: 브라우저 설정에서 캐시 완전 삭제 🗑️

**Chrome/Edge:**
1. 설정 → 개인정보 보호 및 보안
2. 인터넷 사용 기록 삭제
3. **"캐시된 이미지 및 파일"** 선택
4. 삭제 버튼 클릭

**Firefox:**
1. 설정 → 개인정보 보호 및 보안
2. 쿠키 및 사이트 데이터
3. 데이터 지우기

**Safari:**
1. 개발자용 → 캐시 비우기
2. (또는) Safari → 기본 설정 → 고급 → "메뉴 막대에서 개발자용 메뉴 보기" 활성화

## 📊 캐시 테스트 페이지
브라우저에서 다음 URL로 접속하여 캐시 상태를 확인할 수 있습니다:
```
http://localhost:5173/cache-test.html
```

이 페이지에서:
- 현재 캐시 상태 확인
- 빌드 시간 확인
- 브라우저 정보 확인
- 단계별 해결 방법 안내

## 🔧 개발자를 위한 추가 정보

### 최신 빌드 정보
- **빌드 시간**: 2025-12-12 12:52
- **메인 번들**: `index-mtv5UPAt-1765511513722.js` (2,633.64 kB)
- **CSS 번들**: `index-D75CIG1x-1765511513722.css` (337.76 kB)
- **HydratedReleaseSubmission**: `HydratedReleaseSubmission-Be7eomYd-1765511513722.js` (863.04 kB)

### Vite 캐시 위치
```
/Users/ryansong/Desktop/n3rve-onbaording/frontend/node_modules/.vite
```

### 캐시 강제 삭제 명령어
```bash
# Vite 캐시 및 빌드 파일 삭제
rm -rf node_modules/.vite dist

# 새로 빌드
npm run build

# 또는 개발 서버 재시작
npm run dev
```

## ⚠️ 주의사항

1. **캐시 삭제 후에도 문제가 지속되면**:
   - 개발 서버를 재시작하세요 (`npm run dev` 중단 후 재실행)
   - 브라우저를 완전히 종료 후 다시 열어보세요
   - 다른 브라우저에서 테스트해보세요

2. **프로덕션 환경 (EC2)**:
   - Nginx는 이미 `no-cache` 헤더를 설정하고 있습니다
   - `/dist/` 폴더의 모든 파일은 타임스탬프 기반 캐시 버스팅 사용
   - 예: `index-mtv5UPAt-1765511513722.js`의 `1765511513722`는 빌드 타임스탬프

3. **로컬 개발 환경**:
   - Vite는 HMR(Hot Module Replacement)를 사용합니다
   - 코드 수정 시 자동으로 브라우저에 반영됩니다
   - 하지만 때때로 전체 새로고침이 필요할 수 있습니다

## 📝 문제 해결 체크리스트

- [ ] 강제 새로고침 시도 (`Ctrl+Shift+R` / `Cmd+Shift+R`)
- [ ] 시크릿/비공개 모드에서 테스트
- [ ] 개발자 도구에서 Network → Disable cache 활성화
- [ ] 브라우저 캐시 완전 삭제
- [ ] 개발 서버 재시작
- [ ] 다른 브라우저에서 테스트
- [ ] `/cache-test.html` 페이지에서 상태 확인

## 🎯 성공 확인 방법

캐시를 성공적으로 삭제했다면:
1. ✅ ArtistSelector에서 "Add Artist" 버튼 클릭 시 모달이 정상적으로 열림
2. ✅ 콘솔 에러 없음
3. ✅ Network 탭에서 최신 번들 파일 로드 확인 (`1765511513722` 타임스탬프 포함)

---

**마지막 업데이트**: 2025-12-12 12:52
**빌드 버전**: v1.3.54+cache-fix
