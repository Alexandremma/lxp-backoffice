import { useEffect, useState } from "react"
import { useForm, Controller } from "react-hook-form"
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
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { getDisciplineCoverPublicUrl } from "@/services/coursesService"
import { toast } from "sonner"

const disciplineSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(200),
  code: z.string().min(1, "Código é obrigatório").max(20),
  workload: z.number().min(1, "Carga horária deve ser maior que 0").max(500),
  credits: z.number().min(0, "Créditos não pode ser negativo").max(100),
  professor: z.string().max(100).optional(),
  description: z.string().max(2000).optional(),
  isActive: z.boolean(),
})

type DisciplineFormData = z.infer<typeof disciplineSchema>

export type DisciplineDialogSavePayload = {
  name: string
  code: string
  workload: number
  credits: number
  professor?: string
  description?: string
  status: "active" | "inactive"
  coverFile?: File | null
  removeCover?: boolean
}

interface DisciplineDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  discipline?: {
    name: string
    code: string
    workload: number
    credits: number
    professor?: string
    description?: string
    coverImagePath?: string
    status?: "active" | "inactive"
  } | null
  onSave: (data: DisciplineDialogSavePayload) => void | Promise<void>
  /** Disciplina possui vínculo em lxp_course_library_links — obrigatório para ativar no app do aluno. */
  hasLibraryLink?: boolean
}

export function DisciplineDialog({
  open,
  onOpenChange,
  discipline,
  onSave,
  hasLibraryLink = false,
}: DisciplineDialogProps) {
  const isEditing = !!discipline
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null)
  const [removeCover, setRemoveCover] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<DisciplineFormData>({
    resolver: zodResolver(disciplineSchema),
    defaultValues: {
      name: "",
      code: "",
      workload: 60,
      credits: 4,
      professor: "",
      description: "",
      isActive: false,
    },
  })

  const persistedCoverUrl = discipline?.coverImagePath
    ? getDisciplineCoverPublicUrl(discipline.coverImagePath)
    : null
  const previewUrl = localPreviewUrl ?? (removeCover ? null : persistedCoverUrl)

  useEffect(() => {
    if (!open) return
    setCoverFile(null)
    setLocalPreviewUrl(null)
    setRemoveCover(false)
    if (discipline) {
      reset({
        name: discipline.name,
        code: discipline.code,
        workload: discipline.workload,
        credits: discipline.credits,
        professor: discipline.professor || "",
        description: discipline.description || "",
        isActive: (discipline.status ?? "active") === "active",
      })
    } else {
      reset({
        name: "",
        code: "",
        workload: 60,
        credits: 4,
        professor: "",
        description: "",
        isActive: false,
      })
    }
  }, [open, discipline, reset])

  useEffect(() => {
    if (!coverFile) {
      setLocalPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(coverFile)
    setLocalPreviewUrl(url)
    setRemoveCover(false)
    return () => URL.revokeObjectURL(url)
  }, [coverFile])

  const onSubmit = async (data: DisciplineFormData) => {
    if (data.isActive && !hasLibraryLink) {
      toast.error("Vincule uma disciplina externa antes de ativar para os alunos.")
      return
    }
    await onSave({
      name: data.name,
      code: data.code,
      workload: data.workload,
      credits: data.credits,
      professor: data.professor || undefined,
      description: data.description?.trim() || undefined,
      status: data.isActive ? "active" : "inactive",
      coverFile,
      removeCover,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Disciplina" : "Nova Disciplina"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="space-y-4">
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

          <div className="grid grid-cols-3 gap-4">
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

            <div className="space-y-2">
              <Label htmlFor="credits">Créditos</Label>
              <Input
                id="credits"
                type="number"
                placeholder="4"
                {...register("credits", { valueAsNumber: true })}
                error={!!errors.credits}
              />
              {errors.credits && (
                <p className="text-sm text-destructive">{errors.credits.message}</p>
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

          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea
              id="description"
              placeholder="Texto exibido abaixo do título na página da disciplina no portal do aluno. Se vazio, usa a descrição do curso."
              rows={3}
              {...register("description")}
            />
            <p className="text-xs text-muted-foreground">
              Visível apenas para o aluno. Não inclua detalhes técnicos de integração.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cover">Imagem de capa (opcional)</Label>
            {previewUrl && (
              <div className="relative rounded-lg overflow-hidden border h-32">
                <img src={previewUrl} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <Input
              id="cover"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
            />
            {(persistedCoverUrl || localPreviewUrl) && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setCoverFile(null)
                  setLocalPreviewUrl(null)
                  setRemoveCover(true)
                }}
              >
                Remover imagem
              </Button>
            )}
            <p className="text-xs text-muted-foreground">
              Usada como fundo no topo da página da disciplina (PNG, JPEG ou WebP, até 5 MB).
            </p>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="isActive">Disciplina ativa para alunos</Label>
              <p className="text-xs text-muted-foreground">
                {hasLibraryLink
                  ? "Inativa exibe \"Disciplina inativa\" no app do aluno (sem acesso às aulas)."
                  : "Disponível para alunos após vincular conteúdo externo na grade (aba Vincular Disciplina)."}
              </p>
            </div>
            <Controller
              name="isActive"
              control={control}
              render={({ field }) => (
                <Switch
                  id="isActive"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={!hasLibraryLink}
                />
              )}
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
