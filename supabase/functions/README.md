# Supabase Edge Functions

## invite-team-member

Fluxo de convite do Backoffice Equipe:

1. Usu?rio admin chama a fun??o via frontend.
2. A fun??o valida o JWT chamador (somente role `admin`).
3. Na action `create`: valida limite do plano (`subscription.limits.teamMembers` vs contagem em `backoffice_team_members`); retorna `403 PLAN_LIMIT_REACHED` se no teto.
4. A fun??o cria convite no Auth (`inviteUserByEmail`).
5. A fun??o grava o v?nculo em `public.backoffice_team_members`.

Action `resend` n?o valida limite (membro j? existe).

Front espelha a regra via `assertCanCreateTeamMember()` em `lib/planLimits.ts` antes do invoke.

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
