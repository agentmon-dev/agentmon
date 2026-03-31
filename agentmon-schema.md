# agentmon DB 스키마 v2 — 조직 모델 포함

## ER 다이어그램 (관계도)

```
auth.users (Supabase 관리)
    │
    ▼ 1:1
┌──────────┐
│  users    │
└────┬─────┘
     │
     ├──── 1:N ──── api_keys
     │
     ├──── 1:N ──── usage_records (핵심 데이터)
     │
     └──── N:M ──── organizations (org_members를 통해)
                        │
                        └──── 1:N ──── org_invites
```

## 핵심 설계 원칙

1. **usage_records에 org_id 없음** — 사용량 데이터는 순수하게 사용자에 귀속
2. **agent 컬럼으로 에이전트 분류** — `claude-code`, `codex`, `gemini-cli`, `cursor`, `amp` 등 명시적 구분
3. **조직 조회는 JOIN으로** — `org_members.user_id → usage_records.user_id`
4. **N:M 관계** — 한 사용자가 여러 조직에 소속 가능 (GitHub 스타일)
5. **역할 분리** — owner / admin / member 3단계
6. **public/private** — public 조직은 누구나 프로필 조회 가능, private는 멤버만

---

## 테이블 정의

### 1. users (기존 + 확장)

```sql
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  github_username text not null,
  display_name text,
  avatar_url text,
  plan text default 'pro',            -- pro, max5, max20
  timezone text default 'UTC',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.users enable row level security;

create policy "users_select_own"
  on public.users for select
  using (auth.uid() = id);

create policy "users_update_own"
  on public.users for update
  using (auth.uid() = id);

-- 조직 멤버가 같은 조직원의 기본 정보를 볼 수 있도록
create policy "users_select_org_member"
  on public.users for select
  using (
    id in (
      select om2.user_id from public.org_members om1
      join public.org_members om2 on om1.org_id = om2.org_id
      where om1.user_id = auth.uid()
    )
  );
```

### 2. organizations

```sql
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,          -- URL 경로용: /org/my-team
  name text not null,                 -- 표시명: "My Team"
  description text,
  avatar_url text,
  visibility text not null default 'public'
    check (visibility in ('public', 'private')),
  created_by uuid not null references public.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_org_slug on public.organizations(slug);

alter table public.organizations enable row level security;

-- public 조직은 누구나 조회 가능
create policy "org_select_public"
  on public.organizations for select
  using (visibility = 'public');

-- private 조직은 멤버만 조회 가능
create policy "org_select_private"
  on public.organizations for select
  using (
    visibility = 'private'
    and id in (
      select org_id from public.org_members
      where user_id = auth.uid()
    )
  );

-- 생성은 인증된 사용자 누구나
create policy "org_insert"
  on public.organizations for insert
  with check (auth.uid() = created_by);

-- 수정은 owner/admin만
create policy "org_update"
  on public.organizations for update
  using (
    id in (
      select org_id from public.org_members
      where user_id = auth.uid()
        and role in ('owner', 'admin')
    )
  );

-- 삭제는 owner만
create policy "org_delete"
  on public.organizations for delete
  using (
    id in (
      select org_id from public.org_members
      where user_id = auth.uid()
        and role = 'owner'
    )
  );
```

### 3. org_members (N:M 관계 + 역할)

```sql
create table public.org_members (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null default 'member'
    check (role in ('owner', 'admin', 'member')),
  joined_at timestamptz default now(),

  unique(org_id, user_id)
);

create index idx_org_members_user on public.org_members(user_id);
create index idx_org_members_org on public.org_members(org_id);

alter table public.org_members enable row level security;

-- 같은 조직 멤버 목록 조회
create policy "org_members_select"
  on public.org_members for select
  using (
    -- 본인이 속한 조직의 멤버 목록
    org_id in (
      select org_id from public.org_members
      where user_id = auth.uid()
    )
    -- 또는 public 조직의 멤버 목록
    or org_id in (
      select id from public.organizations
      where visibility = 'public'
    )
  );

-- 멤버 추가는 owner/admin만
create policy "org_members_insert"
  on public.org_members for insert
  with check (
    org_id in (
      select org_id from public.org_members
      where user_id = auth.uid()
        and role in ('owner', 'admin')
    )
  );

-- 역할 변경은 owner만
create policy "org_members_update"
  on public.org_members for update
  using (
    org_id in (
      select org_id from public.org_members
      where user_id = auth.uid()
        and role = 'owner'
    )
  );

-- 멤버 제거: owner가 제거하거나, 본인이 탈퇴
create policy "org_members_delete"
  on public.org_members for delete
  using (
    -- owner가 제거
    org_id in (
      select org_id from public.org_members
      where user_id = auth.uid()
        and role = 'owner'
    )
    -- 또는 본인 탈퇴
    or user_id = auth.uid()
  );
```

