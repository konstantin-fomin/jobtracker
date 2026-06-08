-- Grant table-level privileges that were missing from the initial schema.
-- RLS policies alone are not enough: PostgreSQL checks table privileges first,
-- then RLS. The log_status_change trigger runs as the authenticated user and
-- needs INSERT on job_status_history to record status changes.

grant select, insert, update, delete on public.jobs to authenticated;
grant select, insert on public.job_status_history to authenticated;
