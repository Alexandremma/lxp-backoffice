import { supabase } from "@/lib/supabaseClient"

export async function updateStudentProfileAdmin(params: {
    profileId: string
    name: string
    email: string
}): Promise<void> {
    const { error } = await supabase.rpc("admin_update_lxp_student_profile", {
        p_profile_id: params.profileId,
        p_name: params.name,
        p_email: params.email,
    })
    if (error) throw error
}
