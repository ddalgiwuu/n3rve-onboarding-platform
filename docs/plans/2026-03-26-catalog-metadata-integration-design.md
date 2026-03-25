# Catalog Metadata Integration Design

Date: 2026-03-26
Status: Approved

## Purpose

NanoClaw이 FUGA에서 추출한 음원 메타데이터(178 프로덕트, 1,402 트랙, 211 아티스트)를
n3rve-onboarding-platform에 통합. 세 가지 목적:

1. 어드민 대시보드에서 전체 카탈로그 조회/검색
2. 새 Submission 제출 시 기존 카탈로그 데이터 자동 매핑
3. FUGA 시스템과 동기화 상태 추적 (DELIVERED 등)

## Data Sources

| File | Content | Records |
|------|---------|---------|
| `n3rve_full_catalog.json` | 프로덕트+에셋+기여자(DSP URL 포함)+가사 | 178 products, 1,402 assets |
| `n3rve_artist_identifiers.json` | 아티스트/기여자 Spotify/Apple ID | 211 artists, 443 people |
| `n3rve_products_metadata.json` | 프로덕트 상세 메타데이터 (audio quality 등) | 15 products |

## Architecture

### Deployment
- Frontend: Vercel (n3rve-onboarding-platform.vercel.app)
- Backend: EC2 (52.78.81.116) via Docker Compose
- DB: MongoDB Atlas
- CI/CD: GitHub Actions → Docker Hub → EC2

### Authentication for Sync API
- `x-api-key` header — NanoClaw 자동 동기화용
- Internal network (localhost/private IP) — 인증 없이 접근

### Sync Flow
```
NanoClaw → POST /api/catalog/sync/products (x-api-key)
         → Server upserts by fugaId
         → Auto-links to Submission by UPC match
         → Updates fugaSyncStatus
```

## Data Model

### New Models

#### CatalogProduct
- fugaId (unique) — FUGA internal ID
- name, upc, catalogNumber, state
- label, labelId, displayArtist
- genre, subgenre (JSON), language
- releaseFormatType, productType
- cLineText, pLineText
- consumerReleaseDate, originalReleaseDate, addedDate
- parentalAdvisory, releaseVersion
- suborg (String[]), territories
- artists (embedded JSON — id, name, primary, spotifyUrl, appleMusicUrl)
- syncedAt, syncSource
- submissionId? → Submission (UPC matching)

#### CatalogAsset
- fugaId (unique)
- isrc, name, displayArtist, version
- duration, sequence
- genre, subgenre, alternateGenre, alternateSubgenre (JSON)
- language, audioLocale
- versionTypes (JSON[])
- lyrics, hasLyrics
- pLineYear, pLineText
- rightsClaim, rightsHolderName
- recordingYear, recordingLocation, countryOfRecording
- assetCatalogTier
- parentalAdvisory
- audio, originalEncodings (JSON)
- artists (embedded JSON)
- contributors (embedded JSON — personId, name, role, roleId, spotifyUrl, appleMusicUrl)
- publishers (embedded JSON)
- productId → CatalogProduct

#### CatalogArtist
- fugaId (unique)
- name, type (ARTIST | CONTRIBUTOR)
- spotifyId, spotifyUrl
- appleMusicId, appleMusicUrl
- roles (String[])
- syncedAt

### Existing Model Changes

#### Submission (additions)
- catalogProductId? → CatalogProduct
- fugaSyncStatus: NOT_SYNCED | SYNCED | MISMATCH

## API Endpoints

### Sync (NanoClaw calls)
- POST /api/catalog/sync/products — Bulk upsert products + assets + artists
- POST /api/catalog/sync/artists — Bulk upsert artist identifiers
- GET  /api/catalog/sync/status — Last sync time, counts

### Query (Frontend)
- GET /api/catalog/products — List with search, filter, pagination
- GET /api/catalog/products/:id — Detail with assets, contributors
- GET /api/catalog/artists — List with search, DSP profiles
- GET /api/catalog/artists/:id — Detail with products/tracks
- GET /api/catalog/assets/search — Track search by ISRC, name, artist
- GET /api/catalog/stats — Dashboard statistics

### Linking
- POST /api/catalog/link/:productId — Manual Submission link
- GET  /api/catalog/unlinked — Products not linked to Submission

## Frontend

### 1. Catalog Page (/catalog)
- Stats bar: total products, tracks, artists, labels, last sync time
- Filter/search: keyword, status, label, format
- Product table with columns: name, artist, UPC, format, state, track count, link status
- Click product → detail page with track list

### 2. Product Detail
- Product info header
- Track list with accordion:
  - Track number, title (version), duration
  - ISRC, audio quality
  - Contributors (expandable, grouped by role)
  - Lyrics (expandable)
- Artist section with DSP links

### 3. Submission Badges
- FUGA sync status badge on each Submission card
- 🔗 Synced / ⚠️ Mismatch / grey Not linked
- Click badge → navigate to catalog detail

### 4. Artists Tab (/catalog/artists)
- Artist list with Spotify/Apple Music links
- Click → artist's products and tracks
