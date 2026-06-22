import { fireAuditLog } from "@/lib/auditLogHelpers"
import { supabase } from "@/lib/supabaseClient"

export async function syncCoursePeriodsCount(courseId: string): Promise<void> {
    const { data: periodsData, error: periodsError } = await supabase
        .from("lxp_course_periods")
        .select("id")
        .eq("course_id", courseId)
    if (periodsError) throw periodsError

    const { error: courseError } = await supabase
        .from("lxp_courses")
        .update({ periods: (periodsData ?? []).length, updated_at: new Date().toISOString() })
        .eq("id", courseId)
    if (courseError) throw courseError
}

export async function createCoursePeriodAdmin(
    courseId: string,
    data: { name: string; status: "current" | "completed" | "upcoming" },
): Promise<void> {
    const { data: maxNumberData, error: maxNumberError } = await supabase
        .from("lxp_course_periods")
        .select("number")
        .eq("course_id", courseId)
        .order("number", { ascending: false })
        .limit(1)
        .maybeSingle()

    if (maxNumberError) throw maxNumberError

    const nextNumber = (maxNumberData?.number ?? 0) + 1

    const { data: inserted, error } = await supabase
        .from("lxp_course_periods")
        .insert({
            course_id: courseId,
            name: data.name,
            status: data.status,
            number: nextNumber,
        })
        .select("id")
        .single()

    if (error) throw error
    await syncCoursePeriodsCount(courseId)

    fireAuditLog({
        action: "course.period.create",
        entityType: "lxp_course_period",
        entityId: (inserted as { id: string }).id,
        metadata: { courseId, name: data.name, number: nextNumber },
    })
}

export async function updateCoursePeriodAdmin(
    periodId: string,
    data: { name: string; status: "current" | "completed" | "upcoming" },
): Promise<void> {
    const { error } = await supabase
        .from("lxp_course_periods")
        .update({
            name: data.name,
            status: data.status,
            updated_at: new Date().toISOString(),
        })
        .eq("id", periodId)

    if (error) throw error

    fireAuditLog({
        action: "course.period.update",
        entityType: "lxp_course_period",
        entityId: periodId,
        metadata: { name: data.name, status: data.status },
    })
}

export async function deleteCoursePeriodAdmin(periodId: string): Promise<void> {
    const { data: period, error: getError } = await supabase
        .from("lxp_course_periods")
        .select("course_id")
        .eq("id", periodId)
        .maybeSingle()
    if (getError) throw getError

    const { error } = await supabase.from("lxp_course_periods").delete().eq("id", periodId)
    if (error) throw error
    if (period?.course_id) await syncCoursePeriodsCount(period.course_id)

    fireAuditLog({
        action: "course.period.delete",
        entityType: "lxp_course_period",
        entityId: periodId,
        metadata: period?.course_id ? { courseId: period.course_id as string } : {},
    })
}
