import { z } from "zod"
import { digitsOnly } from "@/lib/inputMasks"
import type { InstitutionSettingsValue } from "@/types/settings"

const optionalEmail = z
    .string()
    .trim()
    .refine((v) => !v || z.string().email().safeParse(v).success, "E-mail inválido")

const optionalCnpj = z
    .string()
    .trim()
    .refine((v) => !v || digitsOnly(v).length === 14, "CNPJ deve ter 14 dígitos")

const optionalPhone = z
    .string()
    .trim()
    .refine((v) => !v || digitsOnly(v).length >= 10, "Telefone inválido")

export const institutionSettingsSchema = z.object({
    name: z.string().trim().min(2, "Informe o nome da instituição"),
    cnpj: optionalCnpj.optional(),
    contactEmail: optionalEmail.optional(),
    phone: optionalPhone.optional(),
    address: z.string().trim().optional(),
    logoPath: z.string().nullable().optional(),
})

export type InstitutionSettingsFormValues = z.infer<typeof institutionSettingsSchema>

export function toInstitutionSettingsValue(values: InstitutionSettingsFormValues): InstitutionSettingsValue {
    return {
        name: values.name,
        cnpj: values.cnpj ?? "",
        contactEmail: values.contactEmail ?? "",
        phone: values.phone ?? "",
        address: values.address ?? "",
        logoPath: values.logoPath ?? null,
    }
}

export const smtpSettingsFormSchema = z.object({
    enabled: z.boolean(),
    host: z.string().trim().min(1, "Informe o servidor SMTP").max(255),
    port: z.coerce.number().int().min(1, "Porta inválida").max(65535, "Porta inválida"),
    user: z.string().trim().max(255).optional().default(""),
    fromEmail: z
        .string()
        .trim()
        .refine((v) => !v || z.string().email().safeParse(v).success, "E-mail remetente inválido")
        .optional()
        .default(""),
    fromName: z.string().trim().max(120).optional().default(""),
    replyTo: z
        .string()
        .trim()
        .refine((v) => !v || z.string().email().safeParse(v).success, "Reply-To inválido")
        .optional()
        .default(""),
    secure: z.boolean().optional().default(true),
    password: z.string().optional(),
})

export type SmtpSettingsFormValues = z.infer<typeof smtpSettingsFormSchema>
