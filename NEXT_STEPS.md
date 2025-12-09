# 🚀 다음 작업: 음원 제출 폼 재설계

## 📊 오늘까지 완료된 작업 (2025-11-25)

### ✅ FUGA SCORE 통합 (Phase 1-5 완료)

**Database** (7개 모델):
- DigitalProduct, FeatureReport, MarketingDriver, Guide
- SavedArtist (31개 필드), Track, ReleaseInfo

**UI Components** (14개):
- CommandPalette, TagMultiSelect, CharLimitTextarea, StarRating
- FocusTrackSelector, ArtistSelectionModal, AIPitchEditor, MarketingSection
- PlaylistSpreadsheetEditor
- FeatureReports, ArtistRoster, ReleaseProjects, MarketingSubmission

**Backend API** (20개 엔드포인트):
- DigitalProduct: 7개
- FeatureReport: 8개
- Submissions: 1개 (마케팅 업데이트)
- Guide: 4개 (예정)

**워크플로우**:
- Release Projects 갤러리 ✅
- Marketing Submission 페이지 ✅
- Artist Roster (자동 생성) ✅
- Feature Reports (Admin 플레이리스트 입력) ✅

---

## 🎯 다음 작업: 폼 재설계

### 목표
음원 메타데이터와 마케팅을 **완전히 분리**하고, **트랙 입력 시 오디오 파일 바로 업로드**

### 새로운 구조 (4 Steps)

```
Step 1: 앨범 정보 + 커버 아트 (통합)
  ┌──────────────┬────────────────┐
  │ 커버 아트    │ 앨범명: ____  │
  │ 드래그앤드롭 │ 아티스트: __ │
  │ [미리보기]   │ 장르: ______ │
  │              │ 날짜: ______ │
  └──────────────┴────────────────┘

Step 2: 트랙 + 오디오 (통합) ⭐
  Track 1:
  ┌───────────────────────────────┐
  │ 트랙명: [____________]        │
  │                               │
  │ 오디오: [Work_It.wav]        │
  │ ▓▓▓▓▓░░░ 3:42  [🎵] [X]     │
  │                               │
  │ 작곡: [___] 작사: [___]      │
  └───────────────────────────────┘
  [+ 트랙 추가]

Step 3: 배급 설정
  - 플랫폼, 지역, 가격

Step 4: 리뷰 & 제출
  - 최종 확인
  ↓
  Submit → Release Projects 등록
  ↓
Success 페이지:
  [🎯 마케팅 작성하기] → /marketing-submission/:id
  [⏭️  나중에 작성] → /release-projects
```

---

## 📋 구현 계획

### Week 1: Step 1 통합 (Day 1-2)
**Task**: 앨범 정보 + 커버 아트 통합

**파일**:
- `/components/steps/Step1AlbumInfoWithCover.tsx` (새로 생성)

**UI 구조**:
```tsx
<div className="grid md:grid-cols-2 gap-6">
  {/* Left: Cover Art Upload */}
  <CoverArtUploader
    value={coverArt}
    onChange={setCoverArt}
    preview={true}
    variant="large-preview"
  />

  {/* Right: Album Info Form */}
  <AlbumInfoForm
    data={albumData}
    onChange={setAlbumData}
  />
</div>
```

**기능**:
- 드래그앤드롭 커버 아트
- 실시간 미리보기 (1:1 비율 체크)
- 3000x3000px 최소 검증
- 자동 크롭/리사이즈 제안

---

### Week 2: Step 2 통합 (Day 3-7) ⭐ 핵심

**Task**: 트랙 메타데이터 + 오디오 파일 통합

**파일**:
- `/components/steps/Step2TrackWithAudio.tsx` (새로 생성)
- `/components/TrackCardWithUpload.tsx` (새 컴포넌트)

**UI 구조**:
```tsx
<Reorder.Group>
  {tracks.map((track, index) => (
    <TrackCardWithUpload
      index={index}
      track={track}
      onUpdate={handleTrackUpdate}
      onAudioUpload={handleAudioUpload}
      onRemove={handleRemoveTrack}
    />
  ))}
</Reorder.Group>

<AddTrackButton onClick={addNewTrack} />
```

**TrackCardWithUpload 컴포넌트**:
```tsx
┌─────────────────────────────────────────┐
│ 🎵 Track 1                    [≡] [X]  │
├─────────────────────────────────────────┤
│                                         │
│ 트랙명 (한글): [_____________]         │
│ 트랙명 (영문): [_____________]         │
│                                         │
│ 오디오 파일: ⭐                         │
│ ┌─────────────────────────────────┐    │
│ │ 📁 Work_It.wav                  │    │
│ │ ▓▓▓▓▓▓░░░░ 3:42 / 192kbps      │    │
│ │ [🎵 재생] [🔄 교체] [X 제거]    │    │
│ └─────────────────────────────────┘    │
│                                         │
│ 작곡가: [________]  작사가: [______]  │
│ ISRC: [___________]                    │
│ Explicit: [ ] Yes  [✓] No              │
└─────────────────────────────────────────┘
```

