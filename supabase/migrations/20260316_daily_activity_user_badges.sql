create table if not exists public.daily_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  id_dia integer not null,
  mode text not null check (mode in ('adulto', 'joven', 'nino')),
  completed boolean not null default true,
  streak_value integer not null default 1,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, id_dia)
);

create index if not exists idx_daily_activity_user_updated
  on public.daily_activity (user_id, updated_at desc);

alter table public.daily_activity enable row level security;

drop policy if exists "Users can read own daily activity" on public.daily_activity;
create policy "Users can read own daily activity"
  on public.daily_activity
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own daily activity" on public.daily_activity;
create policy "Users can insert own daily activity"
  on public.daily_activity
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own daily activity" on public.daily_activity;
create policy "Users can update own daily activity"
  on public.daily_activity
  for update
  using (auth.uid() = user_id);

create table if not exists public.user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  badge_key text not null,
  unlocked_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, badge_key)
);

create index if not exists idx_user_badges_user
  on public.user_badges (user_id);

alter table public.user_badges enable row level security;

drop policy if exists "Users can read own badges" on public.user_badges;
create policy "Users can read own badges"
  on public.user_badges
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own badges" on public.user_badges;
create policy "Users can insert own badges"
  on public.user_badges
  for insert
  with check (auth.uid() = user_id);

create table if not exists public.app_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  event_name text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_app_events_created_at
  on public.app_events (created_at desc);

create index if not exists idx_app_events_user
  on public.app_events (user_id, created_at desc);

alter table public.app_events enable row level security;

drop policy if exists "Users can insert own app events" on public.app_events;
create policy "Users can insert own app events"
  on public.app_events
  for insert
  with check (auth.uid() = user_id or user_id is null);

drop policy if exists "Users can read own app events" on public.app_events;
create policy "Users can read own app events"
  on public.app_events
  for select
  using (auth.uid() = user_id);

drop policy if exists "Admins can insert app events" on public.app_events;
create policy "Admins can insert app events"
  on public.app_events
  for insert
  with check (auth.uid() = user_id or user_id is null);

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  reminder_time text not null default '07:00',
  timezone text not null default 'UTC',
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_push_subscriptions_user on public.push_subscriptions (user_id);
create index if not exists idx_push_subscriptions_enabled on public.push_subscriptions (enabled);

alter table public.push_subscriptions enable row level security;

drop policy if exists "Users can read own push subscriptions" on public.push_subscriptions;
create policy "Users can read own push subscriptions"
  on public.push_subscriptions
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own push subscriptions" on public.push_subscriptions;
create policy "Users can insert own push subscriptions"
  on public.push_subscriptions
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own push subscriptions" on public.push_subscriptions;
create policy "Users can update own push subscriptions"
  on public.push_subscriptions
  for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own push subscriptions" on public.push_subscriptions;
create policy "Users can delete own push subscriptions"
  on public.push_subscriptions
  for delete
  using (auth.uid() = user_id);

create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  avatar_key text not null default 'lion_shield',
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.user_profiles enable row level security;

drop policy if exists "Users can read own profile" on public.user_profiles;
create policy "Users can read own profile"
  on public.user_profiles
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own profile" on public.user_profiles;
create policy "Users can insert own profile"
  on public.user_profiles
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own profile" on public.user_profiles;
create policy "Users can update own profile"
  on public.user_profiles
  for update
  using (auth.uid() = user_id);

create table if not exists public.seasonal_winners (
  id uuid primary key default gen_random_uuid(),
  season_key text not null,
  position integer not null check (position between 1 and 3),
  user_id uuid references auth.users(id) on delete set null,
  xp_total integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_seasonal_winners_key on public.seasonal_winners (season_key);

create table if not exists public.prayer_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  message text not null,
  prayed_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_prayer_requests_created
  on public.prayer_requests (created_at desc);

alter table public.prayer_requests enable row level security;

drop policy if exists "Anyone can read prayer requests" on public.prayer_requests;
create policy "Anyone can read prayer requests"
  on public.prayer_requests
  for select
  using (true);

drop policy if exists "Authenticated can insert prayer requests" on public.prayer_requests;
create policy "Authenticated can insert prayer requests"
  on public.prayer_requests
  for insert
  with check (auth.uid() = user_id or user_id is null);

drop policy if exists "Authenticated can update prayer requests" on public.prayer_requests;
create policy "Authenticated can update prayer requests"
  on public.prayer_requests
  for update
  using (true);

create table if not exists public.prayer_supports (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.prayer_requests(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (request_id, user_id)
);

alter table public.prayer_supports enable row level security;

drop policy if exists "Users can insert own prayer supports" on public.prayer_supports;
create policy "Users can insert own prayer supports"
  on public.prayer_supports
  for insert
  with check (auth.uid() = user_id);
