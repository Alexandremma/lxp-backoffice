-- STEP 11: add updated_at to enrollments
-- Required by backoffice enrollment status update flow.

alter table public.lxp_enrollments
  add column if not exists updated_at timestamptz;

update public.lxp_enrollments
set updated_at = coalesce(updated_at, created_at, now())
where updated_at is null;

alter table public.lxp_enrollments
  alter column updated_at set default now();

alter table public.lxp_enrollments
  alter column updated_at set not null;
