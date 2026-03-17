import { AdminLayout } from "@/components/layout/AdminLayout"
import { PageHeader } from "@/components/layout/PageHeader"
import { StatCard } from "@/components/ui/stat-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  BookOpen,
  DollarSign,
  TicketCheck,
  TrendingUp,
  UserPlus,
  FileEdit,
  Award,
} from "lucide-react"
import {
  mockDashboardStats,
  mockRecentActivities,
  mockEngagementData,
  mockEnrollmentsByCategory,
} from "@/lib/mock-data"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

const Dashboard = () => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

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
      <PageHeader
        title="Dashboard"
        description="Visão geral do LXP"
      />

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          title="Alunos Ativos"
          value={mockDashboardStats.activeStudents.toLocaleString("pt-BR")}
          subtitle={`de ${mockDashboardStats.totalStudents.toLocaleString("pt-BR")} total`}
          icon={Users}
          variant="primary"
          trend={{ value: 12, label: "vs mês anterior" }}
        />
        <StatCard
          title="Cursos Ativos"
          value={mockDashboardStats.activeCourses}
          subtitle={`de ${mockDashboardStats.totalCourses} total`}
          icon={BookOpen}
          variant="secondary"
          trend={{ value: 5 }}
        />
        <StatCard
          title="Receita Mensal"
          value={formatCurrency(mockDashboardStats.monthlyRevenue)}
          icon={DollarSign}
          variant="success"
          trend={{ value: 8, label: "vs mês anterior" }}
        />
        <StatCard
          title="Tickets Abertos"
          value={mockDashboardStats.openTickets}
          subtitle="aguardando atendimento"
          icon={TicketCheck}
          variant={mockDashboardStats.openTickets > 20 ? "warning" : "default"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3 mb-8">
        {/* Engagement Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Engajamento</CardTitle>
            <CardDescription>Alunos ativos e acessos por mês</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={mockEngagementData}>
                <defs>
                  <linearGradient id="colorAlunos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorAcessos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="text-muted-foreground text-xs" />
                <YAxis className="text-muted-foreground text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="alunos"
                  stroke="hsl(var(--chart-1))"
                  fillOpacity={1}
                  fill="url(#colorAlunos)"
                  name="Alunos Ativos"
                />
                <Area
                  type="monotone"
                  dataKey="acessos"
                  stroke="hsl(var(--chart-2))"
                  fillOpacity={1}
                  fill="url(#colorAcessos)"
                  name="Acessos"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Enrollments by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Matrículas por Categoria</CardTitle>
            <CardDescription>Distribuição atual</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={mockEnrollmentsByCategory}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {mockEnrollmentsByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-4">
              {mockEnrollmentsByCategory.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="font-medium">{item.value.toLocaleString("pt-BR")}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
            <CardDescription>Últimas ações no sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockRecentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-4 p-3 rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">{activity.description}</p>
                    <p className="text-sm text-muted-foreground">{activity.user}</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {activity.time}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Métricas de Desempenho</CardTitle>
            <CardDescription>Indicadores principais</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Taxa de Conclusão</span>
                <span className="font-semibold text-success">{mockDashboardStats.completionRate}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-success transition-all duration-500"
                  style={{ width: `${mockDashboardStats.completionRate}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Engajamento Médio</span>
                <span className="font-semibold">{mockDashboardStats.avgEngagement}/5</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${(mockDashboardStats.avgEngagement / 5) * 100}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">4.8</p>
                <p className="text-sm text-muted-foreground">NPS Score</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">2.3h</p>
                <p className="text-sm text-muted-foreground">Tempo Médio/Dia</p>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <h4 className="text-sm font-medium mb-3">Alertas</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="warning" size="sm">Atenção</Badge>
                  <span className="text-sm">15 matrículas pendentes</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="destructive" size="sm">Urgente</Badge>
                  <span className="text-sm">3 tickets sem resposta há +24h</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}

export default Dashboard
