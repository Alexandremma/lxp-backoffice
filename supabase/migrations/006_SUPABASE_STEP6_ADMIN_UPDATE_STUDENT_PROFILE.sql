-- Admin: atualizar nome/e-mail do perfil de aluno (sem alterar user_id nem role).
-- Chamada via RPC a partir do backoffice (cliente autenticado como admin).

CREATE OR REPLACE FUNCTION public.admin_update_lxp_student_profile(
  p_profile_id uuid,
  p_name text,
  p_email text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count int;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'not_authorized' USING ERRCODE = '42501';
  END IF;

  UPDATE public.lxp_profiles
  SET
    name = COALESCE(NULLIF(TRIM(p_name), ''), name),
    email = COALESCE(NULLIF(TRIM(p_email), ''), email),
    updated_at = now()
  WHERE id = p_profile_id
    AND COALESCE(role, 'student') = 'student';

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  IF updated_count = 0 THEN
    RAISE EXCEPTION 'student_profile_not_found' USING ERRCODE = 'P0001';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_update_lxp_student_profile(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_update_lxp_student_profile(uuid, text, text) TO authenticated;

COMMENT ON FUNCTION public.admin_update_lxp_student_profile(uuid, text, text) IS
  'Atualiza nome e e-mail em lxp_profiles para perfil de aluno. Não altera auth.users; sincronização de login é decisão de produto.';
