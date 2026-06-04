import { AdminLayout } from "@/components/layout/AdminLayout"
import { PageHeader } from "@/components/layout/PageHeader"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AuditLogsTab } from "@/components/admin/settings/AuditLogsTab"
import { InstitutionSettingsCard } from "@/components/admin/settings/InstitutionSettingsCard"
import { SettingsGeneralTab } from "@/components/admin/settings/SettingsGeneralTab"
import { SmtpSettingsCard } from "@/components/admin/settings/SmtpSettingsCard"

const SettingsPage = () => {
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
          <SmtpSettingsCard />
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <AuditLogsTab />
        </TabsContent>
      </Tabs>
    </AdminLayout>
  )
}

export default SettingsPage
