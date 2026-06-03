import type { TeamRole } from "@/consts/teamRoles"

/** IDs alinhados à matriz do cliente + extensões dev (B42). */
export const PERMISSION_IDS = [
  "acesso.login",
  "dashboard.visualizar",
  "alunos.visualizar",
  "alunos.criar",
  "alunos.editar",
  "alunos.excluir",
  "matriculas.visualizar",
  "matriculas.criar",
  "matriculas.editar",
  "matriculas.excluir",
  "equipe.visualizar",
  "equipe.criar",
  "equipe.editar",
  "equipe.excluir",
  "cursos.visualizar",
  "cursos.criar",
  "cursos.editar",
  "cursos.excluir",
  "cursos.detalhe",
  "gamificacao.visualizar",
  "gamificacao.xp_editar",
  "gamificacao.badges_criar",
  "gamificacao.badges_editar",
  "gamificacao.badges_excluir",
  "gamificacao.badges_reavaliar",
  "gamificacao.niveis_editar",
  "certificados.visualizar",
  "certificados.template_criar",
  "certificados.template_editar",
  "certificados.emitir",
  "configuracoes.visualizar",
  "configuracoes.editar",
  "dev.modelo_dados",
  "dev.roteiro_cliente",
] as const

export type PermissionId = (typeof PERMISSION_IDS)[number]

const ALL: Record<TeamRole, Set<PermissionId>> = {
  admin: new Set(PERMISSION_IDS),
  coordinator: new Set([
    "acesso.login",
    "dashboard.visualizar",
    "alunos.visualizar",
    "alunos.criar",
    "alunos.editar",
    "alunos.excluir",
    "matriculas.visualizar",
    "matriculas.criar",
    "matriculas.editar",
    "matriculas.excluir",
    "equipe.visualizar",
    "equipe.criar",
    "equipe.editar",
    "cursos.visualizar",
    "cursos.criar",
    "cursos.editar",
    "cursos.excluir",
    "cursos.detalhe",
    "gamificacao.visualizar",
    "gamificacao.xp_editar",
    "gamificacao.badges_criar",
    "gamificacao.badges_editar",
    "gamificacao.badges_excluir",
    "gamificacao.badges_reavaliar",
    "certificados.visualizar",
    "certificados.emitir",
  ]),
  professor: new Set([
    "acesso.login",
    "dashboard.visualizar",
    "alunos.visualizar",
    "matriculas.visualizar",
    "matriculas.criar",
    "equipe.visualizar",
    "cursos.visualizar",
    "cursos.criar",
    "cursos.editar",
    "cursos.detalhe",
    "gamificacao.visualizar",
    "certificados.visualizar",
    "certificados.emitir",
  ]),
}

export function can(role: TeamRole | null | undefined, permission: PermissionId): boolean {
  if (!role) return false
  return ALL[role]?.has(permission) ?? false
}

export function canAny(role: TeamRole | null | undefined, permissions: PermissionId[]): boolean {
  return permissions.some((p) => can(role, p))
}

export function canAll(role: TeamRole | null | undefined, permissions: PermissionId[]): boolean {
  return permissions.every((p) => can(role, p))
}
