-- Backoffice team: permitir visao/gestao global da equipe por admin.
-- Necessario para /admin/equipe listar todos os membros no painel.

DROP POLICY IF EXISTS backoffice_team_members_admin_read_own ON public.backoffice_team_members;
DROP POLICY IF EXISTS backoffice_team_members_admin_update_own ON public.backoffice_team_members;
DROP POLICY IF EXISTS backoffice_team_members_admin_all ON public.backoffice_team_members;

CREATE POLICY backoffice_team_members_admin_all
ON public.backoffice_team_members
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());
