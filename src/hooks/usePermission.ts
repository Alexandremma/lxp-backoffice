import { useMemo } from "react"
import {
  can,
  canAll,
  canAny,
  type PermissionId,
} from "@/consts/permissions"
import { useBackofficeMember } from "@/hooks/queries/useBackofficeMember"

export function usePermission() {
  const { data: member, isLoading } = useBackofficeMember()
  const role = member?.role ?? null

  return useMemo(
    () => ({
      member,
      role,
      isLoading,
      can: (permission: PermissionId) => can(role, permission),
      canAny: (permissions: PermissionId[]) => canAny(role, permissions),
      canAll: (permissions: PermissionId[]) => canAll(role, permissions),
    }),
    [member, role, isLoading],
  )
}
