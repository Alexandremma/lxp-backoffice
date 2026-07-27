-- Step 25: configurações institucionais e auditoria admin

CREATE TABLE IF NOT EXISTS public.lxp_institution_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.lxp_profiles(id)
);

ALTER TABLE public.lxp_institution_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY institution_settings_admin_all ON public.lxp_institution_settings
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE TABLE IF NOT EXISTS public.lxp_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_profile_id uuid REFERENCES public.lxp_profiles(id),
  action text NOT NULL,
  entity_type text,
  entity_id text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.lxp_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_logs_admin_select ON public.lxp_audit_logs
  FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY audit_logs_admin_insert ON public.lxp_audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

INSERT INTO public.lxp_institution_settings (key, value)
VALUES
  ('institution', '{"name":"Instituição LXP","supportEmail":"suporte@lxp.edu.br"}'::jsonb),
  ('smtp', '{"enabled":false,"host":"","port":587,"fromEmail":""}'::jsonb)
ON CONFLICT (key) DO NOTHING;
