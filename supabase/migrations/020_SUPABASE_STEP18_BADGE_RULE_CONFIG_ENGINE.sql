-- STEP 18 — Avaliação de badges via rule_config (métricas disponíveis hoje)
-- Suportado: lessons_completed, courses_completed, disciplines_approved, streak_days
-- Demais triggers (fórum, quiz, etc.) retornam NULL e não satisfazem a regra até implementação futura.

CREATE OR REPLACE FUNCTION public.lxp_today_sp()
RETURNS date
LANGUAGE sql
STABLE
AS $$ SELECT (timezone('America/Sao_Paulo', now()))::date; $$;

CREATE OR REPLACE FUNCTION public.lxp_login_streak_current(p_student uuid)
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $f$
DECLARE today date := public.lxp_today_sp();
DECLARE yesterday date := today - 1;
DECLARE anchor date;
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.lxp_student_daily_access d
    WHERE d.student_profile_id = p_student AND d.access_date = today
  ) THEN
    anchor := today;
  ELSIF EXISTS (
    SELECT 1 FROM public.lxp_student_daily_access d
    WHERE d.student_profile_id = p_student AND d.access_date = yesterday
  ) THEN
    anchor := yesterday;
  ELSE
    RETURN 0;
  END IF;
  RETURN public.lxp_login_streak_days(p_student, anchor);
END;
$f$;

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
    ELSE
      RETURN NULL;
  END CASE;
END;
$f$;

CREATE OR REPLACE FUNCTION public.lxp_op_satisfies(p_metric numeric, p_operator text, p_expected numeric)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $f$
BEGIN
  IF p_metric IS NULL THEN RETURN false; END IF;
  CASE p_operator
    WHEN 'gte' THEN RETURN p_metric >= p_expected;
    WHEN 'gt' THEN RETURN p_metric > p_expected;
    WHEN 'lte' THEN RETURN p_metric <= p_expected;
    WHEN 'lt' THEN RETURN p_metric < p_expected;
    WHEN 'eq' THEN RETURN p_metric = p_expected;
    ELSE RETURN false;
  END CASE;
END;
$f$;

CREATE OR REPLACE FUNCTION public.lxp_evaluate_student_badges(p_student uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $f$
DECLARE b record;
DECLARE rule jsonb;
DECLARE rules jsonb;
DECLARE match_mode text;
DECLARE passed boolean;
DECLARE rule_ok boolean;
DECLARE metric numeric;
DECLARE expected numeric;
DECLARE n_done int;
DECLARE n_appr int;
BEGIN
  FOR b IN
    SELECT id, rule_config, rule_type, rule_threshold
    FROM public.lxp_gamification_badges
    WHERE is_active
  LOOP
    passed := false;

    IF b.rule_config IS NOT NULL AND jsonb_typeof(b.rule_config -> 'rules') = 'array'
       AND jsonb_array_length(b.rule_config -> 'rules') > 0 THEN
      rules := b.rule_config -> 'rules';
      match_mode := COALESCE(b.rule_config ->> 'matchMode', 'all');
      passed := (match_mode = 'all');

      FOR rule IN SELECT * FROM jsonb_array_elements(rules) LOOP
        metric := public.lxp_badge_metric_value(p_student, rule ->> 'trigger');
        expected := (rule ->> 'value')::numeric;
        rule_ok := public.lxp_op_satisfies(metric, COALESCE(rule ->> 'operator', 'gte'), expected);

        IF match_mode = 'all' THEN
          passed := passed AND rule_ok;
        ELSIF rule_ok THEN
          passed := true;
        END IF;
      END LOOP;
    ELSE
      IF b.rule_type = 'lessons_completed' THEN
        SELECT count(*)::int INTO n_done FROM public.lxp_student_lesson_progress
        WHERE student_profile_id = p_student AND status = 'completed';
        passed := n_done >= b.rule_threshold;
      ELSIF b.rule_type = 'disciplines_approved' THEN
        SELECT count(*)::int INTO n_appr FROM public.lxp_student_discipline_progress
        WHERE student_profile_id = p_student AND status = 'approved';
        passed := n_appr >= b.rule_threshold;
      END IF;
    END IF;

    IF passed THEN
      INSERT INTO public.lxp_student_badge_awards (student_profile_id, badge_id)
      VALUES (p_student, b.id)
      ON CONFLICT (student_profile_id, badge_id) DO NOTHING;
    ELSE
      DELETE FROM public.lxp_student_badge_awards
      WHERE student_profile_id = p_student AND badge_id = b.id;
    END IF;
  END LOOP;
END;
$f$;

CREATE OR REPLACE FUNCTION public.lxp_evaluate_lesson_badges(p_student uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $f$
BEGIN
  PERFORM public.lxp_evaluate_student_badges(p_student);
END;
$f$;

CREATE OR REPLACE FUNCTION public.lxp_evaluate_discipline_badges(p_student uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $f$
BEGIN
  PERFORM public.lxp_evaluate_student_badges(p_student);
END;
$f$;

CREATE OR REPLACE FUNCTION public.lxp_trg_gamification_daily_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $f$
DECLARE streak int;
BEGIN
  PERFORM public.lxp_award_xp_if_active(
    NEW.student_profile_id,
    'daily_login',
    'daily_login:' || NEW.student_profile_id::text || ':' || NEW.access_date::text,
    jsonb_build_object('access_date', NEW.access_date::text)
  );

  streak := public.lxp_login_streak_days(NEW.student_profile_id, NEW.access_date);
  IF streak > 0 AND streak % 7 = 0 THEN
    PERFORM public.lxp_award_xp_if_active(
      NEW.student_profile_id,
      'streak_7_days',
      'streak_7:' || NEW.student_profile_id::text || ':' || streak::text,
      jsonb_build_object('streak_days', streak, 'access_date', NEW.access_date::text)
    );
  END IF;

  PERFORM public.lxp_evaluate_student_badges(NEW.student_profile_id);

  RETURN NEW;
END;
$f$;
