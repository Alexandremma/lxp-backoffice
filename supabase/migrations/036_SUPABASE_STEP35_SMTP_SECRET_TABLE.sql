-- STEP 35 — SMTP: senha institucional fora do jsonb (ciphertext só para service role / Edge)
-- Aplicar em homolog antes de deploy das Edge Functions update-smtp-settings / send-test-email / auth-send-email.

CREATE TABLE IF NOT EXISTS public.lxp_institution_smtp_secret (
  id text PRIMARY KEY DEFAULT 'institution',
  password_ciphertext text NOT NULL,
  password_iv text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.lxp_profiles(id) ON DELETE SET NULL
);

ALTER TABLE public.lxp_institution_smtp_secret ENABLE ROW LEVEL SECURITY;

-- Sem policies: anon/authenticated não leem nem escrevem; service role bypassa RLS.

UPDATE public.lxp_institution_settings
SET value = (value - 'password')
  || jsonb_build_object(
    'passwordConfigured',
    CASE
      WHEN (value ? 'password') AND coalesce(value->>'password', '') <> '' THEN true
      ELSE coalesce((value->>'passwordConfigured')::boolean, false)
    END
  )
WHERE key = 'smtp';

INSERT INTO public.lxp_institution_settings (key, value)
VALUES (
  'smtp',
  jsonb_build_object(
    'enabled', false,
    'host', '',
    'port', 587,
    'user', '',
    'fromEmail', '',
    'fromName', 'LXP Instituição',
    'replyTo', '',
    'secure', true,
    'passwordConfigured', false
  )
)
ON CONFLICT (key) DO NOTHING;
