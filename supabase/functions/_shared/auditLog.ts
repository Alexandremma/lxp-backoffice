import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.8"

export type EdgeAuditLogInput = {
  action: string
  entityType?: string | null
  entityId?: string | null
  metadata?: Record<string, unknown>
}

/**
 * Grava em lxp_audit_logs usando o JWT do admin (RPC exige is_admin + auth.uid).
 * Falha silenciosa para não quebrar a operação principal.
 */
export async function writeAuditLogAsUser(
  supabaseUrl: string,
  anonKey: string,
  userJwt: string,
  input: EdgeAuditLogInput,
): Promise<void> {
  try {
    const client = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${userJwt}` } },
    })
    const { error } = await client.rpc("lxp_write_audit_log", {
      p_action: input.action,
      p_entity_type: input.entityType ?? null,
      p_entity_id: input.entityId ?? null,
      p_metadata: input.metadata ?? {},
    })
    if (error) console.warn("[edge-audit]", input.action, error.message)
  } catch (err) {
    console.warn("[edge-audit]", input.action, err)
  }
}

export async function getActorProfileId(
  supabaseAdmin: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("lxp_profiles")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle()
  return (data?.id as string | undefined) ?? null
}
