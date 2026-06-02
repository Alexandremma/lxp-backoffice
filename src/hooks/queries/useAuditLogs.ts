import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/consts/queryKeys"
import { listAuditLogs } from "@/services/auditLogService"

const DEFAULT_LIMIT = 50

export function useAuditLogs(limit = DEFAULT_LIMIT) {
    return useQuery({
        queryKey: queryKeys.auditLogs.list({ limit }),
        queryFn: () => listAuditLogs({ limit, offset: 0 }),
        staleTime: 15_000,
    })
}
