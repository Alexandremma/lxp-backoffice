import { fireAuditLog } from "@/lib/auditLogHelpers"
import { assertCanCreateCourse } from "@/lib/planLimits"
import { supabase } from "@/lib/supabaseClient"
import type { CourseAdmin, CourseStatus } from "@/types/courseAdmin"
import type { UpsertCourseAdminPayload } from "@/types/courseAdmin"

type CourseDbRow = {
    id: string
    name: string
    description: string | null
    status: string
    category: string | null
    periods: number | null
    external_library_id: string | null
    created_at: string
}

export async function getCoursesAdmin(): Promise<CourseAdmin[]> {
    const [coursesResult, enrollmentsResult, periodsResult] = await Promise.all([
        supabase
            .from("lxp_courses")
            .select("id,name,description,status,category,periods,external_library_id,created_at")
            .order("created_at", { ascending: false }),
        supabase.from("lxp_enrollments").select("course_id"),
        supabase.from("lxp_course_periods").select("course_id"),
    ])

    if (coursesResult.error) throw coursesResult.error
    if (enrollmentsResult.error) throw enrollmentsResult.error
    if (periodsResult.error) throw periodsResult.error

    const coursesData = coursesResult.data
    const enrollmentsData = enrollmentsResult.data
    const periodsData = periodsResult.data

    const countsByCourseId = new Map<string, number>()
    ;(enrollmentsData ?? []).forEach((e: { course_id: string }) => {
        countsByCourseId.set(e.course_id, (countsByCourseId.get(e.course_id) ?? 0) + 1)
    })

    const periodsByCourseId = new Map<string, number>()
    ;(periodsData ?? []).forEach((p: { course_id: string }) => {
        periodsByCourseId.set(p.course_id, (periodsByCourseId.get(p.course_id) ?? 0) + 1)
    })

    const mapped: CourseAdmin[] = (coursesData ?? []).map((c) => {
        const row = c as CourseDbRow
        return {
            id: row.id,
            name: row.name,
            description: row.description ?? "",
            category: (row.category as CourseAdmin["category"]) ?? "graduation",
            status: (row.status as CourseStatus) ?? "draft",
            periods: periodsByCourseId.get(row.id) ?? row.periods ?? 0,
            totalStudents: countsByCourseId.get(row.id) ?? 0,
            createdAt: row.created_at,
            externalLibraryId: row.external_library_id ?? undefined,
        }
    })

    return mapped
}

export async function getCourseDetailAdmin(courseId: string): Promise<CourseAdmin | undefined> {
    const [courseResult, enrollmentsResult, periodsResult] = await Promise.all([
        supabase
            .from("lxp_courses")
            .select("id,name,description,status,category,periods,external_library_id,created_at")
            .eq("id", courseId)
            .maybeSingle(),
        supabase.from("lxp_enrollments").select("student_profile_id").eq("course_id", courseId),
        supabase.from("lxp_course_periods").select("id").eq("course_id", courseId),
    ])

    if (courseResult.error) throw courseResult.error
    if (enrollmentsResult.error) throw enrollmentsResult.error
    if (periodsResult.error) throw periodsResult.error
    if (!courseResult.data) return undefined

    const row = courseResult.data as CourseDbRow
    const mapped: CourseAdmin = {
        id: row.id,
        name: row.name,
        description: row.description ?? "",
        category: (row.category as CourseAdmin["category"]) ?? "graduation",
        status: (row.status as CourseStatus) ?? "draft",
        periods: (periodsResult.data ?? []).length || row.periods || 0,
        totalStudents: new Set((enrollmentsResult.data ?? []).map((e: { student_profile_id: string }) => e.student_profile_id)).size,
        createdAt: row.created_at,
        externalLibraryId: row.external_library_id ?? undefined,
    }

    return mapped
}

export async function createCourseAdmin(payload: UpsertCourseAdminPayload): Promise<void> {
    await assertCanCreateCourse()

    const { data: createdCourse, error: courseError } = await supabase
        .from("lxp_courses")
        .insert({
            name: payload.name.trim(),
            description: payload.description.trim(),
            category: payload.category,
            status: payload.status,
            periods: 1,
            external_library_id: payload.externalLibraryId?.trim() || null,
        })
        .select("id")
        .single()

    if (courseError) throw courseError

    const courseId = (createdCourse as { id: string }).id
    const { error: periodsError } = await supabase.from("lxp_course_periods").insert({
        course_id: courseId,
        number: 1,
        name: "1º Período",
        status: payload.status === "active" ? "current" : "upcoming",
    })
    if (periodsError) throw periodsError

    fireAuditLog({
        action: "course.create",
        entityType: "lxp_course",
        entityId: courseId,
        metadata: { name: payload.name.trim() },
    })
}

export async function deleteCourseAdmin(courseId: string): Promise<void> {
    const { error } = await supabase.from("lxp_courses").delete().eq("id", courseId)
    if (error) throw error

    fireAuditLog({
        action: "course.delete",
        entityType: "lxp_course",
        entityId: courseId,
    })
}

export async function updateCourseAdmin(
    courseId: string,
    payload: Pick<UpsertCourseAdminPayload, "name" | "description" | "category" | "status" | "externalLibraryId">,
): Promise<void> {
    const { error } = await supabase
        .from("lxp_courses")
        .update({
            name: payload.name.trim(),
            description: payload.description.trim(),
            category: payload.category,
            status: payload.status,
            external_library_id: payload.externalLibraryId?.trim() || null,
            updated_at: new Date().toISOString(),
        })
        .eq("id", courseId)
    if (error) throw error

    fireAuditLog({
        action: "course.update",
        entityType: "lxp_course",
        entityId: courseId,
        metadata: { name: payload.name.trim() },
    })
}
