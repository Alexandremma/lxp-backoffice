import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  User,
  Mail,
  Phone,
  Calendar,
  GraduationCap,
  TrendingUp,
  CreditCard,
  History,
  Ban,
  KeyRound,
  Send,
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  LogIn,
  LogOut,
  Eye,
  Download,
  MoreHorizontal,
  Loader2,
  FileCheck,
  XCircle,
  RefreshCw,
} from "lucide-react"
import {
  mockStudentFinancial,
  mockStudentHistory,
  mockDocumentRequests,
  mockEnrollmentQueue,
  type StudentFinancial,
  type StudentAccessLog,
  type DocumentRequest,
  type EnrollmentQueueItem,
} from "@/lib/mock-data"
import type { StudentAdmin as Student } from "@/types/studentAdmin"
import { formatDistanceToNow, format, isValid } from "date-fns"
import { ptBR } from "date-fns/locale"
import { toast } from "sonner"

interface StudentDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  student: Student | null
  /** Dados reais do Supabase: esconde abas demonstrativas (financeiro, documentos, etc.). */
  dataMode?: boolean
}

const statusConfig = {
  active: { label: "Ativo", variant: "success" as const },
  inactive: { label: "Inativo", variant: "secondary" as const },
  blocked: { label: "Bloqueado", variant: "destructive" as const },
}

const installmentStatusConfig = {
  paid: { label: "Pago", variant: "success" as const, icon: CheckCircle2 },
  pending: { label: "Pendente", variant: "warning" as const, icon: Clock },
  overdue: { label: "Vencido", variant: "destructive" as const, icon: AlertCircle },
}

const actionIcons: Record<string, React.ElementType> = {
  login: LogIn,
  logout: LogOut,
  lesson_view: Eye,
  quiz_start: FileText,
  quiz_submit: CheckCircle2,
  download: Download,
}

const getDocStatusBadge = (status: DocumentRequest["status"]) => {
  switch (status) {
    case "pending":
      return <Badge variant="warning-muted">Pendente</Badge>
    case "processing":
      return <Badge variant="info-muted">Processando</Badge>
    case "ready":
      return <Badge variant="success-muted">Pronto</Badge>
    case "delivered":
      return <Badge variant="ghost">Entregue</Badge>
    case "rejected":
      return <Badge variant="destructive-muted">Rejeitado</Badge>
    default:
      return <Badge variant="ghost">{status}</Badge>
  }
}

const getEnrollmentStatusBadge = (status: EnrollmentQueueItem["status"]) => {
  switch (status) {
    case "pending":
      return <Badge variant="warning-muted">Pendente</Badge>
    case "approved":
      return <Badge variant="success-muted">Aprovado</Badge>
    case "rejected":
      return <Badge variant="destructive-muted">Rejeitado</Badge>
    case "waiting_payment":
      return <Badge variant="info-muted">Aguardando Pagamento</Badge>
    default:
      return <Badge variant="ghost">{status}</Badge>
  }
}

