import { useEffect, useMemo, useState } from "react"
import { Mail, Pencil, Save, X } from "lucide-react"
import { LoadingSpinner } from "@/components/states/LoadingSpinner"
import { toast } from "sonner"
import { SkeletonCard } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { DEFAULT_SMTP_SETTINGS, useSmtpSettings } from "@/hooks/queries/useSmtpSettings"
import { useUpdateSmtpSettings } from "@/hooks/mutations/useUpdateSmtpSettings"
import { useSendSmtpTestEmail } from "@/hooks/mutations/useSendSmtpTestEmail"
import { usePermission } from "@/hooks/usePermission"
import { useAuth } from "@/hooks/use-auth"
import { formatSmtpPortInput, parseSmtpPort } from "@/lib/inputMasks"
import { smtpSettingsFormSchema } from "@/lib/settingsSchemas"
import type { SmtpSettingsValue } from "@/types/settings"

type SmtpFormState = SmtpSettingsValue & { password?: string; portInput: string }

function toFormState(data: SmtpSettingsValue): SmtpFormState {
    return {
        ...data,
        password: "",
        portInput: String(data.port ?? 587),
    }
}

function describeActiveSource(data: SmtpSettingsValue | undefined): string {
    if (!data) return "Nenhum SMTP configurado"
    if (data.enabled && data.host && data.fromEmail && data.passwordConfigured) {
        return "SMTP da instituição (ativo)"
    }
    return "Fallback B42 (quando configurado no ambiente)"
}

