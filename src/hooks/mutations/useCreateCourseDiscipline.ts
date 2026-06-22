import { useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/consts/queryKeys"
import {
  createCourseDisciplineAdmin,
  uploadDisciplineCoverAdmin,
} from "@/services/courses"
import type { LessonAccessMode } from "@/types/discipline"

export function useCreateCourseDiscipline(courseId?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: {
      periodId: string
      data: {
        name: string
        code: string
        workload: number
        credits: number
        creditsEnabled?: boolean
        professor?: string
        description?: string
        status?: "active" | "inactive"
        lessonAccessMode?: LessonAccessMode
      }
      coverFile?: File | null
    }) => {
      const disciplineId = await createCourseDisciplineAdmin(payload.periodId, payload.data)
      if (payload.coverFile) {
        await uploadDisciplineCoverAdmin(disciplineId, payload.coverFile)
      }
      return disciplineId
    },
    onSuccess: () => {
      if (!courseId) return
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.grades(courseId) })
    },
  })
}
