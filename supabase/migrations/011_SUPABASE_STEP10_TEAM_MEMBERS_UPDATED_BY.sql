-- STEP 10: Auditoria mínima em backoffice_team_members
-- Objetivo: registrar o último usuário responsável por alterações no cadastro de membros.

alter table public.backoffice_team_members
  add column if not exists updated_by uuid;

alter table public.backoffice_team_members
  drop constraint if exists backoffice_team_members_updated_by_fkey;

alter table public.backoffice_team_members
  add constraint backoffice_team_members_updated_by_fkey
  foreign key (updated_by) references auth.users(id);

create index if not exists backoffice_team_members_updated_by_idx
  on public.backoffice_team_members(updated_by);
