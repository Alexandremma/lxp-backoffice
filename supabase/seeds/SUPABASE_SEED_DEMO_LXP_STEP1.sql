-- Seed demo/idempotente para validar o fluxo LXP (passo 1)
-- Inclui:
-- - usuarios auth (aluno + admin demo)
-- - perfis, curso, periodo, disciplina, matricula
-- - vinculo externo da disciplina (library link)
-- - progresso de disciplina e progresso por aula
--
-- Credenciais seed (ambiente de demo):
-- - aluno.demo+b42@seed.local / B42@123456
-- - admin.demo+b42@seed.local / B42@123456

with seed_consts as (
  select
    '11111111-1111-1111-1111-111111111111'::uuid as student_user_id,
    '22222222-2222-2222-2222-222222222222'::uuid as admin_user_id,
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid as student_profile_id,
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid as admin_profile_id,
    'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid as course_id,
    'dddddddd-dddd-dddd-dddd-dddddddddddd'::uuid as period_id,
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'::uuid as discipline_id
)
insert into auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at, is_sso_user, is_anonymous
)
select
  c.student_user_id,
  'authenticated',
  'authenticated',
  'aluno.demo+b42@seed.local',
  crypt('B42@123456', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"name":"Aluno Demo B42"}'::jsonb,
  now(),
  now(),
  false,
  false
from seed_consts c
where not exists (select 1 from auth.users u where u.id = c.student_user_id or u.email = 'aluno.demo+b42@seed.local');

with seed_consts as (
  select
    '22222222-2222-2222-2222-222222222222'::uuid as admin_user_id
)
insert into auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at, is_sso_user, is_anonymous
)
select
  c.admin_user_id,
  'authenticated',
  'authenticated',
  'admin.demo+b42@seed.local',
  crypt('B42@123456', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"name":"Admin Demo B42"}'::jsonb,
  now(),
  now(),
  false,
  false
from seed_consts c
where not exists (select 1 from auth.users u where u.id = c.admin_user_id or u.email = 'admin.demo+b42@seed.local');

with seed_consts as (
  select
    '11111111-1111-1111-1111-111111111111'::uuid as student_user_id,
    '22222222-2222-2222-2222-222222222222'::uuid as admin_user_id,
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid as student_profile_id,
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid as admin_profile_id
)
insert into public.lxp_profiles (id, user_id, name, email, role)
select c.student_profile_id, c.student_user_id, 'Aluno Demo B42', 'aluno.demo+b42@seed.local', 'student'
from seed_consts c
on conflict (id) do update
set user_id = excluded.user_id,
    name = excluded.name,
    email = excluded.email,
    role = excluded.role,
    updated_at = now();

with seed_consts as (
  select
    '22222222-2222-2222-2222-222222222222'::uuid as admin_user_id,
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid as admin_profile_id
)
insert into public.lxp_profiles (id, user_id, name, email, role)
select c.admin_profile_id, c.admin_user_id, 'Admin Demo B42', 'admin.demo+b42@seed.local', 'admin'
from seed_consts c
on conflict (id) do update
set user_id = excluded.user_id,
    name = excluded.name,
    email = excluded.email,
    role = excluded.role,
    updated_at = now();

with seed_consts as (
  select
    '22222222-2222-2222-2222-222222222222'::uuid as admin_user_id
)
insert into public.backoffice_team_members (user_id, name, email, role)
select c.admin_user_id, 'Admin Demo B42', 'admin.demo+b42@seed.local', 'admin'
from seed_consts c
on conflict (user_id) do update
set name = excluded.name,
    email = excluded.email,
    role = excluded.role,
    updated_at = now();

with seed_consts as (
  select
    'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid as course_id
)
insert into public.lxp_courses (id, name, description, status, category, periods, external_library_id)
select
  c.course_id,
  'Engenharia de Software - Demo B42',
  'Curso seed para validacao visual do LXP e apresentacao ao cliente.',
  'active',
  'graduation',
  8,
  'external-course-demo-b42'
from seed_consts c
on conflict (id) do update
set name = excluded.name,
    description = excluded.description,
    status = excluded.status,
    category = excluded.category,
    periods = excluded.periods,
    external_library_id = excluded.external_library_id,
    updated_at = now();

