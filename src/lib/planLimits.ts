import { getSettingsDashboard } from "@/services/settingsDashboardService"
import type { SettingsDashboard } from "@/types/settings"

/** Aviso visual a partir de 90% do limite contratado. */
export const PLAN_LIMIT_NEAR_RATIO = 0.9

export type PlanResource = "students" | "courses" | "teamMembers"

export type PlanUsageStatus = {
    current: number
    limit: number
    percent: number
    atLimit: boolean
    nearLimit: boolean
}

export class PlanLimitError extends Error {
    readonly code = "PLAN_LIMIT_REACHED" as const

    constructor(
        readonly resource: PlanResource,
        message: string,
    ) {
        super(message)
        this.name = "PlanLimitError"
    }
}

export function usageStatus(current: number, limit: number): PlanUsageStatus {
    if (limit <= 0) {
        return { current, limit, percent: 0, atLimit: false, nearLimit: false }
    }
    const ratio = current / limit
    const percent = Math.min(100, ratio * 100)
    return {
        current,
        limit,
        percent,
        atLimit: current >= limit,
        nearLimit: ratio >= PLAN_LIMIT_NEAR_RATIO && current < limit,
    }
}

export function planUsageFromDashboard(dashboard: SettingsDashboard) {
    const { usage, subscription } = dashboard
    const limits = subscription.limits
    return {
        students: usageStatus(usage.students, limits.students),
        courses: usageStatus(usage.courses, limits.courses),
        teamMembers: usageStatus(usage.teamMembers, limits.teamMembers),
    }
}

export async function assertCanCreateStudent(): Promise<void> {
    const dashboard = await getSettingsDashboard()
    const { students } = planUsageFromDashboard(dashboard)
    if (students.atLimit) {
        throw new PlanLimitError(
            "students",
            `Limite de alunos do plano atingido (${students.current}/${students.limit}). Faça upgrade em Configurações.`,
        )
    }
}

export async function assertCanCreateCourse(): Promise<void> {
    const dashboard = await getSettingsDashboard()
    const { courses } = planUsageFromDashboard(dashboard)
    if (courses.atLimit) {
        throw new PlanLimitError(
            "courses",
            `Limite de cursos do plano atingido (${courses.current}/${courses.limit}). Faça upgrade em Configurações.`,
        )
    }
}

export function isPlanLimitError(err: unknown): err is PlanLimitError {
    return err instanceof PlanLimitError
}
