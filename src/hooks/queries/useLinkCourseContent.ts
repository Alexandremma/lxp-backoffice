import { useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/consts/queryKeys"
import { linkCourseContentAdmin } from "@/services/coursesService"

export function useLinkCourseContent(courseId?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: {
      disciplineId: string
      libraryContentType: "discipline"
      libraryContentId: string
      libraryContentName?: string
    }) => linkCourseContentAdmin(data),
    onSuccess: () => {
      if (!courseId) return
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.content(courseId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.grades(courseId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.recentActivity(courseId) })
    },
  })
}
