# 🎵 오디오 재생 기능 구현 상태 및 다음 단계

**작성일**: 2024-12-07
**현재 상태**: 오디오 재생 미작동 (디버깅 완료, 해결 대기)
**우선순위**: High

---

## 📊 현재 상황

### ✅ 완료된 작업 (2024-12-07)

1. **ImprovedReleaseSubmissionWithDnD.tsx 복구**
   - 2주간 작업한 파일 복구 (`.backup` 파일에서)
   - 구문 에러 수정
   - 3,893 라인

2. **Step 1 (앨범 정보) - 완벽 구현**
   - ✅ 커버 아트 최상단 배치 (192px 미리보기)
   - ✅ 오디오 파일 다중 업로드
   - ✅ 파형(Waveform) 시각화 (ModernWaveform 컴포넌트)
   - ✅ 오디오 스펙 표시 (96kHz, 24-bit, HD, Stereo)
   - ✅ 드래그 앤 드롭 순서 조정 (Framer Motion)
   - ✅ 재생/일시정지 버튼 UI
   - ⚠️ **재생 기능만 미작동**

3. **Dolby Atmos 결정 페이지**
   - ✅ Step 1→2 사이 독립 페이지
   - ✅ Yes/No 선택
   - ✅ 자동 트랙 생성

4. **Step 2 (트랙 정보) - 완벽 구현**
   - ✅ 오디오 파일 테이블 형식 표시
   - ✅ 트랙별 메타데이터 입력
   - ✅ Contributor 관리 (앨범/트랙 아티스트 자동 제안)
   - ✅ 스크롤 위치 보존

5. **UI/UX 개선**
   - ✅ Glass Morphism 디자인
   - ✅ 부드러운 Spring 애니메이션 (stiffness: 120, damping: 30)
   - ✅ HD 배지 선명도 개선
   - ✅ 모던 컬러풀 Pills (스펙 표시)

6. **보안 업데이트**
   - ✅ React 19.1.0 → 19.2.0 (CVE-2025-XXXX 예방)
   - ✅ npm audit: 0 vulnerabilities

7. **폼 구조 개선**
   - ✅ 7-step → 5-step (QUICK_FIX.md 완료)
   - ✅ 마케팅 Steps 제거
   - ✅ Success 페이지에 마케팅 버튼 추가

---

## ❌ 미해결 문제

### 🎵 오디오 재생 기능 미작동

**증상:**
- 재생 버튼 클릭 → ✅ toggleAudioPlayback 호출됨
- ✅ `audio.play()` 성공
- ✅ 로그: "Audio 0 playing successfully!"
- ❌ **하지만 소리가 안 들림**
- ❌ **시간이 0:00에서 진행 안 됨**

**발견된 근본 원인 (Sequential + Explore 분석):**

1. **Audio 객체가 1개만 저장됨** ⚠️ CRITICAL
   ```
   🎬 Creating audio elements for 6 files
   audioRefs.current.length: 1  ← 6개여야 하는데 1개!
   ```

2. **useEffect 의존성 문제**
   - `[formData.audioFiles]` 사용 시 무한 루프 위험
   - React가 배열 객체 재생성으로 감지

3. **Reorder.Item 리렌더링 문제**
   - 드래그 시 audio element 재생성
   - 재생 중단됨

4. **currentTime 업데이트 미구현**
   - `currentTime={0}` 하드코딩
   - timeupdate 이벤트 감시 없음

---

## 🛠️ 시도한 해결책 (실패)

### 시도 1: AudioContext 제거
- AudioContext가 blob URL 간섭 → 제거
- 결과: 여전히 작동 안 함

### 시도 2: volume/muted 명시적 설정
- audio.volume = 1.0, audio.muted = false
- 결과: 설정은 되지만 재생 안 됨

### 시도 3: Audio를 Reorder.Item 밖으로
- JSX로 audio elements를 Reorder.Group 밖에 배치
- 결과: JSX 구조 에러 (Fragment 충돌)

### 시도 4: useEffect로 Audio 객체 생성
- JavaScript로 `new Audio()` 생성
- 결과: 6개 파일인데 1개만 생성됨 (왜인지 불명)

### 시도 5: dragListener={false}
- Reorder.Item의 드래그 차단
- 결과: 버튼 클릭은 됨, but 드래그도 안 됨

---

## 💡 추천 해결 방향 (다음 세션)

### ✅ 옵션 1: AudioPlayer.tsx 컴포넌트 사용 (권장)

**파일**: `/Users/ryansong/Desktop/n3rve-onbaording/frontend/src/components/AudioPlayer.tsx`

**이유:**
- 이미 존재하고 작동하는 컴포넌트
- timeupdate 이벤트 올바르게 구현됨
- React 리렌더링 고려된 설계

