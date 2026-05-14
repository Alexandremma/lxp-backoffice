import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/consts/queryKeys"
import { listCertificateIssuesAdmin } from "@/services/certificatesAdminService"

export function useCertificateIssuesAdmin() {
  return useQuery({
    queryKey: queryKeys.certificates.issues,
    queryFn: listCertificateIssuesAdmin,
    retry: 1,
  })
}
