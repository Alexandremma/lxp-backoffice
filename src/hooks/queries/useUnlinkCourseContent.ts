import { useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/consts/queryKeys"
import { unlinkCourseContentAdmin } from "@/services/coursesService"

export function useUnlinkCourseContent(courseId?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (linkId: string) => unlinkCourseContentAdmin(linkId),
    onSuccess: () => {
      if (!courseId) return
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.content(courseId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.grades(courseId) })
    },
  })
}
