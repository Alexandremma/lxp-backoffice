-- Homolog only: 7 dias consecutivos de acesso para testar streak XP (student@lxp.edu.br)
-- Executar manualmente em homolog; não aplicar em produção.

DO $seed$
DECLARE pid uuid;
DECLARE d date;
DECLARE i int;
BEGIN
  SELECT p.id INTO pid
  FROM public.lxp_profiles p
  WHERE lower(trim(p.email)) = lower('student@lxp.edu.br')
  LIMIT 1;

  IF pid IS NULL THEN
    RAISE NOTICE 'Perfil student@lxp.edu.br não encontrado';
    RETURN;
  END IF;

  FOR i IN 0..6 LOOP
    d := (timezone('America/Sao_Paulo', now()))::date - i;
    INSERT INTO public.lxp_student_daily_access (student_profile_id, access_date)
    VALUES (pid, d)
    ON CONFLICT (student_profile_id, access_date) DO NOTHING;
  END LOOP;

  PERFORM public.lxp_evaluate_student_badges(pid);
  RAISE NOTICE 'Seed streak 7 para profile %', pid;
END;
$seed$;
