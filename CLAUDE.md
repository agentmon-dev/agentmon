# CLAUDE.md — agentmon

## 프로젝트 개요

**agentmon**은 AI 코딩 에이전트(Claude Code, Codex, Gemini CLI 등)의 토큰 사용량을 백그라운드에서 자동 수집하고, 웹 대시보드로 시각화하는 도구입니다.

- **저장소**: agentmon (모노레포)
- **도메인**: agentmon.dev
- **npm 패키지명**: agentmon
- **CLI 명령어**: `agentmon`
- **API 키 접두사**: `am_`
- **언어**: 영문 우선 (글로벌)

## 해결하려는 문제

- AI 에이전트 토큰 사용량을 자동으로 수집·시각화하는 도구가 없음
- ccusage는 CLI 즉시 조회 도구일 뿐, 지속적 수집기가 아님
- Tokscale은 수동 submit 방식이고 경쟁형 리더보드에 초점 — 개인 분석 대시보드 부재
- 개발자가 자신의 AI 사용 패턴, 비용 추이, 프로젝트별 분석을 볼 방법이 없음

## 차별화 포인트

- **백그라운드 자동 수집** — 데몬이 JSONL 변경을 감지하고 5분마다 서버로 전송
- **드릴다운 웹 대시보드** — 시간/프로젝트/모델별 분석, 단순 합계가 아닌 추이 확인
- **개인 분석 중심** — 리더보드가 아닌 "내 AI 사용 습관 대시보드"
- **조직 대시보드** — GitHub 스타일 조직을 만들어 팀 사용량 통합 모니터링
- **멀티 에이전트 지원** — Claude Code 먼저, 이후 Codex·Gemini CLI·Cursor 확장

## 기술 스택

| 레이어 | 기술 | 비고 |
|--------|------|------|
| CLI 에이전트 | Bun + TypeScript | JSONL 감시 + HTTP POST 데몬 |
| 웹 대시보드 | Next.js 16 (App Router, Turbopack) | shadcn/ui + Recharts |
| DB | Supabase (PostgreSQL) | 무료 티어 500MB |
| 인증 | Supabase Auth (GitHub OAuth) | |
| 배포 | Vercel | |
| 테마 | next-themes | 사용자 선택 가능 — 디자인 토큰 섹션 참조 |

### Next.js 16 적용 사항
- **Turbopack**: 기본 번들러 (별도 플래그 불필요)
- **proxy.ts**: middleware.ts 대신 proxy.ts 사용 (네트워크 경계 명확화)
- **Cache Components**: `use cache` 디렉티브로 명시적 캐싱
- **React 19.2**: View Transitions, useEffectEvent 활용 가능
- **AGENTS.md**: create-next-app 기본 포함

## 아키텍처

```
개발자 PC                          클라우드
┌─────────────────┐        ┌─────────────────────┐
│  agentmon 데몬    │───────▶│  Next.js API         │
│  (Bun)           │ HTTPS  │  /api/ingest         │
│                  │        ├─────────────────────┤
│  감시 대상:       │        │  Supabase PostgreSQL │
│  ~/.claude/      │        │  usage_records       │
│  projects/       │        ├─────────────────────┤
│  **/*.jsonl      │        │  웹 대시보드          │
└─────────────────┘        │  /dashboard          │
                            │  /org/[slug]         │
                            └─────────────────────┘
```

## 디렉토리 구조

