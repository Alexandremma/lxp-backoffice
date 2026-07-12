import { supabase } from "@/lib/supabaseClient"
import { SIGNATURES_BUCKET } from "@/services/certificates/constants"
import type { SignatureEmbed } from "@/services/certificates/types"

/** Supabase pode tipar relação N:1 como objeto ou array; normaliza para um único registro. */
export function singleSignatureEmbed(
  rel: SignatureEmbed | SignatureEmbed[] | null | undefined,
): SignatureEmbed | null {
  if (!rel) return null
  return Array.isArray(rel) ? (rel[0] ?? null) : rel
}

export function signatureStoragePublicUrl(imagePath: string | null | undefined): string | null {
  if (!imagePath?.trim()) return null
  const { data } = supabase.storage.from(SIGNATURES_BUCKET).getPublicUrl(imagePath.trim())
  return data.publicUrl || null
}

export function getSignatureImagePublicUrl(imagePath: string | null | undefined): string | null {
  return signatureStoragePublicUrl(imagePath)
}
