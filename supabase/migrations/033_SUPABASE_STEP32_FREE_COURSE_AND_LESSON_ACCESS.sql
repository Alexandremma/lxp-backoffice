-- STEP 32: categoria curso livre + modo de acesso às aulas + RLS catálogo global
-- Depende de: STEP 2 (grades), STEP 4 (RLS), STEP 12 (self-enroll policies)

-- ---------- 1) Categoria free_course em lxp_courses ----------

ALTER TABLE public.lxp_courses
  DROP CONSTRAINT IF EXISTS lxp_courses_category_check;

ALTER TABLE public.lxp_courses
  ADD CONSTRAINT lxp_courses_category_check
  CHECK (category IN ('graduation', 'postgraduate', 'extension', 'free_course'));

COMMENT ON COLUMN public.lxp_courses.category IS
  'graduation | postgraduate | extension | free_course (auto-matrícula pelo aluno)';

-- ---------- 2) Modo de acesso às aulas por disciplina ----------

ALTER TABLE public.lxp_course_disciplines
  ADD COLUMN IF NOT EXISTS lesson_access_mode text NOT NULL DEFAULT 'free';

ALTER TABLE public.lxp_course_disciplines
  DROP CONSTRAINT IF EXISTS lxp_course_disciplines_lesson_access_mode_check;

ALTER TABLE public.lxp_course_disciplines
  ADD CONSTRAINT lxp_course_disciplines_lesson_access_mode_check
  CHECK (lesson_access_mode IN ('free', 'sequential'));

COMMENT ON COLUMN public.lxp_course_disciplines.lesson_access_mode IS
  'free = todas as aulas acessíveis; sequential = próxima só após concluir a anterior';

-- ---------- 3) RLS — leitura de cursos livres ativos (catálogo global) ----------

DROP POLICY IF EXISTS lxp_courses_student_read_free_active ON public.lxp_courses;
CREATE POLICY lxp_courses_student_read_free_active
ON public.lxp_courses
FOR SELECT
TO authenticated
USING (
  public.is_student()
  AND category = 'free_course'
  AND status = 'active'
);

DROP POLICY IF EXISTS lxp_course_periods_student_read_free ON public.lxp_course_periods;
CREATE POLICY lxp_course_periods_student_read_free
ON public.lxp_course_periods
FOR SELECT
TO authenticated
USING (
  public.is_student()
  AND EXISTS (
    SELECT 1
    FROM public.lxp_courses c
    WHERE c.id = lxp_course_periods.course_id
      AND c.category = 'free_course'
      AND c.status = 'active'
  )
);

DROP POLICY IF EXISTS lxp_course_disciplines_student_read_free ON public.lxp_course_disciplines;
CREATE POLICY lxp_course_disciplines_student_read_free
ON public.lxp_course_disciplines
FOR SELECT
TO authenticated
USING (
  public.is_student()
  AND status = 'active'
  AND EXISTS (
    SELECT 1
    FROM public.lxp_course_periods cp
    JOIN public.lxp_courses c ON c.id = cp.course_id
    WHERE cp.id = lxp_course_disciplines.course_period_id
      AND c.category = 'free_course'
      AND c.status = 'active'
  )
);

DROP POLICY IF EXISTS lxp_course_library_links_student_read_free ON public.lxp_course_library_links;
CREATE POLICY lxp_course_library_links_student_read_free
ON public.lxp_course_library_links
FOR SELECT
TO authenticated
USING (
  public.is_student()
  AND EXISTS (
    SELECT 1
    FROM public.lxp_course_disciplines cd
    JOIN public.lxp_course_periods cp ON cp.id = cd.course_period_id
    JOIN public.lxp_courses c ON c.id = cp.course_id
    WHERE cd.id = lxp_course_library_links.course_discipline_id
      AND cd.status = 'active'
      AND c.category = 'free_course'
      AND c.status = 'active'
  )
);

-- ---------- 4) RLS — auto-matrícula restrita a cursos livres ativos ----------

DROP POLICY IF EXISTS lxp_enrollments_student_insert_own ON public.lxp_enrollments;
CREATE POLICY lxp_enrollments_student_insert_own
ON public.lxp_enrollments
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_student()
  AND EXISTS (
    SELECT 1
    FROM public.lxp_profiles p
    WHERE p.id = lxp_enrollments.student_profile_id
      AND p.user_id = auth.uid()
  )
  AND EXISTS (
    SELECT 1
    FROM public.lxp_courses c
    WHERE c.id = lxp_enrollments.course_id
      AND c.category = 'free_course'
      AND c.status = 'active'
  )
);

DROP POLICY IF EXISTS lxp_enrollments_student_update_own ON public.lxp_enrollments;
CREATE POLICY lxp_enrollments_student_update_own
ON public.lxp_enrollments
FOR UPDATE
TO authenticated
USING (
  public.is_student()
  AND EXISTS (
    SELECT 1
    FROM public.lxp_profiles p
    WHERE p.id = lxp_enrollments.student_profile_id
      AND p.user_id = auth.uid()
  )
)
WITH CHECK (
  public.is_student()
  AND EXISTS (
    SELECT 1
    FROM public.lxp_profiles p
    WHERE p.id = lxp_enrollments.student_profile_id
      AND p.user_id = auth.uid()
  )
  AND EXISTS (
    SELECT 1
    FROM public.lxp_courses c
    WHERE c.id = lxp_enrollments.course_id
      AND c.category = 'free_course'
      AND c.status = 'active'
  )
);
