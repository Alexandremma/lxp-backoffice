import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { UserAvatar } from "@/components/profile/UserAvatar"
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
import { SkeletonTable } from "@/components/ui/skeleton"
import { ProgressPercentBar } from "@/components/admin/ProgressPercentBar"
import { RequirePermission } from "@/components/auth/RequirePermission"
import {
  MoreHorizontal,
  Eye,
  Mail,
  Ban,
  KeyRound,
  Pencil,
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
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { StudentAdmin as Student } from "@/types/studentAdmin"
import {
  calcAvgProgress,
  getEarliestEnrollmentDate,
  statusConfig,
  type SortColumn,
  type SortDirection,
} from "@/components/admin/students/studentsPageHelpers"

type StudentsTableProps = {
  isLoading: boolean
  students: Student[]
  sortedCount: number
  hasActiveFilters: boolean
  sortColumn: SortColumn
  sortDirection: SortDirection
  page: number
  safePage: number
  pageSize: number
  totalPages: number
  onSort: (column: SortColumn) => void
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  onViewStudent: (student: Student) => void
  onEditStudent: (student: Student, e: React.MouseEvent) => void
  onResetPassword: (student: Student, e: React.MouseEvent) => void
  onSendEmail: (student: Student, e: React.MouseEvent) => void
  onToggleBlock: (student: Student, e: React.MouseEvent) => void
  onDeleteClick: (student: Student, e: React.MouseEvent) => void
}

function SortIcon({
  column,
  sortColumn,
  sortDirection,
}: {
  column: SortColumn
  sortColumn: SortColumn
  sortDirection: SortDirection
}) {
  if (sortColumn !== column) {
    return <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground/50" />
  }
  return sortDirection === "asc" ? (
    <ArrowUp className="ml-2 h-4 w-4 text-primary" />
  ) : (
    <ArrowDown className="ml-2 h-4 w-4 text-primary" />
  )
}

function formatDate(dateString: string) {
  return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR })
}

export function StudentsTable({
  isLoading,
  students,
  sortedCount,
  hasActiveFilters,
  sortColumn,
  sortDirection,
  page,
  safePage,
  pageSize,
  totalPages,
  onSort,
  onPageChange,
  onPageSizeChange,
  onViewStudent,
  onEditStudent,
  onResetPassword,
  onSendEmail,
  onToggleBlock,
  onDeleteClick,
}: StudentsTableProps) {
  return (
    <Card>
      <CardContent className="p-0">
        {isLoading ? (
          <SkeletonTable rows={8} columns={6} />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => onSort("name")}
                  >
                    <div className="flex items-center">
                      Aluno
                      <SortIcon column="name" sortColumn={sortColumn} sortDirection={sortDirection} />
                    </div>
                  </TableHead>
                  <TableHead>Curso</TableHead>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => onSort("enrollmentDate")}
                  >
                    <div className="flex items-center">
                      Matrícula
                      <SortIcon
                        column="enrollmentDate"
                        sortColumn={sortColumn}
                        sortDirection={sortDirection}
                      />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => onSort("progress")}
                  >
                    <div className="flex items-center">
                      Progresso
                      <SortIcon
                        column="progress"
                        sortColumn={sortColumn}
                        sortDirection={sortDirection}
                      />
                    </div>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => onSort("lastAccess")}
                  >
                    <div className="flex items-center">
                      Último Acesso
                      <SortIcon
                        column="lastAccess"
                        sortColumn={sortColumn}
                        sortDirection={sortDirection}
                      />
                    </div>
                  </TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.length > 0 ? (
                  students.map((student) => {
                    const avgProgress = calcAvgProgress(student)
                    return (
                      <TableRow
                        key={student.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => onViewStudent(student)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <UserAvatar
                              name={student.name}
                              email={student.email}
                              avatarPath={student.avatarPath}
                              updatedAt={student.avatarUpdatedAt}
                              className="h-9 w-9"
                              fallbackClassName="bg-primary/10 text-primary text-xs"
                            />
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
                          <ProgressPercentBar value={avgProgress} />
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
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Ações</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => onViewStudent(student)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Ver detalhes
                              </DropdownMenuItem>
                              <RequirePermission permission="alunos.editar">
                                <DropdownMenuItem onClick={(e) => onEditStudent(student, e)}>
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Editar dados
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => void onResetPassword(student, e)}>
                                  <KeyRound className="h-4 w-4 mr-2" />
                                  Resetar senha
                                </DropdownMenuItem>
                              </RequirePermission>
                              <DropdownMenuItem onClick={(e) => onSendEmail(student, e)}>
                                <Mail className="h-4 w-4 mr-2" />
                                Enviar e-mail
                              </DropdownMenuItem>
                              <RequirePermission permission="alunos.excluir">
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={(e) => void onToggleBlock(student, e)}>
                                  {student.status === "blocked" ? (
                                    <>
                                      <Unlock className="h-4 w-4 mr-2" />
                                      Desbloquear acesso global
                                    </>
                                  ) : (
                                    <>
                                      <Ban className="h-4 w-4 mr-2" />
                                      Bloquear acesso global
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={(e) => onDeleteClick(student, e)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Excluir
                                </DropdownMenuItem>
                              </RequirePermission>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="p-6 text-sm text-muted-foreground">
                      {hasActiveFilters
                        ? "Nenhum aluno encontrado com os filtros atuais."
                        : "Nenhum aluno cadastrado ainda. Clique em \"Novo Aluno\" para começar."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {sortedCount > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>
                    Mostrando {(page - 1) * pageSize + 1} a{" "}
                    {Math.min(page * pageSize, sortedCount)} de {sortedCount} alunos
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Itens por página:</span>
                    <Select
                      value={pageSize.toString()}
                      onValueChange={(v) => onPageSizeChange(Number(v))}
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
                      onClick={() => onPageChange(1)}
                      disabled={page === 1}
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      onClick={() => onPageChange(page - 1)}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground px-2">
                      Página {safePage} de {totalPages || 1}
                    </span>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      onClick={() => onPageChange(page + 1)}
                      disabled={page >= totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      onClick={() => onPageChange(totalPages)}
                      disabled={page >= totalPages}
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