```
agentmon/
├── apps/
│   └── web/                          # Next.js 16
│       ├── src/
│       │   ├── app/
│       │   │   ├── layout.tsx
│       │   │   ├── page.tsx          # 랜딩 페이지
│       │   │   ├── auth/
│       │   │   │   ├── login/page.tsx
│       │   │   │   └── cli/route.ts  # CLI 인증 콜백
│       │   │   ├── dashboard/
│       │   │   │   ├── layout.tsx
│       │   │   │   ├── page.tsx      # 개인 메인 대시보드
│       │   │   │   ├── history/page.tsx
│       │   │   │   ├── projects/page.tsx
│       │   │   │   └── settings/page.tsx
│       │   │   ├── org/
│       │   │   │   ├── page.tsx      # 내 조직 목록
│       │   │   │   ├── new/page.tsx  # 조직 생성
│       │   │   │   └── [slug]/
│       │   │   │       ├── page.tsx      # 조직 대시보드
│       │   │   │       ├── members/page.tsx
│       │   │   │       ├── projects/page.tsx
│       │   │   │       └── settings/page.tsx
│       │   │   └── api/
│       │   │       ├── ingest/route.ts
│       │   │       ├── usage/route.ts
│       │   │       ├── keys/route.ts
│       │   │       ├── org/route.ts
│       │   │       └── org/[slug]/
│       │   │           ├── usage/route.ts
│       │   │           ├── invite/route.ts
│       │   │           └── members/route.ts
│       │   ├── components/
│       │   │   ├── ui/               # shadcn/ui
│       │   │   ├── charts/
│       │   │   │   ├── usage-area-chart.tsx
│       │   │   │   ├── project-donut.tsx
│       │   │   │   ├── model-donut.tsx
│       │   │   │   └── daily-bar-chart.tsx
│       │   │   ├── dashboard/
│       │   │   │   ├── metric-card.tsx
│       │   │   │   ├── date-range-picker.tsx
│       │   │   │   └── filter-bar.tsx
│       │   │   └── theme/
│       │   │       ├── theme-provider.tsx   # next-themes Provider
│       │   │       └── theme-switcher.tsx   # 테마 선택 UI
│       │   ├── lib/
│       │   │   ├── supabase/
│       │   │   │   ├── client.ts
│       │   │   │   ├── server.ts
│       │   │   │   └── proxy.ts     # Next.js 16: middleware → proxy
│       │   │   ├── auth.ts
│       │   │   └── pricing.ts
│       │   └── styles/
│       │       └── globals.css       # 멀티 테마 CSS 변수
│       ├── supabase/
│       │   └── migrations/
│       │       └── 001_initial.sql
│       ├── proxy.ts                  # Next.js 16: middleware.ts 대체
│       ├── next.config.ts
│       ├── tailwind.config.ts
│       └── package.json
│
├── packages/
│   └── agent/                        # CLI 에이전트 (Bun)
│       ├── src/
│       │   ├── index.ts              # CLI 엔트리 (agentmon 명령어)
│       │   ├── commands/
│       │   │   ├── init.ts
│       │   │   ├── start.ts
│       │   │   ├── stop.ts
│       │   │   └── status.ts
│       │   ├── daemon/
│       │   │   ├── watcher.ts        # JSONL fs.watch
│       │   │   ├── parser.ts         # JSONL 파싱 + 중복 제거
│       │   │   ├── aggregator.ts     # 5분 버킷 집계
│       │   │   └── sender.ts         # HTTP POST → /api/ingest
│       │   ├── system/
│       │   │   ├── launchd.ts        # macOS LaunchAgent
│       │   │   ├── systemd.ts        # Linux systemd 사용자 서비스
│       │   │   └── taskscheduler.ts  # Windows 작업 스케줄러
│       │   └── config.ts
│       ├── package.json
│       └── tsconfig.json
│
├── CLAUDE.md                         # 이 파일
├── AGENTS.md                         # Next.js 16.2 기본 포함
├── turbo.json
├── package.json                      # 워크스페이스 루트
└── README.md
```

## 데이터베이스 스키마

> **별도 문서 참조**: `agentmon-schema-v2.md`
>
> 포함 내용: users, organizations, org_members, org_invites, api_keys, usage_records, daily_summary
> ER 다이어그램, RLS 정책, 역할 권한 매트릭스, 조직 대시보드 조회 쿼리 예시

## API 엔드포인트

### POST /api/ingest
에이전트가 5분 집계 데이터를 전송하는 수집 엔드포인트.

```
Authorization: Bearer am_<api_key>
Content-Type: application/json

{
  "records": [{
    "recorded_at": "2026-03-28T09:00:00Z",
    "agent": "claude-code",
    "project": "my-app",
    "model": "claude-opus-4-6",
    "input_tokens": 8500,
    "output_tokens": 1500,
    "cache_read_tokens": 45000,
    "cache_creation_tokens": 3000,
    "estimated_cost_usd": 0.1425
  }]
}

→ { "ok": true, "inserted": 1 }
```

