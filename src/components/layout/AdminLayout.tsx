import { useState } from "react"
import { cn } from "@/lib/utils"
import { AdminSidebar } from "./AdminSidebar"
import { AdminTopBar } from "./AdminTopBar"

interface AdminLayoutProps {
  children: React.ReactNode
  className?: string
}

const AdminLayout = ({ children, className }: AdminLayoutProps) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <AdminSidebar
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 lg:hidden transition-transform duration-300",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <AdminSidebar onCollapsedChange={() => setMobileMenuOpen(false)} />
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminTopBar
          showMenuButton
          onMenuClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        />
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