**기능**:
- 드래그앤드롭 오디오 파일
- 업로드 진행률 표시
- 파형 시각화 (canvas)
- 인라인 재생 (Audio API)
- Duration 자동 추출
- Format 검증 (WAV, MP3, FLAC)
- File size 검증
- 드래그로 트랙 순서 변경

---

### Week 3: 통합 & 제거 (Day 8-12)

**Task 1**: 마케팅 Steps 제거
- Step11MarketingDetails.tsx 제거
- Step12GoalsExpectations.tsx 제거
- 검증 로직 정리

**Task 2**: 4-Step 완성
- Step numbering 업데이트 (1-4)
- Progress bar 업데이트
- Navigation 수정

**Task 3**: Success Flow
```tsx
<SubmissionSuccess submissionId={id}>
  <div className="actions">
    <PrimaryButton onClick={() => navigate(`/marketing-submission/${id}`)}>
      🎯 마케팅 작성하기 (추천, 5-10분)
    </PrimaryButton>

    <SecondaryButton onClick={() => navigate('/release-projects')}>
      ⏭️ 나중에 작성하기
    </SecondaryButton>
  </div>

  <InfoBox>
    💡 두 경우 모두 음원은 이미 제출 완료!
    Release Projects에서 언제든 마케팅 추가 가능합니다.
  </InfoBox>
</SubmissionSuccess>
```

---

## 🎨 주요 컴포넌트 설계

### 1. CoverArtUploader (새로 생성)
```tsx
<div className="cover-art-uploader">
  <div className="upload-area" onDrop={handleDrop}>
    {preview ? (
      <img src={preview} className="cover-preview" />
    ) : (
      <div className="placeholder">
        <Image size={64} />
        <p>커버 아트 업로드</p>
        <p className="hint">3000x3000px 권장</p>
      </div>
    )}
  </div>

  <div className="upload-info">
    <p>파일명: {fileName}</p>
    <p>크기: {fileSize}</p>
    <p>해상도: {resolution}</p>
    {errors && <ErrorMessage />}
  </div>

  <button onClick={selectFile}>파일 선택</button>
  {preview && <button onClick={remove}>제거</button>}
</div>
```

### 2. TrackCardWithUpload (새로 생성) ⭐
```tsx
<div className="track-card">
  {/* Header */}
  <div className="track-header">
    <GripVertical /> {/* Drag handle */}
    <span>Track {index + 1}</span>
    <button onClick={remove}>X</button>
  </div>

  {/* Track Info */}
  <input placeholder="트랙명 (한글)" />
  <input placeholder="Track Title (EN)" />

  {/* Audio Upload - 핵심! */}
  <AudioFileUploader
    value={track.audioFile}
    onChange={handleAudioChange}
    onMetadataExtracted={handleMetadata}
  />

  {/* Waveform Visualization */}
  {audioFile && (
    <WaveformDisplay
      audioUrl={audioFile.url}
      duration={audioFile.duration}
      onPlay={handlePlay}
    />
  )}

  {/* Additional Fields */}
  <input placeholder="작곡가" />
  <input placeholder="작사가" />
  <input placeholder="ISRC" />
  <checkbox label="Explicit Content" />
</div>
```

### 3. AudioFileUploader (새로 생성)
```tsx
interface AudioFileUploaderProps {
  value: File | string | null;
  onChange: (file: File) => void;
  onMetadataExtracted: (metadata: AudioMetadata) => void;
}

// Features:
- Drag & drop
- Click to browse
- File validation (format, size, bitrate)
- Duration extraction
- Waveform generation
- Upload progress bar
- Preview playback
```

---

## ⚡ Quick Wins (우선 구현)

### Priority 1: TrackCardWithUpload (Day 1-3)
가장 중요한 기능! 트랙 + 오디오 통합

### Priority 2: CoverArtUploader (Day 4-5)
커버 아트 통합

### Priority 3: 마케팅 제거 (Day 6-7)
깔끔한 4-step 완성

---

## 🔧 기술 스택

**오디오 처리**:
- Web Audio API (파형, duration)
- wavesurfer.js (파형 시각화, 선택)
- react-h5-audio-player (재생)

**파일 업로드**:
- react-dropzone (드래그앤드롭)
- axios (업로드 진행률)
- Dropbox SDK (스토리지)

**추가 라이브러리** (필요 시):
```json
{
  "react-dropzone": "^14.2.0",
  "wavesurfer.js": "^7.7.0",
  "react-h5-audio-player": "^3.9.0"
}
```

---

## 📝 다음 세션 체크리스트

### 시작하기 전:
- [ ] 백그라운드 서버 정리
- [ ] 브랜치 생성: `feature/integrated-upload`
- [ ] 기존 폼 백업

### 구현 순서:
1. [ ] TrackCardWithUpload 컴포넌트
2. [ ] AudioFileUploader 컴포넌트
3. [ ] CoverArtUploader 컴포넌트
4. [ ] Step 1-2 통합
5. [ ] 마케팅 Steps 제거
6. [ ] Success 페이지 업데이트
7. [ ] 테스트

---

**저장일**: 2025-11-25
**상태**: 설계 완료, 구현 대기
**예상 기간**: 7일
