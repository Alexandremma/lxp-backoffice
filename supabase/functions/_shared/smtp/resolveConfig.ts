import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.8"
import { decryptSmtpPassword } from "./credentialCrypto.ts"
import type { ResolvedSmtpConfig, SmtpSettingsPublic } from "./types.ts"

function readB42Fallback(): ResolvedSmtpConfig | null {
  const host = Deno.env.get("B42_SMTP_HOST")?.trim()
  const portRaw = Deno.env.get("B42_SMTP_PORT")?.trim()
  const user = Deno.env.get("B42_SMTP_USER")?.trim() ?? ""
  const password = Deno.env.get("B42_SMTP_PASSWORD") ?? ""
  const fromEmail = Deno.env.get("B42_SMTP_FROM_EMAIL")?.trim()
  const fromName = Deno.env.get("B42_SMTP_FROM_NAME")?.trim() || "B42 LXP"
  const replyTo = Deno.env.get("B42_SMTP_REPLY_TO")?.trim() || undefined
  const secureRaw = Deno.env.get("B42_SMTP_SECURE")?.trim().toLowerCase()

  if (!host || !portRaw || !fromEmail || !password) return null

  const port = Number.parseInt(portRaw, 10)
  if (!Number.isFinite(port) || port < 1 || port > 65535) return null

  const secure = secureRaw === "true" || secureRaw === "1" || port === 465

  return {
    source: "b42",
    host,
    port,
    user,
    password,
    fromEmail,
    fromName,
    replyTo,
    secure,
  }
}

function isInstitutionConfigComplete(settings: SmtpSettingsPublic): boolean {
  return Boolean(
    settings.enabled &&
      settings.host.trim() &&
      settings.fromEmail.trim() &&
      settings.passwordConfigured,
  )
}

export async function loadSmtpSettingsPublic(
  supabaseAdmin: SupabaseClient,
): Promise<SmtpSettingsPublic | null> {
  const { data, error } = await supabaseAdmin
    .from("lxp_institution_settings")
    .select("value")
    .eq("key", "smtp")
    .maybeSingle()

  if (error) throw error
  if (!data?.value) return null

  const value = data.value as Record<string, unknown>
  return {
    enabled: Boolean(value.enabled),
    host: typeof value.host === "string" ? value.host.trim() : "",
    port: typeof value.port === "number" ? value.port : 587,
    user: typeof value.user === "string" ? value.user.trim() : "",
    fromEmail: typeof value.fromEmail === "string" ? value.fromEmail.trim() : "",
    fromName: typeof value.fromName === "string" ? value.fromName.trim() : "LXP Instituição",
    replyTo: typeof value.replyTo === "string" ? value.replyTo.trim() : "",
    secure: value.secure !== false,
    passwordConfigured: Boolean(value.passwordConfigured),
  }
}

export async function resolveSmtpConfig(
  supabaseAdmin: SupabaseClient,
): Promise<ResolvedSmtpConfig> {
  const settings = await loadSmtpSettingsPublic(supabaseAdmin)

  if (settings && isInstitutionConfigComplete(settings)) {
    const { data: secretRow, error: secretError } = await supabaseAdmin
      .from("lxp_institution_smtp_secret")
      .select("password_ciphertext,password_iv")
      .eq("id", "institution")
      .maybeSingle()

    if (secretError) throw secretError
    if (!secretRow?.password_ciphertext || !secretRow?.password_iv) {
      throw new Error("Senha SMTP institucional não encontrada.")
    }

    const password = await decryptSmtpPassword(
      secretRow.password_ciphertext as string,
      secretRow.password_iv as string,
    )

    return {
      source: "institution",
      host: settings.host,
      port: settings.port,
      user: settings.user,
      password,
      fromEmail: settings.fromEmail,
      fromName: settings.fromName,
      replyTo: settings.replyTo || undefined,
      secure: settings.secure,
    }
  }

  const fallback = readB42Fallback()
  if (fallback) return fallback

  throw new Error(
    "Nenhum SMTP disponível. Configure o SMTP da instituição ou o fallback B42 no ambiente.",
  )
}

export function describeSmtpSource(settings: SmtpSettingsPublic | null): "institution" | "b42" | "none" {
  if (settings && isInstitutionConfigComplete(settings)) return "institution"
  if (readB42Fallback()) return "b42"
  return "none"
}
