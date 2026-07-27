-- =====================================================================
-- STEP 37: layout personalizado com imagem de fundo no template
-- =====================================================================
-- layout_kind: default = borda roxa atual; custom = fundo com imagem A4 paisagem.
-- background_image_path: Storage bucket certificate-signatures (templates/{id}/background.*)
-- =====================================================================

ALTER TABLE public.lxp_certificate_templates
  ADD COLUMN IF NOT EXISTS layout_kind text NOT NULL DEFAULT 'default'
    CHECK (layout_kind IN ('default', 'custom')),
  ADD COLUMN IF NOT EXISTS background_image_path text;

COMMENT ON COLUMN public.lxp_certificate_templates.layout_kind IS
  'default = borda roxa atual; custom = fundo com imagem de arte personalizada.';

COMMENT ON COLUMN public.lxp_certificate_templates.background_image_path IS
  'Caminho da imagem de fundo no bucket certificate-signatures (somente layout custom).';
