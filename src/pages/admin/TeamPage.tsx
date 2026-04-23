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
    Copy,
    GraduationCap,
    HeadphonesIcon,
    Loader2,
    Mail,
    Megaphone,
    MoreHorizontal,
    Search,
    Shield,
    UserCog,
    FileText,
    DollarSign,
} from "lucide-react"
import { toast } from "sonner"
import { useGetTeamMembersAdmin } from "@/hooks/queries/useGetTeamMembersAdmin"
import type { TeamMemberAdminRow } from "@/services/teamService"

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

const TeamPage = () => {
    const { data, isLoading, isError, error, refetch } = useGetTeamMembersAdmin()
    const [search, setSearch] = useState("")
    const [roleFilter, setRoleFilter] = useState<"all" | TeamRole>("all")

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

    const handleCopyEmail = async (email: string) => {
        try {
            await navigator.clipboard.writeText(email)
            toast.success("E-mail copiado.")
        } catch {
            toast.error("Não foi possível copiar o e-mail.")
        }
    }

    return (
        <AdminLayout>
            <PageHeader
                title="Equipe"
                description="Visualize a equipe administrativa real do Backoffice."
            />

            <Alert variant="info" className="mb-6">
                <AlertTitle>Escopo atual desta sprint</AlertTitle>
                <AlertDescription>
                    Tela conectada ao Supabase para listagem e filtros. Cadastro/remoção no painel dependem de
                    fluxo completo com Supabase Auth Admin e regras de governança.
                </AlertDescription>
            </Alert>

            {isError && (
                <Alert variant="destructive" className="mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Não foi possível carregar a equipe</AlertTitle>
                    <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <span>{error instanceof Error ? error.message : "Erro desconhecido"}</span>
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
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as "all" | TeamRole)}>
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
                            {filteredMembers.length > 0 ? (
                                filteredMembers.map((member) => {
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
                                                        <DropdownMenuItem onClick={() => void handleCopyEmail(member.email)}>
                                                            <Copy className="h-4 w-4 mr-2" />
                                                            Copiar e-mail
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => (window.location.href = `mailto:${member.email}`)}>
                                                            <Mail className="h-4 w-4 mr-2" />
                                                            Enviar e-mail
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
                </CardContent>
            </Card>
        </AdminLayout>
    )
}

export default TeamPage
