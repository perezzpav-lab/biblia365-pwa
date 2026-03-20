create table if not exists public.profile_stats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  profile_id text not null,
  xp_total integer not null default 0,
  streak_value integer not null default 0,
  completed_days integer[] not null default '{}',
  badges text[] not null default '{}',
  stickers text[] not null default '{}',
  mode text not null default 'adulto' check (mode in ('adulto', 'joven', 'nino')),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, profile_id)
);

create index if not exists idx_profile_stats_user_profile
  on public.profile_stats (user_id, profile_id);

create index if not exists idx_profile_stats_updated
  on public.profile_stats (updated_at desc);

alter table public.profile_stats enable row level security;

drop policy if exists "Users can read own profile stats" on public.profile_stats;
create policy "Users can read own profile stats"
  on public.profile_stats
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own profile stats" on public.profile_stats;
create policy "Users can insert own profile stats"
  on public.profile_stats
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own profile stats" on public.profile_stats;
create policy "Users can update own profile stats"
  on public.profile_stats
  for update
  using (auth.uid() = user_id);
