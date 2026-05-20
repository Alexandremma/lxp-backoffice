import { useLocation } from "react-router-dom"
import {
  LayoutDashboard,
  Users,
  UserCog,
  BookOpen,
  Gamepad2,
  Award,
  Settings,
  LogOut,
  Database,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { NavLink } from "@/components/NavLink"
import { useModuleVisibility } from "@/hooks/useModuleVisibility"
import { useLogout } from "@/hooks/use-logout"

interface NavItem {
  title: string
  url: string
  icon: React.ElementType
}

const navigationItems: NavItem[] = [
  { title: "Início", url: "/", icon: LayoutDashboard },
  { title: "Alunos", url: "/admin/alunos", icon: Users },
  { title: "Equipe", url: "/admin/equipe", icon: UserCog },
  { title: "Cursos", url: "/admin/cursos", icon: BookOpen },
  { title: "Gamificação", url: "/admin/gamificacao", icon: Gamepad2 },
  { title: "Certificados", url: "/admin/certificados", icon: Award },
  { title: "Modelo de dados", url: "/admin/modelo-dados", icon: Database },
  { title: "Geral", url: "/admin/configuracoes", icon: Settings },
]

interface AdminSidebarProps {
  collapsed?: boolean
  className?: string
}

const AdminSidebar = ({ collapsed = false, className }: AdminSidebarProps) => {
  const location = useLocation()
  const { isModuleVisible } = useModuleVisibility()
  const { logout } = useLogout()

  // Filtrar itens baseado na visibilidade (manter rota atual visível para não travar)
  const visibleItems = navigationItems.filter(
    (item) =>
      isModuleVisible(item.url) ||
      location.pathname === item.url ||
      location.pathname.startsWith(item.url + "/")
  )

  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-16" : "w-64",
        className
      )}
    >
      <div
        className={cn(
          "flex items-center h-16 border-b border-sidebar-border shrink-0",
          collapsed ? "justify-center px-2" : "gap-3 px-4",
        )}
      >
        <div className="h-8 w-8 shrink-0 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
          <span className="text-sm font-bold text-primary-foreground">LX</span>
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <h1 className="font-display font-semibold text-sm text-sidebar-foreground truncate">
              LXP Admin
            </h1>
            <p className="text-xs text-sidebar-foreground/60 truncate">Backoffice</p>
          </div>
        )}
      </div>

      {/* Navigation — p-3 igual ao portal do aluno (folga abaixo do header) */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
        <div className="space-y-1">
          {visibleItems.map((item) => (
            <NavLink
              key={item.url}
              to={item.url}
              end={item.url === "/"}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
                collapsed && "justify-center px-2"
              )}
              activeClassName="bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground"
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span>{item.title}</span>}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Bottom Section */}
      <div className="p-3 space-y-1 border-t border-sidebar-border">
        <button
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all w-full",
            "text-sidebar-foreground/70 hover:text-destructive hover:bg-destructive/10",
            collapsed && "justify-center px-2"
          )}
          onClick={() => {
            void logout()
          }}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  )
}

export { AdminSidebar }
