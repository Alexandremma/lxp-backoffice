import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  BookOpen,
} from "lucide-react"
import { LibraryLinkDialog } from "./LibraryLinkDialog"
import { GradeDialog } from "./GradeDialog"
import { DisciplineDialog, type DisciplineDialogSavePayload } from "./DisciplineDialog"
import { DeleteConfirmDialog } from "./DeleteConfirmDialog"
import { CourseDisciplineRow } from "./course-grades/CourseDisciplineRow"
import { gradeStatusConfig } from "./course-grades/gradeStatusConfig"
import { toast } from "sonner"
import type { CourseDisciplineAdmin, CoursePeriodAdmin } from "@/types/courseGrades"
import { useGetCourseGrades } from "@/hooks/queries/useGetCourseGrades"
import { useCreateCoursePeriod } from "@/hooks/mutations/useCreateCoursePeriod"
import { useUpdateCoursePeriod } from "@/hooks/mutations/useUpdateCoursePeriod"
import { useDeleteCoursePeriod } from "@/hooks/mutations/useDeleteCoursePeriod"
import { useCreateCourseDiscipline } from "@/hooks/mutations/useCreateCourseDiscipline"
import { useUpdateCourseDiscipline } from "@/hooks/mutations/useUpdateCourseDiscipline"
import { useDeleteCourseDiscipline } from "@/hooks/mutations/useDeleteCourseDiscipline"
import { useLinkCourseContent } from "@/hooks/mutations/useLinkCourseContent"
import { useUnlinkCourseContent } from "@/hooks/mutations/useUnlinkCourseContent"
import { getAdminErrorMessage } from "@/lib/adminErrorMessage"

interface CourseGradesTabProps {
  courseId: string
}

