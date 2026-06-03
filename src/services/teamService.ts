import type { TeamRole } from "@/consts/teamRoles"
import { fireAuditLog } from "@/lib/auditLogHelpers"
import { assertCanCreateTeamMember } from "@/lib/planLimits"
import { FunctionsHttpError } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabaseClient"

export type TeamMemberAdminRow = {
    id: string
    userId: string
    name: string
    email: string
    role: TeamRole
    department: string | null
    createdAt: string
    updatedAt: string
    updatedBy: string | null
}

type TeamInviteErrorCode =
    | "TEAM_MEMBER_EXISTS"
    | "TEAM_MEMBER_NOT_FOUND"
    | "AUTH_USER_ALREADY_EXISTS"
    | "INVITE_NOT_ALLOWED"
    | "INVITE_BAD_REQUEST"
    | "PLAN_LIMIT_REACHED"
    | "INVITE_UNKNOWN_ERROR"

export type TeamInviteResult = {
    member: TeamMemberAdminRow
    invitationSent: boolean
}

type InviteFunctionResponse = {
    member?: {
        id: string
        user_id: string
        name: string | null
        email: string | null
        role: TeamMemberAdminRow["role"] | null
        department: string | null
        created_at: string
        updated_at: string
        updated_by: string | null
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
        department: row.department ?? null,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        updatedBy: row.updated_by,
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
        .select("id,user_id,name,email,role,department,created_at,updated_at,updated_by")
        .order("created_at", { ascending: false })

    if (error) throw error

    return (data ?? []).map((row) => ({
        id: row.id as string,
        userId: row.user_id as string,
        name: (row.name as string | null) ?? "Sem nome",
        email: (row.email as string | null) ?? "",
        role: ((row.role as string | null) ?? "admin") as TeamMemberAdminRow["role"],
        department: (row.department as string | null) ?? null,
        createdAt: row.created_at as string,
        updatedAt: row.updated_at as string,
        updatedBy: (row.updated_by as string | null) ?? null,
    }))
}

export async function createTeamMemberAdmin(params: {
    name: string
    email: string
    role: TeamMemberAdminRow["role"]
    department?: string | null
    redirectTo?: string
}): Promise<TeamInviteResult> {
    await assertCanCreateTeamMember()

    const { data, error } = await supabase.functions.invoke<InviteFunctionResponse>("invite-team-member", {
        body: {
            name: params.name,
            email: params.email,
            role: params.role,
            department: params.department ?? null,
            redirect_to: params.redirectTo,
        },
    })

    if (error) await normalizeFunctionError(error)
    if (!data?.member) {
        throw createInviteError("INVITE_UNKNOWN_ERROR", "Convite criado, mas sem retorno válido da função.")
    }

    // Audit: Edge `invite-team-member` (action create).
    return {
        member: toTeamMemberAdminRow(data.member),
        invitationSent: Boolean(data.invitation_sent),
    }
}

export async function resendTeamInviteAdmin(params: { email: string; redirectTo?: string }): Promise<void> {
    const { error } = await supabase.functions.invoke<InviteFunctionResponse>("invite-team-member", {
        body: {
            action: "resend",
            email: params.email,
            redirect_to: params.redirectTo,
        },
    })
    if (error) await normalizeFunctionError(error)
    // Audit: Edge `invite-team-member` (action resend).
}

export async function updateTeamMemberAdmin(params: {
    id: string
    name: string
    email: string
    role: TeamMemberAdminRow["role"]
    department?: string | null
}): Promise<void> {
    const { data: authData } = await supabase.auth.getUser()
    const { error } = await supabase
        .from("backoffice_team_members")
        .update({
            name: params.name,
            email: params.email,
            role: params.role,
            department: params.department ?? null,
            updated_at: new Date().toISOString(),
            updated_by: authData.user?.id ?? null,
        })
        .eq("id", params.id)
    if (error) throw error

    fireAuditLog({
        action: "team.member_update",
        entityType: "backoffice_team_member",
        entityId: params.id,
        metadata: { email: params.email, name: params.name, role: params.role },
    })
}

export async function deleteTeamMemberAdmin(id: string): Promise<void> {
    const { error } = await supabase.from("backoffice_team_members").delete().eq("id", id)
    if (error) throw error

    fireAuditLog({
        action: "team.member_delete",
        entityType: "backoffice_team_member",
        entityId: id,
    })
}
