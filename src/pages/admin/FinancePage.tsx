import { useState } from "react"
import { AdminLayout } from "@/components/layout/AdminLayout"
import { PageHeader } from "@/components/layout/PageHeader"
import { StatCard } from "@/components/ui/stat-card"
import { DataTable, Column } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  mockFinancialSummary,
  mockPaymentTransactions,
  mockOverdueStudents,
  PaymentTransaction,
  OverdueStudent,
} from "@/lib/mock-data"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Search,
  MoreHorizontal,
  Mail,
  FileText,
  CreditCard,
} from "lucide-react"
import { toast } from "sonner"

const FinancePage = () => {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const filteredTransactions = mockPaymentTransactions.filter((tx) => {
    const matchesSearch = tx.studentName
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || tx.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: PaymentTransaction["status"]) => {
    switch (status) {
      case "paid":
        return <Badge variant="success-muted">Pago</Badge>
      case "pending":
        return <Badge variant="warning-muted">Pendente</Badge>
      case "overdue":
        return <Badge variant="destructive-muted">Vencido</Badge>
      case "cancelled":
        return <Badge variant="ghost">Cancelado</Badge>
      default:
        return <Badge variant="ghost">{status}</Badge>
    }
  }

  const handleAction = (action: string, item: PaymentTransaction | OverdueStudent) => {
    toast.success(`Ação "${action}" executada`)
  }

  const transactionColumns: Column<PaymentTransaction>[] = [
    {
      key: "studentName",
      header: "Aluno",
      sortable: true,
    },
    {
      key: "description",
      header: "Descrição",
    },
    {
      key: "amount",
      header: "Valor",
      cell: (tx) => (
        <span className="font-medium">{formatCurrency(tx.amount)}</span>
      ),
      sortable: true,
    },
    {
      key: "dueDate",
      header: "Vencimento",
      cell: (tx) => new Date(tx.dueDate).toLocaleDateString("pt-BR"),
      sortable: true,
    },
    {
      key: "paidAt",
      header: "Pagamento",
      cell: (tx) =>
        tx.paidAt ? new Date(tx.paidAt).toLocaleDateString("pt-BR") : "-",
    },
    {
      key: "status",
      header: "Status",
      cell: (tx) => getStatusBadge(tx.status),
    },
    {
      key: "actions",
      header: "",
      cell: (tx) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon-sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-popover">
            {tx.status === "pending" && (
              <DropdownMenuItem onClick={() => handleAction("baixa", tx)}>
                <CreditCard className="mr-2 h-4 w-4" />
                Dar Baixa Manual
              </DropdownMenuItem>
            )}
            {tx.status === "overdue" && (
              <>
                <DropdownMenuItem onClick={() => handleAction("cobrança", tx)}>
                  <Mail className="mr-2 h-4 w-4" />
                  Enviar Cobrança
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAction("baixa", tx)}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Dar Baixa Manual
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuItem onClick={() => handleAction("boleto", tx)}>
              <FileText className="mr-2 h-4 w-4" />
              Gerar Boleto
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      className: "w-12",
    },
  ]

  const overdueColumns: Column<OverdueStudent>[] = [
    {
      key: "studentName",
      header: "Aluno",
      cell: (s) => (
        <div>
          <p className="font-medium">{s.studentName}</p>
          <p className="text-sm text-muted-foreground">{s.courseName}</p>
        </div>
      ),
    },
    {
      key: "overdueAmount",
      header: "Valor em Aberto",
      cell: (s) => (
        <span className="font-medium text-destructive">
          {formatCurrency(s.overdueAmount)}
        </span>
      ),
      sortable: true,
    },
    {
      key: "overdueCount",
      header: "Parcelas Vencidas",
      cell: (s) => (
        <Badge variant="destructive-muted">{s.overdueCount} parcelas</Badge>
      ),
    },
    {
      key: "lastPayment",
      header: "Último Pagamento",
      cell: (s) =>
        s.lastPayment
          ? new Date(s.lastPayment).toLocaleDateString("pt-BR")
          : "Nunca",
    },
    {
      key: "daysSinceOverdue",
      header: "Dias em Atraso",
      cell: (s) => (
        <span className="text-destructive font-medium">
          {s.daysSinceOverdue} dias
        </span>
      ),
      sortable: true,
    },
    {
      key: "actions",
      header: "",
      cell: (s) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon-sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-popover">
            <DropdownMenuItem onClick={() => handleAction("cobrança", s)}>
              <Mail className="mr-2 h-4 w-4" />
              Enviar Cobrança
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAction("acordo", s)}>
              <FileText className="mr-2 h-4 w-4" />
              Gerar Acordo
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      className: "w-12",
    },
  ]

  return (
    <AdminLayout>
      <PageHeader
        title="Financeiro"
        description="Relatórios de pagamentos e inadimplência"
      />

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard
          title="Receita Mensal"
          value={formatCurrency(mockFinancialSummary.monthlyRevenue)}
          icon={DollarSign}
          variant="success"
          trend={{ value: mockFinancialSummary.revenueGrowth, label: "vs mês anterior" }}
        />
        <StatCard
          title="Receita Esperada"
          value={formatCurrency(mockFinancialSummary.expectedRevenue)}
          icon={TrendingUp}
          variant="primary"
        />
        <StatCard
          title="Inadimplência"
          value={formatCurrency(mockFinancialSummary.overdueAmount)}
          subtitle={`${mockFinancialSummary.overdueStudents} alunos`}
          icon={AlertTriangle}
          variant="warning"
        />
        <StatCard
          title="Taxa de Inadimplência"
          value={`${mockFinancialSummary.overdueRate}%`}
          icon={TrendingDown}
          variant={mockFinancialSummary.overdueRate > 10 ? "warning" : "default"}
        />
      </div>

      {/* Revenue Chart */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Evolução da Receita</CardTitle>
          <CardDescription>Receita mensal dos últimos 6 meses</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={mockFinancialSummary.revenueHistory}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="month" className="text-muted-foreground text-xs" />
              <YAxis
                className="text-muted-foreground text-xs"
                tickFormatter={(value) =>
                  new Intl.NumberFormat("pt-BR", {
                    notation: "compact",
                    compactDisplay: "short",
                  }).format(value)
                }
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value: number) => [formatCurrency(value), "Receita"]}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="hsl(var(--success))"
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions">Transações</TabsTrigger>
          <TabsTrigger value="overdue">
            Inadimplentes
            <Badge variant="destructive" size="sm" className="ml-2">
              {mockOverdueStudents.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por aluno..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="paid">Pago</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="overdue">Vencido</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DataTable columns={transactionColumns} data={filteredTransactions} />
        </TabsContent>

        <TabsContent value="overdue">
          <DataTable columns={overdueColumns} data={mockOverdueStudents} />
        </TabsContent>
      </Tabs>
    </AdminLayout>
  )
}

export default FinancePage
