# 🎵 오디오 재생 수정 세션 요약

**작성일**: 2024-12-07 오후 9시
**작업 시간**: 약 30분
**상태**: 근본 원인 파악 완료, 수정 중 에러 발생

---

## ✅ 성공한 작업

### 1. 로컬 환경 구축
- ✅ Backend: http://localhost:3001 (NestJS)
- ✅ Frontend: http://localhost:3000 (Vite + React 19)
- ✅ Playwright MCP로 실시간 디버깅
- ✅ MongoDB Atlas 연결 성공

### 2. 근본 원인 파악 (Playwright MCP로 실시간 디버깅)

#### 문제 재현 성공
```javascript
// toggleAudioPlayback 호출
✅ "Playing audio 0 successfully!" 로그
❌ 실제: paused: true, currentTime: 0

// 직접 audio.play() 호출
✅ paused: false
✅ currentTime: 0.404498 (진행 중!)
```

#### 발견된 근본 원인

**원인 1: useEffect와 JSX audio의 충돌**
- `frontend/src/pages/ImprovedReleaseSubmissionWithDnD.tsx:517-588`
- useEffect에서 `new Audio()` 객체 생성 → audioRefs.current에 할당
- JSX `<audio>` ref callback이 이것을 **덮어쓰기**
- toggleAudioPlayback이 잘못된 audio 객체를 참조

**원인 2: Reorder.Item 안의 audio element**
- `Line 2110-2115`: audio element가 Reorder.Item **안**에 위치
- Reorder.Item 리렌더링 시 audio element 파괴/재생성
- 재생 중이던 audio가 멈춤

**원인 3: 누락된 이벤트**
- `onTimeUpdate` 이벤트 없음 → currentTime 업데이트 안 됨
- ModernWaveform에 `currentTime={0}` 하드코딩

---

## ❌ 시도한 수정 (실패)

### 수정 1: audio elements를 Reorder.Group 밖으로 이동
```typescript
// Line 2127 이후 추가
{formData.audioFiles.map((file, index) => (
  <audio
    key={`audio-${file.name}-${index}`}
    ref={(el) => { if (el) audioRefs.current[index] = el; }}
    src={URL.createObjectURL(file)}
    onTimeUpdate={(e) => setAudioCurrentTimes(...)}
    onEnded={() => setPlayingAudioIndex(null)}
    className="hidden"
  />
))}
```

**결과**: ❌ React 런타임 에러 발생

### 수정 2: useEffect Audio 생성 제거
```typescript
// Line 517-588: useEffect 전체 주석 처리
// Audio element management - Now handled by JSX audio elements below
// useEffect removed to prevent conflict with JSX audio refs
```

**결과**: ❌ React 런타임 에러 여전히 발생

**에러 메시지**: 비어있음 (JSHandle@error {})

---

## 🔍 실시간 디버깅으로 발견한 사실

### Playwright MCP 테스트 결과

1. **audio elements 위치**
   ```json
   {
     "index": 0,
     "parentTag": "LI",  // Reorder.Item
     "parentClass": "group relative bg-gradient-to-br...",
     "hasHidden": true
   }
   ```
   → audio가 Reorder.Item **안**에 있어서 드래그 시 재생성 확인

2. **직접 play() 테스트**
   ```javascript
   audio.play() → paused: false, currentTime: 0.404498 ✅
   ```
   → audio element 자체는 정상 작동

3. **toggleAudioPlayback 테스트**
   ```javascript
   toggleAudioPlayback(0) → paused: true, currentTime: 0 ❌
   ```
   → 함수 호출 후 audio가 즉시 정지됨

---

## 📋 다음 단계 권장사항

### 🎯 옵션 1: Checkpoint 파일 사용 (가장 안전)

**파일**: `frontend/src/pages/ImprovedReleaseSubmissionWithDnD.tsx.checkpoint-20251207-161522`

**장점**:
- ✅ 드래그 앤 드롭 작동하는 안정적인 버전
- ✅ UI/UX 완성된 상태
- ✅ 오디오만 추가하면 됨

**작업 순서**:
1. Checkpoint 파일을 현재 파일로 복사
2. AudioPlayer.tsx 컴포넌트 패턴 적용
3. 테스트 및 검증

**예상 시간**: 30분-1시간

---

### 🔧 옵션 2: 더 단순한 수정 (현재 파일 유지)

**전략**: JSX audio 대신 useEffect만 사용, but Reorder 이슈 해결

```typescript
// useEffect에서 생성한 Audio 객체를 DOM에 append
useEffect(() => {
  const container = document.createElement('div');
  container.style.display = 'none';
  document.body.appendChild(container);

  formData.audioFiles.forEach((file, index) => {
    const audio = new Audio();
    audio.src = URL.createObjectURL(file);
    audio.onTimeUpdate = (e) => { /* ... */ };
    audio.onEnded = () => setPlayingAudioIndex(null);

    container.appendChild(audio);
    audioRefs.current[index] = audio;
  });

  return () => {
    document.body.removeChild(container);
  };
}, [formData.audioFiles]);
```

**장점**: Reorder와 완전히 분리
**단점**: React 패턴이 아님

**예상 시간**: 30분

---

### 🚀 옵션 3: 새로운 접근 (AudioPlayer 컴포넌트)

AUDIO_PLAYBACK_TODO.md의 옵션 1 사용

**장점**:
- ✅ 이미 작동하는 컴포넌트
- ✅ React 패턴 준수
- ✅ 검증된 코드

**단점**: 통합 작업 필요

**예상 시간**: 1-2시간

---

## 📊 현재 Git 상태

```bash
Changes not staged for commit:
  modified:   frontend/src/pages/ImprovedReleaseSubmissionWithDnD.tsx
```

**변경 사항**:
1. useEffect Audio 생성 주석 처리
2. Reorder.Item 안의 audio 제거
3. JSX audio elements 추가 (Line 2128-2139)

**복구 방법**:
```bash
git checkout frontend/src/pages/ImprovedReleaseSubmissionWithDnD.tsx
```

---

## 🎯 추천 방향

**1순위**: 옵션 2 (더 단순한 수정)
- 현재 파일 유지
- DOM 직접 조작으로 Reorder 이슈 회피
- 빠른 구현 가능

**2순위**: Checkpoint 파일 + AudioPlayer 컴포넌트
- 안정적인 베이스
- React 패턴 준수
- 조금 더 시간 소요

---

## 🔑 핵심 교훈

1. **Framer Motion Reorder와 audio elements는 충돌**
   - Reorder.Item 안의 child는 드래그 시 재렌더링
   - audio element는 재생성되면 재생 중단

2. **useEffect Audio vs JSX audio**
   - 동시에 사용하면 ref 충돌
   - 하나만 선택해야 함

3. **직접 테스트의 중요성**
   - Playwright MCP로 실시간 디버깅
   - 브라우저 DevTools보다 정확한 상태 파악

---

**마지막 업데이트**: 2024-12-07 오후 9:14
**작성자**: Claude Code
**다음 세션**: 옵션 2 시도 권장
