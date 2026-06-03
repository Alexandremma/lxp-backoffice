import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import {
  DEFAULT_DEPARTMENT_BY_ROLE,
  TEAM_DEPARTMENTS,
  TEAM_DEPARTMENT_LABELS,
  TEAM_ROLE_LABELS,
  TEAM_ROLES,
  type TeamRole,
  canAssignTeamRole,
} from "@/consts/teamRoles"
import { usePermission } from "@/hooks/usePermission"

export type TeamMemberDialogMember = {
  id: string
  name: string
  email: string
  role: TeamRole
  department?: string | null
  createdAt?: string
  avatar?: string
}

const teamMemberSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  role: z.enum(TEAM_ROLES),
  department: z.enum(TEAM_DEPARTMENTS),
})

export type TeamMemberFormData = z.infer<typeof teamMemberSchema>

interface TeamMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  member?: TeamMemberDialogMember | null
  onSave: (data: TeamMemberFormData) => Promise<void>
  isSubmitting?: boolean
}

export function TeamMemberDialog({
  open,
  onOpenChange,
  member,
  onSave,
  isSubmitting = false,
}: TeamMemberDialogProps) {
  const { role: actorRole } = usePermission()
  const isEditing = !!member

  const assignableRoles = TEAM_ROLES.filter((r) =>
    actorRole ? canAssignTeamRole(actorRole, r) : false,
  )

  const form = useForm<TeamMemberFormData>({
    resolver: zodResolver(teamMemberSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "professor",
      department: DEFAULT_DEPARTMENT_BY_ROLE.professor,
    },
  })

  const watchedRole = form.watch("role")

  useEffect(() => {
    if (!watchedRole) return
    const currentDept = form.getValues("department")
    const suggested = DEFAULT_DEPARTMENT_BY_ROLE[watchedRole]
    if (!currentDept || currentDept !== suggested) {
      form.setValue("department", suggested)
    }
  }, [watchedRole, form])

  useEffect(() => {
    if (member) {
      const role = TEAM_ROLES.includes(member.role) ? member.role : "professor"
      const deptRaw = member.department?.trim()
      const department =
        deptRaw && (TEAM_DEPARTMENTS as readonly string[]).includes(deptRaw)
          ? (deptRaw as TeamMemberFormData["department"])
          : DEFAULT_DEPARTMENT_BY_ROLE[role]
      form.reset({
        name: member.name,
        email: member.email,
        role,
        department,
      })
    } else {
      form.reset({
        name: "",
        email: "",
        role: "professor",
        department: DEFAULT_DEPARTMENT_BY_ROLE.professor,
      })
    }
  }, [member, form])

  const handleSubmit = async (data: TeamMemberFormData) => {
    if (actorRole && !canAssignTeamRole(actorRole, data.role)) {
      form.setError("role", { message: "Somente administradores podem atribuir a função Administrador." })
      return
    }
    await onSave(data)
    form.reset()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Membro" : "Novo Membro"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Atualize as informações do membro da equipe."
              : "Preencha as informações para adicionar um novo membro à equipe."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Nome completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do membro" {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="email@exemplo.com"
                        {...field}
                        disabled={isEditing || isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Função</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a função" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(assignableRoles.length > 0 ? assignableRoles : TEAM_ROLES).map((value) => (
                          <SelectItem key={value} value={value}>
                            {TEAM_ROLE_LABELS[value]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Departamento</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Departamento" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TEAM_DEPARTMENTS.map((value) => (
                          <SelectItem key={value} value={value}>
                            {TEAM_DEPARTMENT_LABELS[value]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? isEditing
                    ? "Salvando..."
                    : "Adicionando..."
                  : isEditing
                    ? "Salvar alterações"
                    : "Adicionar membro"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
