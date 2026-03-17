import { useLocation } from "react-router-dom"
import {
  LayoutDashboard,
  Users,
  UserCog,
  BookOpen,
  CreditCard,
  TicketCheck,
  Gamepad2,
  Bot,
  Award,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Palette,
  Package,
  LayoutGrid,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { NavLink } from "@/components/NavLink"
import { useModuleVisibility } from "@/hooks/useModuleVisibility"

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
  { title: "Produtos", url: "/admin/produtos", icon: Package },
  { title: "Financeiro", url: "/admin/financeiro", icon: CreditCard },
  { title: "Tickets", url: "/admin/tickets", icon: TicketCheck },
  { title: "Gamificação", url: "/admin/gamificacao", icon: Gamepad2 },
  { title: "AI Tutor", url: "/admin/ai-tutor", icon: Bot },
  { title: "Certificados", url: "/admin/certificados", icon: Award },
  { title: "Geral", url: "/admin/configuracoes", icon: Settings },
  { title: "Design System", url: "/kitchen-sink", icon: Palette },
  { title: "Módulos", url: "/dev/modules", icon: LayoutGrid },
]

interface AdminSidebarProps {
  collapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
  className?: string
}

const AdminSidebar = ({
  collapsed = false,
  onCollapsedChange,
  className,
}: AdminSidebarProps) => {
  const location = useLocation()
  const { isModuleVisible } = useModuleVisibility()

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
      {/* Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <span className="text-sm font-bold text-primary-foreground">LX</span>
            </div>
            <div>
              <h1 className="font-display font-semibold text-sm text-sidebar-foreground">
                LXP Admin
              </h1>
              <p className="text-xs text-sidebar-foreground/60">Backoffice</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto">
            <span className="text-sm font-bold text-primary-foreground">LX</span>
          </div>
        )}
      </div>

      {/* Toggle Button */}
      <div className="flex justify-end px-2 py-2">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onCollapsedChange?.(!collapsed)}
          className="text-sidebar-foreground hover:bg-sidebar-accent"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 overflow-y-auto scrollbar-thin pb-4">
        <div className="space-y-1">
          {visibleItems.map((item) => (
            <NavLink
              key={item.url}
              to={item.url}
              end={item.url === "/"}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all",
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
      <div className="p-3 border-t border-sidebar-border">
        <button
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all w-full",
            "text-sidebar-foreground/70 hover:text-destructive hover:bg-destructive/10",
            collapsed && "justify-center px-2"
          )}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  )
}

export { AdminSidebar }
