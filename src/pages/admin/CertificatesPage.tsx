import { useEffect, useMemo, useState } from "react"
import { AdminLayout } from "@/components/layout/AdminLayout"
import { PageHeader } from "@/components/layout/PageHeader"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { SkeletonStatCards, SkeletonTable } from "@/components/ui/skeleton"

import { useCertificateTemplatesAdmin } from "@/hooks/queries/useCertificateTemplatesAdmin"
import { useCertificateSignaturesAdmin } from "@/hooks/queries/useCertificateSignaturesAdmin"
import { useCertificateIssuesAdmin } from "@/hooks/queries/useCertificateIssuesAdmin"
import {
  useCreateCertificateTemplateAdmin,
  useSetDefaultCertificateTemplateAdmin,
  useUpdateCertificateTemplateAdmin,
} from "@/hooks/mutations/useCertificateTemplateMutationsAdmin"
import { buildCertificateTemplatePreviewPayload } from "@/services/certificatesAdminService"
import type {
  CertificateSignatureRow,
  CertificateTemplateRow,
} from "@/types/certificates"
import { downloadCertificatePdfFile } from "@/lib/certificatePdfDownload"
import { useTemplateSignatureSlots } from "@/hooks/mutations/useTemplateSignatureMutationsAdmin"

import { usePermission } from "@/hooks/usePermission"
import { TemplateEditorDialog } from "@/components/admin/certificates/TemplateEditorDialog"
import { SignatureFormDialog } from "@/components/admin/certificates/SignatureLibrary"
import { CertificatesStatsRow } from "@/components/admin/certificates/CertificatesStatsRow"
import { NewTemplateDialog } from "@/components/admin/certificates/NewTemplateDialog"
import { TemplatePreviewDialog } from "@/components/admin/certificates/TemplatePreviewDialog"
import { TemplatesTab } from "@/components/admin/certificates/TemplatesTab"
import { EmissionsTab } from "@/components/admin/certificates/EmissionsTab"
import { SignaturesTab } from "@/components/admin/certificates/SignaturesTab"

