-- SHOGUN Database Schema
-- Supabase (PostgreSQL + pgvector)
-- All tables use RLS (Row Level Security)

-- =============================================================================
-- Extensions
-- =============================================================================

create extension if not exists "uuid-ossp";
create extension if not exists "vector";       -- pgvector for semantic search
create extension if not exists "pg_trgm";      -- trigram for fuzzy text search

-- =============================================================================
-- Enums
-- =============================================================================

create type subscription_tier as enum ('free', 'basic', 'pro', 'ultra');
create type machine_status as enum ('provisioning', 'running', 'sleeping', 'stopped', 'error');
create type ai_provider as enum ('anthropic', 'openai', 'google');
create type ai_model as enum (
  'claude-sonnet-4-20250514',
  'claude-opus-4-20250514',
  'gpt-4o',
  'gpt-4o-mini',
  'gemini-2.0-flash',
  'gemini-2.5-pro'
);
create type chat_role as enum ('user', 'assistant', 'system', 'tool');
create type memory_source as enum ('screen_capture', 'meeting_transcript', 'chat', 'file', 'manual');
create type automation_trigger as enum ('cron', 'email', 'sms', 'line', 'webhook');
create type automation_status as enum ('active', 'paused', 'error', 'completed');
create type service_status as enum ('deploying', 'running', 'stopped', 'error');
create type locale as enum ('en', 'ja', 'es');

-- =============================================================================
-- Users & Profiles
-- =============================================================================

-- Extends Supabase auth.users
create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  handle        text unique not null,           -- username: toru → toru.syogun.com
  display_name  text,
  avatar_url    text,
  locale        locale not null default 'en',
  timezone      text not null default 'UTC',
  communication_style text,                     -- personalization from onboarding
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Handle validation: lowercase alphanumeric + hyphens, 3-30 chars
alter table profiles add constraint handle_format
  check (handle ~ '^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$');

create unique index profiles_handle_idx on profiles (lower(handle));

-- =============================================================================
-- Subscriptions & Billing
-- =============================================================================

create table subscriptions (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid not null references profiles(id) on delete cascade,
  tier                subscription_tier not null default 'free',
  stripe_customer_id  text unique,
  stripe_subscription_id text unique,
  ai_credits_balance  integer not null default 0,   -- cents
  ai_credits_included integer not null default 0,   -- monthly included (cents)
  current_period_start timestamptz,
  current_period_end   timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  constraint one_subscription_per_user unique (user_id)
);

-- API keys users bring (BYOK)
create table api_keys (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references profiles(id) on delete cascade,
  provider    ai_provider not null,
  encrypted_key bytea not null,               -- AES-256 encrypted
  label       text,
  is_valid    boolean not null default true,
  created_at  timestamptz not null default now(),

  constraint one_key_per_provider unique (user_id, provider)
);

-- =============================================================================
-- Cloud Computer — Fly.io Machines
-- =============================================================================

create table machines (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references profiles(id) on delete cascade,
  fly_machine_id  text unique,                -- Fly.io Machine ID
  fly_app_name    text unique,                -- Fly.io App name
  region          text not null default 'nrt', -- Default: Tokyo
  status          machine_status not null default 'provisioning',
  cpu_cores       integer not null default 1,
  memory_mb       integer not null default 256,
  storage_gb      integer not null default 100,
  ip_address      text,
  last_active_at  timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint one_machine_per_user unique (user_id)
);

