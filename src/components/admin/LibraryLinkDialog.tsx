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
  Layers,
  Clock,
  CheckCircle2,
  ExternalLink,
  Tag,
} from "lucide-react"
import { mockLibraryContent, type LibraryContent, type Discipline } from "@/lib/mock-data"

interface LibraryLinkDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  discipline?: Discipline | null
  onConfirm: (libraryContentId: string) => void
}

export function LibraryLinkDialog({
  open,
  onOpenChange,
  discipline,
  onConfirm,
}: LibraryLinkDialogProps) {
  const [search, setSearch] = useState("")
  const [selectedContent, setSelectedContent] = useState<LibraryContent | null>(null)
  const [contentType, setContentType] = useState<"all" | "trail" | "module">("all")

  const filteredContent = mockLibraryContent.filter((content) => {
    const matchesSearch =
      content.name.toLowerCase().includes(search.toLowerCase()) ||
      content.description.toLowerCase().includes(search.toLowerCase()) ||
      content.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()))
    const matchesType = contentType === "all" || content.type === contentType
    return matchesSearch && matchesType
  })

  const handleConfirm = () => {
    if (selectedContent) {
      onConfirm(selectedContent.id)
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
              ? `Selecione uma trilha ou módulo para vincular à disciplina "${discipline.name}"`
              : "Busque e selecione conteúdo da biblioteca externa para vincular ao curso"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search and Filters */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar trilhas, módulos ou tags..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Tabs value={contentType} onValueChange={(v) => setContentType(v as typeof contentType)}>
              <TabsList>
                <TabsTrigger value="all">Todos</TabsTrigger>
                <TabsTrigger value="trail">Trilhas</TabsTrigger>
                <TabsTrigger value="module">Módulos</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Content List */}
          <ScrollArea className="h-[400px] rounded-md border">
            <div className="p-4 space-y-3">
              {filteredContent.length > 0 ? (
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
                          <div className={`p-2 rounded-lg ${
                            content.type === "trail" ? "bg-primary/10" : "bg-secondary/10"
                          }`}>
                            {content.type === "trail" ? (
                              <BookOpen className={`h-5 w-5 ${
                                content.type === "trail" ? "text-primary" : "text-secondary"
                              }`} />
                            ) : (
                              <Layers className="h-5 w-5 text-secondary" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium truncate">{content.name}</p>
                              <Badge variant={content.type === "trail" ? "default" : "secondary"} className="shrink-0">
                                {content.type === "trail" ? "Trilha" : "Módulo"}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                              {content.description}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {content.duration}
                              </span>
                              {content.modulesCount && (
                                <span>{content.modulesCount} módulos</span>
                              )}
                              {content.lessonsCount && (
                                <span>{content.lessonsCount} aulas</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <Tag className="h-3 w-3 text-muted-foreground" />
                              {content.tags.map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
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
                        {selectedContent.type === "trail" ? "Trilha" : "Módulo"} • {selectedContent.duration}
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
