import { useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/consts/queryKeys"
import {
  createCertificateSignatureAdmin,
  deleteCertificateSignatureAdmin,
  updateCertificateSignatureAdmin,
} from "@/services/certificatesAdminService"
import type { CertificateSignatureRow } from "@/types/certificates"

export function useCreateCertificateSignatureAdmin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: {
      signer_name: string
      signer_title: string
      sort_order?: number
      image_file?: File | null
    }): Promise<CertificateSignatureRow> => createCertificateSignatureAdmin(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.certificates.signatures })
    },
  })
}

export function useUpdateCertificateSignatureAdmin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (args: {
      id: string
      patch: Partial<Pick<CertificateSignatureRow, "signer_name" | "signer_title" | "sort_order">> & {
        image_file?: File | null
      }
    }) => updateCertificateSignatureAdmin(args.id, args.patch),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.certificates.signatures })
    },
  })
}

export function useDeleteCertificateSignatureAdmin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteCertificateSignatureAdmin(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.certificates.signatures })
    },
  })
}