인증 플로우: API 키를 SHA-256 해시 → api_keys 테이블에서 조회 → 해당 user_id로 삽입.

> `agent` 값: `claude-code`, `codex`, `gemini-cli`, `cursor`, `amp`, `roo-code` 등. 에이전트별 JSONL 경로가 다르므로 CLI 에이전트가 자동 감지하여 설정.

### GET /api/usage
개인 대시보드용 데이터 조회. Supabase Auth 세션 필요.

| 파라미터 | 타입 | 기본값 | 설명 |
|---------|------|--------|------|
| from | ISO datetime | 7일 전 | 시작 |
| to | ISO datetime | 현재 | 종료 |
| granularity | enum | auto | 5min, hour, day, week, month |
| agent | string | all | 에이전트 필터 (claude-code, codex 등) |
| project | string | all | 프로젝트 필터 |
| model | string | all | 모델 필터 |

자동 세분도: ≤1일→5min, ≤7일→hour, ≤90일→day, >90일→week.

### POST /api/keys
API 키 생성. 원문 키는 이 응답에서만 한 번 반환, 이후 해시만 저장.

```
→ { "key": "am_a1b2c3d4...", "name": "macbook-pro" }
```

### GET /api/org
내가 속한 조직 목록.

### POST /api/org
조직 생성. 생성자가 자동으로 owner.

### GET /api/org/[slug]/usage
조직 대시보드용 데이터 조회. 멤버 전원의 usage_records 집계.

### POST /api/org/[slug]/invite
멤버 초대. owner/admin만 가능.

### POST /api/org/[slug]/invite/accept
초대 수락.

## CLI 에이전트

### 명령어
```bash
agentmon init          # OAuth + API 키 발급 + 데몬 등록
agentmon start         # 데몬 시작 (또는 --foreground)
agentmon stop          # 데몬 중지
agentmon status        # 데몬 상태 + 마지막 동기화 확인
```

### init 플로우
1. OS 감지 (macOS / Linux / Windows)
2. 브라우저 열기 → `https://agentmon.dev/auth/cli`
3. GitHub OAuth 로그인
4. 콜백으로 API 키 발급
5. `~/.config/agentmon/config.json`에 저장:
   ```json
   {
     "api_key": "am_a1b2c3d4...",
     "endpoint": "https://agentmon.dev/api/ingest",
     "interval_ms": 300000,
     "claude_dir": "~/.claude/projects"
   }
   ```
6. OS별 데몬 등록:
   - macOS: `~/Library/LaunchAgents/dev.agentmon.plist`
   - Linux: `~/.config/systemd/user/agentmon.service`
   - Windows: 작업 스케줄러
7. 데몬 시작
8. 헬스체크 → `✓ agentmon is running`

### JSONL 파싱 주의사항
- `usage.input_tokens`가 0 또는 1인 스트리밍 플레이스홀더 — 필터링 또는 보정 필요
- 같은 `requestId`로 2~10개 중복 항목 발생 (51~55%) — requestId 기준 중복 제거
- `cache_read_input_tokens`와 `cache_creation_input_tokens`는 정확함
- 프로젝트명은 파일 경로에서 추출: `~/.claude/projects/{project}/`

### 비용 계산 (모델별 단가, USD per 1M tokens)
```typescript
const PRICING = {
  'claude-opus-4-6':   { input: 5.0,  output: 25.0,  cacheRead: 0.50, cacheWrite: 6.25  },
  'claude-sonnet-4-6': { input: 3.0,  output: 15.0,  cacheRead: 0.30, cacheWrite: 3.75  },
  'claude-haiku-4-5':  { input: 0.80, output: 4.0,   cacheRead: 0.08, cacheWrite: 1.0   },
};
```

## 페이지 라우트

