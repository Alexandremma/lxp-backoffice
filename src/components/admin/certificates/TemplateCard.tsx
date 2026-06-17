import { Award, Edit, Eye, Star } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import type { CertificateTemplateRow } from "@/services/certificatesAdminService"

type TemplateCardProps = {
  template: CertificateTemplateRow
  onPreview: () => void
  onEdit?: () => void
  onSetDefault?: () => void
  onToggleActive?: (next: boolean) => void
  disabled?: boolean
}

const GRADIENTS = [
  "from-primary/30 to-primary/5",
  "from-info/30 to-info/5",
  "from-success/30 to-success/5",
  "from-warning/30 to-warning/5",
  "from-secondary/40 to-secondary/5",
] as const

function gradientFor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) | 0
  const idx = Math.abs(hash) % GRADIENTS.length
  return GRADIENTS[idx]
}

export function TemplateCard({
  template,
  onPreview,
  onEdit,
  onSetDefault,
  onToggleActive,
  disabled,
}: TemplateCardProps) {
  const isDefault = template.is_default

  return (
    <Card
      className={cn(
        "overflow-hidden transition-shadow",
        isDefault && "ring-2 ring-primary shadow-lg",
      )}
    >
      <div
        className={cn(
          "aspect-[4/3] flex items-center justify-center border-b relative bg-gradient-to-br",
          gradientFor(template.name),
        )}
      >
        <Award className="h-16 w-16 text-foreground/40" />
        {isDefault && (
          <Badge variant="warning-muted" className="absolute top-2 left-2 gap-1">
            <Star className="h-3 w-3 fill-current" />
            Padrão
          </Badge>
        )}
        <Badge variant="outline" className="absolute bottom-2 left-2">
          {template.layout_kind === "custom" ? "Personalizado" : "Modelo padrão"}
        </Badge>
        <Badge
          variant={template.is_active ? "success-muted" : "outline"}
          className="absolute top-2 right-2"
        >
          {template.is_active ? "Ativo" : "Inativo"}
        </Badge>
      </div>

      <CardContent className="pt-4 space-y-3">
        <div>
          <h4 className="font-semibold truncate">{template.name}</h4>
          <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
            {template.description?.trim() || template.institution_name}
          </p>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Ativo</span>
          <Switch
            checked={template.is_active}
            onCheckedChange={onToggleActive}
            disabled={disabled || !onToggleActive}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" onClick={onPreview}>
            <Eye className="h-4 w-4 mr-1" />
            Preview
          </Button>
          {onEdit ? (
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit className="h-4 w-4 mr-1" />
              Editar
            </Button>
          ) : (
            <div />
          )}
        </div>

        {onSetDefault ? (
          <Button
            variant={isDefault ? "ghost" : "secondary"}
            size="sm"
            className="w-full"
            onClick={onSetDefault}
            disabled={isDefault || disabled}
          >
            <Star className={cn("h-4 w-4 mr-1", isDefault && "fill-current")} />
            {isDefault ? "Este é o padrão" : "Definir como padrão"}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  )
}
