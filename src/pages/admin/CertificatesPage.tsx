import { useState } from "react"
import { AdminLayout } from "@/components/layout/AdminLayout"
import { PageHeader } from "@/components/layout/PageHeader"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTable, Column } from "@/components/ui/data-table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  mockCertificateTemplates,
  mockCertificateEmissions,
  mockSignatures,
  CertificateTemplate,
  CertificateEmission,
  CertificateSignature,
} from "@/lib/mock-data"
import {
  Award,
  Download,
  Eye,
  Plus,
  Edit,
  FileText,
  Search,
  Calendar,
  User,
} from "lucide-react"
import { toast } from "sonner"

const CertificatesPage = () => {
  const [searchQuery, setSearchQuery] = useState("")
  const [previewTemplate, setPreviewTemplate] = useState<CertificateTemplate | null>(
    null
  )

  const filteredEmissions = mockCertificateEmissions.filter(
    (emission) =>
      emission.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emission.courseName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const emissionColumns: Column<CertificateEmission>[] = [
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
    {
      key: "courseName",
      header: "Curso",
    },
    {
      key: "templateName",
      header: "Template",
    },
    {
      key: "issuedAt",
      header: "Data de Emissão",
      cell: (e) => new Date(e.issuedAt).toLocaleDateString("pt-BR"),
    },
    {
      key: "validationCode",
      header: "Código",
      cell: (e) => (
        <code className="text-xs bg-muted px-2 py-1 rounded">
          {e.validationCode}
        </code>
      ),
    },
    {
      key: "actions",
      header: "",
      cell: (e) => (
        <Button variant="ghost" size="icon-sm" onClick={() => toast.success("Download iniciado")}>
          <Download className="h-4 w-4" />
        </Button>
      ),
      className: "w-12",
    },
  ]

  const totalEmissions = mockCertificateEmissions.length
  const thisMonthEmissions = mockCertificateEmissions.filter((e) => {
    const date = new Date(e.issuedAt)
    const now = new Date()
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
  }).length

  return (
    <AdminLayout>
      <PageHeader
        title="Certificados"
        description="Templates e histórico de emissão"
      />

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockCertificateTemplates.length}</p>
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
                <p className="text-2xl font-bold">{totalEmissions}</p>
                <p className="text-sm text-muted-foreground">Total Emitidos</p>
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
                <p className="text-sm text-muted-foreground">Este Mês</p>
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
                <p className="text-2xl font-bold">{mockSignatures.length}</p>
                <p className="text-sm text-muted-foreground">Assinaturas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="templates" className="space-y-4">
        <TabsList>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="emissions">Histórico de Emissões</TabsTrigger>
          <TabsTrigger value="signatures">Assinaturas</TabsTrigger>
        </TabsList>

        {/* Templates */}
        <TabsContent value="templates" className="space-y-4">
          <div className="flex justify-end">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Template
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {mockCertificateTemplates.map((template) => (
              <Card key={template.id} className="overflow-hidden">
                <div className="aspect-[4/3] bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border-b">
                  <Award className="h-16 w-16 text-primary/50" />
                </div>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold">{template.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {template.type === "completion"
                          ? "Conclusão de Curso"
                          : template.type === "participation"
                          ? "Participação"
                          : "Excelência"}
                      </p>
                    </div>
                    <Badge variant={template.active ? "success-muted" : "ghost"}>
                      {template.active ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    {template.description}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setPreviewTemplate(template)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Preview
                    </Button>
                    <Button variant="ghost" size="icon-sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Emissions History */}
        <TabsContent value="emissions" className="space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por aluno ou curso..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <DataTable columns={emissionColumns} data={filteredEmissions} />
        </TabsContent>

        {/* Signatures */}
        <TabsContent value="signatures" className="space-y-4">
          <div className="flex justify-end">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Assinatura
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {mockSignatures.map((signature) => (
              <Card key={signature.id}>
                <CardContent className="pt-4">
                  <div className="flex items-start gap-4">
                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-2xl font-bold text-muted-foreground">
                      {signature.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">{signature.name}</h4>
                      <p className="text-sm text-muted-foreground">{signature.title}</p>
                      <Badge
                        variant={signature.active ? "success-muted" : "ghost"}
                        className="mt-2"
                      >
                        {signature.active ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                    <Button variant="ghost" size="icon-sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Preview: {previewTemplate?.name}</DialogTitle>
            <DialogDescription>
              Visualização do template de certificado
            </DialogDescription>
          </DialogHeader>
          <div className="aspect-[4/3] bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg flex flex-col items-center justify-center p-8 border">
            <Award className="h-20 w-20 text-primary mb-4" />
            <h2 className="text-2xl font-bold text-center mb-2">
              Certificado de {previewTemplate?.type === "completion" ? "Conclusão" : "Participação"}
            </h2>
            <p className="text-center text-muted-foreground mb-6">
              Certificamos que <strong>[Nome do Aluno]</strong> concluiu com sucesso o curso
            </p>
            <p className="text-xl font-semibold text-primary mb-8">[Nome do Curso]</p>
            <div className="flex gap-16 mt-8">
              {mockSignatures
                .filter((s) => s.active)
                .map((sig) => (
                  <div key={sig.id} className="text-center">
                    <div className="h-12 border-b border-foreground mb-2 w-32" />
                    <p className="font-medium text-sm">{sig.name}</p>
                    <p className="text-xs text-muted-foreground">{sig.title}</p>
                  </div>
                ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}

export default CertificatesPage
