-- =====================================================================
-- STEP 42: RLS writes alinhados à matriz RBAC (ADR-001 Opção P)
-- =====================================================================
-- SELECT administrativo: permanece `is_admin()` = qualquer membro em
--   backoffice_team_members (staff), como hoje na UI de listagens.
-- WRITE: helpers por capacidade da matriz do cliente
--   (permissions.ts / MATRIZ_PERMISSOES_BACKOFFICE_LXP_ENTREGA.csv).
-- Não altera a matriz de produto — só o SQL.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------

COMMENT ON FUNCTION public.is_admin() IS
  'STEP 42: staff = JWT app_metadata.role=admin OU linha em backoffice_team_members. Usar em SELECT administrativo; writes sensíveis usam helpers de role.';

CREATE OR REPLACE FUNCTION public.backoffice_team_can_edit_courses()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.backoffice_team_members AS actor
    WHERE actor.user_id = auth.uid()
      AND actor.role IN ('admin', 'coordinator', 'professor')
  );
$$;

CREATE OR REPLACE FUNCTION public.backoffice_team_can_delete_courses()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.backoffice_team_members AS actor
    WHERE actor.user_id = auth.uid()
      AND actor.role IN ('admin', 'coordinator')
  );
$$;

CREATE OR REPLACE FUNCTION public.backoffice_team_can_manage_enrollments()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- matriculas.editar / excluir: admin + coordenador (professor só criar)
  SELECT public.backoffice_team_can_manage();
$$;

CREATE OR REPLACE FUNCTION public.backoffice_team_can_write_gamification()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- XP rules + badges (não níveis): admin + coordenador
  SELECT public.backoffice_team_can_manage();
$$;

GRANT EXECUTE ON FUNCTION public.backoffice_team_can_edit_courses() TO authenticated;
GRANT EXECUTE ON FUNCTION public.backoffice_team_can_delete_courses() TO authenticated;
GRANT EXECUTE ON FUNCTION public.backoffice_team_can_manage_enrollments() TO authenticated;
GRANT EXECUTE ON FUNCTION public.backoffice_team_can_write_gamification() TO authenticated;

REVOKE ALL ON FUNCTION public.backoffice_team_can_edit_courses() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.backoffice_team_can_edit_courses() FROM anon;
REVOKE ALL ON FUNCTION public.backoffice_team_can_delete_courses() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.backoffice_team_can_delete_courses() FROM anon;
REVOKE ALL ON FUNCTION public.backoffice_team_can_manage_enrollments() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.backoffice_team_can_manage_enrollments() FROM anon;
REVOKE ALL ON FUNCTION public.backoffice_team_can_write_gamification() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.backoffice_team_can_write_gamification() FROM anon;

-- Endurece helpers STEP 39 (remove anon se existir)
REVOKE ALL ON FUNCTION public.backoffice_team_can_manage() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.backoffice_team_can_manage() FROM anon;
GRANT EXECUTE ON FUNCTION public.backoffice_team_can_manage() TO authenticated;

REVOKE ALL ON FUNCTION public.backoffice_team_is_admin_role() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.backoffice_team_is_admin_role() FROM anon;
GRANT EXECUTE ON FUNCTION public.backoffice_team_is_admin_role() TO authenticated;

-- ---------------------------------------------------------------------
-- Cursos / períodos / disciplinas / library links
-- ---------------------------------------------------------------------

DROP POLICY IF EXISTS lxp_courses_admin_all ON public.lxp_courses;
CREATE POLICY lxp_courses_staff_select ON public.lxp_courses
  FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY lxp_courses_staff_insert ON public.lxp_courses
  FOR INSERT TO authenticated WITH CHECK (public.backoffice_team_can_edit_courses());
CREATE POLICY lxp_courses_staff_update ON public.lxp_courses
  FOR UPDATE TO authenticated
  USING (public.backoffice_team_can_edit_courses())
  WITH CHECK (public.backoffice_team_can_edit_courses());
CREATE POLICY lxp_courses_staff_delete ON public.lxp_courses
  FOR DELETE TO authenticated USING (public.backoffice_team_can_delete_courses());

