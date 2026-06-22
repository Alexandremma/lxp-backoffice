import { supabase } from "@/lib/supabaseClient"
import type { CourseRecentActivityItem } from "@/types/courseActivity"

export async function getCourseRecentActivityAdmin(courseId: string): Promise<CourseRecentActivityItem[]> {
    const [enrollmentsResult, linksResult, periodsResult] = await Promise.all([
        supabase
            .from("lxp_enrollments")
            .select("student_profile_id,created_at,lxp_profiles(name)")
            .eq("course_id", courseId)
            .order("created_at", { ascending: false })
            .limit(5),
        supabase
            .from("lxp_course_library_links")
            .select(
                "id,library_content_name,linked_at,lxp_course_disciplines!inner(id,lxp_course_periods!inner(course_id))",
            )
            .eq("lxp_course_disciplines.lxp_course_periods.course_id", courseId)
            .order("linked_at", { ascending: false })
            .limit(5),
        supabase
            .from("lxp_course_periods")
            .select("id,name,created_at")
            .eq("course_id", courseId)
            .order("created_at", { ascending: false })
            .limit(3),
    ])

    if (enrollmentsResult.error) throw enrollmentsResult.error
    if (linksResult.error) throw linksResult.error
    if (periodsResult.error) throw periodsResult.error

    const enrollmentEvents: CourseRecentActivityItem[] = (enrollmentsResult.data ?? []).map(
        (row: { student_profile_id: string; created_at: string; lxp_profiles: Array<{ name: string | null }> | null }) => ({
            id: `enrollment-${row.student_profile_id}-${row.created_at}`,
            action: "Novo aluno matriculado",
            actor: row.lxp_profiles?.[0]?.name ?? "Aluno",
            happenedAt: row.created_at,
        }),
    )

    const linkEvents: CourseRecentActivityItem[] = (linksResult.data ?? []).map(
        (row: { id: string; library_content_name: string | null; linked_at: string }) => ({
            id: `link-${row.id}`,
            action: `Conteúdo vinculado: ${row.library_content_name ?? "Conteúdo externo"}`,
            actor: "Admin",
            happenedAt: row.linked_at,
        }),
    )

    const periodEvents: CourseRecentActivityItem[] = (periodsResult.data ?? []).map(
        (row: { id: string; name: string; created_at: string }) => ({
            id: `period-${row.id}`,
            action: `Período criado: ${row.name}`,
            actor: "Admin",
            happenedAt: row.created_at,
        }),
    )

    return [...enrollmentEvents, ...linkEvents, ...periodEvents]
        .sort((a, b) => new Date(b.happenedAt).getTime() - new Date(a.happenedAt).getTime())
        .slice(0, 8)
}
