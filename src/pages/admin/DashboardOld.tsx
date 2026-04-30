import { AdminLayout } from "@/components/layout/AdminLayout"
import { PageHeader } from "@/components/layout/PageHeader"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StatCard } from "@/components/ui/stat-card"
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Award, BookOpen, DollarSign, FileEdit, TicketCheck, TrendingUp, UserPlus, Users } from "lucide-react"
import { mockDashboardStats, mockEngagementData, mockEnrollmentsByCategory, mockRecentActivities } from "@/lib/mock-data"

const DashboardOld = () => {
    const formatCurrency = (value: number) =>
        new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)

    const getActivityIcon = (type: string) => {
        switch (type) {
            case "enrollment":
                return <UserPlus className="h-4 w-4 text-success" />
            case "course_update":
                return <FileEdit className="h-4 w-4 text-info" />
            case "ticket":
                return <TicketCheck className="h-4 w-4 text-warning" />
            case "certificate":
                return <Award className="h-4 w-4 text-primary" />
            default:
                return <TrendingUp className="h-4 w-4 text-muted-foreground" />
        }
    }

    return (
        <AdminLayout>
            <PageHeader title="Dashboard (Old)" description="Versão anterior mantida para referência interna" />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
                <StatCard title="Alunos Ativos" value={mockDashboardStats.activeStudents.toLocaleString("pt-BR")} subtitle={`de ${mockDashboardStats.totalStudents.toLocaleString("pt-BR")} total`} icon={Users} variant="primary" trend={{ value: 12, label: "vs mês anterior" }} />
                <StatCard title="Cursos Ativos" value={mockDashboardStats.activeCourses} subtitle={`de ${mockDashboardStats.totalCourses} total`} icon={BookOpen} variant="secondary" trend={{ value: 5 }} />
                <StatCard title="Receita Mensal" value={formatCurrency(mockDashboardStats.monthlyRevenue)} icon={DollarSign} variant="success" trend={{ value: 8, label: "vs mês anterior" }} />
                <StatCard title="Tickets Abertos" value={mockDashboardStats.openTickets} subtitle="aguardando atendimento" icon={TicketCheck} variant={mockDashboardStats.openTickets > 20 ? "warning" : "default"} />
            </div>

            <div className="grid gap-6 lg:grid-cols-3 mb-8">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Engajamento</CardTitle>
                        <CardDescription>Alunos ativos e acessos por mês</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={mockEngagementData}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                                <XAxis dataKey="month" className="text-muted-foreground text-xs" />
                                <YAxis className="text-muted-foreground text-xs" />
                                <Tooltip />
                                <Area type="monotone" dataKey="alunos" stroke="hsl(var(--chart-1))" fillOpacity={0.2} fill="hsl(var(--chart-1))" name="Alunos Ativos" />
                                <Area type="monotone" dataKey="acessos" stroke="hsl(var(--chart-2))" fillOpacity={0.2} fill="hsl(var(--chart-2))" name="Acessos" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Matrículas por Categoria</CardTitle>
                        <CardDescription>Distribuição atual</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie data={mockEnrollmentsByCategory} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">
                                    {mockEnrollmentsByCategory.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Atividade Recente</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {mockRecentActivities.map((activity) => (
                        <div key={activity.id} className="flex items-center gap-3 rounded-lg border p-3">
                            {getActivityIcon(activity.type)}
                            <div className="flex-1">
                                <p className="font-medium">{activity.description}</p>
                                <p className="text-sm text-muted-foreground">{activity.user}</p>
                            </div>
                            <Badge variant="outline">{activity.time}</Badge>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </AdminLayout>
    )
}

export default DashboardOld
