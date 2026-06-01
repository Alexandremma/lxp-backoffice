import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/consts/queryKeys"
import { getInstitutionSetting } from "@/services/institutionSettingsService"
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
import { InstitutionSettingsCard } from "@/components/admin/settings/InstitutionSettingsCard"
import { SettingsGeneralTab } from "@/components/admin/settings/SettingsGeneralTab"
import { mockAuditLogs, type AuditLog } from "@/lib/mock-data"
import type { SmtpSettingsValue } from "@/types/settings"
import { Mail, Save, Shield, Clock, User } from "lucide-react"
import { toast } from "sonner"

const defaultSmtpDraft: SmtpSettingsValue & { password?: string } = {
  enabled: false,
  host: "",
  port: 587,
  user: "",
  fromEmail: "",
  fromName: "LXP Instituição",
  secure: true,
  password: "",
}

const SettingsPage = () => {
  const [smtpDraft, setSmtpDraft] = useState(defaultSmtpDraft)

  const { data: smtpFromDb } = useQuery({
    queryKey: queryKeys.settings.smtp,
    queryFn: () => getInstitutionSetting<SmtpSettingsValue>("smtp"),
  })

  useEffect(() => {
    if (!smtpFromDb) return
    setSmtpDraft((prev) => ({
      ...prev,
      ...smtpFromDb,
      port: smtpFromDb.port ?? 587,
      password: "",
    }))
  }, [smtpFromDb])

  const handleSaveSmtp = () => {
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
          <SettingsGeneralTab />
        </TabsContent>

        <TabsContent value="institution" className="space-y-4">
          <InstitutionSettingsCard />
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
                    value={smtpDraft.host}
                    placeholder="Servidor SMTP"
                    onChange={(e) => setSmtpDraft({ ...smtpDraft, host: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Porta</Label>
                  <Input
                    value={String(smtpDraft.port)}
                    placeholder="Porta"
                    onChange={(e) =>
                      setSmtpDraft({ ...smtpDraft, port: Number(e.target.value) || 587 })
                    }
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Usuário</Label>
                  <Input
                    value={smtpDraft.user}
                    placeholder="Usuário SMTP"
                    onChange={(e) => setSmtpDraft({ ...smtpDraft, user: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Senha</Label>
                  <Input
                    type="password"
                    value={smtpDraft.password ?? ""}
                    placeholder="Senha SMTP"
                    onChange={(e) => setSmtpDraft({ ...smtpDraft, password: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div className="space-y-0.5">
                  <Label>SSL/TLS</Label>
                  <p className="text-sm text-muted-foreground">Usar conexão segura</p>
                </div>
                <Switch
                  checked={smtpDraft.secure ?? true}
                  onCheckedChange={(checked) => setSmtpDraft({ ...smtpDraft, secure: checked })}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveSmtp}>
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

    </AdminLayout>
  )
}

export default SettingsPage
