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
import { PlanUpgradeDialog } from "@/components/admin/settings/PlanUpgradeDialog"
import { mockInstitutionSettings, mockAuditLogs, type AuditLog } from "@/lib/mock-data"
import {
  Building2,
  Mail,
  Save,
  Check,
  Shield,
  Clock,
  User,
  Crown,
  Users,
  Zap,
  BarChart3,
} from "lucide-react"
import { toast } from "sonner"

const CURRENT_PLAN_ID = "professional"

const mockAccountData = {
  admin: {
    name: "Carlos Administrador",
    email: "admin@instituicao.edu.br",
    role: "Super Admin",
    createdAt: "2023-01-15",
    lastLogin: "2025-01-26T10:30:00",
  },
  plan: {
    id: CURRENT_PLAN_ID,
    name: "Profissional",
    status: "active",
    billingCycle: "monthly" as const,
    price: 497,
    startDate: "2024-01-15",
  },
  usage: {
    students: { current: 342, limit: 500 },
    courses: { current: 12, limit: 25 },
    teamMembers: { current: 8, limit: 15 },
  },
  features: [
    { name: "Certificados personalizados", included: true },
    { name: "Gamificação avançada", included: true },
    { name: "AI Tutor", included: true },
    { name: "Cursos ilimitados", included: false },
  ],
}

const SettingsPage = () => {
  const [settings, setSettings] = useState(mockInstitutionSettings)
  const [upgradeOpen, setUpgradeOpen] = useState(false)

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

  const getActionLabel = (action: AuditLog["action"]) => {
    switch (action) {
      case "create":
        return "criou"
      case "update":
        return "atualizou"
      case "delete":
        return "excluiu"
      default:
        return "registrou"
    }
  }

  return (
    <AdminLayout>
      <PageHeader
        title="Configurações Gerais"
        description="Plano, dados da instituição, e-mail e auditoria do Back Office"
      />

      <Tabs defaultValue="account" className="space-y-4">
        <TabsList>
          <TabsTrigger value="account">Geral</TabsTrigger>
          <TabsTrigger value="institution">Dados da Instituição</TabsTrigger>
          <TabsTrigger value="email">Configurações de Email</TabsTrigger>
          <TabsTrigger value="audit">Logs de Auditoria</TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Conta do Administrador
                </CardTitle>
                <CardDescription>Informações da sua conta administrativa</CardDescription>
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
                    <span>
                      {new Date(mockAccountData.admin.createdAt).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Último acesso</span>
                    <span>
                      {new Date(mockAccountData.admin.lastLogin).toLocaleString("pt-BR")}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm">
                    Alterar Senha
                  </Button>
                  <Button variant="outline" size="sm">
                    Editar Perfil
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-warning" />
                  Plano Atual
                </CardTitle>
                <CardDescription>Resumo do plano contratado</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-2xl">{mockAccountData.plan.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Cobrança{" "}
                      {mockAccountData.plan.billingCycle === "monthly" ? "mensal" : "anual"}
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
                <div className="pt-2">
                  <Button size="sm" onClick={() => setUpgradeOpen(true)}>
                    <Zap className="h-4 w-4 mr-2" />
                    Fazer Upgrade
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Uso do Plano
              </CardTitle>
              <CardDescription>Consumo atual dos recursos do seu plano</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-3">
                <UsageMeter
                  icon={Users}
                  label="Alunos"
                  current={mockAccountData.usage.students.current}
                  limit={mockAccountData.usage.students.limit}
                />
                <UsageMeter
                  icon={Building2}
                  label="Cursos"
                  current={mockAccountData.usage.courses.current}
                  limit={mockAccountData.usage.courses.limit}
                />
                <UsageMeter
                  icon={User}
                  label="Equipe"
                  current={mockAccountData.usage.teamMembers.current}
                  limit={mockAccountData.usage.teamMembers.limit}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recursos do Plano</CardTitle>
              <CardDescription>
                Funcionalidades incluídas no plano {mockAccountData.plan.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2">
                {mockAccountData.features.map((feature) => (
                  <div
                    key={feature.name}
                    className={`flex items-center gap-2 p-3 rounded-lg ${
                      feature.included ? "bg-success/10" : "bg-muted/50"
                    }`}
                  >
                    <Check
                      className={`h-4 w-4 ${feature.included ? "text-success" : "text-muted-foreground opacity-40"}`}
                    />
                    <span className={feature.included ? "" : "text-muted-foreground"}>
                      {feature.name}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="institution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Dados da Instituição
              </CardTitle>
              <CardDescription>Informações básicas da instituição de ensino</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nome da Instituição</Label>
                  <Input
                    value={settings.name}
                    onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>CNPJ</Label>
                  <Input
                    value={settings.cnpj}
                    onChange={(e) => setSettings({ ...settings, cnpj: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Email de Contato</Label>
                  <Input
                    type="email"
                    value={settings.email}
                    onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input
                    value={settings.phone}
                    onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Endereço</Label>
                <Textarea
                  value={settings.address}
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                  rows={2}
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
                    <Button variant="outline" type="button">
                      Alterar Logo
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      PNG ou JPG. Máximo 2MB. (Persistência em versão futura.)
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

        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Configurações de Email
              </CardTitle>
              <CardDescription>Configure o servidor SMTP para envio de emails</CardDescription>
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
                  <p className="text-sm text-muted-foreground">Usar conexão segura</p>
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

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Logs de Auditoria
              </CardTitle>
              <CardDescription>
                Histórico de ações administrativas realizadas no Back Office.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="px-6 pb-4">
                <Badge variant="outline" className="text-muted-foreground font-normal">
                  Dados de demonstração — persistência em `lxp_audit_logs` (próxima etapa)
                </Badge>
              </div>
              <ScrollArea className="h-[500px]">
                <div className="p-4 pt-0 space-y-2">
                  {mockAuditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start gap-4 p-4 rounded-lg bg-muted/30"
                    >
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-medium">{log.userName}</span>
                          <span className={`text-sm ${getActionColor(log.action)}`}>
                            {getActionLabel(log.action)}
                          </span>
                          <span className="text-sm text-muted-foreground">{log.resource}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{log.details}</p>
                      </div>
                      <div className="text-right text-sm text-muted-foreground shrink-0">
                        <div className="flex items-center gap-1 justify-end">
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

      <PlanUpgradeDialog
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        currentPlanId={mockAccountData.plan.id}
      />
    </AdminLayout>
  )
}

function UsageMeter({
  icon: Icon,
  label,
  current,
  limit,
}: {
  icon: typeof Users
  label: string
  current: number
  limit: number
}) {
  const percent = limit > 0 ? Math.min(100, (current / limit) * 100) : 0
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {label}
        </span>
        <span className="text-muted-foreground">
          {current}/{limit}
        </span>
      </div>
      <Progress value={percent} className="h-2" />
    </div>
  )
}

export default SettingsPage
