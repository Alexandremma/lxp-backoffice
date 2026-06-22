import { fireAuditLog } from "@/lib/auditLogHelpers"
import { supabase } from "@/lib/supabaseClient"
import type { LessonAccessMode } from "@/types/discipline"
import { DISCIPLINE_COVERS_BUCKET } from "./constants"

export function getDisciplineCoverPublicUrl(path: string | null | undefined): string | null {
    if (!path?.trim()) return null
    const { data } = supabase.storage.from(DISCIPLINE_COVERS_BUCKET).getPublicUrl(path.trim())
    return data.publicUrl || null
}

export async function disciplineHasStudentLessonProgress(disciplineId: string): Promise<boolean> {
    const { data: link, error: linkError } = await supabase
        .from("lxp_course_library_links")
        .select("library_content_id")
        .eq("course_discipline_id", disciplineId)
        .eq("library_content_type", "discipline")
        .maybeSingle()
    if (linkError) throw linkError
    const externalId = (link as { library_content_id?: string } | null)?.library_content_id
    if (!externalId) return false

    const { count, error } = await supabase
        .from("lxp_student_lesson_progress")
        .select("id", { count: "exact", head: true })
        .eq("external_discipline_id", externalId)
    if (error) throw error
    return (count ?? 0) > 0
}

export async function createCourseDisciplineAdmin(
    periodId: string,
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
    },
): Promise<string> {
    const creditsEnabled = data.creditsEnabled ?? true
    const { data: row, error } = await supabase
        .from("lxp_course_disciplines")
        .insert({
            course_period_id: periodId,
            name: data.name,
            code: data.code,
            workload: data.workload,
            credits: creditsEnabled ? data.credits : 0,
            credits_enabled: creditsEnabled,
            professor: data.professor ?? null,
            description: data.description?.trim() || null,
            status: data.status ?? "inactive",
            lesson_access_mode: data.lessonAccessMode ?? "free",
        })
        .select("id")
        .single()
    if (error) throw error
    const disciplineId = (row as { id: string }).id

    fireAuditLog({
        action: "course.discipline.create",
        entityType: "lxp_course_discipline",
        entityId: disciplineId,
        metadata: { name: data.name, code: data.code },
    })

    return disciplineId
}

export async function uploadDisciplineCoverAdmin(disciplineId: string, file: File): Promise<string> {
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg"
    const path = `disciplines/${disciplineId}/cover.${ext}`
    const up = await supabase.storage
        .from(DISCIPLINE_COVERS_BUCKET)
        .upload(path, file, { upsert: true, contentType: file.type })
    if (up.error) throw up.error
    const { error } = await supabase
        .from("lxp_course_disciplines")
        .update({ cover_image_path: path, updated_at: new Date().toISOString() })
        .eq("id", disciplineId)
    if (error) throw error
    return path
}

export async function removeDisciplineCoverAdmin(disciplineId: string): Promise<void> {
    const { data: row, error: getErr } = await supabase
        .from("lxp_course_disciplines")
        .select("cover_image_path")
        .eq("id", disciplineId)
        .maybeSingle()
    if (getErr) throw getErr

    const path = (row as { cover_image_path?: string | null } | null)?.cover_image_path
    if (path?.trim()) {
        await supabase.storage.from(DISCIPLINE_COVERS_BUCKET).remove([path.trim()])
    }

    const { error } = await supabase
        .from("lxp_course_disciplines")
        .update({ cover_image_path: null, updated_at: new Date().toISOString() })
        .eq("id", disciplineId)
    if (error) throw error
}

export async function updateCourseDisciplineAdmin(
    disciplineId: string,
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
    },
    options?: { skipLessonAccessMode?: boolean },
): Promise<void> {
    const creditsEnabled = data.creditsEnabled ?? true
    const updatePayload: Record<string, unknown> = {
        name: data.name,
        code: data.code,
        workload: data.workload,
        credits: creditsEnabled ? data.credits : 0,
        credits_enabled: creditsEnabled,
        professor: data.professor ?? null,
        description: data.description?.trim() || null,
        updated_at: new Date().toISOString(),
    }
    if (data.status !== undefined) updatePayload.status = data.status
    if (!options?.skipLessonAccessMode && data.lessonAccessMode !== undefined) {
        updatePayload.lesson_access_mode = data.lessonAccessMode
    }

    const { error } = await supabase
        .from("lxp_course_disciplines")
        .update(updatePayload)
        .eq("id", disciplineId)

    if (error) throw error

    fireAuditLog({
        action: "course.discipline.update",
        entityType: "lxp_course_discipline",
        entityId: disciplineId,
        metadata: { name: data.name },
    })
}

export async function deleteCourseDisciplineAdmin(disciplineId: string): Promise<void> {
    const { error } = await supabase.from("lxp_course_disciplines").delete().eq("id", disciplineId)
    if (error) throw error

    fireAuditLog({
        action: "course.discipline.delete",
        entityType: "lxp_course_discipline",
        entityId: disciplineId,
    })
}
