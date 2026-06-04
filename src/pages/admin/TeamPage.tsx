import { useMemo, useState } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { AdminLayout } from "@/components/layout/AdminLayout"
import { PageHeader } from "@/components/layout/PageHeader"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
    AlertCircle,
    ChevronsLeft,
    ChevronsRight,
    ChevronLeft,
    ChevronRight,
    Edit,
    GraduationCap,
    Loader2,
    Mail,
    MoreHorizontal,
    Plus,
    Search,
    Shield,
    Trash2,
    UserCog,
} from "lucide-react"
import { RequirePermission } from "@/components/auth/RequirePermission"
import { TEAM_ROLE_LABELS, formatTeamDepartmentLabel, resolveTeamDepartment, type TeamRole } from "@/consts/teamRoles"
import { usePermission } from "@/hooks/usePermission"
import { toast } from "sonner"
import { useGetTeamMembersAdmin } from "@/hooks/queries/useGetTeamMembersAdmin"
import type { TeamMemberAdminRow } from "@/services/teamService"
import {
    TeamMemberDialog,
    type TeamMemberDialogMember,
    type TeamMemberFormData,
} from "@/components/admin/TeamMemberDialog"
import { useUpsertTeamMemberAdmin } from "@/hooks/mutations/useUpsertTeamMemberAdmin"
import { useDeleteTeamMemberAdmin } from "@/hooks/mutations/useDeleteTeamMemberAdmin"
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog"
import { PlanLimitBanner } from "@/components/admin/settings/PlanLimitBanner"
import { getAdminErrorMessage } from "@/lib/adminErrorMessage"
import { isPlanLimitError } from "@/lib/planLimits"
import { usePlanLimits } from "@/hooks/queries/usePlanLimits"
import { useResendTeamInviteAdmin } from "@/hooks/mutations/useResendTeamInviteAdmin"
import { backofficeSetPasswordUrl } from "@/lib/authRedirectUrls"

const roleConfig: Record<
    TeamRole,
    {
        label: string
        icon: React.ElementType
        badgeVariant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info"
    }
> = {
    admin: { label: TEAM_ROLE_LABELS.admin, icon: Shield, badgeVariant: "destructive" },
    coordinator: { label: TEAM_ROLE_LABELS.coordinator, icon: UserCog, badgeVariant: "info" },
    professor: { label: TEAM_ROLE_LABELS.professor, icon: GraduationCap, badgeVariant: "default" },
}

function toTeamMemberDialogModel(row: TeamMemberAdminRow): TeamMemberDialogMember {
    return {
        id: row.id,
        name: row.name,
        email: row.email,
        role: row.role,
        department: row.department,
    }
}

