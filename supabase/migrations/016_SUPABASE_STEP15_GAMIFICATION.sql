-- STEP 15 - Gamificacao (MVP): regras XP, niveis, badges, eventos, conquistas
-- Espelho do que foi aplicado via MCP em tres migracoes:
--   lxp_step15a1_gamification_tables
--   lxp_step15a2_gamification_seed_rls
--   lxp_step15b_gamification_triggers

-- ========== 15a1: tabelas + indices ==========

CREATE TABLE IF NOT EXISTS public.lxp_gamification_xp_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_key text NOT NULL,
  label text NOT NULL,
  category text NOT NULL DEFAULT 'lesson',
  xp_value integer NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lxp_gamification_xp_rules_action_key_uk UNIQUE (action_key),
  CONSTRAINT lxp_gamification_xp_rules_xp_check CHECK (xp_value >= 0 AND xp_value <= 10000),
  CONSTRAINT lxp_gamification_xp_rules_category_check CHECK (category IN ('lesson','quiz','engagement','social','other'))
);

CREATE TABLE IF NOT EXISTS public.lxp_gamification_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level_number integer NOT NULL,
  title text NOT NULL,
  min_total_xp integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lxp_gamification_levels_number_uk UNIQUE (level_number),
  CONSTRAINT lxp_gamification_levels_xp_check CHECK (min_total_xp >= 0),
  CONSTRAINT lxp_gamification_levels_number_check CHECK (level_number >= 1)
);

CREATE TABLE IF NOT EXISTS public.lxp_gamification_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  name text NOT NULL,
  description text,
  icon_id text NOT NULL DEFAULT 'award',
  rarity text NOT NULL DEFAULT 'common',
  rule_type text NOT NULL,
  rule_threshold integer NOT NULL,
  xp_reward integer NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lxp_gamification_badges_slug_uk UNIQUE (slug),
  CONSTRAINT lxp_gamification_badges_rarity_check CHECK (rarity IN ('common','rare','epic','legendary')),
  CONSTRAINT lxp_gamification_badges_rule_check CHECK (rule_type IN ('lessons_completed','disciplines_approved')),
  CONSTRAINT lxp_gamification_badges_threshold_check CHECK (rule_threshold > 0)
);

CREATE TABLE IF NOT EXISTS public.lxp_student_xp_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_profile_id uuid NOT NULL REFERENCES public.lxp_profiles(id) ON DELETE CASCADE,
  action_key text NOT NULL,
  xp_delta integer NOT NULL,
  ref jsonb,
  idempotency_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lxp_student_xp_events_idem_uk UNIQUE (idempotency_key),
  CONSTRAINT lxp_student_xp_events_delta_check CHECK (xp_delta > 0 AND xp_delta <= 10000)
);

CREATE INDEX IF NOT EXISTS lxp_student_xp_events_student_idx ON public.lxp_student_xp_events (student_profile_id);
CREATE INDEX IF NOT EXISTS lxp_student_xp_events_created_idx ON public.lxp_student_xp_events (created_at);

CREATE TABLE IF NOT EXISTS public.lxp_student_badge_awards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_profile_id uuid NOT NULL REFERENCES public.lxp_profiles(id) ON DELETE CASCADE,
  badge_id uuid NOT NULL REFERENCES public.lxp_gamification_badges(id) ON DELETE CASCADE,
  earned_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lxp_student_badge_awards_student_badge_uk UNIQUE (student_profile_id, badge_id)
);

CREATE INDEX IF NOT EXISTS lxp_student_badge_awards_student_idx ON public.lxp_student_badge_awards (student_profile_id);

-- ========== 15a2: seed + RLS ==========

-- Seed (idempotente)
INSERT INTO public.lxp_gamification_xp_rules (action_key, label, category, xp_value, sort_order, is_active)
VALUES
  ('lesson_complete', 'Concluir aula', 'lesson', 10, 1, true),
  ('discipline_complete', 'Concluir disciplina', 'lesson', 100, 2, true)
