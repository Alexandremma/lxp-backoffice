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
    userId?: string
}): Promise<void> {
    const generatedUserId =
        params.userId ??
        (typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(16).slice(2)}`)

    const { error } = await supabase.from("backoffice_team_members").insert({
        user_id: generatedUserId,
        name: params.name,
        email: params.email,
        role: params.role,
    })
    if (error) throw error
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
