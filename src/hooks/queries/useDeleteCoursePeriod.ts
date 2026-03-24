import { useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/consts/queryKeys"
import { deleteCoursePeriodAdmin } from "@/services/coursesService"

export function useDeleteCoursePeriod(courseId?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (periodId: string) => deleteCoursePeriodAdmin(periodId),
    onSuccess: () => {
      if (!courseId) return
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.grades(courseId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.detail(courseId) })
    },
  })
}
