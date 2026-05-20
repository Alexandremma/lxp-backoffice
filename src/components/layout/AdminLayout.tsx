import { useState } from "react"
import { cn } from "@/lib/utils"
import { AdminSidebar } from "./AdminSidebar"
import { AdminTopBar } from "./AdminTopBar"
import { useIsLargeScreen } from "@/hooks/use-large-screen"

interface AdminLayoutProps {
  children: React.ReactNode
  className?: string
}

const AdminLayout = ({ children, className }: AdminLayoutProps) => {
  const isLargeScreen = useIsLargeScreen()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isSidebarOpen = isLargeScreen ? !sidebarCollapsed : mobileMenuOpen

  const toggleSidebar = () => {
    if (isLargeScreen) {
      setSidebarCollapsed((c) => !c)
    } else {
      setMobileMenuOpen((o) => !o)
    }
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Desktop: mesma estrutura do lxp-alunos — largura anima no próprio aside */}
      <div className="hidden lg:block sticky top-0 h-screen shrink-0">
        <AdminSidebar collapsed={sidebarCollapsed} />
      </div>

      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden
        />
      )}

      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 lg:hidden transition-transform duration-300",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full pointer-events-none",
        )}
      >
        <AdminSidebar collapsed={false} />
      </div>

      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <AdminTopBar isSidebarOpen={isSidebarOpen} onToggleSidebar={toggleSidebar} />
        <main
          className={cn(
            "flex-1 overflow-y-auto scrollbar-thin p-6",
            className
          )}
        >
          {children}
        </main>
      </div>
    </div>
  )
}

export { AdminLayout }
