import { supabase } from "@/lib/supabaseClient"
import type { CertificateIssueAdminRow } from "@/services/certificates/types"

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
