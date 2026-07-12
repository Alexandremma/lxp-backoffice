import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RequirePermission } from "@/components/auth/RequirePermission"
import { SignatureLibraryGrid } from "@/components/admin/certificates/SignatureLibrary"
import type { CertificateSignatureRow } from "@/types/certificates"

type SignaturesTabProps = {
  signatures: CertificateSignatureRow[]
  onNew: () => void
  onEdit: (signature: CertificateSignatureRow) => void
}

export function SignaturesTab({ signatures, onNew, onEdit }: SignaturesTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Assinaturas formam uma biblioteca compartilhada. Vincule-as a templates via editor.
        </p>
        <RequirePermission permission="certificados.template_editar">
          <Button onClick={onNew}>
            <Plus className="mr-2 h-4 w-4" />
            Nova assinatura
          </Button>
        </RequirePermission>
      </div>
      <SignatureLibraryGrid signatures={signatures} onEdit={onEdit} />
    </div>
  )
}
