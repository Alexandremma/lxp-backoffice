-- =====================================================================
-- STEP 40: avatares de perfil (lxp_profiles + Storage user-avatars)
-- =====================================================================
-- Path no Storage: {auth.uid()}/avatar.{ext} — gravado em lxp_profiles.avatar_path.
-- Leitura pública via bucket; escrita apenas na pasta do próprio usuário.
-- RPC lxp_get_profile_display: campos seguros para UI (comentários, etc.).
-- =====================================================================

ALTER TABLE public.lxp_profiles
  ADD COLUMN IF NOT EXISTS avatar_path text;

COMMENT ON COLUMN public.lxp_profiles.avatar_path IS
  'Caminho relativo no bucket user-avatars (ex.: {user_id}/avatar.webp). Primeiro segmento deve ser user_id.';

ALTER TABLE public.lxp_profiles
  DROP CONSTRAINT IF EXISTS lxp_profiles_avatar_path_owned;

ALTER TABLE public.lxp_profiles
  ADD CONSTRAINT lxp_profiles_avatar_path_owned CHECK (
    avatar_path IS NULL
    OR split_part(avatar_path, '/', 1) = user_id::text
  );

-- ---------------------------------------------------------------------
-- Storage bucket
-- ---------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-avatars',
  'user-avatars',
  true,
  2097152,
  ARRAY['image/png', 'image/jpeg', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE
SET public = true,
    file_size_limit = 2097152,
    allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/webp']::text[];

DROP POLICY IF EXISTS user_avatars_public_read ON storage.objects;
CREATE POLICY user_avatars_public_read
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'user-avatars');

DROP POLICY IF EXISTS user_avatars_owner_insert ON storage.objects;
CREATE POLICY user_avatars_owner_insert
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'user-avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS user_avatars_owner_update ON storage.objects;
CREATE POLICY user_avatars_owner_update
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'user-avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'user-avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS user_avatars_owner_delete ON storage.objects;
CREATE POLICY user_avatars_owner_delete
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'user-avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------------------------------------------------------------------
-- RPC: exibição pública limitada (sem PII)
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.lxp_get_profile_display(p_profile_ids uuid[])
RETURNS TABLE (
  id uuid,
  name text,
  avatar_path text,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.name, p.avatar_path, p.updated_at
  FROM public.lxp_profiles p
  WHERE p.id IN (
    SELECT DISTINCT u
    FROM unnest(COALESCE(p_profile_ids, ARRAY[]::uuid[])) AS u
    LIMIT 50
  );
$$;

REVOKE ALL ON FUNCTION public.lxp_get_profile_display(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lxp_get_profile_display(uuid[]) TO authenticated;

COMMENT ON FUNCTION public.lxp_get_profile_display(uuid[]) IS
  'Retorna id, name, avatar_path e updated_at para até 50 perfis (UI: comentários, avatares). Sem e-mail/telefone.';
