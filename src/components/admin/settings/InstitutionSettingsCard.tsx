import { useEffect, useRef, useState } from "react"
import { Building2, Pencil, Save, X } from "lucide-react"
import { LoadingSpinner } from "@/components/states/LoadingSpinner"
import { toast } from "sonner"
import { SkeletonCard } from "@/components/ui/skeleton"
import { INSTITUTION_FIELD_PLACEHOLDERS } from "@/consts/institutionDefaults"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { useInstitutionSettings } from "@/hooks/queries/useInstitutionSettings"
import { useUpdateInstitutionSettings } from "@/hooks/mutations/useUpdateInstitutionSettings"
import { usePermission } from "@/hooks/usePermission"
import { formatCnpjBr, formatPhoneBr } from "@/lib/inputMasks"
import { institutionSettingsSchema, toInstitutionSettingsValue } from "@/lib/settingsSchemas"
import {
    getInstitutionBrandingPublicUrl,
    uploadInstitutionBrandingLogo,
} from "@/services/institutionSettingsService"
import type { InstitutionSettingsValue } from "@/types/settings"

export function InstitutionSettingsCard() {
    const { can } = usePermission()
    const canEdit = can("configuracoes.editar")
    const { data, isLoading, isError, error } = useInstitutionSettings()
    const updateSettings = useUpdateInstitutionSettings()
    const [form, setForm] = useState<InstitutionSettingsValue | null>(null)
    const [isEditing, setIsEditing] = useState(false)
    const [logoPreview, setLogoPreview] = useState<string | null>(null)
    const [uploadingLogo, setUploadingLogo] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const fieldsDisabled = !isEditing || updateSettings.isPending || uploadingLogo

    useEffect(() => {
        if (data) {
            setForm({
                ...data,
                cnpj: data.cnpj ? formatCnpjBr(data.cnpj) : "",
                phone: data.phone ? formatPhoneBr(data.phone) : "",
            })
        }
    }, [data])

    useEffect(() => {
        if (!form?.logoPath) {
            setLogoPreview(null)
            return
        }
        setLogoPreview(getInstitutionBrandingPublicUrl(form.logoPath))
    }, [form?.logoPath])

    const handleStartEdit = () => {
        if (data) {
            setForm({
                ...data,
                cnpj: data.cnpj ? formatCnpjBr(data.cnpj) : "",
                phone: data.phone ? formatPhoneBr(data.phone) : "",
            })
        }
        setIsEditing(true)
    }

    const handleCancelEdit = () => {
        if (data) {
            setForm({
                ...data,
                cnpj: data.cnpj ? formatCnpjBr(data.cnpj) : "",
                phone: data.phone ? formatPhoneBr(data.phone) : "",
            })
        }
        setIsEditing(false)
    }

    const handleSave = async () => {
        if (!form) return
        const parsed = institutionSettingsSchema.safeParse(form)
        if (!parsed.success) {
            toast.error(parsed.error.errors[0]?.message ?? "Revise os campos da instituição.")
            return
        }
        try {
            await updateSettings.mutateAsync(toInstitutionSettingsValue(parsed.data))
            toast.success("Dados da instituição salvos.")
            setIsEditing(false)
        } catch (err) {
            console.error(err)
            toast.error("Não foi possível salvar os dados da instituição.")
        }
    }

    const handleLogoChange = async (file: File | undefined) => {
        if (!file || !form || !isEditing) return
        setUploadingLogo(true)
        try {
            const path = await uploadInstitutionBrandingLogo(file)
            const next = { ...form, logoPath: path }
            setForm(next)
            await updateSettings.mutateAsync(next)
            toast.success("Logo atualizado.")
        } catch (err) {
            const message = err instanceof Error ? err.message : "Falha ao enviar o logo."
            toast.error(message)
        } finally {
            setUploadingLogo(false)
            if (fileInputRef.current) fileInputRef.current.value = ""
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
                        <Building2 className="h-5 w-5" />
                        Dados da Instituição
                    </CardTitle>
                    <CardDescription>
                        Informações exibidas no Back Office e comunicações institucionais
                    </CardDescription>
                </div>
                {canEdit && !isEditing && (
                    <Button variant="outline" size="sm" onClick={handleStartEdit}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                    </Button>
                )}
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="institution-name">Nome da Instituição</Label>
                        <Input
                            id="institution-name"
                            value={form.name}
                            placeholder={INSTITUTION_FIELD_PLACEHOLDERS.name}
                            disabled={fieldsDisabled}
                            readOnly={!isEditing}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="institution-cnpj">CNPJ</Label>
                        <Input
                            id="institution-cnpj"
                            value={form.cnpj ?? ""}
                            placeholder={INSTITUTION_FIELD_PLACEHOLDERS.cnpj}
                            disabled={fieldsDisabled}
                            readOnly={!isEditing}
                            onChange={(e) => setForm({ ...form, cnpj: formatCnpjBr(e.target.value) })}
                        />
                    </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="institution-email">E-mail de Contato</Label>
                        <Input
                            id="institution-email"
                            type="email"
                            value={form.contactEmail ?? ""}
                            placeholder={INSTITUTION_FIELD_PLACEHOLDERS.contactEmail}
                            disabled={fieldsDisabled}
                            readOnly={!isEditing}
                            onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="institution-phone">Telefone</Label>
                        <Input
                            id="institution-phone"
                            value={form.phone ?? ""}
                            placeholder={INSTITUTION_FIELD_PLACEHOLDERS.phone}
                            disabled={fieldsDisabled}
                            readOnly={!isEditing}
                            onChange={(e) => setForm({ ...form, phone: formatPhoneBr(e.target.value) })}
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="institution-address">Endereço</Label>
                    <Textarea
                        id="institution-address"
                        value={form.address ?? ""}
                        placeholder={INSTITUTION_FIELD_PLACEHOLDERS.address}
                        disabled={fieldsDisabled}
                        readOnly={!isEditing}
                        onChange={(e) => setForm({ ...form, address: e.target.value })}
                        rows={2}
                    />
                </div>
                <Separator />
                <div className="space-y-4">
                    <Label className="text-base font-semibold">Logo da Instituição</Label>
                    <div className="flex items-center gap-4">
                        <div className="h-20 w-20 rounded-lg bg-muted flex items-center justify-center overflow-hidden border">
                            {logoPreview ? (
                                <img src={logoPreview} alt="Logo da instituição" className="h-full w-full object-contain" />
                            ) : (
                                <Building2 className="h-10 w-10 text-muted-foreground" />
                            )}
                        </div>
                        <div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/png,image/jpeg,image/webp"
                                className="hidden"
                                disabled={fieldsDisabled}
                                onChange={(e) => void handleLogoChange(e.target.files?.[0])}
                            />
                            <Button
                                variant="outline"
                                type="button"
                                disabled={fieldsDisabled}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {uploadingLogo ? (
                                    <>
                                        <LoadingSpinner size="sm" className="mr-2" />
                                        Enviando…
                                    </>
                                ) : (
                                    "Alterar Logo"
                                )}
                            </Button>
                            <p className="text-xs text-muted-foreground mt-2">
                                PNG, JPG ou WebP. Máximo 2MB.
                                {!isEditing && canEdit ? " Clique em Editar para alterar." : null}
                            </p>
                        </div>
                    </div>
                </div>
                {isEditing && canEdit && (
                    <div className="flex flex-wrap gap-2">
                        <Button onClick={() => void handleSave()} disabled={updateSettings.isPending || uploadingLogo}>
                            {updateSettings.isPending ? (
                                <LoadingSpinner size="sm" className="mr-2" />
                            ) : (
                                <Save className="mr-2 h-4 w-4" />
                            )}
                            Salvar
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleCancelEdit}
                            disabled={updateSettings.isPending || uploadingLogo}
                        >
                            <X className="mr-2 h-4 w-4" />
                            Cancelar
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
