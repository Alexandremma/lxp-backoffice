# Supabase Edge Functions

## invite-team-member

Fluxo de convite do Backoffice Equipe:

1. Usuário admin chama a função via frontend.
2. A função valida o JWT chamador.
3. A função cria convite no Auth (`inviteUserByEmail`).
4. A função grava o vínculo em `public.backoffice_team_members`.

### Deploy

```bash
supabase functions deploy invite-team-member
```

## manage-student-admin

Fluxo administrativo de alunos no Backoffice:

1. Cria aluno com convite no Auth e perfil em `lxp_profiles`.
2. Cria matr?culas iniciais em `lxp_enrollments`.
3. Bloqueia/desbloqueia acesso (Auth + status de matr?culas).
4. Exclui aluno via Auth (com cascata no dom?nio).

### Deploy

```bash
supabase functions deploy manage-student-admin
```

### Secrets necessárias

Em projetos Supabase hospedados, estas variáveis já existem no runtime:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Se estiver em ambiente self-host/local, garanta que as duas estejam configuradas.
