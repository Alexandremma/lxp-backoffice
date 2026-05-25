import { useEffect, useState } from "react"
import { Trash2, Pencil, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

import {
  getSignatureImagePublicUrl,
  type CertificateSignatureRow,
} from "@/services/certificatesAdminService"
import {
  useCreateCertificateSignatureAdmin,
  useDeleteCertificateSignatureAdmin,
  useUpdateCertificateSignatureAdmin,
} from "@/hooks/mutations/useCreateCertificateSignatureAdmin"

type SignatureFormDialogProps = {
  open: boolean
  signature?: CertificateSignatureRow | null
  onOpenChange: (open: boolean) => void
}

export function SignatureFormDialog({ open, signature, onOpenChange }: SignatureFormDialogProps) {
  const [name, setName] = useState("")
  const [title, setTitle] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [localUrl, setLocalUrl] = useState<string | null>(null)

  const createSig = useCreateCertificateSignatureAdmin()
  const updateSig = useUpdateCertificateSignatureAdmin()

  useEffect(() => {
    if (!open) return
    setName(signature?.signer_name ?? "")
    setTitle(signature?.signer_title ?? "")
    setFile(null)
    setLocalUrl(null)
  }, [open, signature])

  useEffect(() => {
    if (!file) {
      setLocalUrl(null)
      return
    }
    const url = URL.createObjectURL(file)
    setLocalUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const persistedUrl = signature ? getSignatureImagePublicUrl(signature.image_path) : null

  const handleSave = async () => {
    const trimmedName = name.trim()
    const trimmedTitle = title.trim()
    if (!trimmedName || !trimmedTitle) {
      toast.error("Preencha nome e cargo.")
      return
    }
    try {
      if (signature) {
        await updateSig.mutateAsync({
          id: signature.id,
          patch: { signer_name: trimmedName, signer_title: trimmedTitle, image_file: file },
        })
        toast.success("Assinatura atualizada.")
      } else {
        await createSig.mutateAsync({
          signer_name: trimmedName,
          signer_title: trimmedTitle,
          image_file: file,
        })
        toast.success("Assinatura cadastrada.")
      }
      onOpenChange(false)
    } catch (err) {
      toast.error("Não foi possível salvar a assinatura.")
      console.error(err)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{signature ? "Editar assinatura" : "Nova assinatura"}</DialogTitle>
          <DialogDescription>
            Assinaturas formam uma biblioteca compartilhada. Vincule-as aos templates no editor.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="sig-name-input">Nome do signatário</Label>
            <Input id="sig-name-input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sig-title-input">Cargo / título</Label>
            <Input id="sig-title-input" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sig-file-input">Imagem da assinatura (PNG/JPG/WebP)</Label>
            <Input
              id="sig-file-input"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            {(localUrl || persistedUrl) && (
              <img
                src={localUrl ?? persistedUrl ?? ""}
                alt="preview"
                className="h-12 object-contain mt-1"
              />
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => void handleSave()}
            disabled={createSig.isPending || updateSig.isPending}
          >
            {(createSig.isPending || updateSig.isPending) && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

type SignatureLibraryGridProps = {
  signatures: CertificateSignatureRow[]
  onEdit: (sig: CertificateSignatureRow) => void
}

export function SignatureLibraryGrid({ signatures, onEdit }: SignatureLibraryGridProps) {
  const deleteSig = useDeleteCertificateSignatureAdmin()

  if (signatures.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhuma assinatura cadastrada. Use "Nova assinatura" para começar.
      </p>
    )
  }

  const handleDelete = async (sig: CertificateSignatureRow) => {
    if (!window.confirm(`Excluir a assinatura de ${sig.signer_name}?`)) return
    try {
      await deleteSig.mutateAsync(sig.id)
      toast.success("Assinatura excluída.")
    } catch (err) {
      toast.error("Não foi possível excluir. Verifique se ela não está vinculada a um template.")
      console.error(err)
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {signatures.map((sig) => {
        const url = getSignatureImagePublicUrl(sig.image_path)
        return (
          <Card key={sig.id}>
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-start gap-3">
                {url ? (
                  <img src={url} alt="" className="h-14 w-14 object-contain bg-muted rounded" />
                ) : (
                  <div className="h-14 w-14 rounded bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground">
                    {sig.signer_name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold truncate">{sig.signer_name}</h4>
                  <p className="text-sm text-muted-foreground truncate">{sig.signer_title}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => onEdit(sig)}>
                  <Pencil className="h-4 w-4 mr-1" />
                  Editar
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => void handleDelete(sig)}
                  disabled={deleteSig.isPending}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
