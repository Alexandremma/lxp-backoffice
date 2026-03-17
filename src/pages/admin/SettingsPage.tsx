import { useState } from "react"
import { AdminLayout } from "@/components/layout/AdminLayout"
import { PageHeader } from "@/components/layout/PageHeader"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import {
  mockInstitutionSettings,
  mockIntegrations,
  mockAuditLogs,
  AuditLog,
} from "@/lib/mock-data"
import {
  Building2,
  Mail,
  Globe,
  Save,
  Check,
  X,
  RefreshCw,
  Shield,
  Clock,
  User,
  Crown,
  CreditCard,
  Calendar,
  Users,
  HardDrive,
  Zap,
} from "lucide-react"
import { toast } from "sonner"

// Mock data for account and plan
const mockAccountData = {
  admin: {
    name: "Carlos Administrador",
    email: "admin@instituicao.edu.br",
    role: "Super Admin",
    createdAt: "2023-01-15",
    lastLogin: "2025-01-26T10:30:00",
  },
  plan: {
    name: "Profissional",
    status: "active",
    billingCycle: "monthly",
    price: 497,
    nextBillingDate: "2025-02-15",
    startDate: "2024-01-15",
  },
  usage: {
    students: { current: 342, limit: 500 },
    courses: { current: 12, limit: 25 },
    storage: { current: 15.2, limit: 50 }, // GB
    teamMembers: { current: 8, limit: 15 },
  },
  features: [
    { name: "Cursos ilimitados", included: false },
    { name: "Certificados personalizados", included: true },
    { name: "AI Tutor", included: true },
    { name: "Gamificação avançada", included: true },
    { name: "Relatórios avançados", included: true },
    { name: "API de integração", included: false },
    { name: "Suporte prioritário", included: true },
    { name: "White-label", included: false },
  ],
}

