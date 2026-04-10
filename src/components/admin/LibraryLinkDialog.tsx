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
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Search,
  BookOpen,
  Clock,
  CheckCircle2,
  ExternalLink,
  Tag,
} from "lucide-react"
import { type Discipline } from "@/lib/mock-data"
import { useSearchLibraryContent } from "@/hooks/queries/useSearchLibraryContent"
import type { LibraryItem } from "@/services/libraryAdapter"

interface LibraryLinkDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  discipline?: Discipline | null
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

  const { items, isLoading } = useSearchLibraryContent({
    q: search,
    type: contentType,
    page: 1,
    pageSize: 20,
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Vincular Conteúdo da Biblioteca</DialogTitle>
          <DialogDescription>
            {discipline
              ? `Selecione uma disciplina externa para vincular à disciplina "${discipline.name}"`
              : "Busque e selecione conteúdo da biblioteca externa para vincular ao curso"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search and Filters */}
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

          {/* Content List */}
          <ScrollArea className="h-[400px] rounded-md border">
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
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Search className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="font-medium mb-1">Nenhum conteúdo encontrado</p>
                  <p className="text-sm text-muted-foreground">
                    Tente ajustar os termos de busca ou filtros
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Selected Content Preview */}
          {selectedContent && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Selecionado: {selectedContent.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Disciplina • {selectedContent.duration}
                        {selectedContent.lessonsCount && ` • ${selectedContent.lessonsCount} aulas`}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedContent}>
            Vincular Conteúdo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
