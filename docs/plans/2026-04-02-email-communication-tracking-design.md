# Email Communication Tracking per Album

**Date:** 2026-04-02
**Status:** Approved

## Problem

FUGA/DSP에서 오는 QC 거절, 티켓, 마케팅 리포트 등의 이메일이 Outlook에 쌓이지만, 앨범(UPC) 단위로 묶여있지 않아 추적이 어려움. 현재 so8 크론이 키워드 기반으로 감지만 하고 Notion에 기록하지만, 앨범별 히스토리를 볼 수 없음.

## Solution

n3rve-onboarding-platform에 `CommunicationLog` 모델을 추가하고, 기존 `QCLog`과 함께 앨범별 커뮤니케이션 타임라인을 제공.

## Architecture

### Data Flow

```
Outlook 이메일
    ↓ (so8 크론, 매시간)
NanoClaw 에이전트 (Sonnet 4.6)
    ↓ UPC/앨범명 추출
    ↓ POST /api/communications
n3rve-onboarding-platform API (NestJS)
    ↓ UPC → CatalogProduct/DigitalProduct 매핑
MongoDB (CommunicationLog)
    ↓
Admin UI — 앨범별 타임라인 뷰
```

### 1. Prisma Schema — `CommunicationLog`

```prisma
enum CommunicationType {
  QC_REJECTION
  QC_PASS
  DSP_TICKET
  MARKETING
  GENERAL
}

enum CommunicationSource {
  AUTO_EMAIL
  MANUAL
}

model CommunicationLog {
  id              String              @id @default(auto()) @map("_id") @db.ObjectId
  submissionId    String?             @db.ObjectId
  catalogProductId String?            @db.ObjectId
  upc             String
  type            CommunicationType
  source          CommunicationSource
  subject         String
  summary         String
  senderEmail     String?
  dsp             String?             // SPOTIFY | APPLE_MUSIC | FUGA | etc.
  receivedAt      DateTime            @db.Date
  outlookMessageId String?            @unique  // Dedup key
  metadata        Json?               // Attachments, campaign data, etc.
  status          String              @default("OPEN") // OPEN | ACKNOWLEDGED | RESOLVED
  resolvedBy      String?
  resolvedAt      DateTime?           @db.Date
  createdAt       DateTime            @default(now()) @db.Date
  updatedAt       DateTime            @updatedAt @db.Date

  submission      Submission?         @relation(fields: [submissionId], references: [id])
  catalogProduct  CatalogProduct?     @relation(fields: [catalogProductId], references: [id])

  @@index([upc])
  @@index([type])
  @@index([receivedAt])
  @@index([submissionId])
  @@index([catalogProductId])
}
```

Relations to add:
- `Submission` → `communicationLogs CommunicationLog[]`
- `CatalogProduct` → `communicationLogs CommunicationLog[]`

### 2. API Endpoints (NestJS)

```
POST   /api/communications          — Create log (auto or manual)
GET    /api/communications           — List with filters (upc, type, status, dateRange)
GET    /api/communications/:id       — Get single log
PATCH  /api/communications/:id       — Update (status, notes)
DELETE /api/communications/:id       — Delete

GET    /api/communications/by-upc/:upc  — All logs for a UPC (timeline)
GET    /api/communications/stats         — Summary counts by type/status
```

Auth: API key header (`X-API-Key`) for NanoClaw auto-ingestion, JWT for admin UI.

### 3. UPC Matching Logic

이메일에서 UPC 추출 순서:
1. **정규식**: 13자리 숫자 (UPC/EAN) — `/\b\d{13}\b/`
2. **제목/본문 파싱**: "UPC: 8721466183299" 또는 "(UPC 8721466183299)" 패턴
3. **앨범명 매칭**: UPC 없으면 제목에서 앨범명 추출 → CatalogProduct.name으로 fuzzy match
4. **Fallback**: 매칭 실패 시 `upc: "UNMATCHED"` + 원문 보존 → admin에서 수동 매핑

### 4. so8 크론 강화

현재 so8 프롬프트를 확장:
- Outlook에서 새 메일 확인
- QC/Ticket/Marketing 관련 메일 감지 (기존 키워드 + 확장)
- UPC/앨범명 추출
- **Notion 기록** (기존 유지) + **POST /api/communications** (신규)
- `outlookMessageId`로 중복 방지

키워드 확장:
- 기존: "QC 거절", "반려", "Apple Ticket", "Spotify Ticket"
- 추가: "QC", "rejected", "accepted", "delivered", "takedown", "ad report", "campaign", "Beatport", "playlist", "feature"

### 5. Admin UI

**위치**: `/admin/submission-management` 페이지 내 앨범 상세

**컴포넌트**:
- `CommunicationTimeline` — 앨범별 시간순 로그 리스트
  - 타입별 아이콘/색상 (QC=빨강, 티켓=주황, 마케팅=파랑, 일반=회색)
  - 상태 배지 (OPEN/ACKNOWLEDGED/RESOLVED)
  - 요약 텍스트 + 확장 시 전체 내용
- `AddCommunicationModal` — 수동 입력 폼
  - UPC (자동완성 from CatalogProduct)
  - 타입 선택
  - 제목, 요약, DSP, 발신자
- `CommunicationFilter` — 타입/상태/날짜 필터

**새 페이지**: `/admin/communications` — 전체 커뮤니케이션 대시보드
- 최근 로그 리스트
- UNMATCHED 항목 → 수동 UPC 매핑 UI
- 타입별 통계

### 6. Type Classification Rules

| 키워드 | 타입 |
|--------|------|
| QC 거절, rejected, rejection, 반려 | QC_REJECTION |
| QC 통과, accepted, delivered, approved | QC_PASS |
| Apple Ticket, Spotify Ticket, ticket, takedown | DSP_TICKET |
| ad report, campaign, playlist, feature, promote | MARKETING |
| 나머지 | GENERAL |

## Implementation Order

1. **Phase 1**: Prisma schema + migration + NestJS CRUD module
2. **Phase 2**: API key auth + POST endpoint for NanoClaw
3. **Phase 3**: so8 크론 프롬프트 확장 (UPC 추출 + API 호출)
4. **Phase 4**: Admin UI — 타임라인 뷰 + 수동 입력
5. **Phase 5**: 통계 대시보드 + UNMATCHED 매핑 UI

## Tech Decisions

- **기존 `QCLog` 모델과 분리**: QCLog은 내부 QC 검증용 (source: FUGA|INTERNAL), CommunicationLog은 외부 이메일 커뮤니케이션용. 목적이 다르므로 별도 모델.
- **MongoDB**: 기존 onboarding-platform 스택 유지
- **API key auth**: NanoClaw 자동 ingestion은 간단한 API key, admin은 기존 JWT
- **Notion 병행**: 기존 so8 Notion 기록은 유지 (백업 + 기존 워크플로우)
