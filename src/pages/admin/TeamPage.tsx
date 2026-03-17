import { useState } from "react"
import { AdminLayout } from "@/components/layout/AdminLayout"
import { PageHeader } from "@/components/layout/PageHeader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Mail,
  GraduationCap,
  HeadphonesIcon,
  UserCog,
  Shield,
  FileText,
  DollarSign,
  Megaphone,
} from "lucide-react"
import { mockTeamMembers, type TeamMember, type TeamRole } from "@/lib/mock-data"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { toast } from "sonner"
import { TeamMemberDialog, type TeamMemberFormData } from "@/components/admin/TeamMemberDialog"
import { TeamMemberDetailsDialog } from "@/components/admin/TeamMemberDetailsDialog"
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog"

const statusConfig = {
  active: { label: "Ativo", variant: "success" as const },
  inactive: { label: "Inativo", variant: "secondary" as const },
  blocked: { label: "Bloqueado", variant: "destructive" as const },
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

const TeamPage = () => {
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  
  // CRUD States
  const [members, setMembers] = useState<TeamMember[]>(mockTeamMembers)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)

  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(search.toLowerCase()) ||
      member.email.toLowerCase().includes(search.toLowerCase())
    const matchesRole = roleFilter === "all" || member.role === roleFilter
    const matchesStatus = statusFilter === "all" || member.status === statusFilter
    return matchesSearch && matchesRole && matchesStatus
  })

  const getCountByRole = (role: TeamRole) => members.filter((m) => m.role === role).length

  // Handlers
  const handleAddMember = () => {
    setSelectedMember(null)
    setIsDialogOpen(true)
  }

  const handleEditMember = (member: TeamMember) => {
    setSelectedMember(member)
    setIsDialogOpen(true)
  }

  const handleViewDetails = (member: TeamMember) => {
    setSelectedMember(member)
    setIsDetailsOpen(true)
  }

  const handleDeleteMember = (member: TeamMember) => {
    setSelectedMember(member)
    setIsDeleteOpen(true)
  }

  const handleSaveMember = (data: TeamMemberFormData) => {
    if (selectedMember) {
      // Update existing member
      setMembers(prev => prev.map(m => 
        m.id === selectedMember.id ? { ...m, ...data } : m
      ))
      toast.success("Membro atualizado com sucesso!")
    } else {
      // Add new member
      const newMember: TeamMember = {
        id: `team_${Date.now()}`,
        name: data.name,
        email: data.email,
        role: data.role,
        department: data.department,
        status: data.status,
        createdAt: new Date().toISOString(),
      }
      setMembers(prev => [...prev, newMember])
      toast.success("Membro adicionado com sucesso!")
    }
    setIsDialogOpen(false)
    setSelectedMember(null)
  }

  const handleConfirmDelete = () => {
    if (selectedMember) {
      setMembers(prev => prev.filter(m => m.id !== selectedMember.id))
      toast.success("Membro removido com sucesso!")
      setIsDeleteOpen(false)
      setSelectedMember(null)
    }
  }

  const handleSendEmail = (member: TeamMember) => {
    window.location.href = `mailto:${member.email}`
  }

  return (
    <AdminLayout>
      <PageHeader
        title="Equipe"
        description="Gerencie administradores, professores, tutores e equipe administrativa"
      >
        <Button onClick={handleAddMember}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Membro
        </Button>
      </PageHeader>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-7 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-destructive/10">
                <Shield className="h-4 w-4 text-destructive" />
              </div>
              <div>
                <p className="text-xl font-bold">{getCountByRole("admin")}</p>
                <p className="text-xs text-muted-foreground">Admin</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-info/10">
                <UserCog className="h-4 w-4 text-info" />
              </div>
              <div>
                <p className="text-xl font-bold">{getCountByRole("coordinator")}</p>
                <p className="text-xs text-muted-foreground">Coordenadores</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-secondary/10">
                <FileText className="h-4 w-4 text-secondary-foreground" />
              </div>
              <div>
                <p className="text-xl font-bold">{getCountByRole("secretary")}</p>
                <p className="text-xs text-muted-foreground">Secretaria</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-primary/10">
                <GraduationCap className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xl font-bold">{getCountByRole("professor")}</p>
                <p className="text-xs text-muted-foreground">Professores</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-success/10">
                <HeadphonesIcon className="h-4 w-4 text-success" />
              </div>
              <div>
                <p className="text-xl font-bold">{getCountByRole("tutor")}</p>
                <p className="text-xs text-muted-foreground">Tutores</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-warning/10">
                <DollarSign className="h-4 w-4 text-warning" />
              </div>
              <div>
                <p className="text-xl font-bold">{getCountByRole("financial")}</p>
                <p className="text-xs text-muted-foreground">Financeiro</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-muted">
                <Megaphone className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xl font-bold">{getCountByRole("commercial")}</p>
                <p className="text-xs text-muted-foreground">Comercial</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Função" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as funções</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="coordinator">Coordenador</SelectItem>
                <SelectItem value="secretary">Secretaria</SelectItem>
                <SelectItem value="professor">Professor</SelectItem>
                <SelectItem value="tutor">Tutor</SelectItem>
                <SelectItem value="financial">Financeiro</SelectItem>
                <SelectItem value="commercial">Comercial</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Membro</TableHead>
                <TableHead>Função</TableHead>
                <TableHead>Departamento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Desde</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.map((member) => {
                const RoleIcon = roleConfig[member.role].icon
                return (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={member.avatar} alt={member.name} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {member.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <p className="text-sm text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <RoleIcon className="h-4 w-4 text-muted-foreground" />
                        <Badge variant={roleConfig[member.role].variant}>
                          {roleConfig[member.role].label}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {member.department || (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusConfig[member.status].variant}>
                        {statusConfig[member.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(member.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleViewDetails(member)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditMember(member)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleSendEmail(member)}>
                            <Mail className="h-4 w-4 mr-2" />
                            Enviar email
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => handleDeleteMember(member)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remover
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <TeamMemberDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        member={selectedMember}
        onSave={handleSaveMember}
      />

      <TeamMemberDetailsDialog
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        member={selectedMember}
        onEdit={() => {
          setIsDetailsOpen(false)
          setIsDialogOpen(true)
        }}
        onDelete={() => {
          setIsDetailsOpen(false)
          setIsDeleteOpen(true)
        }}
      />

      <DeleteConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Remover membro"
        description={`Tem certeza que deseja remover ${selectedMember?.name}? Esta ação não pode ser desfeita.`}
        onConfirm={handleConfirmDelete}
      />
    </AdminLayout>
  )
}

export default TeamPage
