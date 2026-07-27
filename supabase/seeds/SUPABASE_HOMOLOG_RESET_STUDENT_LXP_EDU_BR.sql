-- Homolog only: zera progresso, gamificação e certificados do student@lxp.edu.br
-- Mantém: auth.users, lxp_profiles, matrícula **ativa** (ex.: ADS). Remove matrículas inactive/blocked.
-- Não aplicar em produção.

DO $reset$
DECLARE
  pid uuid;
  deleted jsonb := '{}'::jsonb;
  n bigint;
BEGIN
  SELECT p.id INTO pid
  FROM public.lxp_profiles p
  WHERE lower(trim(p.email)) = lower('student@lxp.edu.br')
  LIMIT 1;

  IF pid IS NULL THEN
    RAISE NOTICE 'Perfil student@lxp.edu.br não encontrado';
    RETURN;
  END IF;

  -- Step 26 (likes) pode não estar aplicado em homolog
  IF to_regclass('public.lxp_lesson_comment_likes') IS NOT NULL THEN
    DELETE FROM public.lxp_lesson_comment_likes WHERE student_profile_id = pid;
    GET DIAGNOSTICS n = ROW_COUNT;
    deleted := deleted || jsonb_build_object('lesson_comment_likes', n);
  END IF;

  DELETE FROM public.lxp_lesson_comments WHERE student_profile_id = pid;
  GET DIAGNOSTICS n = ROW_COUNT;
  deleted := deleted || jsonb_build_object('lesson_comments', n);

  DELETE FROM public.lxp_lesson_notes WHERE student_profile_id = pid;
  GET DIAGNOSTICS n = ROW_COUNT;
  deleted := deleted || jsonb_build_object('lesson_notes', n);

  DELETE FROM public.lxp_certificate_issues WHERE student_profile_id = pid;
  GET DIAGNOSTICS n = ROW_COUNT;
  deleted := deleted || jsonb_build_object('certificate_issues', n);

  DELETE FROM public.lxp_student_badge_awards WHERE student_profile_id = pid;
  GET DIAGNOSTICS n = ROW_COUNT;
  deleted := deleted || jsonb_build_object('badge_awards', n);

  DELETE FROM public.lxp_student_xp_events WHERE student_profile_id = pid;
  GET DIAGNOSTICS n = ROW_COUNT;
  deleted := deleted || jsonb_build_object('xp_events', n);

  DELETE FROM public.lxp_student_daily_access WHERE student_profile_id = pid;
  GET DIAGNOSTICS n = ROW_COUNT;
  deleted := deleted || jsonb_build_object('daily_access', n);

  DELETE FROM public.lxp_student_lesson_progress WHERE student_profile_id = pid;
  GET DIAGNOSTICS n = ROW_COUNT;
  deleted := deleted || jsonb_build_object('lesson_progress', n);

  DELETE FROM public.lxp_student_discipline_progress WHERE student_profile_id = pid;
  GET DIAGNOSTICS n = ROW_COUNT;
  deleted := deleted || jsonb_build_object('discipline_progress', n);

  DELETE FROM public.lxp_enrollments
  WHERE student_profile_id = pid AND status <> 'active';
  GET DIAGNOSTICS n = ROW_COUNT;
  deleted := deleted || jsonb_build_object('enrollments_removed', n);

  RAISE NOTICE 'Reset student@lxp.edu.br (profile %): %', pid, deleted;
END;
$reset$;
