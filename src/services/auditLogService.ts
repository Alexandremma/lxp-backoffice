import { supabase } from "@/lib/supabaseClient"
import type { AuditLogRow } from "@/types/settings"

export async function writeAuditLog(input: {
    action: string
    entityType?: string
    entityId?: string
    metadata?: Record<string, unknown>
}): Promise<string> {
    const { data, error } = await supabase.rpc("lxp_write_audit_log", {
        p_action: input.action,
        p_entity_type: input.entityType ?? null,
        p_entity_id: input.entityId ?? null,
        p_metadata: input.metadata ?? {},
    })
    if (error) throw error
    return data as string
}

type AuditLogDbRow = {
    id: string
    actor_profile_id: string | null
    action: string
    entity_type: string | null
    entity_id: string | null
    metadata: Record<string, unknown> | null
    created_at: string
}

export async function listAuditLogs(params?: {
    limit?: number
    offset?: number
}): Promise<AuditLogRow[]> {
    const limit = params?.limit ?? 50
    const offset = params?.offset ?? 0

    const { data, error } = await supabase
        .from("lxp_audit_logs")
        .select("id, actor_profile_id, action, entity_type, entity_id, metadata, created_at")
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1)

    if (error) throw error

    const rows = (data ?? []) as AuditLogDbRow[]
    const actorIds = [...new Set(rows.map((r) => r.actor_profile_id).filter((id): id is string => Boolean(id)))]

    const nameByProfileId = new Map<string, string>()
    if (actorIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
            .from("lxp_profiles")
            .select("id, name, email, user_id")
            .in("id", actorIds)
        if (profilesError) throw profilesError

        const userIdsForTeamLookup = new Set<string>()
        for (const p of profiles ?? []) {
            const id = p.id as string
            const name = (p.name as string | null)?.trim()
            const email = (p.email as string | null)?.trim()
            if (name || email) {
                nameByProfileId.set(id, name || email || id)
            } else if (p.user_id) {
                userIdsForTeamLookup.add(p.user_id as string)
            }
        }

        if (userIdsForTeamLookup.size > 0) {
            const { data: members, error: membersError } = await supabase
                .from("backoffice_team_members")
                .select("user_id, name, email")
                .in("user_id", [...userIdsForTeamLookup])
            if (membersError) throw membersError

            const nameByUserId = new Map<string, string>()
            for (const m of members ?? []) {
                const label =
                    (m.name as string | null)?.trim() ||
                    (m.email as string | null)?.trim() ||
                    (m.user_id as string)
                nameByUserId.set(m.user_id as string, label)
            }

            for (const p of profiles ?? []) {
                const id = p.id as string
                if (nameByProfileId.has(id)) continue
                const userId = p.user_id as string | undefined
                if (userId && nameByUserId.has(userId)) {
                    nameByProfileId.set(id, nameByUserId.get(userId)!)
                } else {
                    nameByProfileId.set(id, id)
                }
            }
        }
    }

    return rows.map((row) => ({
        id: row.id,
        actor_profile_id: row.actor_profile_id,
        action: row.action,
        entity_type: row.entity_type,
        entity_id: row.entity_id,
        metadata: row.metadata ?? {},
        created_at: row.created_at,
        actor_name: row.actor_profile_id ? nameByProfileId.get(row.actor_profile_id) ?? null : null,
    }))
}
