-- Run this in your Supabase SQL editor

-- Jobs ------------------------------------------------------------------------

create table public.jobs (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references auth.users(id) on delete cascade not null,
  company          text not null,
  role             text not null,
  status           text not null default 'sent'
                     check (status in ('sent','interview','offer','rejected','ghosted')),
  source           text,
  date             date,
  salary_from      text,
  salary_to        text,
  contact          text,
  url              text,
  notes            text,
  stage            text,
  next_action      text,
  next_action_date date,
  work_format      text,
  city             text,
  rating           integer check (rating is null or rating between 1 and 5),
  referred_by      text,
  reject_reason    text,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now(),
  deleted_at       timestamptz
);

-- updated_at ------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger jobs_updated_at
  before update on public.jobs
  for each row
  execute function public.set_updated_at();

-- Indexes ---------------------------------------------------------------------

create index jobs_user_status
  on public.jobs (user_id, status);

create index jobs_user_date
  on public.jobs (user_id, date desc);

create index jobs_next_action
  on public.jobs (user_id, next_action_date)
  where next_action_date is not null;

create index jobs_user_deleted_at
  on public.jobs (user_id, deleted_at);

-- Status history --------------------------------------------------------------

create table public.job_status_history (
  id         uuid primary key default gen_random_uuid(),
  job_id     uuid references public.jobs(id) on delete cascade not null,
  user_id    uuid references auth.users(id) on delete cascade not null,
  status     text not null,
  stage      text,
  changed_at timestamptz default now(),
  note       text
);

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

create trigger jobs_status_history
  after update on public.jobs
  for each row
  execute function public.log_status_change();

-- Row-level security ----------------------------------------------------------

alter table public.jobs enable row level security;

create policy "Users can manage their own jobs"
  on public.jobs
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table public.job_status_history enable row level security;

create policy "Users manage their own history"
  on public.job_status_history
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
