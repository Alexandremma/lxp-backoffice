-- STEP 14 ù Data de conclusÒo da disciplina + n·cleo de certificados (templates, assinaturas, emiss§es)
-- Idempotente. Aplicar no Supabase (Dashboard SQL ou MCP apply_migration).
-- Depende de: lxp_profiles, lxp_course_disciplines, is_admin() nas policies (Step 4).

-- ---------- 1) Disciplina: completed_at ----------
ALTER TABLE public.lxp_student_discipline_progress
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;

COMMENT ON COLUMN public.lxp_student_discipline_progress.completed_at IS
  'Momento em que a disciplina passou a approved (primeira vez); preenchido por trigger.';

UPDATE public.lxp_student_discipline_progress
SET completed_at = last_updated_at
WHERE status = 'approved'
  AND completed_at IS NULL;

CREATE OR REPLACE FUNCTION public.lxp_set_discipline_completed_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'approved' AND NEW.completed_at IS NULL THEN
    IF TG_OP = 'INSERT' THEN
      NEW.completed_at := now();
    ELSIF OLD.status IS DISTINCT FROM 'approved' THEN
      NEW.completed_at := now();
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS lxp_student_discipline_progress_set_completed_at ON public.lxp_student_discipline_progress;
CREATE TRIGGER lxp_student_discipline_progress_set_completed_at
  BEFORE INSERT OR UPDATE ON public.lxp_student_discipline_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.lxp_set_discipline_completed_at();

-- ---------- 2) Templates de certificado ----------
CREATE TABLE IF NOT EXISTS public.lxp_certificate_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lxp_certificate_templates_active_idx
  ON public.lxp_certificate_templates (is_active)
  WHERE is_active = true;

-- ---------- 3) Assinaturas (vinculadas a template; imagem em Storage no futuro) ----------
CREATE TABLE IF NOT EXISTS public.lxp_certificate_signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.lxp_certificate_templates(id) ON DELETE CASCADE,
  signer_name text NOT NULL,
  signer_title text NOT NULL,
  image_path text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lxp_certificate_signatures_template_idx
  ON public.lxp_certificate_signatures (template_id);

-- ---------- 4) Emiss§es (c¾digo ·nico de validaþÒo) ----------
CREATE TABLE IF NOT EXISTS public.lxp_certificate_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_profile_id uuid NOT NULL REFERENCES public.lxp_profiles(id) ON DELETE CASCADE,
  course_discipline_id uuid NOT NULL REFERENCES public.lxp_course_disciplines(id) ON DELETE CASCADE,
  template_id uuid REFERENCES public.lxp_certificate_templates(id) ON DELETE SET NULL,
  validation_code text NOT NULL,
  issued_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lxp_certificate_issues_student_discipline_uk UNIQUE (student_profile_id, course_discipline_id),
  CONSTRAINT lxp_certificate_issues_validation_code_uk UNIQUE (validation_code)
);

CREATE INDEX IF NOT EXISTS lxp_certificate_issues_student_idx
  ON public.lxp_certificate_issues (student_profile_id);

-- ---------- 5) RLS ----------
ALTER TABLE public.lxp_certificate_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lxp_certificate_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lxp_certificate_issues ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS lxp_certificate_templates_admin_all ON public.lxp_certificate_templates;
CREATE POLICY lxp_certificate_templates_admin_all
  ON public.lxp_certificate_templates
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS lxp_certificate_signatures_admin_all ON public.lxp_certificate_signatures;
CREATE POLICY lxp_certificate_signatures_admin_all
  ON public.lxp_certificate_signatures
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS lxp_certificate_issues_admin_all ON public.lxp_certificate_issues;
CREATE POLICY lxp_certificate_issues_admin_all
  ON public.lxp_certificate_issues
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS lxp_certificate_issues_student_select_own ON public.lxp_certificate_issues;
CREATE POLICY lxp_certificate_issues_student_select_own
  ON public.lxp_certificate_issues
  FOR SELECT
  TO authenticated
  USING (
    public.is_student()
    AND EXISTS (
      SELECT 1 FROM public.lxp_profiles p
      WHERE p.id = lxp_certificate_issues.student_profile_id
        AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS lxp_certificate_issues_student_insert_own ON public.lxp_certificate_issues;
CREATE POLICY lxp_certificate_issues_student_insert_own
  ON public.lxp_certificate_issues
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_student()
    AND EXISTS (
      SELECT 1 FROM public.lxp_profiles p
      WHERE p.id = lxp_certificate_issues.student_profile_id
        AND p.user_id = auth.uid()
    )
  );

-- Aluno nÒo altera emissÒo depois de criada (sem policy UPDATE para student)

