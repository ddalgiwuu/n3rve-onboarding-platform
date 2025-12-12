# 🔧 개발 워크플로우 가이드

## 앞으로의 작업 방식

### ✅ 권장 워크플로우

```
1. 로컬 개발 및 테스트
   ↓
2. 기능 검증 완료
   ↓
3. Git commit
   ↓
4. 프로덕션 배포 (git push)
```

---

## 📋 단계별 프로세스

### 1단계: 로컬 개발

**Backend 실행**:
```bash
cd backend
npm run start:dev
# http://localhost:3001
```

**Frontend 실행**:
```bash
cd frontend  
npm run dev
# http://localhost:3000
```

**개발 진행**:
- 코드 수정
- 기능 추가
- 버그 수정

---

### 2단계: 로컬 테스트

**기능 테스트**:
- [ ] 수정한 기능이 정상 작동하는지
- [ ] 기존 기능에 영향 없는지
- [ ] Console 에러 없는지
- [ ] UI/UX 정상인지

**브라우저 확인**:
- Chrome DevTools
- Network 탭: API 호출 확인
- Console: 에러 없는지
- Elements: UI 정상 렌더링

**테스트 체크리스트**:
- [ ] 로그인/로그아웃
- [ ] 해당 페이지 접근
- [ ] 수정한 기능 동작
- [ ] Edge cases 확인

---

### 3단계: Git Commit (로컬 검증 후)

**커밋 전 확인**:
```bash
# 변경 파일 확인
git status

# 변경 내용 검토
git diff

# Lint 확인 (선택)
npm run lint

# Type 체크 (선택)
npm run type-check
```

**커밋**:
```bash
git add [files]
git commit -m "commit message"
```

---

### 4단계: 프로덕션 배포 (최종 확인 후)

**배포 전 최종 체크**:
- [ ] 로컬에서 완벽하게 작동
- [ ] 모든 기능 테스트 완료
- [ ] Console 깨끗함
- [ ] 문서 업데이트 (필요시)

**배포**:
```bash
git push origin main
# Vercel 자동 배포 시작
```

**배포 후 검증**:
```bash
# 배포 상태 확인
cd frontend
vercel ls --yes

# 약 30-40초 후 프로덕션 테스트
```

---

## 🚫 피해야 할 방식 (이전)

```
❌ 코드 수정
   ↓
❌ 바로 git push
   ↓  
❌ 프로덕션에서 에러 발견
   ↓
❌ 다시 수정
   ↓
❌ 반복...
```

**문제점**:
- 프로덕션에서 에러 발견
- 배포 시간 낭비 (30초 × N회)
- 사용자 경험 저해
- 비효율적

---

## ✅ 권장 방식 (앞으로)

```
✅ 로컬에서 수정
   ↓
✅ 로컬에서 완벽하게 테스트
   ↓
✅ 모든 기능 검증 완료
   ↓
✅ Git commit + push
   ↓
✅ 프로덕션: 한 번에 성공! 🎉
```

**장점**:
- 프로덕션 에러 최소화
- 배포 횟수 감소
- 빠른 개발 사이클
- 안정적인 배포

---

## 🔧 로컬 개발 팁

### Hot Reload 활용

**Frontend (Vite)**:
- 파일 저장 시 자동 리로드
- 빠른 HMR (Hot Module Replacement)
- 즉시 결과 확인

**Backend (NestJS)**:
- `--watch` 모드로 자동 재시작
- 코드 변경 시 즉시 반영

### 개발 모드 활용

**Console 로깅**:
```typescript
if (import.meta.env.DEV) {
  console.log(...); // 로컬에서만 표시
}
```

**에러 디버깅**:
- ErrorBoundary 상세 로그
- React DevTools
- Network 탭 모니터링

---

## 📊 배포 빈도 줄이기

### 변경 사항 그룹핑

**Before** ❌:
- 작은 수정 → 배포
- 또 작은 수정 → 배포
- 10번 배포 = 300초 (5분)

**After** ✅:
- 여러 수정을 로컬에서 완료
- 한 번에 테스트
- 1번 배포 = 30초

**효율**:
- 시간 절약: 270초 (4.5분)
- 안정성 증가
- 프로덕션 안정

---

## 🎯 체크리스트

### 배포 전

- [ ] 로컬 Backend 실행 중
- [ ] 로컬 Frontend 실행 중
- [ ] 수정 사항 로컬 테스트 완료
- [ ] Console 에러 없음
- [ ] 기존 기능 정상 작동
- [ ] Git commit 완료

### 배포 후

- [ ] Vercel 배포 완료 (● Ready)
- [ ] 프로덕션 URL 테스트
- [ ] Hard Refresh
- [ ] 기능 정상 작동 확인

---

**앞으로 이 워크플로우로 진행합니다!** 🚀

**작성일**: 2024-12-10
**효율 개선**: ~80% 시간 절약 예상
