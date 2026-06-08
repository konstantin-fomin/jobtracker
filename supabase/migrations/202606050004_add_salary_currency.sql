-- Add salary_currency to jobs table.
-- Safe: additive only. Provides 'RUB' default so existing rows are valid
-- without any data loss and the column is immediately NOT NULL.

alter table public.jobs
  add column if not exists salary_currency text not null default 'RUB';

-- Backfill any nulls that snuck in before the not-null constraint was set
-- (defensive guard — should be a no-op on a fresh column).
update public.jobs
set salary_currency = 'RUB'
where salary_currency is null;

-- Add check constraint only if it does not already exist.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.jobs'::regclass
      and conname = 'jobs_salary_currency_check'
  ) then
    alter table public.jobs
      add constraint jobs_salary_currency_check
      check (salary_currency in ('RUB', 'USD', 'EUR'))
      not valid;  -- not valid: skips full table scan, safe on large tables
  end if;
end;
$$;
