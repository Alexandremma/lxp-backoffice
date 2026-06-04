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

export function formatTeamDepartmentLabel(
  dept: string | null | undefined,
  role?: string | null,
): string {
  const resolved = resolveTeamDepartment(dept, role)
  if (!resolved) return "—"
  return TEAM_DEPARTMENT_LABELS[resolved]
}

const DEPARTMENT_ALIASES: Record<string, TeamDepartment> = {
  administracao: "administracao",
  administração: "administracao",
  administracao_institucional: "administracao",
  coordenacao_pedagogica: "coordenacao_pedagogica",
  "coordenação pedagógica": "coordenacao_pedagogica",
  ensino_atendimento: "ensino_atendimento",
  "ensino e atendimento ao aluno": "ensino_atendimento",
}

function normalizeDepartmentKey(value: string): TeamDepartment | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const lower = trimmed.toLowerCase()
  if ((TEAM_DEPARTMENTS as readonly string[]).includes(trimmed)) {
    return trimmed as TeamDepartment
  }
  if ((TEAM_DEPARTMENTS as readonly string[]).includes(lower)) {
    return lower as TeamDepartment
  }
  return DEPARTMENT_ALIASES[lower] ?? DEPARTMENT_ALIASES[trimmed] ?? null
}

/** Valor efetivo para exibição — usa padrão da função quando o banco está vazio. */
export function resolveTeamDepartment(
  dept: string | null | undefined,
  role?: string | null,
): TeamDepartment | null {
  const fromDb = dept ? normalizeDepartmentKey(dept) : null
  if (fromDb) return fromDb
  if (role && isTeamRole(normalizeTeamRole(role))) {
    return DEFAULT_DEPARTMENT_BY_ROLE[normalizeTeamRole(role)]
  }
  return null
}

/** Coordenador não pode promover nem atribuir função Administrador. */
export function canAssignTeamRole(actorRole: TeamRole, targetRole: TeamRole): boolean {
  if (targetRole === "admin" && actorRole !== "admin") return false
  return true
}
