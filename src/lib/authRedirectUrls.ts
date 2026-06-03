/** URLs de redirect Auth (homolog Vercel). Sobrescreva via env em prod/local. */
const HOMOLOG_ORIGIN = "https://lxp-backoffice.vercel.app";

export const backofficeSetPasswordUrl = (
  import.meta.env.VITE_BACKOFFICE_SET_PASSWORD_URL ?? `${HOMOLOG_ORIGIN}/admin/definir-senha`
).trim();

/** Redirect de reset de senha de alunos (admin dispara e-mail → app alunos). */
export const lxpAlunosSetPasswordUrl = (
  import.meta.env.VITE_LXP_ALUNOS_SET_PASSWORD_URL ?? "https://lxp-alunos.vercel.app/definir-senha"
).trim();
