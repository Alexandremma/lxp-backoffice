import {
  courseProgressFromDisciplineStatuses,
  progressLookupKey,
} from "@/lib/studentCourseProgress"
import { supabase } from "@/lib/supabaseClient"

export type CourseDisciplineIndex = {
  discByCourse: Map<string, string[]>
  linkedDiscByCourse: Map<string, string[]>
}

export type DisciplineProgressRow = {
  student_profile_id: string
  course_discipline_id: string
  status: string
}

export async function fetchCourseDisciplineIndex(courseIds: string[]): Promise<CourseDisciplineIndex> {
  const discByCourse = new Map<string, string[]>()
  const linkedDiscByCourse = new Map<string, string[]>()

  if (courseIds.length === 0) {
    return { discByCourse, linkedDiscByCourse }
  }

  for (const courseId of courseIds) {
    discByCourse.set(courseId, [])
    linkedDiscByCourse.set(courseId, [])
  }

  const { data: periodsData, error: periodsError } = await supabase
    .from("lxp_course_periods")
    .select("id,course_id")
    .in("course_id", courseIds)

  if (periodsError) throw periodsError

  const periodToCourse = new Map<string, string>()
  for (const period of periodsData ?? []) {
    periodToCourse.set(period.id as string, period.course_id as string)
  }

  const periodIds = [...periodToCourse.keys()]
  if (periodIds.length === 0) {
    return { discByCourse, linkedDiscByCourse }
  }

  const { data: disciplineRows, error: disciplinesError } = await supabase
    .from("lxp_course_disciplines")
    .select("id,course_period_id")
    .in("course_period_id", periodIds)

  if (disciplinesError) throw disciplinesError

  const allDiscIds: string[] = []
  for (const discipline of disciplineRows ?? []) {
    const courseId = periodToCourse.get(discipline.course_period_id as string)
    if (!courseId) continue
    const discId = discipline.id as string
    discByCourse.get(courseId)!.push(discId)
    allDiscIds.push(discId)
  }

  if (allDiscIds.length === 0) {
    return { discByCourse, linkedDiscByCourse }
  }

  const { data: linkRows, error: linksError } = await supabase
    .from("lxp_course_library_links")
    .select("course_discipline_id")
    .eq("library_content_type", "discipline")
    .in("course_discipline_id", allDiscIds)

  if (linksError) throw linksError

  const linkedDiscSet = new Set((linkRows ?? []).map((row) => row.course_discipline_id as string))

  for (const [courseId, discIds] of discByCourse) {
    linkedDiscByCourse.set(
      courseId,
      discIds.filter((discId) => linkedDiscSet.has(discId)),
    )
  }

  return { discByCourse, linkedDiscByCourse }
}

export async function fetchDisciplineProgressRows(
  studentProfileIds: string[],
  disciplineIds: string[],
): Promise<DisciplineProgressRow[]> {
  if (studentProfileIds.length === 0 || disciplineIds.length === 0) return []

  const { data, error } = await supabase
    .from("lxp_student_discipline_progress")
    .select("student_profile_id,course_discipline_id,status")
    .in("student_profile_id", studentProfileIds)
    .in("course_discipline_id", disciplineIds)

  if (error) throw error
  return (data ?? []) as DisciplineProgressRow[]
}

export function buildProgressStatusByKey(rows: DisciplineProgressRow[]): Map<string, string> {
  const map = new Map<string, string>()
  for (const row of rows) {
    map.set(progressLookupKey(row.student_profile_id, row.course_discipline_id), row.status)
  }
  return map
}

export function resolveEnrollmentProgressPercent(
  studentId: string,
  courseId: string,
  index: CourseDisciplineIndex,
  progressByKey: Map<string, string>,
): number {
  const linked = index.linkedDiscByCourse.get(courseId) ?? []
  const fallback = index.discByCourse.get(courseId) ?? []
  const scope = linked.length > 0 ? linked : fallback

  return courseProgressFromDisciplineStatuses(scope, (disciplineId) =>
    progressByKey.get(progressLookupKey(studentId, disciplineId)) ?? "pending",
  )
}
