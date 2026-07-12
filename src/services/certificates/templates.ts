import { fireAuditLog } from "@/lib/auditLogHelpers"
import { supabase } from "@/lib/supabaseClient"
import { SIGNATURES_BUCKET } from "@/services/certificates/constants"
import type { CertificateTemplateRow } from "@/types/certificates"

const TEMPLATE_COLS =
  "id,name,description,is_active,is_default,institution_name,institution_logo_path,layout_kind,background_image_path,created_at,updated_at"

export async function listCertificateTemplatesAdmin(): Promise<CertificateTemplateRow[]> {
  const { data, error } = await supabase
    .from("lxp_certificate_templates")
    .select(TEMPLATE_COLS)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false })
  if (error) throw error
  return (data ?? []).map((row) => {
    const tpl = row as CertificateTemplateRow
    return {
      ...tpl,
      layout_kind: tpl.layout_kind === "custom" ? "custom" : "default",
    }
  })
}

export async function createCertificateTemplateAdmin(input: {
  name: string
  description?: string | null
  institution_name?: string | null
  layout_kind?: "default" | "custom"
}): Promise<CertificateTemplateRow> {
  const { data, error } = await supabase
    .from("lxp_certificate_templates")
    .insert({
      name: input.name.trim(),
      description: input.description?.trim() || null,
      institution_name: input.institution_name?.trim() || "B42 Edtech",
      layout_kind: input.layout_kind === "custom" ? "custom" : "default",
      is_active: true,
    })
    .select(TEMPLATE_COLS)
    .single()
  if (error) throw error
  const template = data as CertificateTemplateRow
  const normalized: CertificateTemplateRow = {
    ...template,
    layout_kind: template.layout_kind === "custom" ? "custom" : "default",
  }
  fireAuditLog({
    action: "certificate.template.create",
    entityType: "lxp_certificate_template",
    entityId: normalized.id,
    metadata: { name: normalized.name },
  })
  return normalized
}

export async function updateCertificateTemplateAdmin(
  id: string,
  patch: Partial<
      Pick<
        CertificateTemplateRow,
        | "name"
        | "description"
        | "is_active"
        | "is_default"
        | "institution_name"
        | "institution_logo_path"
        | "layout_kind"
        | "background_image_path"
      >
  >,
): Promise<void> {
  const { error } = await supabase
    .from("lxp_certificate_templates")
    .update({
      ...patch,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
  if (error) throw error

  fireAuditLog({
    action: "certificate.template.update",
    entityType: "lxp_certificate_template",
    entityId: id,
    metadata: { name: patch.name },
  })
}

export async function setDefaultCertificateTemplateAdmin(templateId: string): Promise<void> {
  const clear = await supabase
    .from("lxp_certificate_templates")
    .update({ is_default: false, updated_at: new Date().toISOString() })
    .eq("is_default", true)
  if (clear.error) throw clear.error

  const { error } = await supabase
    .from("lxp_certificate_templates")
    .update({ is_default: true, is_active: true, updated_at: new Date().toISOString() })
    .eq("id", templateId)
  if (error) throw error

  fireAuditLog({
    action: "certificate.template.set_default",
    entityType: "lxp_certificate_template",
    entityId: templateId,
  })
}

export async function uploadInstitutionLogo(
  templateId: string,
  file: File,
): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "png"
  const path = `templates/${templateId}/logo.${ext}`
  const up = await supabase.storage
    .from(SIGNATURES_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type })
  if (up.error) throw up.error
  const patch = await supabase
    .from("lxp_certificate_templates")
    .update({ institution_logo_path: path, updated_at: new Date().toISOString() })
    .eq("id", templateId)
  if (patch.error) throw patch.error
  return path
}

export async function uploadTemplateBackground(
  templateId: string,
  file: File,
): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "png"
  const path = `templates/${templateId}/background.${ext}`
  const up = await supabase.storage
    .from(SIGNATURES_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type })
  if (up.error) throw up.error
  const patch = await supabase
    .from("lxp_certificate_templates")
    .update({ background_image_path: path, updated_at: new Date().toISOString() })
    .eq("id", templateId)
  if (patch.error) throw patch.error
  return path
}

export async function removeTemplateBackground(templateId: string): Promise<void> {
  const { data: row, error: fetchErr } = await supabase
    .from("lxp_certificate_templates")
    .select("background_image_path")
    .eq("id", templateId)
    .maybeSingle()
  if (fetchErr) throw fetchErr

  const path = row?.background_image_path?.trim()
  if (path) {
    const { error: storageErr } = await supabase.storage.from(SIGNATURES_BUCKET).remove([path])
    if (storageErr) throw storageErr
  }

  const { error: patchErr } = await supabase
    .from("lxp_certificate_templates")
    .update({ background_image_path: null, updated_at: new Date().toISOString() })
    .eq("id", templateId)
  if (patchErr) throw patchErr
}
