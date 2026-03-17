import { AdminLayout } from "@/components/layout/AdminLayout"
import { PageHeader } from "@/components/layout/PageHeader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { Progress } from "@/components/ui/progress"
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Mail,
  Ban,
  KeyRound,
  Pencil,
  Upload,
  Users,
  UserCheck,
  UserX,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Unlock,
} from "lucide-react"
import { mockStudents, mockCourses, type Student } from "@/lib/mock-data"
import { useState, useMemo } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { StudentDetailsDialog } from "@/components/admin/StudentDetailsDialog"
import { StudentDialog, type StudentFormData } from "@/components/admin/StudentDialog"
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog"
import { toast } from "sonner"

const statusConfig = {
  active: { label: "Ativo", variant: "success" as const },
  inactive: { label: "Inativo", variant: "secondary" as const },
  blocked: { label: "Bloqueado", variant: "destructive" as const },
}

type SortColumn = "name" | "enrollmentDate" | "progress" | "lastAccess"
type SortDirection = "asc" | "desc"

const StudentsPage = () => {
  const [students, setStudents] = useState<Student[]>(mockStudents)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [courseFilter, setCourseFilter] = useState<string>("all")
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  
  // Sorting state
  const [sortColumn, setSortColumn] = useState<SortColumn>("name")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")
  
  // Pagination state
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Calculate average progress for a student
  const calcAvgProgress = (student: Student) => {
    if (student.enrollments.length === 0) return 0
    return Math.round(
      student.enrollments.reduce((sum, e) => sum + e.progress, 0) / student.enrollments.length
    )
  }

  // Get earliest enrollment date
  const getEarliestEnrollmentDate = (student: Student) => {
    if (student.enrollments.length === 0) return ""
    return student.enrollments.reduce((earliest, e) => 
      e.enrollmentDate < earliest ? e.enrollmentDate : earliest,
      student.enrollments[0].enrollmentDate
    )
  }

  // Filtered students
  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchesSearch =
        student.name.toLowerCase().includes(search.toLowerCase()) ||
        student.email.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = statusFilter === "all" || student.status === statusFilter
      const matchesCourse = courseFilter === "all" || 
        student.enrollments.some(e => e.courseId === courseFilter)
      return matchesSearch && matchesStatus && matchesCourse
    })
  }, [students, search, statusFilter, courseFilter])

  // Sorted students
  const sortedStudents = useMemo(() => {
    const sorted = [...filteredStudents]
    
    sorted.sort((a, b) => {
      let comparison = 0
      
      switch (sortColumn) {
        case "name":
          comparison = a.name.localeCompare(b.name)
          break
        case "enrollmentDate":
          comparison = getEarliestEnrollmentDate(a).localeCompare(getEarliestEnrollmentDate(b))
          break
        case "progress":
          comparison = calcAvgProgress(a) - calcAvgProgress(b)
          break
        case "lastAccess":
          comparison = a.lastAccess.localeCompare(b.lastAccess)
          break
      }
      
      return sortDirection === "asc" ? comparison : -comparison
    })
    
    return sorted
  }, [filteredStudents, sortColumn, sortDirection])

  // Paginated students
  const paginatedStudents = useMemo(() => {
    const start = (page - 1) * pageSize
    return sortedStudents.slice(start, start + pageSize)
  }, [sortedStudents, page, pageSize])

  const totalPages = Math.ceil(sortedStudents.length / pageSize)

  // Reset page when filters change
  const handleFilterChange = (newFilter: string, type: "status" | "course" | "search") => {
    setPage(1)
    if (type === "status") setStatusFilter(newFilter)
    else if (type === "course") setCourseFilter(newFilter)
    else setSearch(newFilter)
  }

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(column)
      setSortDirection("asc")
    }
  }

  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground/50" />
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="ml-2 h-4 w-4 text-primary" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4 text-primary" />
    )
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR })
  }

  const handleViewStudent = (student: Student) => {
    setSelectedStudent(student)
    setDetailsOpen(true)
  }

  const handleSaveStudent = (data: StudentFormData) => {
    const selectedCourses = mockCourses.filter((c) => data.courseIds.includes(c.id))
    
    if (editingStudent) {
      setStudents(students.map((s) => 
        s.id === editingStudent.id 
          ? {
              ...s,
              name: data.name,
              email: data.email,
              status: data.status,
              enrollments: data.courseIds.map(courseId => {
                const existingEnrollment = s.enrollments.find(e => e.courseId === courseId)
                const course = mockCourses.find(c => c.id === courseId)
                return existingEnrollment || {
                  courseId,
                  courseName: course?.name || "",
                  enrollmentDate: new Date().toISOString().split("T")[0],
                  progress: 0,
                  status: "active" as const,
                }
              }),
            }
          : s
      ))
      setEditingStudent(null)
      setDialogOpen(false)
      toast.success("Aluno atualizado com sucesso!")
    } else {
      const newStudent: Student = {
        id: `std_${Date.now()}`,
        name: data.name,
        email: data.email,
        role: "student",
        status: data.status,
        enrollments: selectedCourses.map(course => ({
          courseId: course.id,
          courseName: course.name,
          enrollmentDate: new Date().toISOString().split("T")[0],
          progress: 0,
          status: "active" as const,
        })),
        lastAccess: new Date().toISOString(),
        createdAt: new Date().toISOString().split("T")[0],
      }
      setStudents([newStudent, ...students])
      setDialogOpen(false)
      toast.success("Aluno cadastrado com sucesso!")
    }
  }

  const handleEditStudent = (student: Student, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingStudent(student)
    setDialogOpen(true)
  }

  const handleDeleteClick = (student: Student, e: React.MouseEvent) => {
    e.stopPropagation()
    setDeletingStudent(student)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = () => {
    if (deletingStudent) {
      setStudents(students.filter(s => s.id !== deletingStudent.id))
      toast.success("Aluno excluído com sucesso!")
      setDeletingStudent(null)
      setDeleteDialogOpen(false)
    }
  }

  const handleToggleBlock = (student: Student, e: React.MouseEvent) => {
    e.stopPropagation()
    const newStatus = student.status === "blocked" ? "active" : "blocked"
    setStudents(students.map(s => 
      s.id === student.id ? { ...s, status: newStatus } : s
    ))
    toast.success(
      newStatus === "blocked" 
        ? "Aluno bloqueado com sucesso" 
        : "Aluno desbloqueado com sucesso"
    )
  }

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open)
    if (!open) {
      setEditingStudent(null)
    }
  }

  return (
    <AdminLayout>
      <PageHeader
        title="Alunos"
        description="Gerencie os alunos matriculados na plataforma"
      >
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Importar CSV
          </Button>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Aluno
          </Button>
        </div>
      </PageHeader>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{students.length}</p>
                <p className="text-sm text-muted-foreground">Total de Alunos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-success/10">
                <UserCheck className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {students.filter((s) => s.status === "active").length}
                </p>
                <p className="text-sm text-muted-foreground">Alunos Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-warning/10">
                <UserX className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {students.filter((s) => s.status === "inactive").length}
                </p>
                <p className="text-sm text-muted-foreground">Inativos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-destructive/10">
                <Ban className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {students.filter((s) => s.status === "blocked").length}
                </p>
                <p className="text-sm text-muted-foreground">Bloqueados</p>
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
                placeholder="Buscar por nome ou email..."
                value={search}
                onChange={(e) => handleFilterChange(e.target.value, "search")}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => handleFilterChange(v, "status")}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
                <SelectItem value="blocked">Bloqueado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={courseFilter} onValueChange={(v) => handleFilterChange(v, "course")}>
              <SelectTrigger className="w-full md:w-[220px]">
                <SelectValue placeholder="Curso" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os cursos</SelectItem>
                {mockCourses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.name}
                  </SelectItem>
                ))}
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
                <TableHead 
                  className="cursor-pointer select-none"
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center">
                    Aluno
                    <SortIcon column="name" />
                  </div>
                </TableHead>
                <TableHead>Curso</TableHead>
                <TableHead 
                  className="cursor-pointer select-none"
                  onClick={() => handleSort("enrollmentDate")}
                >
                  <div className="flex items-center">
                    Matrícula
                    <SortIcon column="enrollmentDate" />
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer select-none"
                  onClick={() => handleSort("progress")}
                >
                  <div className="flex items-center">
                    Progresso
                    <SortIcon column="progress" />
                  </div>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead 
                  className="cursor-pointer select-none"
                  onClick={() => handleSort("lastAccess")}
                >
                  <div className="flex items-center">
                    Último Acesso
                    <SortIcon column="lastAccess" />
                  </div>
                </TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedStudents.map((student) => {
                const avgProgress = calcAvgProgress(student)
                return (
                  <TableRow 
                    key={student.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleViewStudent(student)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={student.avatar} alt={student.name} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {student.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{student.name}</p>
                          <p className="text-sm text-muted-foreground">{student.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {student.enrollments.slice(0, 2).map((enrollment) => (
                          <Badge key={enrollment.courseId} variant="outline" className="text-xs">
                            {enrollment.courseName.length > 15 
                              ? enrollment.courseName.substring(0, 15) + "..." 
                              : enrollment.courseName}
                          </Badge>
                        ))}
                        {student.enrollments.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{student.enrollments.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {student.enrollments.length > 0 
                        ? formatDate(getEarliestEnrollmentDate(student))
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 min-w-[120px]">
                        <Progress value={avgProgress} className="h-2 flex-1" />
                        <span className="text-sm text-muted-foreground w-10">
                          {avgProgress}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusConfig[student.status].variant}>
                        {statusConfig[student.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(student.lastAccess)}
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
                          <DropdownMenuItem onClick={() => handleViewStudent(student)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => handleEditStudent(student, e)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Mail className="h-4 w-4 mr-2" />
                            Enviar email
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <KeyRound className="h-4 w-4 mr-2" />
                            Resetar senha
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={(e) => handleToggleBlock(student, e)}>
                            {student.status === "blocked" ? (
                              <>
                                <Unlock className="h-4 w-4 mr-2" />
                                Desbloquear
                              </>
                            ) : (
                              <>
                                <Ban className="h-4 w-4 mr-2" />
                                Bloquear
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={(e) => handleDeleteClick(student, e)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

          {/* Pagination */}
          {sortedStudents.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>
                  Mostrando {(page - 1) * pageSize + 1} a{" "}
                  {Math.min(page * pageSize, sortedStudents.length)} de{" "}
                  {sortedStudents.length} alunos
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Itens por página:</span>
                  <Select 
                    value={pageSize.toString()} 
                    onValueChange={(v) => {
                      setPageSize(Number(v))
                      setPage(1)
                    }}
                  >
                    <SelectTrigger className="w-[70px] h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={() => setPage(1)}
                    disabled={page === 1}
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground px-2">
                    Página {page} de {totalPages || 1}
                  </span>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page >= totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={() => setPage(totalPages)}
                    disabled={page >= totalPages}
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Student Details Dialog */}
      <StudentDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        student={selectedStudent}
      />

      {/* Student Create/Edit Dialog */}
      <StudentDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        student={editingStudent}
        onSave={handleSaveStudent}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Excluir Aluno"
        description={`Tem certeza que deseja excluir o aluno "${deletingStudent?.name}"? Esta ação não pode ser desfeita e todos os dados do aluno serão perdidos.`}
        onConfirm={handleConfirmDelete}
      />
    </AdminLayout>
  )
}

export default StudentsPage
