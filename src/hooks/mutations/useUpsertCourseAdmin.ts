import { useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/consts/queryKeys"
import {
    createCourseAdmin,
    updateCourseAdmin,
    type UpsertCourseAdminPayload,
} from "@/services/coursesService"

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
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.courses.list })
        },
    })
}
