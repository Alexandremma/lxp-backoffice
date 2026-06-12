import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/consts/queryKeys"
import { getInstitutionSetting } from "@/services/institutionSettingsService"
import type { SmtpSettingsValue } from "@/types/settings"

export const DEFAULT_SMTP_SETTINGS: SmtpSettingsValue = {
    enabled: false,
    host: "",
    port: 587,
    user: "",
    fromEmail: "",
    fromName: "LXP Instituição",
    replyTo: "",
    secure: true,
    passwordConfigured: false,
}

export function useSmtpSettings() {
    return useQuery({
        queryKey: queryKeys.settings.smtp,
        queryFn: async (): Promise<SmtpSettingsValue> => {
            const stored = await getInstitutionSetting<SmtpSettingsValue & { password?: string }>("smtp")
            if (!stored) return DEFAULT_SMTP_SETTINGS
            const { password: _legacyPassword, ...safe } = stored
            return {
                ...DEFAULT_SMTP_SETTINGS,
                ...safe,
                port: safe.port ?? 587,
                passwordConfigured: Boolean(safe.passwordConfigured || _legacyPassword),
            }
        },
    })
}
