import { useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/consts/queryKeys"
import { createStudentAdmin } from "@/services/studentsService"

export function useCreateStudentAdmin() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: createStudentAdmin,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.students.list })
            queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats })
        },
    })
}
