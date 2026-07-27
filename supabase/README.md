# Supabase — LXP Backoffice

Canonical SQL and Edge Functions for the shared B42 LXP Supabase project.

| Path | Purpose |
|------|---------|
| `functions/` | Edge Functions (invite, student admin, SMTP, auth email) |
| `migrations/` | Schema / RLS / RPCs for a **new** environment (apply in filename order) |
| `seeds/` | Homologation / demo data only — **never** run on production automatically |
| `archive/` | Historical or out-of-scope scripts — **do not** apply on a fresh install |

## Fresh install (production or new project)

1. Create an empty Supabase project.
2. Apply every file in `migrations/` in ascending numeric prefix order (`001_` … `043_`).
   - Supabase Dashboard → SQL Editor, or MCP `apply_migration`.
3. Deploy Edge Functions from `functions/` and set project secrets (see `functions/README.md`).
4. Configure Auth Hook URL for `auth-send-email` when using custom SMTP.
5. Point both frontends (`lxp-alunos`, `lxp-backoffice`) at the new project URL and anon key.
6. Optionally run selected scripts from `seeds/` **only** on homologation.

Do **not** run `seeds/` or `archive/` as part of the production cutover path.

## Numbering notes

- There is no STEP 1 or STEP 3 in this package (historical gaps).
- Two distinct STEP 7 scripts exist: `7A` (student phone/birth date) and `7B` (team members admin policy). Both are required.
- STEP 24 is omitted from `migrations/` because STEP 25 recreates the same default-template helper.
- Homolog reference project already includes STEPs through **42**; this folder is the install package for new environments.

## Local workspace mirror

Developers may keep a copy under the workspace folder `projetos-migrations/`.  
**Git source of truth:** this directory (`lxp-backoffice/supabase/`).

## Supabase CLI

`config.toml` / `supabase db push` is intentionally out of scope for this package version. Apply via SQL Editor or MCP until CLI wiring is added in a follow-up change.
