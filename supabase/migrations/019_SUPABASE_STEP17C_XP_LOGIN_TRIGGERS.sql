-- STEP 17c — XP por primeiro acesso do dia e marco de 7 dias de streak (login)

CREATE OR REPLACE FUNCTION public.lxp_award_xp_if_active(
  p_student uuid,
  p_action_key text,
  p_idempotency_key text,
  p_ref jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $f$
DECLARE xpv int;
BEGIN
  SELECT r.xp_value INTO xpv
  FROM public.lxp_gamification_xp_rules r
  WHERE r.action_key = p_action_key AND r.is_active
  LIMIT 1;
  IF COALESCE(xpv, 0) <= 0 THEN RETURN; END IF;
  INSERT INTO public.lxp_student_xp_events (student_profile_id, action_key, xp_delta, ref, idempotency_key)
  VALUES (p_student, p_action_key, xpv, p_ref, p_idempotency_key)
  ON CONFLICT (idempotency_key) DO NOTHING;
END;
$f$;

CREATE OR REPLACE FUNCTION public.lxp_login_streak_days(p_student uuid, p_anchor date)
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $f$
DECLARE n int := 0;
DECLARE cur date := p_anchor;
BEGIN
  WHILE EXISTS (
    SELECT 1 FROM public.lxp_student_daily_access d
    WHERE d.student_profile_id = p_student AND d.access_date = cur
  ) LOOP
    n := n + 1;
    cur := cur - 1;
  END LOOP;
  RETURN n;
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

  RETURN NEW;
END;
$f$;

DROP TRIGGER IF EXISTS lxp_gamification_after_daily_access ON public.lxp_student_daily_access;
CREATE TRIGGER lxp_gamification_after_daily_access
  AFTER INSERT ON public.lxp_student_daily_access
  FOR EACH ROW
  EXECUTE FUNCTION public.lxp_trg_gamification_daily_access();
