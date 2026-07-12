import { fireAuditLog } from "@/lib/auditLogHelpers"
import { supabase } from "@/lib/supabaseClient"
import { SIGNATURES_BUCKET } from "@/services/certificates/constants"
import type { CertificateSignatureRow } from "@/types/certificates"

export async function listCertificateSignaturesAdmin(): Promise<CertificateSignatureRow[]> {
  const { data, error } = await supabase
    .from("lxp_certificate_signatures")
    .select("id,signer_name,signer_title,image_path,sort_order,created_at,template_id")
    .order("signer_name", { ascending: true })
  if (error) throw error
  return (data ?? []) as CertificateSignatureRow[]
}

export async function createCertificateSignatureAdmin(input: {
  signer_name: string
  signer_title: string
  sort_order?: number
  image_file?: File | null
}): Promise<CertificateSignatureRow> {
  const { data: row, error: insErr } = await supabase
    .from("lxp_certificate_signatures")
    .insert({
      signer_name: input.signer_name.trim(),
      signer_title: input.signer_title.trim(),
      sort_order: input.sort_order ?? 0,
    })
    .select("id,signer_name,signer_title,image_path,sort_order,created_at,template_id")
    .single()
  if (insErr) throw insErr
  if (!row) throw new Error("Falha ao criar assinatura.")

  if (input.image_file) {
    const ext = input.image_file.name.split(".").pop()?.toLowerCase() || "png"
    const path = `library/${row.id}.${ext}`
    const up = await supabase.storage
      .from(SIGNATURES_BUCKET)
      .upload(path, input.image_file, { upsert: true, contentType: input.image_file.type })
    if (up.error) throw up.error
    const patch = await supabase
      .from("lxp_certificate_signatures")
      .update({ image_path: path })
      .eq("id", row.id)
      .select("id,signer_name,signer_title,image_path,sort_order,created_at,template_id")
      .single()
    if (patch.error) throw patch.error
    const withImage = patch.data as CertificateSignatureRow
    fireAuditLog({
      action: "certificate.signature.create",
      entityType: "lxp_certificate_signature",
      entityId: withImage.id,
      metadata: { signer_name: withImage.signer_name },
    })
    return withImage
  }

  const signature = row as CertificateSignatureRow
  fireAuditLog({
    action: "certificate.signature.create",
    entityType: "lxp_certificate_signature",
    entityId: signature.id,
    metadata: { signer_name: signature.signer_name },
  })
  return signature
}

export async function updateCertificateSignatureAdmin(
  id: string,
  patch: Partial<Pick<CertificateSignatureRow, "signer_name" | "signer_title" | "sort_order">> & {
    image_file?: File | null
  },
): Promise<void> {
  if (patch.signer_name || patch.signer_title || patch.sort_order != null) {
    const dbPatch: Record<string, unknown> = {}
    if (patch.signer_name !== undefined) dbPatch.signer_name = patch.signer_name.trim()
    if (patch.signer_title !== undefined) dbPatch.signer_title = patch.signer_title.trim()
    if (patch.sort_order !== undefined) dbPatch.sort_order = patch.sort_order
    const { error } = await supabase
      .from("lxp_certificate_signatures")
      .update(dbPatch)
      .eq("id", id)
    if (error) throw error
  }

  if (patch.image_file) {
    const ext = patch.image_file.name.split(".").pop()?.toLowerCase() || "png"
    const path = `library/${id}.${ext}`
    const up = await supabase.storage
      .from(SIGNATURES_BUCKET)
      .upload(path, patch.image_file, { upsert: true, contentType: patch.image_file.type })
    if (up.error) throw up.error
    const patchErr = await supabase
      .from("lxp_certificate_signatures")
      .update({ image_path: path })
      .eq("id", id)
    if (patchErr.error) throw patchErr.error
  }

  fireAuditLog({
    action: "certificate.signature.update",
    entityType: "lxp_certificate_signature",
    entityId: id,
  })
}

export async function deleteCertificateSignatureAdmin(id: string): Promise<void> {
  const { error } = await supabase.from("lxp_certificate_signatures").delete().eq("id", id)
  if (error) throw error

  fireAuditLog({
    action: "certificate.signature.delete",
    entityType: "lxp_certificate_signature",
    entityId: id,
  })
}
