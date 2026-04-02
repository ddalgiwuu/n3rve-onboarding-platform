# Communication Tracking Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Track QC rejections, DSP tickets, and marketing emails per album (UPC) with auto-ingestion from Outlook and manual entry in admin UI.

**Architecture:** New `CommunicationLog` Prisma model linked to `Submission` and `CatalogProduct` via UPC. NestJS `communications` module with CRUD + API key auth for NanoClaw. React admin page with timeline view. so8 cron enhanced to POST to the API.

**Tech Stack:** NestJS, Prisma (MongoDB), React + Vite, Tailwind CSS, Axios, NanoClaw (Claude Agent SDK)

**Repo:** `/Users/ryan/DEV/n3rve-onboarding-platform`

---

## Task 1: Prisma Schema — Add CommunicationLog model

**Files:**
- Modify: `backend/prisma/schema.prisma`

**Step 1: Add enums and model to schema**

Add before the `// ==================== CATALOG ENUMS ====================` section:

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
  id               String              @id @default(auto()) @map("_id") @db.ObjectId
  submissionId     String?             @db.ObjectId
  catalogProductId String?             @db.ObjectId
  upc              String
  type             CommunicationType
  source           CommunicationSource
  subject          String
  summary          String
  senderEmail      String?
  dsp              String?
  receivedAt       DateTime            @db.Date
  outlookMessageId String?             @unique
  metadata         Json?
  status           String              @default("OPEN")
  resolvedBy       String?
  resolvedAt       DateTime?           @db.Date
  createdAt        DateTime            @default(now()) @db.Date
  updatedAt        DateTime            @updatedAt @db.Date

  submission       Submission?         @relation(fields: [submissionId], references: [id])
  catalogProduct   CatalogProduct?     @relation(fields: [catalogProductId], references: [id])

  @@index([upc])
  @@index([type])
  @@index([receivedAt])
  @@index([submissionId])
  @@index([catalogProductId])
}
```

**Step 2: Add relation fields to existing models**

In `model Submission`, add after `dspOverrides`:
```prisma
  communicationLogs  CommunicationLog[]
```

In `model CatalogProduct`, add after `assets`:
```prisma
  communicationLogs  CommunicationLog[]
```

**Step 3: Generate Prisma client**

Run: `cd backend && npx prisma generate`
Expected: "Generated Prisma Client"

**Step 4: Push schema to MongoDB**

Run: `cd backend && npx prisma db push`
Expected: Schema synced without errors

**Step 5: Commit**

```bash
git add backend/prisma/schema.prisma
git commit -m "feat: add CommunicationLog model for email tracking per album"
```

---

## Task 2: NestJS Communications Module — Service + DTOs

**Files:**
- Create: `backend/src/communications/communications.module.ts`
- Create: `backend/src/communications/communications.service.ts`
- Create: `backend/src/communications/communications.controller.ts`
- Create: `backend/src/communications/dto/create-communication.dto.ts`
- Create: `backend/src/communications/dto/update-communication.dto.ts`
- Modify: `backend/src/app.module.ts`

**Step 1: Create DTOs**

`backend/src/communications/dto/create-communication.dto.ts`:
```typescript
import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';

export class CreateCommunicationDto {
  @IsString() upc: string;
  @IsEnum(['QC_REJECTION', 'QC_PASS', 'DSP_TICKET', 'MARKETING', 'GENERAL'])
  type: string;
  @IsEnum(['AUTO_EMAIL', 'MANUAL'])
  source: string;
  @IsString() subject: string;
  @IsString() summary: string;
  @IsOptional() @IsString() senderEmail?: string;
  @IsOptional() @IsString() dsp?: string;
  @IsDateString() receivedAt: string;
  @IsOptional() @IsString() outlookMessageId?: string;
  @IsOptional() metadata?: any;
}
```

`backend/src/communications/dto/update-communication.dto.ts`:
```typescript
import { IsString, IsOptional } from 'class-validator';

export class UpdateCommunicationDto {
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() upc?: string;
  @IsOptional() @IsString() summary?: string;
  @IsOptional() @IsString() resolvedBy?: string;
}
```

**Step 2: Create service**

`backend/src/communications/communications.service.ts`:
```typescript
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommunicationDto } from './dto/create-communication.dto';
import { UpdateCommunicationDto } from './dto/update-communication.dto';

