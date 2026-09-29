/**
 * Auth redirect URLs. Production requires env; homolog fallback only in non-PROD builds.
 */
const HOMOLOG_BO_ORIGIN = "https://lxp-backoffice.vercel.app";
const HOMOLOG_ALUNOS_SET_PASSWORD = "https://lxp-alunos.vercel.app/definir-senha";

function resolveUrl(envName: string, envValue: string | undefined, fallback: string): string {
  const fromEnv = envValue?.trim();
  if (fromEnv) return fromEnv;
  if (import.meta.env.PROD) {
    throw new Error(`${envName} is required in production`);
  }
  return fallback;
}

export const backofficeSetPasswordUrl = resolveUrl(
  "VITE_BACKOFFICE_SET_PASSWORD_URL",
  import.meta.env.VITE_BACKOFFICE_SET_PASSWORD_URL,
  `${HOMOLOG_BO_ORIGIN}/admin/definir-senha`,
);

/** Redirect de reset de senha de alunos (admin dispara e-mail → app alunos). */
export const lxpAlunosSetPasswordUrl = resolveUrl(
  "VITE_LXP_ALUNOS_SET_PASSWORD_URL",
  import.meta.env.VITE_LXP_ALUNOS_SET_PASSWORD_URL,
  HOMOLOG_ALUNOS_SET_PASSWORD,
);
