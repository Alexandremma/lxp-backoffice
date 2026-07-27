-- STEP 33: corrige timeout/recursão nas policies RLS do STEP 32
-- Usa funções SECURITY DEFINER para evitar subqueries cruzadas com RLS ativo.

CREATE OR REPLACE FUNCTION public.lxp_is_free_course_active(p_course_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.lxp_courses c
    WHERE c.id = p_course_id
      AND c.category = 'free_course'
      AND c.status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.lxp_is_free_discipline_active(p_discipline_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.lxp_course_disciplines d
    JOIN public.lxp_course_periods cp ON cp.id = d.course_period_id
  WHERE d.id = p_discipline_id
      AND d.status = 'active'
      AND public.lxp_is_free_course_active(cp.course_id)
  );
$$;

CREATE OR REPLACE FUNCTION public.lxp_is_free_course_enrollment_allowed(p_course_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.lxp_is_free_course_active(p_course_id);
$$;

-- ---------- Recriar policies sem joins recursivos ----------

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
  AND public.lxp_is_free_course_active(course_id)
);

DROP POLICY IF EXISTS lxp_course_disciplines_student_read_free ON public.lxp_course_disciplines;
CREATE POLICY lxp_course_disciplines_student_read_free
ON public.lxp_course_disciplines
FOR SELECT
TO authenticated
USING (
  public.is_student()
  AND status = 'active'
  AND public.lxp_is_free_discipline_active(id)
);

DROP POLICY IF EXISTS lxp_course_library_links_student_read_free ON public.lxp_course_library_links;
CREATE POLICY lxp_course_library_links_student_read_free
ON public.lxp_course_library_links
FOR SELECT
TO authenticated
USING (
  public.is_student()
  AND public.lxp_is_free_discipline_active(course_discipline_id)
);

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
  AND public.lxp_is_free_course_enrollment_allowed(course_id)
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
  AND public.lxp_is_free_course_enrollment_allowed(course_id)
);
