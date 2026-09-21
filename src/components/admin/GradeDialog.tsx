import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
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
import type { CoursePeriodAdmin } from "@/types/courseGrades"

export type PeriodGradeForm = {
  name: string
  status: "current" | "completed" | "upcoming"
}

const gradeSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100),
  status: z.enum(["current", "completed", "upcoming"]),
})

type GradeFormData = z.infer<typeof gradeSchema>

interface GradeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  grade?: Pick<CoursePeriodAdmin, "name" | "status"> | null
  onSave: (data: PeriodGradeForm) => Promise<void> | void
}

const statusOptions = [
  { value: "upcoming", label: "Próximo" },
  { value: "current", label: "Em Andamento" },
  { value: "completed", label: "Concluído" },
]

export function GradeDialog({ open, onOpenChange, grade, onSave }: GradeDialogProps) {
  const isEditing = !!grade
  const [isSaving, setIsSaving] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<GradeFormData>({
    resolver: zodResolver(gradeSchema),
    defaultValues: {
      name: "",
      status: "upcoming",
    },
  })

  const statusValue = watch("status")

  useEffect(() => {
    if (open) {
      setIsSaving(false)
      if (grade) {
        reset({
          name: grade.name,
          status: grade.status,
        })
      } else {
        reset({
          name: "",
          status: "upcoming",
        })
      }
    }
  }, [open, grade, reset])

  const onSubmit = handleSubmit(async (data: GradeFormData) => {
    setIsSaving(true)
    try {
      await onSave({ name: data.name, status: data.status })
      onOpenChange(false)
    } catch {
      // Erro tratado no handler pai; mantém modal aberto.
    } finally {
      setIsSaving(false)
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Grade" : "Nova Grade"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Grade</Label>
            <Input
              id="name"
              placeholder="Ex: 1ª Grade"
              {...register("name")}
              error={!!errors.name}
              disabled={isSaving}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={statusValue}
              onValueChange={(value: "current" | "completed" | "upcoming") => setValue("status", value)}
              disabled={isSaving}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button type="submit" loading={isSaving}>
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
