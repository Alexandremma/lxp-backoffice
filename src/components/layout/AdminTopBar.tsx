import { useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { PanelLeftClose, PanelLeftOpen, User } from "lucide-react"
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
import { TEAM_ROLE_LABELS } from "@/consts/teamRoles"
import { useBackofficeMember } from "@/hooks/queries/useBackofficeMember"
import { useLogout } from "@/hooks/use-logout"
import { ThemeToggle } from "@/components/layout/ThemeToggle"

function initialsFromDisplay(label: string): string {
  const t = label.trim()
  if (!t) return "?"
  const parts = t.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return t.slice(0, 2).toUpperCase()
}

interface AdminTopBarProps {
  isSidebarOpen: boolean
  onToggleSidebar: () => void
}

const AdminTopBar = ({ isSidebarOpen, onToggleSidebar }: AdminTopBarProps) => {
  const navigate = useNavigate()
  const { logout } = useLogout()
  const { data: member } = useBackofficeMember()

  const displayName = useMemo(
    () => member?.name?.trim() || "Membro",
    [member?.name],
  )

  const displayEmail = useMemo(() => member?.email?.trim() || "", [member?.email])

  const roleLabel = useMemo(
    () => (member ? TEAM_ROLE_LABELS[member.role] : ""),
    [member],
  )

  const avatarInitials = useMemo(
    () => initialsFromDisplay(displayName === "Membro" && displayEmail ? displayEmail : displayName),
    [displayName, displayEmail],
  )

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
        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarImage src="/placeholder.svg" alt={displayName} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {avatarInitials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{displayName}</p>
                <p className="text-xs text-muted-foreground">
                  {displayEmail || "—"}
                </p>
                {roleLabel ? (
                  <Badge variant="secondary" size="sm" className="w-fit mt-1">
                    {roleLabel}
                  </Badge>
                ) : null}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault()
                navigate("/admin/perfil")
              }}
            >
              <User className="mr-2 h-4 w-4" />
              Perfil
            </DropdownMenuItem>
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
