-- Padronizacao definitiva: lxp_course_library_links aceita apenas tipo "discipline".
-- Como os dados ainda nao sao oficiais, removemos qualquer resquicio legado.

UPDATE public.lxp_course_library_links
SET library_content_type = 'discipline'
WHERE library_content_type <> 'discipline';

ALTER TABLE public.lxp_course_library_links
  DROP CONSTRAINT IF EXISTS lxp_course_library_links_type_check;

ALTER TABLE public.lxp_course_library_links
  ADD CONSTRAINT lxp_course_library_links_type_check
  CHECK (library_content_type = 'discipline');
