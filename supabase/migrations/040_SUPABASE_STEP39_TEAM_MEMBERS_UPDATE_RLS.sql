-- STEP 39: RLS granular em backoffice_team_members
-- Substitui policy FOR ALL (qualquer membro podia UPDATE/DELETE qualquer linha).
-- SELECT: todos os membros da equipe (lista /admin/equipe).
-- UPDATE: própria linha (perfil self-service) OU admin/coordenador (gestão de equipe).
-- DELETE: somente role admin (alinha equipe.excluir no app).
-- INSERT: apenas via Edge invite-team-member (service role).

CREATE OR REPLACE FUNCTION public.backoffice_team_can_manage()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.backoffice_team_members AS actor
    WHERE actor.user_id = auth.uid()
      AND actor.role IN ('admin', 'coordinator')
  );
$$;

CREATE OR REPLACE FUNCTION public.backoffice_team_is_admin_role()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.backoffice_team_members AS actor
    WHERE actor.user_id = auth.uid()
      AND actor.role = 'admin'
  );
$$;

GRANT EXECUTE ON FUNCTION public.backoffice_team_can_manage() TO authenticated;
GRANT EXECUTE ON FUNCTION public.backoffice_team_is_admin_role() TO authenticated;

DROP POLICY IF EXISTS backoffice_team_members_admin_all ON public.backoffice_team_members;

CREATE POLICY backoffice_team_members_team_read
ON public.backoffice_team_members
FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY backoffice_team_members_team_update
ON public.backoffice_team_members
FOR UPDATE
TO authenticated
USING (
  public.is_admin()
  AND (
    user_id = auth.uid()
    OR public.backoffice_team_can_manage()
  )
)
WITH CHECK (
  public.is_admin()
  AND (
    user_id = auth.uid()
    OR public.backoffice_team_can_manage()
  )
);

CREATE POLICY backoffice_team_members_team_delete
ON public.backoffice_team_members
FOR DELETE
TO authenticated
USING (public.backoffice_team_is_admin_role());
