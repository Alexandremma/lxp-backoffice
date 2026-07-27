-- Correção: aluno não conseguia concluir aula porque o upsert em
-- lxp_student_discipline_progress faz UPDATE em linhas já existentes (seed),
-- e sem FOR UPDATE o RLS bloqueava (só havia SELECT + INSERT + admin ALL).
-- Aplicar no SQL Editor do Supabase se a migration remota ainda não existir.

DROP POLICY IF EXISTS lxp_progress_student_update_own ON public.lxp_student_discipline_progress;

CREATE POLICY lxp_progress_student_update_own
ON public.lxp_student_discipline_progress
FOR UPDATE
TO authenticated
USING (
  public.is_student()
  AND EXISTS (
    SELECT 1
    FROM public.lxp_profiles p
    WHERE p.id = lxp_student_discipline_progress.student_profile_id
      AND p.user_id = auth.uid()
  )
)
WITH CHECK (
  public.is_student()
  AND EXISTS (
    SELECT 1
    FROM public.lxp_profiles p
    WHERE p.id = lxp_student_discipline_progress.student_profile_id
      AND p.user_id = auth.uid()
  )
);
