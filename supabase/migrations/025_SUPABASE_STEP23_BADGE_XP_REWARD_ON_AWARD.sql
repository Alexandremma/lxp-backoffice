-- STEP 23 — Bônus XP ao desbloquear badge (campo xp_reward em lxp_gamification_badges)

CREATE OR REPLACE FUNCTION public.lxp_trg_badge_award_bonus_xp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $f$
DECLARE xpv int;
DECLARE slug text;
BEGIN
  SELECT b.xp_reward, b.slug INTO xpv, slug
  FROM public.lxp_gamification_badges b
  WHERE b.id = NEW.badge_id;

  IF COALESCE(xpv, 0) <= 0 THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.lxp_student_xp_events (student_profile_id, action_key, xp_delta, ref, idempotency_key)
  VALUES (
    NEW.student_profile_id,
    'badge_reward',
    xpv,
    jsonb_build_object('badge_id', NEW.badge_id, 'slug', slug),
    'badge_reward:' || NEW.student_profile_id::text || ':' || NEW.badge_id::text
  )
  ON CONFLICT (idempotency_key) DO NOTHING;

  RETURN NEW;
END;
$f$;

DROP TRIGGER IF EXISTS lxp_badge_award_bonus_xp ON public.lxp_student_badge_awards;
CREATE TRIGGER lxp_badge_award_bonus_xp
  AFTER INSERT ON public.lxp_student_badge_awards
  FOR EACH ROW
  EXECUTE FUNCTION public.lxp_trg_badge_award_bonus_xp();
