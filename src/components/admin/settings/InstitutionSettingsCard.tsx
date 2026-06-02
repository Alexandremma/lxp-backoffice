import { useEffect, useRef, useState } from "react"
import { Building2, Loader2, Save } from "lucide-react"
import { toast } from "sonner"
import { INSTITUTION_FIELD_PLACEHOLDERS } from "@/consts/institutionDefaults"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { useInstitutionSettings } from "@/hooks/queries/useInstitutionSettings"
import { useUpdateInstitutionSettings } from "@/hooks/mutations/useUpdateInstitutionSettings"
import {
    getInstitutionBrandingPublicUrl,
    uploadInstitutionBrandingLogo,
} from "@/services/institutionSettingsService"
import type { InstitutionSettingsValue } from "@/types/settings"

export function InstitutionSettingsCard() {
    const { data, isLoading, isError, error } = useInstitutionSettings()
    const updateSettings = useUpdateInstitutionSettings()
    const [form, setForm] = useState<InstitutionSettingsValue | null>(null)
    const [logoPreview, setLogoPreview] = useState<string | null>(null)
    const [uploadingLogo, setUploadingLogo] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (data) setForm(data)
    }, [data])

    useEffect(() => {
        if (!form?.logoPath) {
            setLogoPreview(null)
            return
        }
        setLogoPreview(getInstitutionBrandingPublicUrl(form.logoPath))
    }, [form?.logoPath])

    const handleSave = async () => {
        if (!form) return
        if (!form.name.trim()) {
            toast.error("Informe o nome da instituição.")
            return
        }
        try {
            await updateSettings.mutateAsync(form)
            toast.success("Dados da instituição salvos.")
        } catch (err) {
            console.error(err)
            toast.error("Não foi possível salvar os dados da instituição.")
        }
    }

    const handleLogoChange = async (file: File | undefined) => {
        if (!file || !form) return
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
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-16 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    Carregando dados da instituição…
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
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Dados da Instituição
                </CardTitle>
                <CardDescription>Informações exibidas no Back Office e comunicações institucionais</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="institution-name">Nome da Instituição</Label>
                        <Input
                            id="institution-name"
                            value={form.name}
                            placeholder={INSTITUTION_FIELD_PLACEHOLDERS.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="institution-cnpj">CNPJ</Label>
                        <Input
                            id="institution-cnpj"
                            value={form.cnpj ?? ""}
                            placeholder={INSTITUTION_FIELD_PLACEHOLDERS.cnpj}
                            onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
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
                            onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="institution-phone">Telefone</Label>
                        <Input
                            id="institution-phone"
                            value={form.phone ?? ""}
                            placeholder={INSTITUTION_FIELD_PLACEHOLDERS.phone}
                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="institution-address">Endereço</Label>
                    <Textarea
                        id="institution-address"
                        value={form.address ?? ""}
                        placeholder={INSTITUTION_FIELD_PLACEHOLDERS.address}
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
                                onChange={(e) => void handleLogoChange(e.target.files?.[0])}
                            />
                            <Button
                                variant="outline"
                                type="button"
                                disabled={uploadingLogo || updateSettings.isPending}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {uploadingLogo ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Enviando…
                                    </>
                                ) : (
                                    "Alterar Logo"
                                )}
                            </Button>
                            <p className="text-xs text-muted-foreground mt-2">PNG, JPG ou WebP. Máximo 2MB.</p>
                        </div>
                    </div>
                </div>
                <Button onClick={() => void handleSave()} disabled={updateSettings.isPending || uploadingLogo}>
                    {updateSettings.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Save className="mr-2 h-4 w-4" />
                    )}
                    Salvar Alterações
                </Button>
            </CardContent>
        </Card>
    )
}
