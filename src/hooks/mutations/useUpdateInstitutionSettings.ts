import { useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/consts/queryKeys"
import { useAuth } from "@/hooks/use-auth"
import { writeAuditLog } from "@/services/auditLogService"
import { upsertInstitutionSetting } from "@/services/institutionSettingsService"
import type { InstitutionSettingsValue } from "@/types/settings"

export function useUpdateInstitutionSettings() {
    const queryClient = useQueryClient()
    const { profile } = useAuth()

    return useMutation({
        mutationFn: async (values: InstitutionSettingsValue) => {
            const payload: InstitutionSettingsValue = {
                name: values.name.trim(),
                cnpj: values.cnpj?.trim() ?? "",
                contactEmail: values.contactEmail?.trim() ?? "",
                phone: values.phone?.trim() ?? "",
                address: values.address?.trim() ?? "",
                logoPath: values.logoPath ?? null,
            }
            await upsertInstitutionSetting("institution", payload, profile?.id ?? null)
            await writeAuditLog({
                action: "institution.update",
                entityType: "institution_settings",
                entityId: "institution",
                metadata: { name: payload.name },
            })
            return payload
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.settings.institution })
            queryClient.invalidateQueries({ queryKey: queryKeys.settings.dashboard })
        },
    })
}
