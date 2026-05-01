import { AdminLayout } from "@/components/layout/AdminLayout"
import { PageHeader } from "@/components/layout/PageHeader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Link2,
  BookOpen,
  Users,
  Calendar,
} from "lucide-react"
import type { CourseAdmin, CourseAdminInput } from "@/types/courseAdmin"
import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabaseClient"
import { toast } from "sonner"
import { CourseDialog } from "@/components/admin/CourseDialog"
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog"
import { useGetCourses } from "@/hooks/queries/useGetCourses"
import { useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/consts/queryKeys"
import { useUpsertCourseAdmin } from "@/hooks/mutations/useUpsertCourseAdmin"
import { getAdminErrorMessage } from "@/lib/adminErrorMessage"

const statusConfig = {
  active: { label: "Ativo", variant: "success" as const },
  draft: { label: "Rascunho", variant: "warning" as const },
  archived: { label: "Arquivado", variant: "secondary" as const },
}

const categoryConfig = {
  graduation: { label: "Graduação", variant: "default" as const },
  postgraduate: { label: "Pós-Graduação", variant: "info" as const },
  extension: { label: "Extensão", variant: "secondary" as const },
}

const COURSE_TABS = {
  grades: "grades",
  content: "content",
} as const

const CoursesPage = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: coursesData, isLoading, error } = useGetCourses()
  const upsertCourse = useUpsertCourseAdmin()
  const courses = useMemo(() => coursesData ?? [], [coursesData])
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<CourseAdmin | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingCourse, setDeletingCourse] = useState<CourseAdmin | null>(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")

  useEffect(() => {
    if (error) toast.error(getAdminErrorMessage("courses-list", error))
  }, [error])

  const filteredCourses = courses.filter((course) => {
    const matchesSearch = course.name.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "all" || course.status === statusFilter
    const matchesCategory = categoryFilter === "all" || course.category === categoryFilter
    return matchesSearch && matchesStatus && matchesCategory
  })
  const hasActiveFilters = search.trim().length > 0 || statusFilter !== "all" || categoryFilter !== "all"

  const handleViewCourse = (courseId: string) => {
    navigate(`/admin/cursos/${courseId}`)
  }

  const handleOpenCourseTab = (courseId: string, tab: (typeof COURSE_TABS)[keyof typeof COURSE_TABS]) => {
    localStorage.setItem(`course-details-active-tab:${courseId}`, tab)
    navigate(`/admin/cursos/${courseId}`)
  }

  const handleOpenNew = () => {
    setEditingCourse(null)
    setEditDialogOpen(true)
  }

  const handleOpenEdit = (course: CourseAdmin) => {
    setEditingCourse(course)
    setEditDialogOpen(true)
  }

  const handleSaveCourse = async (updated: CourseAdminInput) => {
    setSubmitting(true)
    try {
      if (editingCourse) {
        await upsertCourse.mutateAsync({
          mode: "update",
          id: editingCourse.id,
          name: updated.name,
          description: updated.description,
          category: updated.category,
          status: updated.status,
          externalLibraryId: updated.externalLibraryId,
        })
        toast.success("Curso atualizado com sucesso")
      } else {
        await upsertCourse.mutateAsync({
          mode: "create",
          name: updated.name,
          description: updated.description,
          category: updated.category,
          status: updated.status,
          periods: updated.periods,
          externalLibraryId: updated.externalLibraryId,
        })
        toast.success("Curso criado com sucesso")
      }
    } catch (e) {
      toast.error(getAdminErrorMessage("courses-save", e))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteCourse = async (course: CourseAdmin) => {
    setDeletingCourse(course)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!deletingCourse) return
    setSubmitting(true)
    try {
      const { error } = await supabase.from("lxp_courses").delete().eq("id", deletingCourse.id)
      if (error) throw error

      toast.success("Curso excluído com sucesso")
      await queryClient.invalidateQueries({ queryKey: queryKeys.courses.list })
      setDeleteDialogOpen(false)
      setDeletingCourse(null)
    } catch (e) {
      toast.error(getAdminErrorMessage("courses-delete", e))
    } finally {
      setSubmitting(false)
    }
  }

  const clearFilters = () => {
    setSearch("")
    setStatusFilter("all")
    setCategoryFilter("all")
  }

  const stats = useMemo(() => {
    const totalCourses = courses.length
    const activeCourses = courses.filter((c) => c.status === "active").length
    const totalStudents = courses.reduce((sum, c) => sum + (c.totalStudents ?? 0), 0)
    const linkedToLibrary = courses.filter((c) => !!c.externalLibraryId).length
    return { totalCourses, activeCourses, totalStudents, linkedToLibrary }
  }, [courses])

  return (
    <AdminLayout>
      <PageHeader
        title="Cursos"
        description="Gerencie os cursos vinculados à biblioteca de conteúdo"
      >
        <Button onClick={handleOpenNew} disabled={submitting}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Curso
        </Button>
      </PageHeader>

      <CourseDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        course={editingCourse}
        onSave={handleSaveCourse}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open)
          if (!open) setDeletingCourse(null)
        }}
        title="Excluir Curso"
        description={`Tem certeza que deseja excluir o curso "${deletingCourse?.name ?? ""}"? Esta ação não pode ser desfeita.`}
        onConfirm={handleConfirmDelete}
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-7 w-14" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ) : (
                  <>
                    <p className="text-2xl font-bold">{stats.totalCourses}</p>
                    <p className="text-sm text-muted-foreground">Total de Cursos</p>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-success/10">
                <BookOpen className="h-5 w-5 text-success" />
              </div>
              <div>
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-7 w-14" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ) : (
                  <>
                    <p className="text-2xl font-bold">{stats.activeCourses}</p>
                    <p className="text-sm text-muted-foreground">Cursos Ativos</p>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-info/10">
                <Users className="h-5 w-5 text-info" />
              </div>
              <div>
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-7 w-20" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ) : (
                  <>
                    <p className="text-2xl font-bold">{stats.totalStudents.toLocaleString("pt-BR")}</p>
                    <p className="text-sm text-muted-foreground">Total de Alunos</p>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-secondary/10">
                <Link2 className="h-5 w-5 text-secondary" />
              </div>
              <div>
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-7 w-14" />
                    <Skeleton className="h-4 w-36" />
                  </div>
                ) : (
                  <>
                    <p className="text-2xl font-bold">{stats.linkedToLibrary}</p>
                    <p className="text-sm text-muted-foreground">Vinculados à Biblioteca</p>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar cursos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="draft">Rascunho</SelectItem>
                <SelectItem value="archived">Arquivado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                <SelectItem value="graduation">Graduação</SelectItem>
                <SelectItem value="postgraduate">Pós-Graduação</SelectItem>
                <SelectItem value="extension">Extensão</SelectItem>
              </SelectContent>
            </Select>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters}>
                Limpar filtros
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Curso</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Períodos</TableHead>
                <TableHead className="text-center">Alunos</TableHead>
                <TableHead>Biblioteca</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <TableRow key={`skeleton-${idx}`}>
                    <TableCell>
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-72" />
                      </div>
                    </TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell className="text-center"><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
                    <TableCell className="text-center"><Skeleton className="h-4 w-10 mx-auto" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                  </TableRow>
                ))
              ) : filteredCourses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="p-6 text-sm text-muted-foreground">
                    {hasActiveFilters
                      ? "Nenhum curso encontrado com os filtros atuais."
                      : "Nenhum curso cadastrado ainda. Clique em \"Novo Curso\" para começar."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredCourses.map((course) => (
                  <TableRow
                    key={course.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleViewCourse(course.id)}
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium">{course.name}</p>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {course.description}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={categoryConfig[course.category].variant}>
                        {categoryConfig[course.category].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusConfig[course.status].variant}>
                        {statusConfig[course.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">{course.periods}</TableCell>
                    <TableCell className="text-center">
                      {course.totalStudents.toLocaleString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      {course.externalLibraryId ? (
                        <Badge variant="outline" className="gap-1">
                          <Link2 className="h-3 w-3" />
                          Vinculado
                        </Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">Não vinculado</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm" onClick={(e) => e.stopPropagation()}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleViewCourse(course.id)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              handleOpenEdit(course)
                            }}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              handleOpenCourseTab(course.id, COURSE_TABS.content)
                            }}
                          >
                            <Link2 className="h-4 w-4 mr-2" />
                            Vincular disciplina externa
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              handleOpenCourseTab(course.id, COURSE_TABS.grades)
                            }}
                          >
                            <Calendar className="h-4 w-4 mr-2" />
                            Gerenciar períodos
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteCourse(course)
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AdminLayout>
  )
}

export default CoursesPage
