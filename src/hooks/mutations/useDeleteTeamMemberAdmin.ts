import { useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/consts/queryKeys"
import { deleteTeamMemberAdmin } from "@/services/teamService"

export function useDeleteTeamMemberAdmin() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: deleteTeamMemberAdmin,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.team.list })
        },
    })
}
