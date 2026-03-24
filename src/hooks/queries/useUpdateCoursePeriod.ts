import { useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/consts/queryKeys"
import { updateCoursePeriodAdmin } from "@/services/coursesService"

export function useUpdateCoursePeriod(courseId?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: { periodId: string; data: { name: string; status: "current" | "completed" | "upcoming" } }) =>
      updateCoursePeriodAdmin(payload.periodId, payload.data),
    onSuccess: () => {
      if (!courseId) return
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.grades(courseId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.detail(courseId) })
    },
  })
}
