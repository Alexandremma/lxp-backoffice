import { ReactElement } from "react"
import { Navigate, useLocation } from "react-router-dom"
import type { PermissionId } from "@/consts/permissions"
import { can } from "@/consts/permissions"
import { useBackofficeMember } from "@/hooks/queries/useBackofficeMember"
import { useAuth } from "@/hooks/use-auth"
import { permissionForPath } from "@/lib/routePermissions"

type BackofficeAccessRouteProps = {
  element: ReactElement
  /** Se omitido, usa permissão derivada do pathname. */
  permission?: PermissionId
}

export function BackofficeAccessRoute({ element, permission }: BackofficeAccessRouteProps) {
  const location = useLocation()
  const { session, loading: authLoading } = useAuth()
  const { data: member, isLoading: memberLoading } = useBackofficeMember()

  const required =
    permission ?? permissionForPath(location.pathname) ?? "dashboard.visualizar"

  if (authLoading || memberLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Carregando...
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/admin/login" replace />
  }

  if (!member) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center text-sm text-muted-foreground">
        Sua conta não está vinculada à equipe do backoffice. Peça acesso a um administrador.
      </div>
    )
  }

  if (!can(member.role, required)) {
    const fallback = can(member.role, "dashboard.visualizar") ? "/" : "/admin/login"
    return <Navigate to={fallback} replace />
  }

  return element
}
