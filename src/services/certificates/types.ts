export type CertificateTemplateRow = {
  id: string
  name: string
  description: string | null
  is_active: boolean
  is_default: boolean
  institution_name: string
  institution_logo_path: string | null
  layout_kind: "default" | "custom"
  background_image_path: string | null
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

export type SignatureEmbed = {
  signer_name: string
  signer_title: string
  image_path: string | null
}
