import { fireAuditLog } from "@/lib/auditLogHelpers"
import type { CertificatePrintPayload } from "@/lib/certificatePrint"
import { supabase } from "@/lib/supabaseClient"

const SIGNATURES_BUCKET = "certificate-signatures"

export type CertificateTemplateRow = {
  id: string
  name: string
  description: string | null
  is_active: boolean
  is_default: boolean
  institution_name: string
  institution_logo_path: string | null
  created_at: string
  updated_at: string
}

export type CertificateSignatureRow = {
  id: string
  signer_name: string
  signer_title: string
  image_path: string | null
  sort_order: number
  created_at: string
  /** legacy / fase 2 — pode ser null agora */
  template_id?: string | null
}

export type TemplateSignatureSlot = {
  template_id: string
  signature_id: string
  slot: number
  sort_order: number
  signer_name: string
  signer_title: string
  image_path: string | null
}

export type CertificateIssueAdminRow = {
  id: string
  validation_code: string
  issued_at: string
  student_name: string
  discipline_label: string
  template_id: string | null
  template_name: string | null
  snapshot: Record<string, unknown> | null
}

/* ---------------------------- helpers de Storage --------------------------- */

type SignatureEmbed = {
  signer_name: string
  signer_title: string
  image_path: string | null
}

/** Supabase pode tipar relação N:1 como objeto ou array; normaliza para um único registro. */
function singleSignatureEmbed(
  rel: SignatureEmbed | SignatureEmbed[] | null | undefined,
): SignatureEmbed | null {
  if (!rel) return null
  return Array.isArray(rel) ? (rel[0] ?? null) : rel
}

function signatureStoragePublicUrl(imagePath: string | null | undefined): string | null {
  if (!imagePath?.trim()) return null
  const { data } = supabase.storage.from(SIGNATURES_BUCKET).getPublicUrl(imagePath.trim())
  return data.publicUrl || null
}

export function getSignatureImagePublicUrl(imagePath: string | null | undefined): string | null {
  return signatureStoragePublicUrl(imagePath)
}

const CERTIFICATE_PREVIEW_SAMPLE = {
  studentName: "Nome do Aluno",
  disciplineName: "Disciplina de Exemplo",
  workloadHours: 60,
  validationCode: "B42-PREVIEW00000001",
} as const

/** Payload de exemplo para preview/PDF de template (iframe e impressão). */
export function buildCertificateTemplatePreviewPayload(input: {
  template: Pick<CertificateTemplateRow, "institution_name" | "institution_logo_path">
  slots: TemplateSignatureSlot[]
  institutionNameOverride?: string
  institutionLogoUrlOverride?: string | null
}): CertificatePrintPayload {
  const signatures = [...input.slots]
    .sort((a, b) => a.slot - b.slot)
    .map((s) => ({
      signerName: s.signer_name,
      signerTitle: s.signer_title,
      imageUrl: getSignatureImagePublicUrl(s.image_path),
    }))

  return {
    studentName: CERTIFICATE_PREVIEW_SAMPLE.studentName,
    disciplineName: CERTIFICATE_PREVIEW_SAMPLE.disciplineName,
    issuedAt: new Date().toISOString(),
    validationCode: CERTIFICATE_PREVIEW_SAMPLE.validationCode,
    workloadHours: CERTIFICATE_PREVIEW_SAMPLE.workloadHours,
    institutionName:
      input.institutionNameOverride?.trim() ||
      input.template.institution_name?.trim() ||
      "B42 Edtech",
    institutionLogoUrl:
      input.institutionLogoUrlOverride ??
      getSignatureImagePublicUrl(input.template.institution_logo_path),
    signatures,
    validateBaseUrl: typeof window !== "undefined" ? window.location.origin : "",
    autoPrint: false,
  }
}

/** Preenche logo/instituição no snapshot de emissão quando ausentes (emissões anteriores ao upload do logo). */
export async function enrichSnapshotRecord(
  snapshot: Record<string, unknown>,
  templateId: string | null,
): Promise<Record<string, unknown>> {
  const enriched = { ...snapshot }
  if (!templateId) return enriched

  const { data: template, error } = await supabase
    .from("lxp_certificate_templates")
    .select("institution_name,institution_logo_path")
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

/* ------------------------------- templates -------------------------------- */

const TEMPLATE_COLS =
  "id,name,description,is_active,is_default,institution_name,institution_logo_path,created_at,updated_at"

export async function listCertificateTemplatesAdmin(): Promise<CertificateTemplateRow[]> {
  const { data, error } = await supabase
    .from("lxp_certificate_templates")
    .select(TEMPLATE_COLS)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false })
  if (error) throw error
  return (data ?? []) as CertificateTemplateRow[]
}

