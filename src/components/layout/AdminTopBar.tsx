import { Bell, PanelLeftClose, PanelLeftOpen } from "lucide-react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { mockCurrentUser } from "@/lib/mock-data"
import { useLogout } from "@/hooks/use-logout"

interface AdminTopBarProps {
  isSidebarOpen: boolean
  onToggleSidebar: () => void
}

const AdminTopBar = ({ isSidebarOpen, onToggleSidebar }: AdminTopBarProps) => {
  const { logout } = useLogout()

  return (
    <header className="h-16 border-b border-border bg-card px-4 flex items-center justify-between gap-4">
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleSidebar}
        className="shrink-0 text-muted-foreground"
        aria-label={isSidebarOpen ? "Recolher menu lateral" : "Abrir menu lateral"}
      >
        {isSidebarOpen ? (
          <PanelLeftClose className="h-5 w-5" />
        ) : (
          <PanelLeftOpen className="h-5 w-5" />
        )}
      </Button>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <Badge
                variant="destructive"
                size="sm"
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0"
              >
                5
              </Badge>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notificações</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
              <span className="font-medium">Novo ticket urgente</span>
              <span className="text-xs text-muted-foreground">
                Problema com pagamento - Maria Silva
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
              <span className="font-medium">Matrícula pendente</span>
              <span className="text-xs text-muted-foreground">
                15 alunos aguardando aprovação
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
              <span className="font-medium">Curso atualizado</span>
              <span className="text-xs text-muted-foreground">
                Nova trilha adicionada em Administração
              </span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="justify-center text-primary">
              Ver todas as notificações
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarImage src={mockCurrentUser.avatar} alt={mockCurrentUser.name} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {mockCurrentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{mockCurrentUser.name}</p>
                <p className="text-xs text-muted-foreground">
                  {mockCurrentUser.email}
                </p>
                <Badge variant="secondary" size="sm" className="w-fit mt-1">
                  {mockCurrentUser.role}
                </Badge>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/admin/configuracoes" className="cursor-pointer">
                Configurações
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onSelect={(e) => {
                e.preventDefault()
                void logout()
              }}
            >
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

export { AdminTopBar }
