import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { UserAvatar } from "@/components/profile/UserAvatar"
import { Card, CardContent } from "@/components/ui/card"
import { SkeletonTable } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
  Edit,
  Mail,
  MoreHorizontal,
  Trash2,
} from "lucide-react"
import { RequirePermission } from "@/components/auth/RequirePermission"
import { formatTeamDepartmentLabel } from "@/consts/teamRoles"
import type { TeamMemberAdminRow } from "@/types/team"
import { roleConfig } from "@/components/admin/team/teamPageHelpers"

type TeamTableProps = {
  isLoading: boolean
  members: TeamMemberAdminRow[]
  filteredTotal: number
  hasActiveFilters: boolean
  page: number
  pageSize: number
  totalPages: number
  start: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  onEdit: (member: TeamMemberAdminRow) => void
  onResendInvite: (member: TeamMemberAdminRow) => void
  onDelete: (member: TeamMemberAdminRow) => void
}

export function TeamTable({
  isLoading,
  members,
  filteredTotal,
  hasActiveFilters,
  page,
  pageSize,
  totalPages,
  start,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onResendInvite,
  onDelete,
}: TeamTableProps) {
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
                  <TableHead>Membro</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Desde</TableHead>
                  <TableHead>Última atualização</TableHead>
                  <TableHead className="w-[56px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.length > 0 ? (
                  members.map((member) => {
                    const RoleIcon = roleConfig[member.role].icon
                    return (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <UserAvatar
                              name={member.name}
                              email={member.email}
                              genericLabel="Membro"
                              avatarPath={member.avatarPath}
                              updatedAt={member.avatarUpdatedAt}
                              className="h-9 w-9"
                              fallbackClassName="bg-primary/10 text-primary text-xs"
                            />
                            <div>
                              <p className="font-medium">{member.name}</p>
                              <p className="text-sm text-muted-foreground">{member.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {formatTeamDepartmentLabel(member.department, member.role)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <RoleIcon className="h-4 w-4 text-muted-foreground" />
                            <Badge variant={roleConfig[member.role].badgeVariant}>
                              {roleConfig[member.role].label}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          {format(new Date(member.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          {format(new Date(member.updatedAt), "dd/MM/yyyy HH:mm", {
                            locale: ptBR,
                          })}
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
                              <RequirePermission permission="equipe.editar">
                                <DropdownMenuItem onClick={() => onEdit(member)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                              </RequirePermission>
                              <DropdownMenuItem
                                onClick={() => {
                                  window.location.href = `mailto:${member.email}`
                                }}
                              >
                                <Mail className="h-4 w-4 mr-2" />
                                Enviar e-mail
                              </DropdownMenuItem>
                              <RequirePermission permission="equipe.criar">
                                <DropdownMenuItem onClick={() => onResendInvite(member)}>
                                  <Mail className="h-4 w-4 mr-2" />
                                  Reenviar convite
                                </DropdownMenuItem>
                              </RequirePermission>
                              <RequirePermission permission="equipe.excluir">
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => onDelete(member)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Remover
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
                    <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                      {hasActiveFilters
                        ? "Nenhum membro encontrado para os filtros atuais."
                        : 'Nenhum membro cadastrado ainda. Clique em "Novo Membro" para começar.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {filteredTotal > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Mostrando {start + 1} a {Math.min(start + pageSize, filteredTotal)} de{" "}
                  {filteredTotal} membros
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Itens por página:</span>
                    <Select
                      value={String(pageSize)}
                      onValueChange={(value) => onPageSizeChange(Number(value))}
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
                      onClick={() => onPageChange(Math.max(1, page - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground px-2">
                      Página {page} de {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      onClick={() => onPageChange(Math.min(totalPages, page + 1))}
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
