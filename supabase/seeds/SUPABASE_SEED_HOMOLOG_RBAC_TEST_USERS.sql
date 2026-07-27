-- Homolog: contas de teste RBAC (coordenador + professor)
-- Senha: B42@123456 (mesmo padrão admin@lxp.edu.br / student@lxp.edu.br)
--
-- coord@lxp.edu.br  → coordinator / coordenacao_pedagogica
-- prof@lxp.edu.br   → professor   / ensino_atendimento
--
-- lxp_profiles.role = 'admin' (legado; convite Edge); acesso e RBAC = backoffice_team_members.role

-- ========== Coordenador ==========
with c as (
  select
    '33333333-3333-3333-3333-333333333333'::uuid as user_id,
    'f3333333-3333-3333-3333-333333333333'::uuid as profile_id,
    'coord@lxp.edu.br'::text as email,
    'Coordenador Teste LXP'::text as name,
    'coordinator'::text as team_role,
    'coordenacao_pedagogica'::text as department
)
insert into auth.users (
  instance_id,
  id, aud, role, email, encrypted_password, email_confirmed_at,
  confirmation_token, recovery_token, email_change_token_new,
  email_change_token_current, reauthentication_token,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at, is_sso_user, is_anonymous
)
select
  '00000000-0000-0000-0000-000000000000'::uuid,
  c.user_id,
  'authenticated',
  'authenticated',
  c.email,
  crypt('B42@123456', gen_salt('bf')),
  now(),
  '', '', '',
  '', '',
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('name', c.name, 'role', c.team_role),
  now(),
  now(),
  false,
  false
from c
where not exists (select 1 from auth.users u where u.id = c.user_id or u.email = c.email);

with c as (
  select
    '33333333-3333-3333-3333-333333333333'::uuid as user_id,
    'coord@lxp.edu.br'::text as email
)
insert into auth.identities (
  id, user_id, provider_id, provider, identity_data, created_at, updated_at
)
select
  gen_random_uuid(),
  c.user_id,
  c.user_id::text,
  'email',
  jsonb_build_object(
    'sub', c.user_id::text,
    'email', c.email,
    'email_verified', true,
    'phone_verified', false
  ),
  now(),
  now()
from c
where not exists (
  select 1 from auth.identities i
  where i.user_id = c.user_id and i.provider = 'email'
);

with c as (
  select
    '33333333-3333-3333-3333-333333333333'::uuid as user_id,
    'f3333333-3333-3333-3333-333333333333'::uuid as profile_id,
    'coord@lxp.edu.br'::text as email,
    'Coordenador Teste LXP'::text as name
)
insert into public.lxp_profiles (id, user_id, name, email, role)
select c.profile_id, c.user_id, c.name, c.email, 'admin'
from c
on conflict (user_id) do update
set name = excluded.name,
    email = excluded.email,
    role = excluded.role,
    updated_at = now();

with c as (
  select
    '33333333-3333-3333-3333-333333333333'::uuid as user_id,
    'coord@lxp.edu.br'::text as email,
    'Coordenador Teste LXP'::text as name,
    'coordinator'::text as team_role,
    'coordenacao_pedagogica'::text as department,
    'cccf3950-13a7-4595-874a-5c148bc8677b'::uuid as updated_by
)
insert into public.backoffice_team_members (user_id, name, email, role, department, updated_by)
select c.user_id, c.name, c.email, c.team_role, c.department, c.updated_by
from c
on conflict (user_id) do update
set name = excluded.name,
    email = excluded.email,
    role = excluded.role,
    department = excluded.department,
    updated_at = now();

-- ========== Professor ==========
with c as (
  select
    '44444444-4444-4444-4444-444444444444'::uuid as user_id,
    'f4444444-4444-4444-4444-444444444444'::uuid as profile_id,
    'prof@lxp.edu.br'::text as email,
    'Professor Teste LXP'::text as name,
    'professor'::text as team_role,
    'ensino_atendimento'::text as department
)
insert into auth.users (
  instance_id,
  id, aud, role, email, encrypted_password, email_confirmed_at,
  confirmation_token, recovery_token, email_change_token_new,
  email_change_token_current, reauthentication_token,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at, is_sso_user, is_anonymous
)
select
  '00000000-0000-0000-0000-000000000000'::uuid,
  c.user_id,
  'authenticated',
  'authenticated',
  c.email,
  crypt('B42@123456', gen_salt('bf')),
  now(),
  '', '', '',
  '', '',
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('name', c.name, 'role', c.team_role),
  now(),
  now(),
  false,
  false
from c
where not exists (select 1 from auth.users u where u.id = c.user_id or u.email = c.email);

with c as (
  select
    '44444444-4444-4444-4444-444444444444'::uuid as user_id,
    'prof@lxp.edu.br'::text as email
)
insert into auth.identities (
  id, user_id, provider_id, provider, identity_data, created_at, updated_at
)
select
  gen_random_uuid(),
  c.user_id,
  c.user_id::text,
  'email',
  jsonb_build_object(
    'sub', c.user_id::text,
    'email', c.email,
    'email_verified', true,
    'phone_verified', false
  ),
  now(),
  now()
from c
where not exists (
  select 1 from auth.identities i
  where i.user_id = c.user_id and i.provider = 'email'
);

with c as (
  select
    '44444444-4444-4444-4444-444444444444'::uuid as user_id,
    'f4444444-4444-4444-4444-444444444444'::uuid as profile_id,
    'prof@lxp.edu.br'::text as email,
    'Professor Teste LXP'::text as name
)
insert into public.lxp_profiles (id, user_id, name, email, role)
select c.profile_id, c.user_id, c.name, c.email, 'admin'
from c
on conflict (user_id) do update
set name = excluded.name,
    email = excluded.email,
    role = excluded.role,
    updated_at = now();

with c as (
  select
    '44444444-4444-4444-4444-444444444444'::uuid as user_id,
    'prof@lxp.edu.br'::text as email,
    'Professor Teste LXP'::text as name,
    'professor'::text as team_role,
    'ensino_atendimento'::text as department,
    'cccf3950-13a7-4595-874a-5c148bc8677b'::uuid as updated_by
)
insert into public.backoffice_team_members (user_id, name, email, role, department, updated_by)
select c.user_id, c.name, c.email, c.team_role, c.department, c.updated_by
from c
on conflict (user_id) do update
set name = excluded.name,
    email = excluded.email,
    role = excluded.role,
    department = excluded.department,
    updated_at = now();

-- GoTrue exige strings vazias (não NULL) em tokens ao consultar login por senha
update auth.users set
  confirmation_token = coalesce(confirmation_token, ''),
  recovery_token = coalesce(recovery_token, ''),
  email_change_token_new = coalesce(email_change_token_new, '')
where email in ('coord@lxp.edu.br', 'prof@lxp.edu.br');

select email, role, department
from public.backoffice_team_members
where email in ('coord@lxp.edu.br', 'prof@lxp.edu.br')
order by email;
