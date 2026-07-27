-- Corrige erro 500 / "stack depth limit exceeded" ao consultar lxp_courses (e outras tabelas)
-- via PostgREST: a função is_student() lia public.lxp_profiles com RLS ativo dentro de policies
-- que também chamam is_student(), gerando recursão infinita.
--
-- SECURITY DEFINER + search_path fixo: a checagem de perfil/backoffice não reentra em RLS
-- de forma recursiva (o dono da função avalia as linhas sem o ciclo de policies do invoker).

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
    or exists (
      select 1
      from public.backoffice_team_members b
      where b.user_id = auth.uid()
    );
$$;

create or replace function public.is_student()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'student', false)
    or exists (
      select 1
      from public.lxp_profiles p
      where p.user_id = auth.uid()
        and coalesce(p.role, 'student') = 'student'
    );
$$;

grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_student() to authenticated;
