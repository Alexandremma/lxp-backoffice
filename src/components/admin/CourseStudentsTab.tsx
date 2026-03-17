import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
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
import {
  UserPlus,
  Search,
  MoreHorizontal,
  Eye,
  Mail,
  Ban,
  Download,
  Users,
  TrendingUp,
  Clock,
} from "lucide-react"
import { type Student } from "@/lib/mock-data"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { toast } from "@/hooks/use-toast"
import { EnrollStudentDialog } from "./EnrollStudentDialog"

interface CourseStudentsTabProps {
  courseId: string
  courseName: string
  students: Student[]
  allStudents: Student[]
}

const statusConfig = {
  active: { label: "Ativo", variant: "success" as const },
  inactive: { label: "Inativo", variant: "secondary" as const },
  blocked: { label: "Bloqueado", variant: "destructive" as const },
}

export function CourseStudentsTab({ courseId, courseName, students, allStudents }: CourseStudentsTabProps) {
  const [enrolledStudents, setEnrolledStudents] = useState<Student[]>(students)
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const filteredStudents = enrolledStudents.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(search.toLowerCase()) ||
      student.email.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "all" || student.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const avgProgress = enrolledStudents.length > 0
    ? Math.round(enrolledStudents.reduce((sum, s) => {
        const enrollment = s.enrollments.find(e => e.courseId === courseId)
        return sum + (enrollment?.progress || 0)
      }, 0) / enrolledStudents.length)
    : 0

  const activeCount = enrolledStudents.filter((s) => s.status === "active").length

  const handleEnrollStudents = (studentIds: string[]) => {
    const newStudents = allStudents
      .filter((s) => studentIds.includes(s.id))
      .map((student) => ({
        ...student,
        enrollments: [
          ...student.enrollments,
          {
            courseId,
            courseName,
            enrollmentDate: new Date().toISOString(),
            progress: 0,
            status: "active" as const,
          },
        ],
      }))

    setEnrolledStudents((prev) => [...prev, ...newStudents])
    toast({
      title: "Alunos matriculados",
      description: `${studentIds.length} aluno(s) matriculado(s) com sucesso.`,
    })
  }

  const enrolledStudentIds = enrolledStudents.map((s) => s.id)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Alunos Matriculados</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie os alunos matriculados neste curso
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={() => setEnrollDialogOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Matricular Aluno
          </Button>
        </div>
      </div>

      {/* Enroll Dialog */}
      <EnrollStudentDialog
        open={enrollDialogOpen}
        onOpenChange={setEnrollDialogOpen}
        courseId={courseId}
        courseName={courseName}
        enrolledStudentIds={enrolledStudentIds}
        allStudents={allStudents}
        onEnroll={handleEnrollStudents}
      />
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{enrolledStudents.length}</p>
                <p className="text-sm text-muted-foreground">Total de Alunos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-success/10">
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{avgProgress}%</p>
                <p className="text-sm text-muted-foreground">Progresso Médio</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-info/10">
                <Clock className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeCount}</p>
                <p className="text-sm text-muted-foreground">Ativos (7 dias)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar aluno..."
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
                <SelectItem value="inactive">Inativo</SelectItem>
                <SelectItem value="blocked">Bloqueado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card>
        <CardContent className="p-0">
          {filteredStudents.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progresso</TableHead>
                  <TableHead>Matrícula</TableHead>
                  <TableHead>Último Acesso</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={student.avatar} />
                          <AvatarFallback>
                            {student.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{student.name}</p>
                          <p className="text-sm text-muted-foreground">{student.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusConfig[student.status].variant}>
                        {statusConfig[student.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const enrollment = student.enrollments.find(e => e.courseId === courseId)
                        const progress = enrollment?.progress || 0
                        return (
                          <div className="flex items-center gap-3 min-w-[120px]">
                            <Progress value={progress} className="h-2 flex-1" />
                            <span className="text-sm font-medium w-10">{progress}%</span>
                          </div>
                        )
                      })()}
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const enrollment = student.enrollments.find(e => e.courseId === courseId)
                        return enrollment ? new Date(enrollment.enrollmentDate).toLocaleDateString("pt-BR") : "-"
                      })()}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(student.lastAccess), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Perfil
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Mail className="h-4 w-4 mr-2" />
                            Enviar Email
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            <Ban className="h-4 w-4 mr-2" />
                            Bloquear
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="font-medium mb-1">Nenhum aluno encontrado</p>
              <p className="text-sm text-muted-foreground mb-4">
                {search || statusFilter !== "all"
                  ? "Tente ajustar os filtros de busca"
                  : "Ainda não há alunos matriculados neste curso"}
              </p>
              {!search && statusFilter === "all" && (
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Matricular Primeiro Aluno
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
