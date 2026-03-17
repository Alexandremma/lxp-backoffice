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
import { type Course } from "@/lib/mock-data"

interface CourseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  course?: Course | null
  onSave: (course: Omit<Course, "id" | "totalStudents" | "createdAt">) => void
}

const categoryOptions = [
  { value: "graduation", label: "Graduação" },
  { value: "postgraduate", label: "Pós-Graduação" },
  { value: "extension", label: "Extensão" },
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
  const [category, setCategory] = useState<Course["category"]>("graduation")
  const [status, setStatus] = useState<Course["status"]>("draft")
  const [periods, setPeriods] = useState(8)
  const [externalLibraryId, setExternalLibraryId] = useState("")

  const isEditing = !!course

  useEffect(() => {
    if (open) {
      if (course) {
        setName(course.name)
        setDescription(course.description)
        setCategory(course.category)
        setStatus(course.status)
        setPeriods(course.periods)
        setExternalLibraryId(course.externalLibraryId || "")
      } else {
        setName("")
        setDescription("")
        setCategory("graduation")
        setStatus("draft")
        setPeriods(8)
        setExternalLibraryId("")
      }
    }
  }, [open, course])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      name: name.trim(),
      description: description.trim(),
      category,
      status,
      periods,
      externalLibraryId: externalLibraryId.trim() || undefined,
    })
    onOpenChange(false)
  }

  const isValid = name.trim().length > 0 && description.trim().length > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Editar Curso" : "Novo Curso"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Altere as informações do curso"
                : "Preencha as informações para criar um novo curso"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Curso</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Administração de Empresas"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva o curso..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as Course["category"])}>
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
                <Select value={status} onValueChange={(v) => setStatus(v as Course["status"])}>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="periods">Total de Grades</Label>
                <Input
                  id="periods"
                  type="number"
                  min={1}
                  max={20}
                  value={periods}
                  onChange={(e) => setPeriods(Number(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="externalLibraryId">ID da Biblioteca (opcional)</Label>
                <Input
                  id="externalLibraryId"
                  value={externalLibraryId}
                  onChange={(e) => setExternalLibraryId(e.target.value)}
                  placeholder="Ex: lib_adm_001"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!isValid}>
              {isEditing ? "Salvar Alterações" : "Criar Curso"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
