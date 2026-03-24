import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/consts/queryKeys"
import { getCoursesAdmin } from "@/services/coursesService"

export function useGetCourses() {
    return useQuery({
        queryKey: queryKeys.courses.list,
        queryFn: getCoursesAdmin,
        retry: 1,
    })
}

