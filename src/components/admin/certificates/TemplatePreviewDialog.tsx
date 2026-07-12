import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CertificatePreviewFrame } from "@/components/admin/certificates/CertificatePreviewFrame"
import type { CertificatePrintPayload } from "@/lib/certificatePrint"

type TemplatePreviewDialogProps = {
  open: boolean
  templateName?: string
  payload: CertificatePrintPayload | null
  onOpenChange: (open: boolean) => void
  onDownloadPdf: () => void
}

export function TemplatePreviewDialog({
  open,
  templateName,
  payload,
  onOpenChange,
  onDownloadPdf,
}: TemplatePreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[92vh] max-h-[92vh] w-[min(96vw,72rem)] max-w-none flex-col gap-3 overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle>Preview: {templateName}</DialogTitle>
          <DialogDescription>
            Dados de exemplo. O certificado real é montado com o snapshot da emissão.
          </DialogDescription>
        </DialogHeader>
        {open && payload && (
          <div className="flex min-h-0 flex-1 overflow-hidden rounded-lg bg-muted/20 p-1">
            <CertificatePreviewFrame payload={payload} className="h-full w-full min-h-0" />
          </div>
        )}
        <DialogFooter className="shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          {open && payload && (
            <Button onClick={onDownloadPdf}>
              <Download className="mr-2 h-4 w-4" />
              Baixar PDF
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
