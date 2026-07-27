-- Permite limpar telefone e data de nascimento ao editar perfil do aluno (flags de atualização explícitas).

CREATE OR REPLACE FUNCTION public.admin_update_lxp_student_profile(
  p_profile_id uuid,
  p_name text,
  p_email text,
  p_phone text DEFAULT NULL,
  p_birth_date date DEFAULT NULL,
  p_touch_phone boolean DEFAULT false,
  p_touch_birth_date boolean DEFAULT false
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
      WHEN p_touch_phone THEN NULLIF(TRIM(COALESCE(p_phone, '')), '')
      ELSE phone
    END,
    birth_date = CASE
      WHEN p_touch_birth_date THEN p_birth_date
      ELSE birth_date
    END,
    updated_at = now()
  WHERE id = p_profile_id
    AND COALESCE(role, 'student') = 'student';

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  IF updated_count = 0 THEN
    RAISE EXCEPTION 'student_profile_not_found' USING ERRCODE = 'P0001';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_update_lxp_student_profile(uuid, text, text, text, date, boolean, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_update_lxp_student_profile(uuid, text, text, text, date, boolean, boolean) TO authenticated;

COMMENT ON FUNCTION public.admin_update_lxp_student_profile(uuid, text, text, text, date, boolean, boolean) IS
  'Atualiza perfil de aluno. p_touch_phone/p_touch_birth_date indicam campos enviados na edição (permite limpar com vazio/null).';