export function SmtpSettingsCard() {
    const { user } = useAuth()
    const { can } = usePermission()
    const canEdit = can("configuracoes.editar")
    const { data, isLoading, isError, error } = useSmtpSettings()
    const updateSettings = useUpdateSmtpSettings()
    const sendTestEmail = useSendSmtpTestEmail()
    const [form, setForm] = useState<SmtpFormState | null>(null)
    const [isEditing, setIsEditing] = useState(false)
    const [testRecipient, setTestRecipient] = useState("")

    const fieldsDisabled = !isEditing || updateSettings.isPending

    useEffect(() => {
        if (data) setForm(toFormState(data))
    }, [data])

    useEffect(() => {
        if (!testRecipient && user?.email) setTestRecipient(user.email)
    }, [user?.email, testRecipient])

    const activeSourceLabel = useMemo(() => describeActiveSource(data), [data])

    const handleStartEdit = () => {
        if (data) setForm(toFormState(data))
        setIsEditing(true)
    }

    const handleCancelEdit = () => {
        if (data) setForm(toFormState(data))
        setIsEditing(false)
    }

    const handleSave = async () => {
        if (!form) return
        const parsed = smtpSettingsFormSchema.safeParse({
            enabled: form.enabled,
            host: form.host,
            port: parseSmtpPort(form.portInput),
            user: form.user,
            fromEmail: form.fromEmail,
            fromName: form.fromName,
            replyTo: form.replyTo,
            secure: form.secure,
            password: form.password,
        })
        if (!parsed.success) {
            toast.error(parsed.error.errors[0]?.message ?? "Revise os campos de SMTP.")
            return
        }

        if (parsed.data.enabled && !parsed.data.password && !form.passwordConfigured) {
            toast.error("Informe a senha SMTP para ativar o envio pela instituição.")
            return
        }

        try {
            await updateSettings.mutateAsync({
                enabled: parsed.data.enabled,
                host: parsed.data.host,
                port: parsed.data.port,
                user: parsed.data.user ?? "",
                fromEmail: parsed.data.fromEmail ?? "",
                fromName: parsed.data.fromName ?? DEFAULT_SMTP_SETTINGS.fromName,
                replyTo: parsed.data.replyTo ?? "",
                secure: parsed.data.secure,
                password: parsed.data.password,
                passwordConfigured: form.passwordConfigured,
            })
            toast.success("Configurações de e-mail salvas.")
            setIsEditing(false)
        } catch (err) {
            console.error(err)
            const message = err instanceof Error ? err.message : "Não foi possível salvar as configurações de e-mail."
            toast.error(message)
        }
    }

    const handleSendTest = async () => {
        const recipient = testRecipient.trim()
        if (!recipient) {
            toast.error("Informe o destinatário do teste.")
            return
        }

        try {
            const result = await sendTestEmail.mutateAsync(recipient)
            const sourceLabel = result.source === "institution" ? "instituição" : "B42"
            toast.success(`E-mail de teste enviado (${sourceLabel}) para ${result.to}.`)
        } catch (err) {
            console.error(err)
            const message = err instanceof Error ? err.message : "Não foi possível enviar o e-mail de teste."
            toast.error(message)
        }
    }

    if (isLoading || !form) {
        return <SkeletonCard />
    }

    if (isError) {
        return (
            <Card>
                <CardContent className="py-8 text-destructive text-sm">
                    Erro ao carregar configurações: {(error as Error).message}
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <CardTitle className="flex items-center gap-2">
                        <Mail className="h-5 w-5" />
                        Configurações de Email
                    </CardTitle>
                    <CardDescription>SMTP direto da instituição, com fallback B42 quando inativo</CardDescription>
                </div>
                {canEdit && !isEditing && (
                    <Button variant="outline" size="sm" onClick={handleStartEdit}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                    </Button>
                )}
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{activeSourceLabel}</Badge>
                    {form.passwordConfigured ? (
                        <Badge variant="secondary">Senha configurada</Badge>
                    ) : (
                        <Badge variant="outline">Senha pendente</Badge>
                    )}
                </div>

                <Alert>
                    <AlertDescription>
                        A senha SMTP nunca é exibida após salvar e não fica acessível no navegador. Convites,
                        recuperação de senha e demais e-mails de autenticação usam o mesmo SMTP (instituição ou
                        fallback B42) após ativar o Auth Hook no Supabase.
                    </AlertDescription>
                </Alert>

                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div className="space-y-0.5">
                        <Label>SMTP institucional ativo</Label>
                        <p className="text-sm text-muted-foreground">
                            Quando desligado, o envio usa o fallback B42 (se configurado no ambiente)
                        </p>
                    </div>
                    <Switch
                        checked={form.enabled}
                        disabled={fieldsDisabled}
                        onCheckedChange={(checked) => setForm({ ...form, enabled: checked })}
                    />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="smtp-host">Servidor SMTP</Label>
                        <Input
                            id="smtp-host"
                            value={form.host}
                            placeholder="smtp.seudominio.com.br"
                            disabled={fieldsDisabled}
                            readOnly={!isEditing}
                            onChange={(e) => setForm({ ...form, host: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="smtp-port">Porta</Label>
                        <Input
                            id="smtp-port"
                            inputMode="numeric"
                            value={form.portInput}
                            placeholder="587"
                            disabled={fieldsDisabled}
                            readOnly={!isEditing}
                            onChange={(e) =>
                                setForm({ ...form, portInput: formatSmtpPortInput(e.target.value) })
                            }
                        />
                    </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="smtp-user">Usuário</Label>
                        <Input
                            id="smtp-user"
                            value={form.user}
                            placeholder="Usuário SMTP"
                            disabled={fieldsDisabled}
                            readOnly={!isEditing}
                            onChange={(e) => setForm({ ...form, user: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="smtp-password">Senha</Label>
                        <Input
                            id="smtp-password"
                            type="password"
                            value={form.password ?? ""}
                            placeholder={
                                form.passwordConfigured
                                    ? isEditing
                                        ? "Deixe em branco para manter a atual"
                                        : "••••••••"
                                    : "Informe a senha SMTP"
                            }
                            disabled={fieldsDisabled}
                            readOnly={!isEditing}
                            autoComplete="new-password"
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                        />
                    </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="smtp-from-email">E-mail remetente</Label>
                        <Input
                            id="smtp-from-email"
                            type="email"
                            value={form.fromEmail}
                            placeholder="noreply@instituicao.edu.br"
                            disabled={fieldsDisabled}
                            readOnly={!isEditing}
                            onChange={(e) => setForm({ ...form, fromEmail: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="smtp-from-name">Nome do remetente</Label>
                        <Input
                            id="smtp-from-name"
                            value={form.fromName ?? ""}
                            placeholder="LXP Instituição"
                            disabled={fieldsDisabled}
                            readOnly={!isEditing}
                            onChange={(e) => setForm({ ...form, fromName: e.target.value })}
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="smtp-reply-to">Reply-To (opcional)</Label>
                    <Input
                        id="smtp-reply-to"
                        type="email"
                        value={form.replyTo ?? ""}
                        placeholder="suporte@instituicao.edu.br"
                        disabled={fieldsDisabled}
                        readOnly={!isEditing}
                        onChange={(e) => setForm({ ...form, replyTo: e.target.value })}
                    />
                </div>
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div className="space-y-0.5">
                        <Label>SSL/TLS</Label>
                        <p className="text-sm text-muted-foreground">
                            Ative para porta 465; desative para 587 com STARTTLS
                        </p>
                    </div>
                    <Switch
                        checked={form.secure ?? true}
                        disabled={fieldsDisabled}
                        onCheckedChange={(checked) => setForm({ ...form, secure: checked })}
                    />
                </div>

                {canEdit && (
                    <div className="space-y-3 rounded-lg border p-4">
                        <div className="space-y-2">
                            <Label htmlFor="smtp-test-recipient">Destinatário do teste</Label>
                            <Input
                                id="smtp-test-recipient"
                                type="email"
                                value={testRecipient}
                                placeholder="seu-email@instituicao.edu.br"
                                onChange={(e) => setTestRecipient(e.target.value)}
                            />
                        </div>
                        <Button
                            variant="outline"
                            disabled={sendTestEmail.isPending || updateSettings.isPending}
                            onClick={() => void handleSendTest()}
                        >
                            {sendTestEmail.isPending ? (
                                <LoadingSpinner size="sm" className="mr-2" />
                            ) : (
                                <Mail className="mr-2 h-4 w-4" />
                            )}
                            Enviar e-mail de teste
                        </Button>
                    </div>
                )}

                {isEditing && canEdit && (
                    <div className="flex flex-wrap gap-2">
                        <Button onClick={() => void handleSave()} disabled={updateSettings.isPending}>
                            {updateSettings.isPending ? (
                                <LoadingSpinner size="sm" className="mr-2" />
                            ) : (
                                <Save className="mr-2 h-4 w-4" />
                            )}
                            Salvar
                        </Button>
                        <Button variant="outline" onClick={handleCancelEdit} disabled={updateSettings.isPending}>
                            <X className="mr-2 h-4 w-4" />
                            Cancelar
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
