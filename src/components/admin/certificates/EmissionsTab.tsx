import { useMemo, useState } from "react"
import { Download, Search, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTable, Column } from "@/components/ui/data-table"
import { toast } from "sonner"
import {
  enrichSnapshotRecord,
} from "@/services/certificatesAdminService"
import type { CertificateIssueAdminRow } from "@/types/certificates"
import { downloadCertificatePdfFile } from "@/lib/certificatePdfDownload"
import { snapshotRecordToPrintPayload } from "@/lib/certificatePrint"

type EmissionTableRow = {
  id: string
  studentName: string
  courseName: string
  templateName: string
  issuedAt: string
  validationCode: string
  raw: CertificateIssueAdminRow
}

type EmissionsTabProps = {
  issues: CertificateIssueAdminRow[]
  canEmit: boolean
}

export function EmissionsTab({ issues, canEmit }: EmissionsTabProps) {
  const [searchQuery, setSearchQuery] = useState("")

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

  const handleDownloadIssue = async (row: EmissionTableRow) => {
    try {
      const snap = row.raw.snapshot
      if (snap && typeof snap === "object") {
        const enriched = await enrichSnapshotRecord(snap, row.raw.template_id)
        await downloadCertificatePdfFile(
          snapshotRecordToPrintPayload(enriched, {
            studentName: row.studentName,
            disciplineName: row.courseName,
            issuedAt: row.issuedAt,
            validationCode: row.validationCode,
          }),
        )
        toast.success("Certificado baixado.")
        return
      }
      toast.warning(
        "Emissão legada sem snapshot. Gerando PDF com os dados atuais do banco.",
      )
      await downloadCertificatePdfFile({
        studentName: row.studentName,
        disciplineName: row.courseName,
        issuedAt: row.issuedAt,
        validationCode: row.validationCode,
      })
      toast.success("Certificado baixado.")
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

  return (
    <div className="space-y-4">
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
    </div>
  )
}