ON CONFLICT (action_key) DO UPDATE SET
  label = excluded.label,
  category = excluded.category,
  xp_value = excluded.xp_value,
  sort_order = excluded.sort_order,
  updated_at = now();

INSERT INTO public.lxp_gamification_levels (level_number, title, min_total_xp, is_active)
VALUES
  (1, 'Iniciante', 0, true),
  (2, 'Aprendiz', 100, true),
  (3, 'Estudante', 300, true),
  (4, 'Dedicado', 600, true),
  (5, 'Avancado', 1000, true),
  (6, 'Especialista', 1500, true),
  (7, 'Mestre', 2500, true),
  (8, 'Grão-Mestre', 4000, true),
  (9, 'Lenda', 6000, true),
  (10, 'Iluminado', 10000, true)
ON CONFLICT (level_number) DO UPDATE SET
  title = excluded.title,
  min_total_xp = excluded.min_total_xp,
  updated_at = now();

INSERT INTO public.lxp_gamification_badges (slug, name, description, icon_id, rarity, rule_type, rule_threshold, xp_reward, sort_order, is_active)
VALUES
  ('first_lesson', 'Primeira aula', 'Concluiu sua primeira aula', 'book', 'common', 'lessons_completed', 1, 0, 1, true),
  ('five_lessons', 'Em ritmo', 'Concluiu 5 aulas', 'zap', 'common', 'lessons_completed', 5, 0, 2, true),
  ('ten_lessons', 'Maratonista', 'Concluiu 10 aulas', 'flame', 'rare', 'lessons_completed', 10, 0, 3, true),
  ('first_discipline', 'Disciplina concluida', 'Aprovou a primeira disciplina', 'award', 'rare', 'disciplines_approved', 1, 0, 10, true),
  ('three_disciplines', 'Trilha firme', 'Aprovou 3 disciplinas', 'trophy', 'epic', 'disciplines_approved', 3, 0, 11, true)
ON CONFLICT (slug) DO UPDATE SET
  name = excluded.name,
  description = excluded.description,
  icon_id = excluded.icon_id,
  rarity = excluded.rarity,
  rule_type = excluded.rule_type,
  rule_threshold = excluded.rule_threshold,
  xp_reward = excluded.xp_reward,
  sort_order = excluded.sort_order,
  updated_at = now();

ALTER TABLE public.lxp_gamification_xp_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lxp_gamification_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lxp_gamification_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lxp_student_xp_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lxp_student_badge_awards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS lxp_gamification_xp_rules_admin ON public.lxp_gamification_xp_rules;
CREATE POLICY lxp_gamification_xp_rules_admin ON public.lxp_gamification_xp_rules
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS lxp_gamification_xp_rules_read_active ON public.lxp_gamification_xp_rules;
CREATE POLICY lxp_gamification_xp_rules_read_active ON public.lxp_gamification_xp_rules
  FOR SELECT TO authenticated USING (public.is_admin() OR is_active = true);

DROP POLICY IF EXISTS lxp_gamification_levels_admin ON public.lxp_gamification_levels;
CREATE POLICY lxp_gamification_levels_admin ON public.lxp_gamification_levels
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS lxp_gamification_levels_read_active ON public.lxp_gamification_levels;
CREATE POLICY lxp_gamification_levels_read_active ON public.lxp_gamification_levels
  FOR SELECT TO authenticated USING (public.is_admin() OR is_active = true);

DROP POLICY IF EXISTS lxp_gamification_badges_admin ON public.lxp_gamification_badges;
CREATE POLICY lxp_gamification_badges_admin ON public.lxp_gamification_badges
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS lxp_gamification_badges_read_active ON public.lxp_gamification_badges;
CREATE POLICY lxp_gamification_badges_read_active ON public.lxp_gamification_badges
  FOR SELECT TO authenticated USING (public.is_admin() OR is_active = true);

