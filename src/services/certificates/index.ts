export type {
  CertificateTemplateRow,
  CertificateSignatureRow,
  TemplateSignatureSlot,
  CertificateIssueAdminRow,
} from "@/types/certificates"

export { getSignatureImagePublicUrl } from "@/services/certificates/signatureStorage"
export { buildCertificateTemplatePreviewPayload } from "@/services/certificates/preview"
export { enrichSnapshotRecord } from "@/services/certificates/enrichSnapshot"

export {
  listCertificateTemplatesAdmin,
  createCertificateTemplateAdmin,
  updateCertificateTemplateAdmin,
  setDefaultCertificateTemplateAdmin,
  uploadInstitutionLogo,
  uploadTemplateBackground,
  removeTemplateBackground,
} from "@/services/certificates/templates"

export {
  listCertificateSignaturesAdmin,
  createCertificateSignatureAdmin,
  updateCertificateSignatureAdmin,
  deleteCertificateSignatureAdmin,
} from "@/services/certificates/signatures"

export {
  listTemplateSignatureSlots,
  setTemplateSignatureSlot,
  removeTemplateSignatureSlot,
} from "@/services/certificates/templateSlots"

export {
  listCertificateIssuesAdmin,
  getCertificateIssueWithSnapshot,
} from "@/services/certificates/issues"
