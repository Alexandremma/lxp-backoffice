import { useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/consts/queryKeys"
import {
  removeDisciplineCoverAdmin,
  updateCourseDisciplineAdmin,
  uploadDisciplineCoverAdmin,
} from "@/services/coursesService"

export function useUpdateCourseDiscipline(courseId?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: {
      disciplineId: string
      data: {
        name: string
        code: string
        workload: number
        credits: number
        professor?: string
        description?: string
        status?: "active" | "inactive"
      }
      coverFile?: File | null
      removeCover?: boolean
    }) => {
      await updateCourseDisciplineAdmin(payload.disciplineId, payload.data)
      if (payload.removeCover) {
        await removeDisciplineCoverAdmin(payload.disciplineId)
      } else if (payload.coverFile) {
        await uploadDisciplineCoverAdmin(payload.disciplineId, payload.coverFile)
      }
    },
    onSuccess: () => {
      if (!courseId) return
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.grades(courseId) })
    },
  })
}
