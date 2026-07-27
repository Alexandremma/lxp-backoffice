-- Extende o perfil de aluno com telefone e data de nascimento
-- e atualiza a RPC admin_update_lxp_student_profile para persistir os novos campos.

ALTER TABLE public.lxp_profiles
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS birth_date date;

CREATE OR REPLACE FUNCTION public.admin_update_lxp_student_profile(
  p_profile_id uuid,
  p_name text,
  p_email text,
  p_phone text DEFAULT NULL,
  p_birth_date date DEFAULT NULL
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
    phone = CASE
      WHEN p_phone IS NULL THEN phone
      WHEN NULLIF(TRIM(p_phone), '') IS NULL THEN NULL
      ELSE TRIM(p_phone)
    END,
    birth_date = COALESCE(p_birth_date, birth_date),
    updated_at = now()
  WHERE id = p_profile_id
    AND COALESCE(role, 'student') = 'student';

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  IF updated_count = 0 THEN
    RAISE EXCEPTION 'student_profile_not_found' USING ERRCODE = 'P0001';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_update_lxp_student_profile(uuid, text, text, text, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_update_lxp_student_profile(uuid, text, text, text, date) TO authenticated;

COMMENT ON FUNCTION public.admin_update_lxp_student_profile(uuid, text, text, text, date) IS
  'Atualiza nome/e-mail/telefone/data de nascimento em lxp_profiles para perfil de aluno. Não altera auth.users.';
