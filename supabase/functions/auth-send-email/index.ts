import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8"
import { corsHeaders, jsonResponse } from "../_shared/cors.ts"
import { buildAuthEmail } from "../_shared/smtp/authEmailTemplates.ts"
import { resolveSmtpConfig } from "../_shared/smtp/resolveConfig.ts"
import { mapSmtpErrorMessage, sendSmtpMail } from "../_shared/smtp/sendMail.ts"

type HookEmailData = {
  token: string
  token_hash: string
  redirect_to: string
  email_action_type: string
  site_url: string
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  if (req.method !== "POST") {
    return jsonResponse(405, { code: "AUTH_EMAIL_BAD_REQUEST", message: "Método não permitido." })
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  const hookSecretRaw = Deno.env.get("SEND_EMAIL_HOOK_SECRET")

  if (!supabaseUrl || !serviceRoleKey || !hookSecretRaw) {
    console.error("[auth-send-email] missing env")
    return jsonResponse(500, { code: "AUTH_EMAIL_CONFIG_ERROR", message: "Configuração incompleta." })
  }

  try {
    const payload = await req.text()
    const headers = Object.fromEntries(req.headers)
    const hookSecret = hookSecretRaw.replace(/^v1,whsec_/, "")
    const wh = new Webhook(hookSecret)

    const verified = wh.verify(payload, headers) as {
      user: { email: string }
      email_data: HookEmailData
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)
    const smtpConfig = await resolveSmtpConfig(supabaseAdmin)

    const { data: institutionRow } = await supabaseAdmin
      .from("lxp_institution_settings")
      .select("value")
      .eq("key", "institution")
      .maybeSingle()

    const institutionName =
      typeof (institutionRow?.value as Record<string, unknown> | undefined)?.name === "string"
        ? ((institutionRow?.value as Record<string, string>).name || "LXP")
        : "LXP"

    const email = buildAuthEmail({
      supabaseUrl,
      emailActionType: verified.email_data.email_action_type,
      tokenHash: verified.email_data.token_hash,
      redirectTo: verified.email_data.redirect_to,
      siteUrl: verified.email_data.site_url,
      institutionName,
    })

    await sendSmtpMail(smtpConfig, {
      to: verified.user.email,
      subject: email.subject,
      text: email.text,
      html: email.html,
    })

    return jsonResponse(200, {})
  } catch (error) {
    console.error("[auth-send-email]", error)
    return jsonResponse(500, {
      code: "AUTH_EMAIL_SEND_FAILED",
      message: mapSmtpErrorMessage(error),
    })
  }
})
