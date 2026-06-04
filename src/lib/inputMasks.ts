/** Apenas dígitos (máx. opcional). */
export function digitsOnly(value: string, maxLength?: number): string {
    const digits = value.replace(/\D/g, "")
    return maxLength != null ? digits.slice(0, maxLength) : digits
}

/** (11) 98765-4321 ou (11) 3456-7890 */
export function formatPhoneBr(value: string): string {
    const digits = digitsOnly(value, 11)
    if (!digits) return ""
    if (digits.length <= 2) return `(${digits}`
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
    if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

/** 12.345.678/0001-90 */
export function formatCnpjBr(value: string): string {
    const digits = digitsOnly(value, 14)
    if (!digits) return ""
    if (digits.length <= 2) return digits
    if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`
    if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`
    if (digits.length <= 12) {
        return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`
    }
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`
}

/** Porta SMTP: 1–65535 */
export function formatSmtpPortInput(value: string): string {
    return digitsOnly(value, 5)
}

export function parseSmtpPort(value: string, fallback = 587): number {
    const n = Number.parseInt(digitsOnly(value), 10)
    if (!Number.isFinite(n) || n < 1) return fallback
    return Math.min(n, 65535)
}
