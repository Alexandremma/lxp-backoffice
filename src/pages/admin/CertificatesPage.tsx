import { useMemo, useState } from "react"
import { AdminLayout } from "@/components/layout/AdminLayout"
import { PageHeader } from "@/components/layout/PageHeader"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useCertificateTemplatesAdmin } from "@/hooks/queries/useCertificateTemplatesAdmin"
import { useCertificateSignaturesAdmin } from "@/hooks/queries/useCertificateSignaturesAdmin"
import { useCertificateIssuesAdmin } from "@/hooks/queries/useCertificateIssuesAdmin"
import {
  useCreateCertificateTemplateAdmin,
  useUpdateCertificateTemplateAdmin,
} from "@/hooks/mutations/useCertificateTemplateMutationsAdmin"
import { useCreateCertificateSignatureAdmin } from "@/hooks/mutations/useCreateCertificateSignatureAdmin"
import type { CertificateIssueAdminRow, CertificateTemplateRow } from "@/services/certificatesAdminService"
import { Award, Download, Eye, Plus, Edit, FileText, Search, Calendar, User, Loader2 } from "lucide-react"
import { toast } from "sonner"

type EmissionTableRow = {
  id: string
  studentName: string
  courseName: string
  templateName: string
  issuedAt: string
  validationCode: string
}

