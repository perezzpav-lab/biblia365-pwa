create table if not exists public.game_rooms (
  id uuid primary key default gen_random_uuid(),
  host_user_id uuid not null references auth.users(id) on delete cascade,
  guest_user_id uuid references auth.users(id) on delete set null,
  host_ready boolean not null default false,
  guest_ready boolean not null default false,
  host_score integer not null default 0,
  guest_score integer not null default 0,
  host_progress integer not null default 0,
  guest_progress integer not null default 0,
  status text not null default 'waiting' check (status in ('waiting', 'in_progress', 'finished')),
  rewards_granted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_game_rooms_status on public.game_rooms (status, created_at asc);
create index if not exists idx_game_rooms_users on public.game_rooms (host_user_id, guest_user_id);

alter table public.game_rooms enable row level security;

drop policy if exists "Users can read game rooms" on public.game_rooms;
create policy "Users can read game rooms"
  on public.game_rooms
  for select
  using (auth.uid() = host_user_id or auth.uid() = guest_user_id or status = 'waiting');

drop policy if exists "Users can create own game rooms" on public.game_rooms;
create policy "Users can create own game rooms"
  on public.game_rooms
  for insert
  with check (auth.uid() = host_user_id);

drop policy if exists "Players can update own game rooms" on public.game_rooms;
create policy "Players can update own game rooms"
  on public.game_rooms
  for update
  using (auth.uid() = host_user_id or auth.uid() = guest_user_id);

drop policy if exists "Users can read seasonal winners" on public.seasonal_winners;
create policy "Users can read seasonal winners"
  on public.seasonal_winners
  for select
  using (true);

drop policy if exists "Users can read prayer supports" on public.prayer_supports;
create policy "Users can read prayer supports"
  on public.prayer_supports
  for select
  using (true);

do $$
begin
  if exists (
    select 1 from pg_publication where pubname = 'supabase_realtime'
  ) then
    begin
      alter publication supabase_realtime add table public.prayer_requests;
    exception when duplicate_object then
      null;
    end;
    begin
      alter publication supabase_realtime add table public.prayer_supports;
    exception when duplicate_object then
      null;
    end;
    begin
      alter publication supabase_realtime add table public.app_events;
    exception when duplicate_object then
      null;
    end;
    begin
      alter publication supabase_realtime add table public.game_rooms;
    exception when duplicate_object then
      null;
    end;
  end if;
end $$;
