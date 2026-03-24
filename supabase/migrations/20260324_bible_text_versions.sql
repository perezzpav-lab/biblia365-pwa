-- Ampliar versiones permitidas en bible_text (RVR1960 y PDT requieren JSON + seed).
alter table public.bible_text drop constraint if exists bible_text_version_check;

alter table public.bible_text
  add constraint bible_text_version_check
  check (
    version in (
      'RV1909',
      'NVI',
      'TLA',
      'RVR1960',
      'PDT'
    )
  );
