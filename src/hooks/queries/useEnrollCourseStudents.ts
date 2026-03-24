import { useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/consts/queryKeys"
import { enrollStudentsAdmin } from "@/services/coursesService"

export function useEnrollCourseStudents(courseId?: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (studentIds: string[]) => enrollStudentsAdmin(courseId!, studentIds),
        onSuccess: () => {
            if (!courseId) return
            queryClient.invalidateQueries({ queryKey: queryKeys.courses.students(courseId) })
        },
    })
}

