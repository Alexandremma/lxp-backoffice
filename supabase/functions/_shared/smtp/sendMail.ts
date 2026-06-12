import nodemailer from "npm:nodemailer@6.9.10"
import type { ResolvedSmtpConfig } from "./types.ts"

export type SendMailInput = {
  to: string
  subject: string
  text: string
  html?: string
}

function formatFrom(config: ResolvedSmtpConfig): string {
  const name = config.fromName?.trim()
  if (name) return `"${name.replace(/"/g, '\\"')}" <${config.fromEmail}>`
  return config.fromEmail
}

export async function sendSmtpMail(config: ResolvedSmtpConfig, input: SendMailInput): Promise<void> {
  const transport = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.user
      ? {
          user: config.user,
          pass: config.password,
        }
      : undefined,
    requireTLS: !config.secure && config.port === 587,
    connectionTimeout: 20_000,
    greetingTimeout: 20_000,
    socketTimeout: 30_000,
  })

  await new Promise<void>((resolve, reject) => {
    transport.sendMail(
      {
        from: formatFrom(config),
        to: input.to,
        replyTo: config.replyTo || undefined,
        subject: input.subject,
        text: input.text,
        html: input.html,
      },
      (error) => {
        if (error) return reject(error)
        resolve()
      },
    )
  })
}

export function mapSmtpErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  const lower = message.toLowerCase()

  if (lower.includes("invalid login") || lower.includes("authentication")) {
    return "Falha de autenticação SMTP. Verifique usuário e senha."
  }
  if (lower.includes("enotfound") || lower.includes("getaddrinfo")) {
    return "Servidor SMTP não encontrado. Verifique o host."
  }
  if (lower.includes("timeout") || lower.includes("timed out")) {
    return "Tempo esgotado ao conectar no servidor SMTP."
  }
  if (lower.includes("certificate") || lower.includes("tls")) {
    return "Falha TLS/SSL. Revise porta e a opção SSL/TLS."
  }

  return "Não foi possível enviar o e-mail. Verifique host, porta e credenciais."
}
