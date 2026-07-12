import { buildCertificateValidationUrl } from "@/lib/certificatePublicUrls"
import type { CertificatePrintPayload } from "@/lib/certificatePrint"
import { getSignatureImagePublicUrl } from "@/services/certificates/signatureStorage"
import type {
  CertificateTemplateRow,
  TemplateSignatureSlot,
} from "@/types/certificates"

const CERTIFICATE_PREVIEW_SAMPLE = {
  studentName: "Nome do Aluno",
  disciplineName: "Disciplina de Exemplo",
  workloadHours: 60,
  validationCode: "B42-PREVIEW00000001",
} as const

/** Payload de exemplo para preview/PDF de template (iframe e impressão). */
export function buildCertificateTemplatePreviewPayload(input: {
  template: Pick<
    CertificateTemplateRow,
    "institution_name" | "institution_logo_path" | "layout_kind" | "background_image_path"
  >
  slots: TemplateSignatureSlot[]
  institutionNameOverride?: string
  institutionLogoUrlOverride?: string | null
  backgroundImageUrlOverride?: string | null
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
    layoutKind: input.template.layout_kind === "custom" ? "custom" : "default",
    backgroundImageUrl:
      input.backgroundImageUrlOverride ??
      getSignatureImagePublicUrl(input.template.background_image_path),
    signatures,
    validationUrl: buildCertificateValidationUrl(CERTIFICATE_PREVIEW_SAMPLE.validationCode),
    autoPrint: false,
  }
}
