-- Booth facilities on events: what the organizer provides and what tenants bring themselves.
-- Run once in the Supabase SQL Editor (safe to run again).
alter table public.events
  add column if not exists facilities_included text[] not null default '{}',
  add column if not exists facilities_excluded text[] not null default '{}';

-- Make PostgREST pick up the new columns right away
notify pgrst, 'reload schema';