DROP POLICY IF EXISTS lxp_course_periods_admin_all ON public.lxp_course_periods;
CREATE POLICY lxp_course_periods_staff_select ON public.lxp_course_periods
  FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY lxp_course_periods_staff_insert ON public.lxp_course_periods
  FOR INSERT TO authenticated WITH CHECK (public.backoffice_team_can_edit_courses());
CREATE POLICY lxp_course_periods_staff_update ON public.lxp_course_periods
  FOR UPDATE TO authenticated
  USING (public.backoffice_team_can_edit_courses())
  WITH CHECK (public.backoffice_team_can_edit_courses());
CREATE POLICY lxp_course_periods_staff_delete ON public.lxp_course_periods
  FOR DELETE TO authenticated USING (public.backoffice_team_can_delete_courses());

DROP POLICY IF EXISTS lxp_course_disciplines_admin_all ON public.lxp_course_disciplines;
CREATE POLICY lxp_course_disciplines_staff_select ON public.lxp_course_disciplines
  FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY lxp_course_disciplines_staff_insert ON public.lxp_course_disciplines
  FOR INSERT TO authenticated WITH CHECK (public.backoffice_team_can_edit_courses());
CREATE POLICY lxp_course_disciplines_staff_update ON public.lxp_course_disciplines
  FOR UPDATE TO authenticated
  USING (public.backoffice_team_can_edit_courses())
  WITH CHECK (public.backoffice_team_can_edit_courses());
CREATE POLICY lxp_course_disciplines_staff_delete ON public.lxp_course_disciplines
  FOR DELETE TO authenticated USING (public.backoffice_team_can_delete_courses());

DROP POLICY IF EXISTS lxp_course_library_links_admin_all ON public.lxp_course_library_links;
CREATE POLICY lxp_course_library_links_staff_select ON public.lxp_course_library_links
  FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY lxp_course_library_links_staff_insert ON public.lxp_course_library_links
  FOR INSERT TO authenticated WITH CHECK (public.backoffice_team_can_edit_courses());
CREATE POLICY lxp_course_library_links_staff_update ON public.lxp_course_library_links
  FOR UPDATE TO authenticated
  USING (public.backoffice_team_can_edit_courses())
  WITH CHECK (public.backoffice_team_can_edit_courses());
CREATE POLICY lxp_course_library_links_staff_delete ON public.lxp_course_library_links
  FOR DELETE TO authenticated USING (public.backoffice_team_can_delete_courses());

-- ---------------------------------------------------------------------
-- Matrículas
-- ---------------------------------------------------------------------

DROP POLICY IF EXISTS lxp_enrollments_admin_all ON public.lxp_enrollments;
CREATE POLICY lxp_enrollments_staff_select ON public.lxp_enrollments
  FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY lxp_enrollments_staff_insert ON public.lxp_enrollments
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY lxp_enrollments_staff_update ON public.lxp_enrollments
  FOR UPDATE TO authenticated
  USING (public.backoffice_team_can_manage_enrollments())
  WITH CHECK (public.backoffice_team_can_manage_enrollments());
CREATE POLICY lxp_enrollments_staff_delete ON public.lxp_enrollments
  FOR DELETE TO authenticated USING (public.backoffice_team_can_manage_enrollments());

-- ---------------------------------------------------------------------
-- Gamificação
-- ---------------------------------------------------------------------

DROP POLICY IF EXISTS lxp_gamification_xp_rules_admin ON public.lxp_gamification_xp_rules;
CREATE POLICY lxp_gamification_xp_rules_staff_write ON public.lxp_gamification_xp_rules
  FOR INSERT TO authenticated WITH CHECK (public.backoffice_team_can_write_gamification());
CREATE POLICY lxp_gamification_xp_rules_staff_update ON public.lxp_gamification_xp_rules
  FOR UPDATE TO authenticated
  USING (public.backoffice_team_can_write_gamification())
  WITH CHECK (public.backoffice_team_can_write_gamification());
