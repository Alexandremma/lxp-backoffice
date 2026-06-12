import { useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/consts/queryKeys"
import { invalidateAuditLogs } from "@/lib/invalidateAuditLogs"
import { updateSmtpSettingsAdmin, type UpdateSmtpSettingsInput } from "@/services/smtpService"

export function useUpdateSmtpSettings() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (values: UpdateSmtpSettingsInput) => updateSmtpSettingsAdmin(values),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.settings.smtp })
            queryClient.invalidateQueries({ queryKey: queryKeys.settings.dashboard })
            invalidateAuditLogs(queryClient)
        },
    })
}
