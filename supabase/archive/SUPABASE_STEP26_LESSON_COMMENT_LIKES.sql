-- Step 26: curtidas em comentários da aula (fase 2 engajamento)

CREATE TABLE IF NOT EXISTS public.lxp_lesson_comment_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES public.lxp_lesson_comments(id) ON DELETE CASCADE,
  student_profile_id uuid NOT NULL REFERENCES public.lxp_profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (comment_id, student_profile_id)
);

CREATE INDEX IF NOT EXISTS idx_lesson_comment_likes_comment
  ON public.lxp_lesson_comment_likes(comment_id);

ALTER TABLE public.lxp_lesson_comment_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY lesson_comment_likes_select ON public.lxp_lesson_comment_likes
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY lesson_comment_likes_insert ON public.lxp_lesson_comment_likes
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_student()
    AND student_profile_id IN (
      SELECT id FROM public.lxp_profiles WHERE user_id = auth.uid() AND role = 'student'
    )
  );

CREATE POLICY lesson_comment_likes_delete ON public.lxp_lesson_comment_likes
  FOR DELETE TO authenticated
  USING (
    public.is_student()
    AND student_profile_id IN (
      SELECT id FROM public.lxp_profiles WHERE user_id = auth.uid() AND role = 'student'
    )
  );
