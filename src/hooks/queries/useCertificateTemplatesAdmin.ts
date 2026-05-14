import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/consts/queryKeys"
import { listCertificateTemplatesAdmin } from "@/services/certificatesAdminService"

export function useCertificateTemplatesAdmin() {
  return useQuery({
    queryKey: queryKeys.certificates.templates,
    queryFn: listCertificateTemplatesAdmin,
    retry: 1,
  })
}