### 4. org_invites (초대 관리)

```sql
create table public.org_invites (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  invited_email text,                 -- 이메일 초대 (GitHub 가입 전)
  invited_user_id uuid references public.users(id), -- 이미 가입한 사용자
  role text not null default 'member'
    check (role in ('admin', 'member')),
  token text unique not null,         -- 초대 링크용 토큰
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'expired', 'revoked')),
  invited_by uuid not null references public.users(id),
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz default now(),

  -- 같은 조직에 같은 사람 중복 초대 방지
  unique(org_id, invited_email),
  unique(org_id, invited_user_id)
);

create index idx_org_invites_token on public.org_invites(token);
create index idx_org_invites_email on public.org_invites(invited_email);

alter table public.org_members enable row level security;

-- 초대 조회: 본인에게 온 초대 또는 owner/admin이 보낸 초대
create policy "org_invites_select"
  on public.org_invites for select
  using (
    invited_user_id = auth.uid()
    or invited_email in (
      select email from auth.users where id = auth.uid()
    )
    or org_id in (
      select org_id from public.org_members
      where user_id = auth.uid()
        and role in ('owner', 'admin')
    )
  );

-- 초대 생성: owner/admin만
create policy "org_invites_insert"
  on public.org_invites for insert
  with check (
    org_id in (
      select org_id from public.org_members
      where user_id = auth.uid()
        and role in ('owner', 'admin')
    )
  );

-- 초대 취소: 초대한 사람 또는 owner
create policy "org_invites_update"
  on public.org_invites for update
  using (
    invited_by = auth.uid()
    or org_id in (
      select org_id from public.org_members
      where user_id = auth.uid()
        and role = 'owner'
    )
  );
```

### 5. api_keys (기존과 동일)

```sql
create table public.api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  key_hash text not null,
  name text default 'default',
  last_used_at timestamptz,
  created_at timestamptz default now(),
  unique(user_id, name)
);

alter table public.api_keys enable row level security;
create policy "api_keys_own" on public.api_keys for all using (auth.uid() = user_id);
```

### 6. usage_records (org_id 없음 + agent 컬럼 추가)

```sql
create table public.usage_records (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  recorded_at timestamptz not null,
  agent text not null default 'claude-code',
    -- 'claude-code', 'codex', 'gemini-cli', 'cursor', 'amp', 'roo-code' 등
  project text not null,
  model text not null,
    -- 'claude-opus-4-6', 'claude-sonnet-4-6', 'gpt-5', 'gemini-2.5-pro' 등
  input_tokens bigint default 0,
  output_tokens bigint default 0,
  cache_read_tokens bigint default 0,
  cache_creation_tokens bigint default 0,
  estimated_cost_usd numeric(10,6) default 0,
  created_at timestamptz default now()
);

create index idx_usage_user_time on public.usage_records(user_id, recorded_at desc);
create index idx_usage_recorded_at on public.usage_records(recorded_at desc);
create index idx_usage_user_project on public.usage_records(user_id, project);
create index idx_usage_user_agent on public.usage_records(user_id, agent);

alter table public.usage_records enable row level security;

-- 본인 데이터
create policy "usage_select_own"
  on public.usage_records for select
  using (auth.uid() = user_id);

-- 같은 조직 멤버의 데이터 조회 (조직 대시보드용)
create policy "usage_select_org"
  on public.usage_records for select
  using (
    user_id in (
      select om2.user_id from public.org_members om1
      join public.org_members om2 on om1.org_id = om2.org_id
      where om1.user_id = auth.uid()
    )
  );

-- 삽입은 본인만
create policy "usage_insert_own"
  on public.usage_records for insert
  with check (auth.uid() = user_id);
```

### 7. daily_summary (구체화된 뷰 — agent 포함)

```sql
create materialized view public.daily_summary as
select
  user_id,
  date_trunc('day', recorded_at) as day,
  agent, project, model,
  sum(input_tokens) as input_tokens,
  sum(output_tokens) as output_tokens,
  sum(cache_read_tokens) as cache_read_tokens,
  sum(cache_creation_tokens) as cache_creation_tokens,
  sum(estimated_cost_usd) as cost_usd,
  count(*) as bucket_count
from public.usage_records
group by user_id, day, agent, project, model;

create unique index idx_daily_summary_pk
  on public.daily_summary(user_id, day, agent, project, model);
```

---

## 조직 대시보드 조회 쿼리 예시

### 조직 멤버 전체 일별 합산

