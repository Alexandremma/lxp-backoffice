import { useState } from "react"
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
  Link2,
  Edit,
  Trash2,
  BookOpen,
  Clock,
  User,
  CheckCircle2,
  Circle,
  AlertCircle,
} from "lucide-react"
import { type CourseGrade, type Discipline } from "@/lib/mock-data"
import { LibraryLinkDialog } from "./LibraryLinkDialog"
import { GradeDialog } from "./GradeDialog"
import { DisciplineDialog } from "./DisciplineDialog"
import { DeleteConfirmDialog } from "./DeleteConfirmDialog"
import { toast } from "sonner"

interface CourseGradesTabProps {
  courseId: string
  grades: CourseGrade[]
}

const gradeStatusConfig = {
  current: { label: "Em Andamento", variant: "info" as const, icon: AlertCircle },
  completed: { label: "Concluído", variant: "success" as const, icon: CheckCircle2 },
  upcoming: { label: "Próximo", variant: "secondary" as const, icon: Circle },
}

export function CourseGradesTab({ courseId, grades: initialGrades }: CourseGradesTabProps) {
  const [grades, setGrades] = useState<CourseGrade[]>(initialGrades)
  
  // Grade dialog state
  const [gradeDialogOpen, setGradeDialogOpen] = useState(false)
  const [selectedGrade, setSelectedGrade] = useState<CourseGrade | null>(null)
  
  // Discipline dialog state
  const [disciplineDialogOpen, setDisciplineDialogOpen] = useState(false)
  const [selectedDiscipline, setSelectedDiscipline] = useState<Discipline | null>(null)
  const [selectedGradeId, setSelectedGradeId] = useState<string | null>(null)
  
  // Library link dialog state
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [linkDiscipline, setLinkDiscipline] = useState<Discipline | null>(null)
  
  // Delete confirmation state
  const [deleteGradeOpen, setDeleteGradeOpen] = useState(false)
  const [gradeToDelete, setGradeToDelete] = useState<CourseGrade | null>(null)
  const [deleteDisciplineOpen, setDeleteDisciplineOpen] = useState(false)
  const [disciplineToDelete, setDisciplineToDelete] = useState<{ discipline: Discipline; gradeId: string } | null>(null)

  // Grade handlers
  const handleNewGrade = () => {
    setSelectedGrade(null)
    setGradeDialogOpen(true)
  }

  const handleEditGrade = (grade: CourseGrade) => {
    setSelectedGrade(grade)
    setGradeDialogOpen(true)
  }

  const handleSaveGrade = (data: { name: string; status: "current" | "completed" | "upcoming" }) => {
    if (selectedGrade) {
      // Edit existing grade
      setGrades(grades.map(g => 
        g.id === selectedGrade.id 
          ? { ...g, name: data.name, status: data.status }
          : g
      ))
      toast.success("Grade atualizada com sucesso!")
    } else {
      // Create new grade
      const newGrade: CourseGrade = {
        id: `grade_${Date.now()}`,
        courseId,
        name: data.name,
        number: grades.length + 1,
        status: data.status,
        disciplines: [],
      }
      setGrades([...grades, newGrade])
      toast.success("Grade criada com sucesso!")
    }
  }

  const handleDeleteGrade = (grade: CourseGrade) => {
    setGradeToDelete(grade)
    setDeleteGradeOpen(true)
  }

  const confirmDeleteGrade = () => {
    if (gradeToDelete) {
      setGrades(grades.filter(g => g.id !== gradeToDelete.id))
      toast.success("Grade excluída com sucesso!")
      setGradeToDelete(null)
    }
  }

  // Discipline handlers
  const handleNewDiscipline = (gradeId: string) => {
    setSelectedGradeId(gradeId)
    setSelectedDiscipline(null)
    setDisciplineDialogOpen(true)
  }

  const handleEditDiscipline = (discipline: Discipline, gradeId: string) => {
    setSelectedGradeId(gradeId)
    setSelectedDiscipline(discipline)
    setDisciplineDialogOpen(true)
  }

  const handleSaveDiscipline = (data: { name: string; code: string; workload: number; professor?: string }) => {
    if (!selectedGradeId) return

    if (selectedDiscipline) {
      // Edit existing discipline
      setGrades(grades.map(g => {
        if (g.id === selectedGradeId) {
          return {
            ...g,
            disciplines: g.disciplines.map(d =>
              d.id === selectedDiscipline.id
                ? { ...d, ...data }
                : d
            ),
          }
        }
        return g
      }))
      toast.success("Disciplina atualizada com sucesso!")
    } else {
      // Create new discipline
      const newDiscipline: Discipline = {
        id: `disc_${Date.now()}`,
        name: data.name,
        code: data.code,
        workload: data.workload,
        professor: data.professor,
        status: "active",
      }
      setGrades(grades.map(g => {
        if (g.id === selectedGradeId) {
          return {
            ...g,
            disciplines: [...g.disciplines, newDiscipline],
          }
        }
        return g
      }))
      toast.success("Disciplina adicionada com sucesso!")
    }
  }

  const handleDeleteDiscipline = (discipline: Discipline, gradeId: string) => {
    setDisciplineToDelete({ discipline, gradeId })
    setDeleteDisciplineOpen(true)
  }

  const confirmDeleteDiscipline = () => {
    if (disciplineToDelete) {
      setGrades(grades.map(g => {
        if (g.id === disciplineToDelete.gradeId) {
          return {
            ...g,
            disciplines: g.disciplines.filter(d => d.id !== disciplineToDelete.discipline.id),
          }
        }
        return g
      }))
      toast.success("Disciplina removida com sucesso!")
      setDisciplineToDelete(null)
    }
  }

  // Library link handler
  const handleLinkLibrary = (discipline: Discipline) => {
    setLinkDiscipline(discipline)
    setLinkDialogOpen(true)
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
      {grades.length > 0 ? (
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
                <AccordionTrigger className="px-6 hover:no-underline">
                  <div className="flex items-center gap-4 w-full">
                    <div className="flex items-center gap-3">
                      <StatusIcon className={`h-5 w-5 ${
                        grade.status === "current" ? "text-info" :
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
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon-sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEditGrade(grade); }}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar Grade
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={(e) => { e.stopPropagation(); handleDeleteGrade(grade); }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir Grade
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6">
                  <div className="space-y-3">
                    {grade.disciplines.map((discipline) => (
                      <Card key={discipline.id} className="border-dashed">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <BookOpen className="h-5 w-5 text-muted-foreground" />
                                <div>
                                  <p className="font-medium">{discipline.name}</p>
                                  <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                                    <span className="font-mono">{discipline.code}</span>
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {discipline.workload}h
                                    </span>
                                    {discipline.professor && (
                                      <span className="flex items-center gap-1">
                                        <User className="h-3 w-3" />
                                        {discipline.professor}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              {discipline.linkedTrailId ? (
                                <Badge variant="outline" className="gap-1 bg-success/10 text-success border-success/30">
                                  <Link2 className="h-3 w-3" />
                                  {discipline.linkedTrailName}
                                </Badge>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleLinkLibrary(discipline)}
                                >
                                  <Link2 className="h-4 w-4 mr-2" />
                                  Vincular Trilha
                                </Button>
                              )}

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon-sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleLinkLibrary(discipline)}>
                                    <Link2 className="h-4 w-4 mr-2" />
                                    {discipline.linkedTrailId ? "Alterar Trilha" : "Vincular Trilha"}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleEditDiscipline(discipline, grade.id)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Editar Disciplina
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="text-destructive"
                                    onClick={() => handleDeleteDiscipline(discipline, grade.id)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Remover
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
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
        onSave={handleSaveDiscipline}
      />

      <LibraryLinkDialog
        open={linkDialogOpen}
        onOpenChange={setLinkDialogOpen}
        discipline={linkDiscipline}
        onConfirm={(libraryContentId) => {
          console.log("Linking:", linkDiscipline?.id, "to", libraryContentId)
          setLinkDialogOpen(false)
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
