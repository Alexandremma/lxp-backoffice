-- STEP 13: Departamento opcional em backoffice_team_members (Equipe)

alter table public.backoffice_team_members
  add column if not exists department text null;

comment on column public.backoffice_team_members.department is
  'Departamento ou área do membro (opcional).';