const SettingsPage = () => {
  const [settings, setSettings] = useState(mockInstitutionSettings)

  const handleSave = () => {
    toast.success("Configurações salvas com sucesso!")
  }

  const getActionColor = (action: AuditLog["action"]) => {
    switch (action) {
      case "create":
        return "text-success"
      case "update":
        return "text-info"
      case "delete":
        return "text-destructive"
      default:
        return "text-muted-foreground"
    }
  }

  return (
    <AdminLayout>
      <PageHeader
        title="Configurações Gerais"
        description="Dados da instituição e integrações"
      />

      <Tabs defaultValue="account" className="space-y-4">
        <TabsList>
          <TabsTrigger value="account">Conta & Plano</TabsTrigger>
          <TabsTrigger value="institution">Dados da Instituição</TabsTrigger>
          <TabsTrigger value="email">Configurações de Email</TabsTrigger>
          <TabsTrigger value="integrations">Integrações</TabsTrigger>
          <TabsTrigger value="audit">Logs de Auditoria</TabsTrigger>
        </TabsList>

        {/* Account & Plan Settings */}
        <TabsContent value="account" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Admin Account Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Conta do Administrador
                </CardTitle>
                <CardDescription>
                  Informações da sua conta administrativa
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{mockAccountData.admin.name}</h3>
                    <p className="text-sm text-muted-foreground">{mockAccountData.admin.email}</p>
                    <Badge variant="secondary" className="mt-1">
                      <Crown className="h-3 w-3 mr-1" />
                      {mockAccountData.admin.role}
                    </Badge>
                  </div>
                </div>
                <Separator />
                <div className="grid gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Membro desde</span>
                    <span>{new Date(mockAccountData.admin.createdAt).toLocaleDateString("pt-BR")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Último acesso</span>
                    <span>{new Date(mockAccountData.admin.lastLogin).toLocaleString("pt-BR")}</span>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm">Alterar Senha</Button>
                  <Button variant="outline" size="sm">Editar Perfil</Button>
                </div>
              </CardContent>
            </Card>

            {/* Current Plan Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-warning" />
                  Plano Atual
                </CardTitle>
                <CardDescription>
                  Detalhes da sua assinatura
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-2xl">{mockAccountData.plan.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Cobrança {mockAccountData.plan.billingCycle === "monthly" ? "mensal" : "anual"}
                    </p>
                  </div>
                  <Badge variant="success-muted">
                    <Check className="h-3 w-3 mr-1" />
                    Ativo
                  </Badge>
                </div>
                <div className="text-3xl font-bold">
                  R$ {mockAccountData.plan.price.toFixed(2)}
                  <span className="text-sm font-normal text-muted-foreground">/mês</span>
                </div>
                <Separator />
                <div className="grid gap-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Próxima cobrança
                    </span>
                    <span>{new Date(mockAccountData.plan.nextBillingDate).toLocaleDateString("pt-BR")}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Método de pagamento
                    </span>
                    <span>•••• 4242</span>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button size="sm">
                    <Zap className="h-4 w-4 mr-2" />
                    Fazer Upgrade
                  </Button>
                  <Button variant="outline" size="sm">Gerenciar Cobrança</Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Usage Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="h-5 w-5" />
                Uso do Plano
              </CardTitle>
              <CardDescription>
                Consumo atual dos recursos do seu plano
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      Alunos
                    </span>
                    <span className="text-muted-foreground">
                      {mockAccountData.usage.students.current}/{mockAccountData.usage.students.limit}
                    </span>
                  </div>
                  <Progress 
                    value={(mockAccountData.usage.students.current / mockAccountData.usage.students.limit) * 100} 
                    className="h-2"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      Cursos
                    </span>
                    <span className="text-muted-foreground">
                      {mockAccountData.usage.courses.current}/{mockAccountData.usage.courses.limit}
                    </span>
                  </div>
                  <Progress 
                    value={(mockAccountData.usage.courses.current / mockAccountData.usage.courses.limit) * 100} 
                    className="h-2"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <HardDrive className="h-4 w-4 text-muted-foreground" />
                      Armazenamento
                    </span>
                    <span className="text-muted-foreground">
                      {mockAccountData.usage.storage.current}GB/{mockAccountData.usage.storage.limit}GB
                    </span>
                  </div>
                  <Progress 
                    value={(mockAccountData.usage.storage.current / mockAccountData.usage.storage.limit) * 100} 
                    className="h-2"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      Equipe
                    </span>
                    <span className="text-muted-foreground">
                      {mockAccountData.usage.teamMembers.current}/{mockAccountData.usage.teamMembers.limit}
                    </span>
                  </div>
                  <Progress 
                    value={(mockAccountData.usage.teamMembers.current / mockAccountData.usage.teamMembers.limit) * 100} 
                    className="h-2"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Features Card */}
          <Card>
            <CardHeader>
              <CardTitle>Recursos do Plano</CardTitle>
              <CardDescription>
                Funcionalidades incluídas no plano {mockAccountData.plan.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                {mockAccountData.features.map((feature) => (
                  <div
                    key={feature.name}
                    className={`flex items-center gap-2 p-3 rounded-lg ${
                      feature.included ? "bg-success/10" : "bg-muted/50"
                    }`}
                  >
                    {feature.included ? (
                      <Check className="h-4 w-4 text-success" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className={feature.included ? "" : "text-muted-foreground"}>
                      {feature.name}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Institution Settings */}
        <TabsContent value="institution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Dados da Instituição
              </CardTitle>
              <CardDescription>
                Informações básicas da instituição de ensino
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nome da Instituição</Label>
                  <Input
                    value={settings.name}
                    onChange={(e) =>
                      setSettings({ ...settings, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>CNPJ</Label>
                  <Input
                    value={settings.cnpj}
                    onChange={(e) =>
                      setSettings({ ...settings, cnpj: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Email de Contato</Label>
                  <Input
                    type="email"
                    value={settings.email}
                    onChange={(e) =>
                      setSettings({ ...settings, email: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input
                    value={settings.phone}
                    onChange={(e) =>
                      setSettings({ ...settings, phone: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Endereço</Label>
                <Textarea
                  value={settings.address}
                  onChange={(e) =>
                    setSettings({ ...settings, address: e.target.value })
                  }
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Website</Label>
                <Input
                  value={settings.website}
                  onChange={(e) =>
                    setSettings({ ...settings, website: e.target.value })
                  }
                />
              </div>
              <Separator />
              <div className="space-y-4">
                <Label className="text-base font-semibold">Logo da Instituição</Label>
                <div className="flex items-center gap-4">
                  <div className="h-20 w-20 rounded-lg bg-muted flex items-center justify-center">
                    <Building2 className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <div>
                    <Button variant="outline">Alterar Logo</Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      PNG ou JPG. Máximo 2MB.
                    </p>
                  </div>
                </div>
              </div>
              <Button onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" />
                Salvar Alterações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Settings */}
        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Configurações de Email
              </CardTitle>
              <CardDescription>
                Configure o servidor SMTP para envio de emails
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Servidor SMTP</Label>
                  <Input
                    value={settings.smtp.host}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        smtp: { ...settings.smtp, host: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Porta</Label>
                  <Input
                    value={settings.smtp.port}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        smtp: { ...settings.smtp, port: e.target.value },
                      })
                    }
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Usuário</Label>
                  <Input
                    value={settings.smtp.user}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        smtp: { ...settings.smtp, user: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Senha</Label>
                  <Input
                    type="password"
                    value={settings.smtp.password}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        smtp: { ...settings.smtp, password: e.target.value },
                      })
                    }
                  />
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div className="space-y-0.5">
                  <Label>SSL/TLS</Label>
                  <p className="text-sm text-muted-foreground">
                    Usar conexão segura
                  </p>
                </div>
                <Switch
                  checked={settings.smtp.secure}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      smtp: { ...settings.smtp, secure: checked },
                    })
                  }
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave}>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar
                </Button>
                <Button variant="outline" onClick={() => toast.success("Email de teste enviado!")}>
                  Enviar Email de Teste
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations */}
        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Integrações
              </CardTitle>
              <CardDescription>
                Gerencie conexões com serviços externos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockIntegrations.map((integration) => (
                  <div
                    key={integration.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/30"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-background flex items-center justify-center border">
                        <span className="text-xl">{integration.icon}</span>
                      </div>
                      <div>
                        <h4 className="font-semibold">{integration.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {integration.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {integration.status === "connected" ? (
                        <Badge variant="success-muted" className="gap-1">
                          <Check className="h-3 w-3" />
                          Conectado
                        </Badge>
                      ) : integration.status === "error" ? (
                        <Badge variant="destructive-muted" className="gap-1">
                          <X className="h-3 w-3" />
                          Erro
                        </Badge>
                      ) : (
                        <Badge variant="ghost">Desconectado</Badge>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toast.success(`${integration.name} sincronizado!`)}
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        {integration.status === "connected" ? "Sincronizar" : "Conectar"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Logs */}
        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Logs de Auditoria
              </CardTitle>
              <CardDescription>
                Histórico de ações administrativas no sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                <div className="p-4 space-y-2">
                  {mockAuditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start gap-4 p-4 rounded-lg bg-muted/30"
                    >
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{log.userName}</span>
                          <span className={`text-sm ${getActionColor(log.action)}`}>
                            {log.action === "create"
                              ? "criou"
                              : log.action === "update"
                              ? "atualizou"
                              : log.action === "delete"
                              ? "excluiu"
                              : "visualizou"}
                          </span>
                          <span className="text-sm">{log.resource}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {log.details}
                        </p>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(log.timestamp).toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                        <div>{new Date(log.timestamp).toLocaleDateString("pt-BR")}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  )
}

export default SettingsPage
