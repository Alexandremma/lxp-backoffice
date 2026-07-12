import { Card, CardContent } from "@/components/ui/card"
import { SkeletonStatCards } from "@/components/ui/skeleton"
import { Ban, Users, UserCheck, UserX } from "lucide-react"
import type { StudentAdmin as Student } from "@/types/studentAdmin"

type StudentsStatsCardsProps = {
  students: Student[]
  isLoading: boolean
}

export function StudentsStatsCards({ students, isLoading }: StudentsStatsCardsProps) {
  if (isLoading) {
    return <SkeletonStatCards className="mb-6" />
  }

  return (
    <div className="grid gap-4 md:grid-cols-4 mb-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{students.length}</p>
              <p className="text-sm text-muted-foreground">Total de Alunos</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-success/10">
              <UserCheck className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {students.filter((s) => s.status === "active").length}
              </p>
              <p className="text-sm text-muted-foreground">Alunos Ativos</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-warning/10">
              <UserX className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {students.filter((s) => s.status === "inactive").length}
              </p>
              <p className="text-sm text-muted-foreground">Inativos</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-destructive/10">
              <Ban className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {students.filter((s) => s.status === "blocked").length}
              </p>
              <p className="text-sm text-muted-foreground">Bloqueados</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
