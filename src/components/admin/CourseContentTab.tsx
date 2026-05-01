import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Plus,
  Search,
  MoreHorizontal,
  ExternalLink,
  Unlink,
  BookOpen,
  Calendar,
  User,
} from "lucide-react"
import { toast } from "sonner"
import { useGetCourseContent } from "@/hooks/queries/useGetCourseContent"
import { useUnlinkCourseContent } from "@/hooks/queries/useUnlinkCourseContent"
import { useLinkCourseContent } from "@/hooks/queries/useLinkCourseContent"
import { useGetCourseGrades } from "@/hooks/queries/useGetCourseGrades"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { LibraryLinkDialog } from "./LibraryLinkDialog"
import { getAdminErrorMessage } from "@/lib/adminErrorMessage"

interface CourseContentTabProps {
  courseId: string
}

export function CourseContentTab({ courseId }: CourseContentTabProps) {
  const [search, setSearch] = useState("")
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [selectedDisciplineId, setSelectedDisciplineId] = useState<string>("")
  const { data, isLoading, error } = useGetCourseContent(courseId)
  const linkedContent = useMemo(() => data ?? [], [data])
  const unlinkMutation = useUnlinkCourseContent(courseId)
  const linkMutation = useLinkCourseContent(courseId)
  const { data: gradesData } = useGetCourseGrades(courseId)

  const disciplineOptions = useMemo(
    () =>
      (gradesData ?? []).flatMap((grade) =>
        grade.disciplines.map((discipline) => ({
          id: discipline.id,
          label: `${grade.name} - ${discipline.name}`,
        })),
      ),
    [gradesData],
  )
  const hasInternalDisciplines = disciplineOptions.length > 0

  useEffect(() => {
    if (!selectedDisciplineId && disciplineOptions.length > 0) {
      setSelectedDisciplineId(disciplineOptions[0].id)
    }
  }, [disciplineOptions, selectedDisciplineId])

  useEffect(() => {
    if (!error) return
    toast.error(getAdminErrorMessage("courses-content", error))
  }, [error])

  const filteredContent = linkedContent.filter((content) =>
    content.libraryContentName.toLowerCase().includes(search.toLowerCase()) ||
    content.disciplineName?.toLowerCase().includes(search.toLowerCase())
  )

  const handleUnlink = async (linkId: string) => {
    try {
      await unlinkMutation.mutateAsync(linkId)
      toast.success("Disciplina externa desvinculada com sucesso.")
    } catch (e) {
      toast.error(getAdminErrorMessage("courses-content", e))
    }
  }

  const handleOpenInLibrary = (url?: string) => {
    if (!url) {
      toast.error("URL da biblioteca não configurada para esta disciplina.")
      return
    }
    window.open(url, "_blank", "noopener,noreferrer")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Disciplinas Externas Vinculadas</h3>
          <p className="text-sm text-muted-foreground">
            Disciplinas externas vinculadas às disciplinas internas do curso
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Selecione a disciplina interna no campo ao lado e clique em "Vincular Disciplina".
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={selectedDisciplineId}
            onValueChange={setSelectedDisciplineId}
            disabled={!hasInternalDisciplines}
          >
            <SelectTrigger className="w-[320px]">
              <SelectValue placeholder={hasInternalDisciplines ? "Selecione a disciplina interna" : "Sem disciplinas internas"} />
            </SelectTrigger>
            <SelectContent>
              {disciplineOptions.map((discipline) => (
                <SelectItem key={discipline.id} value={discipline.id}>
                  {discipline.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => setLinkDialogOpen(true)} disabled={!selectedDisciplineId || !hasInternalDisciplines}>
            <Plus className="h-4 w-4 mr-2" />
            Vincular à disciplina selecionada
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{linkedContent.length}</p>
                <p className="text-sm text-muted-foreground">Vínculos Totais</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-info/10">
                <BookOpen className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {linkedContent.filter((c) => c.type === "discipline").length}
                </p>
                <p className="text-sm text-muted-foreground">Disciplinas Externas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Table */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Lista de Vínculos</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar disciplina externa..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="font-medium mb-1">Carregando conteúdos...</p>
              <p className="text-sm text-muted-foreground">Aguarde um instante</p>
            </div>
          ) : filteredContent.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Disciplina Externa</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Disciplina Interna</TableHead>
                  <TableHead>Vinculado por</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContent.map((content) => (
                  <TableRow key={content.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <BookOpen className="h-5 w-5 text-primary" />
                        <span className="font-medium">{content.libraryContentName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="default">
                        Disciplina Externa
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {content.disciplineName || (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{content.linkedBy}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {new Date(content.linkedAt).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenInLibrary(content.externalUrl)}>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Ver na Biblioteca
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleUnlink(content.id)}
                          >
                            <Unlink className="h-4 w-4 mr-2" />
                            Desvincular Disciplina
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="font-medium mb-1">Nenhuma disciplina externa vinculada</p>
              <p className="text-sm text-muted-foreground mb-4">
                {hasInternalDisciplines
                  ? "Vincule disciplinas externas às disciplinas do curso"
                  : "Cadastre disciplinas internas na aba Grades antes de criar vínculos externos"}
              </p>
              <Button onClick={() => setLinkDialogOpen(true)} disabled={!hasInternalDisciplines}>
                <Plus className="h-4 w-4 mr-2" />
                Vincular primeira disciplina
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Library Link Dialog */}
      <LibraryLinkDialog
        open={linkDialogOpen}
        onOpenChange={setLinkDialogOpen}
        onConfirm={async (selectedContent) => {
          try {
            if (!selectedDisciplineId) return
            await linkMutation.mutateAsync({
              disciplineId: selectedDisciplineId,
              libraryContentType: "discipline",
              libraryContentId: selectedContent.id,
              libraryContentName: selectedContent.name,
            })
            toast.success("Disciplina externa vinculada com sucesso.")
            setLinkDialogOpen(false)
          } catch (e) {
            toast.error(getAdminErrorMessage("courses-content", e))
          }
        }}
      />
    </div>
  )
}
