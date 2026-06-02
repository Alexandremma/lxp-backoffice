import type { InstitutionSettingsValue } from "@/types/settings"

/** Valores iniciais vazios; placeholders ficam nos inputs da UI. */
export const EMPTY_INSTITUTION_SETTINGS: InstitutionSettingsValue = {
    name: "",
    cnpj: "",
    contactEmail: "",
    phone: "",
    address: "",
    logoPath: null,
}

export const INSTITUTION_FIELD_PLACEHOLDERS = {
    name: "Nome da instituição",
    cnpj: "CNPJ",
    contactEmail: "E-mail de contato",
    phone: "Telefone",
    address: "Endereço completo",
} as const
