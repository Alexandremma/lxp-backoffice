import { useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/consts/queryKeys"
import { deleteStudentAdmin } from "@/services/studentsService"

export function useDeleteStudentAdmin() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: deleteStudentAdmin,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.students.list })
            queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats })
        },
    })
}
