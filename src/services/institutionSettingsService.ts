import { resolveActorProfileId } from "@/services/actorProfileService"
import { supabase } from "@/lib/supabaseClient"
import { STORAGE_BUCKETS } from "@/consts/storageBuckets"
import type { InstitutionSettingKey } from "@/types/settings"

export const INSTITUTION_BRANDING_BUCKET = STORAGE_BUCKETS.institutionBranding

export async function getInstitutionSetting<T extends Record<string, unknown>>(
    key: InstitutionSettingKey,
): Promise<T | null> {
    const { data, error } = await supabase
        .from("lxp_institution_settings")
        .select("value")
        .eq("key", key)
        .maybeSingle()

    if (error) throw error
    if (!data?.value) return null
    return data.value as T
}

export async function upsertInstitutionSetting(
    key: InstitutionSettingKey,
    value: Record<string, unknown>,
    updatedByUserId?: string | null,
): Promise<void> {
    const updatedBy = await resolveActorProfileId(updatedByUserId)
    const { error } = await supabase.from("lxp_institution_settings").upsert(
        {
            key,
            value,
            updated_at: new Date().toISOString(),
            updated_by: updatedBy,
        },
        { onConflict: "key" },
    )
    if (error) throw error
}

export function getInstitutionBrandingPublicUrl(logoPath: string | null | undefined): string | null {
    if (!logoPath?.trim()) return null
    const { data } = supabase.storage.from(INSTITUTION_BRANDING_BUCKET).getPublicUrl(logoPath.trim())
    return data.publicUrl
}

export async function uploadInstitutionBrandingLogo(file: File): Promise<string> {
    const ext = file.name.split(".").pop()?.toLowerCase() || "png"
    const allowed = ["png", "jpg", "jpeg", "webp"]
    if (!allowed.includes(ext)) {
        throw new Error("Formato inválido. Use PNG, JPG ou WebP.")
    }
    if (file.size > 2 * 1024 * 1024) {
        throw new Error("Arquivo muito grande. Máximo 2MB.")
    }

    const path = `logo/institution.${ext}`
    const { error } = await supabase.storage
        .from(INSTITUTION_BRANDING_BUCKET)
        .upload(path, file, { upsert: true, contentType: file.type })

    if (error) throw error
    return path
}
