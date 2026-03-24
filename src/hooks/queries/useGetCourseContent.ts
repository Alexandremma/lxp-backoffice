import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/consts/queryKeys"
import { getCourseLinkedContentAdmin } from "@/services/coursesService"

export function useGetCourseContent(courseId?: string) {
  return useQuery({
    queryKey: courseId ? queryKeys.courses.content(courseId) : (["courses", "content", "__none__"] as const),
    enabled: !!courseId,
    queryFn: () => getCourseLinkedContentAdmin(courseId!),
  })
}