**작업 순서:**
1. AudioPlayer.tsx 코드 분석
2. ImprovedReleaseSubmissionWithDnD에 통합
3. Props 전달: file, onTimeUpdate, onEnded
4. ModernWaveform과 연결
5. 테스트 및 검증

**예상 시간**: 1-2시간

---

### ⚠️ 옵션 2: Web Audio API 사용

**개요:**
- AudioContext로 완전히 재구현
- AudioBufferSourceNode 사용
- 더 높은 제어력

**단점:**
- 복잡한 구현
- 파일 전체를 메모리로 로드
- 오버엔지니어링 가능성

**예상 시간**: 3-4시간

---

### 🔧 옵션 3: useMemo로 Audio 안정화

**아이디어:**
```typescript
const stableAudios = useMemo(() => {
  return formData.audioFiles.map((file, index) => {
    const audio = new Audio();
    audio.src = URL.createObjectURL(file);
    audio.volume = 1.0;
    return audio;
  });
}, [formData.audioFiles.length]); // 개수만 감시

useEffect(() => {
  stableAudios.forEach((audio, index) => {
    audioRefs.current[index] = audio;
  });
}, [stableAudios]);
```

**예상 시간**: 30분-1시간

---

## 📁 핵심 파일

### 주요 파일
1. **현재 작업 파일**
   - `frontend/src/pages/ImprovedReleaseSubmissionWithDnD.tsx`
   - 라인 1943-2074: 오디오 업로드 섹션
   - 라인 660-700: toggleAudioPlayback 함수

2. **참고 파일**
   - `frontend/src/components/AudioPlayer.tsx` (작동하는 예제)
   - `frontend/src/components/ModernWaveform.tsx` (파형 컴포넌트)
   - `frontend/src/utils/audioMetadata.ts` (메타데이터 추출)

3. **Checkpoint 백업**
   - `frontend/src/pages/ImprovedReleaseSubmissionWithDnD.tsx.checkpoint-20251207-161522`
   - 안정적인 버전 (드래그 앤 드롭 작동)

---

## 🔍 디버깅 정보

### 마지막 로그 (참고)
```
🎬 [Audio] useEffect triggered - files count: 6
➕ [Audio] Creating audio element 0-5 for ...
📊 [Audio] Audio 0-5 ready - duration: 335s

🎵 [Playback] Button clicked for index 0
🎵 [Playback] audioRefs.current.length: 1  ← 문제!
✅ [Playback] Audio 0 playing successfully!
(하지만 소리 안 들림, 시간 0:00 고정)
```

### 핵심 문제
- **audioRefs.current에 1개만 저장됨** (6개여야 함)
- useEffect가 6개 생성하지만 어디선가 1개로 줄어듦
- React Strict Mode 또는 Reorder.Item 리렌더링 때문일 가능성

---

## ✅ 다음 세션 시작 방법

### 1. 파일 상태 확인
```bash
cd /Users/ryansong/Desktop/n3rve-onbaording/frontend
git status
npm run build  # 현재 빌드 성공 확인
```

### 2. AudioPlayer.tsx 분석
```bash
cat src/components/AudioPlayer.tsx
```

### 3. 옵션 1 실행 (권장)
```typescript
// AudioPlayer.tsx의 패턴 적용
import AudioPlayer from '@/components/AudioPlayer';

// Step 1에서:
{formData.audioFiles.map((file, index) => (
  <AudioPlayer
    key={`player-${file.name}`}
    src={URL.createObjectURL(file)}
    onTimeUpdate={(currentTime) => {
      setAudioCurrentTimes(prev => {
        const updated = [...prev];
        updated[index] = currentTime;
        return updated;
      });
    }}
  />
))}
```

---

## 📝 Git 커밋 이력 (오늘)

**완료된 커밋:**
1. `6c8ad1a` - ImprovedReleaseSubmissionWithDnD 복구 및 개선
2. `2d15d0a` - QUICK_FIX.md 완료 + 문서 업데이트
3. `b7f6fb9` - React 19.2.0 보안 업그레이드
4. `249cc4b` - 오디오 volume/muted 설정
5. `2f40084` - AudioContext 제거
6. `0a318a7` - Audio element Reorder.Item 밖으로 이동
7. `74dbd6b` - useEffect로 audio 관리
8. `365aa0c` - toggleAudioPlayback 디버깅 로그
9. `7163b4f` - audio 초기화 순서 수정
10. `1ac16fb` - timeupdate 이벤트 구현
11. `221b422` - dragListener={false} 추가

**마지막 안정 상태:**
- `checkpoint-20251207-161522` (드래그 앤 드롭 작동, 오디오 제외)

