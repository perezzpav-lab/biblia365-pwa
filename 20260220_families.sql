-- Familia por usuario (dueño) + miembros con clave estable para perfil local / profile_stats
create table if not exists public.families (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'Mi familia',
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (owner_user_id)
);

create index if not exists idx_families_owner on public.families (owner_user_id);

create table if not exists public.family_members (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  profile_key text not null,
  display_name text not null,
  emoji text not null default '👤',
  role text not null default 'member' check (role in ('admin', 'member', 'child')),
  sort_order integer not null default 0,
  unique (family_id, profile_key)
);

create index if not exists idx_family_members_family on public.family_members (family_id, sort_order);

alter table public.families enable row level security;
alter table public.family_members enable row level security;

drop policy if exists "Users manage own family" on public.families;
create policy "Users manage own family"
  on public.families
  for all
  using (auth.uid() = owner_user_id)
  with check (auth.uid() = owner_user_id);

drop policy if exists "Users manage own family members" on public.family_members;
create policy "Users manage own family members"
  on public.family_members
  for all
  using (
    exists (
      select 1 from public.families f
      where f.id = family_members.family_id and f.owner_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.families f
      where f.id = family_members.family_id and f.owner_user_id = auth.uid()
    )
  );