@Injectable()
export class CommunicationsService {
  private readonly logger = new Logger(CommunicationsService.name);

  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCommunicationDto) {
    // Try to match UPC to CatalogProduct and Submission
    const catalogProduct = await this.prisma.catalogProduct.findFirst({
      where: { upc: dto.upc },
    });
    const submission = catalogProduct?.submissionId
      ? await this.prisma.submission.findUnique({
          where: { id: catalogProduct.submissionId },
        })
      : null;

    return this.prisma.communicationLog.create({
      data: {
        upc: dto.upc,
        type: dto.type as any,
        source: dto.source as any,
        subject: dto.subject,
        summary: dto.summary,
        senderEmail: dto.senderEmail,
        dsp: dto.dsp,
        receivedAt: new Date(dto.receivedAt),
        outlookMessageId: dto.outlookMessageId,
        metadata: dto.metadata,
        catalogProductId: catalogProduct?.id,
        submissionId: submission?.id || catalogProduct?.submissionId,
      },
    });
  }

  async findAll(filters?: {
    upc?: string;
    type?: string;
    status?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }) {
    const where: any = {};
    if (filters?.upc) where.upc = filters.upc;
    if (filters?.type) where.type = filters.type;
    if (filters?.status) where.status = filters.status;
    if (filters?.from || filters?.to) {
      where.receivedAt = {};
      if (filters.from) where.receivedAt.gte = new Date(filters.from);
      if (filters.to) where.receivedAt.lte = new Date(filters.to);
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 50;

    const [items, total] = await Promise.all([
      this.prisma.communicationLog.findMany({
        where,
        orderBy: { receivedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.communicationLog.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async findOne(id: string) {
    const log = await this.prisma.communicationLog.findUnique({ where: { id } });
    if (!log) throw new NotFoundException('Communication log not found');
    return log;
  }

  async findByUpc(upc: string) {
    return this.prisma.communicationLog.findMany({
      where: { upc },
      orderBy: { receivedAt: 'desc' },
    });
  }

  async update(id: string, dto: UpdateCommunicationDto) {
    const data: any = { ...dto };
    if (dto.status === 'RESOLVED') {
      data.resolvedAt = new Date();
    }
    return this.prisma.communicationLog.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.communicationLog.delete({ where: { id } });
  }

  async getStats() {
    const [byType, byStatus] = await Promise.all([
      this.prisma.communicationLog.groupBy({
        by: ['type'],
        _count: true,
      }),
      this.prisma.communicationLog.groupBy({
        by: ['status'],
        _count: true,
      }),
    ]);
    return { byType, byStatus };
  }
}
```

**Step 3: Create controller**

`backend/src/communications/communications.controller.ts`:
```typescript
import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { CommunicationsService } from './communications.service';
import { CreateCommunicationDto } from './dto/create-communication.dto';
import { UpdateCommunicationDto } from './dto/update-communication.dto';
import { ApiKey } from '../auth/decorators/api-key.decorator';
import { Public } from '../auth/decorators/public.decorator';

@Controller('communications')
export class CommunicationsController {
  constructor(private readonly service: CommunicationsService) {}

  // API key auth for NanoClaw auto-ingestion OR JWT for admin
  @Post()
  @ApiKey()
  @Public()
  create(@Body() dto: CreateCommunicationDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(
    @Query('upc') upc?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.findAll({
      upc, type, status, from, to,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get('stats')
  getStats() {
    return this.service.getStats();
  }

  @Get('by-upc/:upc')
  findByUpc(@Param('upc') upc: string) {
    return this.service.findByUpc(upc);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCommunicationDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
```

**Step 4: Create module**

`backend/src/communications/communications.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CommunicationsController } from './communications.controller';
import { CommunicationsService } from './communications.service';

@Module({
  imports: [PrismaModule],
  controllers: [CommunicationsController],
  providers: [CommunicationsService],
  exports: [CommunicationsService],
})
export class CommunicationsModule {}
```

**Step 5: Register in AppModule**

In `backend/src/app.module.ts`, add import:
```typescript
import { CommunicationsModule } from './communications/communications.module';
```
Add `CommunicationsModule` to the `imports` array.

**Step 6: Verify build**

Run: `cd backend && npm run build`
Expected: No errors

**Step 7: Commit**

```bash
git add backend/src/communications/ backend/src/app.module.ts
git commit -m "feat: add communications NestJS module with CRUD + API key auth"
```

---

## Task 3: API Key Auth for NanoClaw Ingestion

**Files:**
- Modify: `backend/src/auth/decorators/api-key.decorator.ts` (verify exists)
- Modify: `backend/.env` (add COMMUNICATIONS_API_KEY)

**Step 1: Verify ApiKey decorator exists**

Check `backend/src/auth/decorators/api-key.decorator.ts` — the `@ApiKey()` decorator and `ApiKeyGuard` already exist (uses `CATALOG_API_KEY` env var). The POST endpoint uses `@ApiKey() @Public()` to bypass JWT and use API key instead.

If the existing guard uses `CATALOG_API_KEY`, either reuse it or add a `COMMUNICATIONS_API_KEY`. For simplicity, reuse `CATALOG_API_KEY`.

**Step 2: Add API key to NanoClaw .env**

In `~/.nanoclaw/.env`, add:
```
N3RVE_PLATFORM_API_URL=https://n3rve-onboarding-platform.fly.dev/api
N3RVE_PLATFORM_API_KEY=<same as CATALOG_API_KEY>
```

**Step 3: Commit**

```bash
git commit -m "feat: configure API key auth for communication ingestion"
```

---

## Task 4: Enhance so8 Cron Prompt

**Files:**
- Modify: NanoClaw scheduled task `so8-mail-monitor` prompt in DB

**Step 1: Update so8 prompt**

Update the `so8-mail-monitor` task prompt in NanoClaw's SQLite DB to include:
- Expanded keyword detection
- UPC extraction from email subject/body
- POST to n3rve-onboarding-platform API after Notion logging
- Dedup via outlookMessageId

New prompt (to be set via NanoClaw admin or direct DB update):

```
메일 모니터 (SO-8). Outlook(https://outlook.office.com/mail/0/)에서 새 메일 확인.

감지 키워드 (제목/본문): QC, rejected, rejection, 거절, 반려, accepted, delivered, approved, ticket, takedown, ad report, campaign, playlist, feature, Beatport, promote

신규 관련 메일 발견 시:
1. 이메일에서 UPC(13자리 숫자) 또는 앨범명 추출
2. 타입 분류:
   - QC 거절/rejected/반려 → QC_REJECTION
   - QC 통과/accepted/delivered → QC_PASS  
   - ticket/takedown → DSP_TICKET
   - ad report/campaign/playlist/feature → MARKETING
   - 나머지 → GENERAL
3. 노션 Music QC & Tickets DB(318c68fc611f81a0bcc8e03e894fdf09)에 기록
4. N3RVE Platform API에 POST:
   curl -X POST https://n3rve-onboarding-platform.fly.dev/api/communications \
     -H "Content-Type: application/json" \
     -H "X-API-Key: ${N3RVE_PLATFORM_API_KEY}" \
     -d '{"upc":"추출한UPC","type":"분류타입","source":"AUTO_EMAIL","subject":"이메일제목","summary":"본문요약","senderEmail":"발신자","dsp":"관련DSP","receivedAt":"수신시각ISO","outlookMessageId":"메시지ID"}'
5. UPC를 찾을 수 없으면 upc를 "UNMATCHED"로 설정하고 metadata에 원문 보존

신규 없으면 조용히 종료.
```

**Step 2: Update task in DB**

```bash
cd ~/.nanoclaw && npx tsx -e "
import Database from 'better-sqlite3';
const db = new Database('store/messages.db');
const newPrompt = \`메일 모니터 (SO-8)... [위의 전체 프롬프트]\`;
db.prepare('UPDATE scheduled_tasks SET prompt = ? WHERE id = ?').run(newPrompt, 'so8-mail-monitor');
console.log('Updated so8 prompt');
"
```

**Step 3: Add env vars to NanoClaw**

Add to `~/.nanoclaw/.env`:
```
N3RVE_PLATFORM_API_URL=https://n3rve-onboarding-platform.fly.dev/api
N3RVE_PLATFORM_API_KEY=<key>
```

---

## Task 5: Admin UI — Communications Page

**Files:**
- Create: `frontend/src/pages/admin/AdminCommunications.tsx`
- Create: `frontend/src/components/admin/CommunicationTimeline.tsx`
- Create: `frontend/src/components/admin/AddCommunicationModal.tsx`
- Modify: `frontend/src/App.tsx` (add route)
- Modify: `frontend/src/lib/api.ts` (add service functions)

**Step 1: Add API service functions**

In `frontend/src/lib/api.ts`, add:
```typescript
export const communicationService = {
  getAll: (params?: Record<string, string>) =>
    api.get('/communications', { params }).then(r => r.data),
  getByUpc: (upc: string) =>
    api.get(`/communications/by-upc/${upc}`).then(r => r.data),
  getStats: () =>
    api.get('/communications/stats').then(r => r.data),
  create: (data: any) =>
    api.post('/communications', data).then(r => r.data),
  update: (id: string, data: any) =>
    api.patch(`/communications/${id}`, data).then(r => r.data),
  remove: (id: string) =>
    api.delete(`/communications/${id}`).then(r => r.data),
};
```

**Step 2: Create CommunicationTimeline component**

`frontend/src/components/admin/CommunicationTimeline.tsx`:
- Takes `logs: CommunicationLog[]` prop
- Renders time-sorted list with type-based icons/colors:
  - QC_REJECTION: red circle
  - QC_PASS: green check
  - DSP_TICKET: orange triangle
  - MARKETING: blue star
  - GENERAL: gray dot
- Each item shows: date, subject, summary, status badge, sender
- Expandable for full details + metadata

**Step 3: Create AddCommunicationModal component**

`frontend/src/components/admin/AddCommunicationModal.tsx`:
- Form fields: UPC (with autocomplete from catalog), type (dropdown), subject, summary, DSP, senderEmail, receivedAt
- Source defaults to "MANUAL"
- Calls `communicationService.create()`

**Step 4: Create AdminCommunications page**

`frontend/src/pages/admin/AdminCommunications.tsx`:
- Tabs: "All" | "UNMATCHED" | by type
- Filter bar: type, status, date range
- List of communications with CommunicationTimeline
- "Add" button → AddCommunicationModal
- UNMATCHED tab: shows logs with upc="UNMATCHED" + UPC assignment UI
- Stats summary at top (from /communications/stats)

**Step 5: Add route in App.tsx**

```typescript
<Route path="/admin/communications" element={
  isAuthenticated && userRole === 'ADMIN' ? <AdminCommunications /> : <Navigate to="/login" />
} />
```

**Step 6: Add nav link**

Add "Communications" to admin sidebar/nav.

**Step 7: Verify**

Run: `cd frontend && npm run build`
Expected: No errors

**Step 8: Commit**

```bash
git add frontend/src/
git commit -m "feat: add communications admin page with timeline view and manual entry"
```

---

## Task 6: Submission Detail — Communications Tab

**Files:**
- Modify: `frontend/src/pages/admin/SubmissionDetail.tsx` (or equivalent)

**Step 1: Add Communications tab to submission detail**

In the submission detail page, add a "Communications" tab that:
- Fetches logs by UPC (from `submission.release.upc`)
- Renders CommunicationTimeline
- Includes "Add" button for manual entry (pre-fills UPC)

**Step 2: Commit**

```bash
git add frontend/src/pages/admin/
git commit -m "feat: add communications tab to submission detail page"
```

---

## Task 7: Deploy and Test

**Step 1: Push to GitHub**

```bash
git push origin main
```

GitHub Actions will auto-deploy to fly.io.

**Step 2: Verify API**

```bash
curl https://n3rve-onboarding-platform.fly.dev/api/communications/stats \
  -H "Authorization: Bearer <admin-jwt>"
```

**Step 3: Test NanoClaw ingestion**

```bash
curl -X POST https://n3rve-onboarding-platform.fly.dev/api/communications \
  -H "Content-Type: application/json" \
  -H "X-API-Key: <key>" \
  -d '{"upc":"8721466183299","type":"QC_PASS","source":"AUTO_EMAIL","subject":"Test","summary":"Test log","receivedAt":"2026-04-02T00:00:00Z"}'
```

**Step 4: Verify in admin UI**

Navigate to `/admin/communications` and confirm the test log appears.
