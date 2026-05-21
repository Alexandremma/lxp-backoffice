import { supabase } from "@/lib/supabaseClient"

export type CertificateTemplateRow = {
  id: string
  name: string
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type CertificateSignatureRow = {
  id: string
  template_id: string
  signer_name: string
  signer_title: string
  image_path: string | null
  sort_order: number
  created_at: string
  template_name?: string
}

export type CertificateIssueAdminRow = {
  id: string
  validation_code: string
  issued_at: string
  student_name: string
  discipline_label: string
  template_name: string | null
}

export async function listCertificateTemplatesAdmin(): Promise<CertificateTemplateRow[]> {
  const { data, error } = await supabase
    .from("lxp_certificate_templates")
    .select("id,name,description,is_active,created_at,updated_at")
    .order("created_at", { ascending: false })
  if (error) throw error
  return (data ?? []) as CertificateTemplateRow[]
}

export async function createCertificateTemplateAdmin(input: {
  name: string
  description?: string | null
}): Promise<CertificateTemplateRow> {
  const { data, error } = await supabase
    .from("lxp_certificate_templates")
    .insert({
      name: input.name.trim(),
      description: input.description?.trim() || null,
      is_active: true,
    })
    .select("id,name,description,is_active,created_at,updated_at")
    .single()
  if (error) throw error
  return data as CertificateTemplateRow
}

export async function updateCertificateTemplateAdmin(
  id: string,
  patch: Partial<Pick<CertificateTemplateRow, "name" | "description" | "is_active">>,
): Promise<void> {
  const { error } = await supabase
    .from("lxp_certificate_templates")
    .update({
      ...patch,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
  if (error) throw error
}

export async function listCertificateSignaturesAdmin(): Promise<CertificateSignatureRow[]> {
  const { data, error } = await supabase
    .from("lxp_certificate_signatures")
    .select("id,template_id,signer_name,signer_title,image_path,sort_order,created_at")
    .order("template_id", { ascending: true })
    .order("sort_order", { ascending: true })
  if (error) throw error
  const rows = (data ?? []) as Omit<CertificateSignatureRow, "template_name">[]
  if (rows.length === 0) return []

  const templateIds = [...new Set(rows.map((r) => r.template_id))]
  const { data: templates, error: tErr } = await supabase
    .from("lxp_certificate_templates")
    .select("id,name")
    .in("id", templateIds)
  if (tErr) throw tErr
  const nameById = new Map((templates ?? []).map((t: { id: string; name: string }) => [t.id, t.name]))

  return rows.map((r) => ({
    ...r,
    template_name: nameById.get(r.template_id) ?? "—",
  }))
}

export async function createCertificateSignatureAdmin(input: {
  template_id: string
  signer_name: string
  signer_title: string
  sort_order?: number
}): Promise<void> {
  const { error } = await supabase.from("lxp_certificate_signatures").insert({
    template_id: input.template_id,
    signer_name: input.signer_name.trim(),
    signer_title: input.signer_title.trim(),
    sort_order: input.sort_order ?? 0,
  })
  if (error) throw error
}

export async function listCertificateIssuesAdmin(): Promise<CertificateIssueAdminRow[]> {
  const { data: issues, error } = await supabase
    .from("lxp_certificate_issues")
    .select("id,validation_code,issued_at,student_profile_id,course_discipline_id,template_id")
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
    template_name: row.template_id
      ? (templateName.get(row.template_id as string) ?? null)
      : null,
  }))
}
