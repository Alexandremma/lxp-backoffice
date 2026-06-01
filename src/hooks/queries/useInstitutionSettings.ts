import { useQuery } from "@tanstack/react-query"
import { EMPTY_INSTITUTION_SETTINGS } from "@/consts/institutionDefaults"
import { queryKeys } from "@/consts/queryKeys"
import { getInstitutionSetting } from "@/services/institutionSettingsService"
import type { InstitutionSettingsValue } from "@/types/settings"

export function useInstitutionSettings() {
    return useQuery({
        queryKey: queryKeys.settings.institution,
        queryFn: async (): Promise<InstitutionSettingsValue> => {
            const stored = await getInstitutionSetting<InstitutionSettingsValue>("institution")
            return { ...EMPTY_INSTITUTION_SETTINGS, ...stored }
        },
    })
}
