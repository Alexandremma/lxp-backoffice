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
import { mockCourses, type Course } from "@/lib/mock-data"
import { useState } from "react"
import { useNavigate } from "react-router-dom"

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

const CoursesPage = () => {
  const navigate = useNavigate()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")

  const filteredCourses = mockCourses.filter((course) => {
    const matchesSearch = course.name.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "all" || course.status === statusFilter
    const matchesCategory = categoryFilter === "all" || course.category === categoryFilter
    return matchesSearch && matchesStatus && matchesCategory
  })

  const handleViewCourse = (courseId: string) => {
    navigate(`/admin/cursos/${courseId}`)
  }

  return (
    <AdminLayout>
      <PageHeader
        title="Cursos"
        description="Gerencie os cursos vinculados à biblioteca de conteúdo"
      >
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Novo Curso
        </Button>
      </PageHeader>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockCourses.length}</p>
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
                  {mockCourses.filter((c) => c.status === "active").length}
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
                  {mockCourses.reduce((sum, c) => sum + c.totalStudents, 0).toLocaleString("pt-BR")}
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
                  {mockCourses.filter((c) => c.externalLibraryId).length}
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
              {filteredCourses.map((course) => (
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
                        <DropdownMenuItem>
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
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AdminLayout>
  )
}

export default CoursesPage
