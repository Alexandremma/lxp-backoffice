import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/consts/queryKeys"
import { getCourseStudentsAdmin } from "@/services/coursesService"

export function useGetCourseStudents(courseId?: string, courseName?: string) {
    return useQuery({
        queryKey: courseId ? queryKeys.courses.students(courseId) : (["courses", "students", "__none__"] as const),
        enabled: !!courseId && !!courseName,
        queryFn: () => getCourseStudentsAdmin(courseId!, courseName!),
        retry: 1,
    })
}

