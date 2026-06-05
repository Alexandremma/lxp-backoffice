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
} from "@/hooks/mutations/useTemplateSignatureMutationsAdmin"
import {
  openCertificatePrintWindow,
  type CertificatePrintPayload,
} from "@/lib/certificatePrint"

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
  const [localLogoUrl, setLocalLogoUrl] = useState<string | null>(null)
  const [isActive, setIsActive] = useState(true)

  const updateTemplate = useUpdateCertificateTemplateAdmin()
  const uploadLogo = useUploadInstitutionLogo()
  const setSlot = useSetTemplateSignatureSlot()
  const removeSlot = useRemoveTemplateSignatureSlot()
  const slotsQ = useTemplateSignatureSlots(template?.id)

  useEffect(() => {
    if (!open || !template) return
    setName(template.name)
    setDescription(template.description ?? "")
    setInstitutionName(template.institution_name || "B42 Edtech")
    setInstitutionLogoFile(null)
    setLocalLogoUrl(null)
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

  const persistedLogoUrl = useMemo(
    () => getSignatureImagePublicUrl(template?.institution_logo_path ?? null),
    [template?.institution_logo_path],
  )

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
        template: { institution_name: "B42 Edtech", institution_logo_path: null },
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
    })
  }, [template, institutionName, localLogoUrl, persistedLogoUrl, signaturesBySlot])

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

      toast.success("Template salvo.")
      onOpenChange(false)
    } catch (err) {
      toast.error("Não foi possível salvar o template.")
      console.error(err)
    }
  }

  const handlePrintPreview = () => {
    void openCertificatePrintWindow({ ...previewPayload, autoPrint: true }).catch((err) => {
      console.error(err)
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Editar template
            {template.is_default && (
              <Badge variant="warning-muted" className="ml-1">
                Padrão
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Pré-visualização atualiza em tempo real. Os dados do aluno e da disciplina vêm da
            emissão real; aqui são valores de exemplo.
          </DialogDescription>
        </DialogHeader>

        <div className="grid lg:grid-cols-[1fr_360px] gap-6 max-h-[70vh] overflow-y-auto pr-2 pb-4">
          <CertificatePreviewFrame payload={previewPayload} className="w-full h-[640px] border rounded-lg bg-white" />

          <div className="space-y-4 pr-2">
            <div className="space-y-2">
              <Label htmlFor="tpl-name">Nome do template</Label>
              <Input id="tpl-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tpl-desc">Descrição (opcional)</Label>
              <Textarea
                id="tpl-desc"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
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

            <div className="flex items-center justify-between border-t pt-4 mb-4">
              <Label className="text-sm">Template ativo</Label>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
          </div>
        </div>

        <DialogFooter className="flex-wrap gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button variant="outline" onClick={handlePrintPreview}>
            Gerar PDF (impressão)
          </Button>
          <Button
            onClick={() => void handleSave()}
            disabled={updateTemplate.isPending || uploadLogo.isPending}
          >
            {(updateTemplate.isPending || uploadLogo.isPending) && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Salvar template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
