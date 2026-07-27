-- =====================================================================
-- STEP 41: restringir EXECUTE em RPCs DEFINER de gamificação
-- =====================================================================
-- Problema (auditoria 2026-07-12): lxp_award_xp_if_active e
-- lxp_evaluate_student_badges eram SECURITY DEFINER com EXECUTE para
-- anon + authenticated — qualquer cliente podia conceder XP/badges a
-- UUID arbitrário.
--
-- Triggers e wrappers internos já são SECURITY DEFINER (owner); continuam
-- podendo chamar estas funções após REVOKE do client.
--
-- lxp_reevaluate_all_student_badges mantém GRANT authenticated (checa
-- is_admin() no corpo) — apenas remove anon se presente.
-- =====================================================================

REVOKE ALL ON FUNCTION public.lxp_award_xp_if_active(uuid, text, text, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.lxp_award_xp_if_active(uuid, text, text, jsonb) FROM anon;
REVOKE ALL ON FUNCTION public.lxp_award_xp_if_active(uuid, text, text, jsonb) FROM authenticated;

REVOKE ALL ON FUNCTION public.lxp_evaluate_student_badges(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.lxp_evaluate_student_badges(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.lxp_evaluate_student_badges(uuid) FROM authenticated;

REVOKE ALL ON FUNCTION public.lxp_reevaluate_all_student_badges() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.lxp_reevaluate_all_student_badges() FROM anon;
GRANT EXECUTE ON FUNCTION public.lxp_reevaluate_all_student_badges() TO authenticated;

COMMENT ON FUNCTION public.lxp_award_xp_if_active(uuid, text, text, jsonb) IS
  'STEP 41: só invocável por triggers/wrappers DEFINER (sem EXECUTE para anon/authenticated).';

COMMENT ON FUNCTION public.lxp_evaluate_student_badges(uuid) IS
  'STEP 41: só invocável por triggers/wrappers DEFINER (sem EXECUTE para anon/authenticated).';
