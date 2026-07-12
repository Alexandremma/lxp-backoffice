import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/consts/queryKeys"
import { getCourseDetailAdmin } from "@/services/courses"

export function useGetCourseDetail(courseId?: string) {
    return useQuery({
        queryKey: courseId
            ? queryKeys.courses.detail(courseId)
            : queryKeys.courses.disabled.detail,
        enabled: !!courseId,
        queryFn: () => getCourseDetailAdmin(courseId!),
        retry: 1,
    })
}

