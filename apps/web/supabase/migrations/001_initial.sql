-- =============================================================================
-- agentmon: Initial Migration
-- =============================================================================
-- Tables: users, organizations, org_members, org_invites, api_keys, usage_records
-- Materialized View: daily_summary
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. users
-- ---------------------------------------------------------------------------
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  github_username text not null,
  display_name text,
  avatar_url text,
  plan text default 'pro',
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

create policy "users_select_org_member"
  on public.users for select
  using (
    id in (
      select om2.user_id from public.org_members om1
      join public.org_members om2 on om1.org_id = om2.org_id
      where om1.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- 2. organizations
-- ---------------------------------------------------------------------------
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
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

create policy "org_select_public"
  on public.organizations for select
  using (visibility = 'public');

create policy "org_select_private"
  on public.organizations for select
  using (
    visibility = 'private'
    and id in (
      select org_id from public.org_members
      where user_id = auth.uid()
    )
  );

create policy "org_insert"
  on public.organizations for insert
  with check (auth.uid() = created_by);

create policy "org_update"
  on public.organizations for update
  using (
    id in (
      select org_id from public.org_members
      where user_id = auth.uid()
        and role in ('owner', 'admin')
    )
  );

create policy "org_delete"
  on public.organizations for delete
  using (
    id in (
      select org_id from public.org_members
      where user_id = auth.uid()
        and role = 'owner'
    )
  );

-- ---------------------------------------------------------------------------
-- 3. org_members
-- ---------------------------------------------------------------------------
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

create policy "org_members_select"
  on public.org_members for select
  using (
    org_id in (
      select org_id from public.org_members
      where user_id = auth.uid()
    )
    or org_id in (
      select id from public.organizations
      where visibility = 'public'
    )
  );

create policy "org_members_insert"
  on public.org_members for insert
  with check (
    org_id in (
      select org_id from public.org_members
      where user_id = auth.uid()
        and role in ('owner', 'admin')
    )
  );

create policy "org_members_update"
  on public.org_members for update
  using (
    org_id in (
      select org_id from public.org_members
      where user_id = auth.uid()
        and role = 'owner'
    )
  );

create policy "org_members_delete"
  on public.org_members for delete
  using (
    org_id in (
      select org_id from public.org_members
      where user_id = auth.uid()
        and role = 'owner'
    )
    or user_id = auth.uid()
  );

-- ---------------------------------------------------------------------------
-- 4. org_invites
-- ---------------------------------------------------------------------------
create table public.org_invites (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  invited_email text,
  invited_user_id uuid references public.users(id),
  role text not null default 'member'
    check (role in ('admin', 'member')),
  token text unique not null,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'expired', 'revoked')),
  invited_by uuid not null references public.users(id),
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz default now(),

  unique(org_id, invited_email),
  unique(org_id, invited_user_id)
);

create index idx_org_invites_token on public.org_invites(token);
create index idx_org_invites_email on public.org_invites(invited_email);

-- FIX #1: Original schema had org_members here by mistake
alter table public.org_invites enable row level security;

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

create policy "org_invites_insert"
  on public.org_invites for insert
  with check (
    org_id in (
      select org_id from public.org_members
      where user_id = auth.uid()
        and role in ('owner', 'admin')
    )
  );

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

-- ---------------------------------------------------------------------------
-- 5. api_keys
-- ---------------------------------------------------------------------------
create table public.api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  key_hash text not null,
  name text default 'default',
  last_used_at timestamptz,
  -- FIX #2: revoked_at column for key revocation
  revoked_at timestamptz,
  created_at timestamptz default now(),
  unique(user_id, name)
);

alter table public.api_keys enable row level security;

create policy "api_keys_own"
  on public.api_keys for all
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 6. usage_records
-- ---------------------------------------------------------------------------
create table public.usage_records (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  recorded_at timestamptz not null,
  agent text not null default 'claude-code',
  project text not null,
  model text not null,
  input_tokens bigint default 0,
  output_tokens bigint default 0,
  cache_read_tokens bigint default 0,
  cache_creation_tokens bigint default 0,
  estimated_cost_usd numeric(10,6) default 0,
  created_at timestamptz default now(),

  -- FIX #3: UNIQUE constraint for server-side deduplication
  -- FIX #4: Enables ON CONFLICT DO NOTHING in the ingest API
  unique(user_id, recorded_at, agent, project, model)
);

create index idx_usage_user_time on public.usage_records(user_id, recorded_at desc);
create index idx_usage_recorded_at on public.usage_records(recorded_at desc);
create index idx_usage_user_project on public.usage_records(user_id, project);
create index idx_usage_user_agent on public.usage_records(user_id, agent);

alter table public.usage_records enable row level security;

create policy "usage_select_own"
  on public.usage_records for select
  using (auth.uid() = user_id);

create policy "usage_select_org"
  on public.usage_records for select
  using (
    user_id in (
      select om2.user_id from public.org_members om1
      join public.org_members om2 on om1.org_id = om2.org_id
      where om1.user_id = auth.uid()
    )
  );

create policy "usage_insert_own"
  on public.usage_records for insert
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 7. daily_summary (materialized view)
-- ---------------------------------------------------------------------------
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
