-- STEP 30: valores iniciais vazios em institution (placeholders ficam na UI)
-- Aplica em homolog após STEP 29 para substituir seeds de demonstração.

UPDATE public.lxp_institution_settings
SET
  value = jsonb_build_object(
    'name', '',
    'cnpj', '',
    'contactEmail', '',
    'phone', '',
    'address', '',
    'logoPath', null
  ),
  updated_at = now()
WHERE key = 'institution';
