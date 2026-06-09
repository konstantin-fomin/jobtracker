-- Add 'test' (тестовое задание) as a valid status value.
-- PostgreSQL does not support ALTER on CHECK constraints — must drop and recreate.

alter table public.jobs
  drop constraint if exists jobs_status_check;

alter table public.jobs
  add constraint jobs_status_check
  check (status in ('sent','interview','test','offer','rejected','ghosted'));
