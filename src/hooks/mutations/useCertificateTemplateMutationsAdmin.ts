import { useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/consts/queryKeys"
import {
  createCertificateTemplateAdmin,
  setDefaultCertificateTemplateAdmin,
  updateCertificateTemplateAdmin,
} from "@/services/certificatesAdminService"

export function useCreateCertificateTemplateAdmin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: {
      name: string
      description?: string | null
      institution_name?: string | null
      layout_kind?: "default" | "custom"
    }) => createCertificateTemplateAdmin(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.certificates.templates })
    },
  })
}

export function useUpdateCertificateTemplateAdmin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (args: {
      id: string
      patch: Partial<{
        name: string
        description: string | null
        is_active: boolean
        is_default: boolean
        institution_name: string
        institution_logo_path: string | null
        layout_kind: "default" | "custom"
        background_image_path: string | null
      }>
    }) => updateCertificateTemplateAdmin(args.id, args.patch),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.certificates.templates })
    },
  })
}

export function useSetDefaultCertificateTemplateAdmin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (templateId: string) => setDefaultCertificateTemplateAdmin(templateId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.certificates.templates })
    },
  })
}
