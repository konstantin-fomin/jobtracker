-- Add columns used by the current JobTracker UI and TypeScript Job model.
-- Safe for existing projects: additive only, no drops/renames/data rewrites.

alter table public.jobs
  add column if not exists stage text,
  add column if not exists next_action text,
  add column if not exists next_action_date date,
  add column if not exists work_format text,
  add column if not exists city text,
  add column if not exists rating integer,
  add column if not exists referred_by text,
  add column if not exists reject_reason text,
  add column if not exists updated_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.jobs'::regclass
      and conname = 'jobs_rating_check'
  ) then
    alter table public.jobs
      add constraint jobs_rating_check
      check (rating is null or rating between 1 and 5)
      not valid;
  end if;
end;
$$;

update public.jobs
set updated_at = coalesce(created_at, now())
where updated_at is null;

alter table public.jobs
  alter column updated_at set default now();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_jobs_updated_at on public.jobs;

create trigger set_jobs_updated_at
  before update on public.jobs
  for each row
  execute function public.set_updated_at();
