import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Search,
  BookOpen,
  Clock,
  CheckCircle2,
  ExternalLink,
  Tag,
} from "lucide-react"
import { useSearchLibraryContent } from "@/hooks/queries/useSearchLibraryContent"
import { getLibraryCatalogStatus, type LibraryItem } from "@/services/libraryAdapter"

type LinkableDiscipline = {
  id: string
  name: string
}

interface LibraryLinkDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  discipline?: LinkableDiscipline | null
  onConfirm: (selectedContent: LibraryItem) => void
}

export function LibraryLinkDialog({
  open,
  onOpenChange,
  discipline,
  onConfirm,
}: LibraryLinkDialogProps) {
  const [search, setSearch] = useState("")
  const [selectedContent, setSelectedContent] = useState<LibraryItem | null>(null)
  const [contentType, setContentType] = useState<"all" | "discipline">("all")

  const catalogStatus = getLibraryCatalogStatus()
  const { items, isLoading, error, catalogSource } = useSearchLibraryContent({
    q: search,
    type: contentType,
    page: 1,
    pageSize: 50,
  })

  const filteredContent = items

  const handleConfirm = () => {
    if (selectedContent) {
      onConfirm(selectedContent)
      setSelectedContent(null)
      setSearch("")
    }
  }

  const handleClose = () => {
    setSelectedContent(null)
    setSearch("")
    onOpenChange(false)
  }

  const handlePreview = () => {
    if (!selectedContent?.externalUrl) return
    window.open(selectedContent.externalUrl, "_blank", "noopener,noreferrer")
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="flex max-h-[min(90vh,52rem)] w-[calc(100vw-2rem)] max-w-3xl flex-col gap-0 overflow-hidden p-0 top-[4vh] translate-y-0 sm:w-full">
        <div className="shrink-0 space-y-4 px-6 pt-6 pb-3">
          <DialogHeader>
            <DialogTitle>Vincular Disciplina Externa</DialogTitle>
            <DialogDescription>
              {discipline
                ? `Selecione uma disciplina externa para vincular à disciplina "${discipline.name}". Se já existir vínculo, ele será substituído.`
                : "Busque e selecione conteúdo da biblioteca externa para vincular ao curso"}
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar disciplinas externas ou tags..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Tabs value={contentType} onValueChange={(v) => setContentType(v as typeof contentType)}>
              <TabsList>
                <TabsTrigger value="all">Todos</TabsTrigger>
                <TabsTrigger value="discipline">Disciplinas</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {!catalogStatus.alice && !catalogStatus.eadstock && (
            <p className="text-sm text-amber-600 dark:text-amber-400">
              Configure <code>VITE_ALICE_API_KEY</code> e <code>VITE_ALICE_API_SECRET</code> (par
              backoffice) no Vercel, ou <code>VITE_EADSTOCK_BASE_URL</code> para o catálogo Scout.
            </p>
          )}
          {catalogSource === "alice" && (
            <p className="text-xs text-muted-foreground">
              Catálogo: Alice <code>/api/rents</code>
              {catalogStatus.eadstock ? " (fallback Eadstock se Alice falhar)" : ""}.
            </p>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto rounded-md border mx-6 mb-3">
            <div className="p-4 space-y-3">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Search className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="font-medium mb-1">Buscando conteúdo...</p>
                  <p className="text-sm text-muted-foreground">Aguarde um instante</p>
                </div>
              ) : filteredContent.length > 0 ? (
                filteredContent.map((content) => (
                  <Card
                    key={content.id}
                    className={`cursor-pointer transition-all ${
                      selectedContent?.id === content.id
                        ? "ring-2 ring-primary bg-primary/5"
                        : "hover:bg-muted/50"
                    }`}
                    onClick={() => setSelectedContent(content)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <BookOpen className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium truncate">{content.name}</p>
                              <Badge variant="default" className="shrink-0">
                                Disciplina
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                              {content.description ?? "—"}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {content.duration ?? "—"}
                              </span>
                              {content.modulesCount != null && content.modulesCount > 0 && (
                                <span>{content.modulesCount} módulos</span>
                              )}
                              {content.lessonsCount != null && content.lessonsCount > 0 && (
                                <span>{content.lessonsCount} aulas</span>
                              )}
                            </div>
                            {content.tags && content.tags.length > 0 && (
                              <div className="flex items-center gap-2 mt-2">
                                <Tag className="h-3 w-3 text-muted-foreground" />
                                {content.tags.map((tag) => (
                                  <Badge key={tag} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        {selectedContent?.id === content.id && (
                          <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                  <p className="font-medium mb-1 text-destructive">Erro ao carregar catálogo</p>
                  <p className="text-sm text-muted-foreground">
                    {error instanceof Error ? error.message : String(error)}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                  <Search className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="font-medium mb-1">Nenhum conteúdo encontrado</p>
                  <p className="text-sm text-muted-foreground">
                    {catalogStatus.alice || catalogStatus.eadstock
                      ? "Tente outro termo (Alice: mín. 2 letras na API) ou limpe a busca."
                      : "Variáveis de integração não configuradas neste deploy."}
                  </p>
                </div>
              )}
            </div>
        </div>

        <div className="shrink-0 space-y-3 border-t bg-background px-6 py-4">
          {selectedContent && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                    <div className="min-w-0">
                      <p className="font-medium truncate">Selecionado: {selectedContent.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Disciplina
                        {selectedContent.duration ? ` • ${selectedContent.duration}` : ""}
                        {selectedContent.lessonsCount != null && selectedContent.lessonsCount > 0
                          ? ` • ${selectedContent.lessonsCount} aulas`
                          : ""}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0"
                    onClick={handlePreview}
                    disabled={!selectedContent.externalUrl}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <DialogFooter className="sm:justify-end">
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button onClick={handleConfirm} disabled={!selectedContent}>
              Vincular Disciplina
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
