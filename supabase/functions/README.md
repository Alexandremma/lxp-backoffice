# Supabase Edge Functions

## invite-team-member

Fluxo de convite do Backoffice Equipe:

1. Usuário admin chama a função via frontend.
2. A função valida o JWT chamador (admin ou coordenador).
3. Na action `create`: valida limite do plano.
4. A função cria convite no Auth (`inviteUserByEmail`).
5. O e-mail de convite é enviado pelo **Send Email Auth Hook** (`auth-send-email`) quando configurado.

```bash
supabase functions deploy invite-team-member
```

## manage-student-admin

Fluxo administrativo de alunos (create / block / delete).

```bash
supabase functions deploy manage-student-admin
```

## update-smtp-settings

Salva configuração SMTP pública em `lxp_institution_settings` e senha criptografada em `lxp_institution_smtp_secret`. Somente **admin**.

```bash
supabase functions deploy update-smtp-settings
```

## send-test-email

Envia e-mail de teste usando SMTP institucional ou fallback B42. Audit `smtp.test_sent`.

```bash
supabase functions deploy send-test-email
```

## auth-send-email

**Send Email Auth Hook** ? convites, recuperação de senha, magic link, confirmação de cadastro. Registrar no Dashboard (Authentication ? Hooks).

```bash
supabase functions deploy auth-send-email --no-verify-jwt
```

> O hook do Auth valida assinatura (`SEND_EMAIL_HOOK_SECRET`), não JWT de usuário.

## ai-tutor-chat

Proxy do Tutor IA (MAIA) usado pelo `lxp-alunos` na sidebar da aula.

- **POST** `{ question, rent_hash, conversation_id? }` ? SSE para `POST /chat/dev_fellowship/stream`
- **GET** `?conversation_id=&limit=` ? JSON `GET /conversations/{id}`

Exige JWT autenticado. A `MAIA_API_KEY` fica **só** nos secrets da Edge (nunca no front).

```bash
supabase secrets set MAIA_API_KEY="<chave>" MAIA_BASE_URL="https://apimaia.eadstock.com.br" MAIA_TENANT_ID="lxp_educacional_tutor_dev_fellowship_global"
supabase functions deploy ai-tutor-chat
```

Doc: [`docs-central/tutor-ia/dfl-integration.md`](../../../docs-central/tutor-ia/dfl-integration.md)

---

### Secrets SMTP

| Secret | Obrigatório | Uso |
|--------|-------------|-----|
| `SMTP_CREDENTIALS_ENCRYPTION_KEY` | Sim | AES-256-GCM para senha institucional |
| `B42_SMTP_HOST` ? `B42_SMTP_PASSWORD` | Fallback | SMTP B42 quando instituição inativa |
| `SEND_EMAIL_HOOK_SECRET` | Auth Hook | Secret do Dashboard |
| `SMTP_TEST_ALLOWLIST` | Opcional | Restringe destinatários do teste |

### Secrets Tutor IA (MAIA)

| Secret | Obrigatório | Uso |
|--------|-------------|-----|
| `MAIA_API_KEY` | Sim | Header `X-Api-Key` (consumer `dev_fellowship`) |
| `MAIA_BASE_URL` | Não | Default `https://apimaia.eadstock.com.br` |
| `MAIA_TENANT_ID` | Não | Default `lxp_educacional_tutor_dev_fellowship_global` |

### Secrets runtime (já existem no Supabase hospedado)

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`
