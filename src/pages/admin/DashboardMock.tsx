import { AdminLayout } from "@/components/layout/AdminLayout"
import { PageHeader } from "@/components/layout/PageHeader"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    Users,
    BookOpen,
    UserCog,
    Award,
    Settings,
    GraduationCap,
    Gamepad2,
    FileText,
    ArrowRight,
    TrendingUp,
    UserCheck,
    UserX,
    Shield,
} from "lucide-react"
import { Link } from "react-router-dom"

const DashboardMock = () => {
    // Dados mockados
    const stats = {
        totalAlunos: 1247,
        totalCursos: 23,
        totalColaboradores: 45,
        alunosAtivos: 892,
    }

    const quickAccessItems = [
        {
            title: "Alunos",
            description: "Gerenciar alunos cadastrados",
            icon: Users,
            href: "/admin/alunos",
            color: "text-blue-500",
            bgColor: "bg-blue-500/10",
            stats: `${stats.totalAlunos} alunos`,
        },
        {
            title: "Equipe",
            description: "Gerenciar membros da equipe",
            icon: UserCog,
            href: "/admin/equipe",
            color: "text-purple-500",
            bgColor: "bg-purple-500/10",
            stats: `${stats.totalColaboradores} membros`,
        },
        {
            title: "Cursos",
            description: "Gerenciar cursos e grades",
            icon: BookOpen,
            href: "/admin/cursos",
            color: "text-green-500",
            bgColor: "bg-green-500/10",
            stats: `${stats.totalCursos} cursos`,
        },
        {
            title: "Gamificação",
            description: "Configurar XP, badges e níveis",
            icon: Gamepad2,
            href: "/admin/gamificacao",
            color: "text-orange-500",
            bgColor: "bg-orange-500/10",
            stats: "Configurar regras",
        },
        {
            title: "Certificados",
            description: "Templates e histórico",
            icon: Award,
            href: "/admin/certificados",
            color: "text-yellow-500",
            bgColor: "bg-yellow-500/10",
            stats: "Gerenciar",
        },
        {
            title: "Configurações",
            description: "Configurações gerais",
            icon: Settings,
            href: "/admin/configuracoes",
            color: "text-gray-500",
            bgColor: "bg-gray-500/10",
            stats: "Ajustar",
        },
    ]

    const commonActions = [
        {
            label: "Cadastrar Novo Aluno",
            href: "/admin/alunos",
            icon: UserCheck,
        },
        {
            label: "Criar Novo Curso",
            href: "/admin/cursos",
            icon: GraduationCap,
        },
        {
            label: "Adicionar Membro",
            href: "/admin/equipe",
            icon: Shield,
        },
        {
            label: "Ver Relatórios",
            href: "#",
            icon: FileText,
        },
    ]

    return (
        <AdminLayout>
            <PageHeader
                title="Dashboard"
                description="Painel principal do Back Office - Acesso rápido às funcionalidades"
            />

            {/* Cards de Estatísticas Básicas */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de Alunos</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalAlunos.toLocaleString("pt-BR")}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {stats.alunosAtivos} alunos ativos
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de Cursos</CardTitle>
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalCursos}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Cursos cadastrados
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Colaboradores</CardTitle>
                        <UserCog className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalColaboradores}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Membros da equipe
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Alunos Ativos</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.alunosAtivos.toLocaleString("pt-BR")}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {Math.round((stats.alunosAtivos / stats.totalAlunos) * 100)}% do total
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Cards de Acesso Rápido */}
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

            {/* Ações Comuns */}
            <div>
                <h2 className="text-xl font-semibold mb-4">Ações Comuns</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {commonActions.map((action) => {
                        const Icon = action.icon
                        return (
                            <Link key={action.label} to={action.href}>
                                <Button
                                    variant="outline"
                                    className="w-full h-auto p-4 flex flex-col items-start gap-2 hover:bg-accent"
                                >
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

            {/* Informações Adicionais */}
            <div className="mt-8 grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Bem-vindo ao Back Office</CardTitle>
                        <CardDescription>
                            Use os cards acima para acessar rapidamente as principais funcionalidades do sistema.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li className="flex items-center gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                Gerencie alunos, equipe e cursos
                            </li>
                            <li className="flex items-center gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                Configure gamificação e certificados
                            </li>
                            <li className="flex items-center gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                Acesse configurações e integrações
                            </li>
                        </ul>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Status do Sistema</CardTitle>
                        <CardDescription>
                            Informações sobre o estado atual da plataforma
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Sistema</span>
                                <span className="text-sm font-medium text-green-500">Operacional</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Banco de Dados</span>
                                <span className="text-sm font-medium text-green-500">Conectado</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">API Externa</span>
                                <span className="text-sm font-medium text-green-500">Ativa</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    )
}

export default DashboardMock
