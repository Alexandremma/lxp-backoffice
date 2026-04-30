import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/consts/queryKeys"
import { getCourseRecentActivityAdmin } from "@/services/coursesService"

export function useGetCourseRecentActivity(courseId?: string) {
    return useQuery({
        queryKey: courseId
            ? queryKeys.courses.recentActivity(courseId)
            : (["courses", "recent-activity", "__none__"] as const),
        enabled: !!courseId,
        queryFn: () => getCourseRecentActivityAdmin(courseId!),
        retry: 1,
    })
}
