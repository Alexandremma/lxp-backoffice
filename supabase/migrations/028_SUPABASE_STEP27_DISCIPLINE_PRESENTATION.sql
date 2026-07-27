-- =====================================================================
-- STEP 27: apresentação da disciplina (descrição + capa) no portal do aluno
-- =====================================================================
-- Colunas em lxp_course_disciplines + bucket público discipline-covers
-- =====================================================================

ALTER TABLE public.lxp_course_disciplines
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS cover_image_path text;

COMMENT ON COLUMN public.lxp_course_disciplines.description IS
  'Texto exibido abaixo do título na página da disciplina (portal do aluno). Se vazio, usa a descrição do curso.';
COMMENT ON COLUMN public.lxp_course_disciplines.cover_image_path IS
  'Caminho da imagem de capa no bucket discipline-covers (Storage).';

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'discipline-covers',
  'discipline-covers',
  true,
  5242880,
  ARRAY['image/png', 'image/jpeg', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE
SET public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/webp']::text[];

DROP POLICY IF EXISTS discipline_covers_public_read ON storage.objects;
CREATE POLICY discipline_covers_public_read
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'discipline-covers');

DROP POLICY IF EXISTS discipline_covers_admin_insert ON storage.objects;
CREATE POLICY discipline_covers_admin_insert
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'discipline-covers' AND public.is_admin());

DROP POLICY IF EXISTS discipline_covers_admin_update ON storage.objects;
CREATE POLICY discipline_covers_admin_update
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'discipline-covers' AND public.is_admin())
  WITH CHECK (bucket_id = 'discipline-covers' AND public.is_admin());

DROP POLICY IF EXISTS discipline_covers_admin_delete ON storage.objects;
CREATE POLICY discipline_covers_admin_delete
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'discipline-covers' AND public.is_admin());
