import { supabase } from "@/lib/supabaseClient"
import type { SettingsDashboard } from "@/types/settings"

export async function getSettingsDashboard(): Promise<SettingsDashboard> {
    const { data, error } = await supabase.rpc("lxp_get_settings_dashboard")
    if (error) throw error
    return data as SettingsDashboard
}
