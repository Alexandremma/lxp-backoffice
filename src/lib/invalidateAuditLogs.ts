import type { QueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/consts/queryKeys"

export function invalidateAuditLogs(queryClient: QueryClient): void {
    void queryClient.invalidateQueries({ queryKey: queryKeys.auditLogs.all })
}
