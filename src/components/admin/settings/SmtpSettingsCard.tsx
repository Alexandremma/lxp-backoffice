import { useEffect, useState } from "react"
import { Loader2, Mail, Pencil, Save, X } from "lucide-react"
import { toast } from "sonner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { DEFAULT_SMTP_SETTINGS, useSmtpSettings } from "@/hooks/queries/useSmtpSettings"
import { useUpdateSmtpSettings } from "@/hooks/mutations/useUpdateSmtpSettings"
import { usePermission } from "@/hooks/usePermission"
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

export function SmtpSettingsCard() {
    const { can } = usePermission()
    const canEdit = can("configuracoes.editar")
    const { data, isLoading, isError, error } = useSmtpSettings()
    const updateSettings = useUpdateSmtpSettings()
    const [form, setForm] = useState<SmtpFormState | null>(null)
    const [isEditing, setIsEditing] = useState(false)

    const fieldsDisabled = !isEditing || updateSettings.isPending

    useEffect(() => {
        if (data) setForm(toFormState(data))
    }, [data])

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
            secure: form.secure,
            password: form.password,
        })
        if (!parsed.success) {
            toast.error(parsed.error.errors[0]?.message ?? "Revise os campos de SMTP.")
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
                secure: parsed.data.secure,
                password: parsed.data.password,
            })
            toast.success("Configurações de e-mail salvas.")
            setIsEditing(false)
        } catch (err) {
            console.error(err)
            toast.error("Não foi possível salvar as configurações de e-mail.")
        }
    }

    if (isLoading || !form) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-16 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    Carregando configurações de e-mail…
                </CardContent>
            </Card>
        )
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
                    <CardDescription>Configure o servidor SMTP para envio de e-mails</CardDescription>
                </div>
                {canEdit && !isEditing && (
                    <Button variant="outline" size="sm" onClick={handleStartEdit}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                    </Button>
                )}
            </CardHeader>
            <CardContent className="space-y-6">
                <Alert>
                    <AlertDescription>
                        O envio real de e-mails (convites, recuperação de senha) depende da ativação do
                        SMTP pela instituição. Os dados abaixo já são salvos para quando o provedor for
                        configurado.
                    </AlertDescription>
                </Alert>

                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div className="space-y-0.5">
                        <Label>SMTP ativo</Label>
                        <p className="text-sm text-muted-foreground">Habilitar envio quando o servidor estiver pronto</p>
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
                            placeholder={isEditing ? "Deixe em branco para manter a atual" : "••••••••"}
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
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div className="space-y-0.5">
                        <Label>SSL/TLS</Label>
                        <p className="text-sm text-muted-foreground">Usar conexão segura</p>
                    </div>
                    <Switch
                        checked={form.secure ?? true}
                        disabled={fieldsDisabled}
                        onCheckedChange={(checked) => setForm({ ...form, secure: checked })}
                    />
                </div>

                {isEditing && canEdit && (
                    <div className="flex flex-wrap gap-2">
                        <Button onClick={() => void handleSave()} disabled={updateSettings.isPending}>
                            {updateSettings.isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="mr-2 h-4 w-4" />
                            )}
                            Salvar
                        </Button>
                        <Button variant="outline" onClick={handleCancelEdit} disabled={updateSettings.isPending}>
                            <X className="mr-2 h-4 w-4" />
                            Cancelar
                        </Button>
                        <Button
                            variant="outline"
                            disabled={updateSettings.isPending}
                            onClick={() =>
                                toast.info(
                                    "Envio de teste será habilitado quando o SMTP institucional estiver ativo.",
                                )
                            }
                        >
                            Enviar e-mail de teste
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
