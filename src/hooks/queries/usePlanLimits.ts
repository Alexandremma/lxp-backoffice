import { useMemo } from "react"
import { planUsageFromDashboard } from "@/lib/planLimits"
import { useSettingsDashboard } from "@/hooks/queries/useSettingsDashboard"

export function usePlanLimits() {
    const query = useSettingsDashboard()

    const usage = useMemo(() => {
        if (!query.data) return null
        return planUsageFromDashboard(query.data)
    }, [query.data])

    return {
        ...query,
        usage,
        dashboard: query.data ?? null,
    }
}
