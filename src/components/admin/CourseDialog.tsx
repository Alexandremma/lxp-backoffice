import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { CourseAdmin, CourseAdminInput } from "@/types/courseAdmin"

interface CourseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  course?: CourseAdmin | null
  onSave: (course: CourseAdminInput) => Promise<void> | void
}

const categoryOptions = [
  { value: "graduation", label: "Graduação" },
  { value: "postgraduate", label: "Pós-Graduação" },
  { value: "extension", label: "Extensão" },
  { value: "free_course", label: "Curso livre" },
]

const statusOptions = [
  { value: "draft", label: "Rascunho" },
  { value: "active", label: "Ativo" },
  { value: "archived", label: "Arquivado" },
]

export function CourseDialog({
  open,
  onOpenChange,
  course,
  onSave,
}: CourseDialogProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState<CourseAdmin["category"]>("graduation")
  const [status, setStatus] = useState<CourseAdmin["status"]>("draft")
  const [isSaving, setIsSaving] = useState(false)
  const [showFieldErrors, setShowFieldErrors] = useState(false)

  const isEditing = !!course

  useEffect(() => {
    if (open) {
      setShowFieldErrors(false)
      setIsSaving(false)
      if (course) {
        setName(course.name)
        setDescription(course.description)
        setCategory(course.category)
        setStatus(course.status)
      } else {
        setName("")
        setDescription("")
        setCategory("graduation")
        setStatus("draft")
      }
    }
  }, [open, course])

  const nameError = showFieldErrors && name.trim().length === 0
  const descriptionError = showFieldErrors && description.trim().length === 0
  const isValid = name.trim().length > 0 && description.trim().length > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) {
      setShowFieldErrors(true)
      return
    }
    setIsSaving(true)
    try {
      await onSave({
        name: name.trim(),
        description: description.trim(),
        category,
        status,
      })
      onOpenChange(false)
    } catch {
      // Erro tratado no handler pai; mantém modal aberto.
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={(e) => void handleSubmit(e)}>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Editar Curso" : "Novo Curso"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Altere as informações do curso. Períodos e disciplinas são gerenciados na aba Grades."
                : "Preencha as informações para criar um novo curso"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Nome do Curso <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Administração de Empresas"
                aria-required
                aria-invalid={nameError || undefined}
                disabled={isSaving}
              />
              {nameError ? (
                <p className="text-sm text-destructive">Nome é obrigatório</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                Descrição <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva o curso..."
                rows={3}
                aria-required
                aria-invalid={descriptionError || undefined}
                disabled={isSaving}
              />
              {descriptionError ? (
                <p className="text-sm text-destructive">Descrição é obrigatória</p>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Select
                  value={category}
                  onValueChange={(v) => setCategory(v as CourseAdmin["category"])}
                  disabled={isSaving}
                >
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={status}
                  onValueChange={(v) => setStatus(v as CourseAdmin["status"])}
                  disabled={isSaving}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button type="submit" loading={isSaving}>
              {isEditing ? "Salvar Alterações" : "Criar Curso"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
