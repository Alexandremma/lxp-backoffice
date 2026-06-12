import { useMutation } from "@tanstack/react-query"
import { useQueryClient } from "@tanstack/react-query"
import { invalidateAuditLogs } from "@/lib/invalidateAuditLogs"
import { sendSmtpTestEmailAdmin } from "@/services/smtpService"

export function useSendSmtpTestEmail() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (to: string) => sendSmtpTestEmailAdmin(to),
        onSuccess: () => {
            invalidateAuditLogs(queryClient)
        },
    })
}
