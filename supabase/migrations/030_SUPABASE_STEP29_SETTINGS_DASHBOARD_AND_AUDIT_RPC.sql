-- =====================================================================
-- STEP 29: Configurações institucionais, auditoria admin e RPCs de dashboard
-- Estende SUPABASE_STEP25_INSTITUTION_SETTINGS_AUDIT.sql (aplicar em homolog/prod)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Tabelas (idempotente com STEP 25)
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.lxp_institution_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.lxp_profiles(id)
);

ALTER TABLE public.lxp_institution_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS institution_settings_admin_all ON public.lxp_institution_settings;
CREATE POLICY institution_settings_admin_all ON public.lxp_institution_settings
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE TABLE IF NOT EXISTS public.lxp_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_profile_id uuid REFERENCES public.lxp_profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text,
  entity_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.lxp_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS audit_logs_admin_select ON public.lxp_audit_logs;
CREATE POLICY audit_logs_admin_select ON public.lxp_audit_logs
  FOR SELECT TO authenticated
  USING (public.is_admin());

-- Inserção apenas via RPC (anti-forgery de actor)
DROP POLICY IF EXISTS audit_logs_admin_insert ON public.lxp_audit_logs;

CREATE INDEX IF NOT EXISTS lxp_audit_logs_created_at_idx
  ON public.lxp_audit_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS lxp_audit_logs_action_created_at_idx
  ON public.lxp_audit_logs (action, created_at DESC);

-- ---------------------------------------------------------------------
-- 2. Seeds / defaults
-- ---------------------------------------------------------------------

INSERT INTO public.lxp_institution_settings (key, value)
VALUES
  (
    'institution',
    jsonb_build_object(
      'name', '',
      'cnpj', '',
      'contactEmail', '',
      'phone', '',
      'address', '',
      'logoPath', null
    )
  ),
  (
    'subscription',
    jsonb_build_object(
      'planId', 'professional',
      'planName', 'Profissional',
      'status', 'active',
      'billingCycle', 'monthly',
      'priceMonthly', 497,
      'limits', jsonb_build_object(
        'students', 500,
        'courses', 25,
        'teamMembers', 15
      ),
      'features', jsonb_build_array('certificates', 'gamification', 'ai_tutor')
    )
  ),
  (
    'smtp',
    jsonb_build_object(
      'enabled', false,
      'host', '',
      'port', 587,
      'user', '',
      'fromEmail', '',
      'fromName', 'LXP Instituição',
      'secure', true
    )
  )
ON CONFLICT (key) DO NOTHING;

-- ---------------------------------------------------------------------
-- 3. RPC — auditoria (actor = perfil do admin logado)
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.lxp_write_audit_log(
  p_action text,
  p_entity_type text DEFAULT NULL,
  p_entity_id text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid;
  v_log_id uuid;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'NOT_AUTHORIZED';
  END IF;

  IF p_action IS NULL OR trim(p_action) = '' THEN
    RAISE EXCEPTION 'INVALID_ACTION';
  END IF;

  SELECT p.id INTO v_actor
  FROM public.lxp_profiles p
  WHERE p.user_id = auth.uid()
  LIMIT 1;

  INSERT INTO public.lxp_audit_logs (
    actor_profile_id,
    action,
    entity_type,
    entity_id,
    metadata
  )
  VALUES (
    v_actor,
    trim(p_action),
    NULLIF(trim(coalesce(p_entity_type, '')), ''),
    NULLIF(trim(coalesce(p_entity_id, '')), ''),
    coalesce(p_metadata, '{}'::jsonb)
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.lxp_write_audit_log(text, text, text, jsonb) TO authenticated;

-- ---------------------------------------------------------------------
-- 4. RPC — dashboard aba Geral (plano + uso + institution resumida)
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.lxp_get_settings_dashboard()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subscription jsonb;
  v_institution jsonb;
  v_students bigint;
  v_courses bigint;
  v_team bigint;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'NOT_AUTHORIZED';
  END IF;

  SELECT value INTO v_subscription
  FROM public.lxp_institution_settings
  WHERE key = 'subscription';

  SELECT value INTO v_institution
  FROM public.lxp_institution_settings
  WHERE key = 'institution';

  SELECT count(*)::bigint INTO v_students
  FROM public.lxp_profiles p
  WHERE coalesce(p.role, 'student') = 'student';

  SELECT count(*)::bigint INTO v_courses
  FROM public.lxp_courses;

  SELECT count(*)::bigint INTO v_team
  FROM public.backoffice_team_members;

  RETURN jsonb_build_object(
    'subscription', coalesce(v_subscription, '{}'::jsonb),
    'institution', coalesce(v_institution, '{}'::jsonb),
    'usage', jsonb_build_object(
      'students', v_students,
      'courses', v_courses,
      'teamMembers', v_team
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.lxp_get_settings_dashboard() TO authenticated;

-- ---------------------------------------------------------------------
-- 5. Storage — logo institucional (settings, não confundir com template certificado)
-- ---------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'institution-branding',
  'institution-branding',
  true,
  2097152,
  ARRAY['image/png', 'image/jpeg', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE
SET public = true,
    file_size_limit = 2097152,
    allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/webp']::text[];

DROP POLICY IF EXISTS institution_branding_public_read ON storage.objects;
CREATE POLICY institution_branding_public_read
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'institution-branding');

DROP POLICY IF EXISTS institution_branding_admin_insert ON storage.objects;
CREATE POLICY institution_branding_admin_insert
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'institution-branding' AND public.is_admin());

DROP POLICY IF EXISTS institution_branding_admin_update ON storage.objects;
CREATE POLICY institution_branding_admin_update
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'institution-branding' AND public.is_admin())
  WITH CHECK (bucket_id = 'institution-branding' AND public.is_admin());

DROP POLICY IF EXISTS institution_branding_admin_delete ON storage.objects;
CREATE POLICY institution_branding_admin_delete
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'institution-branding' AND public.is_admin());
