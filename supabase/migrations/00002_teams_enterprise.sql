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
