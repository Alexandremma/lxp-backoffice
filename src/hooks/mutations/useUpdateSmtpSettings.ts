import { useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/consts/queryKeys"
import { useAuth } from "@/hooks/use-auth"
import { fireAuditLog } from "@/lib/auditLogHelpers"
import { invalidateAuditLogs } from "@/lib/invalidateAuditLogs"
import { getInstitutionSetting, upsertInstitutionSetting } from "@/services/institutionSettingsService"
import type { SmtpSettingsValue } from "@/types/settings"

export type UpdateSmtpSettingsInput = SmtpSettingsValue & { password?: string }

export function useUpdateSmtpSettings() {
    const queryClient = useQueryClient()
    const { profile } = useAuth()

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

            await upsertInstitutionSetting("smtp", payload, profile?.id ?? null)
            fireAuditLog({
                action: "smtp.update",
                entityType: "institution_settings",
                entityId: "smtp",
                metadata: { host: payload.host, port: payload.port },
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
