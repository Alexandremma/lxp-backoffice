import { useState } from "react"
import { AdminLayout } from "@/components/layout/AdminLayout"
import { PageHeader } from "@/components/layout/PageHeader"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  mockAITutorConfig,
  mockAIConversationLogs,
  mockKnowledgeBase,
  AIConversationLog,
} from "@/lib/mock-data"
import {
  Bot,
  MessageSquare,
  FileText,
  Settings,
  Save,
  Plus,
  Trash2,
  ThumbsUp,
  ThumbsDown,
  Clock,
} from "lucide-react"
import { toast } from "sonner"

const AITutorPage = () => {
  const [config, setConfig] = useState(mockAITutorConfig)
  const [selectedLog, setSelectedLog] = useState<AIConversationLog | null>(null)

  const handleSaveConfig = () => {
    toast.success("Configurações salvas com sucesso!")
  }

  const getSatisfactionIcon = (rating: AIConversationLog["satisfaction"]) => {
    switch (rating) {
      case "positive":
        return <ThumbsUp className="h-4 w-4 text-success" />
      case "negative":
        return <ThumbsDown className="h-4 w-4 text-destructive" />
      default:
        return null
    }
  }

  const totalConversations = mockAIConversationLogs.length
  const avgResponseTime = Math.round(
    mockAIConversationLogs.reduce((acc, log) => acc + log.responseTime, 0) /
      totalConversations
  )
  const satisfactionRate = Math.round(
    (mockAIConversationLogs.filter((log) => log.satisfaction === "positive").length /
      mockAIConversationLogs.filter((log) => log.satisfaction).length) *
      100
  )

  return (
    <AdminLayout>
      <PageHeader
        title="AI Tutor"
        description="Configure prompts e base de conhecimento do tutor"
      />

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalConversations}</p>
                <p className="text-sm text-muted-foreground">Conversas Hoje</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold">{avgResponseTime}s</p>
                <p className="text-sm text-muted-foreground">Tempo Médio</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                <ThumbsUp className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{satisfactionRate}%</p>
                <p className="text-sm text-muted-foreground">Satisfação</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockKnowledgeBase.length}</p>
                <p className="text-sm text-muted-foreground">Documentos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="prompts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="prompts">Prompts</TabsTrigger>
          <TabsTrigger value="knowledge">Base de Conhecimento</TabsTrigger>
          <TabsTrigger value="logs">Logs de Conversas</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        {/* Prompts */}
        <TabsContent value="prompts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Prompt do Sistema</CardTitle>
              <CardDescription>
                Define o comportamento e personalidade do AI Tutor
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Prompt Principal</Label>
                <Textarea
                  rows={8}
                  value={config.systemPrompt}
                  onChange={(e) =>
                    setConfig({ ...config, systemPrompt: e.target.value })
                  }
                  placeholder="Você é um tutor educacional especializado..."
                />
              </div>
              <div className="space-y-2">
                <Label>Tom de Voz</Label>
                <Select
                  value={config.tone}
                  onValueChange={(value) => setConfig({ ...config, tone: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="formal">Formal</SelectItem>
                    <SelectItem value="friendly">Amigável</SelectItem>
                    <SelectItem value="professional">Profissional</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Instruções Adicionais</Label>
                <Textarea
                  rows={4}
                  value={config.additionalInstructions}
                  onChange={(e) =>
                    setConfig({ ...config, additionalInstructions: e.target.value })
                  }
                  placeholder="Instruções específicas para o tutor..."
                />
              </div>
              <Button onClick={handleSaveConfig}>
                <Save className="mr-2 h-4 w-4" />
                Salvar Alterações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Knowledge Base */}
        <TabsContent value="knowledge" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Base de Conhecimento</CardTitle>
                  <CardDescription>
                    Documentos e materiais que o tutor pode consultar
                  </CardDescription>
                </div>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Documento
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockKnowledgeBase.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/30"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{doc.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {doc.type} • {doc.size} • Atualizado em{" "}
                          {new Date(doc.updatedAt).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={doc.indexed ? "success-muted" : "warning-muted"}>
                        {doc.indexed ? "Indexado" : "Pendente"}
                      </Badge>
                      <Button variant="ghost" size="icon-sm">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Conversation Logs */}
        <TabsContent value="logs" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Conversas Recentes</CardTitle>
                <CardDescription>Histórico de interações com alunos</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[400px]">
                  <div className="p-4 space-y-2">
                    {mockAIConversationLogs.map((log) => (
                      <div
                        key={log.id}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedLog?.id === log.id
                            ? "bg-primary/10"
                            : "bg-muted/30 hover:bg-muted/50"
                        }`}
                        onClick={() => setSelectedLog(log)}
                      >
                        <div className="flex items-start justify-between mb-1">
                          <p className="font-medium text-sm">{log.studentName}</p>
                          <div className="flex items-center gap-2">
                            {getSatisfactionIcon(log.satisfaction)}
                            <span className="text-xs text-muted-foreground">
                              {new Date(log.timestamp).toLocaleTimeString("pt-BR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {log.question}
                        </p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detalhes da Conversa</CardTitle>
                <CardDescription>
                  {selectedLog
                    ? `Conversa com ${selectedLog.studentName}`
                    : "Selecione uma conversa"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedLog ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="text-xs font-medium">A</span>
                        </div>
                        <span className="font-medium text-sm">Aluno</span>
                      </div>
                      <p className="text-sm">{selectedLog.question}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                          <Bot className="h-4 w-4 text-primary-foreground" />
                        </div>
                        <span className="font-medium text-sm">AI Tutor</span>
                      </div>
                      <p className="text-sm">{selectedLog.response}</p>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground pt-4 border-t">
                      <span>Tempo de resposta: {selectedLog.responseTime}s</span>
                      <span>Curso: {selectedLog.courseName}</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mb-4 opacity-50" />
                    <p>Selecione uma conversa para ver os detalhes</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Settings */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações Gerais</CardTitle>
              <CardDescription>
                Ajuste o comportamento do AI Tutor
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>AI Tutor Ativo</Label>
                  <p className="text-sm text-muted-foreground">
                    Habilita ou desabilita o tutor para todos os alunos
                  </p>
                </div>
                <Switch
                  checked={config.enabled}
                  onCheckedChange={(checked) =>
                    setConfig({ ...config, enabled: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Coletar Feedback</Label>
                  <p className="text-sm text-muted-foreground">
                    Solicita avaliação ao final de cada conversa
                  </p>
                </div>
                <Switch
                  checked={config.collectFeedback}
                  onCheckedChange={(checked) =>
                    setConfig({ ...config, collectFeedback: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Limite de Mensagens</Label>
                  <p className="text-sm text-muted-foreground">
                    Máximo de mensagens por conversa
                  </p>
                </div>
                <Input
                  type="number"
                  value={config.messageLimit}
                  onChange={(e) =>
                    setConfig({ ...config, messageLimit: Number(e.target.value) })
                  }
                  className="w-20"
                />
              </div>
              <Button onClick={handleSaveConfig}>
                <Save className="mr-2 h-4 w-4" />
                Salvar Configurações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  )
}

export default AITutorPage
