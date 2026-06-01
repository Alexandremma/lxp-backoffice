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

    return ((data ?? []) as AuditLogRow[]).map((row) => ({
        ...row,
        metadata: row.metadata ?? {},
    }))
}
