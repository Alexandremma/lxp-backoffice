import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/consts/queryKeys"
import { getCourseGradesAdmin } from "@/services/coursesService"

export function useGetCourseGrades(courseId: string) {
  return useQuery({
    queryKey: queryKeys.courses.grades(courseId),
    queryFn: () => getCourseGradesAdmin(courseId),
    enabled: !!courseId,
  })
}
