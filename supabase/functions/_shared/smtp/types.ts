export type SmtpSettingsPublic = {
  enabled: boolean
  host: string
  port: number
  user: string
  fromEmail: string
  fromName: string
  replyTo?: string
  secure: boolean
  passwordConfigured?: boolean
}

export type ResolvedSmtpConfig = {
  source: "institution" | "b42"
  host: string
  port: number
  user: string
  password: string
  fromEmail: string
  fromName: string
  replyTo?: string
  secure: boolean
}
