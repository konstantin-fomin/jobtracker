-- Prepare jobs for Trash / soft delete.

alter table public.jobs
  add column if not exists deleted_at timestamptz;

create index if not exists jobs_user_deleted_at
  on public.jobs (user_id, deleted_at);