export function StudentDetailsDialog({
  open,
  onOpenChange,
  student,
  dataMode = false,
}: StudentDetailsDialogProps) {
  const [activeTab, setActiveTab] = useState("profile")
  const showExtendedTabs = !dataMode

  if (!student) return null

  const financial: StudentFinancial | undefined = mockStudentFinancial[student.id]
  const history: StudentAccessLog[] = mockStudentHistory[student.id] || []
  const studentDocuments = mockDocumentRequests.filter(doc => doc.studentId === student.id)
  const studentEnrollments = mockEnrollmentQueue.filter(e => e.email === student.email)

  const handleDocumentAction = (action: string, doc: DocumentRequest) => {
    toast.success(`Ação "${action}" executada para documento ${doc.documentType}`)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={student.avatar} />
              <AvatarFallback className="text-lg">
                {student.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle className="text-xl">{student.name}</DialogTitle>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge variant={statusConfig[student.status].variant}>
                  {statusConfig[student.status].label}
                </Badge>
                {student.enrollments.slice(0, 2).map((enrollment) => (
                  <Badge key={enrollment.courseId} variant="outline" className="text-xs">
                    {enrollment.courseName}
                  </Badge>
                ))}
                {student.enrollments.length > 2 && (
                  <Badge variant="secondary" className="text-xs">
                    +{student.enrollments.length - 2} cursos
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className={showExtendedTabs ? "grid w-full grid-cols-6" : "grid w-full grid-cols-2"}>
            <TabsTrigger value="profile" className="gap-1 text-xs">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Perfil</span>
            </TabsTrigger>
            <TabsTrigger value="progress" className="gap-1 text-xs">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Progresso</span>
            </TabsTrigger>
            {showExtendedTabs && (
              <>
                <TabsTrigger value="financial" className="gap-1 text-xs">
                  <CreditCard className="h-4 w-4" />
                  <span className="hidden sm:inline">Financeiro</span>
                </TabsTrigger>
                <TabsTrigger value="documents" className="gap-1 text-xs">
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">Documentos</span>
                </TabsTrigger>
                <TabsTrigger value="enrollment" className="gap-1 text-xs">
                  <GraduationCap className="h-4 w-4" />
                  <span className="hidden sm:inline">Matrícula</span>
                </TabsTrigger>
                <TabsTrigger value="actions" className="gap-1 text-xs">
                  <History className="h-4 w-4" />
                  <span className="hidden sm:inline">Histórico</span>
                </TabsTrigger>
              </>
            )}
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="mt-4 space-y-4 min-h-[450px]">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Dados Pessoais</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{student.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Telefone</p>
                      <p className="font-medium">
                        {dataMode ? (
                          <span className="text-muted-foreground font-normal">Não cadastrado</span>
                        ) : (
                          "(11) 99999-9999"
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Data de Nascimento</p>
                      <p className="font-medium">
                        {dataMode ? (
                          <span className="text-muted-foreground font-normal">Não cadastrado</span>
                        ) : (
                          "15/03/1998"
                        )}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Informações Acadêmicas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <GraduationCap className="h-4 w-4 text-muted-foreground mt-1" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Cursos Matriculados</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {student.enrollments.map((enrollment) => (
                          <Badge key={enrollment.courseId} variant="outline">
                            {enrollment.courseName}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Primeira Matrícula</p>
                      <p className="font-medium">
                        {student.enrollments.length > 0 
                          ? format(new Date(student.enrollments[0].enrollmentDate), "dd/MM/yyyy", { locale: ptBR })
                          : "-"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Último Acesso</p>
                      <p className="font-medium">
                        {isValid(new Date(student.lastAccess))
                          ? formatDistanceToNow(new Date(student.lastAccess), {
                              addSuffix: true,
                              locale: ptBR,
                            })
                          : "—"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {!dataMode && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Ações Rápidas</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm">
                    <Send className="h-4 w-4 mr-2" />
                    Enviar Email
                  </Button>
                  <Button variant="outline" size="sm">
                    <KeyRound className="h-4 w-4 mr-2" />
                    Resetar Senha
                  </Button>
                  <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                    <Ban className="h-4 w-4 mr-2" />
                    Bloquear Aluno
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="progress" className="mt-4 space-y-4 min-h-[450px]">
            <ScrollArea className="h-[420px] pr-4">
              <div className="space-y-4">
                {student.enrollments.map((enrollment) => {
                  return (
                    <Card key={enrollment.courseId}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center justify-between">
                          <span>{enrollment.courseName}</span>
                          <Badge variant={enrollment.status === "active" ? "success" : "secondary"}>
                            {enrollment.status === "active" ? "Ativo" : 
                             enrollment.status === "completed" ? "Concluído" : 
                             enrollment.status === "cancelled" ? "Cancelado" : "Inativo"}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0 pb-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <Progress value={enrollment.progress} className="h-3" />
                          </div>
                          <span className="text-xl font-bold">{enrollment.progress}%</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1.5">
                          Matriculado em {format(new Date(enrollment.enrollmentDate), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </CardContent>
                    </Card>
                  )
                })}
                {student.enrollments.length === 0 && (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <GraduationCap className="h-12 w-12 text-muted-foreground/50 mb-4" />
                      <p className="font-medium">Nenhum curso matriculado</p>
                      <p className="text-sm text-muted-foreground">
                        Este aluno não está matriculado em nenhum curso
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {showExtendedTabs && (
            <>
          {/* Financial Tab */}
          <TabsContent value="financial" className="mt-4 space-y-4 min-h-[450px]">
            {financial ? (
              <>
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground">Total Pago</p>
                      <p className="text-2xl font-bold text-success">
                        {financial.totalPaid.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground">Saldo Devedor</p>
                      <p className="text-2xl font-bold">
                        {(financial.totalDue - financial.totalPaid).toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground">Status</p>
                      <Badge
                        variant={
                          financial.status === "regular"
                            ? "success"
                            : financial.status === "late"
                            ? "warning"
                            : "destructive"
                        }
                        className="mt-1"
                      >
                        {financial.status === "regular"
                          ? "Regular"
                          : financial.status === "late"
                          ? "Em Atraso"
                          : "Bloqueado"}
                      </Badge>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Parcelas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {financial.installments.map((installment) => {
                        const config = installmentStatusConfig[installment.status]
                        const StatusIcon = config.icon
                        return (
                          <div
                            key={installment.id}
                            className="flex items-center justify-between p-3 rounded-lg border"
                          >
                            <div className="flex items-center gap-3">
                              <StatusIcon className={`h-5 w-5 ${
                                installment.status === "paid"
                                  ? "text-success"
                                  : installment.status === "pending"
                                  ? "text-warning"
                                  : "text-destructive"
                              }`} />
                              <div>
                                <p className="font-medium">{installment.description}</p>
                                <p className="text-sm text-muted-foreground">
                                  Vencimento: {format(new Date(installment.dueDate), "dd/MM/yyyy")}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold">
                                {installment.amount.toLocaleString("pt-BR", {
                                  style: "currency",
                                  currency: "BRL",
                                })}
                              </p>
                              <Badge variant={config.variant}>{config.label}</Badge>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CreditCard className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="font-medium">Sem dados financeiros</p>
                  <p className="text-sm text-muted-foreground">
                    Informações financeiras não disponíveis para este aluno
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="mt-4 space-y-4 min-h-[450px]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Solicitações de Documentos</h3>
                <p className="text-sm text-muted-foreground">
                  {studentDocuments.length} solicitação(ões) encontrada(s)
                </p>
              </div>
              <Button size="sm">
                <FileText className="h-4 w-4 mr-2" />
                Nova Solicitação
              </Button>
            </div>

            {studentDocuments.length > 0 ? (
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {studentDocuments.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">{doc.documentType}</p>
                            <p className="text-sm text-muted-foreground">
                              Solicitado em {format(new Date(doc.requestDate), "dd/MM/yyyy", { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {getDocStatusBadge(doc.status)}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon-sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-popover">
                              {doc.status === "pending" && (
                                <DropdownMenuItem onClick={() => handleDocumentAction("processar", doc)}>
                                  <Loader2 className="mr-2 h-4 w-4" />
                                  Iniciar Processamento
                                </DropdownMenuItem>
                              )}
                              {doc.status === "processing" && (
                                <DropdownMenuItem onClick={() => handleDocumentAction("pronto", doc)}>
                                  <FileCheck className="mr-2 h-4 w-4" />
                                  Marcar como Pronto
                                </DropdownMenuItem>
                              )}
                              {doc.status === "ready" && (
                                <DropdownMenuItem onClick={() => handleDocumentAction("entregar", doc)}>
                                  <Send className="mr-2 h-4 w-4" />
                                  Marcar como Entregue
                                </DropdownMenuItem>
                              )}
                              {(doc.status === "pending" || doc.status === "processing") && (
                                <DropdownMenuItem
                                  onClick={() => handleDocumentAction("rejeitar", doc)}
                                  className="text-destructive"
                                >
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Rejeitar
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="font-medium">Nenhuma solicitação</p>
                  <p className="text-sm text-muted-foreground">
                    Este aluno não possui solicitações de documentos
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="enrollment" className="mt-4 space-y-4 min-h-[450px]">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Matrículas Ativas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {student.enrollments.map((enrollment) => (
                  <div 
                    key={enrollment.courseId}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                        enrollment.status === "active" ? "bg-primary/10" : "bg-muted"
                      }`}>
                        <GraduationCap className={`h-5 w-5 ${
                          enrollment.status === "active" ? "text-primary" : "text-muted-foreground"
                        }`} />
                      </div>
                      <div>
                        <p className="font-medium">{enrollment.courseName}</p>
                        <p className="text-sm text-muted-foreground">
                          Matriculado em {format(new Date(enrollment.enrollmentDate), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-medium">{enrollment.progress}%</p>
                        <p className="text-xs text-muted-foreground">progresso</p>
                      </div>
                      <Badge variant={
                        enrollment.status === "active" ? "success" : 
                        enrollment.status === "completed" ? "info" : "secondary"
                      }>
                        {enrollment.status === "active" ? "Ativo" : 
                         enrollment.status === "completed" ? "Concluído" : 
                         enrollment.status === "cancelled" ? "Cancelado" : "Inativo"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {studentEnrollments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Histórico de Matrículas/Rematrículas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {studentEnrollments.map((enrollment) => (
                      <div
                        key={enrollment.id}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                            enrollment.type === "new" ? "bg-primary/10" : "bg-info/10"
                          }`}>
                            {enrollment.type === "new" ? (
                              <GraduationCap className="h-5 w-5 text-primary" />
                            ) : (
                              <RefreshCw className="h-5 w-5 text-info" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">
                              {enrollment.type === "new" ? "Nova Matrícula" : "Rematrícula"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {enrollment.courseName} • {format(new Date(enrollment.requestDate), "dd/MM/yyyy", { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                        {getEnrollmentStatusBadge(enrollment.status)}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="actions" className="mt-4 min-h-[450px]">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Histórico de Atividades</CardTitle>
              </CardHeader>
              <CardContent>
                {history.length > 0 ? (
                  <ScrollArea className="h-[380px] pr-4">
                    <div className="space-y-4">
                      {history.map((log) => {
                        const ActionIcon = actionIcons[log.action] || History
                        return (
                          <div key={log.id} className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-muted">
                              <ActionIcon className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-sm">{log.description}</p>
                              {log.metadata?.lessonName && (
                                <p className="text-sm text-muted-foreground">
                                  {log.metadata.lessonName}
                                </p>
                              )}
                              {log.metadata?.quizName && (
                                <p className="text-sm text-muted-foreground">
                                  {log.metadata.quizName}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground mt-1">
                                {format(new Date(log.timestamp), "dd/MM/yyyy 'às' HH:mm", {
                                  locale: ptBR,
                                })}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <History className="h-12 w-12 text-muted-foreground/50 mb-4" />
                    <p className="font-medium">Sem histórico</p>
                    <p className="text-sm text-muted-foreground">
                      Nenhuma atividade registrada para este aluno
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
            </>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}