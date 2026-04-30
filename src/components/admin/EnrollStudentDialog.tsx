import { useMemo, useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, UserPlus, Users } from "lucide-react"

interface EnrollStudentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  courseId: string
  courseName: string
  enrolledStudentIds: string[]
  allStudents: StudentOption[]
  onEnroll: (studentIds: string[]) => Promise<void>
  isSubmitting?: boolean
}

export type StudentOption = {
  id: string
  name: string
  email: string
  avatar?: string
  status: "active" | "inactive" | "blocked"
  enrollmentCount: number
}

const statusConfig = {
  active: { label: "Ativo", variant: "success" as const },
  inactive: { label: "Inativo", variant: "secondary" as const },
  blocked: { label: "Bloqueado", variant: "destructive" as const },
}

export function EnrollStudentDialog({
  open,
  onOpenChange,
  courseId,
  courseName,
  enrolledStudentIds,
  allStudents,
  onEnroll,
  isSubmitting = false,
}: EnrollStudentDialogProps) {
  const [search, setSearch] = useState("")
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([])

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setSearch("")
      setSelectedStudentIds([])
    }
  }, [open])

  const availableStudents = useMemo(
    () => allStudents.filter((student) => !enrolledStudentIds.includes(student.id)),
    [allStudents, enrolledStudentIds],
  )

  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return availableStudents
    return availableStudents.filter(
      (student) =>
        student.name.toLowerCase().includes(q) || student.email.toLowerCase().includes(q),
    )
  }, [availableStudents, search])

  const handleToggleStudent = (studentId: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    )
  }

  const handleEnroll = async () => {
    await onEnroll(selectedStudentIds)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Matricular Aluno</DialogTitle>
          <DialogDescription>
            Busque alunos cadastrados para matricular em {courseName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
              disabled={isSubmitting}
            />
          </div>

          {/* Students List */}
          {availableStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="font-medium mb-1">Nenhum aluno disponível</p>
              <p className="text-sm text-muted-foreground">
                Todos os alunos já estão matriculados neste curso
              </p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Search className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="font-medium mb-1">Nenhum aluno encontrado</p>
              <p className="text-sm text-muted-foreground">
                Tente ajustar os termos da busca
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Alunos Encontrados</span>
                <span>{filteredStudents.length} aluno(s)</span>
              </div>
              <ScrollArea className="h-[280px] rounded-md border">
                <div className="divide-y">
                  {filteredStudents.map((student) => (
                    <label
                      key={student.id}
                      className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                      <Checkbox
                        checked={selectedStudentIds.includes(student.id)}
                        onCheckedChange={() => handleToggleStudent(student.id)}
                        disabled={isSubmitting}
                      />
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={student.avatar} />
                        <AvatarFallback>
                          {student.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {student.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {student.email}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant={statusConfig[student.status].variant}
                            className="text-xs"
                          >
                            {statusConfig[student.status].label}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Matriculado em {student.enrollmentCount} curso(s)
                          </span>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </ScrollArea>
            </>
          )}

          {/* Selection Count */}
          {selectedStudentIds.length > 0 && (
            <div className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                {selectedStudentIds.length}
              </span>{" "}
              aluno(s) selecionado(s)
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            onClick={() => void handleEnroll()}
            disabled={selectedStudentIds.length === 0 || isSubmitting}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            {isSubmitting ? "Matriculando..." : "Matricular"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
