import { useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/consts/queryKeys"
import { invalidateAuditLogs } from "@/lib/invalidateAuditLogs"
import {
    createTeamMemberAdmin,
    updateTeamMemberAdmin,
    type TeamMemberAdminRow,
} from "@/services/teamService"

type UpsertPayload =
    | {
          mode: "create"
          name: string
          email: string
          role: TeamMemberAdminRow["role"]
          department?: string | null
          redirectTo?: string
      }
    | {
          mode: "update"
          id: string
          name: string
          email: string
          role: TeamMemberAdminRow["role"]
          department?: string | null
      }

export function useUpsertTeamMemberAdmin() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (payload: UpsertPayload) => {
            if (payload.mode === "create") {
                return createTeamMemberAdmin(payload)
            }
            return updateTeamMemberAdmin(payload)
        },
        onSuccess: (_data, payload) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.team.list })
            if (payload.mode === "create") {
                queryClient.invalidateQueries({ queryKey: queryKeys.settings.dashboard })
            }
            invalidateAuditLogs(queryClient)
        },
    })
}