const CertificatesPage = () => {
  const { can } = usePermission()
  const canEditTemplates = can("certificados.template_editar")
  const canEmit = can("certificados.emitir")

  const [previewTemplate, setPreviewTemplate] = useState<CertificateTemplateRow | null>(null)
  const [editingTemplate, setEditingTemplate] = useState<CertificateTemplateRow | null>(null)
  const [newTemplateOpen, setNewTemplateOpen] = useState(false)
  const [newTemplateName, setNewTemplateName] = useState("")
  const [newTemplateInstitution, setNewTemplateInstitution] = useState("B42 Edtech")
  const [newTemplateLayoutKind, setNewTemplateLayoutKind] = useState<"default" | "custom">("default")
  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false)
  const [editingSignature, setEditingSignature] = useState<CertificateSignatureRow | null>(null)

  const templatesQ = useCertificateTemplatesAdmin()
  const signaturesQ = useCertificateSignaturesAdmin()
  const issuesQ = useCertificateIssuesAdmin()
  const previewSlotsQ = useTemplateSignatureSlots(previewTemplate?.id)
  const createTemplate = useCreateCertificateTemplateAdmin()
  const updateTemplate = useUpdateCertificateTemplateAdmin()
  const setDefaultTemplate = useSetDefaultCertificateTemplateAdmin()

  const templates = templatesQ.data ?? []
  const signatures = signaturesQ.data ?? []
  const issues = useMemo(() => issuesQ.data ?? [], [issuesQ.data])

  useEffect(() => {
    if (!templatesQ.data) return
    if (editingTemplate?.id) {
      const fresh = templatesQ.data.find((t) => t.id === editingTemplate.id)
      if (
        fresh &&
        (fresh.background_image_path !== editingTemplate.background_image_path ||
          fresh.institution_logo_path !== editingTemplate.institution_logo_path ||
          fresh.updated_at !== editingTemplate.updated_at)
      ) {
        setEditingTemplate(fresh)
      }
    }
    if (previewTemplate?.id) {
      const fresh = templatesQ.data.find((t) => t.id === previewTemplate.id)
      if (
        fresh &&
        (fresh.background_image_path !== previewTemplate.background_image_path ||
          fresh.institution_logo_path !== previewTemplate.institution_logo_path ||
          fresh.updated_at !== previewTemplate.updated_at)
      ) {
        setPreviewTemplate(fresh)
      }
    }
  }, [templatesQ.data, editingTemplate, previewTemplate])

  const previewPayload = useMemo(() => {
    if (!previewTemplate) return null
    return buildCertificateTemplatePreviewPayload({
      template: previewTemplate,
      slots: previewSlotsQ.data ?? [],
    })
  }, [previewTemplate, previewSlotsQ.data])

  const now = new Date()
  const thisMonthEmissions = issues.filter((i) => {
    const date = new Date(i.issued_at)
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
  }).length

  const loading = templatesQ.isLoading || signaturesQ.isLoading || issuesQ.isLoading
  const errorMsg =
    templatesQ.error?.message ?? signaturesQ.error?.message ?? issuesQ.error?.message

  const handleCreateTemplate = async () => {
    const name = newTemplateName.trim()
    if (!name) {
      toast.error("Informe o nome do template.")
      return
    }
    try {
      const created = await createTemplate.mutateAsync({
        name,
        institution_name: newTemplateInstitution.trim() || "B42 Edtech",
        layout_kind: newTemplateLayoutKind,
      })
      toast.success("Template criado. Abra o editor para personalizar.")
      setNewTemplateOpen(false)
      setNewTemplateName("")
      setNewTemplateInstitution("B42 Edtech")
      setNewTemplateLayoutKind("default")
      setEditingTemplate(created)
    } catch (e) {
      toast.error("Não foi possível criar o template.")
      console.error(e)
    }
  }

  const handleToggleTemplate = async (t: CertificateTemplateRow, next: boolean) => {
    try {
      await updateTemplate.mutateAsync({ id: t.id, patch: { is_active: next } })
      toast.success(next ? "Template ativado." : "Template inativado.")
    } catch (e) {
      toast.error("Não foi possível atualizar o template.")
      console.error(e)
    }
  }

  const handleSetDefaultTemplate = async (template: CertificateTemplateRow) => {
    try {
      await setDefaultTemplate.mutateAsync(template.id)
      toast.success(`"${template.name}" virou o template padrão das emissões.`)
    } catch (e) {
      toast.error("Não foi possível definir o template padrão.")
      console.error(e)
    }
  }

  return (
    <AdminLayout>
      <PageHeader
        title="Certificados"
        description="Templates institucionais, biblioteca de assinaturas e histórico de emissões."
      />

      {loading ? (
        <div className="space-y-6">
          <SkeletonStatCards className="mb-2" />
          <SkeletonTable rows={6} columns={5} />
        </div>
      ) : errorMsg ? (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive text-base">Erro ao carregar dados</CardTitle>
            <CardDescription>{errorMsg}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                void templatesQ.refetch()
                void signaturesQ.refetch()
                void issuesQ.refetch()
              }}
            >
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <CertificatesStatsRow
            templatesCount={templates.length}
            issuesCount={issues.length}
            thisMonthEmissions={thisMonthEmissions}
            signaturesCount={signatures.length}
          />

          <Tabs defaultValue="templates" className="space-y-4">
            <TabsList>
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="emissions">Histórico de emissões</TabsTrigger>
              <TabsTrigger value="signatures">Biblioteca de assinaturas</TabsTrigger>
            </TabsList>

            <TabsContent value="templates" className="space-y-4">
              <TemplatesTab
                templates={templates}
                canEditTemplates={canEditTemplates}
                onNewTemplate={() => setNewTemplateOpen(true)}
                onPreview={setPreviewTemplate}
                onEdit={setEditingTemplate}
                onSetDefault={(template) => void handleSetDefaultTemplate(template)}
                onToggleActive={(template, next) => void handleToggleTemplate(template, next)}
                disabled={updateTemplate.isPending || setDefaultTemplate.isPending}
              />
            </TabsContent>

            <TabsContent value="emissions" className="space-y-4">
              <EmissionsTab issues={issues} canEmit={canEmit} />
            </TabsContent>

            <TabsContent value="signatures" className="space-y-4">
              <SignaturesTab
                signatures={signatures}
                onNew={() => {
                  setEditingSignature(null)
                  setSignatureDialogOpen(true)
                }}
                onEdit={(sig) => {
                  setEditingSignature(sig)
                  setSignatureDialogOpen(true)
                }}
              />
            </TabsContent>
          </Tabs>

          <NewTemplateDialog
            open={newTemplateOpen}
            onOpenChange={(o) => {
              setNewTemplateOpen(o)
              if (!o) {
                setNewTemplateName("")
                setNewTemplateInstitution("B42 Edtech")
                setNewTemplateLayoutKind("default")
              }
            }}
            name={newTemplateName}
            onNameChange={setNewTemplateName}
            institution={newTemplateInstitution}
            onInstitutionChange={setNewTemplateInstitution}
            layoutKind={newTemplateLayoutKind}
            onLayoutKindChange={setNewTemplateLayoutKind}
            onCreate={() => void handleCreateTemplate()}
            onCancel={() => setNewTemplateOpen(false)}
            isPending={createTemplate.isPending}
          />

          <TemplatePreviewDialog
            open={!!previewTemplate}
            templateName={previewTemplate?.name}
            payload={previewPayload}
            onOpenChange={(o) => !o && setPreviewTemplate(null)}
            onDownloadPdf={() => {
              if (!previewPayload) return
              void downloadCertificatePdfFile(previewPayload).catch((e) => {
                toast.error("Não foi possível baixar o PDF.")
                console.error(e)
              })
            }}
          />

          <TemplateEditorDialog
            open={!!editingTemplate}
            template={editingTemplate}
            signaturesLibrary={signatures}
            onOpenChange={(o) => !o && setEditingTemplate(null)}
          />

          <SignatureFormDialog
            open={signatureDialogOpen}
            signature={editingSignature}
            onOpenChange={(o) => {
              setSignatureDialogOpen(o)
              if (!o) setEditingSignature(null)
            }}
          />
        </>
      )}
    </AdminLayout>
  )
}

export default CertificatesPage
