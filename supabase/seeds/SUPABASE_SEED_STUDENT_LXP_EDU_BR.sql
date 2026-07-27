-- Seed / alinhamento para o usuário student@lxp.edu.br (perfil + matrícula já existentes no projeto)
-- Objetivo: vínculo biblioteca + progresso para visualizar "Minhas Trilhas" e trilha de aulas.
--
-- IDs fixos usados aqui vêm do estado atual do projeto (MCP 2026-04-16):
-- - lxp_profiles.id (student@lxp.edu.br): c32ab8a4-640e-4b5f-b831-abd7384e93b5
-- - Disciplinas do curso "Administração de Empresas":
--     77dfb96b-f027-48de-881f-8046892008ef  Introdução a Administração
--     91ead830-e39f-48cc-94ac-94571c7a4de2  Administração Avançada
-- - ID externo de biblioteca (Eadstock): 9001 (mesmo usado no demo)

update public.lxp_profiles
set name = 'Aluno LXP', updated_at = now()
where email = 'student@lxp.edu.br';

insert into public.lxp_course_library_links (course_discipline_id, library_content_type, library_content_id, library_content_name, metadata)
values
  ('77dfb96b-f027-48de-881f-8046892008ef', 'discipline', '9001', 'Disciplina vinculada (demo)', '{"seed":"student_lxp"}'::jsonb),
  ('91ead830-e39f-48cc-94ac-94571c7a4de2', 'discipline', '9001', 'Disciplina vinculada (demo)', '{"seed":"student_lxp"}'::jsonb)
on conflict (course_discipline_id, library_content_type, library_content_id) do update set
  library_content_name = excluded.library_content_name,
  metadata = excluded.metadata,
  linked_at = now();

insert into public.lxp_student_discipline_progress (student_profile_id, course_discipline_id, status, xp_earned, last_updated_at)
values ('c32ab8a4-640e-4b5f-b831-abd7384e93b5', '77dfb96b-f027-48de-881f-8046892008ef', 'in_progress', 15, now())
on conflict (student_profile_id, course_discipline_id) do update set
  status = excluded.status,
  xp_earned = excluded.xp_earned,
  last_updated_at = now();

insert into public.lxp_student_lesson_progress (student_profile_id, external_discipline_id, external_unit_id, status, completed_at, last_accessed_at, updated_at)
values
  ('c32ab8a4-640e-4b5f-b831-abd7384e93b5', '9001', 'u-1', 'completed', now() - interval '1 day', now() - interval '1 day', now()),
  ('c32ab8a4-640e-4b5f-b831-abd7384e93b5', '9001', 'u-2', 'in_progress', null, now(), now())
on conflict (student_profile_id, external_discipline_id, external_unit_id) do update set
  status = excluded.status,
  completed_at = excluded.completed_at,
  last_accessed_at = excluded.last_accessed_at,
  updated_at = now();
