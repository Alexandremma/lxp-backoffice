import { fireAuditLog } from "@/lib/auditLogHelpers"
import { supabase } from "@/lib/supabaseClient"
import { getLibraryDisciplineUrl } from "@/services/libraryAdapter"
import type { CourseLinkedContentAdmin } from "@/types/courseLibrary"

export async function unlinkCourseContentByDisciplineAdmin(disciplineId: string): Promise<void> {
    const { error } = await supabase
        .from("lxp_course_library_links")
        .delete()
        .eq("course_discipline_id", disciplineId)
    if (error) throw error

    fireAuditLog({
        action: "course.library.unlink",
        entityType: "lxp_course_discipline",
        entityId: disciplineId,
    })
}

export async function getCourseLinkedContentAdmin(courseId: string): Promise<CourseLinkedContentAdmin[]> {
    const { data, error } = await supabase
        .from("lxp_course_library_links")
        .select(
            "id,course_discipline_id,library_content_type,library_content_id,library_content_name,linked_at,linked_by,lxp_course_disciplines!inner(id,name,course_period_id,lxp_course_periods!inner(course_id))",
        )
        .eq("lxp_course_disciplines.lxp_course_periods.course_id", courseId)
        .eq("library_content_type", "discipline")
        .order("linked_at", { ascending: false })

    if (error) throw error

    const rows = (data ?? []) as Array<{
        id: string
        course_discipline_id: string
        library_content_type: "discipline"
        library_content_id: string
        library_content_name: string | null
        linked_at: string
        linked_by: string | null
        lxp_course_disciplines:
            | {
                  id: string
                  name: string
                  course_period_id: string
                  lxp_course_periods: { course_id: string } | Array<{ course_id: string }>
              }
            | Array<{
                  id: string
                  name: string
                  course_period_id: string
                  lxp_course_periods: { course_id: string } | Array<{ course_id: string }>
              }>
    }>

    const linkedByIds = [...new Set(rows.map((row) => row.linked_by).filter((v): v is string => Boolean(v)))]
    const linkedByMap = new Map<string, string>()
    if (linkedByIds.length > 0) {
        const { data: membersData, error: membersError } = await supabase
            .from("backoffice_team_members")
            .select("user_id,name,email")
            .in("user_id", linkedByIds)
        if (membersError) throw membersError
        ;(membersData ?? []).forEach((m: { user_id: string; name: string | null; email: string | null }) => {
            linkedByMap.set(m.user_id, m.name ?? m.email ?? m.user_id)
        })
    }

    return rows.map((row) => {
        const disciplineRaw = Array.isArray(row.lxp_course_disciplines)
            ? row.lxp_course_disciplines[0]
            : row.lxp_course_disciplines
        const periodRaw = Array.isArray(disciplineRaw?.lxp_course_periods)
            ? disciplineRaw?.lxp_course_periods[0]
            : disciplineRaw?.lxp_course_periods
        return {
            id: row.id,
            courseId: periodRaw?.course_id ?? courseId,
            libraryContentId: row.library_content_id,
            libraryContentName: row.library_content_name ?? row.library_content_id,
            externalUrl: getLibraryDisciplineUrl(row.library_content_id),
            type: row.library_content_type,
            linkedAt: row.linked_at,
            linkedBy: row.linked_by ? linkedByMap.get(row.linked_by) ?? row.linked_by : "Sistema",
            disciplineId: disciplineRaw?.id,
            disciplineName: disciplineRaw?.name,
        }
    })
}

export async function linkCourseContentAdmin(
    data: {
        disciplineId: string
        libraryContentType: "discipline"
        libraryContentId: string
        libraryContentName?: string
    },
): Promise<void> {
    const { error: cleanupError } = await supabase
        .from("lxp_course_library_links")
        .delete()
        .eq("course_discipline_id", data.disciplineId)
        .eq("library_content_type", "discipline")
    if (cleanupError) throw cleanupError

    const {
        data: { user },
    } = await supabase.auth.getUser()

    const { error } = await supabase.from("lxp_course_library_links").insert({
        course_discipline_id: data.disciplineId,
        library_content_type: data.libraryContentType,
        library_content_id: data.libraryContentId,
        library_content_name: data.libraryContentName ?? null,
        linked_by: user?.id ?? null,
    })
    if (error) throw error

    fireAuditLog({
        action: "course.library.link",
        entityType: "lxp_course_discipline",
        entityId: data.disciplineId,
        metadata: {
            libraryContentId: data.libraryContentId,
            libraryContentName: data.libraryContentName,
        },
    })
}

export async function unlinkCourseContentAdmin(linkId: string): Promise<void> {
    const { data: linkRow, error: fetchError } = await supabase
        .from("lxp_course_library_links")
        .select("course_discipline_id")
        .eq("id", linkId)
        .maybeSingle()
    if (fetchError) throw fetchError

    const { error } = await supabase.from("lxp_course_library_links").delete().eq("id", linkId)
    if (error) throw error

    const disciplineId = linkRow?.course_discipline_id as string | undefined
    if (disciplineId) {
        const { error: inactiveError } = await supabase
            .from("lxp_course_disciplines")
            .update({ status: "inactive", updated_at: new Date().toISOString() })
            .eq("id", disciplineId)
        if (inactiveError) throw inactiveError
    }

    fireAuditLog({
        action: "course.library.unlink",
        entityType: "lxp_course_discipline",
        entityId: disciplineId ?? linkId,
        metadata: { linkId },
    })
}
