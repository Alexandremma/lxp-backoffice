import { ReactElement } from "react"
import { Navigate, useLocation } from "react-router-dom"
import type { PermissionId } from "@/consts/permissions"
import { can } from "@/consts/permissions"
import { AppBootstrapScreen } from "@/components/states/AppBootstrapScreen"
import { useBackofficeMember } from "@/hooks/queries/useBackofficeMember"
import { useAuth } from "@/hooks/use-auth"
import { isQueryBootstrapping } from "@/lib/routeGuard"
import { permissionForPath } from "@/lib/routePermissions"

type BackofficeAccessRouteProps = {
  element: ReactElement
  /** Se omitido, usa permissão derivada do pathname. */
  permission?: PermissionId
}

export function BackofficeAccessRoute({ element, permission }: BackofficeAccessRouteProps) {
  const location = useLocation()
  const { session, loading: authBootstrapping } = useAuth()
  const { data: member, isPending: memberPending } = useBackofficeMember()
  const memberBootstrapping = isQueryBootstrapping(memberPending, member ?? undefined)

  const required =
    permission ?? permissionForPath(location.pathname) ?? "dashboard.visualizar"

  if (authBootstrapping || memberBootstrapping) {
    return <AppBootstrapScreen />
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
