import { supabase } from "@/lib/supabaseClient"
import type { UpdateOwnTeamMemberProfileInput } from "@/types/team"

export type { UpdateOwnTeamMemberProfileInput } from "@/types/team"

export async function updateOwnTeamMemberProfile(
  userId: string,
  input: UpdateOwnTeamMemberProfileInput,
): Promise<void> {
  const now = new Date().toISOString();
  const name = input.name.trim();
  const department = input.department?.trim() || null;

  const { error: teamError } = await supabase
    .from("backoffice_team_members")
    .update({
      name,
      department,
      updated_at: now,
      updated_by: userId,
    })
    .eq("user_id", userId);

  if (teamError) throw teamError;

  const { error: profileError } = await supabase
    .from("lxp_profiles")
    .update({ name, updated_at: now })
    .eq("user_id", userId);

  if (profileError) throw profileError;
}
