-- STEP 12: allow student self-enrollment updates/inserts
-- Enables "Inscrever-se" flow in LXP Alunos.

create policy lxp_enrollments_student_insert_own
on public.lxp_enrollments
for insert
to authenticated
with check (
  is_student()
  and exists (
    select 1
    from public.lxp_profiles p
    where p.id = lxp_enrollments.student_profile_id
      and p.user_id = auth.uid()
  )
);

create policy lxp_enrollments_student_update_own
on public.lxp_enrollments
for update
to authenticated
using (
  is_student()
  and exists (
    select 1
    from public.lxp_profiles p
    where p.id = lxp_enrollments.student_profile_id
      and p.user_id = auth.uid()
  )
)
with check (
  is_student()
  and exists (
    select 1
    from public.lxp_profiles p
    where p.id = lxp_enrollments.student_profile_id
      and p.user_id = auth.uid()
  )
);
