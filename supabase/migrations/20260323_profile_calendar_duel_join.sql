-- Una finalización por día civil por perfil (sincronizado en la nube)
alter table public.profile_stats
  add column if not exists last_calendar_complete_date date;

comment on column public.profile_stats.last_calendar_complete_date is
  'Local calendar date (YYYY-MM-DD) when the user last tapped “Completar día” for this profile.';

-- Permitir que un usuario autenticado se una como invitado a una sala en espera (enlace de invitación)
drop policy if exists "Players can update own game rooms" on public.game_rooms;
create policy "Players can update own game rooms"
  on public.game_rooms
  for update
  using (
    auth.uid() = host_user_id
    or auth.uid() = guest_user_id
    or (
      status = 'waiting'
      and guest_user_id is null
      and auth.uid() is not null
    )
  )
  with check (
    auth.uid() = host_user_id
    or auth.uid() = guest_user_id
  );