CREATE POLICY lxp_gamification_xp_rules_staff_delete ON public.lxp_gamification_xp_rules
  FOR DELETE TO authenticated USING (public.backoffice_team_can_write_gamification());

DROP POLICY IF EXISTS lxp_gamification_badges_admin ON public.lxp_gamification_badges;
CREATE POLICY lxp_gamification_badges_staff_write ON public.lxp_gamification_badges
  FOR INSERT TO authenticated WITH CHECK (public.backoffice_team_can_write_gamification());
CREATE POLICY lxp_gamification_badges_staff_update ON public.lxp_gamification_badges
  FOR UPDATE TO authenticated
  USING (public.backoffice_team_can_write_gamification())
  WITH CHECK (public.backoffice_team_can_write_gamification());
CREATE POLICY lxp_gamification_badges_staff_delete ON public.lxp_gamification_badges
  FOR DELETE TO authenticated USING (public.backoffice_team_can_write_gamification());

DROP POLICY IF EXISTS lxp_gamification_levels_admin ON public.lxp_gamification_levels;
CREATE POLICY lxp_gamification_levels_admin_write ON public.lxp_gamification_levels
  FOR INSERT TO authenticated WITH CHECK (public.backoffice_team_is_admin_role());
CREATE POLICY lxp_gamification_levels_admin_update ON public.lxp_gamification_levels
  FOR UPDATE TO authenticated
  USING (public.backoffice_team_is_admin_role())
  WITH CHECK (public.backoffice_team_is_admin_role());
CREATE POLICY lxp_gamification_levels_admin_delete ON public.lxp_gamification_levels
  FOR DELETE TO authenticated USING (public.backoffice_team_is_admin_role());

-- ---------------------------------------------------------------------
-- Certificados (templates / assinaturas = só admin; issues = staff)
-- ---------------------------------------------------------------------

DROP POLICY IF EXISTS lxp_certificate_templates_admin_all ON public.lxp_certificate_templates;
CREATE POLICY lxp_certificate_templates_staff_select ON public.lxp_certificate_templates
  FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY lxp_certificate_templates_admin_insert ON public.lxp_certificate_templates
  FOR INSERT TO authenticated WITH CHECK (public.backoffice_team_is_admin_role());
CREATE POLICY lxp_certificate_templates_admin_update ON public.lxp_certificate_templates
  FOR UPDATE TO authenticated
  USING (public.backoffice_team_is_admin_role())
  WITH CHECK (public.backoffice_team_is_admin_role());
CREATE POLICY lxp_certificate_templates_admin_delete ON public.lxp_certificate_templates
  FOR DELETE TO authenticated USING (public.backoffice_team_is_admin_role());

DROP POLICY IF EXISTS lxp_certificate_signatures_admin_all ON public.lxp_certificate_signatures;
CREATE POLICY lxp_certificate_signatures_staff_select ON public.lxp_certificate_signatures
  FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY lxp_certificate_signatures_admin_insert ON public.lxp_certificate_signatures
  FOR INSERT TO authenticated WITH CHECK (public.backoffice_team_is_admin_role());
CREATE POLICY lxp_certificate_signatures_admin_update ON public.lxp_certificate_signatures
  FOR UPDATE TO authenticated
  USING (public.backoffice_team_is_admin_role())
  WITH CHECK (public.backoffice_team_is_admin_role());
CREATE POLICY lxp_certificate_signatures_admin_delete ON public.lxp_certificate_signatures
  FOR DELETE TO authenticated USING (public.backoffice_team_is_admin_role());

DROP POLICY IF EXISTS lxp_cert_tmpl_sigs_admin_all ON public.lxp_certificate_template_signatures;
CREATE POLICY lxp_cert_tmpl_sigs_staff_select ON public.lxp_certificate_template_signatures
  FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY lxp_cert_tmpl_sigs_admin_insert ON public.lxp_certificate_template_signatures
  FOR INSERT TO authenticated WITH CHECK (public.backoffice_team_is_admin_role());
CREATE POLICY lxp_cert_tmpl_sigs_admin_update ON public.lxp_certificate_template_signatures
  FOR UPDATE TO authenticated
  USING (public.backoffice_team_is_admin_role())
  WITH CHECK (public.backoffice_team_is_admin_role());
