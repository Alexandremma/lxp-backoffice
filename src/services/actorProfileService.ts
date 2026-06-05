import { supabase } from "@/lib/supabaseClient"

/** Resolve `lxp_profiles.id` do usuário Auth (FK de `updated_by` / auditoria). */
export async function resolveActorProfileId(
  userId: string | null | undefined,
): Promise<string | null> {
  if (!userId) return null

  const { data, error } = await supabase
    .from("lxp_profiles")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle()

  if (error) throw error
  return (data?.id as string | undefined) ?? null
}
