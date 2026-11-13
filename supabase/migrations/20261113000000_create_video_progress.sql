-- Optional cloud metadata for future account-based sync.
-- This table stores no video files, local paths, or subtitle contents.
create table if not exists public.video_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  video_key text not null,
  title text not null,
  position_seconds double precision not null default 0 check (position_seconds >= 0),
  duration_seconds double precision not null default 0 check (duration_seconds >= 0),
  is_saved boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, video_key)
);

create index if not exists video_progress_user_updated_idx
  on public.video_progress (user_id, updated_at desc);

alter table public.video_progress enable row level security;

create policy "Users can read their own video progress"
  on public.video_progress for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert their own video progress"
  on public.video_progress for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own video progress"
  on public.video_progress for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own video progress"
  on public.video_progress for delete to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.video_progress to authenticated;
