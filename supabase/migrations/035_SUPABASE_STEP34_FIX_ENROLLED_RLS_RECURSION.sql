-- STEP 34: corrige timeout nas policies RLS de matrícula (enrolled)
-- Substitui joins cruzados com RLS ativo por funções SECURITY DEFINER.

CREATE OR REPLACE FUNCTION public.lxp_student_enrolled_in_course(p_course_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.lxp_enrollments e
    JOIN public.lxp_profiles p ON p.id = e.student_profile_id
    WHERE e.course_id = p_course_id
      AND e.status = 'active'
      AND p.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.lxp_student_enrolled_in_period(p_period_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.lxp_course_periods cp
    WHERE cp.id = p_period_id
      AND public.lxp_student_enrolled_in_course(cp.course_id)
  );
$$;

CREATE OR REPLACE FUNCTION public.lxp_student_enrolled_in_discipline(p_discipline_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.lxp_course_disciplines d
    WHERE d.id = p_discipline_id
      AND public.lxp_student_enrolled_in_period(d.course_period_id)
  );
$$;

GRANT EXECUTE ON FUNCTION public.lxp_student_enrolled_in_course(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.lxp_student_enrolled_in_period(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.lxp_student_enrolled_in_discipline(uuid) TO authenticated;

-- ---------- Recriar policies enrolled sem joins recursivos ----------

DROP POLICY IF EXISTS lxp_courses_student_read_enrolled ON public.lxp_courses;
CREATE POLICY lxp_courses_student_read_enrolled
ON public.lxp_courses
FOR SELECT
TO authenticated
USING (
  public.is_student()
  AND public.lxp_student_enrolled_in_course(id)
);

DROP POLICY IF EXISTS lxp_course_periods_student_read_enrolled ON public.lxp_course_periods;
CREATE POLICY lxp_course_periods_student_read_enrolled
ON public.lxp_course_periods
FOR SELECT
TO authenticated
USING (
  public.is_student()
  AND public.lxp_student_enrolled_in_course(course_id)
);

DROP POLICY IF EXISTS lxp_course_disciplines_student_read_enrolled ON public.lxp_course_disciplines;
CREATE POLICY lxp_course_disciplines_student_read_enrolled
ON public.lxp_course_disciplines
FOR SELECT
TO authenticated
USING (
  public.is_student()
  AND public.lxp_student_enrolled_in_discipline(id)
);

DROP POLICY IF EXISTS lxp_course_library_links_student_read_enrolled ON public.lxp_course_library_links;
CREATE POLICY lxp_course_library_links_student_read_enrolled
ON public.lxp_course_library_links
FOR SELECT
TO authenticated
USING (
  public.is_student()
  AND public.lxp_student_enrolled_in_discipline(course_discipline_id)
);
