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
    Copy,
    Edit,
    GraduationCap,
    HeadphonesIcon,
    Loader2,
    Mail,
    Megaphone,
    MoreHorizontal,
    Plus,
    Search,
    Shield,
    Trash2,
    UserCog,
    FileText,
    DollarSign,
} from "lucide-react"
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
import { getAdminErrorMessage } from "@/lib/adminErrorMessage"

type TeamRole = TeamMemberAdminRow["role"]

const roleConfig: Record<
    TeamRole,
    {
        label: string
        icon: React.ElementType
        badgeVariant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info"
    }
> = {
    admin: { label: "Admin", icon: Shield, badgeVariant: "destructive" },
    coordinator: { label: "Coordenador", icon: UserCog, badgeVariant: "info" },
    secretary: { label: "Secretaria", icon: FileText, badgeVariant: "secondary" },
    professor: { label: "Professor", icon: GraduationCap, badgeVariant: "default" },
    tutor: { label: "Tutor", icon: HeadphonesIcon, badgeVariant: "success" },
    financial: { label: "Financeiro", icon: DollarSign, badgeVariant: "warning" },
    commercial: { label: "Comercial", icon: Megaphone, badgeVariant: "outline" },
}

function toTeamMemberDialogModel(row: TeamMemberAdminRow): TeamMemberDialogMember {
    return {
        id: row.id,
        name: row.name,
        email: row.email,
        role: row.role,
        status: "active",
    }
}

const TeamPage = () => {
    const { data, isLoading, isError, error, refetch } = useGetTeamMembersAdmin()
    const upsertMember = useUpsertTeamMemberAdmin()
    const deleteMember = useDeleteTeamMemberAdmin()
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
        return members.filter((member) => {
            const matchesSearch =
                member.name.toLowerCase().includes(search.toLowerCase()) ||
                member.email.toLowerCase().includes(search.toLowerCase())
            const matchesRole = roleFilter === "all" || member.role === roleFilter
            return matchesSearch && matchesRole
        })
    }, [members, search, roleFilter])

    const countByRole = useMemo(() => {
        const counts: Record<TeamRole, number> = {
            admin: 0,
            coordinator: 0,
            secretary: 0,
            professor: 0,
            tutor: 0,
            financial: 0,
            commercial: 0,
        }
        for (const member of members) counts[member.role] += 1
        return counts
    }, [members])

    const totalPages = Math.max(1, Math.ceil(filteredMembers.length / pageSize))
    const safePage = Math.min(page, totalPages)
    const start = (safePage - 1) * pageSize
    const paginatedMembers = filteredMembers.slice(start, start + pageSize)

    const handleCopyEmail = async (email: string) => {
        try {
            await navigator.clipboard.writeText(email)
            toast.success("E-mail copiado.")
        } catch {
            toast.error("Não foi possível copiar o e-mail.")
        }
    }

    const handleOpenCreate = () => {
        setEditingMember(null)
        setDialogOpen(true)
    }

    const handleOpenEdit = (member: TeamMemberAdminRow) => {
        setEditingMember(member)
        setDialogOpen(true)
    }

    const handleSaveDialog = async (values: TeamMemberFormData) => {
        try {
            if (editingMember) {
                await upsertMember.mutateAsync({
                    mode: "update",
                    id: editingMember.id,
                    name: values.name,
                    email: values.email,
                    role: values.role as TeamRole,
                })
                toast.success("Membro atualizado com sucesso.")
            } else {
                await upsertMember.mutateAsync({
                    mode: "create",
                    name: values.name,
                    email: values.email,
                    role: values.role as TeamRole,
                    redirectTo: `${window.location.origin}/admin/login`,
                })
                toast.success("Membro adicionado e convite enviado por e-mail.")
            }
            setDialogOpen(false)
            setEditingMember(null)
        } catch (err: unknown) {
            toast.error(getAdminErrorMessage("team-save", err))
        }
    }

    const handleDeleteMember = (member: TeamMemberAdminRow) => {
        setDeletingMember(member)
        setDeleteOpen(true)
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
                <Button onClick={handleOpenCreate}>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Membro
                </Button>
            </PageHeader>

            <Alert variant="info" className="mb-6">
                <AlertTitle>Escopo atual desta sprint</AlertTitle>
                <AlertDescription>
                    Ao criar membro, enviamos convite por e-mail e vinculamos o usuário ao{" "}
                    <code>backoffice_team_members</code> automaticamente.
                </AlertDescription>
            </Alert>

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

            <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-7 mb-6">
                {(Object.keys(roleConfig) as TeamRole[]).map((role) => {
                    const Icon = roleConfig[role].icon
                    return (
                        <Card key={role}>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-lg bg-muted">
                                        <Icon className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="text-xl font-bold">{countByRole[role]}</p>
                                        <p className="text-xs text-muted-foreground">{roleConfig[role].label}</p>
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
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Membro</TableHead>
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
                                                        <DropdownMenuItem onClick={() => handleOpenEdit(member)}>
                                                            <Edit className="h-4 w-4 mr-2" />
                                                            Editar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => void handleCopyEmail(member.email)}>
                                                            <Copy className="h-4 w-4 mr-2" />
                                                            Copiar e-mail
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => (window.location.href = `mailto:${member.email}`)}>
                                                            <Mail className="h-4 w-4 mr-2" />
                                                            Enviar e-mail
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="text-destructive"
                                                            onClick={() => handleDeleteMember(member)}
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                            Remover
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                                        Nenhum membro encontrado para os filtros atuais.
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
                onSave={(values) => void handleSaveDialog(values)}
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