-- Services hosted on user's machine
create table services (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references profiles(id) on delete cascade,
  machine_id      uuid not null references machines(id) on delete cascade,
  name            text not null,
  subdomain       text unique,                 -- name.syogun.com
  custom_domain   text unique,
  port            integer not null,
  status          service_status not null default 'deploying',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Automations (cron jobs, triggered tasks)
create table automations (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references profiles(id) on delete cascade,
  machine_id      uuid not null references machines(id) on delete cascade,
  name            text not null,
  description     text,
  trigger_type    automation_trigger not null,
  trigger_config  jsonb not null default '{}',  -- cron expression, email pattern, etc.
  command         text not null,                -- shell command or script path
  status          automation_status not null default 'active',
  last_run_at     timestamptz,
  last_error      text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- =============================================================================
-- AI Chat
-- =============================================================================

create table conversations (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references profiles(id) on delete cascade,
  title       text,
  model       ai_model not null default 'claude-sonnet-4-20250514',
  system_prompt text,
  is_pinned   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index conversations_user_idx on conversations (user_id, updated_at desc);

create table messages (
  id              uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  role            chat_role not null,
  content         text not null,
  model           ai_model,                     -- which model generated this
  tool_calls      jsonb,                        -- tool use requests
  tool_results    jsonb,                        -- tool use responses
  token_input     integer,                      -- for billing
  token_output    integer,
  cost_cents      integer,                      -- actual cost in cents
  created_at      timestamptz not null default now()
);

create index messages_conversation_idx on messages (conversation_id, created_at asc);

-- =============================================================================
-- Work Memory (KIOKU)
-- =============================================================================

create table memory_entries (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references profiles(id) on delete cascade,
  source          memory_source not null,
  content         text not null,                -- raw text content
  summary         text,                         -- AI-generated summary
  embedding       vector(1536),                 -- for semantic search
  app_name        text,                         -- which app was captured from
  metadata        jsonb not null default '{}',  -- source-specific metadata
  captured_at     timestamptz not null default now(),
  created_at      timestamptz not null default now()
);

create index memory_entries_user_time_idx on memory_entries (user_id, captured_at desc);
create index memory_entries_embedding_idx on memory_entries
  using hnsw (embedding vector_cosine_ops) with (m = 16, ef_construction = 64);
create index memory_entries_source_idx on memory_entries (user_id, source);

-- Apps excluded from screen capture
create table memory_exclusions (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references profiles(id) on delete cascade,
  app_name    text not null,
  created_at  timestamptz not null default now(),

  constraint unique_exclusion unique (user_id, app_name)
);

-- User's memory preferences
create table memory_settings (
  user_id             uuid primary key references profiles(id) on delete cascade,
  screen_capture_enabled boolean not null default true,
  transcription_enabled  boolean not null default true,
  capture_interval_sec   integer not null default 30,   -- how often to capture
  retention_days         integer,                        -- null = forever
  updated_at            timestamptz not null default now()
);

-- =============================================================================
-- Notification channels (SMS / LINE / Email triggers)
-- =============================================================================

create table notification_channels (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references profiles(id) on delete cascade,
  channel     text not null,                    -- 'sms', 'line', 'email'
  identifier  text not null,                    -- phone number, LINE user ID, email
  is_verified boolean not null default false,
  config      jsonb not null default '{}',
  created_at  timestamptz not null default now(),

  constraint unique_channel unique (user_id, channel)
);

-- =============================================================================
-- AI Credits Usage Tracking
-- =============================================================================

create table credit_usage (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references profiles(id) on delete cascade,
  conversation_id uuid references conversations(id) on delete set null,
  provider        ai_provider not null,
  model           ai_model not null,
  token_input     integer not null default 0,
  token_output    integer not null default 0,
  cost_cents      integer not null default 0,
  is_byok         boolean not null default false,  -- no charge if BYOK
  created_at      timestamptz not null default now()
);

create index credit_usage_user_period_idx on credit_usage (user_id, created_at desc);

-- =============================================================================
-- Credit Ledger (append-only for auditability)
-- =============================================================================

create table credit_balances (
  user_id         uuid primary key references profiles(id) on delete cascade,
  balance_cents   bigint not null default 0,
  lifetime_used   bigint not null default 0,
  updated_at      timestamptz not null default now()
);

create table credit_ledger (
  id              bigserial primary key,
  user_id         uuid not null references profiles(id) on delete cascade,
  delta_cents     bigint not null,                -- positive = add, negative = consume
  reason          text not null,                  -- 'subscription_grant' | 'purchase' | 'ai_usage' | 'refund'
  reference_id    text,                           -- message ID, stripe invoice ID, etc.
  balance_after   bigint not null,
  created_at      timestamptz not null default now()
);

create index credit_ledger_user_idx on credit_ledger (user_id, created_at desc);

-- =============================================================================
-- Automation Runs (execution history)
-- =============================================================================

create table automation_runs (
  id              uuid primary key default uuid_generate_v4(),
  automation_id   uuid not null references automations(id) on delete cascade,
  started_at      timestamptz not null default now(),
  finished_at     timestamptz,
  exit_code       integer,
  stdout_tail     text,                           -- last 10KB
  stderr_tail     text,
  trigger_payload jsonb                           -- incoming email/SMS/LINE data
);

create index automation_runs_idx on automation_runs (automation_id, started_at desc);

-- =============================================================================
-- Storage Usage Tracking (Cloudflare R2)
-- =============================================================================

create table storage_usage (
  user_id         uuid primary key references profiles(id) on delete cascade,
  bytes_used      bigint not null default 0,
  file_count      bigint not null default 0,
  quota_bytes     bigint not null default 107374182400,  -- 100GB
  updated_at      timestamptz not null default now()
);

-- =============================================================================
-- Row Level Security (RLS) Policies
-- =============================================================================

alter table profiles enable row level security;
alter table subscriptions enable row level security;
alter table api_keys enable row level security;
alter table machines enable row level security;
alter table services enable row level security;
alter table automations enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table memory_entries enable row level security;
alter table memory_exclusions enable row level security;
alter table memory_settings enable row level security;
alter table notification_channels enable row level security;
alter table credit_usage enable row level security;

-- Pattern: Users can only access their own data
-- Applied to all tables with user_id

create policy "Users can view own profile"
  on profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

create policy "Users can view own subscription"
  on subscriptions for select using (auth.uid() = user_id);

create policy "Users can manage own api keys"
  on api_keys for all using (auth.uid() = user_id);

create policy "Users can view own machine"
  on machines for select using (auth.uid() = user_id);

create policy "Users can manage own services"
  on services for all using (auth.uid() = user_id);

create policy "Users can manage own automations"
  on automations for all using (auth.uid() = user_id);

create policy "Users can manage own conversations"
  on conversations for all using (auth.uid() = user_id);

create policy "Users can manage own messages"
  on messages for all using (
    auth.uid() = (select user_id from conversations where id = messages.conversation_id)
  );

create policy "Users can manage own memory"
  on memory_entries for all using (auth.uid() = user_id);

create policy "Users can manage own memory exclusions"
  on memory_exclusions for all using (auth.uid() = user_id);

create policy "Users can manage own memory settings"
  on memory_settings for all using (auth.uid() = user_id);

create policy "Users can manage own notification channels"
  on notification_channels for all using (auth.uid() = user_id);

create policy "Users can view own credit usage"
  on credit_usage for select using (auth.uid() = user_id);

alter table credit_balances enable row level security;
alter table credit_ledger enable row level security;
alter table automation_runs enable row level security;
alter table storage_usage enable row level security;

create policy "Users can view own credit balance"
  on credit_balances for select using (auth.uid() = user_id);

-- credit_ledger: users can read, only service role can insert
create policy "Users can view own credit ledger"
  on credit_ledger for select using (auth.uid() = user_id);

create policy "Users can view own automation runs"
  on automation_runs for select using (
    auth.uid() = (select user_id from automations where id = automation_runs.automation_id)
  );

create policy "Users can view own storage usage"
  on storage_usage for select using (auth.uid() = user_id);

-- =============================================================================
-- Functions
-- =============================================================================

-- Search memory by semantic similarity
create or replace function search_memory(
  p_user_id uuid,
  p_query_embedding vector(1536),
  p_limit integer default 20,
  p_threshold float default 0.7
)
returns table (
  id uuid,
  content text,
  summary text,
  source memory_source,
  app_name text,
  captured_at timestamptz,
  similarity float
)
language plpgsql security definer
as $$
begin
  return query
  select
    me.id,
    me.content,
    me.summary,
    me.source,
    me.app_name,
    me.captured_at,
    1 - (me.embedding <=> p_query_embedding) as similarity
  from memory_entries me
  where me.user_id = p_user_id
    and 1 - (me.embedding <=> p_query_embedding) > p_threshold
  order by me.embedding <=> p_query_embedding
  limit p_limit;
end;
$$;

-- Get AI credits remaining for a user this period
create or replace function get_credits_remaining(p_user_id uuid)
returns integer
language plpgsql security definer
as $$
declare
  v_balance integer;
  v_included integer;
  v_used integer;
  v_period_start timestamptz;
begin
  select ai_credits_balance, ai_credits_included, current_period_start
  into v_balance, v_included, v_period_start
  from subscriptions
  where user_id = p_user_id;

  if v_period_start is null then
    return 0;
  end if;

  select coalesce(sum(cost_cents), 0)
  into v_used
  from credit_usage
  where user_id = p_user_id
    and is_byok = false
    and created_at >= v_period_start;

  return greatest(0, v_balance + v_included - v_used);
end;
$$;

-- Atomically check balance and deduct credits in one transaction
create or replace function deduct_credits_atomic(p_user_id uuid, p_amount integer)
returns boolean
language plpgsql security definer
as $$
declare
  v_remaining integer;
begin
  -- Get current balance with row lock
  select get_credits_remaining(p_user_id) into v_remaining;

  if v_remaining < p_amount then
    return false;
  end if;

  -- Deduct from balance
  update subscriptions
  set ai_credits_balance = ai_credits_balance - p_amount
  where user_id = p_user_id;

  return true;
end;
$$;

-- Auto-update updated_at timestamp
create or replace function update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Apply updated_at trigger to all relevant tables
create trigger profiles_updated_at before update on profiles
  for each row execute function update_updated_at();
create trigger subscriptions_updated_at before update on subscriptions
  for each row execute function update_updated_at();
create trigger machines_updated_at before update on machines
  for each row execute function update_updated_at();
create trigger services_updated_at before update on services
  for each row execute function update_updated_at();
create trigger automations_updated_at before update on automations
  for each row execute function update_updated_at();
create trigger conversations_updated_at before update on conversations
  for each row execute function update_updated_at();
create trigger memory_settings_updated_at before update on memory_settings
  for each row execute function update_updated_at();

-- =============================================================================
-- Initial migration record
-- =============================================================================

-- =============================================================================
-- Teams & Enterprise
-- =============================================================================

create type team_role as enum ('owner', 'admin', 'member', 'viewer');
create type invite_status as enum ('pending', 'accepted', 'declined', 'expired');

create table teams (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,
  slug            text unique not null,
  avatar_url      text,
  owner_id        uuid not null references profiles(id) on delete cascade,
  max_members     integer not null default 10,
  plan            subscription_tier not null default 'pro',
  stripe_customer_id text unique,
  sso_config      jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create unique index teams_slug_idx on teams (lower(slug));

create table team_members (
  id              uuid primary key default uuid_generate_v4(),
  team_id         uuid not null references teams(id) on delete cascade,
  user_id         uuid not null references profiles(id) on delete cascade,
  role            team_role not null default 'member',
  joined_at       timestamptz not null default now(),
  constraint unique_team_member unique (team_id, user_id)
);

create index team_members_user_idx on team_members (user_id);
create index team_members_team_idx on team_members (team_id);

create table team_invites (
  id              uuid primary key default uuid_generate_v4(),
  team_id         uuid not null references teams(id) on delete cascade,
  email           text not null,
  role            team_role not null default 'member',
  invited_by      uuid not null references profiles(id),
  status          invite_status not null default 'pending',
  token           text unique not null,
  expires_at      timestamptz not null default (now() + interval '7 days'),
  created_at      timestamptz not null default now()
);

create index team_invites_email_idx on team_invites (email, status);
create index team_invites_token_idx on team_invites (token);

-- Shared conversations within a team
create table shared_conversations (
  id              uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  team_id         uuid not null references teams(id) on delete cascade,
  shared_by       uuid not null references profiles(id),
  shared_at       timestamptz not null default now(),
  constraint unique_shared_conv unique (conversation_id, team_id)
);

-- Shared memory entries within a team
create table shared_memory (
  id              uuid primary key default uuid_generate_v4(),
  memory_entry_id uuid not null references memory_entries(id) on delete cascade,
  team_id         uuid not null references teams(id) on delete cascade,
  shared_by       uuid not null references profiles(id),
  shared_at       timestamptz not null default now(),
  constraint unique_shared_memory unique (memory_entry_id, team_id)
);

-- Audit log for team actions
create table audit_logs (
  id              uuid primary key default uuid_generate_v4(),
  team_id         uuid not null references teams(id) on delete cascade,
  user_id         uuid not null references profiles(id),
  action          text not null,
  resource_type   text not null,
  resource_id     text,
  metadata        jsonb not null default '{}',
  ip_address      text,
  created_at      timestamptz not null default now()
);

create index audit_logs_team_idx on audit_logs (team_id, created_at desc);
create index audit_logs_user_idx on audit_logs (user_id, created_at desc);

-- RLS
alter table teams enable row level security;
alter table team_members enable row level security;
alter table team_invites enable row level security;
alter table shared_conversations enable row level security;
alter table shared_memory enable row level security;
alter table audit_logs enable row level security;

-- Team members can view their teams
create policy "Team members can view team"
  on teams for select using (
    id in (select team_id from team_members where user_id = auth.uid())
  );

create policy "Team owners can update team"
  on teams for update using (owner_id = auth.uid());

create policy "Users can create teams"
  on teams for insert with check (owner_id = auth.uid());

-- Members can view other members
create policy "Team members can view members"
  on team_members for select using (
    team_id in (select team_id from team_members where user_id = auth.uid())
  );

-- Admins+ can manage members
create policy "Admins can manage members"
  on team_members for all using (
    team_id in (select team_id from team_members where user_id = auth.uid() and role in ('owner', 'admin'))
  );

-- Invites visible to team admins
create policy "Admins can manage invites"
  on team_invites for all using (
    team_id in (select team_id from team_members where user_id = auth.uid() and role in ('owner', 'admin'))
  );

-- Shared conversations visible to team members
create policy "Team members can view shared conversations"
  on shared_conversations for select using (
    team_id in (select team_id from team_members where user_id = auth.uid())
  );

create policy "Members can share conversations"
  on shared_conversations for insert with check (
    team_id in (select team_id from team_members where user_id = auth.uid())
  );

-- Shared memory visible to team members
create policy "Team members can view shared memory"
  on shared_memory for select using (
    team_id in (select team_id from team_members where user_id = auth.uid())
  );

create policy "Members can share memory"
  on shared_memory for insert with check (
    team_id in (select team_id from team_members where user_id = auth.uid())
  );

-- Audit logs visible to admins
create policy "Admins can view audit logs"
  on audit_logs for select using (
    team_id in (select team_id from team_members where user_id = auth.uid() and role in ('owner', 'admin'))
  );

-- Triggers
create trigger teams_updated_at before update on teams
  for each row execute function update_updated_at();

-- Copy this file to supabase/migrations/00001_initial_schema.sql
