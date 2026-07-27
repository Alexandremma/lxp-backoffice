-- STEP 19 — Lesson comments table and RLS (portal discussion + XP rules in later steps).

CREATE TABLE IF NOT EXISTS public.lxp_lesson_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_profile_id uuid NOT NULL REFERENCES public.lxp_profiles(id) ON DELETE CASCADE,
  external_discipline_id text NOT NULL,
  external_unit_id text NOT NULL,
  parent_id uuid REFERENCES public.lxp_lesson_comments(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(trim(body)) >= 1),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lxp_lesson_comments_lesson_idx
  ON public.lxp_lesson_comments (external_discipline_id, external_unit_id);

CREATE INDEX IF NOT EXISTS lxp_lesson_comments_student_idx
  ON public.lxp_lesson_comments (student_profile_id);

ALTER TABLE public.lxp_lesson_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS lxp_lesson_comments_admin ON public.lxp_lesson_comments;
CREATE POLICY lxp_lesson_comments_admin ON public.lxp_lesson_comments
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS lxp_lesson_comments_student_select ON public.lxp_lesson_comments;
CREATE POLICY lxp_lesson_comments_student_select ON public.lxp_lesson_comments
  FOR SELECT TO authenticated
  USING (public.is_student());

DROP POLICY IF EXISTS lxp_lesson_comments_student_insert ON public.lxp_lesson_comments;
CREATE POLICY lxp_lesson_comments_student_insert ON public.lxp_lesson_comments
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_student()
    AND EXISTS (
      SELECT 1 FROM public.lxp_profiles p
      WHERE p.id = lxp_lesson_comments.student_profile_id AND p.user_id = auth.uid()
    )
  );
