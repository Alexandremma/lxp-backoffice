import { useMemo, useState } from "react"
import { AdminLayout } from "@/components/layout/AdminLayout"
import { PageHeader } from "@/components/layout/PageHeader"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DataTable, Column } from "@/components/ui/data-table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Award, Calendar, Download, Edit, FileText, Loader2, Plus, Search, User } from "lucide-react"
import { toast } from "sonner"

import { useCertificateTemplatesAdmin } from "@/hooks/queries/useCertificateTemplatesAdmin"
import { useCertificateSignaturesAdmin } from "@/hooks/queries/useCertificateSignaturesAdmin"
import { useCertificateIssuesAdmin } from "@/hooks/queries/useCertificateIssuesAdmin"
import {
  useCreateCertificateTemplateAdmin,
  useSetDefaultCertificateTemplateAdmin,
  useUpdateCertificateTemplateAdmin,
} from "@/hooks/mutations/useCertificateTemplateMutationsAdmin"
import {
  buildCertificateTemplatePreviewPayload,
  enrichSnapshotRecord,
  type CertificateIssueAdminRow,
  type CertificateSignatureRow,
  type CertificateTemplateRow,
} from "@/services/certificatesAdminService"
import { openCertificatePrintWindow, snapshotRecordToPrintPayload } from "@/lib/certificatePrint"
import { useTemplateSignatureSlots } from "@/hooks/mutations/useTemplateSignatureMutationsAdmin"

import { RequirePermission } from "@/components/auth/RequirePermission"
import { usePermission } from "@/hooks/usePermission"
import { TemplateCard } from "@/components/admin/certificates/TemplateCard"
import { TemplateEditorDialog } from "@/components/admin/certificates/TemplateEditorDialog"
import {
  SignatureFormDialog,
  SignatureLibraryGrid,
} from "@/components/admin/certificates/SignatureLibrary"
import { CertificatePreviewFrame } from "@/components/admin/certificates/CertificatePreviewFrame"

type EmissionTableRow = {
  id: string
  studentName: string
  courseName: string
  templateName: string
  issuedAt: string
  validationCode: string
  raw: CertificateIssueAdminRow
}

