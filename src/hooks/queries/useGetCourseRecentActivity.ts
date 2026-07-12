import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/consts/queryKeys"
import { getCourseRecentActivityAdmin } from "@/services/courses"

export function useGetCourseRecentActivity(courseId?: string) {
    return useQuery({
        queryKey: courseId
            ? queryKeys.courses.recentActivity(courseId)
            : queryKeys.courses.disabled.recentActivity,
        enabled: !!courseId,
        queryFn: () => getCourseRecentActivityAdmin(courseId!),
        retry: 1,
    })
}
