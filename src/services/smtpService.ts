import { FunctionsHttpError } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabaseClient"
import type { SmtpSettingsValue } from "@/types/settings"

export type UpdateSmtpSettingsInput = SmtpSettingsValue & { password?: string }

type SmtpFunctionErrorCode =
    | "SMTP_BAD_REQUEST"
    | "SMTP_NOT_ALLOWED"
    | "SMTP_UNKNOWN_ERROR"
    | "SMTP_CONFIG_ERROR"
    | "SMTP_SEND_FAILED"
    | "SMTP_TEST_NOT_ALLOWED"

function createSmtpError(code: SmtpFunctionErrorCode, message: string): Error & { code: SmtpFunctionErrorCode } {
    const err = new Error(message) as Error & { code: SmtpFunctionErrorCode }
    err.code = code
    return err
}

async function normalizeSmtpFunctionError(error: unknown, fallback: string): Promise<never> {
    if (!(error instanceof FunctionsHttpError)) throw error

    try {
        const payload = (await error.context.json()) as {
            code?: SmtpFunctionErrorCode
            message?: string
        }
        throw createSmtpError(payload.code ?? "SMTP_UNKNOWN_ERROR", payload.message ?? fallback)
    } catch (parseErr) {
        if (parseErr instanceof Error && "code" in parseErr) throw parseErr
        throw createSmtpError("SMTP_UNKNOWN_ERROR", fallback)
    }
}

export async function updateSmtpSettingsAdmin(values: UpdateSmtpSettingsInput): Promise<SmtpSettingsValue> {
    const { data, error } = await supabase.functions.invoke<{ settings: SmtpSettingsValue }>(
        "update-smtp-settings",
        {
            body: {
                enabled: values.enabled,
                host: values.host,
                port: values.port,
                user: values.user,
                fromEmail: values.fromEmail,
                fromName: values.fromName,
                replyTo: values.replyTo ?? "",
                secure: values.secure ?? true,
                password: values.password?.trim() || undefined,
            },
        },
    )

    if (error) await normalizeSmtpFunctionError(error, "Não foi possível salvar as configurações de e-mail.")
    if (!data?.settings) {
        throw createSmtpError("SMTP_UNKNOWN_ERROR", "Resposta inválida ao salvar SMTP.")
    }

    return data.settings
}

export async function sendSmtpTestEmailAdmin(to: string): Promise<{ source: "institution" | "b42"; to: string }> {
    const { data, error } = await supabase.functions.invoke<{
        sent: boolean
        source: "institution" | "b42"
        to: string
    }>("send-test-email", {
        body: { to },
    })

    if (error) await normalizeSmtpFunctionError(error, "Não foi possível enviar o e-mail de teste.")
    if (!data?.sent) {
        throw createSmtpError("SMTP_SEND_FAILED", "Não foi possível enviar o e-mail de teste.")
    }

    return { source: data.source, to: data.to }
}
