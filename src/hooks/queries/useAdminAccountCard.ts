import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/consts/queryKeys"
import { supabase } from "@/lib/supabaseClient"
import { useAuth } from "@/hooks/use-auth"

export type AdminAccountCardData = {
    name: string
    email: string
    role: string
    createdAt: string | null
    lastLogin: string | null
}

export function useAdminAccountCard() {
    const { user, profile } = useAuth()

    return useQuery({
        queryKey: queryKeys.settings.adminAccount(user?.id),
        queryFn: async (): Promise<AdminAccountCardData | null> => {
            if (!user) return null

            const { data: teamRow, error } = await supabase
                .from("backoffice_team_members")
                .select("name, email, role, created_at")
                .eq("user_id", user.id)
                .maybeSingle()

            if (error) throw error

            return {
                name: (teamRow?.name as string | null) ?? profile?.name ?? user.email ?? "Administrador",
                email: (teamRow?.email as string | null) ?? profile?.email ?? user.email ?? "",
                role: (teamRow?.role as string | null) ?? profile?.role ?? "admin",
                createdAt: (teamRow?.created_at as string | null) ?? profile?.created_at ?? null,
                lastLogin: user.last_sign_in_at ?? null,
            }
        },
        enabled: !!user,
    })
}
