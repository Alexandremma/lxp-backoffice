import { useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/consts/queryKeys"
import { setStudentAccessAdmin } from "@/services/studentsService"

export function useSetStudentAccessAdmin() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: setStudentAccessAdmin,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.students.list })
            queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats })
        },
    })
}
