import { useEffect, useMemo, useState } from "react"
import { Loader2, Upload } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

import {
  buildCertificateTemplatePreviewPayload,
  type CertificateSignatureRow,
  type CertificateTemplateRow,
  type TemplateSignatureSlot,
  getSignatureImagePublicUrl,
} from "@/services/certificatesAdminService"
import { useUpdateCertificateTemplateAdmin } from "@/hooks/mutations/useCertificateTemplateMutationsAdmin"
import {
  useRemoveTemplateSignatureSlot,
  useSetTemplateSignatureSlot,
  useTemplateSignatureSlots,
  useUploadInstitutionLogo,
  useUploadTemplateBackground,
  useRemoveTemplateBackground,
} from "@/hooks/mutations/useTemplateSignatureMutationsAdmin"
import { downloadCertificatePdfFile } from "@/lib/certificatePdfDownload"
import type { CertificatePrintPayload } from "@/lib/certificatePrint"

import { CertificatePreviewFrame } from "./CertificatePreviewFrame"

type TemplateEditorDialogProps = {
  open: boolean
  template: CertificateTemplateRow | null
  signaturesLibrary: CertificateSignatureRow[]
  onOpenChange: (open: boolean) => void
}

const SLOTS = [1, 2] as const

export function TemplateEditorDialog({
  open,
  template,
  signaturesLibrary,
  onOpenChange,
}: TemplateEditorDialogProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [institutionName, setInstitutionName] = useState("")
  const [institutionLogoFile, setInstitutionLogoFile] = useState<File | null>(null)
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null)
  const [localLogoUrl, setLocalLogoUrl] = useState<string | null>(null)
  const [localBackgroundUrl, setLocalBackgroundUrl] = useState<string | null>(null)
  const [isActive, setIsActive] = useState(true)

  const updateTemplate = useUpdateCertificateTemplateAdmin()
  const uploadLogo = useUploadInstitutionLogo()
  const uploadBackground = useUploadTemplateBackground()
  const removeBackground = useRemoveTemplateBackground()
  const setSlot = useSetTemplateSignatureSlot()
  const removeSlot = useRemoveTemplateSignatureSlot()
  const slotsQ = useTemplateSignatureSlots(template?.id)

  useEffect(() => {
    if (!open || !template) return
    setName(template.name)
    setDescription(template.description ?? "")
    setInstitutionName(template.institution_name || "B42 Edtech")
    setInstitutionLogoFile(null)
    setBackgroundFile(null)
    setLocalLogoUrl(null)
    setLocalBackgroundUrl(null)
    setIsActive(template.is_active)
  }, [open, template])

  useEffect(() => {
    if (!institutionLogoFile) {
      setLocalLogoUrl(null)
      return
    }
    const url = URL.createObjectURL(institutionLogoFile)
    setLocalLogoUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [institutionLogoFile])

  useEffect(() => {
    if (!backgroundFile) {
      setLocalBackgroundUrl(null)
      return
    }
    const url = URL.createObjectURL(backgroundFile)
    setLocalBackgroundUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [backgroundFile])

  const persistedLogoUrl = useMemo(
    () => getSignatureImagePublicUrl(template?.institution_logo_path ?? null),
    [template?.institution_logo_path],
  )

  const persistedBackgroundUrl = useMemo(
    () => getSignatureImagePublicUrl(template?.background_image_path ?? null),
    [template?.background_image_path],
  )

  const isCustomTemplate = template?.layout_kind === "custom"

  const signaturesBySlot = useMemo(() => {
    const map = new Map<number, TemplateSignatureSlot>()
    for (const row of slotsQ.data ?? []) {
      map.set(row.slot, row)
    }
    return map
  }, [slotsQ.data])

  const previewPayload: CertificatePrintPayload = useMemo(() => {
    if (!template) {
      return buildCertificateTemplatePreviewPayload({
        template: {
          institution_name: "B42 Edtech",
          institution_logo_path: null,
          layout_kind: "default",
          background_image_path: null,
        },
        slots: [],
      })
    }

    const slots = SLOTS.map((slot) => signaturesBySlot.get(slot)).filter(
      (s): s is NonNullable<typeof s> => Boolean(s),
    )

    return buildCertificateTemplatePreviewPayload({
      template,
      slots,
      institutionNameOverride: institutionName,
      institutionLogoUrlOverride: localLogoUrl ?? persistedLogoUrl,
      backgroundImageUrlOverride: localBackgroundUrl ?? persistedBackgroundUrl,
    })
  }, [
    template,
    institutionName,
    localLogoUrl,
    persistedLogoUrl,
    localBackgroundUrl,
    persistedBackgroundUrl,
    signaturesBySlot,
  ])

  if (!template) return null

  const handlePickSignature = async (slot: number, value: string) => {
    try {
      if (value === "__none__") {
        await removeSlot.mutateAsync({ template_id: template.id, slot })
      } else {
        await setSlot.mutateAsync({ template_id: template.id, slot, signature_id: value })
      }
    } catch (err) {
      toast.error("Não foi possível atualizar a assinatura.")
      console.error(err)
    }
  }

  const handleSave = async () => {
    const trimmedName = name.trim()
    if (!trimmedName) {
      toast.error("Informe o nome do template.")
      return
    }
    if (isCustomTemplate) {
      const hasPersistedBackground = Boolean(template.background_image_path?.trim())
      const hasNewBackground = Boolean(backgroundFile)
      if (!hasPersistedBackground && !hasNewBackground) {
        toast.error(
          "Templates personalizados exigem uma imagem de fundo. Envie o arquivo antes de salvar.",
        )
        return
      }
    }
    try {
      await updateTemplate.mutateAsync({
        id: template.id,
        patch: {
          name: trimmedName,
          description: description.trim() || null,
          institution_name: institutionName.trim() || "B42 Edtech",
          is_active: isActive,
        },
      })

      if (institutionLogoFile) {
        await uploadLogo.mutateAsync({ templateId: template.id, file: institutionLogoFile })
      }

      if (backgroundFile) {
        await uploadBackground.mutateAsync({ templateId: template.id, file: backgroundFile })
      }

      toast.success("Template salvo.")
      onOpenChange(false)
    } catch (err) {
      toast.error("Não foi possível salvar o template.")
      console.error(err)
    }
  }

  const handleDownloadPreview = () => {
    void downloadCertificatePdfFile(previewPayload).catch((err) => {
      toast.error("Não foi possível baixar o PDF.")
      console.error(err)
    })
  }

  const handleRemoveBackground = async () => {
    if (!template.background_image_path?.trim() && !localBackgroundUrl) return
    try {
      if (template.background_image_path?.trim()) {
        await removeBackground.mutateAsync(template.id)
      }
      setBackgroundFile(null)
      setLocalBackgroundUrl(null)
      const input = document.getElementById("tpl-bg") as HTMLInputElement | null
      if (input) input.value = ""
      toast.success("Imagem de fundo removida.")
    } catch (err) {
      toast.error("Não foi possível remover a imagem de fundo.")
      console.error(err)
    }
  }

  const hasBackgroundPreview =
    Boolean(localBackgroundUrl) ||
    Boolean(persistedBackgroundUrl) ||
    Boolean(template.background_image_path?.trim())

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] max-w-6xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b px-6 py-4">
          <DialogTitle className="flex items-center gap-2">
            Editar template
            {template.is_default && (
              <Badge variant="warning-muted" className="ml-1">
                Padrão
              </Badge>
            )}
            <Badge variant="outline" className="ml-1">
              {isCustomTemplate ? "Personalizado" : "Modelo padrão"}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Pré-visualização atualiza em tempo real. Os dados do aluno e da disciplina vêm da
            emissão real; aqui são valores de exemplo.
          </DialogDescription>
        </DialogHeader>

        <div className="grid min-h-[min(52vh,480px)] min-h-0 flex-1 items-stretch lg:grid-cols-[minmax(0,1.15fr)_340px]">
          {/* Painel de preview — certificado escala para preencher largura e altura */}
          <div className="flex h-full min-h-0 min-w-0 flex-col border-b bg-muted/20 p-1.5 lg:border-b-0 lg:border-r">
            <CertificatePreviewFrame
              payload={previewPayload}
              className="h-full w-full min-h-0"
            />
          </div>

          {/* Formulário — scroll independente */}
          <div className="max-h-[50vh] space-y-4 overflow-y-auto px-5 py-5 lg:max-h-none lg:overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="tpl-name">Nome do template</Label>
              <Input
                id="tpl-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex.: Certificado de conclusão 2026"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tpl-desc">Descrição (opcional)</Label>
              <Textarea
                id="tpl-desc"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Uso interno — ex.: template padrão para cursos de graduação"
              />
            </div>

            <div className="space-y-2 border-t pt-4">
              <Label htmlFor="tpl-inst-name">Nome da instituição</Label>
              <Input
                id="tpl-inst-name"
                value={institutionName}
                onChange={(e) => setInstitutionName(e.target.value)}
                placeholder="B42 Edtech"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tpl-logo">Logo da instituição</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="tpl-logo"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => setInstitutionLogoFile(e.target.files?.[0] ?? null)}
                />
                <Upload className="h-4 w-4 text-muted-foreground" />
              </div>
              {(localLogoUrl || persistedLogoUrl) && (
                <img
                  src={localLogoUrl ?? persistedLogoUrl ?? ""}
                  alt="logo institucional"
                  className="h-10 object-contain mt-1"
                />
              )}
            </div>

            {isCustomTemplate && (
              <div className="space-y-2 border-t pt-4">
                <Label htmlFor="tpl-bg">Imagem de fundo</Label>
                <p className="text-xs text-muted-foreground">
                  Paisagem — recomendado 1754×1240 px (proporção A4), PNG ou JPG.
                </p>
                <div className="flex items-center gap-2">
                  <Input
                    id="tpl-bg"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => setBackgroundFile(e.target.files?.[0] ?? null)}
                  />
                  <Upload className="h-4 w-4 text-muted-foreground" />
                </div>
                {(localBackgroundUrl || persistedBackgroundUrl) && (
                  <img
                    src={localBackgroundUrl ?? persistedBackgroundUrl ?? ""}
                    alt="fundo do certificado"
                    className="mt-1 h-24 w-full rounded border object-cover"
                  />
                )}
                {hasBackgroundPreview && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-1"
                    disabled={removeBackground.isPending}
                    onClick={() => void handleRemoveBackground()}
                  >
                    {removeBackground.isPending && (
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    )}
                    Remover fundo
                  </Button>
                )}
              </div>
            )}

            <div className="space-y-2 border-t pt-4">
              <Label className="block mb-1">Assinaturas</Label>
              {signaturesLibrary.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Cadastre assinaturas na biblioteca para vincular aqui.
                </p>
              )}
              {SLOTS.map((slot) => {
                const current = signaturesBySlot.get(slot)
                return (
                  <div key={slot} className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Slot {slot}</Label>
                    <Select
                      value={current?.signature_id ?? "__none__"}
                      onValueChange={(value) => void handlePickSignature(slot, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma assinatura" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">— Nenhuma —</SelectItem>
                        {signaturesLibrary.map((sig) => (
                          <SelectItem key={sig.id} value={sig.id}>
                            {sig.signer_name} · {sig.signer_title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )
              })}
            </div>

            <div className="flex items-center justify-between border-t pt-4">
              <Label className="text-sm">Template ativo</Label>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
          </div>
        </div>

        <DialogFooter className="shrink-0 gap-2 border-t px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button variant="outline" onClick={handleDownloadPreview}>
            Baixar PDF
          </Button>
          <Button
            onClick={() => void handleSave()}
            disabled={
              updateTemplate.isPending ||
              uploadLogo.isPending ||
              uploadBackground.isPending ||
              removeBackground.isPending
            }
          >
            {(updateTemplate.isPending ||
              uploadLogo.isPending ||
              uploadBackground.isPending ||
              removeBackground.isPending) && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Salvar template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
