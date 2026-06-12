export type InstitutionSettingsValue = {
    name: string
    cnpj?: string
    contactEmail?: string
    phone?: string
    address?: string
    logoPath?: string | null
}

export type SubscriptionPlanLimits = {
    students: number
    courses: number
    teamMembers: number
}

export type SubscriptionSettingsValue = {
    planId: string
    planName: string
    status: string
    billingCycle?: string
    priceMonthly?: number
    limits: SubscriptionPlanLimits
    features?: string[]
    pendingUpgrade?: Record<string, unknown>
}

export type SmtpSettingsValue = {
    enabled: boolean
    host: string
    port: number
    user: string
    fromEmail: string
    fromName?: string
    replyTo?: string
    secure?: boolean
    /** Definido pela Edge; senha nunca é exposta ao front. */
    passwordConfigured?: boolean
}

export type SettingsDashboardUsage = {
    students: number
    courses: number
    teamMembers: number
}

export type SettingsDashboard = {
    subscription: SubscriptionSettingsValue
    institution: InstitutionSettingsValue
    usage: SettingsDashboardUsage
}

export type AuditLogRow = {
    id: string
    actor_profile_id: string | null
    action: string
    entity_type: string | null
    entity_id: string | null
    metadata: Record<string, unknown>
    created_at: string
    actor_name?: string | null
}

export type InstitutionSettingKey = "institution" | "subscription" | "smtp"