CREATE POLICY lxp_cert_tmpl_sigs_admin_delete ON public.lxp_certificate_template_signatures
  FOR DELETE TO authenticated USING (public.backoffice_team_is_admin_role());

-- Emissões: admin/coord/prof podem emitir — mantém staff (is_admin)
-- (policy lxp_certificate_issues_admin_all permanece)

-- ---------------------------------------------------------------------
-- Configurações instituição — só admin
-- ---------------------------------------------------------------------

DROP POLICY IF EXISTS institution_settings_admin_all ON public.lxp_institution_settings;
CREATE POLICY institution_settings_admin_all ON public.lxp_institution_settings
  FOR ALL TO authenticated
  USING (public.backoffice_team_is_admin_role())
  WITH CHECK (public.backoffice_team_is_admin_role());

-- ---------------------------------------------------------------------
-- Progresso / XP / notas (SELECT staff; WRITE admin|coordenador)
-- ---------------------------------------------------------------------

DROP POLICY IF EXISTS lxp_lesson_progress_admin_all ON public.lxp_student_lesson_progress;
CREATE POLICY lxp_lesson_progress_staff_select ON public.lxp_student_lesson_progress
  FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY lxp_lesson_progress_staff_write ON public.lxp_student_lesson_progress
  FOR INSERT TO authenticated WITH CHECK (public.backoffice_team_can_manage());
CREATE POLICY lxp_lesson_progress_staff_update ON public.lxp_student_lesson_progress
  FOR UPDATE TO authenticated
  USING (public.backoffice_team_can_manage())
  WITH CHECK (public.backoffice_team_can_manage());
CREATE POLICY lxp_lesson_progress_staff_delete ON public.lxp_student_lesson_progress
  FOR DELETE TO authenticated USING (public.backoffice_team_can_manage());

DROP POLICY IF EXISTS lxp_progress_admin_all ON public.lxp_student_discipline_progress;
CREATE POLICY lxp_discipline_progress_staff_select ON public.lxp_student_discipline_progress
  FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY lxp_discipline_progress_staff_write ON public.lxp_student_discipline_progress
  FOR INSERT TO authenticated WITH CHECK (public.backoffice_team_can_manage());
CREATE POLICY lxp_discipline_progress_staff_update ON public.lxp_student_discipline_progress
  FOR UPDATE TO authenticated
  USING (public.backoffice_team_can_manage())
  WITH CHECK (public.backoffice_team_can_manage());
CREATE POLICY lxp_discipline_progress_staff_delete ON public.lxp_student_discipline_progress
  FOR DELETE TO authenticated USING (public.backoffice_team_can_manage());

DROP POLICY IF EXISTS lxp_xp_events_admin ON public.lxp_student_xp_events;
CREATE POLICY lxp_xp_events_staff_select ON public.lxp_student_xp_events
  FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY lxp_xp_events_staff_write ON public.lxp_student_xp_events
  FOR INSERT TO authenticated WITH CHECK (public.backoffice_team_can_manage());
CREATE POLICY lxp_xp_events_staff_update ON public.lxp_student_xp_events
  FOR UPDATE TO authenticated
  USING (public.backoffice_team_can_manage())
  WITH CHECK (public.backoffice_team_can_manage());
CREATE POLICY lxp_xp_events_staff_delete ON public.lxp_student_xp_events
  FOR DELETE TO authenticated USING (public.backoffice_team_can_manage());

DROP POLICY IF EXISTS lxp_badge_awards_admin ON public.lxp_student_badge_awards;
CREATE POLICY lxp_badge_awards_staff_select ON public.lxp_student_badge_awards
  FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY lxp_badge_awards_staff_write ON public.lxp_student_badge_awards
  FOR INSERT TO authenticated WITH CHECK (public.backoffice_team_can_manage());
CREATE POLICY lxp_badge_awards_staff_update ON public.lxp_student_badge_awards
  FOR UPDATE TO authenticated
  USING (public.backoffice_team_can_manage())
  WITH CHECK (public.backoffice_team_can_manage());
