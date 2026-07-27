-- Garante linha em lxp_profiles para admin@lxp.edu.br (useAuth + ProtectedRoute no backoffice).
-- Idempotente: só insere se não existir perfil com o mesmo user_id (auth.users.id).

insert into public.lxp_profiles (id, user_id, name, email, role)
select gen_random_uuid(), u.id, 'Administrador LXP', u.email, 'admin'
from auth.users u
where u.email = 'admin@lxp.edu.br'
  and not exists (
    select 1 from public.lxp_profiles p where p.user_id = u.id
  );
