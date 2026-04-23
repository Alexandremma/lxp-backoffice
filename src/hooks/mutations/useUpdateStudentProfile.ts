import { useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/consts/queryKeys"
import { updateStudentProfileAdmin } from "@/services/studentsService"

export function useUpdateStudentProfile() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: updateStudentProfileAdmin,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.students.list })
        },
    })
}
