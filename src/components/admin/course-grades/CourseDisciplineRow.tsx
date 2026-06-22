import { BookOpen, Clock, Edit, Link2, MoreHorizontal, Trash2, Unlink2, User } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { CourseDisciplineAdmin } from "@/types/courseGrades"

type CourseDisciplineRowProps = {
  discipline: CourseDisciplineAdmin
  gradeId: string
  onLink: (discipline: CourseDisciplineAdmin) => void
  onUnlink: (discipline: CourseDisciplineAdmin) => void
  onEdit: (discipline: CourseDisciplineAdmin, gradeId: string) => void
  onDelete: (discipline: CourseDisciplineAdmin, gradeId: string) => void
}

export function CourseDisciplineRow({
  discipline,
  gradeId,
  onLink,
  onUnlink,
  onEdit,
  onDelete,
}: CourseDisciplineRowProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium">{discipline.name}</p>
                  {discipline.status === "inactive" && (
                    <Badge variant="secondary">Inativa</Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                  <span className="font-mono">{discipline.code}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {discipline.workload}h
                  </span>
                  {discipline.creditsEnabled && (
                    <span>{discipline.credits} créditos</span>
                  )}
                  {discipline.professor && (
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {discipline.professor}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {discipline.linkedTrailId ? (
              <Badge variant="outline" className="gap-1 bg-success/10 text-success border-success/30">
                <Link2 className="h-3 w-3" />
                {discipline.linkedTrailName}
              </Badge>
            ) : (
              <Button variant="outline" size="sm" onClick={() => onLink(discipline)}>
                <Link2 className="h-4 w-4 mr-2" />
                Vincular Disciplina
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onLink(discipline)}>
                  <Link2 className="h-4 w-4 mr-2" />
                  {discipline.linkedTrailId ? "Substituir vínculo" : "Vincular Disciplina"}
                </DropdownMenuItem>
                {discipline.linkedTrailId && (
                  <DropdownMenuItem onClick={() => void onUnlink(discipline)}>
                    <Unlink2 className="h-4 w-4 mr-2" />
                    Desvincular Disciplina
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => onEdit(discipline, gradeId)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar Disciplina
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => onDelete(discipline, gradeId)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remover
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
