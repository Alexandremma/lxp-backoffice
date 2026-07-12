import { supabase } from "@/lib/supabaseClient"
import {
  signatureStoragePublicUrl,
  singleSignatureEmbed,
} from "@/services/certificates/signatureStorage"
import type { SignatureEmbed } from "@/services/certificates/types"

/** Preenche logo/instituição no snapshot de emissão quando ausentes (emissões anteriores ao upload do logo). */
export async function enrichSnapshotRecord(
  snapshot: Record<string, unknown>,
  templateId: string | null,
): Promise<Record<string, unknown>> {
  const enriched = { ...snapshot }
  if (!templateId) return enriched

  const { data: template, error } = await supabase
    .from("lxp_certificate_templates")
    .select("institution_name,institution_logo_path,layout_kind,background_image_path")
    .eq("id", templateId)
    .maybeSingle()

  if (error) throw error

  const instName = typeof enriched.institution_name === "string" ? enriched.institution_name : ""
  const logoUrl =
    typeof enriched.institution_logo_url === "string" ? enriched.institution_logo_url : ""

  if (!instName.trim() && template?.institution_name?.trim()) {
    enriched.institution_name = template.institution_name.trim()
  }
  if (!logoUrl.trim() && template?.institution_logo_path?.trim()) {
    enriched.institution_logo_url = signatureStoragePublicUrl(template.institution_logo_path)
  }

  if (!enriched.layout_kind && template?.layout_kind) {
    enriched.layout_kind = template.layout_kind
  }

  const bgUrl =
    typeof enriched.background_image_url === "string" ? enriched.background_image_url : ""
  if (!bgUrl.trim() && template?.background_image_path?.trim()) {
    enriched.background_image_url = signatureStoragePublicUrl(template.background_image_path)
  }

  const rawSigs = enriched.signatures
  if (Array.isArray(rawSigs)) {
    const needsImages = rawSigs.some((entry) => {
      const rec = entry as Record<string, unknown>
      const url = (rec.image_url ?? rec.imageUrl) as string | undefined
      return !url?.trim()
    })
    if (needsImages) {
      const { data: slots, error: slotErr } = await supabase
        .from("lxp_certificate_template_signatures")
        .select(
          "slot,lxp_certificate_signatures(signer_name,signer_title,image_path)",
        )
        .eq("template_id", templateId)
        .order("slot", { ascending: true })

      if (slotErr) throw slotErr

      const bySlot = new Map(
        (slots ?? []).map((row) => {
          const sig = singleSignatureEmbed(
            row.lxp_certificate_signatures as SignatureEmbed | SignatureEmbed[] | null,
          )
          return sig ? ([row.slot as number, sig] as const) : null
        }).filter((entry): entry is [number, SignatureEmbed] => entry != null),
      )

      enriched.signatures = rawSigs.map((entry) => {
        const rec = { ...(entry as Record<string, unknown>) }
        const existing =
          (rec.image_url as string | undefined) ?? (rec.imageUrl as string | undefined)
        if (existing?.trim()) return rec
        const slot = typeof rec.slot === "number" ? rec.slot : Number(rec.slot)
        const slotRow = Number.isFinite(slot) ? bySlot.get(slot) : undefined
        if (!slotRow?.image_path?.trim()) return rec
        rec.image_url = signatureStoragePublicUrl(slotRow.image_path)
        return rec
      })
    }
  }

  return enriched
}
