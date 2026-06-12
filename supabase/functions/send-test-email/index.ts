import { corsHeaders, jsonResponse } from "../_shared/cors.ts"
import { assertAdminCaller } from "../_shared/adminAuth.ts"
import { writeAuditLogAsUser } from "../_shared/auditLog.ts"
import { resolveSmtpConfig } from "../_shared/smtp/resolveConfig.ts"
import { mapSmtpErrorMessage, sendSmtpMail } from "../_shared/smtp/sendMail.ts"

function isRecipientAllowed(recipient: string): boolean {
  const allowlist = Deno.env.get("SMTP_TEST_ALLOWLIST")?.trim()
  if (!allowlist) return true

  const normalized = recipient.trim().toLowerCase()
  const entries = allowlist.split(",").map((item) => item.trim().toLowerCase()).filter(Boolean)
  return entries.some((entry) => normalized === entry || normalized.endsWith(`@${entry.replace(/^@/, "")}`))
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

    const body = await req.json().catch(() => ({})) as { to?: string }
    const recipient = typeof body.to === "string" ? body.to.trim().toLowerCase() : caller.user.email?.trim().toLowerCase()

    if (!recipient || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
      return jsonResponse(400, {
        code: "SMTP_BAD_REQUEST",
        message: "Informe um destinatário de teste válido.",
      })
    }

    if (!isRecipientAllowed(recipient)) {
      return jsonResponse(403, {
        code: "SMTP_TEST_NOT_ALLOWED",
        message: "Destinatário não permitido neste ambiente.",
      })
    }

    const smtpConfig = await resolveSmtpConfig(caller.supabaseAdmin)

    await sendSmtpMail(smtpConfig, {
      to: recipient,
      subject: `Teste SMTP — ${smtpConfig.fromName}`,
      text: [
        "Este é um e-mail de teste da plataforma LXP.",
        "",
        `Origem: ${smtpConfig.source === "institution" ? "SMTP da instituição" : "SMTP padrão B42"}.`,
        "Se você recebeu esta mensagem, a configuração está funcionando.",
      ].join("\n"),
      html: `
        <p>Este é um e-mail de teste da plataforma LXP.</p>
        <p><strong>Origem:</strong> ${smtpConfig.source === "institution" ? "SMTP da instituição" : "SMTP padrão B42"}.</p>
        <p>Se você recebeu esta mensagem, a configuração está funcionando.</p>
      `,
    })

    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")
    if (anonKey) {
      await writeAuditLogAsUser(Deno.env.get("SUPABASE_URL")!, anonKey, caller.token, {
        action: "smtp.test_sent",
        entityType: "institution_settings",
        entityId: "smtp",
        metadata: {
          to: recipient,
          source: smtpConfig.source,
          source_edge: "edge",
        },
      })
    }

    return jsonResponse(200, {
      sent: true,
      source: smtpConfig.source,
      to: recipient,
    })
  } catch (error) {
    return jsonResponse(500, {
      code: "SMTP_SEND_FAILED",
      message: mapSmtpErrorMessage(error),
    })
  }
})
