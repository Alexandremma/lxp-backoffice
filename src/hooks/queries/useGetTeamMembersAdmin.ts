import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/consts/queryKeys"
import { getTeamMembersAdmin } from "@/services/teamService"

export function useGetTeamMembersAdmin() {
    return useQuery({
        queryKey: queryKeys.team.list,
        queryFn: getTeamMembersAdmin,
        retry: 1,
    })
}
