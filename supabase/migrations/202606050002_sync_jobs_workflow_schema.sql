-- Sync repository SQL with the current Supabase jobs workflow schema.
-- Idempotent and safe for already-migrated databases.

-- Job workflow fields ---------------------------------------------------------

alter table public.jobs
  add column if not exists stage text,
  add column if not exists next_action text,
  add column if not exists next_action_date date,
  add column if not exists work_format text,
  add column if not exists city text,
  add column if not exists rating integer,
  add column if not exists referred_by text,
  add column if not exists reject_reason text,
  add column if not exists updated_at timestamptz default now();

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

-- updated_at ------------------------------------------------------------------

update public.jobs
set updated_at = coalesce(updated_at, created_at, now())
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
drop trigger if exists jobs_updated_at on public.jobs;

create trigger jobs_updated_at
  before update on public.jobs
  for each row
  execute function public.set_updated_at();

-- Indexes ---------------------------------------------------------------------

create index if not exists jobs_user_status
  on public.jobs (user_id, status);

create index if not exists jobs_user_date
  on public.jobs (user_id, date desc);

create index if not exists jobs_next_action
  on public.jobs (user_id, next_action_date)
  where next_action_date is not null;

-- Status history --------------------------------------------------------------

create table if not exists public.job_status_history (
  id         uuid primary key default gen_random_uuid(),
  job_id     uuid references public.jobs(id) on delete cascade not null,
  user_id    uuid references auth.users(id) on delete cascade not null,
  status     text not null,
  stage      text,
  changed_at timestamptz default now(),
  note       text
);

alter table public.job_status_history
  add column if not exists status text,
  add column if not exists stage text,
  add column if not exists changed_at timestamptz default now(),
  add column if not exists note text;

alter table public.job_status_history enable row level security;

drop policy if exists "Users manage their own history" on public.job_status_history;

create policy "Users manage their own history"
  on public.job_status_history
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Triggers --------------------------------------------------------------------

create or replace function public.log_status_change()
returns trigger
language plpgsql
as $$
begin
  if old.status is distinct from new.status or old.stage is distinct from new.stage then
    insert into public.job_status_history (job_id, user_id, status, stage)
    values (new.id, new.user_id, new.status, new.stage);
  end if;

  return new;
end;
$$;

drop trigger if exists jobs_status_history on public.jobs;

create trigger jobs_status_history
  after update on public.jobs
  for each row
  execute function public.log_status_change();
