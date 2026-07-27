-- Regra A: 1 disciplina interna <-> 1 disciplina externa
-- Garante no banco que cada course_discipline_id tenha no máximo
-- um vínculo com library_content_type = 'discipline'.

CREATE UNIQUE INDEX IF NOT EXISTS lxp_course_library_links_one_discipline_per_course_discipline
ON public.lxp_course_library_links (course_discipline_id)
WHERE library_content_type = 'discipline';
