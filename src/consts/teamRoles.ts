/** Funções da equipe — escopo entrega final (3 papéis). */
export const TEAM_ROLES = ["admin", "coordinator", "professor"] as const

export type TeamRole = (typeof TEAM_ROLES)[number]

export const TEAM_ROLE_LABELS: Record<TeamRole, string> = {
  admin: "Administrador",
  coordinator: "Coordenador",
  professor: "Professor",
}

export const TEAM_DEPARTMENTS = [
  "administracao",
  "coordenacao_pedagogica",
  "ensino_atendimento",
] as const

export type TeamDepartment = (typeof TEAM_DEPARTMENTS)[number]

export const TEAM_DEPARTMENT_LABELS: Record<TeamDepartment, string> = {
  administracao: "Administração",
  coordenacao_pedagogica: "Coordenação pedagógica",
  ensino_atendimento: "Ensino e atendimento ao aluno",
}

/** Departamento sugerido ao escolher a função no formulário. */
export const DEFAULT_DEPARTMENT_BY_ROLE: Record<TeamRole, TeamDepartment> = {
  admin: "administracao",
  coordinator: "coordenacao_pedagogica",
  professor: "ensino_atendimento",
}

export function isTeamRole(value: string | null | undefined): value is TeamRole {
  return !!value && (TEAM_ROLES as readonly string[]).includes(value)
}

/** Normaliza papéis legados (pré-RBAC) para um dos 3 da entrega. */
export function normalizeTeamRole(value: string | null | undefined): TeamRole {
  if (isTeamRole(value)) return value
  switch (value) {
    case "secretary":
      return "coordinator"
    case "financial":
      return "admin"
    case "tutor":
    case "commercial":
      return "professor"
    default:
      return "professor"
  }
}

export function formatTeamRoleLabel(role: string | null | undefined): string {
  const normalized = normalizeTeamRole(role)
  return TEAM_ROLE_LABELS[normalized]
}

export function formatTeamDepartmentLabel(dept: string | null | undefined): string {
  if (!dept?.trim()) return "—"
  const key = dept.trim() as TeamDepartment
  return TEAM_DEPARTMENT_LABELS[key] ?? dept
}

/** Coordenador não pode promover nem atribuir função Administrador. */
export function canAssignTeamRole(actorRole: TeamRole, targetRole: TeamRole): boolean {
  if (targetRole === "admin" && actorRole !== "admin") return false
  return true
}
