import { useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/consts/queryKeys"
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
      }
    | {
          mode: "update"
          id: string
          name: string
          email: string
          role: TeamMemberAdminRow["role"]
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
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.team.list })
        },
    })
}