export async function createCertificateTemplateAdmin(input: {
  name: string
  description?: string | null
  institution_name?: string | null
}): Promise<CertificateTemplateRow> {
  const { data, error } = await supabase
    .from("lxp_certificate_templates")
    .insert({
      name: input.name.trim(),
      description: input.description?.trim() || null,
      institution_name: input.institution_name?.trim() || "B42 Edtech",
      is_active: true,
    })
    .select(TEMPLATE_COLS)
    .single()
  if (error) throw error
  const template = data as CertificateTemplateRow
  fireAuditLog({
    action: "certificate.template.create",
    entityType: "lxp_certificate_template",
    entityId: template.id,
    metadata: { name: template.name },
  })
  return template
}

export async function updateCertificateTemplateAdmin(
  id: string,
  patch: Partial<
    Pick<
      CertificateTemplateRow,
      "name" | "description" | "is_active" | "is_default" | "institution_name" | "institution_logo_path"
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

/* ------------------------- assinaturas (biblioteca) ------------------------ */

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

/* ------------------- vínculo template <-> assinatura (N:M) ----------------- */

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
  // libera o slot atual desse template (se ocupado)
  const clear = await supabase
    .from("lxp_certificate_template_signatures")
    .delete()
    .eq("template_id", input.template_id)
    .eq("slot", input.slot)
  if (clear.error) throw clear.error

  // remove esse signature_id de outro slot do mesmo template (se houver)
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

/* ------------------------------- emissões --------------------------------- */

export async function listCertificateIssuesAdmin(): Promise<CertificateIssueAdminRow[]> {
  const { data: issues, error } = await supabase
    .from("lxp_certificate_issues")
    .select(
      "id,validation_code,issued_at,student_profile_id,course_discipline_id,template_id,snapshot",
    )
    .order("issued_at", { ascending: false })
    .limit(500)
  if (error) throw error
  const list = issues ?? []
  if (list.length === 0) return []

  const studentIds = [...new Set(list.map((i) => i.student_profile_id as string))]
  const discIds = [...new Set(list.map((i) => i.course_discipline_id as string))]
  const templateIds = [
    ...new Set(
      list.map((i) => i.template_id as string | null).filter((x): x is string => Boolean(x)),
    ),
  ]

  const [profilesRes, discsRes] = await Promise.all([
    supabase.from("lxp_profiles").select("id,name").in("id", studentIds),
    supabase.from("lxp_course_disciplines").select("id,name,code").in("id", discIds),
  ])

  if (profilesRes.error) throw profilesRes.error
  if (discsRes.error) throw discsRes.error

  let templatesData: { id: string; name: string }[] = []
  if (templateIds.length > 0) {
    const tr = await supabase.from("lxp_certificate_templates").select("id,name").in("id", templateIds)
    if (tr.error) throw tr.error
    templatesData = (tr.data ?? []) as { id: string; name: string }[]
  }

  const profileName = new Map(
    (profilesRes.data ?? []).map((p: { id: string; name: string | null }) => [
      p.id,
      p.name?.trim() || "Aluno",
    ]),
  )
  const discLabel = new Map(
    (discsRes.data ?? []).map((d: { id: string; name: string | null; code: string | null }) => {
      const label = [d.name?.trim(), d.code?.trim()].filter(Boolean).join(" · ") || "Disciplina"
      return [d.id, label]
    }),
  )
  const templateName = new Map(templatesData.map((t) => [t.id, t.name]))

  return list.map((row) => ({
    id: row.id as string,
    validation_code: row.validation_code as string,
    issued_at: row.issued_at as string,
    student_name: profileName.get(row.student_profile_id as string) ?? "—",
    discipline_label: discLabel.get(row.course_discipline_id as string) ?? "—",
    template_id: (row.template_id as string | null) ?? null,
    template_name: row.template_id
      ? (templateName.get(row.template_id as string) ?? null)
      : null,
    snapshot: (row.snapshot as Record<string, unknown> | null) ?? null,
  }))
}

/** Busca o snapshot completo (e a issue) para reaproveitar no PDF do admin. */
export async function getCertificateIssueWithSnapshot(issueId: string): Promise<{
  validation_code: string
  issued_at: string
  snapshot: Record<string, unknown> | null
  student_profile_id: string
  course_discipline_id: string
  template_id: string | null
} | null> {
  const { data, error } = await supabase
    .from("lxp_certificate_issues")
    .select("validation_code,issued_at,snapshot,student_profile_id,course_discipline_id,template_id")
    .eq("id", issueId)
    .maybeSingle()
  if (error) throw error
  return (data as {
    validation_code: string
    issued_at: string
    snapshot: Record<string, unknown> | null
    student_profile_id: string
    course_discipline_id: string
    template_id: string | null
  } | null) ?? null
}