CREATE POLICY lxp_badge_awards_staff_delete ON public.lxp_student_badge_awards
  FOR DELETE TO authenticated USING (public.backoffice_team_can_manage());

DROP POLICY IF EXISTS lxp_daily_access_admin ON public.lxp_student_daily_access;
CREATE POLICY lxp_daily_access_staff_select ON public.lxp_student_daily_access
  FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY lxp_daily_access_staff_write ON public.lxp_student_daily_access
  FOR INSERT TO authenticated WITH CHECK (public.backoffice_team_can_manage());
CREATE POLICY lxp_daily_access_staff_update ON public.lxp_student_daily_access
  FOR UPDATE TO authenticated
  USING (public.backoffice_team_can_manage())
  WITH CHECK (public.backoffice_team_can_manage());
CREATE POLICY lxp_daily_access_staff_delete ON public.lxp_student_daily_access
  FOR DELETE TO authenticated USING (public.backoffice_team_can_manage());

DROP POLICY IF EXISTS lxp_lesson_notes_admin ON public.lxp_lesson_notes;
CREATE POLICY lxp_lesson_notes_staff_select ON public.lxp_lesson_notes
  FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY lxp_lesson_notes_staff_write ON public.lxp_lesson_notes
  FOR INSERT TO authenticated WITH CHECK (public.backoffice_team_can_manage());
CREATE POLICY lxp_lesson_notes_staff_update ON public.lxp_lesson_notes
  FOR UPDATE TO authenticated
  USING (public.backoffice_team_can_manage())
  WITH CHECK (public.backoffice_team_can_manage());
CREATE POLICY lxp_lesson_notes_staff_delete ON public.lxp_lesson_notes
  FOR DELETE TO authenticated USING (public.backoffice_team_can_manage());

-- ---------------------------------------------------------------------
-- Storage
-- ---------------------------------------------------------------------

DROP POLICY IF EXISTS certificate_signatures_admin_insert ON storage.objects;
DROP POLICY IF EXISTS certificate_signatures_admin_update ON storage.objects;
DROP POLICY IF EXISTS certificate_signatures_admin_delete ON storage.objects;
CREATE POLICY certificate_signatures_admin_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'certificate-signatures' AND public.backoffice_team_is_admin_role());
CREATE POLICY certificate_signatures_admin_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'certificate-signatures' AND public.backoffice_team_is_admin_role())
  WITH CHECK (bucket_id = 'certificate-signatures' AND public.backoffice_team_is_admin_role());
CREATE POLICY certificate_signatures_admin_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'certificate-signatures' AND public.backoffice_team_is_admin_role());

DROP POLICY IF EXISTS institution_branding_admin_insert ON storage.objects;
DROP POLICY IF EXISTS institution_branding_admin_update ON storage.objects;
DROP POLICY IF EXISTS institution_branding_admin_delete ON storage.objects;
CREATE POLICY institution_branding_admin_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'institution-branding' AND public.backoffice_team_is_admin_role());
CREATE POLICY institution_branding_admin_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'institution-branding' AND public.backoffice_team_is_admin_role())
  WITH CHECK (bucket_id = 'institution-branding' AND public.backoffice_team_is_admin_role());
CREATE POLICY institution_branding_admin_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'institution-branding' AND public.backoffice_team_is_admin_role());

DROP POLICY IF EXISTS discipline_covers_admin_insert ON storage.objects;
DROP POLICY IF EXISTS discipline_covers_admin_update ON storage.objects;
DROP POLICY IF EXISTS discipline_covers_admin_delete ON storage.objects;
CREATE POLICY discipline_covers_admin_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'discipline-covers' AND public.backoffice_team_can_edit_courses());
CREATE POLICY discipline_covers_admin_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'discipline-covers' AND public.backoffice_team_can_edit_courses())
  WITH CHECK (bucket_id = 'discipline-covers' AND public.backoffice_team_can_edit_courses());
CREATE POLICY discipline_covers_admin_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'discipline-covers' AND public.backoffice_team_can_edit_courses());
