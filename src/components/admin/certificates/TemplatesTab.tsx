import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RequirePermission } from "@/components/auth/RequirePermission"
import { TemplateCard } from "@/components/admin/certificates/TemplateCard"
import type { CertificateTemplateRow } from "@/types/certificates"

type TemplatesTabProps = {
  templates: CertificateTemplateRow[]
  canEditTemplates: boolean
  onNewTemplate: () => void
  onPreview: (template: CertificateTemplateRow) => void
  onEdit: (template: CertificateTemplateRow) => void
  onSetDefault: (template: CertificateTemplateRow) => void
  onToggleActive: (template: CertificateTemplateRow, next: boolean) => void
  disabled?: boolean
}

export function TemplatesTab({
  templates,
  canEditTemplates,
  onNewTemplate,
  onPreview,
  onEdit,
  onSetDefault,
  onToggleActive,
  disabled,
}: TemplatesTabProps) {
  return (
    <div className="space-y-4">
      <RequirePermission permission="certificados.template_criar">
        <div className="flex justify-end">
          <Button onClick={onNewTemplate}>
            <Plus className="mr-2 h-4 w-4" />
            Novo template
          </Button>
        </div>
      </RequirePermission>
      {templates.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhum template cadastrado. Crie um para emitir certificados.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onPreview={() => onPreview(template)}
              onEdit={canEditTemplates ? () => onEdit(template) : undefined}
              onSetDefault={canEditTemplates ? () => onSetDefault(template) : undefined}
              onToggleActive={
                canEditTemplates ? (next) => onToggleActive(template, next) : undefined
              }
              disabled={disabled}
            />
          ))}
        </div>
      )}
    </div>
  )
}