with seed_consts as (
  select
    'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid as course_id,
    'dddddddd-dddd-dddd-dddd-dddddddddddd'::uuid as period_id
)
insert into public.lxp_course_periods (id, course_id, number, name, status)
select c.period_id, c.course_id, 1, '1o Periodo', 'current'
from seed_consts c
on conflict (id) do update
set course_id = excluded.course_id,
    number = excluded.number,
    name = excluded.name,
    status = excluded.status,
    updated_at = now();

with seed_consts as (
  select
    'dddddddd-dddd-dddd-dddd-dddddddddddd'::uuid as period_id,
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'::uuid as discipline_id
)
insert into public.lxp_course_disciplines (id, course_period_id, name, code, workload, credits, professor, status)
select c.discipline_id, c.period_id, 'Arquitetura de Software', 'ARQ-SW-101', 80, 4, 'Profa. Demo B42', 'active'
from seed_consts c
on conflict (id) do update
set course_period_id = excluded.course_period_id,
    name = excluded.name,
    code = excluded.code,
    workload = excluded.workload,
    credits = excluded.credits,
    professor = excluded.professor,
    status = excluded.status,
    updated_at = now();

with seed_consts as (
  select
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid as student_profile_id,
    'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid as course_id
)
insert into public.lxp_enrollments (student_profile_id, course_id, status)
select c.student_profile_id, c.course_id, 'active'
from seed_consts c
on conflict do nothing;

with seed_consts as (
  select
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'::uuid as discipline_id
)
insert into public.lxp_course_library_links (course_discipline_id, library_content_type, library_content_id, library_content_name, metadata)
select c.discipline_id, 'discipline', '9001', 'Disciplina Externa Demo B42', '{"provider":"eadstock","seed":true}'::jsonb
from seed_consts c
on conflict (course_discipline_id, library_content_type, library_content_id) do update
set library_content_name = excluded.library_content_name,
    metadata = excluded.metadata,
    linked_at = now();

with seed_consts as (
  select
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid as student_profile_id,
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'::uuid as discipline_id
)
insert into public.lxp_student_discipline_progress (student_profile_id, course_discipline_id, status, grade, xp_earned, last_updated_at)
select c.student_profile_id, c.discipline_id, 'in_progress', null, 20, now()
from seed_consts c
on conflict (student_profile_id, course_discipline_id) do update
set status = excluded.status,
    grade = excluded.grade,
    xp_earned = excluded.xp_earned,
    last_updated_at = now();

with seed_consts as (
  select
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid as student_profile_id
)
insert into public.lxp_student_lesson_progress (student_profile_id, external_discipline_id, external_unit_id, status, completed_at, last_accessed_at, updated_at)
select c.student_profile_id, '9001', 'u-1', 'completed', now() - interval '2 day', now() - interval '2 day', now()
from seed_consts c
on conflict (student_profile_id, external_discipline_id, external_unit_id) do update
set status = excluded.status,
    completed_at = excluded.completed_at,
    last_accessed_at = excluded.last_accessed_at,
    updated_at = now();

with seed_consts as (
  select
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid as student_profile_id
)
insert into public.lxp_student_lesson_progress (student_profile_id, external_discipline_id, external_unit_id, status, completed_at, last_accessed_at, updated_at)
select c.student_profile_id, '9001', 'u-2', 'in_progress', null, now() - interval '1 day', now()
from seed_consts c
on conflict (student_profile_id, external_discipline_id, external_unit_id) do update
set status = excluded.status,
    completed_at = excluded.completed_at,
    last_accessed_at = excluded.last_accessed_at,
    updated_at = now();

select
  (select count(*) from public.lxp_profiles) as profiles,
  (select count(*) from public.lxp_courses) as courses,
  (select count(*) from public.lxp_course_periods) as periods,
  (select count(*) from public.lxp_course_disciplines) as disciplines,
  (select count(*) from public.lxp_course_library_links) as library_links,
  (select count(*) from public.lxp_enrollments) as enrollments,
  (select count(*) from public.lxp_student_discipline_progress) as discipline_progress,
  (select count(*) from public.lxp_student_lesson_progress) as lesson_progress;
