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
        p_phone: params.phone ?? null,
        p_birth_date: params.birthDate || null,
    })
    if (error) throw error
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
    redirectTo?: string
}): Promise<void> {
    const { error } = await supabase.functions.invoke("manage-student-admin", {
        body: {
            action: "create",
            name: params.name,
            email: params.email,
            course_ids: params.courseIds,
            status: params.status,
            redirect_to: params.redirectTo,
        },
    })
    if (error) await normalizeFunctionError(error)
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
}

export async function deleteStudentAdmin(profileId: string): Promise<void> {
    const { error } = await supabase.functions.invoke("manage-student-admin", {
        body: {
            action: "delete",
            profile_id: profileId,
        },
    })
    if (error) await normalizeFunctionError(error)
}
