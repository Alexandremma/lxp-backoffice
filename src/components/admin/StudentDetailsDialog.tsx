import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserAvatar } from "@/components/profile/UserAvatar"
import { ProgressPercentBar } from "@/components/admin/ProgressPercentBar"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  User,
  Mail,
  Phone,
  Calendar,
  GraduationCap,
  TrendingUp,
  Clock,
} from "lucide-react"
import type { StudentAdmin as Student } from "@/types/studentAdmin"
import { formatDistanceToNow, format, isValid } from "date-fns"
import { ptBR } from "date-fns/locale"

interface StudentDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  student: Student | null
}

const statusConfig = {
  active: { label: "Ativo", variant: "success" as const },
  inactive: { label: "Inativo", variant: "secondary" as const },
  blocked: { label: "Bloqueado", variant: "destructive" as const },
}

export function StudentDetailsDialog({
  open,
  onOpenChange,
  student,
}: StudentDetailsDialogProps) {
  const [activeTab, setActiveTab] = useState("profile")

  if (!student) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <UserAvatar
              name={student.name}
              email={student.email}
              avatarPath={student.avatarPath}
              updatedAt={student.avatarUpdatedAt}
              className="h-16 w-16"
              fallbackClassName="text-lg"
            />
            <div>
              <DialogTitle className="text-xl">{student.name}</DialogTitle>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge variant={statusConfig[student.status].variant}>
                  {statusConfig[student.status].label}
                </Badge>
                {student.enrollments.slice(0, 2).map((enrollment) => (
                  <Badge key={enrollment.courseId} variant="outline" className="text-xs">
                    {enrollment.courseName}
                  </Badge>
                ))}
                {student.enrollments.length > 2 && (
                  <Badge variant="secondary" className="text-xs">
                    +{student.enrollments.length - 2} cursos
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile" className="gap-1 text-xs">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Perfil</span>
            </TabsTrigger>
            <TabsTrigger value="progress" className="gap-1 text-xs">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Progresso</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-4 space-y-4 min-h-[450px]">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Dados Pessoais</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{student.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Telefone</p>
                      <p className="font-medium">
                        {student.phone?.trim() ? (
                          student.phone
                        ) : (
                          <span className="text-muted-foreground font-normal">Não cadastrado</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Data de Nascimento</p>
                      <p className="font-medium">
                        {student.birthDate ? (
                          format(new Date(`${String(student.birthDate).slice(0, 10)}T12:00:00`), "dd/MM/yyyy", {
                            locale: ptBR,
                          })
                        ) : (
                          <span className="text-muted-foreground font-normal">Não cadastrado</span>
                        )}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Informações Acadêmicas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <GraduationCap className="h-4 w-4 text-muted-foreground mt-1" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Cursos Matriculados</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {student.enrollments.map((enrollment) => (
                          <Badge key={enrollment.courseId} variant="outline">
                            {enrollment.courseName}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Primeira Matrícula</p>
                      <p className="font-medium">
                        {student.enrollments.length > 0
                          ? format(new Date(student.enrollments[0].enrollmentDate), "dd/MM/yyyy", { locale: ptBR })
                          : "-"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Último Acesso</p>
                      <p className="font-medium">
                        {student.lastAccess && isValid(new Date(student.lastAccess))
                          ? formatDistanceToNow(new Date(student.lastAccess), {
                              addSuffix: true,
                              locale: ptBR,
                            })
                          : "—"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="progress" className="mt-4 space-y-4 min-h-[450px]">
            <ScrollArea className="h-[420px] pr-4">
              <div className="space-y-4">
                {student.enrollments.map((enrollment) => (
                  <Card key={enrollment.courseId}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center justify-between">
                        <span>{enrollment.courseName}</span>
                        <Badge variant={enrollment.status === "active" ? "success" : "secondary"}>
                          {enrollment.status === "active"
                            ? "Ativo"
                            : enrollment.status === "completed"
                              ? "Concluído"
                              : enrollment.status === "cancelled"
                                ? "Cancelado"
                                : "Inativo"}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 pb-4">
                      <ProgressPercentBar
                        value={enrollment.progress}
                        className="min-w-0"
                        valueClassName="text-xl font-bold w-auto"
                      />
                      <p className="text-sm text-muted-foreground mt-1.5">
                        Matriculado em{" "}
                        {format(new Date(enrollment.enrollmentDate), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </CardContent>
                  </Card>
                ))}
                {student.enrollments.length === 0 && (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <GraduationCap className="h-12 w-12 text-muted-foreground/50 mb-4" />
                      <p className="font-medium">Nenhum curso matriculado</p>
                      <p className="text-sm text-muted-foreground">
                        Este aluno não está matriculado em nenhum curso
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
