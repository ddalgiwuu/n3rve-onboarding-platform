# 🎤 FUGA Artist Form - 구현 가이드

## 📊 현재 진행 상황 (2025-12-12)

### ✅ 완료된 작업

#### 1. TypeScript 타입 정의
**파일**: `/frontend/src/types/fugaArtist.ts`
- `CompleteFugaArtist` - 완전한 아티스트 데이터 구조
- `FugaArtistFormData` - 폼 입력 데이터
- `ArtistGender` - 7개 옵션
- `SocialMovement` - 17개 옵션
- `FugaArtistImage` - 이미지 업로드 구조
- `FugaSocialMedia` - 15개 플랫폼

#### 2. Validation 유틸리티
**파일**: `/frontend/src/utils/fugaArtistValidation.ts`
- URL 패턴 검증 (Spotify, Apple Music, YouTube 등)
- Spotify ID 자동 추출 (URL → ID)
- Apple Music ID 자동 추출
- 이미지 파일 검증 (크기, 포맷)
- 전체 폼 검증 함수

#### 3. ImageUploader 컴포넌트
**파일**: `/frontend/src/components/fuga/ImageUploader.tsx`
- Drag & drop 지원
- 이미지 미리보기
- 파일 크기/포맷 검증
- 4가지 타입 지원 (avatar, banner, logo, pressShot)
- Dropbox 통합 준비됨

#### 4. FugaArtistModal 기본 구조
**파일**: `/frontend/src/components/fuga/FugaArtistModal.tsx`
- 섹션별 collapsible UI (7개 섹션)
- Basic Information 섹션 완성 (5개 필드)
- Biography 섹션 완성 (2개 필드)
- Images 섹션 기본 구현 (4개 업로더)

---

## 🚧 다음 세션에서 구현할 내용

### SECTION 4: Social Media & Web Presence (13개 플랫폼)

**필요한 컴포넌트**: `SocialMediaGrid.tsx`

**필드 목록**:
```typescript
1. Spotify Artist URL
2. Apple Music URL
3. YouTube URL
4. SoundCloud URL
5. Instagram URL
6. TikTok URL
7. Facebook URL
8. Twitter/X URL
9. Triller URL
10. Snapchat URL
11. Twitch URL
12. Pinterest URL
13. Tumblr URL
14. Website URL
15. Tourdates URL
```

**구현 요구사항**:
- URL 입력 필드 (각 플랫폼별)
- Auto-validation (실시간 URL 검증)
- Platform icon 표시
- Help tooltip (각 플랫폼 ID 찾는 방법)
- 3개 그룹으로 분류:
  - Major Platforms (Spotify, Apple, YouTube)
  - Social Platforms (Instagram, TikTok, Facebook 등)
  - Other Platforms (Twitch, Pinterest 등)

**샘플 코드 구조**:
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  {socialMediaPlatforms.map(platform => (
    <div key={platform.key}>
      <label className="flex items-center gap-2">
        <platform.icon className="w-4 h-4" />
        {platform.label}
      </label>
      <input
        type="url"
        value={formData[platform.key]}
        onChange={(e) => updateSocialMedia(platform.key, e.target.value)}
        placeholder={platform.placeholder}
        className="..."
      />
    </div>
  ))}
</div>
```

---

### SECTION 5: DSP Identifiers (3개 필드)

**구현 요구사항**:
- Spotify Artist ID (auto-extract from URL)
- Apple Music Artist ID (auto-extract from URL)
- SoundCloud Artist ID
- Real-time ID extraction
- Validation feedback

**Auto-extraction 로직**:
```tsx
const handleSpotifyUrlChange = (url: string) => {
  const id = extractSpotifyId(url);
  if (id) {
    setFormData({ ...formData, spotifyUrl: url, spotifyId: id });
    toast.success('Spotify ID extracted: ' + id);
  }
};
```

---

### SECTION 6: Additional Metadata (2개 필드)

**필드**:
1. **Sync History** (Yes/No radio)
   - Toggle + conditional textarea
   - If "Yes" → Show "Artist Sync History" textarea

2. **Social Movements** (Multi-select dropdown)
   - 17개 옵션 (LGBTQ+ Rights, Climate Action 등)
   - 검색 가능
   - Selected items chip display
   - Remove 기능

**구현 컴포넌트**: `MultiSelectDropdown.tsx`

---

### SECTION 7: Name Translations

**재사용**: EnhancedArtistModal의 Translation 섹션
- 이미 구현된 코드 복사
- 10개 언어 지원
- 동적 추가/삭제

---

## 🔧 Backend 확장 작업

### 1. Database Schema 확장

**파일**: `/backend/src/schemas/savedArtist.schema.ts`

```typescript
@Schema({ timestamps: true })
export class SavedArtist {
  // 기존 필드 유지
  @Prop({ required: true })
  name: string;

  @Prop([{ language: String, name: String }])
  translations: Array<{ language: string; name: string }>;

  // FUGA 필드 추가
  @Prop()
  country: string;

  @Prop()
  currentCity: string;

  @Prop()
  hometown: string;

  @Prop()
  gender: string;

  @Prop({ maxlength: 2000 })
  bio: string;

  @Prop()
  similarArtists: string;

  @Prop({ type: Object })
  images: {
    avatar?: string;
    banner?: string;
    logo?: string;
    pressShot?: string;
  };

  @Prop({ type: Object })
  socialMedia: {
    spotify?: string;
    appleMusic?: string;
    youtube?: string;
    soundcloud?: string;
    tiktok?: string;
    facebook?: string;
    instagram?: string;
    twitter?: string;
    // ... 나머지 플랫폼
  };

