import { writeAuditLog } from "@/services/auditLogService"

export type AuditLogInput = Parameters<typeof writeAuditLog>[0]

/**
 * Registra auditoria sem bloquear o fluxo principal em caso de falha.
 * Catálogo completo: `docs-central/AUDIT_LOG_ACTIONS.md`
 */
export function fireAuditLog(input: AuditLogInput): void {
    void writeAuditLog(input).catch((err) => {
        console.warn(`[audit] ${input.action}`, err)
    })
}
