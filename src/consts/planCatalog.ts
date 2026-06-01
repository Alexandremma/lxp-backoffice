/** Catálogo de planos (vitrine). Contratação/upgrade via suporte WhatsApp. */
export type SubscriptionPlanCatalogItem = {
    id: string
    name: string
    description: string
    priceMonthly: number
    highlighted?: boolean
    highlights: string[]
}

export const SUPPORT_WHATSAPP_E164 = "5544999829545"

export const PLAN_CATALOG: SubscriptionPlanCatalogItem[] = [
    {
        id: "essential",
        name: "Essencial",
        description: "Para instituições em implantação.",
        priceMonthly: 297,
        highlights: [
            "Até 200 alunos",
            "Até 10 cursos",
            "Até 5 membros na equipe",
            "Certificados e gamificação",
        ],
    },
    {
        id: "professional",
        name: "Profissional",
        description: "O plano mais usado por faculdades e EADs.",
        priceMonthly: 497,
        highlighted: true,
        highlights: [
            "Até 500 alunos",
            "Até 25 cursos",
            "Até 15 membros na equipe",
            "Certificados personalizados",
            "Gamificação avançada",
        ],
    },
    {
        id: "enterprise",
        name: "Enterprise",
        description: "Limites ampliados e suporte dedicado.",
        priceMonthly: 997,
        highlights: [
            "Alunos e cursos sob consulta",
            "Equipe ampliada",
            "AI Tutor",
            "Onboarding assistido",
        ],
    },
]

export function buildPlanUpgradeWhatsAppUrl(params: {
    targetPlanName: string
    currentPlanName: string
    institutionName?: string
}): string {
    const institution = params.institutionName?.trim()
    const lines = [
        "Olá! Gostaria de informações sobre mudança de plano na LXP.",
        `Plano de interesse: ${params.targetPlanName}.`,
        `Plano atual: ${params.currentPlanName}.`,
    ]
    if (institution) lines.push(`Instituição: ${institution}.`)
    return `https://wa.me/${SUPPORT_WHATSAPP_E164}?text=${encodeURIComponent(lines.join("\n"))}`
}

const FEATURE_LABELS: Record<string, string> = {
    certificates: "Certificados personalizados",
    gamification: "Gamificação avançada",
    ai_tutor: "AI Tutor",
}

const ALL_FEATURE_KEYS = ["certificates", "gamification", "ai_tutor"] as const

export function mapSubscriptionFeaturesToDisplay(featureKeys: string[] | undefined) {
    const active = new Set(featureKeys ?? [])
    return ALL_FEATURE_KEYS.map((key) => ({
        key,
        name: FEATURE_LABELS[key] ?? key,
        included: active.has(key),
    }))
}

const TEAM_ROLE_LABELS: Record<string, string> = {
    admin: "Administrador",
    coordinator: "Coordenador",
    secretary: "Secretaria",
    professor: "Professor",
    tutor: "Tutor",
    financial: "Financeiro",
    commercial: "Comercial",
}

export function formatTeamRoleLabel(role: string | null | undefined): string {
    if (!role) return "Administrador"
    return TEAM_ROLE_LABELS[role] ?? role
}
