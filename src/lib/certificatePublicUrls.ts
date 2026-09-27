/**
 * Portal do aluno — QR e validação sempre apontam para o app alunos, não o backoffice.
 * Production requires VITE_LXP_ALUNOS_PUBLIC_ORIGIN; homolog fallback only in non-PROD.
 */
const HOMOLOG_ALUNOS_ORIGIN = "https://lxp-alunos.vercel.app";

export function getCertificatePublicOrigin(): string {
  const fromEnv = import.meta.env.VITE_LXP_ALUNOS_PUBLIC_ORIGIN?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  if (import.meta.env.PROD) {
    throw new Error("VITE_LXP_ALUNOS_PUBLIC_ORIGIN is required in production");
  }
  return HOMOLOG_ALUNOS_ORIGIN;
}

export function buildCertificateValidationUrl(validationCode: string): string {
  const code = validationCode.trim();
  const origin = getCertificatePublicOrigin();
  return `${origin}/validar-certificado?code=${encodeURIComponent(code)}`;
}
