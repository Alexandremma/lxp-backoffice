import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/consts/queryKeys"
import { getInstitutionSetting } from "@/services/institutionSettingsService"
import { AdminLayout } from "@/components/layout/AdminLayout"
import { PageHeader } from "@/components/layout/PageHeader"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AuditLogsTab } from "@/components/admin/settings/AuditLogsTab"
import { InstitutionSettingsCard } from "@/components/admin/settings/InstitutionSettingsCard"
import { SettingsGeneralTab } from "@/components/admin/settings/SettingsGeneralTab"
import type { SmtpSettingsValue } from "@/types/settings"
import { Mail, Save } from "lucide-react"
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
          <AuditLogsTab />
        </TabsContent>
      </Tabs>

    </AdminLayout>
  )
}

export default SettingsPage
