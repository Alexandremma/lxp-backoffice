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
