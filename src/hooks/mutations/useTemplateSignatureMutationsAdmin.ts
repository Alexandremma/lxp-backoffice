import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/consts/queryKeys"
import {
  listTemplateSignatureSlots,
  removeTemplateSignatureSlot,
  setTemplateSignatureSlot,
  uploadInstitutionLogo,
  uploadTemplateBackground,
  removeTemplateBackground,
} from "@/services/certificatesAdminService"

export function useTemplateSignatureSlots(templateId: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.certificates.templateSignatures(templateId || ""),
    queryFn: () => listTemplateSignatureSlots(templateId!),
    enabled: Boolean(templateId),
    retry: 1,
  })
}

export function useSetTemplateSignatureSlot() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { template_id: string; slot: number; signature_id: string }) =>
      setTemplateSignatureSlot(input),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({
        queryKey: queryKeys.certificates.templateSignatures(vars.template_id),
      })
    },
  })
}

export function useRemoveTemplateSignatureSlot() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { template_id: string; slot: number }) =>
      removeTemplateSignatureSlot(input),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({
        queryKey: queryKeys.certificates.templateSignatures(vars.template_id),
      })
    },
  })
}

export function useUploadInstitutionLogo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { templateId: string; file: File }) =>
      uploadInstitutionLogo(input.templateId, input.file),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.certificates.templates })
    },
  })
}

export function useUploadTemplateBackground() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { templateId: string; file: File }) =>
      uploadTemplateBackground(input.templateId, input.file),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.certificates.templates })
    },
  })
}

export function useRemoveTemplateBackground() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (templateId: string) => removeTemplateBackground(templateId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.certificates.templates })
    },
  })
}
