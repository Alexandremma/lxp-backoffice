import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/consts/queryKeys"
import { getAdminDashboardStats } from "@/services/dashboardService"

export function useGetAdminDashboardStats() {
    return useQuery({
        queryKey: queryKeys.dashboard.stats,
        queryFn: getAdminDashboardStats,
        retry: 1,
    })
}
