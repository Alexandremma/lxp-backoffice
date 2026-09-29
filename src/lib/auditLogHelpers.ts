import { writeAuditLog } from "@/services/auditLogService"

export type AuditLogInput = Parameters<typeof writeAuditLog>[0]

/** Registra auditoria sem bloquear o fluxo principal em caso de falha. */
export function fireAuditLog(input: AuditLogInput): void {
    void writeAuditLog(input).catch((err) => {
        console.warn(`[audit] ${input.action}`, err)
    })
}
