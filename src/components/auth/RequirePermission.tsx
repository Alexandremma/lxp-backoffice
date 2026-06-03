import type { ReactNode } from "react"
import type { PermissionId } from "@/consts/permissions"
import { usePermission } from "@/hooks/usePermission"

type RequirePermissionProps = {
  permission: PermissionId | PermissionId[]
  mode?: "any" | "all"
  children: ReactNode
  fallback?: ReactNode
}

/** Renderiza filhos somente se o papel do usuário tiver a permissão. */
export function RequirePermission({
  permission,
  mode = "any",
  children,
  fallback = null,
}: RequirePermissionProps) {
  const { can: canOne, canAny, canAll, isLoading } = usePermission()

  if (isLoading) return null

  const allowed = Array.isArray(permission)
    ? mode === "all"
      ? canAll(permission)
      : canAny(permission)
    : canOne(permission)

  return allowed ? <>{children}</> : <>{fallback}</>
}
