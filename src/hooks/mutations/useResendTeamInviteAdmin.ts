import { useMutation } from "@tanstack/react-query"
import { resendTeamInviteAdmin } from "@/services/teamService"

export function useResendTeamInviteAdmin() {
    return useMutation({
        mutationFn: resendTeamInviteAdmin,
    })
}
