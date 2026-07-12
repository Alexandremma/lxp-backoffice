import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/consts/queryKeys"
import { getCourseStudentsAdmin } from "@/services/courses"

export function useGetCourseStudents(courseId?: string, courseName?: string) {
    return useQuery({
        queryKey: courseId ? queryKeys.courses.students(courseId) : queryKeys.courses.disabled.students,
        enabled: !!courseId && !!courseName,
        queryFn: () => getCourseStudentsAdmin(courseId!, courseName!),
        retry: 1,
    })
}

