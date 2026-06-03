import { AdminLayout } from "@/components/layout/AdminLayout"
import { PageHeader } from "@/components/layout/PageHeader"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    AlertCircle,
    Users,
    BookOpen,
    UserCog,
    Award,
    Settings,
    GraduationCap,
    Gamepad2,
    ArrowRight,
    TrendingUp,
    UserCheck,
    Loader2,
    Shield,
} from "lucide-react"
import { Link } from "react-router-dom"
import { useGetAdminDashboardStats } from "@/hooks/queries/useGetAdminDashboardStats"
import { getAdminErrorMessage } from "@/lib/adminErrorMessage"
import type { PermissionId } from "@/consts/permissions"
import { usePermission } from "@/hooks/usePermission"

const Dashboard = () => {
    const { can } = usePermission()
    const { data, isLoading, isError, error, refetch } = useGetAdminDashboardStats()
    const stats = {
        totalAlunos: data?.totalStudents ?? 0,
        totalCursos: data?.totalCourses ?? 0,
        totalColaboradores: data?.totalTeamMembers ?? 0,
        alunosAtivos: data?.activeStudents ?? 0,
    }

    const quickAccessItems: {
        title: string
        description: string
        icon: typeof Users
        href: string
        permission: PermissionId
        color: string
        bgColor: string
        stats: string
    }[] = [
        {
            title: "Alunos",
            description: "Gerenciar alunos cadastrados",
            icon: Users,
            href: "/admin/alunos",
            permission: "alunos.visualizar",
            color: "text-blue-500",
            bgColor: "bg-blue-500/10",
            stats: isLoading ? "Carregando..." : `${stats.totalAlunos.toLocaleString("pt-BR")} alunos`,
        },
        {
            title: "Equipe",
            description: "Gerenciar membros da equipe",
            icon: UserCog,
            href: "/admin/equipe",
            permission: "equipe.visualizar",
            color: "text-purple-500",
            bgColor: "bg-purple-500/10",
            stats: isLoading ? "Carregando..." : `${stats.totalColaboradores} membros`,
        },
        {
            title: "Cursos",
            description: "Gerenciar cursos e grades",
            icon: BookOpen,
            href: "/admin/cursos",
            permission: "cursos.visualizar",
            color: "text-green-500",
            bgColor: "bg-green-500/10",
            stats: isLoading ? "Carregando..." : `${stats.totalCursos} cursos`,
        },
        {
            title: "Gamificação",
            description: "Configurar XP, badges e níveis",
            icon: Gamepad2,
            href: "/admin/gamificacao",
            permission: "gamificacao.visualizar",
            color: "text-orange-500",
            bgColor: "bg-orange-500/10",
            stats: "Configurar regras",
        },
        {
            title: "Certificados",
            description: "Templates e histórico",
            icon: Award,
            href: "/admin/certificados",
            permission: "certificados.visualizar",
            color: "text-yellow-500",
            bgColor: "bg-yellow-500/10",
            stats: "Gerenciar",
        },
        {
            title: "Configurações",
            description: "Configurações gerais",
            icon: Settings,
            href: "/admin/configuracoes",
            permission: "configuracoes.visualizar",
            color: "text-gray-500",
            bgColor: "bg-gray-500/10",
            stats: "Ajustar",
        },
    ].filter((item) => can(item.permission))

    const commonActions = [
        { label: "Cadastrar Novo Aluno", href: "/admin/alunos", icon: UserCheck, permission: "alunos.criar" as PermissionId },
        { label: "Criar Novo Curso", href: "/admin/cursos", icon: GraduationCap, permission: "cursos.criar" as PermissionId },
        { label: "Adicionar Membro", href: "/admin/equipe", icon: Shield, permission: "equipe.criar" as PermissionId },
        { label: "Configurar Gamificação", href: "/admin/gamificacao", icon: Gamepad2, permission: "gamificacao.visualizar" as PermissionId },
    ].filter((item) => can(item.permission))

    return (
        <AdminLayout>
            <PageHeader
                title="Dashboard"
                description="Painel principal do Back Office - Acesso rápido às funcionalidades"
            />

            {isError && (
                <Alert variant="destructive" className="mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Não foi possível carregar o dashboard</AlertTitle>
                    <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <span>{getAdminErrorMessage("dashboard-load", error)}</span>
                        <Button variant="outline" size="sm" onClick={() => void refetch()}>
                            Tentar novamente
                        </Button>
                    </AlertDescription>
                </Alert>
            )}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de Alunos</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{isLoading ? "..." : stats.totalAlunos.toLocaleString("pt-BR")}</div>
                        <p className="text-xs text-muted-foreground mt-1">{stats.alunosAtivos} com matrícula ativa</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de Cursos</CardTitle>
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{isLoading ? "..." : stats.totalCursos}</div>
                        <p className="text-xs text-muted-foreground mt-1">Cursos cadastrados</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Colaboradores</CardTitle>
                        <UserCog className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{isLoading ? "..." : stats.totalColaboradores}</div>
                        <p className="text-xs text-muted-foreground mt-1">Membros da equipe</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Alunos com Matrícula Ativa</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{isLoading ? "..." : stats.alunosAtivos.toLocaleString("pt-BR")}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {stats.totalAlunos > 0 ? Math.round((stats.alunosAtivos / stats.totalAlunos) * 100) : 0}% dos alunos cadastrados
                        </p>
                    </CardContent>
                </Card>
            </div>

            {isLoading && (
                <div className="mb-8 flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Atualizando indicadores do dashboard...
                </div>
            )}

            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Acesso Rápido</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {quickAccessItems.map((item) => {
                        const Icon = item.icon
                        return (
                            <Link key={item.title} to={item.href}>
                                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <div className={`h-12 w-12 rounded-lg ${item.bgColor} flex items-center justify-center`}>
                                                <Icon className={`h-6 w-6 ${item.color}`} />
                                            </div>
                                            <ArrowRight className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                        <CardTitle className="mt-4">{item.title}</CardTitle>
                                        <CardDescription>{item.description}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground">{item.stats}</p>
                                    </CardContent>
                                </Card>
                            </Link>
                        )
                    })}
                </div>
            </div>

            <div>
                <h2 className="text-xl font-semibold mb-4">Ações Comuns</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {commonActions.map((action) => {
                        const Icon = action.icon
                        return (
                            <Link key={action.label} to={action.href}>
                                <Button variant="outline" className="w-full h-auto p-4 flex flex-col items-start gap-2 hover:bg-accent">
                                    <div className="flex items-center gap-2 w-full">
                                        <Icon className="h-5 w-5" />
                                        <span className="text-sm font-medium">{action.label}</span>
                                    </div>
                                </Button>
                            </Link>
                        )
                    })}
                </div>
            </div>
        </AdminLayout>
    )
}

export default Dashboard
