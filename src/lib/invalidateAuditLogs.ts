import type { QueryClient } from "@tanstack/react-query"

export function invalidateAuditLogs(queryClient: QueryClient): void {
    void queryClient.invalidateQueries({ queryKey: ["audit-logs"] })
}
