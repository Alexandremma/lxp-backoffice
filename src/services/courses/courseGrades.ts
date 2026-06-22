import { supabase } from "@/lib/supabaseClient"
import type { CourseDisciplineAdmin, CoursePeriodAdmin } from "@/types/courseGrades"
import type { LessonAccessMode } from "@/types/discipline"

export async function getCourseGradesAdmin(courseId: string): Promise<CoursePeriodAdmin[]> {
    const { data: periodsData, error: periodsError } = await supabase
        .from("lxp_course_periods")
        .select("id,course_id,number,name,status")
        .eq("course_id", courseId)
        .order("number", { ascending: true })

    if (periodsError) throw periodsError

    const periodRows = (periodsData ?? []) as Array<{
        id: string
        course_id: string
        number: number
        name: string
        status: "current" | "completed" | "upcoming"
    }>

    if (periodRows.length === 0) return []

    const periodIds = periodRows.map((p) => p.id)
    const { data: disciplinesData, error: disciplinesError } = await supabase
        .from("lxp_course_disciplines")
        .select("id,course_period_id,name,code,workload,credits,credits_enabled,professor,status,description,cover_image_path,lesson_access_mode")
        .in("course_period_id", periodIds)
        .order("created_at", { ascending: true })

    if (disciplinesError) throw disciplinesError

    const disciplineRows = (disciplinesData ?? []) as Array<{
        id: string
        course_period_id: string
        name: string
        code: string
        workload: number
        credits: number
        credits_enabled: boolean
        professor: string | null
        status: "active" | "inactive"
        description: string | null
        cover_image_path: string | null
        lesson_access_mode: LessonAccessMode | null
    }>

    const disciplineIds = disciplineRows.map((d) => d.id)
    const linksByDisciplineId = new Map<
        string,
        { linkId: string; contentId?: string; contentName?: string }
    >()

    if (disciplineIds.length > 0) {
        const { data: linksData, error: linksError } = await supabase
            .from("lxp_course_library_links")
            .select("id,course_discipline_id,library_content_id,library_content_name,linked_at")
            .in("course_discipline_id", disciplineIds)
            .order("linked_at", { ascending: false })

        if (linksError) throw linksError

        ;(linksData ?? []).forEach(
            (link: {
                id: string
                course_discipline_id: string
                library_content_id: string
                library_content_name: string | null
            }) => {
                if (linksByDisciplineId.has(link.course_discipline_id)) return
                linksByDisciplineId.set(link.course_discipline_id, {
                    linkId: link.id,
                    contentId: link.library_content_id,
                    contentName: link.library_content_name ?? undefined,
                })
            },
        )
    }

    const disciplinesByPeriodId = new Map<string, CourseDisciplineAdmin[]>()
    disciplineRows.forEach((row) => {
        const arr = disciplinesByPeriodId.get(row.course_period_id) ?? []
        const link = linksByDisciplineId.get(row.id)
        arr.push({
            id: row.id,
            periodId: row.course_period_id,
            name: row.name,
            code: row.code,
            workload: row.workload ?? 0,
            credits: row.credits ?? 0,
            creditsEnabled: row.credits_enabled ?? true,
            professor: row.professor ?? undefined,
            description: row.description?.trim() || undefined,
            coverImagePath: row.cover_image_path ?? undefined,
            status: row.status ?? "active",
            lessonAccessMode: row.lesson_access_mode ?? "free",
            linkedTrailId: link?.contentId,
            linkedTrailName: link?.contentName,
            linkedLibraryLinkId: link?.linkId,
        })
        disciplinesByPeriodId.set(row.course_period_id, arr)
    })

    return periodRows.map((period) => ({
        id: period.id,
        courseId: period.course_id,
        number: period.number,
        name: period.name,
        status: period.status,
        disciplines: disciplinesByPeriodId.get(period.id) ?? [],
    }))
}