const CertificatesPage = () => {
  const [searchQuery, setSearchQuery] = useState("")
  const [previewTemplate, setPreviewTemplate] = useState<CertificateTemplateRow | null>(null)

  const templatesQ = useCertificateTemplatesAdmin()
  const signaturesQ = useCertificateSignaturesAdmin()
  const issuesQ = useCertificateIssuesAdmin()
  const createTemplate = useCreateCertificateTemplateAdmin()
  const updateTemplate = useUpdateCertificateTemplateAdmin()
  const createSignature = useCreateCertificateSignatureAdmin()

  const [templateDialogOpen, setTemplateDialogOpen] = useState(false)
  const [newTemplateName, setNewTemplateName] = useState("")
  const [newTemplateDescription, setNewTemplateDescription] = useState("")

  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false)
  const [sigTemplateId, setSigTemplateId] = useState<string>("")
  const [sigName, setSigName] = useState("")
  const [sigTitle, setSigTitle] = useState("")

  const templates = templatesQ.data ?? []
  const signatures = signaturesQ.data ?? []
  const issues = issuesQ.data ?? []

  const emissionRows: EmissionTableRow[] = useMemo(
    () =>
      issues.map((i: CertificateIssueAdminRow) => ({
        id: i.id,
        studentName: i.student_name,
        courseName: i.discipline_label,
        templateName: i.template_name ?? "—",
        issuedAt: i.issued_at,
        validationCode: i.validation_code,
      })),
    [issues],
  )

  const filteredEmissions = emissionRows.filter(
    (e) =>
      e.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.courseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.validationCode.toLowerCase().includes(searchQuery.toLowerCase()),
  )

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
      cell: () => (
        <Button variant="ghost" size="icon-sm" onClick={() => toast.info("Download PDF: em integração.")}>
          <Download className="h-4 w-4" />
        </Button>
      ),
      className: "w-12",
    },
  ]

  const now = new Date()
  const thisMonthEmissions = issues.filter((i) => {
    const date = new Date(i.issued_at)
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
  }).length

  const loading =
    templatesQ.isLoading || signaturesQ.isLoading || issuesQ.isLoading
  const errorMsg =
    templatesQ.error?.message ?? signaturesQ.error?.message ?? issuesQ.error?.message

  const previewSignatures = previewTemplate
    ? signatures.filter((s) => s.template_id === previewTemplate.id)
    : []

  const handleCreateTemplate = async () => {
    const name = newTemplateName.trim()
    if (!name) {
      toast.error("Informe o nome do template.")
      return
    }
    try {
      await createTemplate.mutateAsync({ name, description: newTemplateDescription.trim() || null })
      toast.success("Template criado.")
      setTemplateDialogOpen(false)
      setNewTemplateName("")
      setNewTemplateDescription("")
    } catch (e) {
      toast.error("Não foi possível criar o template.")
      console.error(e)
    }
  }

  const handleToggleTemplate = async (t: CertificateTemplateRow) => {
    try {
      await updateTemplate.mutateAsync({ id: t.id, patch: { is_active: !t.is_active } })
      toast.success(t.is_active ? "Template inativado." : "Template ativado.")
    } catch (e) {
      toast.error("Não foi possível atualizar o template.")
      console.error(e)
    }
  }

  const handleCreateSignature = async () => {
    if (!sigTemplateId) {
      toast.error("Selecione um template.")
      return
    }
    const signer_name = sigName.trim()
    const signer_title = sigTitle.trim()
    if (!signer_name || !signer_title) {
      toast.error("Preencha nome e cargo do signatário.")
      return
    }
    try {
      await createSignature.mutateAsync({
        template_id: sigTemplateId,
        signer_name,
        signer_title,
      })
      toast.success("Assinatura cadastrada.")
      setSignatureDialogOpen(false)
      setSigName("")
      setSigTitle("")
      setSigTemplateId("")
    } catch (e) {
      toast.error("Não foi possível salvar a assinatura.")
      console.error(e)
    }
  }

  return (
    <AdminLayout>
      <PageHeader title="Certificados" description="Templates, assinaturas e histórico de emissão (Supabase)" />

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
              <TabsTrigger value="signatures">Assinaturas</TabsTrigger>
            </TabsList>

            <TabsContent value="templates" className="space-y-4">
              <div className="flex justify-end">
                <Button onClick={() => setTemplateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo template
                </Button>
              </div>
              {templates.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum template cadastrado.</p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {templates.map((template) => (
                    <Card key={template.id} className="overflow-hidden">
                      <div className="aspect-[4/3] bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border-b">
                        <Award className="h-16 w-16 text-primary/50" />
                      </div>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold">{template.name}</h4>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {template.description?.trim() || "Sem descrição"}
                            </p>
                          </div>
                          <Badge variant={template.is_active ? "success-muted" : "ghost"}>
                            {template.is_active ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => setPreviewTemplate(template)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Preview
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title={template.is_active ? "Inativar" : "Ativar"}
                            onClick={() => void handleToggleTemplate(template)}
                            disabled={updateTemplate.isPending}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
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
              <div className="flex justify-end">
                <Button
                  onClick={() => {
                    if (templates.length === 0) {
                      toast.error("Crie um template antes de adicionar assinaturas.")
                      return
                    }
                    setSigTemplateId(templates[0].id)
                    setSignatureDialogOpen(true)
                  }}
                  disabled={templates.length === 0}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nova assinatura
                </Button>
              </div>
              {signatures.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma assinatura cadastrada.</p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {signatures.map((signature) => (
                    <Card key={signature.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-4">
                          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground">
                            {signature.signer_name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold truncate">{signature.signer_name}</h4>
                            <p className="text-sm text-muted-foreground">{signature.signer_title}</p>
                            <p className="text-xs text-muted-foreground mt-1 truncate">
                              Template: {signature.template_name}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo template</DialogTitle>
                <DialogDescription>Nome e descrição opcional. Depois você pode vincular assinaturas.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <div className="space-y-2">
                  <Label htmlFor="tpl-name">Nome</Label>
                  <Input
                    id="tpl-name"
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    placeholder="Ex.: Certificado de conclusão"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tpl-desc">Descrição (opcional)</Label>
                  <Input
                    id="tpl-desc"
                    value={newTemplateDescription}
                    onChange={(e) => setNewTemplateDescription(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setTemplateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={() => void handleCreateTemplate()} disabled={createTemplate.isPending}>
                  {createTemplate.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={signatureDialogOpen} onOpenChange={setSignatureDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova assinatura</DialogTitle>
                <DialogDescription>Vinculada a um template existente.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <div className="space-y-2">
                  <Label>Template</Label>
                  <Select value={sigTemplateId} onValueChange={setSigTemplateId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sig-name">Nome do signatário</Label>
                  <Input id="sig-name" value={sigName} onChange={(e) => setSigName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sig-title">Cargo / título</Label>
                  <Input id="sig-title" value={sigTitle} onChange={(e) => setSigTitle(e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSignatureDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={() => void handleCreateSignature()} disabled={createSignature.isPending}>
                  {createSignature.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={!!previewTemplate} onOpenChange={(o) => !o && setPreviewTemplate(null)}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Preview: {previewTemplate?.name}</DialogTitle>
                <DialogDescription>Visualização simplificada (layout final com cliente)</DialogDescription>
              </DialogHeader>
              <div className="aspect-[4/3] bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg flex flex-col items-center justify-center p-8 border">
                <Award className="h-20 w-20 text-primary mb-4" />
                <h2 className="text-2xl font-bold text-center mb-2">Certificado</h2>
                <p className="text-center text-muted-foreground mb-6 text-sm max-w-md">
                  {previewTemplate?.description?.trim() || "Template ativo para emissões futuras."}
                </p>
                <div className="flex flex-wrap gap-8 mt-8 justify-center">
                  {previewSignatures.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhuma assinatura neste template.</p>
                  ) : (
                    previewSignatures.map((sig) => (
                      <div key={sig.id} className="text-center">
                        <div className="h-12 border-b border-foreground mb-2 w-32 mx-auto" />
                        <p className="font-medium text-sm">{sig.signer_name}</p>
                        <p className="text-xs text-muted-foreground">{sig.signer_title}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </AdminLayout>
  )
}

export default CertificatesPage
