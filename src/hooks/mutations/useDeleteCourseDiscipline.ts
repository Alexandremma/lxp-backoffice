import { useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/consts/queryKeys"
import { deleteCourseDisciplineAdmin } from "@/services/courses"

export function useDeleteCourseDiscipline(courseId?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (disciplineId: string) => deleteCourseDisciplineAdmin(disciplineId),
    onSuccess: () => {
      if (!courseId) return
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.grades(courseId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.detail(courseId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.content(courseId) })
    },
  })
}