---

## 🎯 작업 재개 시 체크리스트

### 시작 전 확인
- [ ] Checkpoint 백업 존재 확인
- [ ] 현재 Git 상태 확인 (`git status`)
- [ ] 서버 실행 중 확인 (백엔드 3001, 프론트 3000)
- [ ] 브라우저 캐시 클리어

### 옵션 1 실행 시
- [ ] AudioPlayer.tsx 읽기 및 분석
- [ ] props 인터페이스 파악
- [ ] ImprovedReleaseSubmissionWithDnD에 import
- [ ] 기존 재생 버튼 대체
- [ ] onTimeUpdate 콜백 구현
- [ ] ModernWaveform과 연결
- [ ] 테스트 및 검증

### 옵션 3 실행 시
- [ ] useMemo로 stableAudios 생성
- [ ] useEffect로 ref에 할당
- [ ] timeupdate 이벤트 리스너 추가
- [ ] 테스트 및 검증

---

## 🐛 알려진 이슈

### Issue #1: audioRefs에 1개만 저장됨
- **위치**: `frontend/src/pages/ImprovedReleaseSubmissionWithDnD.tsx`
- **재현**: 6개 파일 업로드 → audioRefs.current.length = 1
- **로그**: `🎬 Creating audio elements for 6 files` but refs.length = 1
- **원인**: React Strict Mode 또는 useEffect cleanup 문제
- **상태**: 미해결

### Issue #2: Reorder.Item 리렌더링
- **문제**: 드래그 시 내부 요소 재생성
- **영향**: audio element 파괴 → 재생 중단
- **시도**: dragListener={false} → 드래그도 안 됨
- **상태**: Workaround 필요

### Issue #3: currentTime 업데이트
- **문제**: ModernWaveform에 currentTime={0} 하드코딩
- **해결**: audioCurrentTimes 상태 추가함
- **상태**: 구현됨, but audio 재생 안 돼서 확인 불가

---

## 📋 참고 코드 스니펫

### AudioPlayer.tsx 패턴 (작동함)
```typescript
const AudioPlayer = ({ src, onTimeUpdate }: Props) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      const time = audio.currentTime;
      setCurrentTime(time);
      onTimeUpdate?.(time);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    return () => audio.removeEventListener('timeupdate', handleTimeUpdate);
  }, []);

  return <audio ref={audioRef} src={src} />;
};
```

### 현재 문제 코드
```typescript
// 라인 517-588: useEffect로 Audio 생성
useEffect(() => {
  formData.audioFiles.forEach((file, index) => {
    const audio = new Audio();
    // ...
    audioRefs.current[index] = audio;  // 1개만 저장됨!
  });
}, [formData.audioFiles]);
```

---

## 🎯 즉시 실행 가능한 해결책

### Quick Fix (30분)
```typescript
// 1. AudioPlayer.tsx 방식 채택
{formData.audioFiles.map((file, index) => (
  <div key={`audio-container-${index}`} className="hidden">
    <audio
      ref={(el) => audioRefs.current[index] = el}
      src={URL.createObjectURL(file)}
      onTimeUpdate={(e) => {
        setAudioCurrentTimes(prev => {
          const updated = [...prev];
          updated[index] = e.currentTarget.currentTime;
          return updated;
        });
      }}
    />
  </div>
))}
```

위치: Reorder.Group 다음, 조건문 밖

---

## 🌐 테스트 방법

### 성공 기준
1. ✅ 오디오 파일 6개 업로드
2. ✅ 콘솔 로그: `audioRefs.current.length: 6`
3. ✅ 재생 버튼 클릭 → 소리 들림
4. ✅ 시간 진행 (0:00 → 0:01 → 0:02...)
5. ✅ 파형 진행률 표시
6. ✅ 드래그 앤 드롭 작동

### 테스트 명령어
```bash
cd /Users/ryansong/Desktop/n3rve-onbaording/frontend
npm run build  # 빌드 확인
# 브라우저: http://localhost:3000
# Cmd + Shift + R (캐시 클리어)
```

---

## 📞 연락처 및 참고사항

**프로젝트**: N3RVE 온보딩 플랫폼
**기술 스택**: React 19.2.0, Vite, Framer Motion, NestJS
**작업 브랜치**: main
**서버 포트**: Frontend 3000, Backend 3001

**다음 세션 시작 시:**
1. 이 MD 파일 읽기
2. Checkpoint 상태 확인
3. 옵션 1 (AudioPlayer 활용) 실행 권장
4. 30분-2시간 소요 예상

---

**마지막 업데이트**: 2024-12-07 오후 8시
**작성자**: Claude Code
**상태**: 작업 대기 중
