import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { LoadingSpinner } from "@/components/states/LoadingSpinner"

type NewTemplateDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  name: string
  onNameChange: (value: string) => void
  institution: string
  onInstitutionChange: (value: string) => void
  layoutKind: "default" | "custom"
  onLayoutKindChange: (value: "default" | "custom") => void
  onCreate: () => void
  onCancel: () => void
  isPending: boolean
}

export function NewTemplateDialog({
  open,
  onOpenChange,
  name,
  onNameChange,
  institution,
  onInstitutionChange,
  layoutKind,
  onLayoutKindChange,
  onCreate,
  onCancel,
  isPending,
}: NewTemplateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo template</DialogTitle>
          <DialogDescription>
            Defina o nome e a instituição. Após criar, abrimos o editor com preview ao vivo.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-2">
            <Label htmlFor="tpl-new-name">Nome</Label>
            <Input
              id="tpl-new-name"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Ex.: Certificado de conclusão"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tpl-new-inst">Nome da instituição</Label>
            <Input
              id="tpl-new-inst"
              value={institution}
              onChange={(e) => onInstitutionChange(e.target.value)}
              placeholder="B42 Edtech"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tpl-new-layout">Tipo de modelo</Label>
            <Select
              value={layoutKind}
              onValueChange={(v) => onLayoutKindChange(v as "default" | "custom")}
            >
              <SelectTrigger id="tpl-new-layout">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Modelo padrão</SelectItem>
                <SelectItem value="custom">Modelo personalizado</SelectItem>
              </SelectContent>
            </Select>
            {layoutKind === "custom" && (
              <p className="text-xs text-muted-foreground">
                Imagem de fundo em paisagem — recomendado 1754×1240 px (proporção A4), PNG ou JPG.
                Faça o upload no editor após criar.
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button onClick={onCreate} disabled={isPending}>
            {isPending ? <LoadingSpinner size="sm" /> : "Criar e personalizar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
