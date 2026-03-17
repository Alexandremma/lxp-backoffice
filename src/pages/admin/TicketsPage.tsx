import { useState } from "react"
import { AdminLayout } from "@/components/layout/AdminLayout"
import { PageHeader } from "@/components/layout/PageHeader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Search,
  Plus,
  MessageSquare,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  User,
  Calendar,
  Timer,
} from "lucide-react"
import { mockTicketsExtended, mockTeamMembers, type Ticket } from "@/lib/mock-data"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { TicketDetailsSheet } from "@/components/admin/TicketDetailsSheet"

const statusConfig = {
  open: { label: "Aberto", variant: "warning" as const, icon: AlertCircle, color: "text-warning" },
  in_progress: { label: "Em Atendimento", variant: "info" as const, icon: Clock, color: "text-info" },
  resolved: { label: "Resolvido", variant: "success" as const, icon: CheckCircle2, color: "text-success" },
  closed: { label: "Fechado", variant: "secondary" as const, icon: XCircle, color: "text-muted-foreground" },
}

const priorityConfig = {
  low: { label: "Baixa", variant: "secondary" as const },
  medium: { label: "Média", variant: "default" as const },
  high: { label: "Alta", variant: "warning" as const },
  urgent: { label: "Urgente", variant: "destructive" as const },
}

const TicketsPage = () => {
  const [search, setSearch] = useState("")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all")
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban")

  const filteredTickets = mockTicketsExtended.filter((ticket) => {
    const matchesSearch =
      ticket.subject.toLowerCase().includes(search.toLowerCase()) ||
      ticket.studentName.toLowerCase().includes(search.toLowerCase())
    const matchesPriority = priorityFilter === "all" || ticket.priority === priorityFilter
    const matchesAssignee =
      assigneeFilter === "all" ||
      (assigneeFilter === "unassigned" && !ticket.assignedTo) ||
      ticket.assignedTo === assigneeFilter
    return matchesSearch && matchesPriority && matchesAssignee
  })

  const openTickets = filteredTickets.filter((t) => t.status === "open")
  const inProgressTickets = filteredTickets.filter((t) => t.status === "in_progress")
  const resolvedTickets = filteredTickets.filter((t) => t.status === "resolved" || t.status === "closed")

  const handleOpenTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket)
    setSheetOpen(true)
  }

  // Stats
  const avgResponseTime = "2h 15min"
  const ticketsToday = mockTicketsExtended.filter(
    (t) => new Date(t.createdAt).toDateString() === new Date().toDateString()
  ).length

  const TicketCard = ({ ticket }: { ticket: Ticket }) => {
    const StatusIcon = statusConfig[ticket.status].icon
    const assignee = ticket.assignedTo
      ? mockTeamMembers.find((m) => m.id === ticket.assignedTo)
      : null

    return (
      <Card
        className="cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => handleOpenTicket(ticket)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <Badge variant={priorityConfig[ticket.priority].variant} className="text-xs">
              {priorityConfig[ticket.priority].label}
            </Badge>
            <span className="text-xs text-muted-foreground">
              #{ticket.id.replace("tkt_", "")}
            </span>
          </div>
          <h4 className="font-medium text-sm mb-2 line-clamp-2">{ticket.subject}</h4>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
            <User className="h-3 w-3" />
            <span className="truncate">{ticket.studentName}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {formatDistanceToNow(new Date(ticket.createdAt), {
                addSuffix: true,
                locale: ptBR,
              })}
            </div>
            {assignee && (
              <div className="flex items-center gap-1 text-xs">
                <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-medium">
                  {assignee.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  const KanbanColumn = ({
    title,
    tickets,
    icon: Icon,
    color,
  }: {
    title: string
    tickets: Ticket[]
    icon: React.ElementType
    color: string
  }) => (
    <div className="flex-1 min-w-[300px]">
      <div className="flex items-center gap-2 mb-4">
        <Icon className={`h-5 w-5 ${color}`} />
        <h3 className="font-semibold">{title}</h3>
        <Badge variant="secondary" className="ml-auto">
          {tickets.length}
        </Badge>
      </div>
      <ScrollArea className="h-[calc(100vh-380px)]">
        <div className="space-y-3 pr-4">
          {tickets.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} />
          ))}
          {tickets.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Nenhum ticket
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )

  return (
    <AdminLayout>
      <PageHeader
        title="Tickets de Suporte"
        description="Gerencie os chamados de suporte dos alunos"
      >
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Novo Ticket
        </Button>
      </PageHeader>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-warning/10">
                <AlertCircle className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{openTickets.length}</p>
                <p className="text-sm text-muted-foreground">Abertos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-info/10">
                <Clock className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold">{inProgressTickets.length}</p>
                <p className="text-sm text-muted-foreground">Em Atendimento</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Timer className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{avgResponseTime}</p>
                <p className="text-sm text-muted-foreground">Tempo Médio</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-success/10">
                <MessageSquare className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{ticketsToday}</p>
                <p className="text-sm text-muted-foreground">Hoje</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por assunto ou aluno..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full md:w-[160px]">
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="urgent">Urgente</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="low">Baixa</SelectItem>
              </SelectContent>
            </Select>
            <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Atribuído" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="unassigned">Não atribuído</SelectItem>
                {mockTeamMembers
                  .filter((m) => m.role === "tutor" || m.role === "secretary")
                  .map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as typeof viewMode)}>
              <TabsList>
                <TabsTrigger value="kanban">Kanban</TabsTrigger>
                <TabsTrigger value="list">Lista</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Kanban Board */}
      {viewMode === "kanban" && (
        <div className="flex gap-6 overflow-x-auto pb-4">
          <KanbanColumn
            title="Abertos"
            tickets={openTickets}
            icon={AlertCircle}
            color="text-warning"
          />
          <KanbanColumn
            title="Em Atendimento"
            tickets={inProgressTickets}
            icon={Clock}
            color="text-info"
          />
          <KanbanColumn
            title="Resolvidos"
            tickets={resolvedTickets}
            icon={CheckCircle2}
            color="text-success"
          />
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {filteredTickets.map((ticket) => {
                const StatusIcon = statusConfig[ticket.status].icon
                return (
                  <div
                    key={ticket.id}
                    className="flex items-center gap-4 p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => handleOpenTicket(ticket)}
                  >
                    <StatusIcon
                      className={`h-5 w-5 ${statusConfig[ticket.status].color}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{ticket.subject}</p>
                        <Badge variant={priorityConfig[ticket.priority].variant} className="shrink-0">
                          {priorityConfig[ticket.priority].label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {ticket.studentName} • {formatDistanceToNow(new Date(ticket.createdAt), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                    <Badge variant={statusConfig[ticket.status].variant}>
                      {statusConfig[ticket.status].label}
                    </Badge>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ticket Details Sheet */}
      <TicketDetailsSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        ticket={selectedTicket}
      />
    </AdminLayout>
  )
}

export default TicketsPage
