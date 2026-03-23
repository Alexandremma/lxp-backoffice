import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/consts/queryKeys"
import { getCourseDetailAdmin } from "@/services/coursesService"

export function useGetCourseDetail(courseId?: string) {
    return useQuery({
        queryKey: courseId
            ? queryKeys.courses.detail(courseId)
            : (["courses", "detail", "__none__"] as const),
        enabled: !!courseId,
        queryFn: () => getCourseDetailAdmin(courseId!),
        retry: 1,
    })
}

