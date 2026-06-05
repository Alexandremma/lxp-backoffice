import { useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/consts/queryKeys"
import { useAuth } from "@/hooks/use-auth"
import { useBackofficeMember } from "@/hooks/queries/useBackofficeMember"
import { fireAuditLog } from "@/lib/auditLogHelpers"
import { invalidateAuditLogs } from "@/lib/invalidateAuditLogs"
import { upsertInstitutionSetting } from "@/services/institutionSettingsService"
import type { InstitutionSettingsValue } from "@/types/settings"

function auditActorMetadata(member: ReturnType<typeof useBackofficeMember>["data"]) {
    if (!member) return {}
    return {
        actor_member_id: member.id,
        actor_member_name: member.name,
        actor_member_email: member.email,
    }
}

export function useUpdateInstitutionSettings() {
    const queryClient = useQueryClient()
    const { user } = useAuth()
    const { data: member } = useBackofficeMember()

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
            await upsertInstitutionSetting("institution", payload, user?.id ?? null)
            fireAuditLog({
                action: "institution.update",
                entityType: "institution_settings",
                entityId: "institution",
                metadata: { name: payload.name, ...auditActorMetadata(member) },
            })
            return payload
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.settings.institution })
            queryClient.invalidateQueries({ queryKey: queryKeys.settings.dashboard })
            invalidateAuditLogs(queryClient)
        },
    })
}
