import { fireAuditLog } from "@/lib/auditLogHelpers"
import { supabase } from "@/lib/supabaseClient"
import { singleSignatureEmbed } from "@/services/certificates/signatureStorage"
import type { SignatureEmbed, TemplateSignatureSlot } from "@/types/certificates"

export async function listTemplateSignatureSlots(
  templateId: string,
): Promise<TemplateSignatureSlot[]> {
  const { data, error } = await supabase
    .from("lxp_certificate_template_signatures")
    .select(
      "template_id,signature_id,slot,sort_order,lxp_certificate_signatures(signer_name,signer_title,image_path)",
    )
    .eq("template_id", templateId)
    .order("slot", { ascending: true })
  if (error) throw error

  return (data ?? []).map((row) => {
    const sig = singleSignatureEmbed(
      row.lxp_certificate_signatures as SignatureEmbed | SignatureEmbed[] | null,
    )
    return {
      template_id: row.template_id as string,
      signature_id: row.signature_id as string,
      slot: row.slot as number,
      sort_order: row.sort_order as number,
      signer_name: sig?.signer_name ?? "",
      signer_title: sig?.signer_title ?? "",
      image_path: sig?.image_path ?? null,
    }
  })
}

/** Substitui (ou cria) a assinatura no slot informado. */
export async function setTemplateSignatureSlot(input: {
  template_id: string
  slot: number
  signature_id: string
}): Promise<void> {
  const clear = await supabase
    .from("lxp_certificate_template_signatures")
    .delete()
    .eq("template_id", input.template_id)
    .eq("slot", input.slot)
  if (clear.error) throw clear.error

  const dedup = await supabase
    .from("lxp_certificate_template_signatures")
    .delete()
    .eq("template_id", input.template_id)
    .eq("signature_id", input.signature_id)
  if (dedup.error) throw dedup.error

  const { error } = await supabase.from("lxp_certificate_template_signatures").insert({
    template_id: input.template_id,
    signature_id: input.signature_id,
    slot: input.slot,
    sort_order: input.slot,
  })
  if (error) throw error

  fireAuditLog({
    action: "certificate.template_signature.set",
    entityType: "lxp_certificate_template",
    entityId: input.template_id,
    metadata: { slot: input.slot, signature_id: input.signature_id },
  })
}

export async function removeTemplateSignatureSlot(input: {
  template_id: string
  slot: number
}): Promise<void> {
  const { error } = await supabase
    .from("lxp_certificate_template_signatures")
    .delete()
    .eq("template_id", input.template_id)
    .eq("slot", input.slot)
  if (error) throw error

  fireAuditLog({
    action: "certificate.template_signature.remove",
    entityType: "lxp_certificate_template",
    entityId: input.template_id,
    metadata: { slot: input.slot },
  })
}
