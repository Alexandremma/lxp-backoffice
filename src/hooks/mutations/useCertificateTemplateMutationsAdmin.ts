import { useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/consts/queryKeys"
import {
  createCertificateTemplateAdmin,
  updateCertificateTemplateAdmin,
} from "@/services/certificatesAdminService"

export function useCreateCertificateTemplateAdmin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { name: string; description?: string | null }) => createCertificateTemplateAdmin(input),
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
      patch: Partial<{ name: string; description: string | null; is_active: boolean }>
    }) => updateCertificateTemplateAdmin(args.id, args.patch),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.certificates.templates })
    },
  })
}
