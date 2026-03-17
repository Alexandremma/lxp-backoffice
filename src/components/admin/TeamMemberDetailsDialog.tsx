import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Edit,
  Mail,
  Trash2,
  Shield,
  UserCog,
  FileText,
  GraduationCap,
  HeadphonesIcon,
  DollarSign,
  Megaphone,
  CheckCircle2,
  Clock,
  BookOpen,
} from "lucide-react"
import { type TeamMember, type TeamRole, mockCourses, rolePermissions, mockTeamMemberActions } from "@/lib/mock-data"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface TeamMemberDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  member: TeamMember | null
  onEdit: () => void
  onDelete: () => void
}

const roleConfig: Record<TeamRole, { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info"; icon: React.ElementType }> = {
  admin: { label: "Admin", variant: "destructive", icon: Shield },
  coordinator: { label: "Coordenador", variant: "info", icon: UserCog },
  secretary: { label: "Secretaria", variant: "secondary", icon: FileText },
  professor: { label: "Professor", variant: "default", icon: GraduationCap },
  tutor: { label: "Tutor", variant: "success", icon: HeadphonesIcon },
  financial: { label: "Financeiro", variant: "warning", icon: DollarSign },
  commercial: { label: "Comercial", variant: "outline", icon: Megaphone },
}

const statusConfig = {
  active: { label: "Ativo", variant: "success" as const },
  inactive: { label: "Inativo", variant: "secondary" as const },
  blocked: { label: "Bloqueado", variant: "destructive" as const },
}

export function TeamMemberDetailsDialog({
  open,
  onOpenChange,
  member,
  onEdit,
  onDelete,
}: TeamMemberDetailsDialogProps) {
  if (!member) return null

  const RoleIcon = roleConfig[member.role].icon
  const permissions = rolePermissions[member.role] || []
  const memberActions = mockTeamMemberActions[member.id] || []
  
  // Get linked courses for professors/tutors
  const linkedCourses = member.courses
    ? mockCourses.filter((c) => member.courses?.includes(c.id))
    : []

  const handleSendEmail = () => {
    window.location.href = `mailto:${member.email}`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={member.avatar} alt={member.name} />
              <AvatarFallback className="bg-primary/10 text-primary text-xl">
                {member.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <DialogTitle className="text-xl">{member.name}</DialogTitle>
              <DialogDescription className="text-sm">
                {member.email}
              </DialogDescription>
              <div className="flex items-center gap-2 pt-1">
                <Badge variant={roleConfig[member.role].variant}>
                  <RoleIcon className="h-3 w-3 mr-1" />
                  {roleConfig[member.role].label}
                </Badge>
                <Badge variant={statusConfig[member.status].variant}>
                  {statusConfig[member.status].label}
                </Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Informações Básicas */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Informações</h4>
            <div className="space-y-3">
              {member.department && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Departamento</span>
                  <span className="font-medium">{member.department}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Membro desde</span>
                <span className="font-medium">
                  {format(new Date(member.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Permissões */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Permissões</h4>
            <div className="grid grid-cols-1 gap-2">
              {permissions.map((permission, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span>{permission}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Cursos Vinculados (para professor/tutor) */}
          {(member.role === "professor" || member.role === "tutor" || member.role === "coordinator") && linkedCourses.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-semibold mb-3">Cursos Vinculados</h4>
                <div className="space-y-2">
                  {linkedCourses.map((course) => (
                    <div
                      key={course.id}
                      className="flex items-center gap-2 p-2 rounded-lg bg-muted/50"
                    >
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{course.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Histórico de Ações */}
          {memberActions.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-semibold mb-3">Atividade Recente</h4>
                <div className="space-y-3">
                  {memberActions.slice(0, 5).map((action) => (
                    <div
                      key={action.id}
                      className="flex items-start gap-3 text-sm"
                    >
                      <div className="p-1.5 rounded-full bg-muted">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{action.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(action.timestamp), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" className="flex-1" onClick={handleSendEmail}>
            <Mail className="h-4 w-4 mr-2" />
            Enviar Email
          </Button>
          <Button variant="outline" className="flex-1" onClick={onEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
          <Button variant="destructive" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
