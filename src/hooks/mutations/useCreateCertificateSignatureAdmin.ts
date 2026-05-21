import { useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/consts/queryKeys"
import { createCertificateSignatureAdmin } from "@/services/certificatesAdminService"

export function useCreateCertificateSignatureAdmin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: {
      template_id: string
      signer_name: string
      signer_title: string
      sort_order?: number
    }) => createCertificateSignatureAdmin(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.certificates.signatures })
    },
  })
}
