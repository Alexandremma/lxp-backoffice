import { corsHeaders, jsonResponse } from "../_shared/cors.ts"
import { assertAdminCaller } from "../_shared/adminAuth.ts"
import { getActorProfileId, writeAuditLogAsUser } from "../_shared/auditLog.ts"
import { encryptSmtpPassword } from "../_shared/smtp/credentialCrypto.ts"
import type { SmtpSettingsPublic } from "../_shared/smtp/types.ts"

type UpdateBody = {
  enabled?: boolean
  host?: string
  port?: number
  user?: string
  fromEmail?: string
  fromName?: string
  replyTo?: string
  secure?: boolean
  password?: string
}

function parseBody(raw: UpdateBody): SmtpSettingsPublic & { password?: string } {
  const host = typeof raw.host === "string" ? raw.host.trim() : ""
  const port = typeof raw.port === "number" ? raw.port : Number.parseInt(String(raw.port ?? ""), 10)
  const fromEmail = typeof raw.fromEmail === "string" ? raw.fromEmail.trim() : ""
  const replyTo = typeof raw.replyTo === "string" ? raw.replyTo.trim() : ""

  if (!host) throw new Error("Informe o servidor SMTP.")
  if (!Number.isFinite(port) || port < 1 || port > 65535) throw new Error("Porta SMTP inválida.")
  if (fromEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fromEmail)) {
    throw new Error("E-mail remetente inválido.")
  }
  if (replyTo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(replyTo)) {
    throw new Error("Reply-To inválido.")
  }

  return {
    enabled: Boolean(raw.enabled),
    host,
    port,
    user: typeof raw.user === "string" ? raw.user.trim() : "",
    fromEmail,
    fromName: typeof raw.fromName === "string" && raw.fromName.trim()
      ? raw.fromName.trim()
      : "LXP Instituição",
    replyTo,
    secure: raw.secure !== false,
    password: typeof raw.password === "string" && raw.password.trim() ? raw.password : undefined,
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  if (req.method !== "POST") {
    return jsonResponse(405, { code: "SMTP_BAD_REQUEST", message: "Método não permitido." })
  }

  try {
    const caller = await assertAdminCaller(req)
    if (caller instanceof Response) return caller

    const body = await req.json().catch(() => ({})) as UpdateBody
    const parsed = parseBody(body)

    const { data: existingRow } = await caller.supabaseAdmin
      .from("lxp_institution_settings")
      .select("value")
      .eq("key", "smtp")
      .maybeSingle()

    const existingValue = (existingRow?.value ?? {}) as Record<string, unknown>
    const passwordConfigured = Boolean(existingValue.passwordConfigured)

    let nextPasswordConfigured = passwordConfigured
    if (parsed.password) {
      const encrypted = await encryptSmtpPassword(parsed.password)
      const actorProfileId = await getActorProfileId(caller.supabaseAdmin, caller.user.id)

      const { error: secretError } = await caller.supabaseAdmin
        .from("lxp_institution_smtp_secret")
        .upsert(
          {
            id: "institution",
            password_ciphertext: encrypted.ciphertext,
            password_iv: encrypted.iv,
            updated_at: new Date().toISOString(),
            updated_by: actorProfileId,
          },
          { onConflict: "id" },
        )

      if (secretError) throw secretError
      nextPasswordConfigured = true
    }

    const publicValue: SmtpSettingsPublic = {
      enabled: parsed.enabled,
      host: parsed.host,
      port: parsed.port,
      user: parsed.user,
      fromEmail: parsed.fromEmail,
      fromName: parsed.fromName,
      replyTo: parsed.replyTo,
      secure: parsed.secure,
      passwordConfigured: nextPasswordConfigured,
    }

    const actorProfileId = await getActorProfileId(caller.supabaseAdmin, caller.user.id)
    const { error: settingsError } = await caller.supabaseAdmin
      .from("lxp_institution_settings")
      .upsert(
        {
          key: "smtp",
          value: publicValue,
          updated_at: new Date().toISOString(),
          updated_by: actorProfileId,
        },
        { onConflict: "key" },
      )

    if (settingsError) throw settingsError

    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")
    if (anonKey) {
      await writeAuditLogAsUser(Deno.env.get("SUPABASE_URL")!, anonKey, caller.token, {
        action: "smtp.update",
        entityType: "institution_settings",
        entityId: "smtp",
        metadata: {
          host: publicValue.host,
          port: publicValue.port,
          enabled: publicValue.enabled,
          passwordConfigured: publicValue.passwordConfigured,
          source: "edge",
        },
      })
    }

    return jsonResponse(200, { settings: publicValue })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao salvar SMTP."
    return jsonResponse(400, { code: "SMTP_BAD_REQUEST", message })
  }
})
