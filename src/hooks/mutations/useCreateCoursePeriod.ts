import { useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/consts/queryKeys"
import { invalidateAuditLogs } from "@/lib/invalidateAuditLogs"
import { createCoursePeriodAdmin } from "@/services/courses"

export function useCreateCoursePeriod(courseId?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { name: string; status: "current" | "completed" | "upcoming" }) =>
      createCoursePeriodAdmin(courseId!, data),
    onSuccess: () => {
      if (!courseId) return
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.grades(courseId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.detail(courseId) })
      invalidateAuditLogs(queryClient)
    },
  })
}
