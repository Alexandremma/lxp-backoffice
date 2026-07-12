import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/consts/queryKeys"
import { getCourseLinkedContentAdmin } from "@/services/courses"

export function useGetCourseContent(courseId?: string) {
  return useQuery({
    queryKey: courseId ? queryKeys.courses.content(courseId) : queryKeys.courses.disabled.content,
    enabled: !!courseId,
    queryFn: () => getCourseLinkedContentAdmin(courseId!),
  })
}
