import { useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/consts/queryKeys"
import { updateCourseDisciplineAdmin } from "@/services/coursesService"

export function useUpdateCourseDiscipline(courseId?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: {
      disciplineId: string
      data: { name: string; code: string; workload: number; credits: number; professor?: string }
    }) => updateCourseDisciplineAdmin(payload.disciplineId, payload.data),
    onSuccess: () => {
      if (!courseId) return
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.grades(courseId) })
    },
  })
}