```sql
select
  date_trunc('day', ur.recorded_at) as day,
  u.github_username,
  ur.agent,
  sum(ur.input_tokens + ur.output_tokens) as total_tokens,
  sum(ur.estimated_cost_usd) as total_cost
from public.usage_records ur
join public.org_members om on ur.user_id = om.user_id
join public.users u on ur.user_id = u.id
where om.org_id = $1                  -- 조직 ID
  and ur.recorded_at between $2 and $3 -- 기간
group by day, u.github_username, ur.agent
order by day, total_tokens desc;
```

### 조직 내 에이전트별 사용 비율

```sql
select
  ur.agent,
  count(distinct om.user_id) as user_count,
  sum(ur.input_tokens + ur.output_tokens) as total_tokens,
  sum(ur.estimated_cost_usd) as total_cost
from public.usage_records ur
join public.org_members om on ur.user_id = om.user_id
where om.org_id = $1
  and ur.recorded_at between $2 and $3
group by ur.agent
order by total_tokens desc;
```

### 조직 내 프로젝트별 사용량

```sql
select
  ur.project,
  ur.agent,
  u.github_username,
  sum(ur.input_tokens) as input_tokens,
  sum(ur.output_tokens) as output_tokens,
  sum(ur.estimated_cost_usd) as cost_usd
from public.usage_records ur
join public.org_members om on ur.user_id = om.user_id
join public.users u on ur.user_id = u.id
where om.org_id = $1
  and ur.recorded_at between $2 and $3
group by ur.project, ur.agent, u.github_username
order by cost_usd desc;
```

### 조직 멤버별 요약

```sql
select
  u.github_username,
  u.avatar_url,
  om.role,
  array_agg(distinct ur.agent) as agents_used,
  sum(ur.input_tokens + ur.output_tokens) as total_tokens,
  sum(ur.estimated_cost_usd) as total_cost,
  count(distinct date_trunc('day', ur.recorded_at)) as active_days
from public.org_members om
join public.users u on om.user_id = u.id
left join public.usage_records ur
  on ur.user_id = om.user_id
  and ur.recorded_at between $2 and $3
where om.org_id = $1
group by u.github_username, u.avatar_url, om.role
order by total_tokens desc nulls last;
```

---

## 페이지 라우트 확장

```
# 기존
/dashboard                → 개인 메인 대시보드
/dashboard/history        → 개인 기간별 상세
/dashboard/projects       → 개인 프로젝트별 분석
/dashboard/settings       → API 키 관리, 프로필

# 조직 추가
/org                      → 내 조직 목록
/org/new                  → 조직 생성
/org/[slug]               → 조직 대시보드 (멤버 합산)
/org/[slug]/members       → 멤버 목록 + 초대 관리
/org/[slug]/projects      → 조직 프로젝트별 분석
/org/[slug]/settings      → 조직 설정 (owner/admin만)
```

---

## API 엔드포인트 확장

### GET /api/org
내가 속한 조직 목록 반환.

```json
{
  "orgs": [
    {
      "id": "uuid",
      "slug": "actibooky",
      "name": "액티부키",
      "visibility": "private",
      "role": "owner",
      "member_count": 5
    }
  ]
}
```

### POST /api/org
조직 생성. 생성자가 자동으로 owner.

```json
{
  "name": "액티부키",
  "slug": "actibooky",
  "visibility": "private"
}
→ { "ok": true, "org": { ... } }
```

### GET /api/org/[slug]/usage
조직 대시보드용 데이터 조회. 멤버 전원의 usage_records를 집계.
기존 /api/usage와 동일한 파라미터 + `group_by=user` 옵션.

### POST /api/org/[slug]/invite
멤버 초대. owner/admin만 가능.

```json
{
  "github_username": "dongwon",
  "role": "member"
}
→ { "ok": true, "invite_url": "https://agentmon.dev/invite/abc123" }
```

### POST /api/org/[slug]/invite/accept
초대 수락.

```json
{ "token": "abc123" }
→ { "ok": true }
```

---

## 역할 권한 매트릭스

| 기능 | owner | admin | member |
|------|-------|-------|--------|
| 조직 대시보드 조회 | ✅ | ✅ | ✅ |
| 멤버 목록 조회 | ✅ | ✅ | ✅ |
| 멤버별 사용량 조회 | ✅ | ✅ | ✅ |
| 멤버 초대 | ✅ | ✅ | ❌ |
| 멤버 제거 | ✅ | ❌ | ❌ |
| 역할 변경 | ✅ | ❌ | ❌ |
| 조직 설정 수정 | ✅ | ✅ | ❌ |
| 조직 삭제 | ✅ | ❌ | ❌ |
| 본인 탈퇴 | ❌* | ✅ | ✅ |

> *owner는 조직 삭제만 가능, 탈퇴 불가 (최소 1명의 owner 보장)
