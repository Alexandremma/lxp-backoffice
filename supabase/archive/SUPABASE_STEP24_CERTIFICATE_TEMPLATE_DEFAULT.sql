-- Step 24: template padrão na emissão automática de certificados

CREATE OR REPLACE FUNCTION public.lxp_get_default_certificate_template_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id
  FROM public.lxp_certificate_templates
  WHERE is_active = true
  ORDER BY is_default DESC NULLS LAST, created_at ASC
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.lxp_get_default_certificate_template_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lxp_get_default_certificate_template_id() TO authenticated;
