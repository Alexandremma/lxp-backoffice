-- =====================================================================
-- STEP 36: flag opcional de créditos por disciplina
-- =====================================================================
-- credits_enabled = false → credits persistido como 0; portal não exibe.
-- Default true preserva disciplinas já cadastradas com créditos.
-- =====================================================================

ALTER TABLE public.lxp_course_disciplines
  ADD COLUMN IF NOT EXISTS credits_enabled boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.lxp_course_disciplines.credits_enabled IS
  'Quando false, a disciplina não usa créditos (credits=0) e o portal do aluno não exibe créditos.';

UPDATE public.lxp_course_disciplines
SET credits_enabled = false,
    credits = 0
WHERE credits_enabled = true
  AND credits = 0;