const TeamPage = () => {
    const { data, isLoading, isError, error, refetch } = useGetTeamMembersAdmin()
    const { usage: planUsage } = usePlanLimits()
    const teamAtLimit = planUsage?.teamMembers.atLimit ?? false
    const upsertMember = useUpsertTeamMemberAdmin()
    const deleteMember = useDeleteTeamMemberAdmin()
    const resendInvite = useResendTeamInviteAdmin()
    const [search, setSearch] = useState("")
    const [roleFilter, setRoleFilter] = useState<"all" | TeamRole>("all")
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingMember, setEditingMember] = useState<TeamMemberAdminRow | null>(null)
    const [deletingMember, setDeletingMember] = useState<TeamMemberAdminRow | null>(null)
    const [deleteOpen, setDeleteOpen] = useState(false)

    const members = data ?? []

    const filteredMembers = useMemo(() => {
        const q = search.toLowerCase()
        return members.filter((member) => {
            const deptLabel = formatTeamDepartmentLabel(member.department, member.role).toLowerCase()
            const matchesSearch =
                member.name.toLowerCase().includes(q) ||
                member.email.toLowerCase().includes(q) ||
                deptLabel.includes(q)
            const matchesRole = roleFilter === "all" || member.role === roleFilter
            return matchesSearch && matchesRole
        })
    }, [members, search, roleFilter])
    const hasActiveFilters = search.trim().length > 0 || roleFilter !== "all"

    const countByRole = useMemo(() => {
        const counts: Record<TeamRole, number> = {
            admin: 0,
            coordinator: 0,
            professor: 0,
        }
        for (const member of members) {
            const key = member.role in counts ? member.role : "professor"
            counts[key] += 1
        }
        return counts
    }, [members])

    const totalPages = Math.max(1, Math.ceil(filteredMembers.length / pageSize))
    const safePage = Math.max(1, Math.min(page, totalPages))
    const start = (safePage - 1) * pageSize
    const paginatedMembers = filteredMembers.slice(start, start + pageSize)

    const handleOpenCreate = () => {
        setEditingMember(null)
        setDialogOpen(true)
    }

    const handleOpenEdit = (member: TeamMemberAdminRow) => {
        setEditingMember(member)
        setDialogOpen(true)
    }

    const handleSaveDialog = async (values: TeamMemberFormData) => {
        const departmentNorm =
            values.department ?? resolveTeamDepartment(null, values.role as TeamRole) ?? null
        try {
            if (editingMember) {
                await upsertMember.mutateAsync({
                    mode: "update",
                    id: editingMember.id,
                    name: values.name.trim(),
                    email: values.email.trim().toLowerCase(),
                    role: values.role as TeamRole,
                    department: departmentNorm,
                })
                toast.success("Membro atualizado com sucesso.")
            } else {
                await upsertMember.mutateAsync({
                    mode: "create",
                    name: values.name.trim(),
                    email: values.email.trim().toLowerCase(),
                    role: values.role as TeamRole,
                    department: departmentNorm,
                    redirectTo: backofficeSetPasswordUrl,
                })
                toast.success("Membro adicionado e convite enviado por e-mail.")
            }
            setDialogOpen(false)
            setEditingMember(null)
        } catch (err: unknown) {
            if (isPlanLimitError(err)) {
                toast.error(err.message)
                return
            }
            toast.error(getAdminErrorMessage("team-save", err))
        }
    }

    const handleDeleteMember = (member: TeamMemberAdminRow) => {
        setDeletingMember(member)
        setDeleteOpen(true)
    }

    const handleResendInvite = async (member: TeamMemberAdminRow) => {
        try {
            await resendInvite.mutateAsync({
                email: member.email,
                redirectTo: backofficeSetPasswordUrl,
            })
            toast.success("Convite reenviado por e-mail.")
        } catch (err: unknown) {
            toast.error(getAdminErrorMessage("team-save", err))
        }
    }

    const handleConfirmDelete = async () => {
        if (!deletingMember) return
        try {
            await deleteMember.mutateAsync(deletingMember.id)
            toast.success("Membro removido da equipe.")
            setDeleteOpen(false)
            setDeletingMember(null)
        } catch (err: unknown) {
            toast.error(getAdminErrorMessage("team-delete", err))
        }
    }

    return (
        <AdminLayout>
            <PageHeader
                title="Equipe"
                description="Visualize e mantenha a equipe administrativa do Backoffice."
            >
                <RequirePermission permission="equipe.criar">
                    <Button onClick={handleOpenCreate} disabled={teamAtLimit} title={teamAtLimit ? "Limite de membros da equipe atingido" : undefined}>
                        <Plus className="h-4 w-4 mr-2" />
                        Novo Membro
                    </Button>
                </RequirePermission>
            </PageHeader>

            <PlanLimitBanner resource="teamMembers" status={planUsage?.teamMembers} />

            {isError && (
                <Alert variant="destructive" className="mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Não foi possível carregar a equipe</AlertTitle>
                    <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <span>{getAdminErrorMessage("team-list", error)}</span>
                        <Button variant="outline" size="sm" onClick={() => void refetch()}>
                            Tentar novamente
                        </Button>
                    </AlertDescription>
                </Alert>
            )}

            {isLoading && (
                <Card className="mb-6">
                    <CardContent className="flex items-center justify-center gap-3 py-10 text-muted-foreground">
                        <Loader2 className="h-6 w-6 animate-spin" />
                        Carregando equipe do Supabase...
                    </CardContent>
                </Card>
            )}

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-3 mb-6">
                {(Object.keys(roleConfig) as TeamRole[]).map((role) => {
                    const Icon = roleConfig[role].icon
                    return (
                        <Card key={role}>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="shrink-0 p-2.5 rounded-lg bg-muted">
                                        <Icon className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xl font-bold leading-none">{countByRole[role]}</p>
                                        <p className="text-xs text-muted-foreground truncate mt-1">
                                            {roleConfig[role].label}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            <Card className="mb-6">
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por nome ou e-mail..."
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value)
                                    setPage(1)
                                }}
                                className="pl-10"
                            />
                        </div>
                        <Select
                            value={roleFilter}
                            onValueChange={(value) => {
                                setRoleFilter(value as "all" | TeamRole)
                                setPage(1)
                            }}
                        >
                            <SelectTrigger className="w-full md:w-[220px]">
                                <SelectValue placeholder="Função" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas as funções</SelectItem>
                                {(Object.keys(roleConfig) as TeamRole[]).map((role) => (
                                    <SelectItem key={role} value={role}>
                                        {roleConfig[role].label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {hasActiveFilters && (
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setSearch("")
                                    setRoleFilter("all")
                                    setPage(1)
                                }}
                            >
                                Limpar filtros
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-0">
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
                            {paginatedMembers.length > 0 ? (
                                paginatedMembers.map((member) => {
                                    const RoleIcon = roleConfig[member.role].icon
                                    return (
                                        <TableRow key={member.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                                                        {member.name
                                                            .split(" ")
                                                            .map((part) => part[0])
                                                            .join("")
                                                            .slice(0, 2)}
                                                    </div>
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
                                                            <DropdownMenuItem onClick={() => handleOpenEdit(member)}>
                                                                <Edit className="h-4 w-4 mr-2" />
                                                                Editar
                                                            </DropdownMenuItem>
                                                        </RequirePermission>
                                                        <DropdownMenuItem onClick={() => (window.location.href = `mailto:${member.email}`)}>
                                                            <Mail className="h-4 w-4 mr-2" />
                                                            Enviar e-mail
                                                        </DropdownMenuItem>
                                                        <RequirePermission permission="equipe.criar">
                                                            <DropdownMenuItem onClick={() => void handleResendInvite(member)}>
                                                                <Mail className="h-4 w-4 mr-2" />
                                                                Reenviar convite
                                                            </DropdownMenuItem>
                                                        </RequirePermission>
                                                        <RequirePermission permission="equipe.excluir">
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                className="text-destructive"
                                                                onClick={() => handleDeleteMember(member)}
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

                    {filteredMembers.length > 0 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t">
                            <div className="text-sm text-muted-foreground">
                                Mostrando {start + 1} a {Math.min(start + pageSize, filteredMembers.length)} de{" "}
                                {filteredMembers.length} membros
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">Itens por página:</span>
                                    <Select
                                        value={String(pageSize)}
                                        onValueChange={(value) => {
                                            setPageSize(Number(value))
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
                                    <Button variant="outline" size="icon-sm" onClick={() => setPage(1)} disabled={safePage === 1}>
                                        <ChevronsLeft className="h-4 w-4" />
                                    </Button>
                                    <Button variant="outline" size="icon-sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage === 1}>
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <span className="text-sm text-muted-foreground px-2">
                                        Página {safePage} de {totalPages}
                                    </span>
                                    <Button variant="outline" size="icon-sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages}>
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                    <Button variant="outline" size="icon-sm" onClick={() => setPage(totalPages)} disabled={safePage >= totalPages}>
                                        <ChevronsRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <TeamMemberDialog
                open={dialogOpen}
                onOpenChange={(open) => {
                    setDialogOpen(open)
                    if (!open) setEditingMember(null)
                }}
                member={editingMember ? toTeamMemberDialogModel(editingMember) : null}
                onSave={handleSaveDialog}
                isSubmitting={upsertMember.isPending}
            />

            <DeleteConfirmDialog
                open={deleteOpen}
                onOpenChange={(open) => {
                    setDeleteOpen(open)
                    if (!open) setDeletingMember(null)
                }}
                title="Remover membro da equipe"
                description={`Tem certeza que deseja remover ${deletingMember?.name ?? "este membro"}? A conta Auth vinculada (se existir) não será excluída nesta etapa.`}
                onConfirm={() => void handleConfirmDelete()}
            />
        </AdminLayout>
    )
}

export default TeamPage
