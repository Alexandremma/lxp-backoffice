-- Step 25: template default flag + validação pública por código (sem login)
-- Depende de: STEP 14 (certificados), STEP 24 (função template default — recriada aqui com is_default)

ALTER TABLE public.lxp_certificate_templates
  ADD COLUMN IF NOT EXISTS is_default boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.lxp_certificate_templates.is_default IS
  'Quando true, usado na emissão automática (apenas um recomendado por instituição).';

CREATE OR REPLACE FUNCTION public.lxp_get_default_certificate_template_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id
  FROM public.lxp_certificate_templates
  WHERE is_active = true
  ORDER BY is_default DESC NULLS LAST, created_at ASC
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.lxp_get_default_certificate_template_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lxp_get_default_certificate_template_id() TO authenticated;

-- Validação pública: retorna apenas dados não sensíveis para exibição
CREATE OR REPLACE FUNCTION public.lxp_validate_certificate_public(p_validation_code text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code text := upper(trim(coalesce(p_validation_code, '')));
  v_row record;
BEGIN
  IF v_code = '' THEN
    RETURN jsonb_build_object('valid', false, 'message', 'Informe o código de validação.');
  END IF;

  SELECT
    i.validation_code,
    i.issued_at,
    p.name AS student_name,
    coalesce(d.name, d.code, 'Disciplina') AS discipline_name,
    d.workload AS workload_hours,
    d.professor AS instructor_name
  INTO v_row
  FROM public.lxp_certificate_issues i
  JOIN public.lxp_profiles p ON p.id = i.student_profile_id
  JOIN public.lxp_course_disciplines d ON d.id = i.course_discipline_id
  WHERE upper(trim(i.validation_code)) = v_code
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'message', 'Código não encontrado ou inválido.');
  END IF;

  RETURN jsonb_build_object(
    'valid', true,
    'validation_code', v_row.validation_code,
    'student_name', v_row.student_name,
    'discipline_name', v_row.discipline_name,
    'issued_at', v_row.issued_at,
    'workload_hours', v_row.workload_hours,
    'instructor_name', v_row.instructor_name
  );
END;
$$;

REVOKE ALL ON FUNCTION public.lxp_validate_certificate_public(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lxp_validate_certificate_public(text) TO anon;
GRANT EXECUTE ON FUNCTION public.lxp_validate_certificate_public(text) TO authenticated;

-- Aluno pode ler assinaturas do template vinculado à própria emissão (preview/PDF)
DROP POLICY IF EXISTS lxp_certificate_signatures_student_select_own_issue ON public.lxp_certificate_signatures;
CREATE POLICY lxp_certificate_signatures_student_select_own_issue
  ON public.lxp_certificate_signatures
  FOR SELECT
  TO authenticated
  USING (
    public.is_student()
    AND EXISTS (
      SELECT 1
      FROM public.lxp_certificate_issues i
      JOIN public.lxp_profiles p ON p.id = i.student_profile_id
      WHERE i.template_id = lxp_certificate_signatures.template_id
        AND p.user_id = auth.uid()
    )
  );

-- Template institucional padrão (homolog) — só se ainda não existir default
INSERT INTO public.lxp_certificate_templates (name, description, is_active, is_default)
SELECT
  'Certificado de Conclusão B42',
  'Template padrão para emissão automática por disciplina concluída.',
  true,
  true
WHERE NOT EXISTS (SELECT 1 FROM public.lxp_certificate_templates WHERE is_default = true);

UPDATE public.lxp_certificate_issues i
SET template_id = public.lxp_get_default_certificate_template_id()
WHERE i.template_id IS NULL
  AND public.lxp_get_default_certificate_template_id() IS NOT NULL;

-- Storage bucket para imagens de assinatura
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'certificate-signatures',
  'certificate-signatures',
  true,
  5242880,
  ARRAY['image/png', 'image/jpeg', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE
SET public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/webp']::text[];

DROP POLICY IF EXISTS certificate_signatures_public_read ON storage.objects;
CREATE POLICY certificate_signatures_public_read
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'certificate-signatures');

DROP POLICY IF EXISTS certificate_signatures_admin_insert ON storage.objects;
CREATE POLICY certificate_signatures_admin_insert
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'certificate-signatures' AND public.is_admin());

DROP POLICY IF EXISTS certificate_signatures_admin_update ON storage.objects;
CREATE POLICY certificate_signatures_admin_update
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'certificate-signatures' AND public.is_admin())
  WITH CHECK (bucket_id = 'certificate-signatures' AND public.is_admin());

DROP POLICY IF EXISTS certificate_signatures_admin_delete ON storage.objects;
CREATE POLICY certificate_signatures_admin_delete
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'certificate-signatures' AND public.is_admin());

-- Realtime: regras de XP (Fase 1)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'lxp_gamification_xp_rules'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.lxp_gamification_xp_rules;
  END IF;
END $$;
