import { useMutation, useQueryClient } from "@tanstack/react-query"
import { invalidateAuditLogs } from "@/lib/invalidateAuditLogs"
import { resendTeamInviteAdmin } from "@/services/teamService"

export function useResendTeamInviteAdmin() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: resendTeamInviteAdmin,
        onSuccess: () => {
            invalidateAuditLogs(queryClient)
        },
    })
}
