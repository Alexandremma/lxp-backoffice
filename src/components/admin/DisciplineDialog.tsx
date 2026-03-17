import { useEffect } from "react"
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
import { type Discipline } from "@/lib/mock-data"

const disciplineSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(200),
  code: z.string().min(1, "Código é obrigatório").max(20),
  workload: z.number().min(1, "Carga horária deve ser maior que 0").max(500),
  professor: z.string().max(100).optional(),
})

type DisciplineFormData = z.infer<typeof disciplineSchema>

interface DisciplineDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  discipline?: Discipline | null
  onSave: (data: { name: string; code: string; workload: number; professor?: string }) => void
}

export function DisciplineDialog({ open, onOpenChange, discipline, onSave }: DisciplineDialogProps) {
  const isEditing = !!discipline

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DisciplineFormData>({
    resolver: zodResolver(disciplineSchema),
    defaultValues: {
      name: "",
      code: "",
      workload: 60,
      professor: "",
    },
  })

  useEffect(() => {
    if (open) {
      if (discipline) {
        reset({
          name: discipline.name,
          code: discipline.code,
          workload: discipline.workload,
          professor: discipline.professor || "",
        })
      } else {
        reset({
          name: "",
          code: "",
          workload: 60,
          professor: "",
        })
      }
    }
  }, [open, discipline, reset])

  const onSubmit = (data: DisciplineFormData) => {
    onSave({
      name: data.name,
      code: data.code,
      workload: data.workload,
      professor: data.professor || undefined,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Disciplina" : "Nova Disciplina"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Disciplina</Label>
            <Input
              id="name"
              placeholder="Ex: Introdução à Administração"
              {...register("name")}
              error={!!errors.name}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Código</Label>
              <Input
                id="code"
                placeholder="Ex: ADM101"
                {...register("code")}
                error={!!errors.code}
              />
              {errors.code && (
                <p className="text-sm text-destructive">{errors.code.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="workload">Carga Horária (h)</Label>
              <Input
                id="workload"
                type="number"
                placeholder="60"
                {...register("workload", { valueAsNumber: true })}
                error={!!errors.workload}
              />
              {errors.workload && (
                <p className="text-sm text-destructive">{errors.workload.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="professor">Professor (opcional)</Label>
            <Input
              id="professor"
              placeholder="Ex: Prof. Dr. Carlos Eduardo"
              {...register("professor")}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Salvar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
