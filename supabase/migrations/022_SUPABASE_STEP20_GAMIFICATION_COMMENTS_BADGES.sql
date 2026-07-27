-- STEP 20 — Comentários (RLS edit/delete, XP), métricas de badge ampliadas, reavaliação em massa (admin)

-- Limite de 2000 caracteres
ALTER TABLE public.lxp_lesson_comments
  DROP CONSTRAINT IF EXISTS lxp_lesson_comments_body_len_check;

ALTER TABLE public.lxp_lesson_comments
  ADD CONSTRAINT lxp_lesson_comments_body_len_check
  CHECK (char_length(body) >= 1 AND char_length(body) <= 2000);

-- Métricas de badge: fórum (comentários na aula), certificados, XP total
CREATE OR REPLACE FUNCTION public.lxp_badge_metric_value(p_student uuid, p_trigger text)
RETURNS numeric
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $f$
BEGIN
  CASE p_trigger
    WHEN 'lessons_completed' THEN
      RETURN (
        SELECT count(*)::numeric FROM public.lxp_student_lesson_progress
        WHERE student_profile_id = p_student AND status = 'completed'
      );
    WHEN 'courses_completed', 'disciplines_approved' THEN
      RETURN (
        SELECT count(*)::numeric FROM public.lxp_student_discipline_progress
        WHERE student_profile_id = p_student AND status = 'approved'
      );
    WHEN 'streak_days' THEN
      RETURN public.lxp_login_streak_current(p_student)::numeric;
    WHEN 'forum_posts', 'lesson_comment' THEN
      RETURN (
        SELECT count(*)::numeric FROM public.lxp_lesson_comments
        WHERE student_profile_id = p_student AND parent_id IS NULL
      );
    WHEN 'forum_replies', 'lesson_comment_reply' THEN
      RETURN (
        SELECT count(*)::numeric FROM public.lxp_lesson_comments
        WHERE student_profile_id = p_student AND parent_id IS NOT NULL
      );
    WHEN 'certificates_earned' THEN
      RETURN (
        SELECT count(*)::numeric FROM public.lxp_certificate_issues
        WHERE student_profile_id = p_student
      );
    WHEN 'xp_earned' THEN
      RETURN COALESCE((
        SELECT sum(xp_delta)::numeric FROM public.lxp_student_xp_events
        WHERE student_profile_id = p_student
      ), 0);
    ELSE
      RETURN NULL;
  END CASE;
END;
$f$;

-- Reavaliar badges de todos os alunos (somente admin)
CREATE OR REPLACE FUNCTION public.lxp_reevaluate_all_student_badges()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $f$
DECLARE n int := 0;
DECLARE pid uuid;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'not_authorized' USING ERRCODE = '42501';
  END IF;

  FOR pid IN
    SELECT p.id FROM public.lxp_profiles p WHERE p.role = 'student'
  LOOP
    PERFORM public.lxp_evaluate_student_badges(pid);
    n := n + 1;
  END LOOP;

  RETURN jsonb_build_object('students_processed', n);
END;
$f$;

REVOKE ALL ON FUNCTION public.lxp_reevaluate_all_student_badges() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lxp_reevaluate_all_student_badges() TO authenticated;

-- RLS: autor pode editar e apagar
DROP POLICY IF EXISTS lxp_lesson_comments_student_update ON public.lxp_lesson_comments;
CREATE POLICY lxp_lesson_comments_student_update ON public.lxp_lesson_comments
  FOR UPDATE TO authenticated
  USING (
    public.is_student()
    AND EXISTS (
      SELECT 1 FROM public.lxp_profiles p
      WHERE p.id = lxp_lesson_comments.student_profile_id AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_student()
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
    AND EXISTS (
      SELECT 1 FROM public.lxp_profiles p
      WHERE p.id = lxp_lesson_comments.student_profile_id AND p.user_id = auth.uid()
    )
  );

-- XP + badges ao comentar
CREATE OR REPLACE FUNCTION public.lxp_trg_lesson_comment_gamification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $f$
BEGIN
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

DROP TRIGGER IF EXISTS lxp_lesson_comment_gamification ON public.lxp_lesson_comments;
CREATE TRIGGER lxp_lesson_comment_gamification
  AFTER INSERT ON public.lxp_lesson_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.lxp_trg_lesson_comment_gamification();

-- Ativar regras de XP social (UI pronta)
UPDATE public.lxp_gamification_xp_rules
SET is_active = true, updated_at = now()
WHERE action_key IN ('lesson_comment', 'lesson_comment_reply');
