import { fireAuditLog } from "@/lib/auditLogHelpers"
import { assertCanCreateStudent } from "@/lib/planLimits"
import { supabase } from "@/lib/supabaseClient"
import { FunctionsHttpError } from "@supabase/supabase-js"

export async function updateStudentProfileAdmin(params: {
    profileId: string
    name: string
    email: string
    phone?: string
    birthDate?: string
}): Promise<void> {
    const { error } = await supabase.rpc("admin_update_lxp_student_profile", {
        p_profile_id: params.profileId,
        p_name: params.name,
        p_email: params.email,
        p_phone: params.phone?.trim() ?? "",
        p_birth_date: params.birthDate?.trim() ? params.birthDate.trim() : null,
        p_touch_phone: params.phone !== undefined,
        p_touch_birth_date: params.birthDate !== undefined,
    })
    if (error) throw error

    fireAuditLog({
        action: "student.profile_update",
        entityType: "lxp_profile",
        entityId: params.profileId,
        metadata: { email: params.email.trim(), name: params.name.trim() },
    })
}

type StudentAdminErrorCode =
    | "STUDENT_ALREADY_EXISTS"
    | "STUDENT_NOT_FOUND"
    | "NOT_AUTHORIZED"
    | "INVALID_PAYLOAD"
    | "UNKNOWN_ERROR"

function createStudentAdminError(code: StudentAdminErrorCode, message: string): Error & { code: StudentAdminErrorCode } {
    const err = new Error(message) as Error & { code: StudentAdminErrorCode }
    err.code = code
    return err
}

async function normalizeFunctionError(error: unknown): Promise<never> {
    if (!(error instanceof FunctionsHttpError)) throw error

    try {
        const payload = (await error.context.json()) as { code?: StudentAdminErrorCode; message?: string }
        throw createStudentAdminError(payload.code ?? "UNKNOWN_ERROR", payload.message ?? "Falha na operação do aluno.")
    } catch (parseErr) {
        if (parseErr instanceof Error && "code" in parseErr) throw parseErr
        throw createStudentAdminError("UNKNOWN_ERROR", "Falha na operação do aluno.")
    }
}

export async function createStudentAdmin(params: {
    name: string
    email: string
    courseIds: string[]
    status: "active" | "inactive" | "blocked"
    phone?: string
    birthDate?: string
    redirectTo?: string
}): Promise<void> {
    await assertCanCreateStudent()

    const { error } = await supabase.functions.invoke("manage-student-admin", {
        body: {
            action: "create",
            name: params.name,
            email: params.email,
            course_ids: params.courseIds,
            status: params.status,
            phone: params.phone ?? null,
            birth_date: params.birthDate ?? null,
            redirect_to: params.redirectTo,
        },
    })
    if (error) await normalizeFunctionError(error)

    fireAuditLog({
        action: "student.create",
        entityType: "lxp_profile",
        metadata: {
            email: params.email.trim().toLowerCase(),
            name: params.name.trim(),
            courseIds: params.courseIds,
            status: params.status,
        },
    })
}

export async function setStudentAccessAdmin(params: {
    profileId: string
    status: "active" | "inactive" | "blocked"
}): Promise<void> {
    const { error } = await supabase.functions.invoke("manage-student-admin", {
        body: {
            action: "set_access",
            profile_id: params.profileId,
            status: params.status,
        },
    })
    if (error) await normalizeFunctionError(error)

    const action =
        params.status === "blocked"
            ? "student.block"
            : params.status === "active"
              ? "student.unblock"
              : "student.access_update"

    fireAuditLog({
        action,
        entityType: "lxp_profile",
        entityId: params.profileId,
        metadata: { status: params.status },
    })
}

export async function deleteStudentAdmin(profileId: string): Promise<void> {
    const { error } = await supabase.functions.invoke("manage-student-admin", {
        body: {
            action: "delete",
            profile_id: profileId,
        },
    })
    if (error) await normalizeFunctionError(error)

    fireAuditLog({
        action: "student.delete",
        entityType: "lxp_profile",
        entityId: profileId,
    })
}
