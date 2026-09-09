-- STEP 43 — Tempo de estudo por aula (heartbeat LXP / M2)
-- Conta segundos com a página da aula aberta e a aba visível.
-- Idempotente.

CREATE TABLE IF NOT EXISTS public.lxp_student_study_time (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_profile_id uuid NOT NULL REFERENCES public.lxp_profiles(id) ON DELETE CASCADE,
  external_discipline_id text NOT NULL,
  external_unit_id text NOT NULL,
  seconds integer NOT NULL DEFAULT 0
    CHECK (seconds >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lxp_student_study_time_student_discipline_unit_uk
    UNIQUE (student_profile_id, external_discipline_id, external_unit_id)
);

CREATE INDEX IF NOT EXISTS lxp_student_study_time_student_idx
  ON public.lxp_student_study_time (student_profile_id);

CREATE INDEX IF NOT EXISTS lxp_student_study_time_discipline_idx
  ON public.lxp_student_study_time (external_discipline_id);

ALTER TABLE public.lxp_student_study_time ENABLE ROW LEVEL SECURITY;

-- Staff: leitura administrativa (mesmo padrão de progresso)
DROP POLICY IF EXISTS lxp_study_time_admin_select ON public.lxp_student_study_time;
CREATE POLICY lxp_study_time_admin_select
ON public.lxp_student_study_time
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Aluno: somente o próprio perfil
DROP POLICY IF EXISTS lxp_study_time_student_select ON public.lxp_student_study_time;
CREATE POLICY lxp_study_time_student_select
ON public.lxp_student_study_time
FOR SELECT
TO authenticated
USING (
  public.is_student()
  AND EXISTS (
    SELECT 1 FROM public.lxp_profiles p
    WHERE p.id = lxp_student_study_time.student_profile_id
      AND p.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS lxp_study_time_student_insert ON public.lxp_student_study_time;
CREATE POLICY lxp_study_time_student_insert
ON public.lxp_student_study_time
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_student()
  AND EXISTS (
    SELECT 1 FROM public.lxp_profiles p
    WHERE p.id = lxp_student_study_time.student_profile_id
      AND p.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS lxp_study_time_student_update ON public.lxp_student_study_time;
CREATE POLICY lxp_study_time_student_update
ON public.lxp_student_study_time
FOR UPDATE
TO authenticated
USING (
  public.is_student()
  AND EXISTS (
    SELECT 1 FROM public.lxp_profiles p
    WHERE p.id = lxp_student_study_time.student_profile_id
      AND p.user_id = auth.uid()
  )
)
WITH CHECK (
  public.is_student()
  AND EXISTS (
    SELECT 1 FROM public.lxp_profiles p
    WHERE p.id = lxp_student_study_time.student_profile_id
      AND p.user_id = auth.uid()
  )
);

COMMENT ON TABLE public.lxp_student_study_time IS
  'STEP 43 / M2: segundos acumulados com a aula aberta e aba visível (heartbeat LXP).';

-- Incremento atômico (evita race entre abas / flushes)
CREATE OR REPLACE FUNCTION public.lxp_increment_study_seconds(
  p_student_profile_id uuid,
  p_external_discipline_id text,
  p_external_unit_id text,
  p_delta_seconds integer
)
RETURNS integer
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_seconds integer;
  v_delta integer;
BEGIN
  IF p_student_profile_id IS NULL
     OR p_external_discipline_id IS NULL
     OR btrim(p_external_discipline_id) = ''
     OR p_external_unit_id IS NULL
     OR btrim(p_external_unit_id) = ''
  THEN
    RAISE EXCEPTION 'lxp_increment_study_seconds: invalid keys';
  END IF;

  -- Teto alinhado ao cliente (flush 30s, max 45s)
  v_delta := LEAST(GREATEST(COALESCE(p_delta_seconds, 0), 0), 45);
  IF v_delta < 1 THEN
    RETURN COALESCE(
      (
        SELECT t.seconds
        FROM public.lxp_student_study_time t
        WHERE t.student_profile_id = p_student_profile_id
          AND t.external_discipline_id = btrim(p_external_discipline_id)
          AND t.external_unit_id = btrim(p_external_unit_id)
      ),
      0
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.lxp_profiles p
    WHERE p.id = p_student_profile_id
      AND p.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'lxp_increment_study_seconds: forbidden';
  END IF;

  INSERT INTO public.lxp_student_study_time (
    student_profile_id,
    external_discipline_id,
    external_unit_id,
    seconds,
    updated_at
  )
  VALUES (
    p_student_profile_id,
    btrim(p_external_discipline_id),
    btrim(p_external_unit_id),
    v_delta,
    now()
  )
  ON CONFLICT (student_profile_id, external_discipline_id, external_unit_id)
  DO UPDATE SET
    seconds = public.lxp_student_study_time.seconds + EXCLUDED.seconds,
    updated_at = now()
  RETURNING seconds INTO v_seconds;

  RETURN v_seconds;
END;
$$;

COMMENT ON FUNCTION public.lxp_increment_study_seconds(uuid, text, text, integer) IS
  'STEP 43: soma segundos de estudo (heartbeat). SECURITY INVOKER + checagem de perfil.';

REVOKE ALL ON FUNCTION public.lxp_increment_study_seconds(uuid, text, text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lxp_increment_study_seconds(uuid, text, text, integer) TO authenticated;
