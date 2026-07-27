-- STEP 21 — Reavaliação remove badges que deixaram de cumprir as regras

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
