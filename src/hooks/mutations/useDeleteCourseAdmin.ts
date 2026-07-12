import { useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/consts/queryKeys"
import { invalidateAuditLogs } from "@/lib/invalidateAuditLogs"
import { deleteCourseAdmin } from "@/services/courses"

export function useDeleteCourseAdmin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (courseId: string) => deleteCourseAdmin(courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.list })
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.dashboard })
      invalidateAuditLogs(queryClient)
    },
  })
}
