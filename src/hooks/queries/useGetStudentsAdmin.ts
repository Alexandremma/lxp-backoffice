import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/consts/queryKeys"
import { getAllStudentsAdmin } from "@/services/courses"

export function useGetStudentsAdmin() {
    return useQuery({
        queryKey: queryKeys.students.list,
        queryFn: getAllStudentsAdmin,
        retry: 1,
    })
}
