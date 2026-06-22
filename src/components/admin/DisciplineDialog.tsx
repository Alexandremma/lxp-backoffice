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
import {
  disciplineHasStudentLessonProgress,
  getDisciplineCoverPublicUrl,
} from "@/services/courses"
import type { LessonAccessMode } from "@/types/discipline"
import { toast } from "sonner"

const disciplineSchema = z
  .object({
    name: z.string().min(1, "Nome é obrigatório").max(200),
    code: z.string().min(1, "Código é obrigatório").max(20),
    workload: z.number().min(1, "Carga horária deve ser maior que 0").max(500),
    useCredits: z.boolean(),
    credits: z.number().min(0, "Créditos não pode ser negativo").max(100),
    professor: z.string().max(100).optional(),
    description: z.string().max(2000).optional(),
    isActive: z.boolean(),
    isSequential: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.useCredits && data.credits < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Informe ao menos 1 crédito",
        path: ["credits"],
      })
    }
  })

type DisciplineFormData = z.infer<typeof disciplineSchema>

export type DisciplineDialogSavePayload = {
  name: string
  code: string
  workload: number
  creditsEnabled: boolean
  credits: number
  professor?: string
  description?: string
  status: "active" | "inactive"
  lessonAccessMode: LessonAccessMode
  coverFile?: File | null
  removeCover?: boolean
  lessonAccessModeLocked?: boolean
}

interface DisciplineDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  discipline?: {
    id?: string
    name: string
    code: string
    workload: number
    credits: number
    creditsEnabled?: boolean
    professor?: string
    description?: string
    coverImagePath?: string
    status?: "active" | "inactive"
    lessonAccessMode?: LessonAccessMode
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
  const [lessonAccessModeLocked, setLessonAccessModeLocked] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors },
  } = useForm<DisciplineFormData>({
    resolver: zodResolver(disciplineSchema),
    defaultValues: {
      name: "",
      code: "",
      workload: 60,
      useCredits: true,
      credits: 4,
      professor: "",
      description: "",
      isActive: false,
      isSequential: false,
    },
  })

  const useCredits = watch("useCredits")

  const persistedCoverUrl = discipline?.coverImagePath
    ? getDisciplineCoverPublicUrl(discipline.coverImagePath)
    : null
  const previewUrl = localPreviewUrl ?? (removeCover ? null : persistedCoverUrl)

  useEffect(() => {
    if (!open) return
    setCoverFile(null)
    setLocalPreviewUrl(null)
    setRemoveCover(false)
    setLessonAccessModeLocked(false)
    if (discipline) {
      const creditsEnabled = discipline.creditsEnabled ?? true
      reset({
        name: discipline.name,
        code: discipline.code,
        workload: discipline.workload,
        useCredits: creditsEnabled,
        credits: creditsEnabled ? discipline.credits : 4,
        professor: discipline.professor || "",
        description: discipline.description || "",
        isActive: (discipline.status ?? "active") === "active",
        isSequential: (discipline.lessonAccessMode ?? "free") === "sequential",
      })
      if (discipline.id) {
        void disciplineHasStudentLessonProgress(discipline.id)
          .then(setLessonAccessModeLocked)
          .catch(() => setLessonAccessModeLocked(false))
      }
    } else {
      reset({
        name: "",
        code: "",
        workload: 60,
        useCredits: true,
        credits: 4,
        professor: "",
        description: "",
        isActive: false,
        isSequential: false,
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
    setIsSaving(true)
    try {
      await onSave({
        name: data.name,
        code: data.code,
        workload: data.workload,
        creditsEnabled: data.useCredits,
        credits: data.useCredits ? data.credits : 0,
        professor: data.professor || undefined,
        description: data.description?.trim() || undefined,
        status: data.isActive ? "active" : "inactive",
        lessonAccessMode: data.isSequential ? "sequential" : "free",
        lessonAccessModeLocked,
        coverFile,
        removeCover,
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

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="useCredits">Informar créditos</Label>
              <p className="text-xs text-muted-foreground">
                Quando desativado, créditos não serão cadastrados nem exibidos para os alunos.
              </p>
            </div>
            <Controller
              name="useCredits"
              control={control}
              render={({ field }) => (
                <Switch
                  id="useCredits"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>

          {useCredits && (
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
          )}

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
              <Label htmlFor="isSequential">Aulas sequenciais</Label>
              <p className="text-xs text-muted-foreground">
                {lessonAccessModeLocked
                  ? "Não é possível alterar: alunos já iniciaram esta disciplina."
                  : "Quando ativo, o aluno só avança após concluir a aula anterior."}
              </p>
            </div>
            <Controller
              name="isSequential"
              control={control}
              render={({ field }) => (
                <Switch
                  id="isSequential"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={lessonAccessModeLocked}
                />
              )}
            />
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
