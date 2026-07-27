-- ============================================
-- STEP 4 - RLS/POLICIES (lxp_ + backoffice_)
-- Supabase (PostgreSQL)
-- ============================================

-- -------------------------------------------------------
-- 0) Helpers de role (JWT app_metadata.role)
-- -------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

create or replace function public.is_student()
returns boolean
language sql
stable
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'student', false);
$$;

-- -------------------------------------------------------
-- 1) Garantir RLS habilitado
-- -------------------------------------------------------
alter table public.lxp_courses enable row level security;
alter table public.lxp_enrollments enable row level security;
alter table public.lxp_course_periods enable row level security;
alter table public.lxp_course_disciplines enable row level security;
alter table public.lxp_course_library_links enable row level security;
alter table public.lxp_student_discipline_progress enable row level security;
alter table public.lxp_profiles enable row level security;
alter table public.backoffice_team_members enable row level security;

-- -------------------------------------------------------
-- 2) Limpeza de policies (idempotente)
-- -------------------------------------------------------
drop policy if exists lxp_courses_admin_all on public.lxp_courses;
drop policy if exists lxp_courses_student_read_enrolled on public.lxp_courses;

drop policy if exists lxp_enrollments_admin_all on public.lxp_enrollments;
drop policy if exists lxp_enrollments_student_read_own on public.lxp_enrollments;

drop policy if exists lxp_course_periods_admin_all on public.lxp_course_periods;
drop policy if exists lxp_course_periods_student_read_enrolled on public.lxp_course_periods;

drop policy if exists lxp_course_disciplines_admin_all on public.lxp_course_disciplines;
drop policy if exists lxp_course_disciplines_student_read_enrolled on public.lxp_course_disciplines;

drop policy if exists lxp_course_library_links_admin_all on public.lxp_course_library_links;
drop policy if exists lxp_course_library_links_student_read_enrolled on public.lxp_course_library_links;

drop policy if exists lxp_progress_admin_all on public.lxp_student_discipline_progress;
drop policy if exists lxp_progress_student_read_own on public.lxp_student_discipline_progress;
drop policy if exists lxp_progress_student_update_own on public.lxp_student_discipline_progress;

drop policy if exists lxp_profiles_admin_read on public.lxp_profiles;
drop policy if exists lxp_profiles_user_read_own on public.lxp_profiles;
drop policy if exists lxp_profiles_user_update_own on public.lxp_profiles;

drop policy if exists backoffice_team_members_admin_read_own on public.backoffice_team_members;
drop policy if exists backoffice_team_members_admin_update_own on public.backoffice_team_members;

-- -------------------------------------------------------
-- 3) lxp_courses
-- -------------------------------------------------------
create policy lxp_courses_admin_all
on public.lxp_courses
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy lxp_courses_student_read_enrolled
on public.lxp_courses
for select
to authenticated
using (
  public.is_student()
  and exists (
    select 1
    from public.lxp_enrollments e
    join public.lxp_profiles p on p.id = e.student_profile_id
    where e.course_id = lxp_courses.id
      and e.status = 'active'
      and p.user_id = auth.uid()
  )
);

-- -------------------------------------------------------
-- 4) lxp_enrollments
-- -------------------------------------------------------
create policy lxp_enrollments_admin_all
on public.lxp_enrollments
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy lxp_enrollments_student_read_own
on public.lxp_enrollments
for select
to authenticated
using (
  public.is_student()
  and exists (
    select 1
    from public.lxp_profiles p
    where p.id = lxp_enrollments.student_profile_id
      and p.user_id = auth.uid()
  )
);

-- -------------------------------------------------------
-- 5) lxp_course_periods
-- -------------------------------------------------------
create policy lxp_course_periods_admin_all
on public.lxp_course_periods
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy lxp_course_periods_student_read_enrolled
on public.lxp_course_periods
for select
to authenticated
using (
  public.is_student()
  and exists (
    select 1
    from public.lxp_enrollments e
    join public.lxp_profiles p on p.id = e.student_profile_id
    where e.course_id = lxp_course_periods.course_id
      and e.status = 'active'
      and p.user_id = auth.uid()
  )
);

-- -------------------------------------------------------
-- 6) lxp_course_disciplines
-- -------------------------------------------------------
create policy lxp_course_disciplines_admin_all
on public.lxp_course_disciplines
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy lxp_course_disciplines_student_read_enrolled
on public.lxp_course_disciplines
for select
to authenticated
using (
  public.is_student()
  and exists (
    select 1
    from public.lxp_course_periods cp
    join public.lxp_enrollments e on e.course_id = cp.course_id and e.status = 'active'
    join public.lxp_profiles p on p.id = e.student_profile_id
    where cp.id = lxp_course_disciplines.course_period_id
      and p.user_id = auth.uid()
  )
);

-- -------------------------------------------------------
-- 7) lxp_course_library_links
-- -------------------------------------------------------
create policy lxp_course_library_links_admin_all
on public.lxp_course_library_links
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy lxp_course_library_links_student_read_enrolled
on public.lxp_course_library_links
for select
to authenticated
using (
  public.is_student()
  and exists (
    select 1
    from public.lxp_course_disciplines cd
    join public.lxp_course_periods cp on cp.id = cd.course_period_id
    join public.lxp_enrollments e on e.course_id = cp.course_id and e.status = 'active'
    join public.lxp_profiles p on p.id = e.student_profile_id
    where cd.id = lxp_course_library_links.course_discipline_id
      and p.user_id = auth.uid()
  )
);

-- -------------------------------------------------------
-- 8) lxp_student_discipline_progress
-- -------------------------------------------------------
create policy lxp_progress_admin_all
on public.lxp_student_discipline_progress
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy lxp_progress_student_read_own
on public.lxp_student_discipline_progress
for select
to authenticated
using (
  public.is_student()
  and exists (
    select 1
    from public.lxp_profiles p
    where p.id = lxp_student_discipline_progress.student_profile_id
      and p.user_id = auth.uid()
  )
);

create policy lxp_progress_student_update_own
on public.lxp_student_discipline_progress
for update
to authenticated
using (
  public.is_student()
  and exists (
    select 1
    from public.lxp_profiles p
    where p.id = lxp_student_discipline_progress.student_profile_id
      and p.user_id = auth.uid()
  )
)
with check (
  public.is_student()
  and exists (
    select 1
    from public.lxp_profiles p
    where p.id = lxp_student_discipline_progress.student_profile_id
      and p.user_id = auth.uid()
  )
);

-- -------------------------------------------------------
-- 9) lxp_profiles
-- -------------------------------------------------------
create policy lxp_profiles_admin_read
on public.lxp_profiles
for select
to authenticated
using (public.is_admin());

create policy lxp_profiles_user_read_own
on public.lxp_profiles
for select
to authenticated
using (user_id = auth.uid());

create policy lxp_profiles_user_update_own
on public.lxp_profiles
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- -------------------------------------------------------
-- 10) backoffice_team_members
-- -------------------------------------------------------
create policy backoffice_team_members_admin_read_own
on public.backoffice_team_members
for select
to authenticated
using (
  public.is_admin()
  and user_id = auth.uid()
);

create policy backoffice_team_members_admin_update_own
on public.backoffice_team_members
for update
to authenticated
using (
  public.is_admin()
  and user_id = auth.uid()
)
with check (
  public.is_admin()
  and user_id = auth.uid()
);

-- ============================================
-- FIM
-- ============================================
