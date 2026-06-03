import type { PermissionId } from "@/consts/permissions"

/** Permissão mínima para acessar cada rota do backoffice. */
export const ROUTE_PERMISSIONS: Record<string, PermissionId> = {
  "/": "dashboard.visualizar",
  "/admin/alunos": "alunos.visualizar",
  "/admin/equipe": "equipe.visualizar",
  "/admin/cursos": "cursos.visualizar",
  "/admin/matriculas": "matriculas.visualizar",
  "/admin/gamificacao": "gamificacao.visualizar",
  "/admin/certificados": "certificados.visualizar",
  "/admin/configuracoes": "configuracoes.visualizar",
  "/admin/modelo-dados": "dev.modelo_dados",
  "/admin/roteiro-cliente": "dev.roteiro_cliente",
}

export function permissionForPath(pathname: string): PermissionId | null {
  if (pathname === "/") return ROUTE_PERMISSIONS["/"]

  const entries = Object.entries(ROUTE_PERMISSIONS)
    .filter(([route]) => route !== "/")
    .sort((a, b) => b[0].length - a[0].length)

  for (const [route, permission] of entries) {
    if (pathname === route || pathname.startsWith(`${route}/`)) {
      return permission
    }
  }

  if (pathname.startsWith("/admin/cursos/")) {
    return "cursos.detalhe"
  }

  return null
}
