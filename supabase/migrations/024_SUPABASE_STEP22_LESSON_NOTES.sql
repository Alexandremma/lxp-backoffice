-- STEP 22 — Anotações privadas do aluno por aula (somente o autor vê as próprias notas)

CREATE TABLE IF NOT EXISTS public.lxp_lesson_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_profile_id uuid NOT NULL REFERENCES public.lxp_profiles(id) ON DELETE CASCADE,
  external_discipline_id text NOT NULL,
  external_unit_id text NOT NULL,
  body text NOT NULL CHECK (char_length(trim(body)) >= 1 AND char_length(body) <= 5000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lxp_lesson_notes_lesson_idx
  ON public.lxp_lesson_notes (external_discipline_id, external_unit_id);

CREATE INDEX IF NOT EXISTS lxp_lesson_notes_student_lesson_idx
  ON public.lxp_lesson_notes (student_profile_id, external_discipline_id, external_unit_id);

ALTER TABLE public.lxp_lesson_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS lxp_lesson_notes_admin ON public.lxp_lesson_notes;
CREATE POLICY lxp_lesson_notes_admin ON public.lxp_lesson_notes
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS lxp_lesson_notes_student_select ON public.lxp_lesson_notes;
CREATE POLICY lxp_lesson_notes_student_select ON public.lxp_lesson_notes
  FOR SELECT TO authenticated
  USING (
    public.is_student()
    AND EXISTS (
      SELECT 1 FROM public.lxp_profiles p
      WHERE p.id = lxp_lesson_notes.student_profile_id AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS lxp_lesson_notes_student_insert ON public.lxp_lesson_notes;
CREATE POLICY lxp_lesson_notes_student_insert ON public.lxp_lesson_notes
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_student()
    AND EXISTS (
      SELECT 1 FROM public.lxp_profiles p
      WHERE p.id = lxp_lesson_notes.student_profile_id AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS lxp_lesson_notes_student_update ON public.lxp_lesson_notes;
CREATE POLICY lxp_lesson_notes_student_update ON public.lxp_lesson_notes
  FOR UPDATE TO authenticated
  USING (
    public.is_student()
    AND EXISTS (
      SELECT 1 FROM public.lxp_profiles p
      WHERE p.id = lxp_lesson_notes.student_profile_id AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_student()
    AND EXISTS (
      SELECT 1 FROM public.lxp_profiles p
      WHERE p.id = lxp_lesson_notes.student_profile_id AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS lxp_lesson_notes_student_delete ON public.lxp_lesson_notes;
CREATE POLICY lxp_lesson_notes_student_delete ON public.lxp_lesson_notes
  FOR DELETE TO authenticated
  USING (
    public.is_student()
    AND EXISTS (
      SELECT 1 FROM public.lxp_profiles p
      WHERE p.id = lxp_lesson_notes.student_profile_id AND p.user_id = auth.uid()
    )
  );
