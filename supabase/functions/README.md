# Supabase Edge Functions

## invite-team-member

Fluxo de convite do Backoffice Equipe:

1. Usuùrio admin chama a funùùo via frontend.
2. A funùùo valida o JWT chamador (admin ou coordenador).
3. Na action `create`: valida limite do plano.
4. A funùùo cria convite no Auth (`inviteUserByEmail`).
5. O e-mail de convite ù enviado pelo **Send Email Auth Hook** (`auth-send-email`) quando configurado.

```bash
supabase functions deploy invite-team-member
```

## manage-student-admin

Fluxo administrativo de alunos (create / block / delete).

```bash
supabase functions deploy manage-student-admin
```

## update-smtp-settings

Salva configuraùùo SMTP pùblica em `lxp_institution_settings` e senha criptografada em `lxp_institution_smtp_secret`. Somente **admin** (`backoffice_team_members.role = admin`).

```bash
supabase functions deploy update-smtp-settings
```

## send-test-email

Envia e-mail de teste usando SMTP institucional ou fallback B42. Audit `smtp.test_sent`.

```bash
supabase functions deploy send-test-email
```

## auth-send-email

**Send Email Auth Hook** ù convites, recuperaùùo de senha, magic link, confirmaùùo de cadastro. Registrar no Dashboard (Authentication ? Hooks).

```bash
supabase functions deploy auth-send-email --no-verify-jwt
```

> O hook do Auth valida assinatura (`SEND_EMAIL_HOOK_SECRET`), n„o JWT de usu·rio.

---

### Secrets SMTP

| Secret | Obrigatùrio | Uso |
|--------|-------------|-----|
| `SMTP_CREDENTIALS_ENCRYPTION_KEY` | Sim | AES-256-GCM para senha institucional (`openssl rand -base64 32`) |
| `B42_SMTP_HOST` ù `B42_SMTP_PASSWORD` | Fallback | SMTP B42 quando instituiùùo inativa |
| `SEND_EMAIL_HOOK_SECRET` | Auth Hook | Secret gerado no Dashboard ao registrar o hook |
| `SMTP_TEST_ALLOWLIST` | Opcional | Restringe destinatùrios do teste em homolog |

Ver [`docs-central/SMTP_FASE6_GUIA_OPERACIONAL.md`](../../../docs-central/SMTP_FASE6_GUIA_OPERACIONAL.md).

### Secrets runtime (jù existem no Supabase hospedado)

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`
