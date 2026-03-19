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
import { type Course } from "@/lib/mock-data"
import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabaseClient"
import { toast } from "sonner"
import { CourseDialog } from "@/components/admin/CourseDialog"

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

type CourseDbRow = {
  id: string
  name: string
  description: string | null
  status: "draft" | "active" | "archived" | string
  created_at: string
}

const CoursesPage = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [courses, setCourses] = useState<Course[]>([])
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")

  const fetchCourses = async () => {
    const { data, error } = await supabase
      .from("lxp_courses")
      .select("id,name,description,status,created_at")
      .order("created_at", { ascending: false })

    if (error) throw error

    // Total de alunos por curso (Semana 1: baseado em lxp_enrollments)
    const { data: enr, error: enrError } = await supabase
      .from("lxp_enrollments")
      .select("course_id")

    if (enrError) throw enrError

    const counts = new Map<string, number>()
      ; (enr ?? []).forEach((e: { course_id: string }) => {
        counts.set(e.course_id, (counts.get(e.course_id) ?? 0) + 1)
      })

    const mapped: Course[] = (data ?? []).map((c) => {
      const row = c as CourseDbRow
      return {
        id: row.id,
        name: row.name,
        description: row.description ?? "",
        // Ainda não temos colunas no Supabase para category/periods/externalLibraryId.
        // Mantemos valores default para preservar o visual; persistência vem nas próximas fases.
        category: "graduation",
        status: (row.status as Course["status"]) ?? "draft",
        periods: 8,
        totalStudents: counts.get(row.id) ?? 0,
        createdAt: row.created_at,
        externalLibraryId: undefined,
      }
    })

    setCourses(mapped)
  }

  useEffect(() => {
    let isMounted = true

      ; (async () => {
        try {
          setLoading(true)
          await fetchCourses()
        } catch (e) {
          toast.error("Erro ao carregar cursos")
        } finally {
          if (isMounted) setLoading(false)
        }
      })()

    return () => {
      isMounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filteredCourses = courses.filter((course) => {
    const matchesSearch = course.name.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "all" || course.status === statusFilter
    const matchesCategory = categoryFilter === "all" || course.category === categoryFilter
    return matchesSearch && matchesStatus && matchesCategory
  })

  const handleViewCourse = (courseId: string) => {
    navigate(`/admin/cursos/${courseId}`)
  }

  const handleOpenNew = () => {
    setEditingCourse(null)
    setEditDialogOpen(true)
  }

  const handleOpenEdit = (course: Course) => {
    setEditingCourse(course)
    setEditDialogOpen(true)
  }

  const handleSaveCourse = async (updated: Omit<Course, "id" | "totalStudents" | "createdAt">) => {
    setSubmitting(true)
    try {
      if (editingCourse) {
        // Persistência gradual: por enquanto salvamos apenas campos existentes no schema da Semana 1.
        const { error } = await supabase
          .from("lxp_courses")
          .update({
            name: updated.name,
            description: updated.description,
            status: updated.status,
          })
          .eq("id", editingCourse.id)

        if (error) throw error
        toast.success("Curso atualizado com sucesso")
      } else {
        const { error } = await supabase.from("lxp_courses").insert({
          name: updated.name,
          description: updated.description,
          status: updated.status,
        })

        if (error) throw error
        toast.success("Curso criado com sucesso")
      }

      await fetchCourses()
    } catch (e) {
      toast.error("Erro ao salvar curso")
    } finally {
      setSubmitting(false)
    }
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

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{loading ? "—" : stats.totalCourses}</p>
                <p className="text-sm text-muted-foreground">Total de Cursos</p>
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
                <p className="text-2xl font-bold">
                  {loading ? "—" : stats.activeCourses}
                </p>
                <p className="text-sm text-muted-foreground">Cursos Ativos</p>
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
                <p className="text-2xl font-bold">
                  {loading ? "—" : stats.totalStudents.toLocaleString("pt-BR")}
                </p>
                <p className="text-sm text-muted-foreground">Total de Alunos</p>
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
                <p className="text-2xl font-bold">
                  {loading ? "—" : stats.linkedToLibrary}
                </p>
                <p className="text-sm text-muted-foreground">Vinculados à Biblioteca</p>
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
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="p-6 text-sm text-muted-foreground">
                    Carregando cursos...
                  </TableCell>
                </TableRow>
              ) : filteredCourses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="p-6 text-sm text-muted-foreground">
                    Nenhum curso encontrado.
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
                          <DropdownMenuItem>
                            <Link2 className="h-4 w-4 mr-2" />
                            Vincular biblioteca
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Calendar className="h-4 w-4 mr-2" />
                            Gerenciar períodos
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
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