```
# 공통
/                         → 랜딩 페이지
/auth/login               → GitHub OAuth 로그인
/auth/cli                 → CLI 인증 콜백

# 개인 대시보드
/dashboard                → 개인 메인 대시보드 (오늘 요약)
/dashboard/history        → 기간별 상세 조회
/dashboard/projects       → 프로젝트별 분석
/dashboard/settings       → API 키 관리, 프로필, 테마 설정

# 조직
/org                      → 내 조직 목록
/org/new                  → 조직 생성
/org/[slug]               → 조직 대시보드 (멤버 합산)
/org/[slug]/members       → 멤버 목록 + 초대 관리
/org/[slug]/projects      → 조직 프로젝트별 분석
/org/[slug]/settings      → 조직 설정 (owner/admin만)
```

### 메인 대시보드 레이아웃
- **메트릭 카드**: 오늘의 토큰, 비용, 활성 시간
- **Area 차트**: 시간별 사용량 (input/output/cache 구분)
- **Donut 차트**: 에이전트별 분포, 프로젝트별 분포, 모델별 분포
- **Bar 차트**: 최근 7일 일별 추이 (에이전트별 스택)

## 디자인 시스템

### 테마 전략

next-themes 기반으로 사용자가 테마를 선택할 수 있음. 각 AI 에이전트 브랜드에 맞는 전용 테마 제공.

| 테마 | 설명 | 상태 |
|------|------|------|
| `light` | 기본 라이트 (뉴트럴 화이트) | MVP |
| `dark` | 기본 다크 (뉴트럴 다크) | MVP |
| `claude-light` | Claude 브랜드 웜 톤 라이트 | MVP |
| `claude-dark` | Claude 브랜드 웜 톤 다크 | MVP |
| `codex-light` | Codex/OpenAI 브랜드 그린 라이트 | MVP |
| `codex-dark` | Codex/OpenAI 브랜드 그린 다크 | MVP |
| `gemini-light` | Gemini/Google 브랜드 블루 라이트 | MVP |
| `gemini-dark` | Gemini/Google 브랜드 블루 다크 | MVP |

### 테마 구현 방식

```tsx
// theme-provider.tsx
import { ThemeProvider as NextThemesProvider } from 'next-themes';

const themes = [
  'light', 'dark',
  'claude-light', 'claude-dark',
  'codex-light', 'codex-dark',
  'gemini-light', 'gemini-dark',
];

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="data-theme"
      themes={themes}
      defaultTheme="light"
      enableSystem={false}
    >
      {children}
    </NextThemesProvider>
  );
}
```

### globals.css 테마 구조

