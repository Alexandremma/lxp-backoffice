import { useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/consts/queryKeys"
import { invalidateAuditLogs } from "@/lib/invalidateAuditLogs"
import { setCourseEnrollmentStatusAdmin } from "@/services/courses"

export function useSetCourseEnrollmentStatus(courseId?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: { studentProfileId: string; status: "active" | "inactive" }) =>
      setCourseEnrollmentStatusAdmin({
        courseId: courseId!,
        studentProfileId: params.studentProfileId,
        status: params.status,
      }),
    onSuccess: () => {
      if (!courseId) return
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.students(courseId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.students.list })
      invalidateAuditLogs(queryClient)
    },
  })
}
