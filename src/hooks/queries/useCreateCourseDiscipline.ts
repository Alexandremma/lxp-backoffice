import { useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/consts/queryKeys"
import { createCourseDisciplineAdmin } from "@/services/coursesService"

export function useCreateCourseDiscipline(courseId?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: {
      periodId: string
      data: { name: string; code: string; workload: number; credits: number; professor?: string }
    }) => createCourseDisciplineAdmin(payload.periodId, payload.data),
    onSuccess: () => {
      if (!courseId) return
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.grades(courseId) })
    },
  })
}
