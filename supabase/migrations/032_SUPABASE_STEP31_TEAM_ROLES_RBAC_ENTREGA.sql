-- STEP 31: RBAC entrega — 3 funções na equipe + backfill de papéis legados

UPDATE public.backoffice_team_members
SET role = 'coordinator'
WHERE role = 'secretary';

UPDATE public.backoffice_team_members
SET role = 'professor'
WHERE role IN ('tutor', 'commercial');

UPDATE public.backoffice_team_members
SET role = 'admin'
WHERE role = 'financial';

ALTER TABLE public.backoffice_team_members
  DROP CONSTRAINT IF EXISTS backoffice_team_members_role_check;

ALTER TABLE public.backoffice_team_members
  ADD CONSTRAINT backoffice_team_members_role_check
  CHECK (role IN ('admin', 'coordinator', 'professor'));

COMMENT ON COLUMN public.backoffice_team_members.role IS
  'admin | coordinator | professor (entrega final RBAC)';
