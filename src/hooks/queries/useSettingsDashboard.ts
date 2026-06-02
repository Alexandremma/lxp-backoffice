import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/consts/queryKeys"
import { getSettingsDashboard } from "@/services/settingsDashboardService"

export function useSettingsDashboard() {
    return useQuery({
        queryKey: queryKeys.settings.dashboard,
        queryFn: getSettingsDashboard,
        staleTime: 30_000,
    })
}
