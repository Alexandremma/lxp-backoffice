-- =====================================================================
-- STEP 26: certificate template signature library + immutable snapshot
-- =====================================================================
-- Decisões da Fase 2.1 (PLANO_FASE_2_1_REFINAMENTO_CERTIFICADO.md):
--   D1: assinatura vira biblioteca + N:M (lxp_certificate_template_signatures)
--   D2: identidade institucional por template (institution_name/logo)
--   D3: sem cover image (descartado)
--   D5/D7: snapshot imutável (jsonb) gravado na primeira emissão
-- =====================================================================

-- -------------------------------------------------------------
-- 1. Templates ganham identidade institucional
-- -------------------------------------------------------------
ALTER TABLE public.lxp_certificate_templates
  ADD COLUMN IF NOT EXISTS institution_name text NOT NULL DEFAULT 'B42 Edtech',
  ADD COLUMN IF NOT EXISTS institution_logo_path text;

-- -------------------------------------------------------------
-- 2. Assinaturas viram biblioteca (template_id legado)
-- -------------------------------------------------------------
ALTER TABLE public.lxp_certificate_signatures
  ALTER COLUMN template_id DROP NOT NULL;

-- -------------------------------------------------------------
-- 3. Link N:M entre template e assinatura (com slot)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.lxp_certificate_template_signatures (
  template_id  uuid NOT NULL REFERENCES public.lxp_certificate_templates(id) ON DELETE CASCADE,
  signature_id uuid NOT NULL REFERENCES public.lxp_certificate_signatures(id) ON DELETE CASCADE,
  slot         smallint NOT NULL CHECK (slot BETWEEN 1 AND 4),
  sort_order   smallint NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (template_id, signature_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS lxp_certificate_template_signatures_slot_uq
  ON public.lxp_certificate_template_signatures (template_id, slot);

CREATE INDEX IF NOT EXISTS lxp_certificate_template_signatures_signature_idx
  ON public.lxp_certificate_template_signatures (signature_id);

-- Backfill: migra vinculo 1:N existente para a nova tabela
INSERT INTO public.lxp_certificate_template_signatures (template_id, signature_id, slot, sort_order)
SELECT
  s.template_id,
  s.id,
  LEAST(
    ROW_NUMBER() OVER (PARTITION BY s.template_id ORDER BY s.sort_order, s.created_at)::smallint,
    4::smallint
  ),
  s.sort_order::smallint
FROM public.lxp_certificate_signatures s
WHERE s.template_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- -------------------------------------------------------------
-- 4. RLS da nova tabela: admin full, aluno le se for issue dele
-- -------------------------------------------------------------
ALTER TABLE public.lxp_certificate_template_signatures ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS lxp_cert_tmpl_sigs_admin_all ON public.lxp_certificate_template_signatures;
CREATE POLICY lxp_cert_tmpl_sigs_admin_all
  ON public.lxp_certificate_template_signatures
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS lxp_cert_tmpl_sigs_student_select ON public.lxp_certificate_template_signatures;
CREATE POLICY lxp_cert_tmpl_sigs_student_select
  ON public.lxp_certificate_template_signatures
  FOR SELECT
  TO authenticated
  USING (
    public.is_student()
    AND EXISTS (
      SELECT 1
      FROM public.lxp_certificate_issues i
      JOIN public.lxp_profiles p ON p.id = i.student_profile_id
      WHERE i.template_id = lxp_certificate_template_signatures.template_id
        AND p.user_id = auth.uid()
    )
  );

-- -------------------------------------------------------------
-- 5. RLS de assinaturas: aluno le via link table (cobre o caso novo
--    onde signature.template_id pode ser NULL)
-- -------------------------------------------------------------
DROP POLICY IF EXISTS lxp_certificate_signatures_student_select_own_issue
  ON public.lxp_certificate_signatures;

CREATE POLICY lxp_certificate_signatures_student_select_own_issue
  ON public.lxp_certificate_signatures
  FOR SELECT
  TO authenticated
  USING (
    public.is_student()
    AND EXISTS (
      SELECT 1
      FROM public.lxp_certificate_template_signatures ts
      JOIN public.lxp_certificate_issues i ON i.template_id = ts.template_id
      JOIN public.lxp_profiles p ON p.id = i.student_profile_id
      WHERE ts.signature_id = lxp_certificate_signatures.id
        AND p.user_id = auth.uid()
    )
  );

-- -------------------------------------------------------------
-- 6. Snapshot imutavel + completed_at na emissao
-- -------------------------------------------------------------
ALTER TABLE public.lxp_certificate_issues
  ADD COLUMN IF NOT EXISTS snapshot jsonb,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;

CREATE INDEX IF NOT EXISTS lxp_certificate_issues_snapshot_gin
  ON public.lxp_certificate_issues USING gin (snapshot);

-- Backfill: para emissoes legadas, popular completed_at a partir do progress
UPDATE public.lxp_certificate_issues i
SET completed_at = COALESCE(
  (SELECT dp.completed_at
   FROM public.lxp_student_discipline_progress dp
   WHERE dp.student_profile_id = i.student_profile_id
     AND dp.course_discipline_id = i.course_discipline_id
   LIMIT 1),
  i.issued_at
)
WHERE i.completed_at IS NULL;

-- -------------------------------------------------------------
-- 7. RPC de validacao publica: prioriza snapshot, fallback live
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.lxp_validate_certificate_public(p_validation_code text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_code text := upper(trim(coalesce(p_validation_code, '')));
  v_issue record;
  v_payload jsonb;
BEGIN
  IF v_code = '' THEN
    RETURN jsonb_build_object('valid', false, 'message', 'Informe o código de validação.');
  END IF;

  SELECT i.*
  INTO v_issue
  FROM public.lxp_certificate_issues i
  WHERE upper(trim(i.validation_code)) = v_code
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'message', 'Código não encontrado ou inválido.');
  END IF;

  -- Caminho preferencial: snapshot ja congelado na emissao
  IF v_issue.snapshot IS NOT NULL THEN
    RETURN v_issue.snapshot
      || jsonb_build_object(
        'valid', true,
        'validation_code', v_issue.validation_code,
        'issued_at', v_issue.issued_at
      );
  END IF;

  -- Fallback live (emissoes pre-snapshot)
  SELECT jsonb_build_object(
    'valid', true,
    'validation_code', v_issue.validation_code,
    'issued_at', v_issue.issued_at,
    'student_name', coalesce(p.name, 'Aluno(a)'),
    'discipline_name', coalesce(d.name, d.code, 'Disciplina'),
    'workload_hours', d.workload,
    'instructor_name', d.professor
  )
  INTO v_payload
  FROM public.lxp_profiles p
  JOIN public.lxp_course_disciplines d ON d.id = v_issue.course_discipline_id
  WHERE p.id = v_issue.student_profile_id
  LIMIT 1;

  RETURN coalesce(
    v_payload,
    jsonb_build_object('valid', false, 'message', 'Dados não disponíveis.')
  );
END;
$function$;

GRANT EXECUTE ON FUNCTION public.lxp_validate_certificate_public(text) TO anon;
GRANT EXECUTE ON FUNCTION public.lxp_validate_certificate_public(text) TO authenticated;

-- -------------------------------------------------------------
-- 8. Fim
-- -------------------------------------------------------------
COMMENT ON COLUMN public.lxp_certificate_issues.snapshot IS
  'Dados imutáveis da emissão (Fase 2.1). Quando NULL = emissão legada e o app reidrata on-the-fly.';
COMMENT ON COLUMN public.lxp_certificate_issues.completed_at IS
  'Data de conclusão da disciplina no momento da emissão.';
COMMENT ON TABLE public.lxp_certificate_template_signatures IS
  'Liga assinaturas (biblioteca) a templates por slot (1..4).';