```css
/* 기본 라이트 */
:root, [data-theme="light"] {
  --background: 0 0% 100%;
  --foreground: 0 0% 9%;
  --primary: 0 0% 9%;
  /* ... shadcn/ui 기본 값 */
}

/* 기본 다크 */
[data-theme="dark"] {
  --background: 0 0% 4%;
  --foreground: 0 0% 98%;
  --primary: 0 0% 98%;
}

/* Claude 라이트 */
[data-theme="claude-light"] {
  --background: 36 52% 96%;           /* #FAF6EF 크림 */
  --foreground: 20 30% 14%;           /* #2D1F1A 다크 브라운 */
  --primary: 20 67% 46%;              /* #C35A28 테라코타 */
  --primary-foreground: 0 0% 100%;
  --secondary: 33 38% 89%;            /* #F0E8DA 베이지 */
  --secondary-foreground: 10 23% 30%;
  --muted: 33 38% 89%;
  --muted-foreground: 20 10% 50%;
  --accent: 33 38% 89%;
  --accent-foreground: 20 30% 14%;
  --destructive: 18 82% 47%;
  --destructive-foreground: 0 0% 100%;
  --border: 30 22% 86%;
  --input: 30 22% 86%;
  --ring: 20 67% 46%;
  --chart-1: 20 67% 46%;
  --chart-2: 33 73% 37%;
  --chart-3: 10 23% 30%;
  --chart-4: 252 92% 86%;
  --chart-5: 18 82% 47%;
}

/* Claude 다크 */
[data-theme="claude-dark"] {
  --background: 24 25% 8%;
  --foreground: 36 36% 93%;
  --primary: 20 60% 56%;
  --primary-foreground: 24 25% 8%;
  --secondary: 24 25% 15%;
  --secondary-foreground: 30 22% 76%;
  --muted: 24 25% 15%;
  --muted-foreground: 20 12% 56%;
  --accent: 24 25% 15%;
  --accent-foreground: 36 36% 93%;
  --destructive: 18 78% 54%;
  --destructive-foreground: 36 36% 93%;
  --border: 24 25% 18%;
  --input: 24 25% 18%;
  --ring: 20 60% 56%;
  --chart-1: 20 60% 56%;
  --chart-2: 33 60% 50%;
  --chart-3: 30 22% 76%;
  --chart-4: 252 92% 86%;
  --chart-5: 18 78% 54%;
}

/* Codex 라이트 — OpenAI ChatGPT Green (#00A67E) 기반 */
[data-theme="codex-light"] {
  --background: 0 0% 100%;
  --foreground: 0 0% 3%;
  --primary: 162 100% 33%;
  --primary-foreground: 0 0% 100%;
  --secondary: 155 40% 94%;
  --secondary-foreground: 162 90% 16%;
  --muted: 155 20% 95%;
  --muted-foreground: 0 0% 40%;
  --accent: 155 40% 94%;
  --accent-foreground: 0 0% 3%;
  --destructive: 0 84% 60%;
  --destructive-foreground: 0 0% 100%;
  --border: 0 0% 90%;
  --input: 0 0% 90%;
  --ring: 162 100% 33%;
  --chart-1: 162 100% 33%;
  --chart-2: 162 50% 55%;
  --chart-3: 270 60% 70%;
  --chart-4: 0 0% 30%;
  --chart-5: 162 80% 20%;
}

/* Codex 다크 */
[data-theme="codex-dark"] {
  --background: 0 0% 7%;
  --foreground: 0 0% 95%;
  --primary: 160 84% 51%;
  --primary-foreground: 0 0% 3%;
  --secondary: 0 0% 15%;
  --secondary-foreground: 0 0% 85%;
  --muted: 0 0% 15%;
  --muted-foreground: 0 0% 55%;
  --accent: 0 0% 15%;
  --accent-foreground: 0 0% 95%;
  --destructive: 0 63% 45%;
  --destructive-foreground: 0 0% 95%;
  --border: 0 0% 18%;
  --input: 0 0% 18%;
  --ring: 160 84% 51%;
  --chart-1: 160 84% 51%;
  --chart-2: 162 50% 65%;
  --chart-3: 270 60% 75%;
  --chart-4: 0 0% 60%;
  --chart-5: 160 70% 40%;
}

/* Gemini 라이트 — Google Blue (#4285F4) 기반 */
[data-theme="gemini-light"] {
  --background: 220 60% 99%;
  --foreground: 220 15% 15%;
  --primary: 217 89% 61%;
  --primary-foreground: 0 0% 100%;
  --secondary: 220 40% 96%;
  --secondary-foreground: 217 80% 35%;
  --muted: 220 20% 96%;
  --muted-foreground: 220 5% 46%;
  --accent: 220 40% 96%;
  --accent-foreground: 220 15% 15%;
  --destructive: 4 90% 58%;
  --destructive-foreground: 0 0% 100%;
  --border: 220 13% 91%;
  --input: 220 13% 91%;
  --ring: 217 89% 61%;
  --chart-1: 217 89% 61%;
  --chart-2: 4 90% 58%;
  --chart-3: 36 100% 50%;
  --chart-4: 142 69% 45%;
  --chart-5: 217 80% 45%;
}

/* Gemini 다크 */
[data-theme="gemini-dark"] {
  --background: 220 15% 8%;
  --foreground: 220 10% 93%;
  --primary: 217 80% 65%;
  --primary-foreground: 220 15% 8%;
  --secondary: 220 15% 16%;
  --secondary-foreground: 220 10% 80%;
  --muted: 220 15% 16%;
  --muted-foreground: 220 8% 55%;
  --accent: 220 15% 16%;
  --accent-foreground: 220 10% 93%;
  --destructive: 4 75% 50%;
  --destructive-foreground: 220 10% 93%;
  --border: 220 12% 20%;
  --input: 220 12% 20%;
  --ring: 217 80% 65%;
  --chart-1: 217 80% 65%;
  --chart-2: 4 75% 60%;
  --chart-3: 36 90% 60%;
  --chart-4: 142 55% 55%;
  --chart-5: 217 70% 50%;
}
```

