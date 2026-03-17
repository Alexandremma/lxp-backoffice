import { useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  User,
  Calendar,
  Clock,
  Send,
  Paperclip,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ExternalLink,
} from "lucide-react"
import { type Ticket, mockTicketMessages, mockTeamMembers, type TicketMessage } from "@/lib/mock-data"
import { format, formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

interface TicketDetailsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ticket: Ticket | null
}

const statusConfig = {
  open: { label: "Aberto", variant: "warning" as const, icon: AlertCircle },
  in_progress: { label: "Em Atendimento", variant: "info" as const, icon: Clock },
  resolved: { label: "Resolvido", variant: "success" as const, icon: CheckCircle2 },
  closed: { label: "Fechado", variant: "secondary" as const, icon: XCircle },
}

const priorityConfig = {
  low: { label: "Baixa", variant: "secondary" as const },
  medium: { label: "Média", variant: "default" as const },
  high: { label: "Alta", variant: "warning" as const },
  urgent: { label: "Urgente", variant: "destructive" as const },
}

export function TicketDetailsSheet({ open, onOpenChange, ticket }: TicketDetailsSheetProps) {
  const [newMessage, setNewMessage] = useState("")
  const [status, setStatus] = useState<Ticket["status"]>(ticket?.status || "open")
  const [assignee, setAssignee] = useState(ticket?.assignedTo || "")

  if (!ticket) return null

  const messages: TicketMessage[] = mockTicketMessages[ticket.id] || []
  const assignedMember = ticket.assignedTo
    ? mockTeamMembers.find((m) => m.id === ticket.assignedTo)
    : null
  const supportMembers = mockTeamMembers.filter((m) => m.role === "tutor" || m.role === "secretary")

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      console.log("Sending message:", newMessage)
      setNewMessage("")
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl">
        <SheetHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div>
              <SheetTitle className="text-left pr-8">{ticket.subject}</SheetTitle>
              <SheetDescription className="text-left">
                Ticket #{ticket.id.replace("tkt_", "")}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6">
          {/* Status and Priority */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={statusConfig[ticket.status].variant}>
              {statusConfig[ticket.status].label}
            </Badge>
            <Badge variant={priorityConfig[ticket.priority].variant}>
              {priorityConfig[ticket.priority].label}
            </Badge>
          </div>

          {/* Details */}
          <div className="grid gap-4 text-sm">
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground">Aluno</p>
                <p className="font-medium">{ticket.studentName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground">Criado em</p>
                <p className="font-medium">
                  {format(new Date(ticket.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground">Última atualização</p>
                <p className="font-medium">
                  {formatDistanceToNow(new Date(ticket.updatedAt), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={status} onValueChange={(value: Ticket["status"]) => setStatus(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Aberto</SelectItem>
                  <SelectItem value="in_progress">Em Atendimento</SelectItem>
                  <SelectItem value="resolved">Resolvido</SelectItem>
                  <SelectItem value="closed">Fechado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Atribuído a</label>
              <Select value={assignee} onValueChange={setAssignee}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar..." />
                </SelectTrigger>
                <SelectContent>
                  {supportMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Description */}
          <div>
            <p className="text-sm font-medium mb-2">Descrição</p>
            <p className="text-sm text-muted-foreground">{ticket.description}</p>
          </div>

          <Separator />

          {/* Messages */}
          <div>
            <p className="text-sm font-medium mb-4">Histórico de Mensagens</p>
            <ScrollArea className="h-[200px] pr-4">
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${
                      msg.senderRole === "system" ? "justify-center" : ""
                    }`}
                  >
                    {msg.senderRole === "system" ? (
                      <div className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                        {msg.message}
                      </div>
                    ) : (
                      <>
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarFallback
                            className={
                              msg.senderRole === "support"
                                ? "bg-primary/20 text-primary"
                                : "bg-muted"
                            }
                          >
                            {msg.senderName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{msg.senderName}</span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(msg.createdAt), "dd/MM HH:mm")}
                            </span>
                          </div>
                          <p className="text-sm">{msg.message}</p>
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="flex gap-2 mt-2">
                              {msg.attachments.map((att, idx) => (
                                <Button
                                  key={idx}
                                  variant="outline"
                                  size="sm"
                                  className="text-xs"
                                >
                                  <Paperclip className="h-3 w-3 mr-1" />
                                  {att.name}
                                </Button>
                              ))}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))}
                {messages.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma mensagem ainda
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* New Message */}
          <div className="space-y-2">
            <Textarea
              placeholder="Digite sua resposta..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              rows={3}
            />
            <div className="flex justify-between items-center">
              <Button variant="outline" size="sm">
                <Paperclip className="h-4 w-4 mr-2" />
                Anexar
              </Button>
              <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                <Send className="h-4 w-4 mr-2" />
                Enviar
              </Button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" className="flex-1">
              <ExternalLink className="h-4 w-4 mr-2" />
              Ver Aluno
            </Button>
            <Button variant="outline" size="sm" className="flex-1 text-destructive hover:text-destructive">
              <XCircle className="h-4 w-4 mr-2" />
              Fechar Ticket
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
