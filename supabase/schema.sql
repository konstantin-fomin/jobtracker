-- Run this in your Supabase SQL editor

create table public.jobs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  company     text not null,
  role        text not null,
  status      text not null default 'sent'
                check (status in ('sent','interview','offer','rejected','ghosted')),
  source      text,
  date        date,
  salary_from text,
  salary_to   text,
  contact     text,
  url         text,
  notes       text,
  created_at  timestamptz default now()
);

-- Row-level security: each user sees only their own rows
alter table public.jobs enable row level security;

create policy "Users can manage their own jobs"
  on public.jobs
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
