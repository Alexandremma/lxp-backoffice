export type AuthEmailPayload = {
  supabaseUrl: string
  emailActionType: string
  tokenHash: string
  redirectTo: string
  siteUrl: string
  institutionName: string
}

function buildVerifyUrl(payload: AuthEmailPayload): string {
  const base = payload.supabaseUrl.replace(/\/$/, "")
  const params = new URLSearchParams({
    token: payload.tokenHash,
    type: payload.emailActionType,
  })
  if (payload.redirectTo) params.set("redirect_to", payload.redirectTo)
  return `${base}/auth/v1/verify?${params.toString()}`
}

function subjectForAction(action: string, institutionName: string): string {
  switch (action) {
    case "invite":
      return `Convite para acessar ${institutionName}`
    case "recovery":
      return `Redefinição de senha — ${institutionName}`
    case "magiclink":
      return `Seu link de acesso — ${institutionName}`
    case "email_change":
      return `Confirme a alteração de e-mail — ${institutionName}`
    case "signup":
    default:
      return `Confirme seu cadastro — ${institutionName}`
  }
}

function introForAction(action: string, institutionName: string): string {
  switch (action) {
    case "invite":
      return `Você foi convidado(a) para acessar a plataforma ${institutionName}.`
    case "recovery":
      return `Recebemos uma solicitação para redefinir sua senha em ${institutionName}.`
    case "magiclink":
      return `Use o link abaixo para entrar em ${institutionName}.`
    case "email_change":
      return `Confirme a alteração do seu e-mail em ${institutionName}.`
    case "signup":
    default:
      return `Confirme seu cadastro em ${institutionName}.`
  }
}

export function buildAuthEmail(payload: AuthEmailPayload): { subject: string; text: string; html: string } {
  const verifyUrl = buildVerifyUrl(payload)
  const subject = subjectForAction(payload.emailActionType, payload.institutionName)
  const intro = introForAction(payload.emailActionType, payload.institutionName)

  const text = [
    intro,
    "",
    "Acesse o link abaixo para continuar:",
    verifyUrl,
    "",
    "Se você não solicitou este e-mail, ignore esta mensagem.",
  ].join("\n")

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827;max-width:560px">
      <p>${intro}</p>
      <p><a href="${verifyUrl}" style="color:#2563eb">Continuar</a></p>
      <p style="font-size:12px;color:#6b7280">Se o botão não funcionar, copie e cole este endereço no navegador:<br>${verifyUrl}</p>
      <p style="font-size:12px;color:#6b7280">Se você não solicitou este e-mail, ignore esta mensagem.</p>
    </div>
  `.trim()

  return { subject, text, html }
}
