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

export type TeamRole =
  | "admin"
  | "coordinator"
  | "secretary"
  | "professor"
  | "tutor"
  | "financial"
  | "commercial"

export type TeamMemberDialogMember = {
  id: string
  name: string
  email: string
  role: TeamRole
  status: "active" | "inactive"
  department?: string
  createdAt?: string
  avatar?: string
}

const teamMemberSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  role: z.enum(["admin", "coordinator", "secretary", "professor", "tutor", "financial", "commercial"] as const),
  department: z.string().optional(),
  status: z.enum(["active", "inactive"] as const),
})

export type TeamMemberFormData = z.infer<typeof teamMemberSchema>

interface TeamMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  member?: TeamMemberDialogMember | null
  onSave: (data: TeamMemberFormData) => void
}

const roleOptions: { value: TeamRole; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "coordinator", label: "Coordenador" },
  { value: "secretary", label: "Secretaria" },
  { value: "professor", label: "Professor" },
  { value: "tutor", label: "Tutor" },
  { value: "financial", label: "Financeiro" },
  { value: "commercial", label: "Comercial" },
]

export function TeamMemberDialog({
  open,
  onOpenChange,
  member,
  onSave,
}: TeamMemberDialogProps) {
  const isEditing = !!member

  const form = useForm<TeamMemberFormData>({
    resolver: zodResolver(teamMemberSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "professor",
      department: "",
      status: "active",
    },
  })

  useEffect(() => {
    if (member) {
      form.reset({
        name: member.name,
        email: member.email,
        role: member.role,
        department: member.department || "",
        status: member.status as "active" | "inactive",
      })
    } else {
      form.reset({
        name: "",
        email: "",
        role: "professor",
        department: "",
        status: "active",
      })
    }
  }, [member, form])

  const handleSubmit = (data: TeamMemberFormData) => {
    onSave(data)
    form.reset()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Membro" : "Novo Membro"}
          </DialogTitle>
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
                      <Input placeholder="Nome do membro" {...field} />
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
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a função" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roleOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
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
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Ativo</SelectItem>
                        <SelectItem value="inactive">Inativo</SelectItem>
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
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Departamento (opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Tecnologia, Acadêmico..." {...field} />
                    </FormControl>
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
              >
                Cancelar
              </Button>
              <Button type="submit">
                {isEditing ? "Salvar alterações" : "Adicionar membro"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