DROP POLICY IF EXISTS lxp_xp_events_admin ON public.lxp_student_xp_events;
CREATE POLICY lxp_xp_events_admin ON public.lxp_student_xp_events
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS lxp_xp_events_student_select ON public.lxp_student_xp_events;
CREATE POLICY lxp_xp_events_student_select ON public.lxp_student_xp_events
  FOR SELECT TO authenticated USING (
    public.is_student()
    AND EXISTS (
      SELECT 1 FROM public.lxp_profiles p
      WHERE p.id = lxp_student_xp_events.student_profile_id AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS lxp_badge_awards_admin ON public.lxp_student_badge_awards;
CREATE POLICY lxp_badge_awards_admin ON public.lxp_student_badge_awards
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS lxp_badge_awards_student_select ON public.lxp_student_badge_awards;
CREATE POLICY lxp_badge_awards_student_select ON public.lxp_student_badge_awards
  FOR SELECT TO authenticated USING (
    public.is_student()
    AND EXISTS (
      SELECT 1 FROM public.lxp_profiles p
      WHERE p.id = lxp_student_badge_awards.student_profile_id AND p.user_id = auth.uid()
    )
  );

-- ========== 15b: triggers + backfill + reavaliacao de badges ==========

CREATE OR REPLACE FUNCTION public.lxp_evaluate_lesson_badges(p_student uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $f$
DECLARE n_done int; r record;
BEGIN
  SELECT count(*)::int INTO n_done FROM public.lxp_student_lesson_progress
  WHERE student_profile_id = p_student AND status = 'completed';
  FOR r IN SELECT id FROM public.lxp_gamification_badges
    WHERE is_active AND rule_type = 'lessons_completed' AND rule_threshold <= n_done
  LOOP
    INSERT INTO public.lxp_student_badge_awards (student_profile_id, badge_id) VALUES (p_student, r.id)
    ON CONFLICT (student_profile_id, badge_id) DO NOTHING;
  END LOOP;
END;
$f$;

CREATE OR REPLACE FUNCTION public.lxp_evaluate_discipline_badges(p_student uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $f$
DECLARE n_appr int; r record;
BEGIN
  SELECT count(*)::int INTO n_appr FROM public.lxp_student_discipline_progress
  WHERE student_profile_id = p_student AND status = 'approved';
  FOR r IN SELECT id FROM public.lxp_gamification_badges
    WHERE is_active AND rule_type = 'disciplines_approved' AND rule_threshold <= n_appr
  LOOP
    INSERT INTO public.lxp_student_badge_awards (student_profile_id, badge_id) VALUES (p_student, r.id)
    ON CONFLICT (student_profile_id, badge_id) DO NOTHING;
  END LOOP;
END;
$f$;

CREATE OR REPLACE FUNCTION public.lxp_trg_gamification_lesson_complete()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $f$
DECLARE xpv int;
BEGIN
  IF NOT (NEW.status = 'completed' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'completed')) THEN RETURN NEW; END IF;
  SELECT COALESCE(r.xp_value, 0) INTO xpv FROM public.lxp_gamification_xp_rules r
  WHERE r.action_key = 'lesson_complete' AND r.is_active LIMIT 1;
  IF xpv > 0 THEN
    INSERT INTO public.lxp_student_xp_events (student_profile_id, action_key, xp_delta, ref, idempotency_key)
    VALUES (NEW.student_profile_id, 'lesson_complete', xpv,
      jsonb_build_object('external_discipline_id', NEW.external_discipline_id, 'external_unit_id', NEW.external_unit_id),
      'lesson:' || NEW.student_profile_id::text || ':' || NEW.external_discipline_id::text || ':' || NEW.external_unit_id::text)
    ON CONFLICT (idempotency_key) DO NOTHING;
  END IF;
  PERFORM public.lxp_evaluate_lesson_badges(NEW.student_profile_id);
  RETURN NEW;
END;
$f$;

CREATE OR REPLACE FUNCTION public.lxp_trg_gamification_discipline_approved()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $f$
DECLARE xpv int;
BEGIN
  IF NOT (NEW.status = 'approved' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'approved')) THEN RETURN NEW; END IF;
  SELECT COALESCE(r.xp_value, 0) INTO xpv FROM public.lxp_gamification_xp_rules r
  WHERE r.action_key = 'discipline_complete' AND r.is_active LIMIT 1;
  IF xpv > 0 THEN
    INSERT INTO public.lxp_student_xp_events (student_profile_id, action_key, xp_delta, ref, idempotency_key)
    VALUES (NEW.student_profile_id, 'discipline_complete', xpv,
      jsonb_build_object('course_discipline_id', NEW.course_discipline_id::text),
      'discipline:' || NEW.student_profile_id::text || ':' || NEW.course_discipline_id::text)
    ON CONFLICT (idempotency_key) DO NOTHING;
  END IF;
  PERFORM public.lxp_evaluate_discipline_badges(NEW.student_profile_id);
  RETURN NEW;
END;
$f$;

DROP TRIGGER IF EXISTS lxp_gamification_after_lesson ON public.lxp_student_lesson_progress;
CREATE TRIGGER lxp_gamification_after_lesson AFTER INSERT OR UPDATE OF status ON public.lxp_student_lesson_progress FOR EACH ROW EXECUTE FUNCTION public.lxp_trg_gamification_lesson_complete();

DROP TRIGGER IF EXISTS lxp_gamification_after_discipline ON public.lxp_student_discipline_progress;
CREATE TRIGGER lxp_gamification_after_discipline AFTER INSERT OR UPDATE OF status ON public.lxp_student_discipline_progress FOR EACH ROW EXECUTE FUNCTION public.lxp_trg_gamification_discipline_approved();

INSERT INTO public.lxp_student_xp_events (student_profile_id, action_key, xp_delta, ref, idempotency_key)
SELECT lp.student_profile_id, 'lesson_complete',
  COALESCE((SELECT xp_value FROM public.lxp_gamification_xp_rules WHERE action_key = 'lesson_complete' AND is_active LIMIT 1), 10),
  jsonb_build_object('external_discipline_id', lp.external_discipline_id, 'external_unit_id', lp.external_unit_id),
  'lesson:' || lp.student_profile_id::text || ':' || lp.external_discipline_id::text || ':' || lp.external_unit_id::text
FROM public.lxp_student_lesson_progress lp WHERE lp.status = 'completed' ON CONFLICT (idempotency_key) DO NOTHING;

INSERT INTO public.lxp_student_xp_events (student_profile_id, action_key, xp_delta, ref, idempotency_key)
SELECT dp.student_profile_id, 'discipline_complete',
  COALESCE((SELECT xp_value FROM public.lxp_gamification_xp_rules WHERE action_key = 'discipline_complete' AND is_active LIMIT 1), 100),
  jsonb_build_object('course_discipline_id', dp.course_discipline_id::text),
  'discipline:' || dp.student_profile_id::text || ':' || dp.course_discipline_id::text
FROM public.lxp_student_discipline_progress dp WHERE dp.status = 'approved' ON CONFLICT (idempotency_key) DO NOTHING;

DO $blk$ DECLARE r record; BEGIN
  FOR r IN SELECT DISTINCT student_profile_id FROM public.lxp_student_lesson_progress WHERE status = 'completed' LOOP
    PERFORM public.lxp_evaluate_lesson_badges(r.student_profile_id);
  END LOOP;
  FOR r IN SELECT DISTINCT student_profile_id FROM public.lxp_student_discipline_progress WHERE status = 'approved' LOOP
    PERFORM public.lxp_evaluate_discipline_badges(r.student_profile_id);
  END LOOP;
END $blk$;
