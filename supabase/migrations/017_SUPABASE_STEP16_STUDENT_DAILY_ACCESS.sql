-- STEP 16 — Acesso diário do aluno (streak por login na plataforma)
-- Uma linha por (aluno, dia civil em America/Sao_Paulo registrado pelo app).

CREATE TABLE IF NOT EXISTS public.lxp_student_daily_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_profile_id uuid NOT NULL REFERENCES public.lxp_profiles(id) ON DELETE CASCADE,
  access_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lxp_student_daily_access_student_date_uk UNIQUE (student_profile_id, access_date)
);

CREATE INDEX IF NOT EXISTS lxp_student_daily_access_student_idx
  ON public.lxp_student_daily_access (student_profile_id);

CREATE INDEX IF NOT EXISTS lxp_student_daily_access_date_idx
  ON public.lxp_student_daily_access (access_date DESC);

ALTER TABLE public.lxp_student_daily_access ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS lxp_daily_access_admin ON public.lxp_student_daily_access;
CREATE POLICY lxp_daily_access_admin ON public.lxp_student_daily_access
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS lxp_daily_access_student_select ON public.lxp_student_daily_access;
CREATE POLICY lxp_daily_access_student_select ON public.lxp_student_daily_access
  FOR SELECT TO authenticated
  USING (
    public.is_student()
    AND EXISTS (
      SELECT 1 FROM public.lxp_profiles p
      WHERE p.id = lxp_student_daily_access.student_profile_id AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS lxp_daily_access_student_insert ON public.lxp_student_daily_access;
CREATE POLICY lxp_daily_access_student_insert ON public.lxp_student_daily_access
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_student()
    AND EXISTS (
      SELECT 1 FROM public.lxp_profiles p
      WHERE p.id = lxp_student_daily_access.student_profile_id AND p.user_id = auth.uid()
    )
  );
