import { FunctionsHttpError } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabaseClient"

export type TeamMemberAdminRow = {
    id: string
    userId: string
    name: string
    email: string
    role: "admin" | "coordinator" | "secretary" | "professor" | "tutor" | "financial" | "commercial"
    createdAt: string
    updatedAt: string
}

type TeamInviteErrorCode =
    | "TEAM_MEMBER_EXISTS"
    | "AUTH_USER_ALREADY_EXISTS"
    | "INVITE_NOT_ALLOWED"
    | "INVITE_BAD_REQUEST"
    | "INVITE_UNKNOWN_ERROR"

export type TeamInviteResult = {
    member: TeamMemberAdminRow
    invitationSent: boolean
}

type InviteFunctionResponse = {
    member: {
        id: string
        user_id: string
        name: string | null
        email: string | null
        role: TeamMemberAdminRow["role"] | null
        created_at: string
        updated_at: string
    }
    invitation_sent: boolean
}

function toTeamMemberAdminRow(row: InviteFunctionResponse["member"]): TeamMemberAdminRow {
    return {
        id: row.id,
        userId: row.user_id,
        name: row.name ?? "Sem nome",
        email: row.email ?? "",
        role: (row.role ?? "admin") as TeamMemberAdminRow["role"],
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    }
}

function createInviteError(code: TeamInviteErrorCode, message: string): Error & { code: TeamInviteErrorCode } {
    const err = new Error(message) as Error & { code: TeamInviteErrorCode }
    err.code = code
    return err
}

async function normalizeFunctionError(error: unknown): Promise<never> {
    if (!(error instanceof FunctionsHttpError)) throw error

    try {
        const payload = (await error.context.json()) as {
            code?: TeamInviteErrorCode
            message?: string
        }
        const code = payload.code ?? "INVITE_UNKNOWN_ERROR"
        const message = payload.message ?? "Falha ao enviar convite do membro."
        throw createInviteError(code, message)
    } catch (parseErr) {
        if (parseErr instanceof Error && "code" in parseErr) throw parseErr
        throw createInviteError("INVITE_UNKNOWN_ERROR", "Falha ao enviar convite do membro.")
    }
}

export async function getTeamMembersAdmin(): Promise<TeamMemberAdminRow[]> {
    const { data, error } = await supabase
        .from("backoffice_team_members")
        .select("id,user_id,name,email,role,created_at,updated_at")
        .order("created_at", { ascending: false })

    if (error) throw error

    return (data ?? []).map((row) => ({
        id: row.id as string,
        userId: row.user_id as string,
        name: (row.name as string | null) ?? "Sem nome",
        email: (row.email as string | null) ?? "",
        role: ((row.role as string | null) ?? "admin") as TeamMemberAdminRow["role"],
        createdAt: row.created_at as string,
        updatedAt: row.updated_at as string,
    }))
}

export async function createTeamMemberAdmin(params: {
    name: string
    email: string
    role: TeamMemberAdminRow["role"]
}): Promise<TeamInviteResult> {
    const { data, error } = await supabase.functions.invoke<InviteFunctionResponse>("invite-team-member", {
        body: {
            name: params.name,
            email: params.email,
            role: params.role,
        },
    })

    if (error) await normalizeFunctionError(error)
    if (!data?.member) {
        throw createInviteError("INVITE_UNKNOWN_ERROR", "Convite criado, mas sem retorno válido da função.")
    }

    return {
        member: toTeamMemberAdminRow(data.member),
        invitationSent: Boolean(data.invitation_sent),
    }
}

export async function updateTeamMemberAdmin(params: {
    id: string
    name: string
    email: string
    role: TeamMemberAdminRow["role"]
}): Promise<void> {
    const { error } = await supabase
        .from("backoffice_team_members")
        .update({
            name: params.name,
            email: params.email,
            role: params.role,
            updated_at: new Date().toISOString(),
        })
        .eq("id", params.id)
    if (error) throw error
}

export async function deleteTeamMemberAdmin(id: string): Promise<void> {
    const { error } = await supabase.from("backoffice_team_members").delete().eq("id", id)
    if (error) throw error
}
