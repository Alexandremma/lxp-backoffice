import { useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/consts/queryKeys"
import { invalidateAuditLogs } from "@/lib/invalidateAuditLogs"
import { createCourseAdmin, updateCourseAdmin } from "@/services/courses"
import type { UpsertCourseAdminPayload } from "@/types/courseAdmin"

type UpsertCoursePayload =
    | ({ mode: "create" } & UpsertCourseAdminPayload)
    | ({ mode: "update"; id: string } & Pick<UpsertCourseAdminPayload, "name" | "description" | "category" | "status" | "externalLibraryId">)

export function useUpsertCourseAdmin() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (payload: UpsertCoursePayload) => {
            if (payload.mode === "create") {
                return createCourseAdmin(payload)
            }
            return updateCourseAdmin(payload.id, payload)
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.courses.list })
            if (variables.mode === "create") {
                queryClient.invalidateQueries({ queryKey: queryKeys.settings.dashboard })
            }
            invalidateAuditLogs(queryClient)
        },
    })
}
