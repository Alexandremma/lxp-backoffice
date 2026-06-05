import { useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/consts/queryKeys"
import { useAuth } from "@/hooks/use-auth"
import { useBackofficeMember } from "@/hooks/queries/useBackofficeMember"
import { fireAuditLog } from "@/lib/auditLogHelpers"
import { invalidateAuditLogs } from "@/lib/invalidateAuditLogs"
import { getInstitutionSetting, upsertInstitutionSetting } from "@/services/institutionSettingsService"
import type { SmtpSettingsValue } from "@/types/settings"

export type UpdateSmtpSettingsInput = SmtpSettingsValue & { password?: string }

function auditActorMetadata(member: ReturnType<typeof useBackofficeMember>["data"]) {
    if (!member) return {}
    return {
        actor_member_id: member.id,
        actor_member_name: member.name,
        actor_member_email: member.email,
    }
}

export function useUpdateSmtpSettings() {
    const queryClient = useQueryClient()
    const { user } = useAuth()
    const { data: member } = useBackofficeMember()

    return useMutation({
        mutationFn: async (values: UpdateSmtpSettingsInput) => {
            const existing = await getInstitutionSetting<SmtpSettingsValue & { password?: string }>("smtp")
            const passwordTrim = values.password?.trim()
            const payload: Record<string, unknown> = {
                enabled: values.enabled,
                host: values.host.trim(),
                port: values.port,
                user: values.user?.trim() ?? "",
                fromEmail: values.fromEmail?.trim() ?? "",
                fromName: values.fromName?.trim() || "LXP Instituição",
                secure: values.secure ?? true,
            }
            if (passwordTrim) {
                payload.password = passwordTrim
            } else if (existing?.password) {
                payload.password = existing.password
            }

            await upsertInstitutionSetting("smtp", payload, user?.id ?? null)
            fireAuditLog({
                action: "smtp.update",
                entityType: "institution_settings",
                entityId: "smtp",
                metadata: { host: payload.host, port: payload.port, ...auditActorMetadata(member) },
            })
            return payload as SmtpSettingsValue
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.settings.smtp })
            queryClient.invalidateQueries({ queryKey: queryKeys.settings.dashboard })
            invalidateAuditLogs(queryClient)
        },
    })
}
