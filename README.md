# LXP Backoffice

Backoffice administrativo do ecossistema **B42 LXP** (Vite + React + TypeScript + Supabase).  
Fonte canônica de migrations e Edge Functions: `supabase/`.

## Desenvolvimento

```bash
npm install
cp .env.example .env   # preencher VITE_SUPABASE_* e Alice
npm run dev            # http://localhost:8081
```

## Scripts

| Comando | Uso |
|---------|-----|
| `npm run dev` | Dev server |
| `npm run build` | Build produção |
| `npm run preview` | Preview do build |
| `npm test` | Vitest |

## Supabase

```bash
# na pasta do projeto, com CLI autenticada
supabase link --project-ref <ref>
supabase functions deploy <nome>
```

Ver `supabase/functions/README.md` e `supabase/migrations/APPLY_ORDER.md`.

## Deploy

Homolog/produção via **Vercel** (branch `main`). Variáveis: ver `.env.example` e `docs-central/spec-kit/08_AMBIENTE_DEPLOY.md`.