  @Prop()
  hasSyncHistory: boolean;

  @Prop()
  syncHistoryDetails: string;

  @Prop([String])
  socialMovements: string[];
}
```

### 2. API Endpoints

**파일**: `/backend/src/artists/artists.controller.ts`

```typescript
@Post('fuga-artist')
async createFugaArtist(@Body() dto: CreateFugaArtistDto) {
  // 1. Validate input
  // 2. Upload images to Dropbox (if files provided)
  // 3. Save to database
  // 4. Return created artist
}

@Put('fuga-artist/:id')
async updateFugaArtist(@Param('id') id: string, @Body() dto: UpdateFugaArtistDto) {
  // Update FUGA artist
}

@Get('fuga-artists')
async getFugaArtists(@Query() query: GetArtistsQueryDto) {
  // Get all FUGA artists with search/filter
}
```

### 3. Dropbox Integration

**이미지 업로드 경로**:
```
/n3rve-artists/{artistId}/
  ├── avatar.{ext}
  ├── banner.{ext}
  ├── logo.{ext}
  └── press-shot.{ext}
```

**업로드 함수**:
```typescript
const uploadArtistImage = async (
  file: File,
  artistId: string,
  type: 'avatar' | 'banner' | 'logo' | 'pressShot'
): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('path', `/n3rve-artists/${artistId}/${type}`);

  const response = await api.post('/dropbox/upload', formData);
  return response.data.url;
};
```

---

## 📋 구현 체크리스트 (다음 세션)

### Frontend Components (6-8일)

- [ ] **SocialMediaGrid.tsx** (2일)
  - 15개 플랫폼 URL 입력
  - Real-time validation
  - Platform icons
  - Help tooltips

- [ ] **DSPIdentifierSection.tsx** (1일)
  - Auto-extraction logic
  - ID validation
  - Visual feedback

- [ ] **MultiSelectDropdown.tsx** (1-2일)
  - Social Movements selector
  - Search functionality
  - Chip display
  - Remove items

- [ ] **TranslationSection.tsx** (0.5일)
  - Copy from EnhancedArtistModal
  - Minor adjustments

- [ ] **Complete FugaArtistModal** (2일)
  - Integrate all sections
  - Form state management
  - Complete validation
  - Save logic with Dropbox upload

- [ ] **Mobile Responsive** (1일)
  - Test on mobile viewports
  - Adjust layouts
  - Touch-friendly controls

### Backend Implementation (3-4일)

- [ ] **Schema Extension** (0.5일)
  - Extend SavedArtist model
  - Migration script

- [ ] **API Endpoints** (1일)
  - POST /api/artists/fuga-artist
  - PUT /api/artists/fuga-artist/:id
  - GET /api/artists/fuga-artists

- [ ] **Dropbox Integration** (1일)
  - Image upload service
  - Path management
  - Error handling

- [ ] **Testing** (1-2일)
  - Unit tests
  - Integration tests
  - E2E tests

### Integration & Polish (2-3일)

- [ ] **MarketingSubmission Integration**
  - Replace EnhancedArtistModal with FugaArtistModal
  - Data flow testing

- [ ] **Store Integration**
  - savedArtistsStore 확장
  - FUGA artist methods

- [ ] **Final Testing**
  - Complete user journey
  - Edge cases
  - Error scenarios

---

## 🎯 빠른 시작 가이드 (다음 세션)

### 1단계: Social Media 섹션 완성
```bash
# 새 파일 생성
/frontend/src/components/fuga/SocialMediaGrid.tsx
```

### 2단계: FugaArtistModal 완성
```bash
# 편집
/frontend/src/components/fuga/FugaArtistModal.tsx
# Section 4-7 구현
```

### 3단계: Backend API
```bash
# 편집
/backend/src/artists/artists.controller.ts
/backend/src/artists/artists.service.ts
/backend/src/schemas/savedArtist.schema.ts
```

### 4단계: 통합
```bash
# 편집
/frontend/src/pages/MarketingSubmission.tsx
# Line 745-754: EnhancedArtistModal → FugaArtistModal
```

---

## 📁 생성된 파일

1. ✅ `/frontend/src/types/fugaArtist.ts` - 타입 정의
2. ✅ `/frontend/src/utils/fugaArtistValidation.ts` - Validation
3. ✅ `/frontend/src/components/fuga/ImageUploader.tsx` - 이미지 업로더
4. ✅ `/frontend/src/components/fuga/FugaArtistModal.tsx` - 모달 기본 구조

---

## 🔗 관련 문서

- `FUGA_ARTIST_SUBMISSION.md` - FUGA 프로세스 설명
- `FUGA_MARKETING_FORM_COMPLETE.md` - 마케팅 폼 구조
- Sequential Agent Report - 완전한 구현 설계

---

## ⏱️ 예상 소요 시간

- ✅ **완료**: 타입, Validation, ImageUploader, Modal Shell (2일분)
- 🚧 **남은 작업**: Social Media, DSP, Metadata, Backend, 통합 (11-16일)

**총 진행률**: ~15%

---

## 🎯 다음 세션 우선순위

1. **SocialMediaGrid** (가장 많은 필드 - 15개)
2. **MultiSelectDropdown** (Social Movements)
3. **Backend API** (데이터 저장)
4. **통합 테스트**

---

**작성일**: 2025-12-12
**다음 세션**: SECTION 4 (Social Media)부터 시작
