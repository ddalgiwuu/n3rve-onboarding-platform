# 📚 문서 정리 가이드

**생성일**: 2024-12-07
**목적**: 중복 및 오래된 MD 파일 정리 권장사항

---

## 🔄 중복 문서 (3쌍)

### 1. FUGA SCORE 통합 관련 (3개 파일)

| 파일 | 내용 | 권장 |
|------|------|------|
| `FUGA_SCORE_INTEGRATION.md` | 상세 구현 가이드 (Phase 1-6) | ✅ **보관** (메인 문서) |
| `IMPLEMENTATION_SUMMARY.md` | 구현 요약 (v1.4.0-alpha) | ⚠️ 통합 또는 삭제 |
| `README_FUGA_INTEGRATION.md` | 빠른 시작 가이드 | ⚠️ 통합 또는 링크 |

**권장 조치:**
- `FUGA_SCORE_INTEGRATION.md`에 빠른 시작 섹션 추가
- 나머지 2개 파일은 `docs/archive/` 이동 또는 삭제

### 2. 최종 요약 관련 (2개 파일)

| 파일 | 내용 | 권장 |
|------|------|------|
| `FINAL_SUMMARY.md` | FUGA SCORE 최종 요약 (95% 완료) | ⚠️ 삭제 후보 |
| `FUGA_SCORE_INTEGRATION.md` | 동일 내용 포함 | ✅ **보관** |

**권장 조치:**
- `FINAL_SUMMARY.md` 삭제 (내용이 FUGA_SCORE_INTEGRATION.md와 중복)

### 3. 마케팅 Steps 제거 가이드 (2개 파일)

| 파일 | 내용 | 권장 |
|------|------|------|
| `QUICK_FIX.md` | 빠른 수정 가이드 (1분 작업) | ✅ **완료 후 아카이브** |
| `INTEGRATION_GUIDE.md` | 상세 통합 가이드 | ⚠️ 삭제 또는 통합 |

**권장 조치:**
- QUICK_FIX.md 작업 완료됨 (2024-12-07)
- `docs/completed/` 폴더로 이동
- INTEGRATION_GUIDE.md는 삭제 (내용 중복)

---

## 📁 권장 문서 구조

```
docs/
├── features/
│   ├── WAVEFORM_GUIDE.md (WAVEFORM_* 파일들 통합)
│   ├── CONTRIBUTOR_CARD.md (현재 파일 유지)
│   └── DARK_MODE_GUIDE.md (MODERN_DARK_MODE_GUIDE 이름 변경)
│
├── integrations/
│   ├── FUGA_SCORE.md (FUGA_SCORE_INTEGRATION 이름 변경)
│   └── CORS_SETUP.md (CORS_TEST_REPORT 이름 변경)
│
├── bugfixes/
│   └── PRISMA_500_ERROR.md (FIX-500-ERROR-ANALYSIS 이름 변경)
│
├── roadmap/
│   └── NEXT_STEPS.md (현재 파일 유지)
│
└── completed/ (완료된 작업)
    ├── QUICK_FIX.md (2024-12-07 완료)
    ├── FINAL_SUMMARY.md (내용 통합됨)
    └── INTEGRATION_GUIDE.md (QUICK_FIX로 대체)
```

---

## ⏰ 오래된 문서

### CORS_TEST_REPORT.md
- **마지막 업데이트**: 2025-09-12 (약 3개월 전)
- **권장**: 최신 환경에서 재테스트 후 업데이트

---

## ✅ 정리 실행 계획

### 즉시 실행 (5분)
1. `QUICK_FIX.md` → `docs/completed/` 이동 (작업 완료됨)
2. `FINAL_SUMMARY.md` 삭제 (FUGA_SCORE_INTEGRATION.md와 중복)
3. `INTEGRATION_GUIDE.md` 삭제 (QUICK_FIX.md로 대체됨)

### 단기 (30분)
1. Waveform 관련 3개 파일 통합
   - WAVEFORM_DESIGN_SPEC.md
   - WAVEFORM_BEFORE_AFTER.md
   - WAVEFORM_IMPLEMENTATION.md
   → `docs/features/WAVEFORM_GUIDE.md`

2. FUGA 관련 3개 파일 통합
   - FUGA_SCORE_INTEGRATION.md (메인)
   - IMPLEMENTATION_SUMMARY.md (요약 섹션으로)
   - README_FUGA_INTEGRATION.md (빠른 시작 섹션으로)

3. 파일 이름 정규화
   - MODERN_DARK_MODE_GUIDE.md → DARK_MODE_GUIDE.md
   - FIX-500-ERROR-ANALYSIS.md → PRISMA_500_ERROR.md
   - CORS_TEST_REPORT.md → CORS_SETUP.md

---

## 📊 정리 전후 비교

| Before | After |
|--------|-------|
| 15개 MD 파일 | 7개 MD 파일 |
| 중복 내용 다수 | 중복 제거 |
| 분산된 위치 | `docs/` 폴더에 카테고리별 정리 |
| 상태 혼란 | 명확한 상태 표시 |

---

## 🎯 다음 작업

1. 사용자 승인 후 문서 정리 실행
2. `docs/` 폴더 구조 생성
3. 파일 이동 및 통합
4. 최종 커밋