> Claude 테마 상세 토큰 + Codex/Gemini 전체 테마는 `agentmon-design-tokens.md` 참조

### 디자인 원칙
- 테마별로 일관된 shadcn/ui CSS 변수 사용 — 컴포넌트 코드에서 테마 분기 없음
- `data-theme` 속성으로 전환, `next-themes`가 관리
- 차트 컬러도 CSS 변수(`--chart-1` ~ `--chart-5`)로 테마별 자동 전환
- 기본 light/dark는 뉴트럴, 에이전트별 테마는 해당 브랜드 톤
- codex, gemini 테마는 각 브랜드 팔레트 조사 후 추가

### 타이포그래피
- UI: 시스템 산세리프
- Claude 테마 헤딩: `ui-serif, Georgia, Cambria, "Times New Roman", serif`
- 기본/Codex/Gemini 테마: 산세리프 통일

## 코딩 컨벤션

- **언어**: TypeScript strict 모드
- **패키지 매니저**: pnpm (워크스페이스 모노레포)
- **모노레포**: Turborepo
- **런타임**: CLI 에이전트는 Bun, Next.js는 Node.js
- **포매터**: Biome (Prettier/ESLint 아님)
- **임포트**: Next.js에서 `@/` 별칭으로 `src/` 참조
- **컴포넌트**: shadcn/ui + 테마별 CSS 변수 오버라이드
- **차트**: Recharts (AreaChart, BarChart, PieChart)
- **DB 쿼리**: 앱 코드에서 raw SQL 대신 Supabase 클라이언트 사용
- **API 응답**: 항상 `{ ok: boolean, ... }` 래퍼
- **에러 처리**: API 라우트에서 throw 금지, 타입드 에러 반환
- **네이밍**: 변수 camelCase, 파일 kebab-case, 컴포넌트 PascalCase
- **라우팅**: Next.js 16의 proxy.ts 사용 (middleware.ts 아님)

## 알려진 제약사항

1. **JSONL 토큰 정확도** — input_tokens/output_tokens가 실제보다 1~2 자릿수 과소 보고됨. cache 필드는 정확. Anthropic이 statusbar 데이터를 공개하면 보정 가능.
2. **Supabase 무료 티어** — 500MB 스토리지, 5만 MAU. 1인 3년+ 충분 (~42MB/년). 다수 사용자 시 Pro($25/월) 전환 필요.
3. **프라이버시** — 코드 내용은 전송하지 않음. 프로젝트명, 모델명, 토큰 수치만 수집. 프로젝트명 해시 처리 옵션 제공 가능.
4. **5분 최소 단위** — 실시간 초 단위 모니터링은 MVP 범위 외.

## 관련 문서

| 파일 | 내용 |
|------|------|
| `agentmon-schema-v2.md` | DB 스키마, RLS 정책, 조직 모델, 쿼리 예시 |
| `agentmon-design-tokens.md` | 전체 테마 토큰 (Claude/Codex/Gemini light+dark, globals.css, tailwind.config.ts) |

## Skill routing

When the user's request matches an available skill, ALWAYS invoke it using the Skill
tool as your FIRST action. Do NOT answer directly, do NOT use other tools first.
The skill has specialized workflows that produce better results than ad-hoc answers.

Key routing rules:
- Product ideas, "is this worth building", brainstorming → invoke office-hours
- Bugs, errors, "why is this broken", 500 errors → invoke investigate
- Ship, deploy, push, create PR → invoke ship
- QA, test the site, find bugs → invoke qa
- Code review, check my diff → invoke review
- Update docs after shipping → invoke document-release
- Weekly retro → invoke retro
- Design system, brand → invoke design-consultation
- Visual audit, design polish → invoke design-review
- Architecture review → invoke plan-eng-review
