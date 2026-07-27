-- STEP 5 — Progresso por aula + constraint discipline em library links
-- Aplicar via Supabase (migration) ou SQL editor.

-- 1) Permitir library_content_type = 'discipline' nos vínculos
ALTER TABLE public.lxp_course_library_links
  DROP CONSTRAINT IF EXISTS lxp_course_library_links_type_check;

ALTER TABLE public.lxp_course_library_links
  ADD CONSTRAINT lxp_course_library_links_type_check
  CHECK (library_content_type IN ('trail', 'module', 'discipline'));

-- 2) Progresso por aula (unidade externa da API)
CREATE TABLE IF NOT EXISTS public.lxp_student_lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_profile_id uuid NOT NULL REFERENCES public.lxp_profiles(id) ON DELETE CASCADE,
  external_discipline_id text NOT NULL,
  external_unit_id text NOT NULL,
  status text NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('pending', 'in_progress', 'completed')),
  completed_at timestamptz,
  last_accessed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lxp_student_lesson_progress_student_discipline_unit_uk
    UNIQUE (student_profile_id, external_discipline_id, external_unit_id)
);

CREATE INDEX IF NOT EXISTS lxp_student_lesson_progress_student_idx
  ON public.lxp_student_lesson_progress (student_profile_id);
CREATE INDEX IF NOT EXISTS lxp_student_lesson_progress_discipline_idx
  ON public.lxp_student_lesson_progress (external_discipline_id);

ALTER TABLE public.lxp_student_lesson_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS lxp_lesson_progress_admin_all ON public.lxp_student_lesson_progress;
DROP POLICY IF EXISTS lxp_lesson_progress_student_select_own ON public.lxp_student_lesson_progress;
DROP POLICY IF EXISTS lxp_lesson_progress_student_insert_own ON public.lxp_student_lesson_progress;
DROP POLICY IF EXISTS lxp_lesson_progress_student_update_own ON public.lxp_student_lesson_progress;

CREATE POLICY lxp_lesson_progress_admin_all
ON public.lxp_student_lesson_progress
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY lxp_lesson_progress_student_select_own
ON public.lxp_student_lesson_progress
FOR SELECT
TO authenticated
USING (
  public.is_student()
  AND EXISTS (
    SELECT 1 FROM public.lxp_profiles p
    WHERE p.id = lxp_student_lesson_progress.student_profile_id
      AND p.user_id = auth.uid()
  )
);

CREATE POLICY lxp_lesson_progress_student_insert_own
ON public.lxp_student_lesson_progress
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_student()
  AND EXISTS (
    SELECT 1 FROM public.lxp_profiles p
    WHERE p.id = lxp_student_lesson_progress.student_profile_id
      AND p.user_id = auth.uid()
  )
);

CREATE POLICY lxp_lesson_progress_student_update_own
ON public.lxp_student_lesson_progress
FOR UPDATE
TO authenticated
USING (
  public.is_student()
  AND EXISTS (
    SELECT 1 FROM public.lxp_profiles p
    WHERE p.id = lxp_student_lesson_progress.student_profile_id
      AND p.user_id = auth.uid()
  )
)
WITH CHECK (
  public.is_student()
  AND EXISTS (
    SELECT 1 FROM public.lxp_profiles p
    WHERE p.id = lxp_student_lesson_progress.student_profile_id
      AND p.user_id = auth.uid()
  )
);

-- 3) Aluno matriculado pode inserir próprio progresso de disciplina (agregado)
DROP POLICY IF EXISTS lxp_progress_student_insert_enrolled ON public.lxp_student_discipline_progress;

CREATE POLICY lxp_progress_student_insert_enrolled
ON public.lxp_student_discipline_progress
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_student()
  AND EXISTS (
    SELECT 1 FROM public.lxp_profiles p
    WHERE p.id = lxp_student_discipline_progress.student_profile_id
      AND p.user_id = auth.uid()
  )
  AND EXISTS (
    SELECT 1
    FROM public.lxp_course_disciplines cd
    JOIN public.lxp_course_periods cp ON cp.id = cd.course_period_id
    JOIN public.lxp_enrollments e ON e.course_id = cp.course_id AND e.status = 'active'
    WHERE cd.id = lxp_student_discipline_progress.course_discipline_id
      AND e.student_profile_id = lxp_student_discipline_progress.student_profile_id
  )
);