export function CourseGradesTab({ courseId }: CourseGradesTabProps) {
  const { data, isLoading, error } = useGetCourseGrades(courseId)
  const grades = useMemo(() => data ?? [], [data])

  // Grade dialog state
  const [gradeDialogOpen, setGradeDialogOpen] = useState(false)
  const [selectedGrade, setSelectedGrade] = useState<CoursePeriodAdmin | null>(null)

  // Discipline dialog state
  const [disciplineDialogOpen, setDisciplineDialogOpen] = useState(false)
  const [selectedDiscipline, setSelectedDiscipline] = useState<CourseDisciplineAdmin | null>(null)
  const [selectedGradeId, setSelectedGradeId] = useState<string | null>(null)

  // Library link dialog state
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [linkDiscipline, setLinkDiscipline] = useState<CourseDisciplineAdmin | null>(null)

  // Delete confirmation state
  const [deleteGradeOpen, setDeleteGradeOpen] = useState(false)
  const [gradeToDelete, setGradeToDelete] = useState<CoursePeriodAdmin | null>(null)
  const [deleteDisciplineOpen, setDeleteDisciplineOpen] = useState(false)
  const [disciplineToDelete, setDisciplineToDelete] = useState<{ discipline: CourseDisciplineAdmin; gradeId: string } | null>(null)

  const createPeriodMutation = useCreateCoursePeriod(courseId)
  const updatePeriodMutation = useUpdateCoursePeriod(courseId)
  const deletePeriodMutation = useDeleteCoursePeriod(courseId)
  const createDisciplineMutation = useCreateCourseDiscipline(courseId)
  const updateDisciplineMutation = useUpdateCourseDiscipline(courseId)
  const deleteDisciplineMutation = useDeleteCourseDiscipline(courseId)
  const linkContentMutation = useLinkCourseContent(courseId)
  const unlinkContentMutation = useUnlinkCourseContent(courseId)

  useEffect(() => {
    if (!error) return
    toast.error(getAdminErrorMessage("courses-grades", error))
  }, [error])

  // Grade handlers
  const handleNewGrade = () => {
    setSelectedGrade(null)
    setGradeDialogOpen(true)
  }

  const handleEditGrade = (grade: CoursePeriodAdmin) => {
    setSelectedGrade(grade)
    setGradeDialogOpen(true)
  }

  const handleSaveGrade = async (data: { name: string; status: "current" | "completed" | "upcoming" }) => {
    try {
      if (selectedGrade) {
        await updatePeriodMutation.mutateAsync({ periodId: selectedGrade.id, data })
        toast.success("Grade atualizada com sucesso!")
        return
      }

      await createPeriodMutation.mutateAsync(data)
      toast.success("Grade criada com sucesso!")
    } catch (e) {
      toast.error(getAdminErrorMessage("courses-grades", e))
    }
  }

  const handleDeleteGrade = (grade: CoursePeriodAdmin) => {
    setGradeToDelete(grade)
    setDeleteGradeOpen(true)
  }

  const confirmDeleteGrade = async () => {
    if (gradeToDelete) {
      try {
        await deletePeriodMutation.mutateAsync(gradeToDelete.id)
        toast.success("Grade excluída com sucesso!")
        setGradeToDelete(null)
      } catch (e) {
        toast.error(getAdminErrorMessage("courses-grades", e))
      }
    }
  }

  // Discipline handlers
  const handleNewDiscipline = (gradeId: string) => {
    setSelectedGradeId(gradeId)
    setSelectedDiscipline(null)
    setDisciplineDialogOpen(true)
  }

  const handleEditDiscipline = (discipline: CourseDisciplineAdmin, gradeId: string) => {
    setSelectedGradeId(gradeId)
    setSelectedDiscipline(discipline)
    setDisciplineDialogOpen(true)
  }

  const handleSaveDiscipline = async (data: DisciplineDialogSavePayload) => {
    if (!selectedGradeId) return

    try {
      const core = {
        name: data.name,
        code: data.code,
        workload: data.workload,
        credits: data.credits,
        creditsEnabled: data.creditsEnabled,
        professor: data.professor,
        description: data.description,
        status: data.status,
        lessonAccessMode: data.lessonAccessMode,
      }

      if (selectedDiscipline) {
        await updateDisciplineMutation.mutateAsync({
          disciplineId: selectedDiscipline.id,
          data: core,
          coverFile: data.coverFile,
          removeCover: data.removeCover,
          skipLessonAccessMode: data.lessonAccessModeLocked,
        })
        setSelectedDiscipline((prev) =>
          prev
            ? {
                ...prev,
                ...core,
                lessonAccessMode: data.lessonAccessMode,
              }
            : null,
        )
        toast.success("Disciplina atualizada com sucesso!")
        return
      }

      await createDisciplineMutation.mutateAsync({
        periodId: selectedGradeId,
        data: core,
        coverFile: data.coverFile,
      })
      toast.success("Disciplina adicionada com sucesso!")
    } catch (e) {
      toast.error(getAdminErrorMessage("courses-disciplines", e))
      throw e
    }
  }

  const handleDeleteDiscipline = (discipline: CourseDisciplineAdmin, gradeId: string) => {
    setDisciplineToDelete({ discipline, gradeId })
    setDeleteDisciplineOpen(true)
  }

  const confirmDeleteDiscipline = async () => {
    if (disciplineToDelete) {
      try {
        await deleteDisciplineMutation.mutateAsync(disciplineToDelete.discipline.id)
        toast.success("Disciplina removida com sucesso!")
        setDisciplineToDelete(null)
      } catch (e) {
        toast.error(getAdminErrorMessage("courses-disciplines", e))
      }
    }
  }

  // Library link handler
  const handleLinkLibrary = (discipline: CourseDisciplineAdmin) => {
    setLinkDiscipline(discipline)
    setLinkDialogOpen(true)
  }

  const handleUnlinkLibrary = async (discipline: CourseDisciplineAdmin) => {
    const linkId = discipline.linkedLibraryLinkId
    if (!linkId) {
      toast.error("Esta disciplina não possui vínculo para remover.")
      return
    }
    try {
      await unlinkContentMutation.mutateAsync(linkId)
      toast.success("Vínculo removido. A disciplina foi marcada como inativa para os alunos.")
    } catch (e) {
      toast.error(getAdminErrorMessage("courses-content", e))
    }
  }

  const getLinkErrorMessage = (err: unknown): string => {
    if (err && typeof err === "object" && "code" in err) {
      const code = String((err as { code?: string }).code ?? "")
      if (code === "23505") {
        return "Já existe vínculo para esta disciplina. Atualize a página e tente substituir novamente."
      }
    }
    if (err instanceof Error) return err.message
    return getAdminErrorMessage("courses-content", err)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Grades e Disciplinas</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie as grades do curso e vincule conteúdo da biblioteca às disciplinas
          </p>
        </div>
        <Button onClick={handleNewGrade}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Grade
        </Button>
      </div>

      {/* Grades Accordion */}
      {isLoading ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="font-medium mb-1">Carregando grades...</p>
            <p className="text-sm text-muted-foreground">Aguarde um instante</p>
          </CardContent>
        </Card>
      ) : grades.length > 0 ? (
        <Accordion type="multiple" defaultValue={grades.map((g) => g.id)} className="space-y-4">
          {grades.map((grade) => {
            const StatusIcon = gradeStatusConfig[grade.status].icon
            const linkedCount = grade.disciplines.filter((d) => d.linkedTrailId).length

            return (
              <AccordionItem
                key={grade.id}
                value={grade.id}
                className="border rounded-lg bg-card"
              >
                <div className="relative">
                  <AccordionTrigger className="px-6 pr-24 hover:no-underline">
                    <div className="flex items-center gap-4 w-full">
                      <div className="flex items-center gap-3">
                        <StatusIcon className={`h-5 w-5 ${grade.status === "current" ? "text-info" :
                          grade.status === "completed" ? "text-success" : "text-muted-foreground"
                          }`} />
                        <span className="font-semibold">{grade.name}</span>
                      </div>
                      <Badge variant={gradeStatusConfig[grade.status].variant}>
                        {gradeStatusConfig[grade.status].label}
                      </Badge>
                      <div className="flex items-center gap-4 ml-auto mr-4 text-sm text-muted-foreground">
                        <span>{grade.disciplines.length} disciplinas</span>
                        <span className="text-success">{linkedCount} vinculadas</span>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="absolute right-14 top-1/2 -translate-y-1/2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditGrade(grade)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar Grade
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDeleteGrade(grade)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir Grade
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <AccordionContent className="px-6 pb-6">
                  <div className="space-y-3">
                    {grade.disciplines.map((discipline) => (
                      <CourseDisciplineRow
                        key={discipline.id}
                        discipline={discipline}
                        gradeId={grade.id}
                        onLink={handleLinkLibrary}
                        onUnlink={handleUnlinkLibrary}
                        onEdit={handleEditDiscipline}
                        onDelete={handleDeleteDiscipline}
                      />
                    ))}

                    <Button
                      variant="outline"
                      className="w-full mt-4"
                      size="sm"
                      onClick={() => handleNewDiscipline(grade.id)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Disciplina
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="font-medium mb-1">Nenhuma grade cadastrada</p>
            <p className="text-sm text-muted-foreground mb-4">
              Adicione grades e disciplinas para estruturar o curso
            </p>
            <Button onClick={handleNewGrade}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeira Grade
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <GradeDialog
        open={gradeDialogOpen}
        onOpenChange={setGradeDialogOpen}
        grade={selectedGrade}
        onSave={handleSaveGrade}
      />

      <DisciplineDialog
        open={disciplineDialogOpen}
        onOpenChange={setDisciplineDialogOpen}
        discipline={selectedDiscipline}
        hasLibraryLink={Boolean(selectedDiscipline?.linkedTrailId)}
        onSave={handleSaveDiscipline}
      />

      <LibraryLinkDialog
        open={linkDialogOpen}
        onOpenChange={setLinkDialogOpen}
        discipline={linkDiscipline}
        onConfirm={async (selectedContent) => {
          if (!linkDiscipline) return
          try {
            await linkContentMutation.mutateAsync({
              disciplineId: linkDiscipline.id,
              libraryContentType: "discipline",
              libraryContentId: selectedContent.id,
              libraryContentName: selectedContent.name,
            })
            toast.success("Disciplina externa vinculada. Você pode ativar a disciplina para os alunos.")
            setLinkDialogOpen(false)
          } catch (e) {
            toast.error(getLinkErrorMessage(e))
          }
        }}
      />

      <DeleteConfirmDialog
        open={deleteGradeOpen}
        onOpenChange={setDeleteGradeOpen}
        title="Excluir Grade"
        description={`Tem certeza que deseja excluir a grade "${gradeToDelete?.name}"? Todas as disciplinas vinculadas serão removidas. Esta ação não pode ser desfeita.`}
        onConfirm={confirmDeleteGrade}
      />

      <DeleteConfirmDialog
        open={deleteDisciplineOpen}
        onOpenChange={setDeleteDisciplineOpen}
        title="Remover Disciplina"
        description={`Tem certeza que deseja remover a disciplina "${disciplineToDelete?.discipline.name}"? Esta ação não pode ser desfeita.`}
        onConfirm={confirmDeleteDiscipline}
      />
    </div>
  )
}
