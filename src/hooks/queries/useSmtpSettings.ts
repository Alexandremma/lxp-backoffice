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
    secure: true,
}

export function useSmtpSettings() {
    return useQuery({
        queryKey: queryKeys.settings.smtp,
        queryFn: async (): Promise<SmtpSettingsValue> => {
            const stored = await getInstitutionSetting<SmtpSettingsValue>("smtp")
            return { ...DEFAULT_SMTP_SETTINGS, ...stored, port: stored?.port ?? 587 }
        },
    })
}
