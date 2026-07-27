-- STEP 17a — rule_config em badges (regras compostas no admin)
ALTER TABLE public.lxp_gamification_badges
  ADD COLUMN IF NOT EXISTS rule_config jsonb;

UPDATE public.lxp_gamification_badges b
SET rule_config = jsonb_build_object(
  'matchMode', 'all',
  'rules', jsonb_build_array(
    jsonb_build_object(
      'id', 'legacy_1',
      'trigger', CASE
        WHEN b.rule_type = 'disciplines_approved' THEN 'courses_completed'
        ELSE 'lessons_completed'
      END,
      'operator', 'gte',
      'value', b.rule_threshold
    )
  )
)
WHERE b.rule_config IS NULL;

-- STEP 17b — catálogo de ações de XP (cliente B42)
INSERT INTO public.lxp_gamification_xp_rules (action_key, label, category, xp_value, sort_order, is_active)
VALUES
  ('lesson_complete', 'Aula Assistida', 'lesson', 10, 1, true),
  ('daily_login', 'Acesso Diário', 'engagement', 5, 2, true),
  ('streak_7_days', 'Sequência 7 Dias', 'engagement', 100, 3, true),
  ('lesson_comment', 'Comentário no Fórum', 'social', 15, 4, false),
  ('lesson_comment_reply', 'Ajudar Colega', 'social', 30, 5, false),
  ('discipline_complete', 'Disciplina concluída', 'lesson', 100, 6, true)
ON CONFLICT (action_key) DO UPDATE SET
  label = excluded.label,
  category = excluded.category,
  xp_value = excluded.xp_value,
  sort_order = excluded.sort_order,
  updated_at = now();
