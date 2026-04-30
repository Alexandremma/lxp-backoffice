import { supabase } from "@/lib/supabaseClient"

export type AdminDashboardStats = {
    totalStudents: number
    activeStudents: number
    totalCourses: number
    totalTeamMembers: number
}

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
    const [
        { count: totalStudentsCount, error: totalStudentsError },
        { count: totalCoursesCount, error: totalCoursesError },
        { count: totalTeamMembersCount, error: totalTeamMembersError },
        { data: activeEnrollments, error: activeEnrollmentsError },
    ] = await Promise.all([
        supabase
            .from("lxp_profiles")
            .select("id", { count: "exact", head: true })
            .eq("role", "student"),
        supabase
            .from("lxp_courses")
            .select("id", { count: "exact", head: true }),
        supabase
            .from("backoffice_team_members")
            .select("id", { count: "exact", head: true }),
        supabase
            .from("lxp_enrollments")
            .select("student_profile_id")
            .eq("status", "active"),
    ])

    if (totalStudentsError) throw totalStudentsError
    if (totalCoursesError) throw totalCoursesError
    if (totalTeamMembersError) throw totalTeamMembersError
    if (activeEnrollmentsError) throw activeEnrollmentsError

    const activeStudents = new Set((activeEnrollments ?? []).map((row) => row.student_profile_id as string)).size

    return {
        totalStudents: totalStudentsCount ?? 0,
        activeStudents,
        totalCourses: totalCoursesCount ?? 0,
        totalTeamMembers: totalTeamMembersCount ?? 0,
    }
}