const CertificatesPage = () => {
  const { can } = usePermission()
  const canEditTemplates = can("certificados.template_editar")
  const canEmit = can("certificados.emitir")

  const [searchQuery, setSearchQuery] = useState("")
  const [previewTemplate, setPreviewTemplate] = useState<CertificateTemplateRow | null>(null)
  const [editingTemplate, setEditingTemplate] = useState<CertificateTemplateRow | null>(null)
  const [newTemplateOpen, setNewTemplateOpen] = useState(false)
  const [newTemplateName, setNewTemplateName] = useState("")
  const [newTemplateInstitution, setNewTemplateInstitution] = useState("B42 Edtech")
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

  const emissionRows: EmissionTableRow[] = useMemo(
    () =>
      issues.map((i) => ({
        id: i.id,
        studentName: i.student_name,
        courseName: i.discipline_label,
        templateName: i.template_name ?? "—",
        issuedAt: i.issued_at,
        validationCode: i.validation_code,
        raw: i,
      })),
    [issues],
  )

  const filteredEmissions = emissionRows.filter(
    (e) =>
      e.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.courseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.validationCode.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const previewPayload = useMemo(() => {
    if (!previewTemplate) return null
    return buildCertificateTemplatePreviewPayload({
      template: previewTemplate,
      slots: previewSlotsQ.data ?? [],
    })
  }, [previewTemplate, previewSlotsQ.data])

  const handleDownloadIssue = async (row: EmissionTableRow) => {
    try {
      const snap = row.raw.snapshot
      if (snap && typeof snap === "object") {
        const enriched = await enrichSnapshotRecord(snap, row.raw.template_id)
        await openCertificatePrintWindow({
          ...snapshotRecordToPrintPayload(enriched, {
            studentName: row.studentName,
            disciplineName: row.courseName,
            issuedAt: row.issuedAt,
            validationCode: row.validationCode,
          }),
          validateBaseUrl: window.location.origin,
        })
        return
      }
      toast.warning(
        "Emissão legada sem snapshot. Abrindo PDF com os dados atuais do banco.",
      )
      await openCertificatePrintWindow({
        studentName: row.studentName,
        disciplineName: row.courseName,
        issuedAt: row.issuedAt,
        validationCode: row.validationCode,
        validateBaseUrl: window.location.origin,
      })
    } catch (e) {
      toast.error("Não foi possível gerar o PDF do certificado.")
      console.error(e)
    }
  }

  const emissionColumns: Column<EmissionTableRow>[] = [
    {
      key: "studentName",
      header: "Aluno",
      cell: (e) => (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span>{e.studentName}</span>
        </div>
      ),
    },
    { key: "courseName", header: "Disciplina" },
    { key: "templateName", header: "Template" },
    {
      key: "issuedAt",
      header: "Data de Emissão",
      cell: (e) => new Date(e.issuedAt).toLocaleDateString("pt-BR"),
    },
    {
      key: "validationCode",
      header: "Código",
      cell: (e) => (
        <code className="text-xs bg-muted px-2 py-1 rounded">{e.validationCode}</code>
      ),
    },
    {
      key: "actions",
      header: "",
      cell: (row) =>
        canEmit ? (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => void handleDownloadIssue(row)}
            title="Baixar PDF deste certificado"
          >
            <Download className="h-4 w-4" />
          </Button>
        ) : null,
      className: "w-12",
    },
  ]

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
      })
      toast.success("Template criado. Abra o editor para personalizar.")
      setNewTemplateOpen(false)
      setNewTemplateName("")
      setNewTemplateInstitution("B42 Edtech")
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
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          Carregando…
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
          <div className="grid gap-4 md:grid-cols-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{templates.length}</p>
                    <p className="text-sm text-muted-foreground">Templates</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                    <Award className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{issues.length}</p>
                    <p className="text-sm text-muted-foreground">Total emitidos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-info" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{thisMonthEmissions}</p>
                    <p className="text-sm text-muted-foreground">Este mês</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                    <Edit className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{signatures.length}</p>
                    <p className="text-sm text-muted-foreground">Assinaturas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="templates" className="space-y-4">
            <TabsList>
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="emissions">Histórico de emissões</TabsTrigger>
              <TabsTrigger value="signatures">Biblioteca de assinaturas</TabsTrigger>
            </TabsList>

            <TabsContent value="templates" className="space-y-4">
              <RequirePermission permission="certificados.template_criar">
                <div className="flex justify-end">
                  <Button onClick={() => setNewTemplateOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Novo template
                  </Button>
                </div>
              </RequirePermission>
              {templates.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum template cadastrado. Crie um para emitir certificados.
                </p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {templates.map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      onPreview={() => setPreviewTemplate(template)}
                      onEdit={canEditTemplates ? () => setEditingTemplate(template) : undefined}
                      onSetDefault={
                        canEditTemplates ? () => void handleSetDefaultTemplate(template) : undefined
                      }
                      onToggleActive={
                        canEditTemplates ? (next) => void handleToggleTemplate(template, next) : undefined
                      }
                      disabled={updateTemplate.isPending || setDefaultTemplate.isPending}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="emissions" className="space-y-4">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por aluno, disciplina ou código…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <DataTable columns={emissionColumns} data={filteredEmissions} />
            </TabsContent>

            <TabsContent value="signatures" className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Assinaturas formam uma biblioteca compartilhada. Vincule-as a templates via editor.
                </p>
                <RequirePermission permission="certificados.template_editar">
                  <Button
                    onClick={() => {
                      setEditingSignature(null)
                      setSignatureDialogOpen(true)
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Nova assinatura
                  </Button>
                </RequirePermission>
              </div>
              <SignatureLibraryGrid
                signatures={signatures}
                onEdit={(sig) => {
                  setEditingSignature(sig)
                  setSignatureDialogOpen(true)
                }}
              />
            </TabsContent>
          </Tabs>

          {/* Novo template (passo 1: nome + instituição → abre o editor) */}
          <Dialog open={newTemplateOpen} onOpenChange={setNewTemplateOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo template</DialogTitle>
                <DialogDescription>
                  Defina o nome e a instituição. Após criar, abrimos o editor com preview ao vivo.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <div className="space-y-2">
                  <Label htmlFor="tpl-new-name">Nome</Label>
                  <Input
                    id="tpl-new-name"
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    placeholder="Ex.: Certificado de conclusão"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tpl-new-inst">Nome da instituição</Label>
                  <Input
                    id="tpl-new-inst"
                    value={newTemplateInstitution}
                    onChange={(e) => setNewTemplateInstitution(e.target.value)}
                    placeholder="B42 Edtech"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setNewTemplateOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={() => void handleCreateTemplate()}
                  disabled={createTemplate.isPending}
                >
                  {createTemplate.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Criar e personalizar"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Preview rápido (somente leitura) */}
          <Dialog open={!!previewTemplate} onOpenChange={(o) => !o && setPreviewTemplate(null)}>
            <DialogContent className="flex max-h-[90vh] max-w-4xl flex-col gap-4 overflow-hidden">
              <DialogHeader className="shrink-0">
                <DialogTitle>Preview: {previewTemplate?.name}</DialogTitle>
                <DialogDescription>
                  Dados de exemplo. O certificado real é montado com o snapshot da emissão.
                </DialogDescription>
              </DialogHeader>
              {previewTemplate && previewPayload && (
                <div className="min-h-0 flex-1 overflow-hidden rounded-lg border bg-white">
                  <CertificatePreviewFrame
                    payload={previewPayload}
                    className="h-full min-h-[480px] w-full rounded-lg border-0 bg-white"
                  />
                </div>
              )}
              <DialogFooter className="shrink-0">
                <Button variant="outline" onClick={() => setPreviewTemplate(null)}>
                  Fechar
                </Button>
                {previewTemplate && previewPayload && (
                  <Button
                    onClick={() => {
                      void openCertificatePrintWindow({
                        ...previewPayload,
                        autoPrint: true,
                      }).catch((e) => {
                        toast.error("Não foi possível abrir a impressão.")
                        console.error(e)
                      })
                    }}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Gerar PDF (impressão)
                  </Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Editor com preview ao vivo */}
          <TemplateEditorDialog
            open={!!editingTemplate}
            template={editingTemplate}
            signaturesLibrary={signatures}
            onOpenChange={(o) => !o && setEditingTemplate(null)}
          />

          {/* Form de assinatura (criar/editar) */}
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
