import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/consts/queryKeys"
import { listCertificateSignaturesAdmin } from "@/services/certificatesAdminService"

export function useCertificateSignaturesAdmin() {
  return useQuery({
    queryKey: queryKeys.certificates.signatures,
    queryFn: listCertificateSignaturesAdmin,
    retry: 1,
  })
}
