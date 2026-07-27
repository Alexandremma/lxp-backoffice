-- STEP 38 — Moderação de comentários na aula (equipe no portal aluno)

ALTER TABLE public.lxp_lesson_comments
  ADD COLUMN IF NOT EXISTS author_team_role text;

ALTER TABLE public.lxp_lesson_comments
  DROP CONSTRAINT IF EXISTS lxp_lesson_comments_author_team_role_check;

ALTER TABLE public.lxp_lesson_comments
  ADD CONSTRAINT lxp_lesson_comments_author_team_role_check
  CHECK (
    author_team_role IS NULL
    OR author_team_role IN ('admin', 'coordinator', 'professor')
  );

CREATE OR REPLACE FUNCTION public.lxp_current_team_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT b.role
  FROM public.backoffice_team_members b
  WHERE b.user_id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_backoffice_team_member_active()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.backoffice_team_members b
    WHERE b.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_comment_moderator()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_backoffice_team_member_active();
$$;

GRANT EXECUTE ON FUNCTION public.lxp_current_team_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_backoffice_team_member_active() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_comment_moderator() TO authenticated;

DROP POLICY IF EXISTS lxp_lesson_comments_admin ON public.lxp_lesson_comments;

DROP POLICY IF EXISTS lxp_lesson_comments_student_insert ON public.lxp_lesson_comments;
CREATE POLICY lxp_lesson_comments_student_insert ON public.lxp_lesson_comments
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_student()
    AND author_team_role IS NULL
    AND EXISTS (
      SELECT 1 FROM public.lxp_profiles p
      WHERE p.id = lxp_lesson_comments.student_profile_id AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS lxp_lesson_comments_team_select ON public.lxp_lesson_comments;
CREATE POLICY lxp_lesson_comments_team_select ON public.lxp_lesson_comments
  FOR SELECT TO authenticated
  USING (public.is_comment_moderator());

DROP POLICY IF EXISTS lxp_lesson_comments_team_insert ON public.lxp_lesson_comments;
CREATE POLICY lxp_lesson_comments_team_insert ON public.lxp_lesson_comments
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_comment_moderator()
    AND author_team_role IS NOT NULL
    AND author_team_role = public.lxp_current_team_role()
    AND author_team_role IN ('admin', 'coordinator', 'professor')
    AND EXISTS (
      SELECT 1 FROM public.lxp_profiles p
      WHERE p.id = lxp_lesson_comments.student_profile_id AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS lxp_lesson_comments_team_update ON public.lxp_lesson_comments;
CREATE POLICY lxp_lesson_comments_team_update ON public.lxp_lesson_comments
  FOR UPDATE TO authenticated
  USING (
    public.is_comment_moderator()
    AND author_team_role IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.lxp_profiles p
      WHERE p.id = lxp_lesson_comments.student_profile_id AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_comment_moderator()
    AND author_team_role IS NOT NULL
    AND author_team_role = public.lxp_current_team_role()
    AND EXISTS (
      SELECT 1 FROM public.lxp_profiles p
      WHERE p.id = lxp_lesson_comments.student_profile_id AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS lxp_lesson_comments_team_delete ON public.lxp_lesson_comments;
CREATE POLICY lxp_lesson_comments_team_delete ON public.lxp_lesson_comments
  FOR DELETE TO authenticated
  USING (public.is_comment_moderator());

DROP POLICY IF EXISTS lxp_lesson_comments_student_update ON public.lxp_lesson_comments;
CREATE POLICY lxp_lesson_comments_student_update ON public.lxp_lesson_comments
  FOR UPDATE TO authenticated
  USING (
    public.is_student()
    AND author_team_role IS NULL
    AND EXISTS (
      SELECT 1 FROM public.lxp_profiles p
      WHERE p.id = lxp_lesson_comments.student_profile_id AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_student()
    AND author_team_role IS NULL
    AND EXISTS (
      SELECT 1 FROM public.lxp_profiles p
      WHERE p.id = lxp_lesson_comments.student_profile_id AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS lxp_lesson_comments_student_delete ON public.lxp_lesson_comments;
CREATE POLICY lxp_lesson_comments_student_delete ON public.lxp_lesson_comments
  FOR DELETE TO authenticated
  USING (
    public.is_student()
    AND author_team_role IS NULL
    AND EXISTS (
      SELECT 1 FROM public.lxp_profiles p
      WHERE p.id = lxp_lesson_comments.student_profile_id AND p.user_id = auth.uid()
    )
  );

CREATE OR REPLACE FUNCTION public.lxp_trg_lesson_comment_gamification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $f$
BEGIN
  IF NEW.author_team_role IS NOT NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.parent_id IS NULL THEN
    PERFORM public.lxp_award_xp_if_active(
      NEW.student_profile_id,
      'lesson_comment',
      'lesson_comment:' || NEW.id::text,
      jsonb_build_object(
        'comment_id', NEW.id,
        'external_discipline_id', NEW.external_discipline_id,
        'external_unit_id', NEW.external_unit_id
      )
    );
  ELSE
    PERFORM public.lxp_award_xp_if_active(
      NEW.student_profile_id,
      'lesson_comment_reply',
      'lesson_comment_reply:' || NEW.id::text,
      jsonb_build_object(
        'comment_id', NEW.id,
        'parent_id', NEW.parent_id,
        'external_discipline_id', NEW.external_discipline_id,
        'external_unit_id', NEW.external_unit_id
      )
    );
  END IF;

  PERFORM public.lxp_evaluate_student_badges(NEW.student_profile_id);
  RETURN NEW;
END;
$f$;
